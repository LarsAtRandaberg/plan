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
