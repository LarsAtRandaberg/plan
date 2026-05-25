(() => {
  const DEFAULT_PLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a";
  const URL_PLAN    = "data/plan.json";
  const URL_MAAL    = "data/maal.json";
  const URL_INNHOLD = "data/innhold.json";

  const topbar          = document.querySelector(".topbar");
  const topnav          = document.getElementById("topnav");
  const sidebar         = document.getElementById("sidebar");
  const menuBtn         = document.getElementById("menuBtn");
  const menuEl          = document.getElementById("menu");
  const contentEl       = document.getElementById("innhold");
  const titleEl         = document.getElementById("tittel");
  const heroTittelEl    = document.getElementById("hero-tittel");
  const heroMaalCountEl = document.getElementById("hero-maal-count");
  const searchInput     = document.getElementById("search-input");
  const searchResults   = document.getElementById("search-results");

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

  const params      = new URLSearchParams(location.search);
  const explicitId  = params.get("id");
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
    const section  = document.createElement("section");
    section.id     = anchorId;
    const heading  = document.createElement("h2");
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
    if (!sections.length) return;
    const observer = new IntersectionObserver(function(entries) {
      const visible = entries
        .filter(function(e) { return e.isIntersecting; })
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
    btn.classList.toggle("is-disabled",  isDefault);
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
      document.querySelectorAll(".dropdown.open").forEach(function(dd) {
        if (!dd.contains(e.target)) dd.classList.remove("open");
      });
    });
    dropdownClickListenerAttached = true;
  }

  function buildTopMenu(plans) {
    if (!topnav) return;
    topnav.innerHTML = "";
    const menuTopnav = document.getElementById("menu-topnav");
    if (menuTopnav) menuTopnav.innerHTML = "";
    const groups   = new Map();
    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    plans.forEach(function(p) {
      if (!groups.has(p.planTyper)) groups.set(p.planTyper, []);
      groups.get(p.planTyper).push(p);
    });
    const typeKeys = Array.from(groups.keys()).sort(function(a, b) { return a - b; });
    typeKeys.forEach(function(k) {
      groups.get(k).sort(function(a, b) { return collator.compare(a.planNavn || "", b.planNavn || ""); });
    });
    typeKeys.forEach(function(typeKey) {
      const dd  = document.createElement("div"); dd.className = "dropdown";
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "dropbtn";
      btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
      btn.textContent = planTypeLabel(typeKey);
      if (typeKey === 701100000) btn.id = "btnKommuneplan";
      const menu = document.createElement("div"); menu.className = "dropdown-menu";
      groups.get(typeKey).forEach(function(p) {
        const a = document.createElement("a");
        a.href = "?id=" + encodeURIComponent(p.planID);
        a.textContent = p.planNavn || "(uten navn)";
        a.addEventListener("click", function(e) {
          e.preventDefault(); navigateToPlan(p.planID);
          dd.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
        });
        menu.appendChild(a);
      });
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        document.querySelectorAll(".dropdown.open").forEach(function(x) { if (x !== dd) x.classList.remove("open"); });
        dd.classList.toggle("open");
        btn.setAttribute("aria-expanded", dd.classList.contains("open") ? "true" : "false");
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
    const byId     = new Map(goalsForPlan.map(function(g) { return [g.maalID, g]; }));
    const children = new Map();
    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    goalsForPlan.forEach(function(g) {
      const pid = g.maalOverordnet;
      const key = (pid && byId.has(pid)) ? pid : null;
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(g);
    });
    children.forEach(function(arr) {
      arr.sort(function(a, b) { return collator.compare(a.maalNavn || "", b.maalNavn || ""); });
    });
    function renderNode(goal, level) {
      const anchorId = ensureSection(goal);
      const node     = document.createElement("div");
      node.className = "node level-" + Math.min(level, 3);
      if (level === 0) node.classList.add("open");
      const row  = document.createElement("div");
      row.className = "row level-" + Math.min(level, 3);
      const kids    = level < 2 ? (children.get(goal.maalID) || []) : [];
      const hasKids = level !== 0 && kids.length > 0;
      const toggle = document.createElement("button");
      toggle.type  = "button";
      toggle.className = hasKids ? "toggle" : "toggle placeholder";
      toggle.addEventListener("click", function() {
        if (!hasKids) return;
        const willOpen = !node.classList.contains("open");
        if (willOpen && node.parentElement) {
          Array.from(node.parentElement.children).forEach(function(el) {
            if (el !== node && el.classList && el.classList.contains("node")) el.classList.remove("open");
          });
        }
        node.classList.toggle("open");
      });
      const a = document.createElement("a");
      a.href  = "#" + anchorId;
      if (goal.maalIkon) {
        const icon = document.createElement("i");
        icon.className = "ti " + goal.maalIkon;
        icon.setAttribute("aria-hidden", "true");
        icon.style.cssText = "margin-right:5px;font-size:13px";
        a.appendChild(icon);
      }
      a.appendChild(document.createTextNode(goal.maalNavn || "(uten navn)"));
      a.addEventListener("click", function() {
        if (window.matchMedia("(max-width: 768px)").matches && sidebar) sidebar.classList.remove("open");
      });
      row.appendChild(toggle); row.appendChild(a); node.appendChild(row);
      const childWrap = document.createElement("div"); childWrap.className = "children";
      kids.forEach(function(k) { childWrap.appendChild(renderNode(k, level + 1)); });
      node.appendChild(childWrap);
      return node;
    }
    (children.get(null) || []).forEach(function(g) { menuEl.appendChild(renderNode(g, 0)); });
  }

  // =========================
  // JSON-renderer
  // =========================
  var leafletPromise = null;

  function loadStylesheetOnce(id, href) {
    if (document.getElementById(id)) return;
    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScriptOnce(id, src) {
    var existing = document.getElementById(id);
    if (existing) {
      return new Promise(function(resolve, reject) {
        if (existing.dataset.loaded === "1") resolve();
        else {
          existing.addEventListener("load", function() { resolve(); }, { once: true });
          existing.addEventListener("error", function() { reject(new Error("Kunne ikke laste " + src)); }, { once: true });
        }
      });
    }
    return new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;
      script.addEventListener("load", function() { script.dataset.loaded = "1"; resolve(); }, { once: true });
      script.addEventListener("error", function() { reject(new Error("Kunne ikke laste " + src)); }, { once: true });
      document.head.appendChild(script);
    });
  }

  function ensureLeaflet() {
    if (window.L) return Promise.resolve();
    if (!leafletPromise) {
      loadStylesheetOnce("leaflet-css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      leafletPromise = loadScriptOnce("leaflet-js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
    }
    return leafletPromise;
  }

  function makeFaktakartStat(label, verdi) {
    var stat = document.createElement("div");
    stat.className = "faktakart-stat";
    var l = document.createElement("span");
    l.textContent = label || "";
    var v = document.createElement("strong");
    v.textContent = verdi || "";
    stat.appendChild(l);
    stat.appendChild(v);
    return stat;
  }

  function renderFaktakart(cfg, blokk) {
    var points = Array.isArray(cfg.punkter) ? cfg.punkter : [];
    if (!points.length) return;

    var wrap = document.createElement("div");
    wrap.className = "faktakart";

    var header = document.createElement("div");
    header.className = "faktakart-header";
    var titleWrap = document.createElement("div");
    if (cfg.undertittel) {
      var kicker = document.createElement("div");
      kicker.className = "faktakart-kicker";
      kicker.textContent = cfg.undertittel;
      titleWrap.appendChild(kicker);
    }
    var title = document.createElement("h3");
    title.textContent = cfg.tittel || "Fakta";
    titleWrap.appendChild(title);
    header.appendChild(titleWrap);

    if (Array.isArray(cfg.nokkeltall) && cfg.nokkeltall.length) {
      var meta = document.createElement("div");
      meta.className = "faktakart-meta";
      cfg.nokkeltall.forEach(function(item) {
        var pill = document.createElement("span");
        pill.className = "faktakart-pill";
        pill.textContent = (item.label ? item.label + ": " : "") + (item.verdi || "");
        meta.appendChild(pill);
      });
      header.appendChild(meta);
    }
    wrap.appendChild(header);

    var body = document.createElement("div");
    body.className = "faktakart-body";

    var list = document.createElement("div");
    list.className = "faktakart-list";
    list.setAttribute("aria-label", "Faktaområder");

    var mapPanel = document.createElement("div");
    mapPanel.className = "faktakart-map-panel";
    var mapEl = document.createElement("div");
    mapEl.className = "faktakart-map";
    mapPanel.appendChild(mapEl);
    var detail = document.createElement("aside");
    detail.className = "faktakart-detail";
    detail.setAttribute("aria-live", "polite");
    mapPanel.appendChild(detail);

    body.appendChild(list);
    body.appendChild(mapPanel);
    wrap.appendChild(body);
    blokk.appendChild(wrap);

    function normalizePoint(point, index) {
      return {
        id: point.id || ("punkt-" + index),
        title: point.tittel || point.title || "(uten navn)",
        shortText: point.korttekst || point.kortTekst || "",
        text: point.tekst || point.brodtekst || point.detalj || "",
        icon: point.ikon || point.icon || "ti-map-pin",
        lat: Number(point.lat || (point.posisjon && point.posisjon[0])),
        lng: Number(point.lng || point.lon || (point.posisjon && point.posisjon[1])),
        zoom: Number(point.zoom || cfg.zoom || 12),
        stats: Array.isArray(point.tall) ? point.tall : []
      };
    }

    var normalized = points.map(normalizePoint).filter(function(point) {
      return !isNaN(point.lat) && !isNaN(point.lng);
    });
    if (!normalized.length) return;

    normalized.forEach(function(point, index) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "faktakart-card" + (index === 0 ? " active" : "");
      card.dataset.id = point.id;
      var cardTop = document.createElement("div");
      cardTop.className = "faktakart-card-top";
      var h = document.createElement("h4");
      h.textContent = point.title;
      var icon = document.createElement("i");
      icon.className = "ti " + point.icon;
      icon.setAttribute("aria-hidden", "true");
      cardTop.appendChild(h);
      cardTop.appendChild(icon);
      card.appendChild(cardTop);
      if (point.shortText) {
        var p = document.createElement("p");
        p.textContent = point.shortText;
        card.appendChild(p);
      }
      list.appendChild(card);
    });

    function renderDetail(point) {
      detail.innerHTML = "";
      var h = document.createElement("h4");
      h.textContent = point.title;
      detail.appendChild(h);
      if (point.text) {
        var p = document.createElement("p");
        p.textContent = point.text;
        detail.appendChild(p);
      }
      if (point.stats.length) {
        var stats = document.createElement("div");
        stats.className = "faktakart-stats";
        point.stats.forEach(function(item) {
          stats.appendChild(makeFaktakartStat(item.label, item.verdi));
        });
        detail.appendChild(stats);
      }
    }

    function showMapError(message) {
      mapEl.classList.add("faktakart-map-error");
      mapEl.textContent = message;
      renderDetail(normalized[0]);
    }

    ensureLeaflet().then(function() {
      var center = Array.isArray(cfg.center) ? cfg.center : [normalized[0].lat, normalized[0].lng];
      var map = L.map(mapEl, {
        scrollWheelZoom: false,
        zoomControl: true
      }).setView(center, Number(cfg.zoom || 12));

      L.tileLayer(cfg.tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: Number(cfg.maxZoom || 18),
        attribution: cfg.attribution || "&copy; OpenStreetMap"
      }).addTo(map);

      var markers = {};

      function activate(id, fromMarker) {
        var point = normalized.find(function(p) { return p.id === id; }) || normalized[0];
        list.querySelectorAll(".faktakart-card").forEach(function(card) {
          card.classList.toggle("active", card.dataset.id === point.id);
        });
        renderDetail(point);
        map.setView([point.lat, point.lng], point.zoom, { animate: true });
        if (!fromMarker && markers[point.id]) markers[point.id].openPopup();
      }

      normalized.forEach(function(point) {
        var icon = L.divIcon({
          className: "",
          html: "<div class=\"faktakart-marker\"><i class=\"ti " + point.icon + "\"></i></div>",
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        var popup = document.createElement("div");
        var popupTitle = document.createElement("strong");
        popupTitle.textContent = point.title;
        popup.appendChild(popupTitle);
        if (point.shortText) {
          popup.appendChild(document.createElement("br"));
          popup.appendChild(document.createTextNode(point.shortText));
        }
        markers[point.id] = L.marker([point.lat, point.lng], { icon: icon }).addTo(map).bindPopup(popup);
        markers[point.id].on("click", function() { activate(point.id, true); });
      });

      list.querySelectorAll(".faktakart-card").forEach(function(card) {
        card.addEventListener("click", function() { activate(card.dataset.id, false); });
      });

      renderDetail(normalized[0]);
      setTimeout(function() { map.invalidateSize(); }, 0);
    }).catch(function(e) {
      console.error("Kartlasting feilet:", e);
      showMapError("Kartet kunne ikke lastes.");
    });
  }

  function renderJSON(cfg, blokk) {
    var G = { c900:"#173404", c800:"#27500a", c600:"#3b6d11", c200:"#c0dd97", c100:"#eaf3de" };

    if (cfg.type === "faktakart") {
      renderFaktakart(cfg, blokk);
      return;
    }

    if (cfg.type === "diagram") {
      var wrap = document.createElement("div"); wrap.style.cssText = "position:relative;margin-top:8px";
      var canvas = document.createElement("canvas"); wrap.appendChild(canvas); blokk.appendChild(wrap);
      var farger = [G.c600, G.c200, G.c800, G.c900];
      var isLinje    = cfg.diagramtype === "linje";
      var isDoughnut = cfg.diagramtype === "doughnut";
      var datasets = cfg.datasett.map(function(ds, i) {
        return {
          label: ds.etikett, data: ds.verdier,
          backgroundColor: isLinje ? G.c100 : isDoughnut ? [G.c200, G.c600, G.c800, G.c900] : farger[i % farger.length],
          borderColor:     isLinje ? G.c600 : farger[i % farger.length],
          borderRadius:    (!isLinje && !isDoughnut) ? 6 : 0,
          borderWidth:     isLinje ? 2 : 0,
          fill:            isLinje, tension: isLinje ? 0.3 : 0,
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
      var grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:8px";
      cfg.tall.forEach(function(t) {
        var kort = document.createElement("div");
        kort.style.cssText = "background:#27500a;border-radius:10px;padding:16px;color:#fff";
        var trendFarge = t.trend === "opp" ? "#c0dd97" : t.trend === "ned" ? "#f4c89a" : "rgba(255,255,255,0.6)";
        var trendPil   = t.trend === "opp" ? "↑" : t.trend === "ned" ? "↓" : "→";
        var trendBg    = t.trend === "opp" ? "rgba(192,221,151,0.2)" : t.trend === "ned" ? "rgba(224,112,48,0.2)" : "rgba(255,255,255,0.1)";
        var trendTekst = t.trend === "opp" ? "Over mål" : t.trend === "ned" ? "Under mål" : "Stabilt";
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

    if (cfg.type === "oversikt") {
      var isMobil = window.innerWidth <= 768;

      var grid = document.createElement("div");
      grid.style.cssText = isMobil
        ? "display:grid;grid-template-columns:1fr;gap:16px;margin-top:8px"
        : "display:grid;grid-template-columns:1fr auto 1fr;gap:24px;align-items:center;margin-top:8px";

      function lagKolonne(data) {
        var kol = document.createElement("div");
        if (data.tittel) {
          var t = document.createElement("div");
          t.style.cssText = "font-size:16px;font-weight:700;color:#173404;margin-bottom:14px";
          t.textContent = data.tittel; kol.appendChild(t);
        }
        data.punkter.forEach(function(p) {
          var punkt = document.createElement("div");
          punkt.style.cssText = "display:flex;align-items:flex-start;gap:10px;margin-bottom:12px";
          var dot = document.createElement("div");
          dot.style.cssText = "width:12px;height:12px;border-radius:50%;background:#3b6d11;flex-shrink:0;margin-top:4px";
          var inn = document.createElement("div");
          if (p.tittel) {
            var pt = document.createElement("div");
            pt.style.cssText = "font-size:13px;font-weight:700;color:#173404;margin-bottom:2px";
            pt.textContent = p.tittel; inn.appendChild(pt);
          }
          if (p.tekst) {
            var tt = document.createElement("div");
            tt.style.cssText = "font-size:12px;color:#3b6d11;line-height:1.5";
            tt.textContent = p.tekst; inn.appendChild(tt);
          }
          punkt.appendChild(dot); punkt.appendChild(inn); kol.appendChild(punkt);
        });
        return kol;
      }

      grid.appendChild(lagKolonne(cfg.venstre));

      var senter = document.createElement("div");
      var senterStil = "width:150px;height:150px;border-radius:50%;background:#3b6d11;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font-size:14px;font-weight:700;line-height:1.35;padding:16px;flex-shrink:0";
      if (isMobil) { senterStil += ";margin:0 auto"; }
      senter.style.cssText = senterStil;
      senter.innerHTML = cfg.senter.replace(/\n/g, "<br>");
      grid.appendChild(senter);

      grid.appendChild(lagKolonne(cfg.hoyre));
      blokk.appendChild(grid);
    }
    if (cfg.type === "tabell") {
      var kolKlasser = ["kol-6","kol-3","kol-4","kol-1","kol-5","kol-2"];
      var tWrap = document.createElement("div");
      tWrap.style.cssText = "border:0.5px solid #c0dd97;border-radius:8px;overflow-x:auto;margin-top:8px";
      var table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse;font-size:12px";

      // Thead
      var thead = document.createElement("thead");
      var hRad  = document.createElement("tr");
      var th0   = document.createElement("th");
      th0.style.cssText = "background:#eaf3de;color:#27500a;font-weight:600;font-size:11px;padding:8px 10px;text-align:left;border-bottom:1px solid #c0dd97;min-width:180px";
      var eF = document.createElement("span"); eF.className = "enhet-full"; eF.textContent = cfg.enhet_full || "Tall i tusen kroner";
      var eM = document.createElement("span"); eM.className = "enhet-mill"; eM.textContent = cfg.enhet_mill || "Tall i millioner kroner";
      th0.appendChild(eF); th0.appendChild(eM);
      hRad.appendChild(th0);
      cfg.kolonner.forEach(function(kol) {
        var th = document.createElement("th");
        th.innerHTML = kol.label.replace("\n", "<br>");
        th.className = kol.klass || "";
        th.style.cssText = "background:#eaf3de;color:#27500a;font-weight:600;font-size:11px;padding:8px 10px;text-align:right;border-bottom:1px solid #c0dd97;white-space:nowrap";
        hRad.appendChild(th);
      });
      thead.appendChild(hRad); table.appendChild(thead);

      var tbody  = document.createElement("tbody");
      var idTell = 0;

      function tilMill(str) {
        var ren = str.replace(/\s/g, "").replace(",", ".");
        var n   = parseFloat(ren);
        if (isNaN(n) || str === "0") return "0";
        return (n / 1000).toFixed(1).replace(".", ",");
      }

      function lagTallCelle(v, klass, erProsent) {
        var td = document.createElement("td");
        td.className = klass || "";
        td.style.cssText = "padding:6px 10px;text-align:right;color:#27500a;font-variant-numeric:tabular-nums;white-space:nowrap";
        if (erProsent) { td.textContent = v; return td; }
        var sf = document.createElement("span"); sf.className = "tall-full"; sf.textContent = v;
        var sm = document.createElement("span"); sm.className = "tall-mill"; sm.textContent = tilMill(v);
        td.appendChild(sf); td.appendChild(sm);
        return td;
      }

      function lagTabellRader(rader, nivaa, forelderGruppe) {
        rader.forEach(function(rad) {
          var id      = "tr" + (++idTell);
          var harBarn = rad.barn && rad.barn.length > 0;
          var tr      = document.createElement("tr");
          var klasser = [];
          if (rad.type === "sum")       { klasser.push("rad-sum");       tr.style.cssText = "font-weight:700;background:#eaf3de;border-top:0.5px solid #c0dd97;border-bottom:0.5px solid #c0dd97"; }
          if (rad.type === "highlight") { klasser.push("rad-highlight"); tr.style.cssText = "font-weight:700;background:#c0dd97;border-top:1px solid #3b6d11;border-bottom:1px solid #3b6d11"; }
          if (rad.type === "prosent")   { klasser.push("rad-prosent");   tr.style.cssText = "font-size:11px;background:#f6f8f4;font-style:italic"; }
          if (rad.type === "seksjon")   { klasser.push("rad-seksjon");   tr.style.cssText = "background:#f0f7e8;border-top:1px solid #c0dd97"; }
          if (forelderGruppe)           { klasser.push("gruppe-" + forelderGruppe); tr.classList.add("skjult"); }
          tr.className = klasser.join(" ");

          if (rad.type === "seksjon") {
            var td = document.createElement("td");
            td.setAttribute("colspan", cfg.kolonner.length + 1);
            td.style.cssText = "font-weight:600;color:#27500a;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;padding:5px 10px";
            td.textContent = rad.tekst;
            tr.appendChild(td); tbody.appendChild(tr); return;
          }

          var td0   = document.createElement("td");
          var celle = document.createElement("div"); celle.style.cssText = "display:flex;align-items:center;gap:6px";
          var btn   = document.createElement("button");
          btn.style.cssText = "width:16px;height:16px;border-radius:3px;background:#eaf3de;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:#3b6d11;flex-shrink:0;transition:transform 0.15s";
          btn.textContent = "▶";
          if (!harBarn) btn.style.visibility = "hidden";

          if (harBarn) {
            btn.addEventListener("click", function(e) {
              e.stopPropagation();
              var erApen = btn.dataset.open === "1";
              btn.dataset.open = erApen ? "0" : "1";
              btn.style.transform = erApen ? "" : "rotate(90deg)";
              document.querySelectorAll(".gruppe-" + id).forEach(function(el) {
                var grupper = Array.from(el.classList).filter(function(c) { return c.startsWith("gruppe-"); });
                var erDirekte = grupper.length === 1 + (forelderGruppe ? 1 : 0);
                if (erApen) {
                  el.classList.add("skjult");
                  el.querySelectorAll("[data-open='1']").forEach(function(b) { b.dataset.open = "0"; b.style.transform = ""; });
                } else if (erDirekte) {
                  el.classList.remove("skjult");
                }
              });
            });
          }

          td0.style.cssText = "padding:6px 10px;text-align:left;color:#173404;padding-left:" + (8 + nivaa * 18) + "px";
          celle.appendChild(btn); celle.appendChild(document.createTextNode(rad.tekst));
          td0.appendChild(celle); tr.appendChild(td0);

          rad.v.forEach(function(v, i) {
            tr.appendChild(lagTallCelle(v, kolKlasser[i], rad.type === "prosent"));
          });

          tbody.appendChild(tr);
          if (harBarn) lagTabellRader(rad.barn, nivaa + 1, id);
        });
      }

      lagTabellRader(cfg.rader, 0, null);
      table.appendChild(tbody);
      tWrap.appendChild(table);
      blokk.appendChild(tWrap);
    }
  }

  // =========================
  // Innholdsblokker per mål
  // =========================
  function renderInnhold(innhold, planId) {
    var TYPE_MAP = {
      701100000: "Tekst",
      701100001: "Bilde",
      701100002: "PBI-rapport",
      701100003: "Lenke",
      701100004: "JSON-kode"
    };
    var NIVAA_MAP  = { 701100000:"h2", 701100001:"h3", 701100002:"h4", 701100003:"h5" };
    var NIVAA_STIL = {
      701100000: "font-size:22px;font-weight:700;color:#173404;margin:0 0 10px",
      701100001: "font-size:18px;font-weight:600;color:#173404;margin:0 0 8px",
      701100002: "font-size:16px;font-weight:600;color:#27500a;margin:0 0 6px",
      701100003: "font-size:14px;font-weight:600;color:#3b6d11;margin:0 0 4px"
    };
    var FOOTER_PX = 30;

    var perMaal = new Map();
    innhold
      .filter(function(r) { return (r.innholdPlan || r.planID) === planId; })
      .sort(function(a, b) {
        return (a.visningsrekkefølge || a.innhold_rekkefølge || 0) - (b.visningsrekkefølge || b.innhold_rekkefølge || 0);
      })
      .forEach(function(rad) {
        var maalId = rad.innholdMaal || rad.maalID;
        if (!perMaal.has(maalId)) perMaal.set(maalId, []);
        perMaal.get(maalId).push(rad);
      });

    perMaal.forEach(function(rader, maalId) {
      var anchorId = "maal-" + safeId(maalId);
      var section  = document.getElementById(anchorId);
      if (!section) return;

      var blokk = document.createElement("div");
      blokk.className = "innhold-blokk";

      rader.forEach(function(rad) {
        var typeRaw   = rad.innholdstype;
        var type      = TYPE_MAP[typeRaw] || typeRaw || "Tekst";
        var brodtekst = rad.brodtekst     || rad.innhold         || null;
        var mediaUrl  = rad.mediaUrl      || rad.bildeUrl        || (type === "Bilde"      ? rad.innhold_url_json : null) || null;
        var pbiUrl    = rad.pbiUrl        ||                        (type === "PBI-rapport" ? rad.innhold_url_json : null) || null;
        var lenkeUrl  = rad.vedleggUrl    ||                        (type === "Lenke"       ? rad.innhold_url_json : null) || null;
        var jsonData  = rad.json          ||                        (type === "JSON-kode"   ? rad.innhold_url_json : null) || null;
        var altTekst  = rad.bildeAltTekst || rad.alternativ_tekst || "";
        var bredde    = rad.innholdBredde || rad.innhold_bredde   || null;
        var høyde     = rad.innholdHøyde  || rad.innhold_hoyde    || null;
        var nivaaRaw  = rad.overskriftNivaa || rad.overskrift_nivaa || null;

        if (rad.overskrift) {
          var tag  = NIVAA_MAP[nivaaRaw]  || "h3";
          var stil = NIVAA_STIL[nivaaRaw] || "font-size:14px;font-weight:600;color:#173404;margin:0 0 6px";
          var hEl  = document.createElement(tag);
          hEl.textContent = rad.overskrift;
          hEl.style.cssText = stil;
          blokk.appendChild(hEl);
        }

        if (brodtekst) {
          var p = document.createElement("p"); p.textContent = brodtekst; blokk.appendChild(p);
        }

        if (mediaUrl && type === "Bilde") {
          var img = document.createElement("img");
          img.src = mediaUrl; img.alt = altTekst; img.className = "innhold-bilde";
          if (bredde) img.style.maxWidth = bredde + "px";
          blokk.appendChild(img);
        }

        if (pbiUrl) {
          var origW   = bredde || 600;
          var iframeH = høyde  || 400;
          var pbiHeader = document.createElement("div"); pbiHeader.className = "innhold-pbi-header";
          var pbiIcon = document.createElement("i"); pbiIcon.className = "ti ti-chart-bar"; pbiIcon.setAttribute("aria-hidden", "true");
          var pbiSpan = document.createElement("span"); pbiSpan.appendChild(pbiIcon); pbiSpan.appendChild(document.createTextNode(" " + (rad.overskrift || "Power BI-rapport")));
          var pbiLink = document.createElement("a"); pbiLink.href = pbiUrl; pbiLink.target = "_blank"; pbiLink.rel = "noopener"; pbiLink.setAttribute("aria-label", "Åpne i nytt vindu"); pbiLink.style.color = "var(--green-600)";
          var extIcon = document.createElement("i"); extIcon.className = "ti ti-external-link"; pbiLink.appendChild(extIcon);
          pbiHeader.appendChild(pbiSpan); pbiHeader.appendChild(pbiLink); blokk.appendChild(pbiHeader);
          var wrapper = document.createElement("div");
          wrapper.style.cssText = "overflow:hidden;border-radius:0 0 8px 8px;width:" + (origW+20) + "px;max-width:99%;margin:0 auto;border:none;height:" + (iframeH-FOOTER_PX) + "px";
          var iframe = document.createElement("iframe"); iframe.src = pbiUrl;
          iframe.setAttribute("width", String(origW+20)); iframe.setAttribute("height", String(iframeH+FOOTER_PX));
          iframe.setAttribute("scrolling", "no"); iframe.setAttribute("frameborder", "0");
          iframe.allowFullscreen = true; iframe.style.cssText = "border:none;display:block";
          wrapper.appendChild(iframe); blokk.appendChild(wrapper);
        }

        if (lenkeUrl) {
          var a = document.createElement("a"); a.href = lenkeUrl; a.className = "innhold-vedlegg"; a.target = "_blank"; a.rel = "noopener";
          var vIcon = document.createElement("div"); vIcon.className = "innhold-vedlegg-icon";
          var vI = document.createElement("i"); vI.className = "ti ti-link"; vI.setAttribute("aria-hidden", "true"); vIcon.appendChild(vI);
          var vInfo = document.createElement("div"); vInfo.className = "innhold-vedlegg-info";
          var vName = document.createElement("div"); vName.className = "innhold-vedlegg-name"; vName.textContent = rad.vedleggEtikett || rad.overskrift || "Åpne lenke"; vInfo.appendChild(vName);
          var vArrow = document.createElement("div"); vArrow.className = "vedlegg-arrow";
          var vArrowI = document.createElement("i"); vArrowI.className = "ti ti-external-link"; vArrowI.setAttribute("aria-hidden", "true"); vArrow.appendChild(vArrowI);
          a.appendChild(vIcon); a.appendChild(vInfo); a.appendChild(vArrow); blokk.appendChild(a);
        }

        if (jsonData) {
          if (jsonData.trim().startsWith("http")) {
            fetch(jsonData)
              .then(function(r) { return r.json(); })
              .then(function(parsed) { renderJSON(parsed, blokk); })
              .catch(function(e) { console.error("JSON-fetch feil:", rad.overskrift, e); });
          } else {
            try {
              renderJSON(JSON.parse(jsonData), blokk);
            } catch(e) {
              console.error("JSON-renderer feil:", rad.overskrift, e);
            }
          }
        }
      });

      section.appendChild(blokk);
    });
  }

  // =========================
  // Nederste maalnivaa
  // =========================
  function parseMaalTags(raw) {
    return String(raw || "")
      .split(";")
      .map(function(tag) { return tag.trim().replace(/^#/, ""); })
      .filter(Boolean);
  }

  function renderMaalgrep(goalsForPlan) {
    var children = new Map();
    var collator = new Intl.Collator("nb", { sensitivity: "base" });

    goalsForPlan.forEach(function(goal) {
      if (!goal.maalOverordnet) return;
      if (!children.has(goal.maalOverordnet)) children.set(goal.maalOverordnet, []);
      children.get(goal.maalOverordnet).push(goal);
    });

    children.forEach(function(arr) {
      arr.sort(function(a, b) { return collator.compare(a.maalNavn || "", b.maalNavn || ""); });
    });

    goalsForPlan.forEach(function(parentGoal) {
      if (parentGoal.maalType !== 701100002) return;

      var tiltak = (children.get(parentGoal.maalID) || []).filter(function(goal) {
        return goal.maalType === 701100003;
      });
      if (!tiltak.length) return;

      var section = document.getElementById("maal-" + safeId(parentGoal.maalID));
      if (!section || section.querySelector(".maalgrep")) return;

      var allTags = new Set();
      tiltak.forEach(function(goal) {
        parseMaalTags(goal.maalEmneknagger).forEach(function(tag) { allTags.add(tag); });
      });

      var wrap = document.createElement("div");
      wrap.className = "maalgrep";

      var header = document.createElement("div");
      header.className = "maalgrep-header";

      var title = document.createElement("h3");
      title.textContent = "Hvordan gjør vi det?";

      var meta = document.createElement("div");
      meta.className = "maalgrep-meta";
      meta.textContent = tiltak.length + " grep" + (allTags.size ? " · " + allTags.size + " emner" : "");

      header.appendChild(title);
      header.appendChild(meta);
      wrap.appendChild(header);

      if (allTags.size) {
        var filters = document.createElement("div");
        filters.className = "maalgrep-filters";

        var allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = "maalgrep-filter active";
        allBtn.textContent = "Alle";
        allBtn.dataset.tag = "";
        filters.appendChild(allBtn);

        Array.from(allTags).sort(function(a, b) { return collator.compare(a, b); }).forEach(function(tag) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "maalgrep-filter";
          btn.textContent = "#" + tag;
          btn.dataset.tag = tag;
          filters.appendChild(btn);
        });

        wrap.appendChild(filters);
      }

      var list = document.createElement("div");
      list.className = "maalgrep-list";

      tiltak.forEach(function(goal, index) {
        var tags = parseMaalTags(goal.maalEmneknagger);
        var item = document.createElement("article");
        item.className = "maalgrep-item";
        item.dataset.tags = tags.join(" ");

        var number = document.createElement("div");
        number.className = "maalgrep-number";
        number.textContent = String(index + 1).padStart(2, "0");

        var body = document.createElement("div");
        body.className = "maalgrep-body";

        var text = document.createElement("div");
        text.className = "maalgrep-text";
        text.textContent = goal.maalNavn || "(uten navn)";
        body.appendChild(text);

        if (tags.length) {
          var tagWrap = document.createElement("div");
          tagWrap.className = "maalgrep-tags";
          tags.forEach(function(tag) {
            var chip = document.createElement("span");
            chip.className = "maalgrep-tag";
            chip.textContent = "#" + tag;
            tagWrap.appendChild(chip);
          });
          body.appendChild(tagWrap);
        }

        item.appendChild(number);
        item.appendChild(body);
        list.appendChild(item);
      });

      wrap.appendChild(list);
      wrap.addEventListener("click", function(e) {
        var btn = e.target.closest(".maalgrep-filter");
        if (!btn) return;

        var tag = btn.dataset.tag || "";
        wrap.querySelectorAll(".maalgrep-filter").forEach(function(filterBtn) {
          filterBtn.classList.toggle("active", filterBtn === btn);
        });
        wrap.querySelectorAll(".maalgrep-item").forEach(function(item) {
          var tags = (item.dataset.tags || "").split(" ");
          item.hidden = !!tag && !tags.includes(tag);
        });
      });

      section.appendChild(wrap);
    });
  }

  // =========================
  // Søk
  // =========================
  var searchData = { plans: [], goals: [], innhold: [] };
  function buildSearchIndex(plans, goals, innhold) { searchData = { plans: plans, goals: goals, innhold: innhold }; }

  function runSearch(query) {
    if (!searchResults) return;
    var q = query.trim().toLowerCase();
    if (q.length < 2) { searchResults.classList.remove("open"); searchResults.innerHTML = ""; return; }
    var planMap     = new Map(searchData.plans.map(function(p) { return [p.planID, p.planNavn]; }));
    var goalHits    = searchData.goals.filter(function(g) { return (g.maalNavn || "").toLowerCase().includes(q); });
    var innholdHits = searchData.innhold.filter(function(r) {
      return (r.overskrift || "").toLowerCase().includes(q) ||
             (r.brodtekst || r.innhold || "").toLowerCase().includes(q);
    });
    if (!goalHits.length && !innholdHits.length) {
      searchResults.innerHTML = "<div class=\"search-empty\">Ingen treff for «" + query.trim() + "»</div>";
      searchResults.classList.add("open"); return;
    }
    var groups = new Map();
    function getGroup(pid) {
      if (!groups.has(pid)) groups.set(pid, { planNavn: planMap.get(pid) || "Ukjent plan", goals: [], innhold: [] });
      return groups.get(pid);
    }
    goalHits.forEach(function(g) { getGroup(g.maalPlan).goals.push(g); });
    innholdHits.forEach(function(r) { getGroup(r.innholdPlan || r.planID).innhold.push(r); });
    searchResults.innerHTML = "";
    groups.forEach(function(group, pid) {
      var label = document.createElement("div"); label.className = "search-group-label"; label.textContent = group.planNavn; searchResults.appendChild(label);
      function makeItem(iconClass, title, sub, anchorId) {
        var item = document.createElement("div"); item.className = "search-result-item";
        item.innerHTML = "<i class=\"ti " + iconClass + " search-result-icon\" aria-hidden=\"true\"></i><div><div class=\"search-result-title\">" + title + "</div><div class=\"search-result-sub\">" + sub + "</div></div>";
        item.addEventListener("click", function() {
          searchResults.classList.remove("open"); if (searchInput) searchInput.value = "";
          if (pid !== currentPlanId) {
            history.pushState(null, "", "?id=" + encodeURIComponent(pid) + "#" + anchorId);
            currentPlanId = pid;
            init().then(function() { var el = document.getElementById(anchorId); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); });
          } else {
            var el = document.getElementById(anchorId); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        return item;
      }
      group.goals.forEach(function(g) { searchResults.appendChild(makeItem("ti-target", g.maalNavn || "", "Mål", "maal-" + safeId(g.maalID))); });
      group.innhold.forEach(function(r) { searchResults.appendChild(makeItem("ti-file-text", r.overskrift || "", group.planNavn, "maal-" + safeId(r.innholdMaal || r.maalID))); });
    });
    searchResults.classList.add("open");
  }

  var searchListenersAttached = false, mobileSearchListenersAttached = false;

  function attachSearchListeners() {
    if (searchListenersAttached || !searchInput) return; searchListenersAttached = true;
    searchInput.addEventListener("input", function() { runSearch(searchInput.value); });
    searchInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") { searchResults.classList.remove("open"); searchInput.value = ""; }
    });
    document.addEventListener("click", function(e) {
      if (searchInput && !searchInput.contains(e.target) && searchResults && !searchResults.contains(e.target)) {
        searchResults.classList.remove("open");
      }
    });
  }

  function attachMobileSearchListeners() {
    if (mobileSearchListenersAttached) return;
    var searchBtn     = document.getElementById("searchBtn");
    var searchWrapper = document.getElementById("search-wrapper");
    if (!searchBtn || !searchWrapper) return;
    mobileSearchListenersAttached = true;
    searchBtn.addEventListener("click", function() {
      var btnRect     = searchBtn.getBoundingClientRect();
      var rightOffset = window.innerWidth - btnRect.right;
      searchWrapper.style.right = rightOffset + "px";
      searchWrapper.style.width = "300px";
      searchWrapper.classList.add("mobile-open");
      searchBtn.style.background  = "transparent";
      searchBtn.style.borderColor = "transparent";
      var brandName = document.querySelector(".brand-name");
      if (brandName) brandName.style.display = "none";
      var menuIcon = menuBtn ? menuBtn.querySelector("i") : null;
      if (menuIcon) menuIcon.className = "ti ti-x";
      searchModeActive = true;
      if (searchInput) searchInput.focus();
    });
    if (searchInput) {
      searchInput.addEventListener("keydown", function(e) { if (e.key === "Escape") closeSearch(); });
    }
  }

  function navigateToPlan(planId) {
    currentPlanId = planId;
    updateKommuneplanButtonState();
    history.pushState(null, "", "?id=" + encodeURIComponent(planId) + (location.hash || ""));
    init();
  }

  async function init() {
    try {
      var results = await Promise.all([
        fetch(URL_PLAN,    { cache: "no-store" }).then(function(r) { return r.json(); }),
        fetch(URL_MAAL,    { cache: "no-store" }).then(function(r) { return r.json(); }),
        fetch(URL_INNHOLD, { cache: "no-store" }).then(function(r) { return r.json(); })
      ]);
      var plans   = results[0];
      var goals   = results[1];
      var innhold = results[2];

      buildTopMenu(plans);
      buildSearchIndex(plans, goals, innhold);
      attachDropdownListener();
      attachSearchListeners();
      attachMobileSearchListeners();
      clearUI();

      var plan = plans.find(function(p) { return p.planID === currentPlanId; });
      titleEl.textContent = plan ? plan.planNavn : "Plan ikke funnet";

      var goalsForPlan = goals.filter(function(m) { return m.maalPlan === currentPlanId; });
      if (!goalsForPlan.length) { contentEl.innerHTML = "<p>Ingen mål funnet for denne planen.</p>"; return; }

      var rootGoal = goalsForPlan.find(function(g) { return !g.maalOverordnet; });
      if (heroTittelEl)    heroTittelEl.textContent    = rootGoal ? rootGoal.maalNavn : "";
      if (heroMaalCountEl) heroMaalCountEl.textContent = goalsForPlan.length;

      buildTree(goalsForPlan);
      renderInnhold(innhold, currentPlanId);
      renderMaalgrep(goalsForPlan);
      setupScrollSpy();

      if (location.hash) {
        var el = document.getElementById(location.hash.substring(1));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return true;
    } catch(e) {
      titleEl.textContent  = "Feil";
      contentEl.innerHTML = "<p>Det oppstod en feil ved lasting av data.</p>";
      console.error(e);
    }
  }

  window.addEventListener("popstate", function() {
    var p = new URLSearchParams(location.search);
    currentPlanId = p.get("id") || DEFAULT_PLAN_ID;
    updateKommuneplanButtonState();
    init();
  });

  init();
})();
