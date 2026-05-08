(() => {
  const DEFAULT_PLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a";

  const URL_PLAN = "data/plan.json";
  const URL_MAAL = "data/maal.json";

  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarTitle = document.getElementById("sidebarTitle");
  const menuEl = document.getElementById("menu");
  const contentEl = document.getElementById("innhold");
  const titleEl = document.getElementById("tittel");

  const topnav = document.getElementById("topnav");

  if (!menuEl || !contentEl || !titleEl) return;

  // Mobil: åpne/lukke innholdsmeny
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  }

  // URL -> plan
  const params = new URLSearchParams(location.search);
  const explicitId = params.get("id");
  let currentPlanId = explicitId || DEFAULT_PLAN_ID;

  // Hvis id mangler: sett default i URL uten reload (behold hash)
  if (!explicitId) {
    history.replaceState(
      null,
      "",
      `?id=${encodeURIComponent(DEFAULT_PLAN_ID)}${location.hash}`
    );
  }

  if (sidebarTitle) sidebarTitle.innerText = "Innhold";

  // ---------- helpers ----------
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

  function setActiveLink(activeSectionId) {
    document.querySelectorAll("#menu a").forEach(a => {
      const isActive = a.getAttribute("href") === `#${activeSectionId}`;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });

    const activeLink = document.querySelector(`#menu a[href="#${activeSectionId}"]`);
    if (!activeLink) return;

    // Åpne bare aktiv sti
    const path = [];
    let node = activeLink.closest(".node");
    while (node) {
      path.push(node);
      const parent = node.parentElement;
      node = parent ? parent.closest(".node") : null;
    }
    const pathSet = new Set(path);

    document.querySelectorAll("#menu .node.open").forEach(n => {
      if (n.classList.contains("level-0")) return;
      if (!pathSet.has(n)) n.classList.remove("open");
    });

    path.forEach(n => n.classList.add("open"));

    try { activeLink.scrollIntoView({ block: "nearest" }); } catch (_) {}
  }

  function setupScrollSpy() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) setActiveLink(visible[0].target.id);
    }, { root: null, rootMargin: "0px 0px -70% 0px", threshold: 0.01 });

    sections.forEach(s => observer.observe(s));
    setActiveLink(sections[0].id);
  }

  // ---------- kommuneplan-knapp state ----------
  function updateKommuneplanButtonState() {
    const btn = document.getElementById("btnKommuneplan");
    if (!btn) return;

    const isDefault = (currentPlanId === DEFAULT_PLAN_ID);

    btn.classList.toggle("is-selected", isDefault);
    btn.classList.toggle("is-disabled", isDefault);

    if (isDefault) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }

  // ---------- top menu ----------
  function planTypeLabel(planTyper) {
    const labels = {
      701100000: "Kommuneplanen",
      701100001: "Strategier",
      701100002: "Handlings- og økonomiplaner"
    };
    return labels[planTyper] || `Plantype ${planTyper}`;
  }

  function buildTopMenu(plans) {
    if (!topnav) return;
    topnav.innerHTML = "";

    const groups = new Map();
    plans.forEach(p => {
      const key = p.planTyper;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });

    const typeKeys = Array.from(groups.keys()).sort((a, b) => a - b);

    const collator = new Intl.Collator("nb", { sensitivity: "base" });
    typeKeys.forEach(k => {
      groups.get(k).sort((a, b) => collator.compare(a.planNavn || "", b.planNavn || ""));
    });

    typeKeys.forEach(typeKey => {
      const dd = document.createElement("div");
      dd.className = "dropdown";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropbtn";
      btn.setAttribute("aria-haspopup", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = planTypeLabel(typeKey);

      // Dette er knappen vi vil markere som valgt/inaktiv når DEFAULT_PLAN_ID er valgt
      if (typeKey === 701100000) btn.id = "btnKommuneplan";

      const menu = document.createElement("div");
      menu.className = "dropdown-menu";

      groups.get(typeKey).forEach(p => {
        const a = document.createElement("a");
        a.href = `?id=${encodeURIComponent(p.planID)}`;
        a.textContent = p.planNavn || "(uten navn)";

        // Naviger uten full reload
        a.addEventListener("click", (e) => {
          e.preventDefault();
          navigateToPlan(p.planID);
          dd.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        });

        menu.appendChild(a);
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();

        // Lukk andre åpne dropdowns
        document.querySelectorAll(".dropdown.open").forEach(x => {
          if (x !== dd) x.classList.remove("open");
        });

        dd.classList.toggle("open");
        btn.setAttribute("aria-expanded", dd.classList.contains("open") ? "true" : "false");
      });

      dd.appendChild(btn);
      dd.appendChild(menu);
      topnav.appendChild(dd);
    });

    // Lukk ved klikk utenfor
    document.addEventListener("click", (e) => {
      document.querySelectorAll(".dropdown.open").forEach(dd => {
        if (!dd.contains(e.target)) dd.classList.remove("open");
      });
    });

    // Viktig: Nå finnes btnKommuneplan i DOM → oppdater state
    updateKommuneplanButtonState();
  }

  // ---------- tree ----------
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
      if (level === 0) node.classList.add("open");

      const row = document.createElement("div");
      row.className = `row level-${Math.min(level, 3)}`;

      const kids = children.get(goal.maalID) || [];
      const hasKids = (level !== 0) && kids.length > 0;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = hasKids ? "toggle" : "toggle placeholder";

      toggle.addEventListener("click", () => {
        if (!hasKids) return;

        const parent = node.parentElement;
        const willOpen = !node.classList.contains("open");

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

    (children.get(null) || []).forEach(g => menuEl.appendChild(renderNode(g, 0)));
  }

  // ---------- navigation ----------
  function navigateToPlan(planId) {
    currentPlanId = planId;
    updateKommuneplanButtonState();
    history.pushState(null, "", `?id=${encodeURIComponent(planId)}${location.hash || ""}`);
    init(); // re-render
  }

  // ---------- init ----------
  async function init() {
    try {
      const [plans, goals] = await Promise.all([
        fetch(URL_PLAN, { cache: "no-store" }).then(r => r.json()),
        fetch(URL_MAAL, { cache: "no-store" }).then(r => r.json())
      ]);

      // Bygg toppmeny (må skje før vi oppdaterer kommuneplan-knapp state)
      buildTopMenu(plans);

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

      if (location.hash && document.querySelector(location.hash)) {
        document.querySelector(location.hash).scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {
      titleEl.innerText = "Feil";
      contentEl.innerHTML = "<p>Det oppstod en feil ved lasting av data.</p>";
      console.error(e);
    }
  }

  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    currentPlanId = p.get("id") || DEFAULT_PLAN_ID;
    updateKommuneplanButtonState();
    init();
  });

  init();
})();
