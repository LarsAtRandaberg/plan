(() => {(() => ===============================
  // KONFIG
  // ===============================
  const DEFAULT_PLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a"; // Kommuneplanens samfunnsdel

  // Bruk samme origin for GitHub Pages (robust)
  const URL_PLAN = "data/plan.json";
  const URL_MAAL = "data/maal.json";

  // ===============================
  // DOM
  // ===============================
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarTitle = document.getElementById("sidebarTitle");
  const menuEl = document.getElementById("menu");
  const contentEl = document.getElementById("innhold");
  const titleEl = document.getElementById("tittel");

  if (!menuEl || !contentEl || !titleEl) return;

  // Mobil: åpne/lukke sidebar
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  }

  // ===============================
  // URL / PLAN-ID
  // ===============================
  const params = new URLSearchParams(location.search);
  const originalId = params.get("id");
  let currentPlanId = originalId || DEFAULT_PLAN_ID;

  // Hvis id mangler: skriv default i adresselinjen uten reload, behold hash
  if (!originalId) {
    history.replaceState(
      null,
      "",
      `?id=${encodeURIComponent(DEFAULT_PLAN_ID)}${location.hash}`
    );
  }

  // Sidebar-tittel i planmodus
  if (sidebarTitle) sidebarTitle.innerText = "Innhold";

  // ===============================
  // HJELPERE
  // ===============================
  function safeId(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "");
  }

  function clearUI() {
    menuEl.innerHTML = "";
    contentEl.innerHTML = "";
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

  // Marker aktiv lenke + hold kun aktiv sti åpen (hindrer “alt åpner seg”)
  function setActiveLink(activeSectionId) {
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

    document.querySelectorAll("#menu .node.open").forEach(n => {
      if (n.classList.contains("level-0")) return;
      if (!pathSet.has(n)) n.classList.remove("open");
    });

    path.forEach(n => n.classList.add("open"));

    // Hold aktiv lenke synlig i sidebaren (nice-to-have)
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

  // Bytt plan (brukes av toppmeny senere)
  function navigateToPlan(planId, hash = "") {
    currentPlanId = planId;
    history.pushState(null, "", `?id=${encodeURIComponent(planId)}${hash}`);
    render(); // re-render uten full refresh
  }

  // Gjør funksjonen tilgjengelig globalt (toppen kan kalle den senere)
  window.PlanPortal = {
    navigateToPlan
  };

  // ===============================
  // DATA + RENDER
  // ===============================
  let plans = [];
  let goals = [];

  function buildTree(goalsForPlan) {
    const byId = new Map(goalsForPlan.map(g => [g.maalID, g]));

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

    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    for (const arr of children.values()) {
      arr.sort((a, b) => collator.compare(a.maalNavn || "", b.maalNavn || ""));
    }

    function renderNode(goal, level) {
      const anchorId = ensureSection(goal);

      const node = document.createElement("div");
      node.className = `node level-${Math.min(level, 3)}`;
      if (level === 0) node.classList.add("open"); // nivå 0 alltid åpent

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

        // Kun én åpen pr nivå: lukk søsken hvis vi åpner
        if (willOpen && parent) {
          Array.from(parent.children).forEach(el => {
            if (el !== node && el.classList && el.classList.contains("node")) {
              el.classList.remove("open");
            }
          });
        }
        node.classList.toggle("open");
      });

      const a = document.createElement("a");
      a.href = `#${anchorId}`;
      a.innerText = goal.maalNavn || "(uten navn)";
      a.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
          sidebar?.classList.remove("open");
        }
      });

      row.appendChild(toggle);
      row.appendChild(a);
      node.appendChild(row);

      const childWrap = document.createElement("div");
      childWrap.className = "children";
      node.appendChild(childWrap);

      kids.forEach(k => childWrap.appendChild(renderNode(k, level + 1)));
      return node;
    }

    (children.get(null) || []).forEach(g => {
      menuEl.appendChild(renderNode(g, 0));
    });
  }

  function render() {
    clearUI();

    const plan = plans.find(p => p.planID === currentPlanId);
    titleEl.innerText = plan ? plan.planNavn : "Plan ikke funnet";

    const goalsForPlan = goals.filter(m => m.maalPlan === currentPlanId);

    if (goalsForPlan.length === 0) {
      contentEl.innerHTML = "<p>Ingen mål funnet for denne planen.</p>";
      return;
    }

    buildTree(goalsForPlan);
    setupScrollSpy();

    // Hvis det ligger en hash i URL: scroll til den (etter at DOM er bygget)
    if (location.hash && document.querySelector(location.hash)) {
      document.querySelector(location.hash).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function init() {
    try {
      const [p, m] = await Promise.all([
        fetch(URL_PLAN, { cache: "no-store" }).then(r => r.json()),
        fetch(URL_MAAL, { cache: "no-store" }).then(r => r.json())
      ]);
      plans = p;
      goals = m;
      render();
    } catch (e) {
      titleEl.innerText = "Feil";
      contentEl.innerHTML = "<p>Det oppstod en feil ved lasting av data.</p>";
      console.error(e);
    }
  }

  // Håndter back/forward i nettleser
  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    currentPlanId = p.get("id") || DEFAULT_PLAN_ID;
    render();
  });

  init();
})();
