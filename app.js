(function () {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const menuEl = document.getElementById("menu");
  const contentEl = document.getElementById("innhold");
  const titleEl = document.getElementById("tittel");

  const params = new URLSearchParams(window.location.search);
  const planId = params.get("id");

  // Beholder dine eksisterende URL-er (som fungerer hos deg)
  const URL_PLAN = "https://raw.githubusercontent.com/LarsAtRandaberg/plan/main/data/plan.json";
  const URL_MAAL = "https://raw.githubusercontent.com/LarsAtRandaberg/plan/main/data/maal.json";

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  function safeId(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, "-")
      .replace(/\-+/g, "-")
      .replace(/^\-|\-$/g, "");
  }

  function setActiveLink(activeSectionId) {
    // Marker aktiv lenke
    document.querySelectorAll("#menu a").forEach(a => {
      const isActive = a.getAttribute("href") === `#${activeSectionId}`;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });

    // Hold kun aktiv sti åpen (så scroll ikke åpner "alt")
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

    // Lukk alle åpne som ikke er i aktiv sti (men aldri nivå 0)
    document.querySelectorAll("#menu .node.open").forEach(n => {
      if (n.classList.contains("level-0")) return;
      if (!pathSet.has(n)) n.classList.remove("open");
    });

    // Åpne aktiv sti
    path.forEach(n => n.classList.add("open"));
  }

  function setupScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
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

  function ensureSection(m) {
    const anchorId = `maal-${safeId(m.maalID)}`;
    if (document.getElementById(anchorId)) return anchorId;

    const section = document.createElement("section");
    section.id = anchorId;

    // Viktig: ekte HTML (ikke &lt;h2&gt;)
    section.innerHTML = `<h2>${m.maalNavn || "(uten navn)"}</h2>`;

    contentEl.appendChild(section);
    return anchorId;
  }

  function renderNodeFactory(children) {
    const collator = new Intl.Collator("nb", { sensitivity: "base" });

    // Sorter alle "barnelister" alfabetisk én gang
    for (const arr of children.values()) {
      arr.sort((a, b) => collator.compare(a.maalNavn || "", b.maalNavn || ""));
    }

    function renderNode(m, level) {
      const anchorId = ensureSection(m);

      const node = document.createElement("div");
      node.className = `node level-${Math.min(level, 3)}`;

      // Nivå 0 skal alltid være åpent
      if (level === 0) node.classList.add("open");

      const row = document.createElement("div");
      row.className = `row level-${Math.min(level, 3)}`;

      const kids = children.get(m.maalID) || [];
      const hasKids = (level !== 0) && (kids.length > 0);

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = hasKids ? "toggle" : "toggle placeholder";
      toggle.setAttribute("aria-label", hasKids ? "Åpne/lukke" : "");

      toggle.addEventListener("click", () => {
        if (!hasKids) return;

        const parent = node.parentElement; // .children eller #menu
        const willOpen = !node.classList.contains("open");

        // Bare én åpen pr nivå: lukk søsken hvis vi åpner
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
      link.innerText = m.maalNavn || "(uten navn)";
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 768px)").matches) {
          sidebar.classList.remove("open");
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

    return renderNode;
  }

  async function init() {
    // Hvis ingen id: vis enkel beskjed (du kan senere gjøre dette om til planliste)
if (!planId) {
  // LISTE-MODUS: vis planliste i hovedflate og bruk sidebar som navigasjon
  titleEl.innerText = "Planer";
  document.getElementById("sidebarTitle").innerText = "Planer";
  menuEl.innerHTML = "";
  contentEl.innerHTML = "<p>Velg en plan i listen.</p>";

  const planer = await fetch(URL_PLAN).then(r => r.json());

  // Bygg liste i sidebar
  planer.forEach(p => {
    const a = document.createElement("a");
    a.href = `?id=${encodeURIComponent(p.planID)}`;
    a.innerText = p.planNavn || "(uten navn)";
    menuEl.appendChild(a);
  });

  // I liste-modus trenger vi ikke scroll-spy eller mål
  return;
}
    // Sett tittel
    fetch(URL_PLAN)
      .then(r => r.json())
      .then(planer => {
        const plan = planer.find(p => p.planID === planId);
        titleEl.innerText = plan ? plan.planNavn : "Plan ikke funnet";
      });

    // Bygg meny + innhold
    const maal = await fetch(URL_MAAL).then(r => r.json());

    const maalForPlan = maal
      .filter(m => m.maalPlan === planId)
      .filter(m => m.maalPlan);

    menuEl.innerHTML = "";
    contentEl.innerHTML = "";

    if (maalForPlan.length === 0) {
      contentEl.innerHTML = "<p>Ingen mål funnet for denne planen.</p>";
      return;
    }

    const byId = new Map(maalForPlan.map(m => [m.maalID, m]));

    // children: parentId -> [barn]
    const children = new Map();
    function addChild(parentId, child) {
      if (!children.has(parentId)) children.set(parentId, []);
      children.get(parentId).push(child);
    }

    maalForPlan.forEach(m => {
      const parentId = m.maalOverordnet;
      if (parentId && byId.has(parentId)) addChild(parentId, m);
      else addChild(null, m);
    });

    const renderNode = renderNodeFactory(children);

    // Render toppnivå
    (children.get(null) || []).forEach(m => {
      menuEl.appendChild(renderNode(m, 0));
    });

    // Start scroll-spy når seksjoner finnes
    setupScrollSpy();
  }

  init();
})();
