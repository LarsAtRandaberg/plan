(() => {
  const DEFAULT_PLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a";
  const URL_PLAN    = "data/plan.json";
  const URL_MAAL    = "data/maal.json";
  const URL_INNHOLD = "data/innhold.json";

  const topbar         = document.querySelector(".topbar");
  const topnav         = document.getElementById("topnav");
  const sidebar        = document.getElementById("sidebar");
  const menuBtn        = document.getElementById("menuBtn");
  const menuEl         = document.getElementById("menu");
  const contentEl      = document.getElementById("innhold");
  const titleEl        = document.getElementById("tittel");
  const heroTittelEl   = document.getElementById("hero-tittel");
  const heroMaalCountEl = document.getElementById("hero-maal-count");
  const searchInput    = document.getElementById("search-input");
  const searchResults  = document.getElementById("search-results");

  if (!menuEl || !contentEl || !titleEl) return;

  let searchModeActive = false;

  function closeSearch() {
    const sw = document.getElementById("search-wrapper");
    if (sw) { sw.classList.remove("mobile-open"); sw.style.maxWidth = ""; sw.style.right = ""; sw.style.width = ""; }
    if (searchInput)  { searchInput.value = ""; }
    if (searchResults){ searchResults.classList.remove("open"); searchResults.innerHTML = ""; }
    const menuIcon = menuBtn ? menuBtn.querySelector("i") : null;
    if (menuIcon) menuIcon.className = "ti ti-menu-2";
    searchModeActive = false;
    const sb = document.getElementById("searchBtn");
    if (sb) { sb.style.background = ""; sb.style.borderColor = ""; sb.style.pointerEvents = ""; }
    const brandName = document.querySelector(".brand-name");
    if (brandName) brandName.style.display = "";
  }

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", function() {
      if (searchModeActive) {
        closeSearch();
      } else {
        sidebar.classList.toggle("open");
        const sb = document.getElementById("searchBtn");
        if (sb) sb.style.pointerEvents = sidebar.classList.contains("open") ? "none" : "";
      }
    });
  }

  const params     = new URLSearchParams(location.search);
  const explicitId = params.get("id");
  let currentPlanId = explicitId || DEFAULT_PLAN_ID;

  if (!explicitId) {
    history.replaceState(null, "", "?id=" + encodeURIComponent(DEFAULT_PLAN_ID) + location.hash);
  }

  (() => {
    if (!topbar) return;
    let lastY = window.scrollY, ticking = false;
    function onScroll() {
      const y = window.scrollY, delta = y - lastY;
      if (!document.querySelector(".dropdown.open") && delta > 6 && y > 80) topbar.classList.add("is-hidden");
      else if (delta < -6) topbar.classList.remove("is-hidden");
      lastY = y; ticking = false;
    }
    window.addEventListener("scroll", function() {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  })();

  function safeId(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function clearUI() { menuEl.innerHTML = ""; contentEl.innerHTML = ""; }

  function ensureSection(goal) {
    const anchorId = "maal-" + safeId(goal.maalID);
    if (document.getElementById(anchorId)) return anchorId;
    const section = document.createElement("section");
    section.id = anchorId;
    const heading = document.createElement("h2");
    heading.textContent = goal.maalNavn || "(uten navn)";
    section.appendChild(heading);
    contentEl.appendChild(section);
    return anchorId;
  }

  function setActiveLink(activeSectionId) {
    document.querySelectorAll("#menu a").forEach(function(a) {
      const isActive = a.getAttribute("href") === "#" + activeSectionId;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    const activeLink = document.querySelector("#menu a[href='#" + activeSectionId + "']");
    if (!activeLink) return;
    const path = [];
    let node = activeLink.closest(".node");
    while (node) { path.push(node); const parent = node.parentElement; node = parent ? parent.closest(".node") : null; }
    const pathSet = new Set(path);
    document.querySelectorAll("#menu .node.open").forEach(function(n) {
      if (n.classList.contains("level-0")) return;
      if (!pathSet.has(n)) n.classList.remove("open");
    });
    path.forEach(function(n) { n.classList.add("open"); });
    try { activeLink.scrollIntoView({ block: "nearest" }); } catch(e) {}
  }

  function setupScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (!sections.length) return;
    const observer = new IntersectionObserver(function(entries) {
      const visible = entries.filter(function(e) { return e.isIntersecting; })
        .sort(function(a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (visible.length) setActiveLink(visible[0].target.id);
    }, { rootMargin: "0px 0px -70% 0px", threshold: 0.01 });
    sections.forEach(function(s) { observer.observe(s); });
    setActiveLink(sections[0].id);
  }

  function updateKommuneplanButtonState() {
    const btn = document.getElementById("btnKommuneplan");
    if (!btn) return;
    const isDefault = currentPlanId === DEFAULT_PLAN_ID;
    btn.classList.toggle("is-selected", isDefault);
    btn.classList.toggle("is-disabled", isDefault);
    if (isDefault) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }

  function planTypeLabel(planTyper) {
    const labels = { 701100000: "Kommuneplanen", 701100001: "Strategier", 701100002: "Handlings- og økonomiplaner" };
    return labels[planTyper] || "Plantype " + planTyper;
  }

  let dropdownClickListenerAttached = false;
  function attachDropdownListener() {
    if (dropdownClickListenerAttached) return;
    document.addEventListener("click", function(e) {
      document.querySelectorAll(".dropdown.open").forEach(function(dd) { if (!dd.contains(e.target)) dd.classList.remove("open"); });
    });
    dropdownClickListenerAttached = true;
  }

  function buildTopMenu(plans) {
    if (!topnav) return;
    topnav.innerHTML = "";
    const menuTopnav = document.getElementById("menu-topnav");
    if (menuTopnav) menuTopnav.innerHTML = "";
    const groups = new Map();
    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    plans.forEach(function(p) { if (!groups.has(p.planTyper)) groups.set(p.planTyper, []); groups.get(p.planTyper).push(p); });
    const typeKeys = Array.from(groups.keys()).sort(function(a, b) { return a - b; });
    typeKeys.forEach(function(k) { groups.get(k).sort(function(a, b) { return collator.compare(a.planNavn || "", b.planNavn || ""); }); });
    typeKeys.forEach(function(typeKey) {
      const dd = document.createElement("div"); dd.className = "dropdown";
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "dropbtn";
      btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
      btn.textContent = planTypeLabel(typeKey);
      if (typeKey === 701100000) btn.id = "btnKommuneplan";
      const menu = document.createElement("div"); menu.className = "dropdown-menu";
      groups.get(typeKey).forEach(function(p) {
        const a = document.createElement("a"); a.href = "?id=" + encodeURIComponent(p.planID); a.textContent = p.planNavn || "(uten navn)";
        a.addEventListener("click", function(e) { e.preventDefault(); navigateToPlan(p.planID); dd.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); });
        menu.appendChild(a);
      });
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        document.querySelectorAll(".dropdown.open").forEach(function(x) { if (x !== dd) x.classList.remove("open"); });
        dd.classList.toggle("open"); btn.setAttribute("aria-expanded", dd.classList.contains("open") ? "true" : "false");
        if (topbar) topbar.classList.remove("is-hidden");
      });
      dd.appendChild(btn); dd.appendChild(menu); topnav.appendChild(dd);
      if (menuTopnav) {
        const ddClone = dd.cloneNode(true);
        ddClone.querySelector("button").addEventListener("click", function(e) {
          e.stopPropagation();
          document.querySelectorAll("#menu-topnav .dropdown.open").forEach(function(x) { if (x !== ddClone) x.classList.remove("open"); });
          ddClone.classList.toggle("open");
        });
        ddClone.querySelectorAll("a").forEach(function(a) {
          a.addEventListener("click", function(e) {
            e.preventDefault();
            const planId = new URL(a.href).searchParams.get("id");
            if (planId) navigateToPlan(planId);
            if (sidebar) sidebar.classList.remove("open");
          });
        });
        menuTopnav.appendChild(ddClone);
      }
    });
    updateKommuneplanButtonState();
  }

  function buildTree(goalsForPlan) {
    const byId = new Map(goalsForPlan.map(function(g) { return [g.maalID, g]; }));
    const children = new Map();
    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    goalsForPlan.forEach(function(g) {
      const pid = g.maalOverordnet; const key = (pid && byId.has(pid)) ? pid : null;
      if (!children.has(key)) children.set(key, []); children.get(key).push(g);
    });
    children.forEach(function(arr) { arr.sort(function(a, b) { return collator.compare(a.maalNavn || "", b.maalNavn || ""); }); });
    function renderNode(goal, level) {
      const anchorId = ensureSection(goal);
      const node = document.createElement("div"); node.className = "node level-" + Math.min(level, 3);
      if (level === 0) node.classList.add("open");
      const row = document.createElement("div"); row.className = "row level-" + Math.min(level, 3);
      const kids = children.get(goal.maalID) || []; const hasKids = level !== 0 && kids.length > 0;
      const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = hasKids ? "toggle" : "toggle placeholder";
      toggle.addEventListener("click", function() {
        if (!hasKids) return;
        const willOpen = !node.classList.contains("open");
        if (willOpen && node.parentElement) {
          Array.from(node.parentElement.children).forEach(function(el) { if (el !== node && el.classList && el.classList.contains("node")) el.classList.remove("open"); });
        }
        node.classList.toggle("open");
      });
      const a = document.createElement("a"); a.href = "#" + anchorId;
      if (goal.maalIkon) { const icon = document.createElement("i"); icon.className = "ti " + goal.maalIkon; icon.setAttribute("aria-hidden", "true"); icon.style.cssText = "margin-right:5px;font-size:13px"; a.appendChild(icon); }
      a.appendChild(document.createTextNode(goal.maalNavn || "(uten navn)"));
      a.addEventListener("click", function() { if (window.matchMedia("(max-width: 768px)").matches && sidebar) sidebar.classList.remove("open"); });
      row.appendChild(toggle); row.appendChild(a); node.appendChild(row);
      const childWrap = document.createElement("div"); childWrap.className = "children";
      kids.forEach(function(k) { childWrap.appendChild(renderNode(k, level + 1)); });
      node.appendChild(childWrap); return node;
    }
    (children.get(null) || []).forEach(function(g) { menuEl.appendChild(renderNode(g, 0)); });
  }

  // =========================
  // JSON-renderer (Chart.js + nøkkeltall)
  // =========================
  function renderJSON(cfg, blokk) {
    const G = { c900:"#173404", c800:"#27500a", c600:"#3b6d11", c200:"#c0dd97", c100:"#eaf3de" };

    if (cfg.type === "diagram") {
      const wrap = document.createElement("div"); wrap.style.cssText = "position:relative;margin-top:8px";
      const canvas = document.createElement("canvas"); wrap.appendChild(canvas); blokk.appendChild(wrap);
      const farger = [G.c600, G.c200, G.c800, G.c900];
      const isLinje = cfg.diagramtype === "linje"; const isDoughnut = cfg.diagramtype === "doughnut";
      const datasets = cfg.datasett.map(function(ds, i) {
        return {
          label: ds.etikett, data: ds.verdier,
          backgroundColor: isLinje ? G.c100 : isDoughnut ? [G.c200, G.c600, G.c800, G.c900] : farger[i % farger.length],
          borderColor: isLinje ? G.c600 : farger[i % farger.length],
          borderRadius: (!isLinje && !isDoughnut) ? 6 : 0,
          borderWidth: isLinje ? 2 : 0,
          fill: isLinje, tension: isLinje ? 0.3 : 0,
          pointBackgroundColor: G.c800, pointRadius: isLinje ? 4 : 0
        };
      });
      new Chart(canvas, {
        type: cfg.diagramtype === "soyle" ? "bar" : cfg.diagramtype,
        data: { labels: cfg.labels, datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: true, aspectRatio: 2.2,
          plugins: {
            legend: { display: isDoughnut, position: "right", labels: { color: G.c800, padding: 16, font: { size: 12 } } }
          },
          scales: isDoughnut ? {} : {
            y: { grid: { color: G.c100 }, ticks: { color: G.c600 } },
            x: { grid: { display: false }, ticks: { color: G.c600 } }
          },
          cutout: isDoughnut ? "65%" : undefined
        }
      });
    }

    if (cfg.type === "nokkeltall") {
      const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:8px";
      cfg.tall.forEach(function(t) {
        const kort = document.createElement("div");
        kort.style.cssText = "background:#27500a;border-radius:10px;padding:16px;color:#fff";
        const trendFarge = t.trend === "opp" ? "#c0dd97" : t.trend === "ned" ? "#f4c89a" : "rgba(255,255,255,0.6)";
        const trendPil   = t.trend === "opp" ? "↑" : t.trend === "ned" ? "↓" : "→";
        const trendBg    = t.trend === "opp" ? "rgba(192,221,151,0.2)" : t.trend === "ned" ? "rgba(224,112,48,0.2)" : "rgba(255,255,255,0.1)";
        const trendTekst = t.trend === "opp" ? "Over mål" : t.trend === "ned" ? "Under mål" : "Stabilt";
        kort.innerHTML =
          "<div style='font-size:13px;font-weight:600;line-height:1.3;margin-bottom:2px'>" + t.etikett + "</div>" +
          "<div style='font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:8px'>" + (t.undertittel || "") + "</div>" +
          "<div style='display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;padding:2px 6px;border-radius:20px;margin-bottom:8px;background:" + trendBg + ";color:" + trendFarge + "'>" + trendPil + " " + trendTekst + "</div>" +
          "<div style='font-size:30px;font-weight:700;line-height:1;color:#c0dd97;margin-bottom:8px'>" + t.verdi + "<span style='font-size:16px'>" + (t.enhet || "") + "</span></div>" +
          "<div style='font-size:11px;color:rgba(255,255,255,0.55);border-top:0.5px solid rgba(255,255,255,0.2);padding-top:8px'>" + (t.maalverdi || "") + "</div>";
        grid.appendChild(kort);
      });
      blokk.appendChild(grid);
    }
  }

  // =========================
  // Innholdsblokker per mål
  // =========================
  function renderInnhold(innhold, planId) {
    const BADGE_CLASS = { "Tekst":"badge-tekst","PBI-rapport":"badge-pbi","Bilde":"badge-bilde","Vedlegg":"badge-vedlegg","JSON":"badge-tekst","Kombinert":"badge-tekst" };
    const BADGE_ICON  = { "Tekst":"ti-align-left","PBI-rapport":"ti-chart-bar","Bilde":"ti-photo","Vedlegg":"ti-file-description","JSON":"ti-code","Kombinert":"ti-layout-grid" };
    const FOOTER_PX   = 30;

    innhold
      .filter(function(r) { return r.innholdPlan === planId; })
      .sort(function(a, b) { return a.visningsrekkefølge - b.visningsrekkefølge; })
      .forEach(function(rad) {
        const anchorId = "maal-" + safeId(rad.innholdMaal);
        const section  = document.getElementById(anchorId);
        if (!section) return;

        const blokk = document.createElement("div"); blokk.className = "innhold-blokk";

        const type  = rad.innholdstype || "Tekst";
        const badge = document.createElement("div"); badge.className = "card-type-badge " + (BADGE_CLASS[type] || "badge-tekst");
        const badgeI = document.createElement("i"); badgeI.className = "ti " + (BADGE_ICON[type] || "ti-file"); badgeI.setAttribute("aria-hidden", "true"); badgeI.style.fontSize = "11px";
        badge.appendChild(badgeI); badge.appendChild(document.createTextNode(" " + type)); blokk.appendChild(badge);

        if (rad.overskrift) { const h3 = document.createElement("h3"); h3.textContent = rad.overskrift; blokk.appendChild(h3); }
        if (rad.brodtekst)  { const p  = document.createElement("p");  p.textContent  = rad.brodtekst;  blokk.appendChild(p); }

        const mediaUrl = rad.mediaUrl || rad.bildeUrl;
        if (mediaUrl && type === "Bilde") {
          const img = document.createElement("img"); img.src = mediaUrl; img.alt = rad.bildeAltTekst || ""; img.className = "innhold-bilde";
          if (rad.innholdBredde) img.style.maxWidth = rad.innholdBredde + "px";
          blokk.appendChild(img);
        }

        const pbiUrl = rad.pbiUrl || (type === "PBI-rapport" ? mediaUrl : null);
        if (pbiUrl) {
          const origW = rad.innholdBredde || 600; const iframeH = rad.innholdHøyde || 400;
          const pbiHeader = document.createElement("div"); pbiHeader.className = "innhold-pbi-header";
          const pbiIcon = document.createElement("i"); pbiIcon.className = "ti ti-chart-bar"; pbiIcon.setAttribute("aria-hidden", "true");
          const pbiSpan = document.createElement("span"); pbiSpan.appendChild(pbiIcon); pbiSpan.appendChild(document.createTextNode(" " + (rad.overskrift || "Power BI-rapport")));
          const pbiLink = document.createElement("a"); pbiLink.href = pbiUrl; pbiLink.target = "_blank"; pbiLink.rel = "noopener"; pbiLink.setAttribute("aria-label", "Åpne i nytt vindu"); pbiLink.style.color = "var(--green-600)";
          const extIcon = document.createElement("i"); extIcon.className = "ti ti-external-link"; pbiLink.appendChild(extIcon);
          pbiHeader.appendChild(pbiSpan); pbiHeader.appendChild(pbiLink); blokk.appendChild(pbiHeader);
          const wrapper = document.createElement("div");
          wrapper.style.cssText = "overflow:hidden;border-radius:0 0 8px 8px;width:" + (origW+20) + "px;max-width:99%;margin:0 auto;border:none;height:" + (iframeH-FOOTER_PX) + "px";
          const iframe = document.createElement("iframe"); iframe.src = pbiUrl;
          iframe.setAttribute("width", String(origW+20)); iframe.setAttribute("height", String(iframeH+FOOTER_PX));
          iframe.setAttribute("scrolling", "no"); iframe.setAttribute("frameborder", "0");
          iframe.allowFullscreen = true; iframe.style.cssText = "border:none;display:block";
          wrapper.appendChild(iframe); blokk.appendChild(wrapper);
        }

        if (rad.json) {
          try { renderJSON(JSON.parse(rad.json), blokk); } catch(e) { console.error("JSON-renderer feil:", e); }
        }

        if (rad.vedleggUrl) {
          const a = document.createElement("a"); a.href = rad.vedleggUrl; a.className = "innhold-vedlegg"; a.target = "_blank"; a.rel = "noopener";
          const vIcon = document.createElement("div"); vIcon.className = "innhold-vedlegg-icon";
          const vI = document.createElement("i"); vI.className = "ti ti-file-type-pdf"; vI.setAttribute("aria-hidden", "true"); vIcon.appendChild(vI);
          const vInfo = document.createElement("div"); vInfo.className = "innhold-vedlegg-info";
          const vName = document.createElement("div"); vName.className = "innhold-vedlegg-name"; vName.textContent = rad.vedleggEtikett || "Last ned vedlegg"; vInfo.appendChild(vName);
          const vArrow = document.createElement("div"); vArrow.className = "vedlegg-arrow";
          const vArrowI = document.createElement("i"); vArrowI.className = "ti ti-download"; vArrowI.setAttribute("aria-hidden", "true"); vArrow.appendChild(vArrowI);
          a.appendChild(vIcon); a.appendChild(vInfo); a.appendChild(vArrow); blokk.appendChild(a);
        }

        section.appendChild(blokk);
      });
  }

  // =========================
  // Søk
  // =========================
  let searchData = { plans: [], goals: [], innhold: [] };
  function buildSearchIndex(plans, goals, innhold) { searchData = { plans, goals, innhold }; }

  function runSearch(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    if (q.length < 2) { searchResults.classList.remove("open"); searchResults.innerHTML = ""; return; }
    const planMap     = new Map(searchData.plans.map(function(p) { return [p.planID, p.planNavn]; }));
    const goalHits    = searchData.goals.filter(function(g) { return (g.maalNavn || "").toLowerCase().includes(q); });
    const innholdHits = searchData.innhold.filter(function(r) { return (r.overskrift || "").toLowerCase().includes(q) || (r.brodtekst || "").toLowerCase().includes(q); });
    if (!goalHits.length && !innholdHits.length) {
      searchResults.innerHTML = "<div class=\"search-empty\">Ingen treff for «" + query.trim() + "»</div>"; searchResults.classList.add("open"); return;
    }
    const groups = new Map();
    function getGroup(planId) { if (!groups.has(planId)) groups.set(planId, { planNavn: planMap.get(planId) || "Ukjent plan", goals: [], innhold: [] }); return groups.get(planId); }
    goalHits.forEach(function(g) { getGroup(g.maalPlan).goals.push(g); });
    innholdHits.forEach(function(r) { getGroup(r.innholdPlan).innhold.push(r); });
    searchResults.innerHTML = "";
    groups.forEach(function(group, planId) {
      const label = document.createElement("div"); label.className = "search-group-label"; label.textContent = group.planNavn; searchResults.appendChild(label);
      function makeItem(iconClass, title, sub, anchorId) {
        const item = document.createElement("div"); item.className = "search-result-item";
        item.innerHTML = "<i class=\"ti " + iconClass + " search-result-icon\" aria-hidden=\"true\"></i><div><div class=\"search-result-title\">" + title + "</div><div class=\"search-result-sub\">" + sub + "</div></div>";
        item.addEventListener("click", function() {
          searchResults.classList.remove("open"); if (searchInput) searchInput.value = "";
          if (planId !== currentPlanId) {
            history.pushState(null, "", "?id=" + encodeURIComponent(planId) + "#" + anchorId); currentPlanId = planId;
            init().then(function() { const el = document.getElementById(anchorId); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
          } else { const el = document.getElementById(anchorId); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
        });
        return item;
      }
      group.goals.forEach(function(g) { searchResults.appendChild(makeItem("ti-target", g.maalNavn || "", "Mål", "maal-" + safeId(g.maalID))); });
      group.innhold.forEach(function(r) { searchResults.appendChild(makeItem("ti-file-text", r.overskrift || "", group.planNavn, "maal-" + safeId(r.innholdMaal))); });
    });
    searchResults.classList.add("open");
  }

  let searchListenersAttached = false, mobileSearchListenersAttached = false;

  function attachSearchListeners() {
    if (searchListenersAttached || !searchInput) return; searchListenersAttached = true;
    searchInput.addEventListener("input", function() { runSearch(searchInput.value); });
    searchInput.addEventListener("keydown", function(e) { if (e.key === "Escape") { searchResults.classList.remove("open"); searchInput.value = ""; } });
    document.addEventListener("click", function(e) { if (searchInput && !searchInput.contains(e.target) && searchResults && !searchResults.contains(e.target)) searchResults.classList.remove("open"); });
  }

  function attachMobileSearchListeners() {
    if (mobileSearchListenersAttached) return;
    const searchBtn = document.getElementById("searchBtn"); const searchWrapper = document.getElementById("search-wrapper");
    if (!searchBtn || !searchWrapper) return; mobileSearchListenersAttached = true;
    searchBtn.addEventListener("click", function() {
      const btnRect = searchBtn.getBoundingClientRect(); const rightOffset = window.innerWidth - btnRect.right;
      searchWrapper.style.right = rightOffset + "px"; searchWrapper.style.width = "300px";
      searchWrapper.classList.add("mobile-open"); searchBtn.style.background = "transparent"; searchBtn.style.borderColor = "transparent";
      const brandName = document.querySelector(".brand-name"); if (brandName) brandName.style.display = "none";
      const menuIcon = menuBtn ? menuBtn.querySelector("i") : null; if (menuIcon) menuIcon.className = "ti ti-x";
      searchModeActive = true; if (searchInput) searchInput.focus();
    });
    if (searchInput) { searchInput.addEventListener("keydown", function(e) { if (e.key === "Escape") closeSearch(); }); }
  }

  function navigateToPlan(planId) {
    currentPlanId = planId; updateKommuneplanButtonState();
    history.pushState(null, "", "?id=" + encodeURIComponent(planId) + (location.hash || "")); init();
  }

  async function init() {
    try {
      const [plans, goals, innhold] = await Promise.all([
        fetch(URL_PLAN,    { cache: "no-store" }).then(function(r) { return r.json(); }),
        fetch(URL_MAAL,    { cache: "no-store" }).then(function(r) { return r.json(); }),
        fetch(URL_INNHOLD, { cache: "no-store" }).then(function(r) { return r.json(); })
      ]);
      buildTopMenu(plans); buildSearchIndex(plans, goals, innhold);
      attachDropdownListener(); attachSearchListeners(); attachMobileSearchListeners();
      clearUI();
      const plan = plans.find(function(p) { return p.planID === currentPlanId; });
      titleEl.textContent = plan ? plan.planNavn : "Plan ikke funnet";
      const goalsForPlan = goals.filter(function(m) { return m.maalPlan === currentPlanId; });
      if (!goalsForPlan.length) { contentEl.innerHTML = "<p>Ingen mål funnet for denne planen.</p>"; return; }
      const rootGoal = goalsForPlan.find(function(g) { return !g.maalOverordnet; });
      if (heroTittelEl)    heroTittelEl.textContent    = rootGoal ? rootGoal.maalNavn : "";
      if (heroMaalCountEl) heroMaalCountEl.textContent = goalsForPlan.length;
      buildTree(goalsForPlan); renderInnhold(innhold, currentPlanId); setupScrollSpy();
      if (location.hash) { const el = document.getElementById(location.hash.substring(1)); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
      return true;
    } catch(e) { titleEl.textContent = "Feil"; contentEl.innerHTML = "<p>Det oppstod en feil ved lasting av data.</p>"; console.error(e); }
  }

  window.addEventListener("popstate", function() {
    const p = new URLSearchParams(location.search);
    currentPlanId = p.get("id") || DEFAULT_PLAN_ID; updateKommuneplanButtonState(); init();
  });

  init();
})();
