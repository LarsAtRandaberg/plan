(() => {
  // =========================
  // Konfig
  // =========================
  const DEFAULT_PLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a";
  const URL_PLAN    = "data/plan.json";
  const URL_MAAL    = "data/maal.json";
  const URL_INNHOLD = "data/innhold.json";

  // =========================
  // DOM
  // =========================
  const topbar  = document.querySelector(".topbar");
  const topnav  = document.getElementById("topnav");
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const menuEl  = document.getElementById("menu");
  const contentEl      = document.getElementById("innhold");
  const titleEl        = document.getElementById("tittel");
  const heroTittelEl   = document.getElementById("hero-tittel");
  const heroMaalCountEl = document.getElementById("hero-maal-count");
  const searchInput   = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");

  if (!menuEl || !contentEl || !titleEl) return;

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  }

  // =========================
  // URL -> plan
  // =========================
  const params = new URLSearchParams(location.search);
  const explicitId = params.get("id");
  let currentPlanId = explicitId || DEFAULT_PLAN_ID;

  if (!explicitId) {
    history.replaceState(null, "", "?id=" + encodeURIComponent(DEFAULT_PLAN_ID) + location.hash);
  }

  // =========================
  // Hide/show topbar ved scroll
  // =========================
  (() => {
    if (!topbar) return;
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY;
      const dropdownOpen = document.querySelector(".dropdown.open");
      if (!dropdownOpen && delta > 6 && y > 80) {
        topbar.classList.add("is-hidden");
      } else if (delta < -6) {
        topbar.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener("scroll", function() {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  })();

  // =========================
  // Hjelpere
  // =========================
  function safeId(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function clearUI() {
    menuEl.innerHTML = "";
    contentEl.innerHTML = "";
  }

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
    while (node) {
      path.push(node);
      const parent = node.parentElement;
      node = parent ? parent.closest(".node") : null;
    }

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
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(function(entries) {
      const visible = entries
        .filter(function(e) { return e.isIntersecting; })
        .sort(function(a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      if (visible.length > 0) setActiveLink(visible[0].target.id);
    }, { root: null, rootMargin: "0px 0px -70% 0px", threshold: 0.01 });

    sections.forEach(function(s) { observer.observe(s); });
    setActiveLink(sections[0].id);
  }

  // =========================
  // Kommuneplan-knapp state
  // =========================
  function updateKommuneplanButtonState() {
    const btn = document.getElementById("btnKommuneplan");
    if (!btn) return;
    const isDefault = currentPlanId === DEFAULT_PLAN_ID;
    btn.classList.toggle("is-selected", isDefault);
    btn.classList.toggle("is-disabled", isDefault);
    if (isDefault) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }

  // =========================
  // Toppmeny
  // =========================
  function planTypeLabel(planTyper) {
    const labels = {
      701100000: "Kommuneplanen",
      701100001: "Strategier",
      701100002: "Handlings- og økonomiplaner"
    };
    return labels[planTyper] || ("Plantype " + planTyper);
  }

  let dropdownClickListenerAttached = false;

  function attachDropdownListener() {
    if (dropdownClickListenerAttached) return;
    document.addEventListener("click", function(e) {
      document.querySelectorAll(".dropdown.open").forEach(function(dd) {
        if (!dd.contains(e.target)) dd.classList.remove("open");
      });
    });
    dropdownClickListenerAttached = true;
  }
function buildMobileTopMenu(plans) {
  const btn = document.getElementById("topnav-mobile-btn");
  const container = document.getElementById("topnav-mobile");
  if (!btn || !container) return;

  let mobileMenu = document.getElementById("topnav-mobile-menu");
  if (mobileMenu) mobileMenu.remove();

  mobileMenu = document.createElement("div");
  mobileMenu.id = "topnav-mobile-menu";
  mobileMenu.className = "dropdown-menu";
  mobileMenu.style.left = "0";
  mobileMenu.style.minWidth = "220px";

  const collator = new Intl.Collator("nb", { sensitivity: "base" });
  const sorted = plans.slice().sort(function(a, b) {
    return collator.compare(a.planNavn || "", b.planNavn || "");
  });

  sorted.forEach(function(p) {
    const a = document.createElement("a");
    a.href = "?id=" + encodeURIComponent(p.planID);
    a.textContent = p.planNavn || "(uten navn)";
    a.addEventListener("click", function(e) {
      e.preventDefault();
      navigateToPlan(p.planID);
      mobileMenu.style.display = "none";
    });
    mobileMenu.appendChild(a);
  });

  container.appendChild(mobileMenu);

  btn.addEventListener("click", function(e) {
    e.stopPropagation();
    const isOpen = mobileMenu.style.display === "block";
    mobileMenu.style.display = isOpen ? "none" : "block";
    if (topbar) topbar.classList.remove("is-hidden");
  });

  document.addEventListener("click", function() {
    mobileMenu.style.display = "none";
  });
}
  function buildTopMenu(plans) {
    if (!topnav) return;
    topnav.innerHTML = "";
    const menuTopnav = document.getElementById("menu-topnav");
    if (menuTopnav) menuTopnav.innerHTML = "";

    const groups = new Map();
    plans.forEach(function(p) {
      const key = p.planTyper;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });

    const typeKeys = Array.from(groups.keys()).sort(function(a, b) { return a - b; });
    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    typeKeys.forEach(function(k) {
      groups.get(k).sort(function(a, b) { return collator.compare(a.planNavn || "", b.planNavn || ""); });
    });

    typeKeys.forEach(function(typeKey) {
      const dd = document.createElement("div");
      dd.className = "dropdown";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropbtn";
      btn.setAttribute("aria-haspopup", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = planTypeLabel(typeKey);
      if (typeKey === 701100000) btn.id = "btnKommuneplan";

      const menu = document.createElement("div");
      menu.className = "dropdown-menu";

      groups.get(typeKey).forEach(function(p) {
        const a = document.createElement("a");
        a.href = "?id=" + encodeURIComponent(p.planID);
        a.textContent = p.planNavn || "(uten navn)";
        a.addEventListener("click", function(e) {
          e.preventDefault();
          navigateToPlan(p.planID);
          dd.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        });
        menu.appendChild(a);
      });

      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        document.querySelectorAll(".dropdown.open").forEach(function(x) {
          if (x !== dd) x.classList.remove("open");
        });
        dd.classList.toggle("open");
        btn.setAttribute("aria-expanded", dd.classList.contains("open") ? "true" : "false");
        if (topbar) topbar.classList.remove("is-hidden");
      });

      dd.appendChild(btn);
      dd.appendChild(menu);
      topnav.appendChild(dd);
      if (menuTopnav) {
  const ddClone = dd.cloneNode(true);
  ddClone.querySelector("button").addEventListener("click", function(e) {
    e.stopPropagation();
    document.querySelectorAll("#menu-topnav .dropdown.open").forEach(function(x) {
      if (x !== ddClone) x.classList.remove("open");
    });
    ddClone.classList.toggle("open");
  });
  ddClone.querySelectorAll("a").forEach(function(a) {
    a.addEventListener("click", function(e) {
      e.preventDefault();
      const url = new URL(a.href);
      const planId = url.searchParams.get("id");
      if (planId) navigateToPlan(planId);
      if (sidebar) sidebar.classList.remove("open");
    });
  });
  menuTopnav.appendChild(ddClone);
}
    });

    updateKommuneplanButtonState();
  }

  // =========================
  // Venstremeny: tre/hierarki
  // =========================
  function buildTree(goalsForPlan) {
    const byId = new Map(goalsForPlan.map(function(g) { return [g.maalID, g]; }));
    const children = new Map();

    function addChild(parentId, child) {
      if (!children.has(parentId)) children.set(parentId, []);
      children.get(parentId).push(child);
    }

    goalsForPlan.forEach(function(g) {
      const parentId = g.maalOverordnet;
      if (parentId && byId.has(parentId)) addChild(parentId, g);
      else addChild(null, g);
    });

    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    children.forEach(function(arr) {
      arr.sort(function(a, b) { return collator.compare(a.maalNavn || "", b.maalNavn || ""); });
    });

    function renderNode(goal, level) {
      const anchorId = ensureSection(goal);

      const node = document.createElement("div");
      node.className = "node level-" + Math.min(level, 3);
      if (level === 0) node.classList.add("open");

      const row = document.createElement("div");
      row.className = "row level-" + Math.min(level, 3);

      const kids = children.get(goal.maalID) || [];
      const hasKids = level !== 0 && kids.length > 0;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = hasKids ? "toggle" : "toggle placeholder";

      toggle.addEventListener("click", function() {
        if (!hasKids) return;
        const parent = node.parentElement;
        const willOpen = !node.classList.contains("open");
        if (willOpen && parent) {
          Array.from(parent.children).forEach(function(el) {
            if (el !== node && el.classList && el.classList.contains("node")) {
              el.classList.remove("open");
            }
          });
        }
        node.classList.toggle("open");
      });

      const a = document.createElement("a");
      a.href = "#" + anchorId;

      if (goal.maalIkon) {
        const icon = document.createElement("i");
        icon.className = "ti " + goal.maalIkon;
        icon.setAttribute("aria-hidden", "true");
        icon.style.marginRight = "5px";
        icon.style.fontSize = "13px";
        a.appendChild(icon);
      }

      a.appendChild(document.createTextNode(goal.maalNavn || "(uten navn)"));
      a.addEventListener("click", function() {
        if (window.matchMedia("(max-width: 768px)").matches) {
          if (sidebar) sidebar.classList.remove("open");
        }
      });

      row.appendChild(toggle);
      row.appendChild(a);
      node.appendChild(row);

      const childWrap = document.createElement("div");
      childWrap.className = "children";
      node.appendChild(childWrap);

      kids.forEach(function(k) { childWrap.appendChild(renderNode(k, level + 1)); });
      return node;
    }

    (children.get(null) || []).forEach(function(g) { menuEl.appendChild(renderNode(g, 0)); });
  }

  // =========================
  // Innholdsblokker per mål
  // =========================
  function renderInnhold(innhold, planId) {
    const radene = innhold
      .filter(function(r) { return r.innholdPlan === planId; })
      .sort(function(a, b) { return a.visningsrekkefølge - b.visningsrekkefølge; });

    radene.forEach(function(rad) {
      const anchorId = "maal-" + safeId(rad.innholdMaal);
      const section = document.getElementById(anchorId);
      if (!section) return;

      const blokk = document.createElement("div");
      blokk.className = "innhold-blokk";

      const badgeClass = {
        "Tekst":       "badge-tekst",
        "PBI-rapport": "badge-pbi",
        "Bilde":       "badge-bilde",
        "Vedlegg":     "badge-vedlegg",
        "Kombinert":   "badge-tekst"
      }[rad.innholdstype] || "badge-tekst";

      const badgeIcon = {
        "Tekst":       "ti-align-left",
        "PBI-rapport": "ti-chart-bar",
        "Bilde":       "ti-photo",
        "Vedlegg":     "ti-file-description",
        "Kombinert":   "ti-layout-grid"
      }[rad.innholdstype] || "ti-file";

      const badge = document.createElement("div");
      badge.className = "card-type-badge " + badgeClass;
      const badgeI = document.createElement("i");
      badgeI.className = "ti " + badgeIcon;
      badgeI.setAttribute("aria-hidden", "true");
      badgeI.style.fontSize = "11px";
      badge.appendChild(badgeI);
      badge.appendChild(document.createTextNode(" " + (rad.innholdstype || "Tekst")));
      blokk.appendChild(badge);

      if (rad.overskrift) {
        const h3 = document.createElement("h3");
        h3.textContent = rad.overskrift;
        blokk.appendChild(h3);
      }

      if (rad.brodtekst) {
        const p = document.createElement("p");
        p.textContent = rad.brodtekst;
        blokk.appendChild(p);
      }

      if (rad.bildeUrl) {
        const img = document.createElement("img");
        img.src = rad.bildeUrl;
        img.alt = rad.bildeAltTekst || "";
        img.className = "innhold-bilde";
        if (rad.innholdBredde) img.style.maxWidth = rad.innholdBredde + "px";
        blokk.appendChild(img);
      }

      if (rad.pbiUrl) {
        const FOOTER_PX = 30;
        const origW   = rad.innholdBredde || 600;
        const iframeH = rad.innholdHøyde  || 400;
        const src     = rad.pbiUrl;

        const pbiHeader = document.createElement("div");
        pbiHeader.className = "innhold-pbi-header";

        const pbiIcon = document.createElement("i");
        pbiIcon.className = "ti ti-chart-bar";
        pbiIcon.setAttribute("aria-hidden", "true");

        const pbiSpan = document.createElement("span");
        pbiSpan.appendChild(pbiIcon);
        pbiSpan.appendChild(document.createTextNode(" " + (rad.overskrift || "Power BI-rapport")));

        const pbiLink = document.createElement("a");
        pbiLink.href = src;
        pbiLink.target = "_blank";
        pbiLink.rel = "noopener";
        pbiLink.setAttribute("aria-label", "Åpne i nytt vindu");
        pbiLink.style.color = "var(--green-600)";
        const extIcon = document.createElement("i");
        extIcon.className = "ti ti-external-link";
        pbiLink.appendChild(extIcon);

        pbiHeader.appendChild(pbiSpan);
        pbiHeader.appendChild(pbiLink);
        blokk.appendChild(pbiHeader);

        const wrapper = document.createElement("div");
        wrapper.style.overflow     = "hidden";
        wrapper.style.borderRadius = "0 0 8px 8px";
        wrapper.style.width        = (origW + 20) + "px";
        wrapper.style.maxWidth     = "99%";
        wrapper.style.margin       = "0 auto";
        wrapper.style.border = "none";
        wrapper.style.height       = (iframeH - FOOTER_PX) + "px";

        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.setAttribute("width",     String(origW + 20));
        iframe.setAttribute("height",    String(iframeH + FOOTER_PX));
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("frameborder", "0");
        iframe.allowFullscreen = true;
        iframe.style.border    = "none";
        iframe.style.display   = "block";

        wrapper.appendChild(iframe);
        blokk.appendChild(wrapper);
      }

      if (rad.vedleggUrl) {
        const a = document.createElement("a");
        a.href = rad.vedleggUrl;
        a.className = "innhold-vedlegg";
        a.target = "_blank";
        a.rel = "noopener";

        const vIcon = document.createElement("div");
        vIcon.className = "innhold-vedlegg-icon";
        const vI = document.createElement("i");
        vI.className = "ti ti-file-type-pdf";
        vI.setAttribute("aria-hidden", "true");
        vIcon.appendChild(vI);

        const vInfo = document.createElement("div");
        vInfo.className = "innhold-vedlegg-info";
        const vName = document.createElement("div");
        vName.className = "innhold-vedlegg-name";
        vName.textContent = rad.vedleggEtikett || "Last ned vedlegg";
        vInfo.appendChild(vName);

        const vArrow = document.createElement("div");
        vArrow.className = "vedlegg-arrow";
        const vArrowI = document.createElement("i");
        vArrowI.className = "ti ti-download";
        vArrowI.setAttribute("aria-hidden", "true");
        vArrow.appendChild(vArrowI);

        a.appendChild(vIcon);
        a.appendChild(vInfo);
        a.appendChild(vArrow);
        blokk.appendChild(a);
      }

      section.appendChild(blokk);
    });
  }
// =========================
  // Søk
  // =========================
  let searchData = { plans: [], goals: [], innhold: [] };

  function buildSearchIndex(plans, goals, innhold) {
    searchData = { plans, goals, innhold };
  }

  function runSearch(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();

    if (q.length < 2) {
      searchResults.classList.remove("open");
      searchResults.innerHTML = "";
      return;
    }

    const planMap = new Map(searchData.plans.map(function(p) { return [p.planID, p.planNavn]; }));

    const goalHits = searchData.goals.filter(function(g) {
      return (g.maalNavn || "").toLowerCase().includes(q);
    });

    const innholdHits = searchData.innhold.filter(function(r) {
      return (r.overskrift || "").toLowerCase().includes(q) ||
             (r.brodtekst  || "").toLowerCase().includes(q);
    });

    if (goalHits.length === 0 && innholdHits.length === 0) {
      searchResults.innerHTML = "<div class=\"search-empty\">Ingen treff for «" + query.trim() + "»</div>";
      searchResults.classList.add("open");
      return;
    }

    // Gruppér på plan
    const groups = new Map();

    goalHits.forEach(function(g) {
      const planId   = g.maalPlan;
      const planNavn = planMap.get(planId) || "Ukjent plan";
      if (!groups.has(planId)) groups.set(planId, { planNavn, goals: [], innhold: [] });
      groups.get(planId).goals.push(g);
    });

    innholdHits.forEach(function(r) {
      const planId   = r.innholdPlan;
      const planNavn = planMap.get(planId) || "Ukjent plan";
      if (!groups.has(planId)) groups.set(planId, { planNavn, goals: [], innhold: [] });
      groups.get(planId).innhold.push(r);
    });

    searchResults.innerHTML = "";

    groups.forEach(function(group, planId) {
      const groupLabel = document.createElement("div");
      groupLabel.className = "search-group-label";
      groupLabel.textContent = group.planNavn;
      searchResults.appendChild(groupLabel);

      group.goals.forEach(function(g) {
        const anchorId = "maal-" + safeId(g.maalID);
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML =
          "<i class=\"ti ti-target search-result-icon\" aria-hidden=\"true\"></i>" +
          "<div>" +
            "<div class=\"search-result-title\">" + (g.maalNavn || "") + "</div>" +
            "<div class=\"search-result-sub\">Mål</div>" +
          "</div>";
        item.addEventListener("click", function() {
          searchResults.classList.remove("open");
          searchInput.value = "";
          if (planId !== currentPlanId) {
            history.pushState(null, "", "?id=" + encodeURIComponent(planId) + "#" + anchorId);
            currentPlanId = planId;
            init().then(function() {
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          } else {
            const el = document.getElementById(anchorId);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        searchResults.appendChild(item);
      });

      group.innhold.forEach(function(r) {
        const anchorId = "maal-" + safeId(r.innholdMaal);
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML =
          "<i class=\"ti ti-file-text search-result-icon\" aria-hidden=\"true\"></i>" +
          "<div>" +
            "<div class=\"search-result-title\">" + (r.overskrift || "") + "</div>" +
            "<div class=\"search-result-sub\">" + (group.planNavn || "") + "</div>" +
          "</div>";
        item.addEventListener("click", function() {
          searchResults.classList.remove("open");
          searchInput.value = "";
          if (planId !== currentPlanId) {
            history.pushState(null, "", "?id=" + encodeURIComponent(planId) + "#" + anchorId);
            currentPlanId = planId;
            init().then(function() {
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          } else {
            const el = document.getElementById(anchorId);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        searchResults.appendChild(item);
      });
    });

    searchResults.classList.add("open");
  }

  function attachSearchListeners() {
    if (!searchInput) return;

    searchInput.addEventListener("input", function() {
      runSearch(searchInput.value);
    });

    searchInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        searchResults.classList.remove("open");
        searchInput.value = "";
      }
    });

    document.addEventListener("click", function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove("open");
      }
    });
  }
  function attachMobileSearchListeners() {
    const searchBtn   = document.getElementById("searchBtn");
    const searchWrapper = document.getElementById("search-wrapper");
    if (!searchBtn || !searchWrapper) return;

    // Legg til lukkeknapp i wrapper
    let closeBtn = document.getElementById("search-close-btn");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.id = "search-close-btn";
      closeBtn.className = "search-close-btn";
      closeBtn.setAttribute("aria-label", "Lukk søk");
      closeBtn.innerHTML = "<i class=\"ti ti-x\" aria-hidden=\"true\"></i>";
      searchWrapper.appendChild(closeBtn);
    }

const topbarActions = document.querySelector(".topbar-actions");

    searchBtn.addEventListener("click", function() {
      searchWrapper.classList.add("mobile-open");
      if (topbarActions) topbarActions.style.visibility = "hidden";
      if (searchInput) searchInput.focus();
    });

    closeBtn.addEventListener("click", function() {
      searchWrapper.classList.remove("mobile-open");
      if (topbarActions) topbarActions.style.visibility = "visible";  
      if (searchInput) {
        searchInput.value = "";
      }
      if (searchResults) {
        searchResults.classList.remove("open");
        searchResults.innerHTML = "";
      }
    });
  }
  // =========================
  // Navigasjon
  // =========================
  function navigateToPlan(planId) {
    currentPlanId = planId;
    updateKommuneplanButtonState();
    history.pushState(null, "", "?id=" + encodeURIComponent(planId) + (location.hash || ""));
    init();
  }

  // =========================
  // Init
  // =========================
  async function init() {
    try {
      const [plans, goals, innhold] = await Promise.all([
        fetch(URL_PLAN,    { cache: "no-store" }).then(function(r) { return r.json(); }),
        fetch(URL_MAAL,    { cache: "no-store" }).then(function(r) { return r.json(); }),
        fetch(URL_INNHOLD, { cache: "no-store" }).then(function(r) { return r.json(); })
      ]);

      buildTopMenu(plans);
      buildSearchIndex(plans, goals, innhold);
      buildMobileTopMenu(plans);
      attachDropdownListener();
      attachSearchListeners();
      attachMobileSearchListeners();
      clearUI();

      const plan = plans.find(function(p) { return p.planID === currentPlanId; });
      titleEl.textContent = plan ? plan.planNavn : "Plan ikke funnet";

      const goalsForPlan = goals.filter(function(m) { return m.maalPlan === currentPlanId; });
      if (goalsForPlan.length === 0) {
        contentEl.innerHTML = "<p>Ingen mål funnet for denne planen.</p>";
        return;
      }

      const rootGoal = goalsForPlan.find(function(g) { return !g.maalOverordnet; });
      if (heroTittelEl)    heroTittelEl.textContent    = rootGoal ? rootGoal.maalNavn : "";
      if (heroMaalCountEl) heroMaalCountEl.textContent = goalsForPlan.length;

      buildTree(goalsForPlan);
      renderInnhold(innhold, currentPlanId);
      setupScrollSpy();
      return true;

      if (location.hash) {
        const el = document.getElementById(location.hash.substring(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch(e) {
      titleEl.textContent = "Feil";
      contentEl.innerHTML = "<p>Det oppstod en feil ved lasting av data.</p>";
      console.error(e);
    }
  }

  window.addEventListener("popstate", function() {
    const p = new URLSearchParams(location.search);
    currentPlanId = p.get("id") || DEFAULT_PLAN_ID;
    updateKommuneplanButtonState();
    init();
  });

  init();
})();
