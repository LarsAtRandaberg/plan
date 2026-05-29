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
  const d3lib = globalThis.d3;
  const OPPVEKSTPLAN_ID = "e3112baa-7858-f111-bec7-7c1e52370ef7";
  const HOP_PLAN_ID = "c18f1e69-6a49-f111-bec7-7c1e52370ef7";
  let planGoalsData = [];
  let connectorUpdateTimer = null;
  const planContextsById = {
    "063a2e01-35e6-f011-8407-000d3add2e1a": {
      entryColumn: "kommune",
      sectionKey: null,
      leafKey: null,
      strategyKey: null
    },
    "e3112baa-7858-f111-bec7-7c1e52370ef7": {
      entryColumn: "strategi",
      sectionKey: "gode-hverdagsliv",
      leafKey: "gode-oppvekstvilkar",
      strategyKey: null
    },
    "7df8f7f0-e0e7-f011-8407-000d3add2e1a": {
      entryColumn: "hop",
      sectionKey: "gode-hverdagsliv",
      leafKey: "gode-oppvekstvilkar",
      strategyKey: null
    },
    "c18f1e69-6a49-f111-bec7-7c1e52370ef7": {
      entryColumn: "hop",
      sectionKey: "gode-hverdagsliv",
      leafKey: "gode-oppvekstvilkar",
      strategyKey: null
    }
  };

  const planMenuModel = {
    sections: [
      {
        key: "areal-utvikling",
        label: "Areal og utvikling",
        leaves: [
          {
            key: "attraktivt-sentrum",
            label: "Attraktivt sentrum",
            selectedSubgoalKey: "stedsutvikling",
            subgoals: [
              { key: "stedsutvikling", label: "Helhetlig stedsutvikling og bokvalitet" }
            ],
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
            selectedSubgoalKey: "aktive-trygge-liv",
            subgoals: [
              { key: "aktive-trygge-liv", label: "Legge til rette for at innbyggerne er aktive, kan bo godt hjemme og opplever økt grad av egenmestring og dermed utsatt hjelpebehov" },
              { key: "aldersvennlige-boliger", label: "Planlegge slik at en tilstrekkelig andel av ny boligmasse i kommunen blir aldersvennlige boliger" },
              { key: "teknologi-kompetanse", label: "Ta i bruk ny teknologi, økt kompetanse og tverrfaglig samhandling" },
              { key: "aldersvennlig-samfunn", label: "Legge til rette for et aldersvennlig samfunn" },
              { key: "helsefremmende-omgivelser", label: "Legge til rette for omgivelser som fremmer helse og livskvalitet og forebygger sykdommer" }
            ],
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
            selectedSubgoalKey: "inkludering-arbeid",
            subgoals: [
              { key: "inkludering-arbeid", label: "Arbeide for inkludering og arbeidsdeltakelse for flere" },
              { key: "tidlig-innsats-unge", label: "Prioritere tidlig innsats og gi unge muligheter" },
              { key: "trygge-naermiljo", label: "Styrke fellesskapet og legge til rette for trygge, helsefremmende nærmiljøer" },
              { key: "samarbeid-naeringsliv", label: "Samarbeide tett med næringslivet, frivillighet og innbyggere" },
              { key: "flere-arbeidsplasser", label: "Skape flere og mer varierte arbeidsplasser" }
            ],
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
            selectedSubgoalKey: "livskvalitet-tilhoerighet",
            subgoals: [
              { key: "livskvalitet-tilhoerighet", label: "Sammen arbeide for at alle innbyggerne skal oppleve god livskvalitet, tilhørighet, trygghet, inkludering og kan bidra i samfunnet" },
              { key: "idrett-kultur", label: "Legge til rette for et inkluderende og nyskapende idretts- og kulturtilbud som fremmer fellesskap og utvikling og styrker stedsutviklingen" },
              { key: "delta-i-fellesskapet", label: "Legge til rette for at alle innbyggere i alle livsfaser kan delta i fellesskapet" }
            ],
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
            selectedSubgoalKey: "tidlig-innsats",
            subgoals: [
              { key: "bygge-boliger", label: "Bygge boliger og fysiske omgivelser som det er godt og trygt å vokse opp i" },
              { key: "aktiviteter-robusthet", label: "Legge til rette for aktiviteter som fremmer robusthet og sosialt samhold" },
              { key: "tidlig-innsats", label: "Tidlig innsats, helsefremmende og forebyggende arbeid" },
              { key: "sterke-fellesskap", label: "Bygge sterke og inkluderende fellesskap hvor barn og unge ferdes" },
              { key: "mestring-tilhoerighet", label: "Fremme mestring og tilhørighet, hvor barn kan utvikle selvtillit og delta aktivt i samfunnet" }
            ],
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
            selectedSubgoalKey: "helhetlig-organisasjon",
            subgoals: [
              { key: "helhetlig-organisasjon", label: "Vi setter felleskapet først og tenker helhetlig." },
              { key: "kompetente-medarbeidere", label: "Vi er et lag av kompetente og engasjerte medarbeidere." },
              { key: "myndiggjorte-medarbeidere", label: "Gjennom tillit og myndiggjorte medarbeidere utvikler vi organisasjonen og den enkelte." },
              { key: "forbedre-forenkle", label: "Alle medarbeidere har ansvar for å forbedre og forenkle arbeidsoppgaver." },
              { key: "innovative-losninger", label: "Vi tar i bruk innovative løsninger på en trygg og sikker måte." }
            ],
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
            selectedSubgoalKey: "samhandling-beredskap",
            subgoals: [
              { key: "samhandling-beredskap", label: "Styrke samhandling og robusthet i lokalsamfunnet." }
            ],
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
    focusColumn: "kommune",
    sectionKey: null,
    leafKey: null,
    strategyKey: null,
    hopKey: null
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

  function getCurrentHopItem() {
    const currentStrategy = getCurrentStrategy();
    if (!currentStrategy || !planSelection.hopKey || !Array.isArray(currentStrategy.hopItems)) return null;
    return currentStrategy.hopItems.find((item) => getNodeKey(item) === planSelection.hopKey) || null;
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
  }

  function getNodeKey(item) {
    return item.key || item.id || slugify(item.label || item.title || "");
  }

  function getLeafByKey(leafKey) {
    for (const section of planMenuModel.sections) {
      const leaf = section.leaves.find((item) => item.key === leafKey);
      if (leaf) return leaf;
    }
    return null;
  }

  function ensureValidStrategySelection() {
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf) {
      planSelection.strategyKey = null;
      return;
    }
    const hasSelectedStrategy = currentLeaf.leaf.strategies.some((item) => item.key === planSelection.strategyKey);
    if (!hasSelectedStrategy) {
      planSelection.strategyKey = null;
    }
  }

  function ensureValidHopSelection() {
    const currentStrategy = getCurrentStrategy();
    if (!currentStrategy || !Array.isArray(currentStrategy.hopItems)) {
      planSelection.hopKey = null;
      return;
    }
    const hasSelectedHop = currentStrategy.hopItems.some((item) => getNodeKey(item) === planSelection.hopKey);
    if (!hasSelectedHop) {
      planSelection.hopKey = null;
    }
  }

  function assignOppvekstSubgoalIds() {
    const oppvekstLeaf = getLeafByKey("gode-oppvekstvilkar");
    if (!oppvekstLeaf || !Array.isArray(oppvekstLeaf.subgoals)) return;

    const subgoalIdByKey = {
      "bygge-boliger": "f0276f4c-7149-f111-bec7-7c1e52370ef7",
      "aktiviteter-robusthet": "6069035b-7149-f111-bec7-7c1e52370ef7",
      "tidlig-innsats": "6169035b-7149-f111-bec7-7c1e52370ef7",
      "sterke-fellesskap": "34b4f963-7149-f111-bec7-7c1e52370ef7",
      "mestring-tilhoerighet": "6edb91e7-7149-f111-bec7-7c1e52370ef7"
    };

    oppvekstLeaf.subgoals.forEach((item) => {
      item.id = subgoalIdByKey[item.key] || item.id || null;
    });
  }

  function buildOppvekstStrategiesFromMaal(goals) {
    const oppvekstLeaf = getLeafByKey("gode-oppvekstvilkar");
    if (!oppvekstLeaf) return;

    const selectedSubgoal = oppvekstLeaf.subgoals.find((item) => item.key === oppvekstLeaf.selectedSubgoalKey);
    const selectedSubgoalId = selectedSubgoal?.id || null;

    if (!selectedSubgoalId) {
      oppvekstLeaf.strategies = [];
      return;
    }

    oppvekstLeaf.strategies = goals
      .filter((goal) => goal.maalPlan === OPPVEKSTPLAN_ID && goal.maalOverordnet === selectedSubgoalId)
      .map((goal) => ({
        key: slugify(goal.maalID || goal.maalNavn),
        id: goal.maalID,
        label: goal.maalNavn,
        hopItems: []
      }));
  }

  function refreshDynamicLeafData() {
    if (planGoalsData.length) {
      buildOppvekstStrategiesFromMaal(planGoalsData);
      ensureValidStrategySelection();
      ensureValidHopSelection();
    }
  }

  async function hydratePlanModelFromData() {
    try {
      const response = await fetch("data/maal.json", { cache: "no-store" });
      if (!response.ok) return;
      const goals = await response.json();
      if (!Array.isArray(goals)) return;

      planGoalsData = goals;
      buildOppvekstStrategiesFromMaal(planGoalsData);

      const oppvekstLeaf = getLeafByKey("gode-oppvekstvilkar");
      if (oppvekstLeaf && oppvekstLeaf.strategies.length) {
        const firstStrategyKey = oppvekstLeaf.strategies[0].key;
        [HOP_PLAN_ID, "7df8f7f0-e0e7-f011-8407-000d3add2e1a"].forEach((planId) => {
          if (planContextsById[planId]) {
            planContextsById[planId].strategyKey = firstStrategyKey;
          }
        });
      }

      ensureValidStrategySelection();
      ensureValidHopSelection();
    } catch (error) {
      console.warn("Kunne ikke laste maal.json for v2-planmenyen", error);
    }
  }

  function getLayoutState() {
    if (planSelection.focusColumn === "hop" && !planSelection.hopKey) {
      return "hop-entry";
    }
    if (planSelection.focusColumn === "strategi" && !planSelection.strategyKey) {
      return "strategi-entry";
    }
    if (!planSelection.leafKey) {
      return "kommune-only";
    }
    if (!planSelection.strategyKey) {
      return "kommune-plus-strategi";
    }
    return "full";
  }

  function createButton(className, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function getNodeLabel(node) {
    return node.label || node.title || "";
  }

  function hasSelectedDescendant(node, selectedKey) {
    if (!node || !selectedKey) return false;
    const nodeKey = getNodeKey(node);
    if (nodeKey === selectedKey) return true;
    if (!Array.isArray(node.children)) return false;
    return node.children.some((child) => hasSelectedDescendant(child, selectedKey));
  }

  function renderMenuNodes(container, nodes, options = {}, level = 0) {
    const {
      selectedKey = null,
      onSelect = () => {},
      leafClassName = "plan-map-tree-leaf",
      activeLeafClassName = "plan-map-node plan-map-node-selected",
      childLeafClassName = "plan-map-tree-subleaf"
    } = options;

    nodes.forEach((node) => {
      const nodeKey = getNodeKey(node);
      const children = Array.isArray(node.children) ? node.children : [];
      const hasChildren = children.length > 0;
      const isActive = nodeKey === selectedKey;
      const isOpen = hasChildren && hasSelectedDescendant(node, selectedKey);

      const group = document.createElement("section");
      group.className = "plan-map-tree-group";
      if (isActive || isOpen) {
        group.classList.add("is-active");
      }

      let controlClass = "plan-map-tree-leaf";
      if (hasChildren) {
        controlClass = "plan-map-tree-branch" + (isOpen ? " is-open is-active" : "");
      } else if (isActive) {
        controlClass = activeLeafClassName;
      } else if (level > 0) {
        controlClass = childLeafClassName;
      } else {
        controlClass = leafClassName;
      }

      const control = createButton(controlClass, getNodeLabel(node), () => onSelect(node));
      if (hasChildren) {
        control.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
      if (isActive) {
        control.setAttribute("aria-current", "true");
      }
      group.appendChild(control);

      if (!hasChildren && node.description) {
        const description = document.createElement("div");
        description.className = "plan-map-tree-meta";
        description.textContent = node.description;
        group.appendChild(description);
      }

      if (hasChildren && isOpen) {
        const childContainer = document.createElement("div");
        childContainer.className = "plan-map-tree-children";
        renderMenuNodes(childContainer, children, options, level + 1);
        group.appendChild(childContainer);
      }

      container.appendChild(group);
    });
  }

  function syncPlanContextFromLocation() {
    const params = new URLSearchParams(location.search);
    const planId = params.get("id");
    const context = planId ? planContextsById[planId] : null;
    if (!context) return;
    planSelection.focusColumn = context.entryColumn || "kommune";
    planSelection.sectionKey = context.sectionKey;
    planSelection.leafKey = context.leafKey;
    planSelection.strategyKey = context.strategyKey;
    planSelection.hopKey = null;
    ensureValidStrategySelection();
    ensureValidHopSelection();
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
          planSelection.focusColumn = "kommune";
          if (planSelection.sectionKey === section.key && !planSelection.leafKey) {
            planSelection.sectionKey = null;
          } else {
            planSelection.sectionKey = section.key;
          }
          planSelection.leafKey = null;
          planSelection.strategyKey = null;
          planSelection.hopKey = null;
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
              planSelection.focusColumn = "kommune";
              planSelection.sectionKey = section.key;
              planSelection.leafKey = leaf.key;
              planSelection.strategyKey = null;
              planSelection.hopKey = null;
              renderPlanMenus();
            }
          );
          if (leaf.key === activeLeafKey) {
            leafButton.setAttribute("aria-current", "true");
          }
          children.appendChild(leafButton);

          if (leaf.key === activeLeafKey && Array.isArray(leaf.subgoals) && leaf.subgoals.length) {
            const subpath = document.createElement("div");
            subpath.className = "plan-map-tree-subpath";

            leaf.subgoals.forEach((goal) => {
              const isSelectedSubgoal = goal.key === leaf.selectedSubgoalKey;
              const subLeaf = document.createElement("button");
              subLeaf.type = "button";
              subLeaf.className = isSelectedSubgoal ? "plan-map-node plan-map-node-selected" : "plan-map-tree-subleaf";
              subLeaf.textContent = goal.label;
              subLeaf.addEventListener("click", () => {
                planSelection.focusColumn = "kommune";
                planSelection.sectionKey = section.key;
                planSelection.leafKey = leaf.key;
                leaf.selectedSubgoalKey = goal.key;
                planSelection.strategyKey = null;
                planSelection.hopKey = null;
                refreshDynamicLeafData();
                renderPlanMenus();
              });
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

    if (!Array.isArray(leaf.strategies) || leaf.strategies.length === 0) {
      return;
    }
    renderMenuNodes(planMapStrategyList, leaf.strategies, {
      selectedKey: activeStrategy ? activeStrategy.key : null,
      leafClassName: "plan-map-node plan-map-list-node",
      activeLeafClassName: "plan-map-node plan-map-list-node plan-map-node-selected",
      childLeafClassName: "plan-map-tree-subleaf",
      onSelect: (strategy) => {
        planSelection.strategyKey = getNodeKey(strategy);
        planSelection.hopKey = null;
        planSelection.focusColumn = "full";
        renderPlanMenus();
      }
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

    if (!Array.isArray(activeStrategy.hopItems) || activeStrategy.hopItems.length === 0) {
      return;
    }
    renderMenuNodes(planMapHopList, activeStrategy.hopItems, {
      selectedKey: planSelection.hopKey,
      leafClassName: "plan-map-hop-card plan-map-list-node",
      activeLeafClassName: "plan-map-hop-card plan-map-list-node is-active",
      childLeafClassName: "plan-map-tree-subleaf",
      onSelect: (item) => {
        planSelection.hopKey = getNodeKey(item);
        planSelection.focusColumn = "full";
        renderPlanMenus();
      }
    });
  }

  function buildRoundedConnectorPath(points) {
    if (!d3lib || !points?.length) return "";

    const path = d3lib.path();
    const radius = 14;
    path.moveTo(points[0][0], points[0][1]);

    for (let index = 1; index < points.length; index += 1) {
      const prev = points[index - 1];
      const current = points[index];
      const next = points[index + 1];

      if (!next) {
        path.lineTo(current[0], current[1]);
        continue;
      }

      const dx1 = current[0] - prev[0];
      const dy1 = current[1] - prev[1];
      const dx2 = next[0] - current[0];
      const dy2 = next[1] - current[1];
      const len1 = Math.hypot(dx1, dy1);
      const len2 = Math.hypot(dx2, dy2);
      const cornerRadius = Math.min(radius, len1 / 2, len2 / 2);

      const startX = current[0] - ((dx1 / len1) * cornerRadius || 0);
      const startY = current[1] - ((dy1 / len1) * cornerRadius || 0);
      const endX = current[0] + ((dx2 / len2) * cornerRadius || 0);
      const endY = current[1] + ((dy2 / len2) * cornerRadius || 0);

      path.lineTo(startX, startY);
      path.quadraticCurveTo(current[0], current[1], endX, endY);
    }

    return path.toString();
  }

  function drawConnectorGroup(svgSelection, sourceNode, targetNodes, workspaceRect, extraClass = "") {
    if (!d3lib || !svgSelection || !sourceNode || !targetNodes.length || !workspaceRect) return;

    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRects = targetNodes.map((node) => node.getBoundingClientRect());
    const targetLeft = Math.min(...targetRects.map((rect) => rect.left - workspaceRect.left));
    const sourceX = sourceRect.right - workspaceRect.left + 8;
    const sourceY = sourceRect.top + (sourceRect.height / 2) - workspaceRect.top;
    const trunkX = targetLeft - 18;
    const branchEndX = targetLeft - 6;
    const targetCenters = targetRects.map((rect) => rect.top + (rect.height / 2) - workspaceRect.top);
    const trunkTop = Math.min(...targetCenters);
    const trunkBottom = Math.max(...targetCenters);
    const classes = {
      source: `plan-map-connector ${extraClass} plan-map-connector--source`,
      trunk: `plan-map-connector ${extraClass} plan-map-connector--trunk`,
      branch: `plan-map-connector ${extraClass} plan-map-connector--branch`
    };

    svgSelection.append("path")
      .attr("class", classes.source)
      .attr("d", buildRoundedConnectorPath([
        [sourceX, sourceY],
        [trunkX - 18, sourceY],
        [trunkX, sourceY]
      ]));

    svgSelection.append("path")
      .attr("class", classes.trunk)
      .attr("d", buildRoundedConnectorPath([
        [trunkX, trunkTop],
        [trunkX, trunkBottom]
      ]));

    targetCenters.forEach((targetY) => {
      const direction = targetY >= sourceY ? 1 : -1;
      const branchStartY = Math.abs(targetY - sourceY) < 1 ? targetY : targetY - (direction * 10);

      svgSelection.append("path")
        .attr("class", classes.branch)
        .attr("d", buildRoundedConnectorPath([
          [trunkX, branchStartY],
          [trunkX, targetY],
          [branchEndX, targetY]
        ]));
    });
  }

  function updatePlanConnectors(layoutState) {
    if (!planMapLines) return;

    const shouldShowLeftConnector = layoutState === "kommune-plus-strategi" || layoutState === "full";
    const shouldShowRightConnector = layoutState === "full" && planMapHopList?.querySelector(".plan-map-list-node");
    const showAny = shouldShowLeftConnector || shouldShowRightConnector;

    planMapLines.replaceChildren();
    planMapLines.classList.toggle("is-visible", showAny);
    planMapLines.setAttribute("aria-hidden", showAny ? "false" : "true");

    if (!showAny) return;

    const workspaceRect = planMapWorkspace?.getBoundingClientRect();
    const leftNode = planMapWorkspace?.querySelector(".plan-map-column-kommune .plan-map-node-selected");
    const middleNode = planMapWorkspace?.querySelector(".plan-map-column-strategi .plan-map-node-selected");
    const strategyNodes = Array.from(planMapWorkspace?.querySelectorAll(".plan-map-column-strategi .plan-map-list-node") || []);
    const hopNodes = Array.from(planMapWorkspace?.querySelectorAll(".plan-map-column-hop .plan-map-list-node") || []);

    if (!workspaceRect || !leftNode || !strategyNodes.length) return;

    if (!d3lib) return;

    const svg = d3lib.select(planMapLines)
      .append("svg")
      .attr("class", "plan-map-connectors")
      .attr("viewBox", `0 0 ${workspaceRect.width} ${workspaceRect.height}`)
      .attr("width", workspaceRect.width)
      .attr("height", workspaceRect.height);

    drawConnectorGroup(svg, leftNode, strategyNodes, workspaceRect, "plan-map-connector--left-group");

    if (!shouldShowRightConnector || !middleNode || !hopNodes.length) return;

    drawConnectorGroup(svg, middleNode, hopNodes, workspaceRect, "plan-map-connector--right-group");
  }

  function scheduleConnectorUpdate() {
    const layoutState = getLayoutState();
    requestAnimationFrame(() => updatePlanConnectors(layoutState));
    if (connectorUpdateTimer) {
      clearTimeout(connectorUpdateTimer);
    }
    connectorUpdateTimer = setTimeout(() => updatePlanConnectors(getLayoutState()), 1050);
  }

  function renderPlanMenus() {
    const layoutState = getLayoutState();
    if (sidebar) {
      sidebar.dataset.layout = layoutState;
    }
    if (planMapWorkspace) {
      planMapWorkspace.dataset.layout = layoutState;
    }

    const columnStatesByLayout = {
      "kommune-only": { kommune: "open", strategi: "hidden", hop: "hidden" },
      "kommune-plus-strategi": { kommune: "open", strategi: "open", hop: "hidden" },
      "strategi-entry": { kommune: "collapsed", strategi: "open", hop: "hidden" },
      "hop-entry": { kommune: "collapsed", strategi: "hidden", hop: "open" },
      "full": { kommune: "open", strategi: "open", hop: "open" }
    };

    const columnStates = columnStatesByLayout[layoutState] || columnStatesByLayout["kommune-only"];
    const columnMap = {
      kommune: planMapTree ? planMapTree.closest(".plan-map-column") : null,
      strategi: planMapStrategyColumn,
      hop: planMapHopColumn
    };

    Object.entries(columnMap).forEach(([key, column]) => {
      if (!column) return;
      const state = columnStates[key];
      column.dataset.state = state;
      column.classList.toggle("is-visible", state !== "hidden");
      column.classList.toggle("is-collapsed", state === "collapsed");
      column.classList.toggle("is-hidden", state === "hidden");
      column.setAttribute("aria-hidden", state === "hidden" ? "true" : "false");
    });

    renderPlanTree();
    renderStrategyMenu();
    renderHopMenu();
    scheduleConnectorUpdate();
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
    if (body.dataset.mode === "plan") {
      scheduleConnectorUpdate();
    }
  });

  window.addEventListener("popstate", syncPlanContextFromLocation);

  async function init() {
    assignOppvekstSubgoalIds();
    await hydratePlanModelFromData();
    syncPlanContextFromLocation();
    renderPlanMenus();
    syncOverlay();
    setMode(body.dataset.mode || "plan");
  }

  init();
})();
