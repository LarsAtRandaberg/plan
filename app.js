(() => {
  // ====== KONFIG ======
  const DEFAULT_PLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a"; // Kommuneplanens samfunnsdel

  // Bruk samme origin (GitHub Pages) – robust
  const URL_PLAN = "data/plan.json";
  const URL_MAAL = "data/maal.json";

  // ====== DOM ======
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarTitle = document.getElementById("sidebarTitle");
  const menuEl = document.getElementById("menu");
  const contentEl = document.getElementById("innhold");
  const titleEl = document.getElementById("tittel");

  // Hvis HTML-skjelettet mangler noe, stopp tidlig
  if (!menuEl || !contentEl || !titleEl) return;

  // ====== URL / PLAN-ID ======
  const params = new URLSearchParams(location.search);
  const explicitId = params.get("id");
  const planId = explicitId || DEFAULT_PLAN_ID;

  // Om id mangler: sett det i adresselinjen uten reload – behold hash
  if (!explicitId) {
    history.replaceState(null, "", `?id=${encodeURIComponent(DEFAULT_PLAN_ID)}${location.hash}`);
  }

  // Sidebar tittel i planmodus
  if (sidebarTitle) sidebarTitle.innerText = "Innhold";

  // Mobilmeny
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  }

  // ====== HJELPEFUNKSJONER ======
  function safeId(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "");
  }

  function ensureSection(goal) {
    const anchorId = `maal-${safeId(goal.maalID)}`;
    if (document.getElementById(anchorId)) return anchorId;

    const section = document.createElement("section");
    section.id = anchorId;
    section.innerHTML = `<h2>${goal.maalNavn || "(uten navn)"}</h2>`;
    contentEl.appendChild(section);
    return anchorId;
  }

  // Aktiv lenke + hold kun aktiv sti åpen (forhindrer “alt åpner seg”)
  function setActiveLink(activeSectionId) {
    // Marker aktiv lenke
    document.querySelectorAll("#menu a").forEach(a => {
      const isActive = a.getAttribute("href") === `#${activeSectionId}`;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });

    const activeLink = document.querySelector(`#menu a[href="#${activeSectionId}"]`);
    if (!activeLink) return;

    const path = [];
    let node = activeLink.closest(".node");
    while (node) {
      path.push(node);
      const parent = node.parentElement; // .children eller #menu
      node = parent ? parent.closest(".node") : null;
    }
    const pathSet = new Set(path);

    // Lukk alle åpne noder som ikke er i aktiv sti (men aldri nivå 0)
    document.querySelectorAll("#menu .node.open").forEach(n => {
      if (n.classList.contains("level-0")) return;
      if (!pathSet.has(n)) n.classList.remove("open");
    });

    // Åpne aktiv sti
    path.forEach(n => n.classList.add("open"));

    // Valgfritt, men praktisk: sørg for at aktiv lenke er synlig i sidebar
    try {
      activeLink.scrollIntoView({ block: "nearest" });
    } catch (_) {}
  }

  function setupScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) setActiveLink(visible[0].target.id);
    }, {
      root: null,
      rootMargin: "0px 0px -70% 0px",
      threshold: 0.01
    });

    sections.forEach(s => observer.observe(s));
    setActiveLink(sections[0].id);
  }

  // Tree rendering med “én åpen per nivå”
  function renderTree(goalsForPlan) {
    // Index: maalID -> mål
    const byId = new Map(goalsForPlan.map(g => [g.maalID, g]));

    // children: parentId -> []
    const children = new Map();
    const addChild = (parentId, child) => {
      if (!children.has(parentId)) children.set(parentId, []);
      children.get(parentId).push(child);
    };

    goalsForPlan.forEach(g => {
      const parentId = g.maalOverordnet;
      if (parentId && byId.has(parentId)) addChild(parentId, g);
      else addChild(null, g);
    });

    // Sorter alfabetisk (NB)
    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    for (const arr of children.values()) {
      arr.sort((a, b) => collator.compare(a.maalNavn || "", b.maalNavn || ""));
    }

    function renderNode(goal, level) {
      const anchorId = ensureSection(goal);

      const node = document.createElement("div");
      node.className = `node level-${Math.min(level, 3)}`;

      // Nivå 0 skal alltid være åpent
      if (level === 0) node.classList.add("open");

      const row = document.createElement("div");
      row.className = `row level-${Math.min(level, 3)}`;

      const kids = children.get(goal.maalID) || [];
      const hasKids = (level !== 0) && kids.length > 0;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = hasKids ? "toggle" : "toggle placeholder";
      toggle.setAttribute("aria-label", hasKids ? "Åpne/lukke" : "");

      toggle.addEventListener("click", () => {
        if (!hasKids) return;

        const parent = node.parentElement; // .children eller #menu
        const willOpen = !node.classList.contains("open");

        // Lukk søsken på samme nivå når vi åpner
        if (willOpen && parent) {
          Array.from(parent.children).forEach(el => {
            if (el !== node && el.classList && el.classList.contains("node")) {
              el.classList.remove("open");
            }
          });
        }
        node.classList.toggle("open");
      });

      const link = document.createElement("a");
      link.href = `#${anchorId}`;
      link.innerText = goal.maalNavn || "(uten navn)";
      link.addEventListener("click", () => {
        // Lukk meny på mobil etter navigasjon
        if (window.matchMedia("(max-width: 768px)").matches) {
          sidebar?.classList.remove("open");
        }
      });

      row.appendChild(toggle);
      row.appendChild(link);
      node.appendChild(row);

      const childWrap = document.createElement("div");
      childWrap.className = "children";
      node.appendChild(childWrap);

      kids.forEach(k => childWrap.appendChild(renderNode(k, level + 1)));
      return node;
    }

    // Render toppnivå
    (children.get(null) || []).forEach(g => {
      menuEl.appendChild(renderNode(g, 0));
    });
  }

  async function init() {
    // Nullstill flater
    menuEl.innerHTML = "";
    contentEl.innerHTML = "";

    // Hent data
    const [planer, maal] = await Promise.all([
      fetch(URL_PLAN, { cache: "no-store" }).then(r => r.json()),
      fetch(URL_MAAL, { cache: "no-store" }).then(r => r.json())
    ]);

    // Sett plan-tittel
    const plan = planer.find(p => p.planID === planId);
    titleEl.innerText = plan ? plan.planNavn : "Plan ikke funnet";

    // Filtrer mål for plan
    const goalsForPlan = maal.filter(m => m.maalPlan === planId);

    if (goalsForPlan.length === 0) {
      contentEl.innerHTML = "<p>Ingen mål funnet for denne planen.</p>";
      return;
    }

    // Bygg meny + innhold
    renderTree(goalsForPlan);

    // Scroll-spy
    setupScrollSpy();

    // Hvis hash peker på mål, prøv å scrolle dit etter at DOM er bygget
    if (location.hash && document.querySelector(location.hash)) {
      document.querySelector(location.hash).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  init().catch(err => {
    titleEl.innerText = "Feil";
    contentEl.innerHTML = "<p>Det oppstod en feil ved lasting av data.</p>";
    // Valgfritt: logg for debugging
    console.error(err);
  });
})();
``
