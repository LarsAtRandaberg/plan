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
