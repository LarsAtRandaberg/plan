(() => {
  if (!document.body.classList.contains("page-v2")) return;

  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const reportSidebar = document.getElementById("reportSidebar");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const reportSidebarCloseBtn = document.getElementById("reportSidebarCloseBtn");
  const pageOverlay = document.getElementById("pageOverlay");
  const peekButton = document.getElementById("peekButton");
  const peekButtonLabel = document.getElementById("peekButtonLabel");
  const planRail = document.getElementById("planRail");
  const reportRail = document.getElementById("reportRail");
  const modeBadge = document.getElementById("mode-badge");
  const modeSummary = document.getElementById("mode-summary");
  const modeIntroCard = document.getElementById("mode-intro-card");
  const sidebarModeLabel = document.getElementById("sidebar-mode-label");
  const sidebarPanelTitle = document.getElementById("sidebar-panel-title");
  const planContent = document.getElementById("innhold");
  const reportContent = document.getElementById("reportContent");
  const reportNavLinks = Array.from(document.querySelectorAll(".report-nav-link"));
  const modeButtons = Array.from(document.querySelectorAll("[data-mode-target]"));
  const planMapWorkspace = document.querySelector(".plan-map-workspace");
  const planMapTree = document.getElementById("planMapTree");
  const planMapStrategyColumn = document.querySelector(".plan-map-column-strategi");
  const planMapHopColumn = document.querySelector(".plan-map-column-hop");
  const planMapLines = document.querySelector(".plan-map-lines");
  const planMapStrategyTitle = document.getElementById("planMapStrategyTitle");
  const planMapStrategyList = document.getElementById("planMapStrategyList");
  const planMapHopTitle = document.getElementById("planMapHopTitle");
  const planMapHopList = document.getElementById("planMapHopList");
  const planContextsById = {
    "063a2e01-35e6-f011-8407-000d3add2e1a": {
      sectionKey: null,
      leafKey: null,
      strategyKey: null
    },
    "e3112baa-7858-f111-bec7-7c1e52370ef7": {
      sectionKey: "gode-hverdagsliv",
      leafKey: "gode-oppvekstvilkar",
      strategyKey: null
    },
    "7df8f7f0-e0e7-f011-8407-000d3add2e1a": {
      sectionKey: "gode-hverdagsliv",
      leafKey: "gode-oppvekstvilkar",
      strategyKey: "95-prosent"
    },
    "c18f1e69-6a49-f111-bec7-7c1e52370ef7": {
      sectionKey: "gode-hverdagsliv",
      leafKey: "gode-oppvekstvilkar",
      strategyKey: "95-prosent"
    }
  };

  const planMenuModel = {
    rootLabel: "Sammen skaper vi den grønne landsbyen",
    sections: [
      {
        key: "areal-utvikling",
        label: "Areal og utvikling",
        leaves: [
          {
            key: "attraktivt-sentrum",
            label: "Attraktivt sentrum",
            subpath: ["Helhetlig stedsutvikling og bokvalitet"],
            strategyPlanTitle: "Arealstrategien",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "boligvekst",
                label: "Øke andelen boliger nær sentrum og tjenester.",
                hopItems: [
                  { id: "3021", title: "Tiltak 3021", description: "Fortetting og reguleringsoppfølging i sentrumsaksen." },
                  { id: "3024", title: "Tiltak 3024", description: "Utvikle møteplasser og forbindelser mellom bolig og sentrum." }
                ]
              },
              {
                key: "gang-sykkel",
                label: "Styrke gang- og sykkelforbindelser i prioriterte områder.",
                hopItems: [
                  { id: "3030", title: "Tiltak 3030", description: "Prioritere trygg skolevei og forbindelser til kollektivknutepunkt." },
                  { id: "3032", title: "Tiltak 3032", description: "Oppgradere gang- og sykkeltraseer i sentrumsområdet." }
                ]
              }
            ]
          }
        ]
      },
      {
        key: "gode-hverdagsliv",
        label: "Gode hverdagsliv",
        leaves: [
          {
            key: "god-alderdom",
            label: "God alderdom",
            subpath: ["Aktive og trygge liv gjennom hele livsløpet"],
            strategyPlanTitle: "Leve hele livet",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "forebyggende-helse",
                label: "Styrke forebyggende hjemmebesøk og tidlig oppfølging.",
                hopItems: [
                  { id: "4104", title: "Tiltak 4104", description: "Styrke forebyggende oppfølging og hjemmebaserte tjenester." },
                  { id: "4109", title: "Tiltak 4109", description: "Utvikle møteplasser og aktivitetstilbud for eldre." }
                ]
              }
            ]
          },
          {
            key: "gode-arbeidsplasser",
            label: "Gode arbeidsplasser",
            subpath: ["Kompetanse, rekruttering og heltidskultur"],
            strategyPlanTitle: "Arbeidsgiverstrategien",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "heltid",
                label: "Øke heltidsandelen i prioriterte tjenester.",
                hopItems: [
                  { id: "2211", title: "Tiltak 2211", description: "Teste nye turnusmodeller og kompetanseplaner." },
                  { id: "2216", title: "Tiltak 2216", description: "Målrettet rekruttering innen helse og oppvekst." }
                ]
              }
            ]
          },
          {
            key: "gode-fellesskap",
            label: "Gode fellesskap",
            subpath: ["Tilhørighet og deltakelse i nærmiljøet"],
            strategyPlanTitle: "Frivillighetsstrategien",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "frivillighet",
                label: "Styrke samarbeid mellom kommune og frivillighet.",
                hopItems: [
                  { id: "5122", title: "Tiltak 5122", description: "Felles møteplasser og samordning for lag og foreninger." },
                  { id: "5128", title: "Tiltak 5128", description: "Støtteordninger for deltakelse og inkludering." }
                ]
              }
            ]
          },
          {
            key: "gode-oppvekstvilkar",
            label: "Gode oppvekstvilkår",
            subpath: ["Tidlig innsats, helsefremmende og forebyggende arbeid"],
            strategyPlanTitle: "Oppvekstplanen",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "95-prosent",
                label: "95 prosent av elevene få opplæringen sin innenfor det ordinære tilbudet med nødvendige universelle tilpasninger.",
                hopItems: [
                  { id: "4524", title: "Tiltak 4524", description: "Styrke tidlig innsats og tverrfaglig oppfølging i skoleløpet." },
                  { id: "4532", title: "Tiltak 4532", description: "Videreutvikle universelle læringsmiljø og støttesystem i skolene." }
                ]
              },
              {
                key: "naervaer",
                label: "Øke nærvær og tidlig oppfølging rundt barn og unge med sammensatte behov.",
                hopItems: [
                  { id: "4541", title: "Tiltak 4541", description: "Tydelig oppfølgingsløp for nærvær og tverrfaglig innsats." },
                  { id: "4548", title: "Tiltak 4548", description: "Kompetanseløft i forebyggende arbeid og foreldresamarbeid." }
                ]
              },
              {
                key: "laget-rundt-barnet",
                label: "Styrke laget rundt barnet i overgangene mellom barnehage, skole og hjelpetjenester.",
                hopItems: [
                  { id: "4554", title: "Tiltak 4554", description: "Felles overgangsrutiner mellom barnehage, skole og støttetjenester." },
                  { id: "4560", title: "Tiltak 4560", description: "Samordne innsats rundt barn med behov for tilrettelegging." }
                ]
              }
            ]
          }
        ]
      },
      {
        key: "kommunen-er-vi",
        label: "Kommunen er vi",
        leaves: [
          {
            key: "god-tjenestekvalitet",
            label: "God tjenestekvalitet",
            subpath: ["Åpen, samordnet og lærende organisasjon"],
            strategyPlanTitle: "Digitaliseringsstrategien",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "digitale-tjenester",
                label: "Forenkle tjenester og innsikt for innbyggere og ansatte.",
                hopItems: [
                  { id: "1120", title: "Tiltak 1120", description: "Modernisere digitale arbeidsflater og selvbetjening." },
                  { id: "1128", title: "Tiltak 1128", description: "Bedre datagrunnlag for styring og oppfølging." }
                ]
              }
            ]
          }
        ]
      },
      {
        key: "lokalsamfunnet",
        label: "Lokalsamfunnet",
        leaves: [
          {
            key: "tryggt-naermiljo",
            label: "Trygt nærmiljø",
            subpath: ["Nærhet, beredskap og sosial bærekraft"],
            strategyPlanTitle: "Beredskapsplanen",
            hopPlanTitle: "Handlings- og økonomiplanen 2027-2030",
            strategies: [
              {
                key: "beredskap",
                label: "Styrke samhandling og robusthet i lokalsamfunnet.",
                hopItems: [
                  { id: "6203", title: "Tiltak 6203", description: "Trening, samøving og forebyggende beredskapstiltak." },
                  { id: "6208", title: "Tiltak 6208", description: "Bedre informasjonsberedskap og lokalt samarbeid." }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const planSelection = {
    sectionKey: null,
    leafKey: null,
    strategyKey: null
  };

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function getCurrentLeaf() {
    if (!planSelection.leafKey) return null;
    for (const section of planMenuModel.sections) {
      const leaf = section.leaves.find((item) => item.key === planSelection.leafKey);
      if (leaf) return { section, leaf };
    }
    return null;
  }

  function getCurrentStrategy() {
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf || !planSelection.strategyKey) return null;
    return currentLeaf.leaf.strategies.find((item) => item.key === planSelection.strategyKey) || null;
  }

  function getVisibleDepth() {
    if (!planSelection.leafKey) return 1;
    if (!planSelection.strategyKey) return 2;
    return 3;
  }

  function createButton(className, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function syncPlanContextFromLocation() {
    const params = new URLSearchParams(location.search);
    const planId = params.get("id");
    const context = planId ? planContextsById[planId] : null;
    if (!context) return;
    planSelection.sectionKey = context.sectionKey;
    planSelection.leafKey = context.leafKey;
    planSelection.strategyKey = context.strategyKey;
    if (body.dataset.mode === "rapport") {
      setMode("plan");
      return;
    }
    renderPlanMenus();
  }

  function renderPlanTree() {
    if (!planMapTree) return;
    const currentLeaf = getCurrentLeaf();
    const activeSectionKey = planSelection.sectionKey || (currentLeaf ? currentLeaf.section.key : null);
    const activeLeafKey = currentLeaf ? currentLeaf.leaf.key : null;
    planMapTree.innerHTML = "";

    const root = document.createElement("div");
    root.className = "plan-map-tree-root";
    root.textContent = planMenuModel.rootLabel;
    planMapTree.appendChild(root);

    planMenuModel.sections.forEach((section) => {
      const group = document.createElement("section");
      group.className = "plan-map-tree-group";
      if (section.key === activeSectionKey) {
        group.classList.add("is-active");
      }

      const branch = createButton(
        "plan-map-tree-branch" + (section.key === activeSectionKey ? " is-open is-active" : ""),
        section.label,
        () => {
          if (planSelection.sectionKey === section.key && !planSelection.leafKey) {
            planSelection.sectionKey = null;
          } else {
            planSelection.sectionKey = section.key;
          }
          planSelection.leafKey = null;
          planSelection.strategyKey = null;
          renderPlanMenus();
        }
      );
      branch.setAttribute("aria-expanded", section.key === activeSectionKey ? "true" : "false");
      group.appendChild(branch);

      if (section.key === activeSectionKey) {
        const children = document.createElement("div");
        children.className = "plan-map-tree-children";

        section.leaves.forEach((leaf) => {
          const leafButton = createButton(
            "plan-map-tree-leaf" + (leaf.key === activeLeafKey ? " is-active" : ""),
            leaf.label,
            () => {
              planSelection.sectionKey = section.key;
              planSelection.leafKey = leaf.key;
              planSelection.strategyKey = null;
              renderPlanMenus();
            }
          );
          if (leaf.key === activeLeafKey) {
            leafButton.setAttribute("aria-current", "true");
          }
          children.appendChild(leafButton);

          if (leaf.key === activeLeafKey && Array.isArray(leaf.subpath) && leaf.subpath.length) {
            const subpath = document.createElement("div");
            subpath.className = "plan-map-tree-subpath";

            leaf.subpath.forEach((step, index) => {
              const subLeaf = document.createElement(index === leaf.subpath.length - 1 ? "button" : "div");
              subLeaf.className = index === leaf.subpath.length - 1 ? "plan-map-node plan-map-node-selected" : "plan-map-tree-subleaf";
              subLeaf.textContent = step;
              if (subLeaf.tagName === "BUTTON") {
                subLeaf.type = "button";
                subLeaf.addEventListener("click", () => {
                  planSelection.sectionKey = section.key;
                  planSelection.leafKey = leaf.key;
                  renderPlanMenus();
                });
              }
              subpath.appendChild(subLeaf);
            });

            children.appendChild(subpath);
          }
        });

        group.appendChild(children);
      }

      planMapTree.appendChild(group);
    });
  }

  function renderStrategyMenu() {
    if (!planMapStrategyList || !planMapStrategyTitle) return;
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf) {
      planMapStrategyTitle.textContent = "";
      planMapStrategyList.innerHTML = "";
      return;
    }
    const { leaf } = currentLeaf;
    const activeStrategy = getCurrentStrategy();
    planMapStrategyTitle.textContent = leaf.strategyPlanTitle;
    planMapStrategyList.innerHTML = "";

    leaf.strategies.forEach((strategy) => {
      const button = createButton(
        "plan-map-strategy-item" + (activeStrategy && strategy.key === activeStrategy.key ? " is-active" : ""),
        strategy.label,
        () => {
          planSelection.strategyKey = strategy.key;
          renderPlanMenus();
        }
      );
      if (activeStrategy && strategy.key === activeStrategy.key) {
        button.setAttribute("aria-current", "true");
      }
      planMapStrategyList.appendChild(button);
    });
  }

  function renderHopMenu() {
    if (!planMapHopList || !planMapHopTitle) return;
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf) {
      planMapHopTitle.textContent = "";
      planMapHopList.innerHTML = "";
      return;
    }
    const { leaf } = currentLeaf;
    const activeStrategy = getCurrentStrategy();
    planMapHopTitle.textContent = leaf.hopPlanTitle;
    planMapHopList.innerHTML = "";
    if (!activeStrategy) {
      return;
    }

    activeStrategy.hopItems.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "plan-map-hop-card is-linked";
      card.innerHTML = `<strong>${item.title}</strong><p>${item.description}</p>`;
      planMapHopList.appendChild(card);
    });
  }

  function renderPlanMenus() {
    const depth = getVisibleDepth();
    if (sidebar) {
      sidebar.dataset.depth = String(depth);
    }
    if (planMapWorkspace) {
      planMapWorkspace.dataset.depth = String(depth);
    }
    if (planMapStrategyColumn) {
      planMapStrategyColumn.hidden = depth < 2;
    }
    if (planMapHopColumn) {
      planMapHopColumn.hidden = depth < 3;
    }
    if (planMapLines) {
      planMapLines.hidden = depth < 3;
    }
    renderPlanTree();
    renderStrategyMenu();
    renderHopMenu();
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (reportSidebar) reportSidebar.classList.remove("open");
    syncOverlay();
  }

  function syncOverlay() {
    if (!pageOverlay) return;
    const anyOpen = (sidebar && sidebar.classList.contains("open")) || (reportSidebar && reportSidebar.classList.contains("open"));
    pageOverlay.hidden = !(isMobile() && anyOpen);
  }

  function setActiveReportLink(hash) {
    const activeHash = hash || "#rapport-sammendrag";
    reportNavLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === activeHash);
    });
  }

  function openCurrentMenu() {
    if (body.dataset.mode === "rapport") {
      if (reportSidebar) reportSidebar.classList.add("open");
      if (sidebar) sidebar.classList.remove("open");
    } else {
      if (sidebar) sidebar.classList.add("open");
      if (reportSidebar) reportSidebar.classList.remove("open");
    }
    syncOverlay();
  }

  function applyModeVisibility(isReport) {
    if (planContent) planContent.hidden = isReport;
    if (reportContent) reportContent.hidden = !isReport;
    if (reportSidebar) reportSidebar.hidden = !isReport && !isMobile();
    if (sidebar) sidebar.hidden = isReport && !isMobile();
  }

  function setMode(mode) {
    const isReport = mode === "rapport";
    body.dataset.mode = isReport ? "rapport" : "plan";

    modeButtons.forEach((button) => {
      const active = button.dataset.modeTarget === body.dataset.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (menuBtn) {
      menuBtn.innerHTML = isReport
        ? "<i class=\"ti ti-layout-sidebar-right-expand\" aria-hidden=\"true\"></i>"
        : "<i class=\"ti ti-layout-sidebar-left-expand\" aria-hidden=\"true\"></i>";
      menuBtn.setAttribute("aria-label", isReport ? "Åpne rapportmeny" : "Åpne planmeny");
    }
    if (modeBadge) modeBadge.textContent = isReport ? "Rapportmodus" : "Planmodus";
    if (sidebarModeLabel) sidebarModeLabel.textContent = isReport ? "Rapport" : "Plan";
    if (sidebarPanelTitle) sidebarPanelTitle.textContent = isReport ? "Rapportmeny" : "Planmeny";
    if (peekButtonLabel) peekButtonLabel.textContent = isReport ? "Rapport" : "Plan";

    if (modeSummary) {
      modeSummary.textContent = isReport
        ? "Rapportmodus prioriterer økonomi, avvik og årsoppfølging fremfor full målrapportering i tertial."
        : "Planinnhold og navigasjon følger valgt mål.";
    }

    if (modeIntroCard) {
      modeIntroCard.innerHTML = isReport
        ? "<div class=\"mode-intro-kicker\">Rapport</div><div class=\"mode-intro-title\">Styring og oppfølging</div><p>Rapportmodus skal ikke skape forventning om tertialrapportering på alle mål. Her er fokus økonomi, avvik, risiko og prioriterte forhold.</p>"
        : "<div class=\"mode-intro-kicker\">Plan</div><div class=\"mode-intro-title\">Planstruktur og mål</div><p>I planmodus er planhierarkiet primærnavigasjon. På desktop viser venstresiden nå tre samtidige menyflater som henger sammen.</p>";
    }

    applyModeVisibility(isReport);
    closeSidebar();
    if (isReport) {
      setActiveReportLink(location.hash || "#rapport-sammendrag");
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.modeTarget);
    });
  });

  [planRail, reportRail].forEach((rail) => {
    if (!rail) return;
    rail.addEventListener("click", () => {
      setMode(rail.dataset.modeTarget);
    });
  });

  if (menuBtn) {
    menuBtn.addEventListener("click", (event) => {
      event.preventDefault();
      openCurrentMenu();
    });
  }
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeSidebar);
  if (reportSidebarCloseBtn) reportSidebarCloseBtn.addEventListener("click", closeSidebar);
  if (pageOverlay) pageOverlay.addEventListener("click", closeSidebar);
  if (peekButton) peekButton.addEventListener("click", openCurrentMenu);

  reportNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveReportLink(link.getAttribute("href"));
      if (isMobile()) closeSidebar();
    });
  });

  window.addEventListener("hashchange", () => {
    if (body.dataset.mode === "rapport") setActiveReportLink(location.hash || "#rapport-sammendrag");
  });

  const originalPushState = history.pushState.bind(history);
  history.pushState = function(...args) {
    originalPushState(...args);
    syncPlanContextFromLocation();
  };

  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = function(...args) {
    originalReplaceState(...args);
    syncPlanContextFromLocation();
  };

  if (sidebar) {
    const observer = new MutationObserver(syncOverlay);
    observer.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
  }
  if (reportSidebar) {
    const observer = new MutationObserver(syncOverlay);
    observer.observe(reportSidebar, { attributes: true, attributeFilter: ["class"] });
  }

  window.addEventListener("resize", () => {
    applyModeVisibility(body.dataset.mode === "rapport");
    syncOverlay();
  });

  window.addEventListener("popstate", syncPlanContextFromLocation);

  syncPlanContextFromLocation();
  renderPlanMenus();
  syncOverlay();
  setMode(body.dataset.mode || "plan");
})();
