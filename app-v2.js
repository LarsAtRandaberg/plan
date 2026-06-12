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
  const modeButtons = Array.from(document.querySelectorAll(".mode-chip[data-mode-target]"));
  const planMapPrototype = document.getElementById("planMapPrototype");
  const planMapWorkspace = document.querySelector(".plan-map-workspace");
  const planMapLinks = document.getElementById("planMapLinks");
  const planMapTree = document.getElementById("planMapTree");
  const planMapStrategyColumn = document.querySelector(".plan-map-column-strategi");
  const planMapStrategyClose = document.getElementById("planMapStrategyClose");
  const planMapHopColumn = document.querySelector(".plan-map-column-hop");
  const planMapHopClose = document.getElementById("planMapHopClose");
  const planMapStrategyTitle = document.getElementById("planMapStrategyTitle");
  const planMapStrategyList = document.getElementById("planMapStrategyList");
  const planMapHopTitle = document.getElementById("planMapHopTitle");
  const planMapHopList = document.getElementById("planMapHopList");
  const KOMMUNEPLAN_ID = "063a2e01-35e6-f011-8407-000d3add2e1a";
  const OPPVEKSTPLAN_ID = "e3112baa-7858-f111-bec7-7c1e52370ef7";
  const HOP_PLAN_ID = "7df8f7f0-e0e7-f011-8407-000d3add2e1a";
  let planGoalsData = [];
  let planKpiGoalIds = new Set();
  let planScrollSpyObserver = null;
  let planScrollSpyRetryTimer = null;
  let planScrollSpyRetryCount = 0;
  let planScrollSpyRetryPlanId = null;
  let planScrollSpyRaf = null;
  let planScrollSpyScrollBound = false;
  let planScrollSpySetupTimer = null;
  let planScrollSpyPollTimer = null;
  let planConnectorRenderRaf = null;
  let planConnectorTransitionTimer = null;
  let planConnectorIntroTimer = null;
  let planConnectorSettleTimer = null;
  let planConnectorTransitionCleanup = null;
  let modeTransitionTimer = null;
  let focusedDesktopTimer = null;
  let focusedDesktopActive = false;
  let focusedDesktopColumnOverride = null;
  let focusedDesktopOverrideSignature = null;
  let previousPlanConnectorColumnCount = null;
  let previousPlanVisibleColumnKeys = null;
  let pendingPlanConnectorColumnCount = null;
  let suppressPlanScrollSpy = false;
  let pendingPlanContext = null;
  const PLAN_MENU_TRANSITION_MS = 800;
  const PLAN_FOCUS_DESKTOP_DELAY_MS = 1800;
  const PLAN_FOCUS_MIN_CONTENT_WIDTH = 720;
  const PLAN_FOCUS_COLLAPSED_COLUMN_WIDTH = 34;
  const PLAN_FOCUS_COLUMN_GAP = 8;
  const planContextsById = {
    "063a2e01-35e6-f011-8407-000d3add2e1a": {
      entryColumn: "kommune",
      sectionKey: null,
      leafKey: null,
      strategyKey: null
    },
    "e3112baa-7858-f111-bec7-7c1e52370ef7": {
      entryColumn: "strategi",
      sectionKey: null,
      leafKey: null,
      strategyKey: null
    },
    "7df8f7f0-e0e7-f011-8407-000d3add2e1a": {
      entryColumn: "hop",
      sectionKey: null,
      leafKey: null,
      strategyKey: null
    },
    "c18f1e69-6a49-f111-bec7-7c1e52370ef7": {
      entryColumn: "hop",
      sectionKey: null,
      leafKey: null,
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
            selectedSubgoalKey: null,
            linkedSubgoalKey: "stedsutvikling",
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
            selectedSubgoalKey: null,
            linkedSubgoalKey: "aktive-trygge-liv",
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
            selectedSubgoalKey: null,
            linkedSubgoalKey: "inkludering-arbeid",
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
            selectedSubgoalKey: null,
            linkedSubgoalKey: "livskvalitet-tilhoerighet",
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
            selectedSubgoalKey: null,
            linkedSubgoalKey: "tidlig-innsats",
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
            key: "gode-tjenester",
            id: "fb3ab156-7349-f111-bec7-7c1e52370ef7",
            label: "Gode tjenester gjennom samarbeid, samskaping og god ressursbruk",
            selectedSubgoalKey: null,
            linkedSubgoalKey: "helhetlig-organisasjon",
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
            selectedSubgoalKey: null,
            linkedSubgoalKey: "samhandling-beredskap",
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
    hopKey: null,
    source: "manual"
  };

  function clearPlanMenuSelections() {
    planMenuModel.sections.forEach((section) => {
      section.leaves.forEach((leaf) => {
        leaf.selectedSubgoalKey = null;
        leaf.selectedStrategyBranchKey = null;
        leaf.selectedStrategySourceGoalKey = null;
        if (leaf.key === "gode-oppvekstvilkar") {
          leaf.strategies = [];
        }
      });
    });
  }

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
    const strategies = currentLeaf.leaf.strategies || [];
    for (const strategy of strategies) {
      if (getNodeKey(strategy) === planSelection.strategyKey) return strategy;
      const child = strategy.children?.find((item) => getNodeKey(item) === planSelection.strategyKey);
      if (child) return child;
    }
    return null;
  }

  function getActiveStrategyTargetKey(leaf = null) {
    const currentLeaf = leaf || getCurrentLeaf()?.leaf;
    const selectedKey = planSelection.strategyKey;
    if (!currentLeaf || !selectedKey || !Array.isArray(currentLeaf.strategies)) return null;

    for (const strategy of currentLeaf.strategies) {
      const children = Array.isArray(strategy.children) ? strategy.children : [];
      if (children.length) {
        if (children.some((child) => getNodeKey(child) === selectedKey)) return selectedKey;
        continue;
      }
      if (getNodeKey(strategy) === selectedKey) return selectedKey;
    }
    return null;
  }

  function getCurrentHopItem() {
    if (!planSelection.hopKey) return null;
    return getCurrentHopItems().find((item) => getNodeKey(item) === planSelection.hopKey) || null;
  }

  function getCurrentPlanId() {
    const params = new URLSearchParams(location.search);
    return params.get("id");
  }

  function shouldSuspendPlanScrollSpy() {
    return (getCurrentPlanId() === HOP_PLAN_ID && !!getActiveStrategyTargetKey())
      || isDirectHopSelection();
  }

  function getStrategyPlanIdForLeaf(leaf) {
    if (!leaf) return null;
    if (leaf.key === "gode-oppvekstvilkar") return OPPVEKSTPLAN_ID;
    return null;
  }

  function switchToPlan(planId, contextOverrides = {}) {
    const anchorId = contextOverrides.anchorId || null;
    pendingPlanContext = {
      planId,
      context: { ...contextOverrides }
    };
    history.pushState(
      null,
      "",
      "?id=" + encodeURIComponent(planId) + (anchorId ? "#" + anchorId : "")
    );
    if (!anchorId) window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent("plan:navigate", {
      detail: { planId, anchorId }
    }));
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

  function getGoalAnchorId(item) {
    return item?.id ? "maal-" + slugify(item.id) : null;
  }

  function getGoalIdFromAnchor(anchorId) {
    if (!anchorId || !anchorId.startsWith("maal-")) return null;
    return anchorId.slice(5);
  }

  function getLeafByKey(leafKey) {
    for (const section of planMenuModel.sections) {
      const leaf = section.leaves.find((item) => item.key === leafKey);
      if (leaf) return leaf;
    }
    return null;
  }

  function getLeafContextByKey(leafKey) {
    for (const section of planMenuModel.sections) {
      const leaf = section.leaves.find((item) => item.key === leafKey);
      if (leaf) return { section, leaf };
    }
    return null;
  }

  function getGoalDataById(planId, goalId) {
    const normalizedId = slugify(goalId);
    return planGoalsData.find((goal) => (
      goal.maalPlan === planId
      && slugify(goal.maalID) === normalizedId
    )) || null;
  }

  function getGoalDataKey(goal) {
    return slugify(goal?.maalID || goal?.maalNavn);
  }

  function findSectionByGoalData(goal) {
    if (!goal) return null;
    const goalLabel = slugify(goal.maalNavn);
    return planMenuModel.sections.find((section) => (
      slugify(section.id) === slugify(goal.maalID)
      || slugify(section.label) === goalLabel
    )) || null;
  }

  function findLeafByGoalData(section, goal) {
    if (!section || !goal) return null;
    const goalLabel = slugify(goal.maalNavn);
    return section.leaves.find((leaf) => (
      slugify(leaf.id) === slugify(goal.maalID)
      || slugify(leaf.label) === goalLabel
    )) || null;
  }

  function findSubgoalByGoalData(leaf, goal) {
    if (!leaf || !goal || !Array.isArray(leaf.subgoals)) return null;
    const goalLabel = slugify(goal.maalNavn);
    return leaf.subgoals.find((subgoal) => (
      slugify(subgoal.id) === slugify(goal.maalID)
      || slugify(subgoal.label) === goalLabel
    )) || null;
  }

  function getKommuneScrollSpyContext(goal) {
    if (!goal) return null;
    let targetGoal = goal;
    if (goal.maalType === 701100003) {
      targetGoal = getGoalDataById(KOMMUNEPLAN_ID, goal.maalOverordnet);
    }
    if (!targetGoal || targetGoal.maalType === 701100000) {
      return {
        focusColumn: "kommune",
        sectionKey: null,
        leafKey: null,
        selectedSubgoalKey: null,
        selectedStrategyBranchKey: null,
        strategyKey: null,
        hopKey: null
      };
    }
    if (targetGoal.maalType === 701100001) {
      const section = findSectionByGoalData(targetGoal);
      if (!section) return null;
      return {
        focusColumn: "kommune",
        sectionKey: section.key,
        leafKey: null,
        selectedSubgoalKey: null,
        selectedStrategyBranchKey: null,
        strategyKey: null,
        hopKey: null
      };
    }
    if (targetGoal.maalType === 701100002) {
      const sectionGoal = getGoalDataById(KOMMUNEPLAN_ID, targetGoal.maalOverordnet);
      const section = findSectionByGoalData(sectionGoal);
      const leaf = findLeafByGoalData(section, targetGoal);
      if (!section || !leaf) return null;
      return {
        focusColumn: "kommune",
        sectionKey: section.key,
        leafKey: leaf.key,
        selectedSubgoalKey: null,
        selectedStrategyBranchKey: null,
        strategyKey: null,
        hopKey: null
      };
    }
    return null;
  }

  function getOppvekstScrollSpyContext(goal) {
    if (!goal) return null;
    const branchGoal = goal.maalType === 701100003
      ? getGoalDataById(OPPVEKSTPLAN_ID, goal.maalOverordnet)
      : goal;
    if (!branchGoal || branchGoal.maalType !== 701100002) return null;

    const sourceGoal = getGoalDataById(KOMMUNEPLAN_ID, branchGoal.maalOverordnet);
    const leafGoal = sourceGoal
      ? getGoalDataById(KOMMUNEPLAN_ID, sourceGoal.maalOverordnet)
      : null;
    const sectionGoal = leafGoal
      ? getGoalDataById(KOMMUNEPLAN_ID, leafGoal.maalOverordnet)
      : null;
    const section = findSectionByGoalData(sectionGoal);
    const leaf = findLeafByGoalData(section, leafGoal);
    const sourceSubgoal = findSubgoalByGoalData(leaf, sourceGoal);
    if (!section || !leaf || !sourceSubgoal) return null;

    return {
      focusColumn: "strategi",
      sectionKey: section.key,
      leafKey: leaf.key,
      selectedSubgoalKey: sourceSubgoal.key,
      selectedStrategyBranchKey: getGoalDataKey(branchGoal),
      strategyKey: null,
      hopKey: null
    };
  }

  function getScrollSpyContextForGoal(goalId) {
    const planId = getCurrentPlanId();
    const goal = getGoalDataById(planId, goalId);
    if (!goal) return null;
    if (planId === KOMMUNEPLAN_ID) return getKommuneScrollSpyContext(goal);
    if (planId === OPPVEKSTPLAN_ID) return getOppvekstScrollSpyContext(goal);
    return null;
  }

  function inferStrategyContextFromHash(planId) {
    if (planId !== OPPVEKSTPLAN_ID) return null;
    const goalId = getGoalIdFromAnchor(location.hash.slice(1));
    if (!goalId || !planGoalsData.length) return null;

    const targetGoal = getGoalDataById(OPPVEKSTPLAN_ID, goalId);
    if (!targetGoal) return null;

    const branchGoal = targetGoal.maalType === 701100002
      ? targetGoal
      : getGoalDataById(OPPVEKSTPLAN_ID, targetGoal.maalOverordnet);
    if (!branchGoal) return null;

    const leafContext = getLeafContextByKey("gode-oppvekstvilkar");
    const sourceGoal = leafContext?.leaf.subgoals.find(
      (goal) => slugify(goal.id) === slugify(branchGoal.maalOverordnet)
    );
    if (!leafContext || !sourceGoal) return null;

    return {
      entryColumn: "strategi",
      sectionKey: leafContext.section.key,
      leafKey: leafContext.leaf.key,
      selectedSubgoalKey: sourceGoal.key,
      selectedStrategyBranchKey: getGoalDataKey(branchGoal),
      strategyKey: targetGoal.maalType === 701100003 ? getGoalDataKey(targetGoal) : null,
      hopKey: null
    };
  }

  function inferHopContextFromHash(planId) {
    if (planId !== HOP_PLAN_ID) return null;
    const hopId = getGoalIdFromAnchor(location.hash.slice(1));
    const hopKey = slugify(hopId);
    if (!hopKey) return null;

    const leafContext = getLeafContextByKey("gode-oppvekstvilkar");
    if (!leafContext) return null;

    if (hopKey === "hop-kommune-tidlig-innsats-01") {
      return {
        entryColumn: "hop",
        sectionKey: leafContext.section.key,
        leafKey: leafContext.leaf.key,
        selectedSubgoalKey: "tidlig-innsats",
        selectedStrategyBranchKey: null,
        strategyKey: null,
        hopKey
      };
    }

    if (hopKey === "hop-tidlig-innsats-01") {
      const branchGoal = getGoalDataById(OPPVEKSTPLAN_ID, "96783468-db5c-f111-a826-7c1e52370ef7");
      const strategyGoal = getGoalDataById(OPPVEKSTPLAN_ID, "6d54f4eb-505b-f111-a826-7c1e52370ef7");
      return {
        entryColumn: "full",
        sectionKey: leafContext.section.key,
        leafKey: leafContext.leaf.key,
        selectedSubgoalKey: "tidlig-innsats",
        selectedStrategyBranchKey: getGoalDataKey(branchGoal),
        strategyKey: getGoalDataKey(strategyGoal),
        hopKey
      };
    }

    return null;
  }

  function getLinkedPlanBranchCount(leaf, goal) {
    if (!leaf || !goal) return 0;
    if (leaf.key === "gode-oppvekstvilkar" && goal.id && planGoalsData.length) {
      const linkedBranches = planGoalsData.filter(
        (item) => item.maalPlan === OPPVEKSTPLAN_ID
          && item.maalType === 701100002
          && item.maalOverordnet === goal.id
      );
      if (!linkedBranches.length) return 0;

      const linkedBranchIds = new Set(linkedBranches.map((item) => item.maalID));
      const linkedGoalCount = planGoalsData.filter(
        (item) => item.maalPlan === OPPVEKSTPLAN_ID
          && item.maalType === 701100003
          && linkedBranchIds.has(item.maalOverordnet)
      ).length;
      return linkedGoalCount || linkedBranches.length;
    }
    if (goal.key === leaf.selectedSubgoalKey && Array.isArray(leaf.strategies)) {
      return leaf.strategies.reduce((count, strategy) => (
        count + (Array.isArray(strategy.children) && strategy.children.length ? strategy.children.length : 1)
      ), 0);
    }
    if (goal.key === leaf.linkedSubgoalKey && Array.isArray(leaf.strategies)) {
      return leaf.strategies.reduce((count, strategy) => (
        count + (Array.isArray(strategy.children) && strategy.children.length ? strategy.children.length : 1)
      ), 0);
    }
    return 0;
  }

  function getMockHopItemsForKommuneGoal(leaf, goal) {
    if (leaf?.key !== "gode-oppvekstvilkar" || goal?.key !== "tidlig-innsats") return [];

    return [
      {
        id: "hop-kommune-tidlig-innsats-01",
        title: "Tidlig innsats i barnehage og skole",
        description: "Mock: direkte HØP-tiltak koblet til kommuneplanmålet om tidlig innsats."
      }
    ];
  }

  function getDirectHopItemsForGoal(leaf, goal) {
    return getMockHopItemsForKommuneGoal(leaf, goal);
  }

  function hasKpiForGoalId(goalId) {
    if (!goalId) return false;
    return planKpiGoalIds.has(slugify(goalId));
  }

  function hasKpiForKommuneGoal(goal) {
    return hasKpiForGoalId(goal?.id || goal?.maalID);
  }

  function hasKpiForStrategyGoal(goal) {
    return hasKpiForGoalId(goal?.id || goal?.maalID);
  }

  function getSelectedSubgoal(leaf) {
    if (!leaf?.selectedSubgoalKey || !Array.isArray(leaf.subgoals)) return null;
    return leaf.subgoals.find((goal) => goal.key === leaf.selectedSubgoalKey) || null;
  }

  function getCurrentDirectHopItems() {
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf) return [];
    return getDirectHopItemsForGoal(currentLeaf.leaf, getSelectedSubgoal(currentLeaf.leaf));
  }

  function isDirectHopSelection() {
    return planSelection.focusColumn === "hop"
      && !planSelection.strategyKey
      && getCurrentDirectHopItems().length > 0;
  }

  function getCurrentHopItems() {
    const currentStrategy = getCurrentStrategy();
    if (currentStrategy && Array.isArray(currentStrategy.hopItems)) return currentStrategy.hopItems;
    if (isDirectHopSelection()) return getCurrentDirectHopItems();
    return [];
  }

  function hasLinkedPlanBranch(leaf, goal) {
    return getLinkedPlanBranchCount(leaf, goal) > 0;
  }

  function ensureSelectableSubgoalSelection(leaf) {
    if (!leaf || !Array.isArray(leaf.subgoals) || !leaf.subgoals.length) return;
    if (!leaf.selectedSubgoalKey) {
      leaf.selectedStrategyBranchKey = null;
      leaf.selectedStrategySourceGoalKey = null;
      return;
    }
    const selected = leaf.subgoals.find((goal) => goal.key === leaf.selectedSubgoalKey);
    if (selected && hasLinkedPlanBranch(leaf, selected)) return;
    leaf.selectedSubgoalKey = null;
    leaf.selectedStrategyBranchKey = null;
    leaf.selectedStrategySourceGoalKey = null;
  }

  function ensureValidStrategySelection() {
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf) {
      planSelection.strategyKey = null;
      return;
    }
    const hasSelectedStrategy = currentLeaf.leaf.strategies.some((item) => (
      getNodeKey(item) === planSelection.strategyKey
      || item.children?.some((child) => getNodeKey(child) === planSelection.strategyKey)
    ));
    if (!hasSelectedStrategy) {
      planSelection.strategyKey = null;
    }
  }

  function ensureValidHopSelection() {
    const hopItems = getCurrentHopItems();
    if (!hopItems.length) {
      planSelection.hopKey = null;
      return;
    }
    const hasSelectedHop = hopItems.some((item) => getNodeKey(item) === planSelection.hopKey);
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

  function getMockHopItemsForOppvekstStrategy(childGoal) {
    const childKey = slugify(childGoal.maalID || childGoal.maalNavn);
    if (childKey !== "6d54f4eb-505b-f111-a826-7c1e52370ef7") return [];

    return [
      {
        id: "hop-tidlig-innsats-01",
        title: "Tidlig innsats i barnehage og skole",
        description: "Mock: tverrfaglig innsats som styrker universelle tilpasninger og tidlig oppfølging i ordinært tilbud."
      }
    ];
  }

  function buildOppvekstStrategiesFromMaal(goals) {
    const oppvekstLeaf = getLeafByKey("gode-oppvekstvilkar");
    if (!oppvekstLeaf) return;

    const selectedSubgoal = oppvekstLeaf.subgoals.find((item) => item.key === oppvekstLeaf.selectedSubgoalKey);
    const selectedSubgoalId = selectedSubgoal?.id || null;

    if (!selectedSubgoalId) {
      oppvekstLeaf.strategies = [];
      oppvekstLeaf.selectedStrategyBranchKey = null;
      oppvekstLeaf.selectedStrategySourceGoalKey = null;
      return;
    }

    const oppvekstGoals = goals.filter((goal) => goal.maalPlan === OPPVEKSTPLAN_ID);
    const childGoalsByParent = new Map();
    oppvekstGoals.forEach((goal) => {
      if (!goal.maalOverordnet) return;
      const siblings = childGoalsByParent.get(goal.maalOverordnet) || [];
      siblings.push(goal);
      childGoalsByParent.set(goal.maalOverordnet, siblings);
    });

    const linkedBranchIds = new Set(
      oppvekstGoals
        .filter((goal) => goal.maalOverordnet === selectedSubgoalId)
        .map((goal) => goal.maalID)
    );

    oppvekstLeaf.strategies = oppvekstGoals
      .filter((goal) => goal.maalType === 701100002 && linkedBranchIds.has(goal.maalID))
      .map((goal) => ({
        key: slugify(goal.maalID || goal.maalNavn),
        id: goal.maalID,
        label: goal.maalNavn,
        isLinkedFromSelectedGoal: linkedBranchIds.has(goal.maalID),
        children: (childGoalsByParent.get(goal.maalID) || [])
          .filter((child) => child.maalType === 701100003)
          .map((child) => ({
            key: slugify(child.maalID || child.maalNavn),
            id: child.maalID,
            label: child.maalNavn,
            hopItems: getMockHopItemsForOppvekstStrategy(child)
          }))
      }));

    const hasSelectedBranch = oppvekstLeaf.strategies.some((strategy) => (
      getNodeKey(strategy) === oppvekstLeaf.selectedStrategyBranchKey
    ));
    if (!hasSelectedBranch || oppvekstLeaf.selectedStrategySourceGoalKey !== oppvekstLeaf.selectedSubgoalKey) {
      const linkedBranch = oppvekstLeaf.strategies.find((strategy) => strategy.isLinkedFromSelectedGoal);
      oppvekstLeaf.selectedStrategyBranchKey = linkedBranch
        ? getNodeKey(linkedBranch)
        : null;
      oppvekstLeaf.selectedStrategySourceGoalKey = oppvekstLeaf.selectedSubgoalKey;
    }
  }

  function refreshDynamicLeafData() {
    if (planGoalsData.length) {
      ensureSelectableSubgoalSelection(getLeafByKey("gode-oppvekstvilkar"));
      buildOppvekstStrategiesFromMaal(planGoalsData);
      ensureValidStrategySelection();
      ensureValidHopSelection();
    }
  }

  function getKpiList(kpiData) {
    if (Array.isArray(kpiData)) return kpiData;
    if (kpiData && Array.isArray(kpiData.kpis)) return kpiData.kpis;
    return [];
  }

  async function hydrateKpiModelFromData() {
    try {
      const response = await fetch("data/kpi.json", { cache: "no-store" });
      if (!response.ok) return;
      const kpis = getKpiList(await response.json());
      planKpiGoalIds = new Set(
        kpis
          .map((kpi) => slugify(kpi?.goalId))
          .filter(Boolean)
      );
    } catch (error) {
      console.warn("Kunne ikke laste kpi.json for v2-planmenyen", error);
    }
  }

  async function hydratePlanModelFromData() {
    try {
      const response = await fetch("data/maal.json", { cache: "no-store" });
      if (!response.ok) return;
      const goals = await response.json();
      if (!Array.isArray(goals)) return;

      planGoalsData = goals;
      ensureSelectableSubgoalSelection(getLeafByKey("gode-oppvekstvilkar"));
      buildOppvekstStrategiesFromMaal(planGoalsData);

      ensureValidStrategySelection();
      ensureValidHopSelection();
    } catch (error) {
      console.warn("Kunne ikke laste maal.json for v2-planmenyen", error);
    }
  }

  function getLayoutState() {
    if (planSelection.focusColumn === "hop") {
      if (isDirectHopSelection()) return "hop-direct-entry";
      return planSelection.hopKey ? "full" : "hop-entry";
    }
    if (planSelection.focusColumn === "strategi") {
      return planSelection.strategyKey ? "kommune-plus-strategi" : "strategi-entry";
    }
    if (planSelection.focusColumn === "full") {
      if (planSelection.strategyKey) return "full";
      if (planSelection.leafKey) return "kommune-plus-strategi";
    }
    return "kommune-only";
  }

  function buildPlanGoalLookup() {
    const lookup = new Map();

    planMenuModel.sections.forEach((section) => {
      section.leaves.forEach((leaf) => {
        (leaf.subgoals || []).forEach((goal) => {
          if (!goal.id) return;
          lookup.set(goal.id, {
            focusColumn: "kommune",
            sectionKey: section.key,
            leafKey: leaf.key,
            selectedSubgoalKey: goal.key,
            strategyKey: null,
            hopKey: null
          });
        });

        (leaf.strategies || []).forEach((strategy) => {
          const strategyKey = getNodeKey(strategy);
          if (strategy.id) {
            lookup.set(strategy.id, {
              focusColumn: "strategi",
              sectionKey: section.key,
              leafKey: leaf.key,
              selectedSubgoalKey: leaf.selectedSubgoalKey,
              selectedStrategyBranchKey: strategyKey,
              strategyKey: null,
              hopKey: null
            });
          }

          (strategy.children || []).forEach((child) => {
            if (!child.id) return;
            lookup.set(child.id, {
              focusColumn: "strategi",
              sectionKey: section.key,
              leafKey: leaf.key,
              selectedSubgoalKey: leaf.selectedSubgoalKey,
              selectedStrategyBranchKey: strategyKey,
              strategyKey: getNodeKey(child),
              hopKey: null
            });
          });
        });
      });
    });

    return lookup;
  }

  function applyScrollSpySelection(goalId) {
    const next = getScrollSpyContextForGoal(goalId);
    if (!next) return;

    const leaf = getLeafByKey(next.leafKey);
    if (next.leafKey && !leaf) return;

    const changed =
      planSelection.focusColumn !== next.focusColumn ||
      planSelection.sectionKey !== next.sectionKey ||
      planSelection.leafKey !== next.leafKey ||
      planSelection.strategyKey !== next.strategyKey ||
      planSelection.hopKey !== next.hopKey ||
      planSelection.source !== "scroll";

    planMenuModel.sections.forEach((section) => {
      section.leaves.forEach((item) => {
        item.selectedSubgoalKey = null;
        item.selectedStrategyBranchKey = null;
        item.selectedStrategySourceGoalKey = null;
      });
    });

    if (leaf) {
      leaf.selectedSubgoalKey = next.selectedSubgoalKey;
    }
    if (leaf && next.selectedStrategyBranchKey) {
      leaf.selectedStrategyBranchKey = next.selectedStrategyBranchKey;
    }
    planSelection.focusColumn = next.focusColumn;
    planSelection.sectionKey = next.sectionKey;
    planSelection.leafKey = next.leafKey;
    planSelection.strategyKey = next.strategyKey;
    planSelection.hopKey = next.hopKey;
    planSelection.source = "scroll";

    refreshDynamicLeafData();

    if (changed) {
      renderPlanMenus();
    }
  }

  function getPlanScrollSpySections() {
    return Array.from(document.querySelectorAll("main section[id]"))
      .filter((section) => getScrollSpyContextForGoal(getGoalIdFromAnchor(section.id)));
  }

  function hasManualPlanMenuSelection() {
    const manualLeaf = planSelection.source === "manual" ? getCurrentLeaf()?.leaf : null;
    return planSelection.source === "manual" && (
      planSelection.sectionKey
      || planSelection.leafKey
      || planSelection.strategyKey
      || planSelection.hopKey
      || manualLeaf?.selectedSubgoalKey
    );
  }

  function shouldSkipPlanScrollSpyUpdate() {
    return body.dataset.mode !== "plan"
      || suppressPlanScrollSpy
      || shouldSuspendPlanScrollSpy()
      || hasManualPlanMenuSelection();
  }

  function updatePlanScrollSpyFromViewport() {
    if (shouldSkipPlanScrollSpyUpdate()) return;
    const hasSelection = !!(
      planSelection.sectionKey
      || planSelection.leafKey
      || planSelection.strategyKey
      || planSelection.hopKey
    );
    if (!hasSelection && !location.hash && window.scrollY < 24) return;

    const sections = getPlanScrollSpySections();
    if (!sections.length) return;
    const probeY = Math.max(160, window.innerHeight * 0.5);
    const measured = sections
      .map((section) => ({ section, rect: section.getBoundingClientRect() }))
      .filter((item) => item.rect.bottom > 0 && item.rect.top < window.innerHeight);
    if (!measured.length) return;

    const passedProbe = measured
      .filter((item) => item.rect.top <= probeY)
      .sort((a, b) => b.rect.top - a.rect.top);
    const active = passedProbe[0] || measured.sort((a, b) => a.rect.top - b.rect.top)[0];
    const goalId = getGoalIdFromAnchor(active.section.id);
    if (goalId) applyScrollSpySelection(goalId);
  }

  function schedulePlanScrollSpyUpdate() {
    if (planScrollSpyRaf) return;
    planScrollSpyRaf = window.requestAnimationFrame(() => {
      planScrollSpyRaf = null;
      updatePlanScrollSpyFromViewport();
    });
  }

  function schedulePlanScrollSpySetup() {
    if (planScrollSpySetupTimer) {
      window.clearTimeout(planScrollSpySetupTimer);
    }
    planScrollSpySetupTimer = window.setTimeout(() => {
      planScrollSpySetupTimer = null;
      planScrollSpyRetryCount = 0;
      setupPlanScrollSpy();
    }, 80);
  }

  function setupPlanScrollSpy() {
    const currentPlanId = getCurrentPlanId();
    if (planScrollSpyRetryPlanId !== currentPlanId) {
      planScrollSpyRetryPlanId = currentPlanId;
      planScrollSpyRetryCount = 0;
    }
    if (planScrollSpyRetryTimer) {
      window.clearTimeout(planScrollSpyRetryTimer);
      planScrollSpyRetryTimer = null;
    }
    if (planScrollSpyObserver) {
      planScrollSpyObserver.disconnect();
      planScrollSpyObserver = null;
    }
    if (shouldSuspendPlanScrollSpy()) return;

    const sections = getPlanScrollSpySections();
    if (!sections.length) {
      if (planScrollSpyRetryCount < 12) {
        planScrollSpyRetryCount += 1;
        planScrollSpyRetryTimer = window.setTimeout(() => {
          planScrollSpyRetryTimer = null;
          setupPlanScrollSpy();
        }, 160);
      }
      return;
    }

    planScrollSpyRetryCount = 0;
    if (!planScrollSpyScrollBound) {
      window.addEventListener("scroll", schedulePlanScrollSpyUpdate, { passive: true });
      planScrollSpyScrollBound = true;
    }
    if (!planScrollSpyPollTimer) {
      planScrollSpyPollTimer = window.setInterval(updatePlanScrollSpyFromViewport, 250);
    }
    const visibleSections = new Map();
    planScrollSpyObserver = new IntersectionObserver((entries) => {
      if (shouldSkipPlanScrollSpyUpdate()) return;
      const hasSelection = !!(
        planSelection.sectionKey
        || planSelection.leafKey
        || planSelection.strategyKey
        || planSelection.hopKey
      );
      if (!hasSelection && !location.hash && window.scrollY < 24) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry);
        } else {
          visibleSections.delete(entry.target.id);
        }
      });

      const visible = Array.from(visibleSections.values())
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (!visible.length) return;

      const goalId = getGoalIdFromAnchor(visible[0].target.id);
      if (!goalId) return;

      applyScrollSpySelection(goalId);
    }, { rootMargin: "0px 0px -70% 0px", threshold: 0.01 });

    sections.forEach((section) => planScrollSpyObserver.observe(section));
    schedulePlanScrollSpyUpdate();
  }

  function createButton(className, label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function createRelationPreview(summary, actionLabel, onAction) {
    const preview = document.createElement("div");
    preview.className = "plan-map-relation-preview";

    const line = document.createElement("div");
    line.className = "plan-map-relation-preview-line";
    preview.appendChild(line);

    const card = document.createElement("div");
    card.className = "plan-map-relation-preview-card";

    const text = document.createElement("div");
    text.className = "plan-map-relation-preview-text";
    text.textContent = summary;
    card.appendChild(text);

    const action = document.createElement("button");
    action.type = "button";
    action.className = "plan-map-relation-preview-action";
    action.setAttribute("aria-label", actionLabel);
    action.setAttribute("title", actionLabel);
    action.innerHTML = "<i class=\"ti ti-chevron-right\" aria-hidden=\"true\"></i>";
    action.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onAction();
    });
    card.appendChild(action);

    preview.appendChild(card);
    return preview;
  }

  function attachRelationExpansion(container) {
    if (!container) return;
    container.addEventListener("mouseenter", () => sidebar?.classList.add("sidebar-relation-expanded"));
    container.addEventListener("mouseleave", () => sidebar?.classList.remove("sidebar-relation-expanded"));
    container.addEventListener("focusin", () => sidebar?.classList.add("sidebar-relation-expanded"));
    container.addEventListener("focusout", (event) => {
      if (!container.contains(event.relatedTarget)) {
        sidebar?.classList.remove("sidebar-relation-expanded");
      }
    });
  }

  function createRelationChip(count, actionLabel, displayLabel, onAction, iconClass = "ti ti-target-arrow") {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "plan-map-relation-chip";
    chip.setAttribute("aria-label", actionLabel);
    chip.setAttribute("title", displayLabel || actionLabel);
    chip.innerHTML = `
      <span class="plan-map-relation-chip-icon" aria-hidden="true"><i class="${iconClass}"></i></span>
      <span class="plan-map-relation-chip-arrow" aria-hidden="true"></span>
    `;
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onAction();
    });
    return chip;
  }

  function createCardActionButton(actionType, actionLabel, iconClass, onAction) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "plan-map-card-action-btn";
    button.dataset.relationAction = actionType;
    button.setAttribute("aria-label", actionLabel);
    button.setAttribute("title", actionLabel);
    button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onAction();
    });
    return button;
  }

  function attachRelationIconToCard(card, iconClass = "ti ti-target-arrow", actionLabel = null, onAction = null, actionType = iconClass) {
    if (!card) return;
    let iconWrap = card.querySelector(".plan-map-card-relation-icons");
    if (!iconWrap) {
      iconWrap = document.createElement("span");
      iconWrap.className = "plan-map-card-relation-icons";
      card.appendChild(iconWrap);
    }
    if (iconWrap.querySelector(`[data-relation-action="${actionType}"]`)) return;
    const icon = document.createElement("span");
    icon.className = "plan-map-card-relation-icon";
    icon.dataset.relationAction = actionType;
    if (typeof onAction === "function") {
      icon.classList.add("is-action");
      icon.setAttribute("title", actionLabel || "");
      icon.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onAction();
      });
    } else {
      icon.setAttribute("aria-hidden", "true");
    }
    icon.innerHTML = `<i class="${iconClass}"></i>`;
    iconWrap.appendChild(icon);
  }

  function selectKommuneGoalForStrategyPreview(section, leaf, goal) {
    const hasLinkedStrategies = getLinkedPlanBranchCount(leaf, goal) > 0;
    planSelection.source = "manual";
    planSelection.focusColumn = hasLinkedStrategies ? "strategi" : "kommune";
    planSelection.sectionKey = section.key;
    planSelection.leafKey = leaf.key;
    leaf.selectedSubgoalKey = goal.key;
    planSelection.strategyKey = null;
    planSelection.hopKey = null;
    refreshDynamicLeafData();
    renderPlanMenus();
  }

  function openDirectHopForKommuneGoal(section, leaf, goal) {
    const hopItems = getDirectHopItemsForGoal(leaf, goal);
    if (!hopItems.length) return;
    planSelection.source = "manual";
    planSelection.focusColumn = "hop";
    planSelection.sectionKey = section.key;
    planSelection.leafKey = leaf.key;
    leaf.selectedSubgoalKey = goal.key;
    planSelection.strategyKey = null;
    planSelection.hopKey = null;
    refreshDynamicLeafData();
    renderPlanMenus();
  }

  function openHopPlanForStrategy(section, leaf, strategy) {
    switchToPlan(HOP_PLAN_ID, {
      entryColumn: "full",
      sectionKey: section.key,
      leafKey: leaf.key,
      selectedSubgoalKey: leaf.selectedSubgoalKey,
      strategyKey: getNodeKey(strategy),
      hopKey: null
    });
  }

  function openKpiForKommuneGoal(section, leaf, goal) {
    if (!hasKpiForKommuneGoal(goal)) return;

    switchToPlan(KOMMUNEPLAN_ID, {
      entryColumn: "kommune",
      sectionKey: section.key,
      leafKey: leaf.key,
      selectedSubgoalKey: goal.key,
      strategyKey: null,
      hopKey: null,
      anchorId: getGoalAnchorId(goal)
    });
  }

  function openKpiForStrategyGoal(section, leaf, branch, strategy) {
    if (!hasKpiForStrategyGoal(strategy)) return;
    switchToPlan(OPPVEKSTPLAN_ID, {
      entryColumn: "strategi",
      sectionKey: section.key,
      leafKey: leaf.key,
      selectedSubgoalKey: leaf.selectedSubgoalKey,
      selectedStrategyBranchKey: getNodeKey(branch),
      strategyKey: getNodeKey(strategy),
      hopKey: null,
      anchorId: getGoalAnchorId(strategy)
    });
  }

  function selectStrategyGoal(section, leaf, strategy) {
    const planId = getStrategyPlanIdForLeaf(leaf);
    const strategyKey = getNodeKey(strategy);
    if (!planId) {
      planSelection.source = "manual";
      planSelection.strategyKey = strategyKey;
      planSelection.hopKey = null;
      planSelection.focusColumn = "strategi";
      renderPlanMenus();
      return;
    }
    planSelection.source = "manual";
    switchToPlan(planId, {
      entryColumn: "strategi",
      sectionKey: section.key,
      leafKey: leaf.key,
      selectedSubgoalKey: leaf.selectedSubgoalKey,
      strategyKey,
      hopKey: null,
      anchorId: getGoalAnchorId(strategy)
    });
  }

  function createStrategySwitchChip(section, leaf, goal = null, branchCount = null) {
    const planId = getStrategyPlanIdForLeaf(leaf);
    if (!planId) return null;
    const targetGoal = goal || leaf.subgoals?.find((item) => item.key === leaf.selectedSubgoalKey) || null;
    const strategyCount = branchCount ?? getLinkedPlanBranchCount(leaf, targetGoal);
    if (!strategyCount) return null;
    const tooltipLabel = `Gå til ${strategyCount} mål i ${leaf.strategyPlanTitle}.`;
    return createRelationChip(
      strategyCount,
      tooltipLabel,
      tooltipLabel,
      () => {
        selectKommuneGoalForStrategyPreview(section, leaf, targetGoal);
      }
    );
  }

  function createHopSwitchChip(section, leaf, strategy) {
    const hopCount = Array.isArray(strategy.hopItems) ? strategy.hopItems.length : 0;
    if (!hopCount) return null;
    const hopLabel = `${hopCount} tiltak i HOP`;
    const hopAction = `${getCurrentPlanId() === HOP_PLAN_ID ? "Vis" : "Gå til"} ${hopCount} tiltak i handlings- og økonomiplanen.`;
    return createRelationChip(
      hopCount,
      hopAction,
      hopLabel,
      () => {
        openHopPlanForStrategy(section, leaf, strategy);
      },
      "ti ti-list-check"
    );
  }

  function createStrategySwitchPreview(section, leaf) {
    const planId = getStrategyPlanIdForLeaf(leaf);
    if (!planId || getCurrentPlanId() === planId) return null;
    const strategyCount = Array.isArray(leaf.strategies) ? leaf.strategies.length : 0;
    if (!strategyCount) return null;

    return createRelationPreview(
      `Se ${strategyCount} mål i ${leaf.strategyPlanTitle}`,
      `Skift til ${leaf.strategyPlanTitle}`,
      () => {
        switchToPlan(planId, {
          entryColumn: "strategi",
          sectionKey: section.key,
          leafKey: leaf.key,
          selectedSubgoalKey: leaf.selectedSubgoalKey,
          strategyKey: null,
          hopKey: null
        });
      }
    );
  }

  function createHopSwitchPreview(section, leaf, strategy) {
    if (getCurrentPlanId() === HOP_PLAN_ID) return null;
    const hopCount = Array.isArray(strategy.hopItems) ? strategy.hopItems.length : 0;
    if (!hopCount) return null;

    return createRelationPreview(
      `Se ${hopCount} tiltak i HØP`,
      "Skift til Handlings- og økonomiplanen",
      () => {
        switchToPlan(HOP_PLAN_ID, {
          entryColumn: "full",
          sectionKey: section.key,
          leafKey: leaf.key,
          selectedSubgoalKey: leaf.selectedSubgoalKey,
          strategyKey: strategy.key,
          hopKey: null
        });
      }
    );
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
    const baseContext = planId ? planContextsById[planId] : null;
    const pendingContext = pendingPlanContext && pendingPlanContext.planId === planId
      ? pendingPlanContext.context
      : null;
    const inferredContext = inferStrategyContextFromHash(planId) || inferHopContextFromHash(planId);
    const context = (baseContext || pendingContext || inferredContext)
      ? { ...(baseContext || {}), ...(pendingContext || {}) }
      : null;
    if (context && inferredContext && !pendingContext) {
      Object.assign(context, inferredContext);
    }
    if (pendingContext) {
      pendingPlanContext = null;
    }
    if (!context) return;
    suppressPlanScrollSpy = true;
    clearPlanMenuSelections();
    planSelection.source = "manual";
    planSelection.focusColumn = context.entryColumn || "kommune";
    planSelection.sectionKey = context.sectionKey;
    planSelection.leafKey = context.leafKey;
    if (context.leafKey && context.selectedSubgoalKey) {
      const leaf = getLeafByKey(context.leafKey);
      if (leaf) {
        leaf.selectedSubgoalKey = context.selectedSubgoalKey;
      }
    }
    refreshDynamicLeafData();
    if (context.leafKey && context.selectedStrategyBranchKey) {
      const leaf = getLeafByKey(context.leafKey);
      if (leaf) {
        leaf.selectedStrategyBranchKey = context.selectedStrategyBranchKey;
      }
    }
    planSelection.strategyKey = context.strategyKey;
    planSelection.hopKey = context.hopKey || null;
    ensureValidStrategySelection();
    ensureValidHopSelection();
    if (body.dataset.mode === "rapport") {
      setMode("plan");
      suppressPlanScrollSpy = false;
      return;
    }
    renderPlanMenus();
    window.setTimeout(() => {
      suppressPlanScrollSpy = false;
      if (!shouldSuspendPlanScrollSpy()) {
        setupPlanScrollSpy();
      }
    }, 0);
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
          planSelection.source = "manual";
          planSelection.focusColumn = "kommune";
          if (planSelection.sectionKey === section.key) {
            planSelection.sectionKey = null;
            planSelection.leafKey = null;
            planSelection.strategyKey = null;
            planSelection.hopKey = null;
          } else {
            planSelection.sectionKey = section.key;
            planSelection.leafKey = null;
            planSelection.strategyKey = null;
            planSelection.hopKey = null;
          }
          renderPlanMenus();
        }
      );
      branch.setAttribute("aria-expanded", section.key === activeSectionKey ? "true" : "false");
      group.appendChild(branch);

      if (section.key === activeSectionKey) {
        const children = document.createElement("div");
        children.className = "plan-map-tree-children";

        section.leaves.forEach((leaf) => {
          const hasSubgoals = Array.isArray(leaf.subgoals) && leaf.subgoals.length > 0;
          const isActiveLeaf = leaf.key === activeLeafKey;
          const leafButton = createButton(
            "plan-map-tree-leaf"
            + (isActiveLeaf ? " is-active" : "")
            + (isActiveLeaf && hasSubgoals ? " has-open-subpath" : ""),
            leaf.label,
            () => {
              planSelection.source = "manual";
              planSelection.focusColumn = "kommune";
              if (isActiveLeaf) {
                planSelection.sectionKey = section.key;
                planSelection.leafKey = null;
                planSelection.strategyKey = null;
                planSelection.hopKey = null;
              } else {
                planSelection.sectionKey = section.key;
                planSelection.leafKey = leaf.key;
                planSelection.strategyKey = null;
                planSelection.hopKey = null;
              }
              renderPlanMenus();
            }
          );
          if (leaf.key === activeLeafKey) {
            leafButton.setAttribute("aria-current", "true");
          }
          children.appendChild(leafButton);

          if (isActiveLeaf && hasSubgoals) {
            const subpath = document.createElement("div");
            subpath.className = "plan-map-tree-subpath";

            leaf.subgoals.forEach((goal) => {
              const linkedBranchCount = getLinkedPlanBranchCount(leaf, goal);
              const directHopCount = getDirectHopItemsForGoal(leaf, goal).length;
              const hasKpi = hasKpiForKommuneGoal(goal);
              const hasRelationActions = linkedBranchCount > 0 || directHopCount > 0 || hasKpi;
              const isSelectedSubgoal = planSelection.source !== "scroll" && goal.key === leaf.selectedSubgoalKey;
              const subLeaf = document.createElement("div");
              subLeaf.className = hasRelationActions
                ? (isSelectedSubgoal ? "plan-map-node plan-map-node-selected" : "plan-map-tree-subleaf")
                : "plan-map-tree-subleaf-static";
              if (isSelectedSubgoal && hasRelationActions) {
                subLeaf.classList.add("plan-map-link-source");
              }
              const text = document.createElement("span");
              text.className = "plan-map-card-text";
              text.textContent = goal.label;
              subLeaf.appendChild(text);

              if (hasRelationActions) {
                const relationGroup = document.createElement("div");
                relationGroup.className = "plan-map-relation-group";
                if (isSelectedSubgoal) {
                  relationGroup.classList.add("plan-map-link-source-group");
                  const sourceNode = document.createElement("span");
                  sourceNode.className = "plan-map-link-source-node";
                  sourceNode.setAttribute("aria-hidden", "true");
                  subLeaf.appendChild(sourceNode);
                }

                const actionGroup = document.createElement("div");
                actionGroup.className = "plan-map-card-actions";
                if (linkedBranchCount) {
                  const strategyActionLabel = `Vis ${linkedBranchCount} m\u00e5l i ${leaf.strategyPlanTitle}.`;
                  actionGroup.appendChild(createCardActionButton(
                    "strategy",
                    strategyActionLabel,
                    "ti ti-target-arrow",
                    () => selectKommuneGoalForStrategyPreview(section, leaf, goal)
                  ));
                }
                if (directHopCount) {
                  const hopActionLabel = `Vis ${directHopCount} tiltak i handlings- og \u00f8konomiplanen.`;
                  actionGroup.appendChild(createCardActionButton(
                    "hop",
                    hopActionLabel,
                    "ti ti-list-check",
                    () => openDirectHopForKommuneGoal(section, leaf, goal)
                  ));
                }
                if (hasKpi) {
                  const kpiActionLabel = "Se KPI-er for dette m\u00e5let.";
                  actionGroup.appendChild(createCardActionButton(
                    "kpi",
                    kpiActionLabel,
                    "ti ti-chart-bar",
                    () => openKpiForKommuneGoal(section, leaf, goal)
                  ));
                }
                subLeaf.appendChild(actionGroup);
                relationGroup.appendChild(subLeaf);
                subpath.appendChild(relationGroup);
              } else {
                subpath.appendChild(subLeaf);
              }
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
      planMapStrategyTitle.textContent = "Velg et mål i kommuneplanen";
      planMapStrategyList.innerHTML = "<p class=\"plan-map-empty-state\">Strategiske mål vises her når du velger et delmål i kommuneplanen.</p>";
      return;
    }
    const { section, leaf } = currentLeaf;
    const activeTargetKey = getActiveStrategyTargetKey(leaf);
    planMapStrategyTitle.textContent = leaf.strategyPlanTitle;
    planMapStrategyList.innerHTML = "";
    planMapStrategyList.classList.toggle("has-selected-strategy", !!activeTargetKey);

    if (!Array.isArray(leaf.strategies) || leaf.strategies.length === 0) {
      planMapStrategyList.innerHTML = "<p class=\"plan-map-empty-state\">Ingen koblede strategimål for dette delmålet ennå.</p>";
      return;
    }
    leaf.strategies.forEach((strategy) => {
      const strategyKey = getNodeKey(strategy);
      const isOpen = strategyKey === leaf.selectedStrategyBranchKey;
      const group = document.createElement("section");
      group.className = "plan-map-tree-group" + (isOpen ? " is-active" : "");

      const branch = createButton(
        "plan-map-tree-branch" + (isOpen ? " is-open" : ""),
        getNodeLabel(strategy),
        () => {
          planSelection.source = "manual";
          leaf.selectedStrategyBranchKey = isOpen ? null : strategyKey;
          planSelection.strategyKey = null;
          planSelection.hopKey = null;
          planSelection.focusColumn = "strategi";
          renderPlanMenus();
        }
      );
      branch.setAttribute("aria-expanded", isOpen ? "true" : "false");
      group.appendChild(branch);

      if (isOpen) {
        const children = document.createElement("div");
        children.className = "plan-map-tree-subpath";

        if (Array.isArray(strategy.children) && strategy.children.length) {
          strategy.children.forEach((childStrategy, childIndex) => {
            const childKey = getNodeKey(childStrategy);
            const isActive = activeTargetKey === childKey;
            const shouldShowIndicator = !activeTargetKey || isActive;
            const isPrimaryTarget = !!activeTargetKey && isActive;
            const control = createButton(
              "plan-map-tree-subleaf plan-map-strategy-row plan-map-link-target"
                + (isActive ? " plan-map-node-selected" : "")
                + (shouldShowIndicator ? " is-visible-link-target" : "")
                + (isPrimaryTarget ? " is-primary-link-target" : ""),
              getNodeLabel(childStrategy),
              () => {
                selectStrategyGoal(section, leaf, childStrategy);
              }
            );
            if (isActive) {
              control.setAttribute("aria-current", "true");
            }
            control.dataset.strategyKey = childKey;
            control.dataset.linkTargetKey = childKey;
            const targetNode = document.createElement("span");
            targetNode.className = "plan-map-link-target-node";
            targetNode.setAttribute("aria-hidden", "true");
            control.appendChild(targetNode);
            if (getCurrentPlanId() === HOP_PLAN_ID && isActive) {
              const hopSourceNode = document.createElement("span");
              hopSourceNode.className = "plan-map-hop-source-node";
              hopSourceNode.setAttribute("aria-hidden", "true");
              control.appendChild(hopSourceNode);
            }
            if (hasKpiForStrategyGoal(childStrategy)) {
              attachRelationIconToCard(
                control,
                "ti ti-chart-bar",
                "Se KPI-er for dette m\u00e5let.",
                () => openKpiForStrategyGoal(section, leaf, strategy, childStrategy),
                "kpi"
              );
            }
            const shouldShowHopChip = !(isActive && getCurrentPlanId() === HOP_PLAN_ID);
            const hopChip = shouldShowHopChip
              ? createHopSwitchChip(section, leaf, childStrategy)
              : null;
            if (hopChip) {
              const hopCount = Array.isArray(childStrategy.hopItems) ? childStrategy.hopItems.length : 0;
              const hopIconAction = `${getCurrentPlanId() === HOP_PLAN_ID ? "Vis" : "G\u00e5 til"} ${hopCount} tiltak i handlings- og \u00f8konomiplanen.`;
              attachRelationIconToCard(
                control,
                "ti ti-list-check",
                hopIconAction,
                () => openHopPlanForStrategy(section, leaf, childStrategy),
                "hop"
              );
              const relationGroup = document.createElement("div");
              relationGroup.className = "plan-map-relation-group plan-map-hop-link-group";
              relationGroup.appendChild(control);
              relationGroup.appendChild(hopChip);
              attachRelationExpansion(relationGroup);
              children.appendChild(relationGroup);
            } else {
              children.appendChild(control);
            }
          });
        } else {
          children.innerHTML = "<p class=\"plan-map-empty-state\">Ingen undermål for dette målet ennå.</p>";
        }

        group.appendChild(children);
      }

      planMapStrategyList.appendChild(group);
    });
  }

  function renderHopMenu() {
    if (!planMapHopList || !planMapHopTitle) return;
    const currentLeaf = getCurrentLeaf();
    if (!currentLeaf) {
      planMapHopTitle.textContent = "Velg et strategimål";
      planMapHopList.innerHTML = "<p class=\"plan-map-empty-state\">Tiltak i handlings- og økonomiplanen vises her når du velger et strategimål.</p>";
      return;
    }
    const { leaf } = currentLeaf;
    const activeStrategy = getCurrentStrategy();
    const usesDirectHop = isDirectHopSelection();
    const hopItems = activeStrategy?.hopItems || (usesDirectHop ? getCurrentDirectHopItems() : []);
    planMapHopTitle.textContent = leaf.hopPlanTitle;
    planMapHopList.innerHTML = "";
    if (!activeStrategy && !usesDirectHop) {
      planMapHopList.innerHTML = "<p class=\"plan-map-empty-state\">Velg et strategimål for å se koblede tiltak i HØP.</p>";
      return;
    }

    if (!Array.isArray(hopItems) || hopItems.length === 0) {
      planMapHopList.innerHTML = "<p class=\"plan-map-empty-state\">Ingen koblede tiltak for dette strategimålet ennå.</p>";
      return;
    }

    const activeHopKey = getCurrentHopItem() ? planSelection.hopKey : null;
    planMapHopList.classList.toggle("has-selected-hop", !!activeHopKey);
    hopItems.forEach((item) => {
      const hopKey = getNodeKey(item);
      const isActive = activeHopKey === hopKey;
      const shouldShowIndicator = !activeHopKey || isActive;
      const control = createButton(
        "plan-map-hop-card plan-map-list-node plan-map-hop-link-target"
          + (isActive ? " is-active plan-map-node-selected is-primary-hop-target" : "")
          + (shouldShowIndicator ? " is-visible-hop-target" : ""),
        getNodeLabel(item),
        () => {
          const nextHopKey = getNodeKey(item);
          const shouldSelectHop = planSelection.hopKey !== nextHopKey;
          planSelection.source = "manual";
          planSelection.hopKey = shouldSelectHop ? nextHopKey : null;
          planSelection.focusColumn = usesDirectHop ? "hop" : "full";
          if (shouldSelectHop) {
            switchToPlan(HOP_PLAN_ID, {
              entryColumn: usesDirectHop ? "hop" : "full",
              sectionKey: currentLeaf.section.key,
              leafKey: leaf.key,
              selectedSubgoalKey: leaf.selectedSubgoalKey,
              selectedStrategyBranchKey: leaf.selectedStrategyBranchKey,
              strategyKey: planSelection.strategyKey,
              hopKey: nextHopKey,
              anchorId: getGoalAnchorId(item)
            });
            return;
          }
          if (getCurrentPlanId() === HOP_PLAN_ID) {
            switchToPlan(HOP_PLAN_ID, {
              entryColumn: usesDirectHop ? "hop" : "full",
              sectionKey: currentLeaf.section.key,
              leafKey: leaf.key,
              selectedSubgoalKey: leaf.selectedSubgoalKey,
              selectedStrategyBranchKey: leaf.selectedStrategyBranchKey,
              strategyKey: planSelection.strategyKey,
              hopKey: null
            });
            return;
          }
          renderPlanMenus();
        }
      );
      control.dataset.hopKey = hopKey;
      if (isActive) {
        control.setAttribute("aria-current", "true");
      }
      const hopNode = document.createElement("span");
      hopNode.className = "plan-map-hop-link-target-node";
      hopNode.setAttribute("aria-hidden", "true");
      control.appendChild(hopNode);
      planMapHopList.appendChild(control);
    });
  }

  function syncChildPlanMenu() {
    if (!planMapPrototype) return;
    const currentPlanId = getCurrentPlanId();
    const showsDirectHopPlan = isDirectHopSelection();
    const blocksHopColumn = planSelection.focusColumn === "strategi";
    const showsHopPlan = !blocksHopColumn && (currentPlanId === HOP_PLAN_ID || showsDirectHopPlan);
    const currentLeaf = getCurrentLeaf()?.leaf || null;
    const shouldShowStrategyColumn = !showsDirectHopPlan && (
      planSelection.focusColumn === "strategi"
      || planSelection.focusColumn === "full"
      || (!!currentPlanId && currentPlanId !== KOMMUNEPLAN_ID && currentPlanId !== HOP_PLAN_ID)
    );
    const showsStrategyPreview = shouldShowStrategyColumn
      && !!currentLeaf?.selectedSubgoalKey
      && Array.isArray(currentLeaf.strategies)
      && currentLeaf.strategies.length > 0;
    const showsChildPlan = showsHopPlan || (!!currentPlanId && currentPlanId !== KOMMUNEPLAN_ID) || showsStrategyPreview;
    const planStage = showsDirectHopPlan ? "hop-direct" : showsHopPlan ? "hop" : showsChildPlan ? "strategy" : "kommune";
    planMapPrototype.dataset.planStage = planStage;
    planMapPrototype.classList.toggle("has-child-plan", showsChildPlan);
    planMapPrototype.classList.toggle("has-hop-plan", showsHopPlan);
    planMapPrototype.classList.toggle("has-direct-hop-plan", showsDirectHopPlan);
    sidebar?.classList.toggle("has-child-plan", showsChildPlan);
    sidebar?.classList.toggle("has-hop-plan", showsHopPlan);
    sidebar?.classList.toggle("has-direct-hop-plan", showsDirectHopPlan);
  }

  function getPlanConnectorColumnCount() {
    if (!planMapPrototype?.classList.contains("has-child-plan")) return 1;
    if (
      planMapPrototype.classList.contains("has-hop-plan")
      && !planMapPrototype.classList.contains("has-direct-hop-plan")
    ) {
      return 3;
    }
    return 2;
  }

  function getPlanColumnMap() {
    return {
      kommune: planMapTree ? planMapTree.closest(".plan-map-column") : null,
      strategi: planMapStrategyColumn,
      hop: planMapHopColumn
    };
  }

  function getCurrentPlanVisibleColumnKeys() {
    if (!planMapPrototype?.classList.contains("has-child-plan")) return ["kommune"];
    const stage = planMapPrototype.dataset.planStage || "kommune";
    if (stage === "hop") return ["kommune", "strategi", "hop"];
    if (stage === "hop-direct") return ["kommune", "hop"];
    if (stage === "strategy") return ["kommune", "strategi"];
    return ["kommune"];
  }

  function getVisibleFocusedDesktopColumns() {
    return getCurrentPlanVisibleColumnKeys();
  }

  function getFocusedDesktopColumnStack(focusedColumn, availableColumns) {
    if (!focusedColumn || !availableColumns.includes(focusedColumn)) return [];
    const hierarchy = ["kommune", "strategi", "hop"];
    const focusedIndex = hierarchy.indexOf(focusedColumn);
    if (focusedIndex === -1) return [focusedColumn];
    return hierarchy
      .slice(0, focusedIndex + 1)
      .filter((key) => availableColumns.includes(key));
  }

  function getDefaultFocusedDesktopColumn(visibleColumns) {
    if (focusedDesktopColumnOverride) {
      const currentSignature = getFocusedDesktopSelectionSignature();
      if (
        focusedDesktopOverrideSignature === currentSignature
        && visibleColumns.includes(focusedDesktopColumnOverride)
      ) {
        return focusedDesktopColumnOverride;
      }
      clearFocusedDesktopOverride();
    }
    const currentPlanId = getCurrentPlanId();
    if (visibleColumns.includes("hop") && (
      planSelection.focusColumn === "hop"
      || currentPlanId === HOP_PLAN_ID
      || !!planSelection.hopKey
    )) {
      return "hop";
    }
    if (visibleColumns.includes("strategi") && (
      planSelection.focusColumn === "strategi"
      || planSelection.focusColumn === "full"
      || currentPlanId === OPPVEKSTPLAN_ID
      || !!planSelection.strategyKey
    )) {
      return "strategi";
    }
    return visibleColumns.includes("kommune") ? "kommune" : visibleColumns[0] || "kommune";
  }

  function getPlanMenuPixelWidth() {
    const columnMap = getPlanColumnMap();
    const visibleColumns = getVisibleFocusedDesktopColumns();
    const measured = visibleColumns
      .map((key) => columnMap[key]?.getBoundingClientRect().width || 0)
      .filter((width) => width > 80);
    if (measured.length) return Math.max(...measured);
    const treeColumnWidth = columnMap.kommune?.getBoundingClientRect().width || 0;
    if (treeColumnWidth > 80) return treeColumnWidth;
    return 208;
  }

  function getEstimatedFullPlanSidebarWidth() {
    const visibleCount = getVisibleFocusedDesktopColumns().length;
    if (visibleCount <= 1) return getPlanMenuPixelWidth();
    return (getPlanMenuPixelWidth() * visibleCount) + (32 * (visibleCount - 1)) + 24;
  }

  function shouldUseFocusedDesktopMode() {
    if (isMobile() || body.dataset.mode === "rapport" || !planMapPrototype?.classList.contains("has-child-plan")) {
      return false;
    }
    const visibleCount = getVisibleFocusedDesktopColumns().length;
    if (visibleCount <= 1) return false;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const estimatedSidebarWidth = getEstimatedFullPlanSidebarWidth();
    const estimatedContentWidth = viewportWidth - estimatedSidebarWidth;
    return estimatedSidebarWidth > viewportWidth * 0.5
      || estimatedContentWidth < PLAN_FOCUS_MIN_CONTENT_WIDTH;
  }

  function clearFocusedDesktopTimer() {
    if (focusedDesktopTimer) {
      window.clearTimeout(focusedDesktopTimer);
      focusedDesktopTimer = null;
    }
  }

  function clearFocusedDesktopOverride() {
    focusedDesktopColumnOverride = null;
    focusedDesktopOverrideSignature = null;
  }

  function getFocusedDesktopSelectionSignature() {
    const currentLeaf = getCurrentLeaf();
    return [
      getCurrentPlanId(),
      planSelection.focusColumn,
      planSelection.sectionKey,
      planSelection.leafKey,
      currentLeaf?.leaf?.selectedSubgoalKey || "",
      currentLeaf?.leaf?.selectedStrategyBranchKey || "",
      planSelection.strategyKey,
      planSelection.hopKey
    ].join("|");
  }

  function applyFocusedDesktopState(active) {
    const availableColumns = getVisibleFocusedDesktopColumns();
    if (!active) {
      clearFocusedDesktopOverride();
    }
    if (focusedDesktopColumnOverride && !availableColumns.includes(focusedDesktopColumnOverride)) {
      clearFocusedDesktopOverride();
    }
    const focusedColumn = active ? getDefaultFocusedDesktopColumn(availableColumns) : null;
    const focusColumns = active ? getFocusedDesktopColumnStack(focusedColumn, availableColumns) : [];
    const focusColumnsKey = focusColumns.join("-");
    focusedDesktopActive = active;

    planMapPrototype?.classList.toggle("is-focus-desktop", active);
    sidebar?.classList.toggle("is-focus-desktop", active);
    if (active && focusedColumn) {
      planMapPrototype.dataset.focusColumn = focusedColumn;
      if (sidebar) sidebar.dataset.focusColumn = focusedColumn;
      planMapPrototype.dataset.focusColumns = focusColumnsKey;
      if (sidebar) sidebar.dataset.focusColumns = focusColumnsKey;
    } else {
      delete planMapPrototype.dataset.focusColumn;
      if (sidebar) delete sidebar.dataset.focusColumn;
      delete planMapPrototype.dataset.focusColumns;
      if (sidebar) delete sidebar.dataset.focusColumns;
    }

    const labels = {
      kommune: "Kommuneplan",
      strategi: "Strategi",
      hop: "HØP"
    };
    Object.entries(getPlanColumnMap()).forEach(([key, column]) => {
      if (!column) return;
      const isVisible = active && focusColumns.includes(key);
      const isActive = active && focusedColumn === key;
      const isCollapsed = isVisible && !isActive;
      column.dataset.focusColumn = key;
      column.dataset.focusLabel = labels[key] || key;
      column.classList.toggle("is-focus-visible", isVisible);
      column.classList.toggle("is-focus-active", isActive);
      column.classList.toggle("is-focus-collapsed", isCollapsed);
      if (isCollapsed) {
        column.setAttribute("role", "button");
        column.setAttribute("tabindex", "0");
        column.setAttribute("aria-label", `Vis ${labels[key] || key}-menyen`);
      } else {
        column.removeAttribute("role");
        column.removeAttribute("tabindex");
        column.removeAttribute("aria-label");
      }
    });
  }

  function updateFocusedDesktopState(options = {}) {
    const shouldFocus = shouldUseFocusedDesktopMode();
    if (!shouldFocus) {
      clearFocusedDesktopTimer();
      clearFocusedDesktopOverride();
      if (focusedDesktopActive) {
        applyFocusedDesktopState(false);
      }
      return;
    }
    if (focusedDesktopActive || options.immediate) {
      clearFocusedDesktopTimer();
      applyFocusedDesktopState(true);
      return;
    }
    if (!focusedDesktopTimer) {
      focusedDesktopTimer = window.setTimeout(() => {
        focusedDesktopTimer = null;
        if (!shouldUseFocusedDesktopMode()) return;
        applyFocusedDesktopState(true);
        schedulePlanLinkPaths();
      }, PLAN_FOCUS_DESKTOP_DELAY_MS);
    }
  }

  function focusDesktopColumn(columnKey) {
    if (!getVisibleFocusedDesktopColumns().includes(columnKey)) return;
    focusedDesktopColumnOverride = columnKey;
    focusedDesktopOverrideSignature = getFocusedDesktopSelectionSignature();
    clearFocusedDesktopTimer();
    applyFocusedDesktopState(true);
    schedulePlanLinkPaths();
  }

  function clearPlanConnectorSchedule() {
    if (planConnectorRenderRaf) {
      window.cancelAnimationFrame(planConnectorRenderRaf);
      planConnectorRenderRaf = null;
    }
    if (planConnectorTransitionTimer) {
      window.clearTimeout(planConnectorTransitionTimer);
      planConnectorTransitionTimer = null;
    }
    if (planConnectorIntroTimer) {
      window.clearTimeout(planConnectorIntroTimer);
      planConnectorIntroTimer = null;
    }
    if (planConnectorSettleTimer) {
      window.clearTimeout(planConnectorSettleTimer);
      planConnectorSettleTimer = null;
    }
    if (planConnectorTransitionCleanup) {
      planConnectorTransitionCleanup();
      planConnectorTransitionCleanup = null;
    }
    pendingPlanConnectorColumnCount = null;
  }

  function scheduleSettledPlanLinkRender(delay = 180) {
    if (planConnectorSettleTimer) {
      window.clearTimeout(planConnectorSettleTimer);
    }
    planConnectorSettleTimer = window.setTimeout(() => {
      planConnectorSettleTimer = null;
      if (planMapPrototype?.classList.contains("is-connector-pending")) return;
      if (planConnectorRenderRaf) {
        window.cancelAnimationFrame(planConnectorRenderRaf);
      }
      planConnectorRenderRaf = window.requestAnimationFrame(() => {
        planConnectorRenderRaf = null;
        renderPlanLinkPaths({ disableAnimation: true });
      });
    }, delay);
  }

  function drawPlanLinksWhenReady(options = {}) {
    if (!planMapPrototype) return;
    planMapPrototype.classList.remove("is-connector-pending");
    planMapPrototype.classList.add("is-connector-ready");
    planMapPrototype.classList.toggle("is-connector-introducing", !!options.animateNodes);
    if (options.animateNodes) {
      planConnectorIntroTimer = window.setTimeout(() => {
        planConnectorIntroTimer = null;
        planMapPrototype.classList.remove("is-connector-introducing");
      }, 520);
    }
    planConnectorRenderRaf = window.requestAnimationFrame(() => {
      planConnectorRenderRaf = null;
      renderPlanLinkPaths();
    });
    scheduleSettledPlanLinkRender(options.animateNodes ? 720 : 220);
  }

  function schedulePlanLinkPaths(options = {}) {
    if (!planMapLinks || !planMapWorkspace || !planMapPrototype) return;
    const currentConnectorColumnCount = getPlanConnectorColumnCount();
    if (
      planMapPrototype.classList.contains("is-connector-pending")
      && !options.defer
      && pendingPlanConnectorColumnCount === currentConnectorColumnCount
    ) {
      return;
    }

    clearPlanConnectorSchedule();

    if (!planMapPrototype.classList.contains("has-child-plan")) {
      planMapPrototype.classList.remove("is-connector-pending", "is-connector-ready", "is-connector-introducing");
      planMapLinks.innerHTML = "";
      return;
    }

    if (planMapPrototype.classList.contains("is-focus-desktop")) {
      planMapPrototype.classList.remove("is-connector-pending", "is-connector-ready", "is-connector-introducing");
      planMapLinks.innerHTML = "";
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!options.defer || reduceMotion) {
      drawPlanLinksWhenReady();
      return;
    }

    planMapLinks.innerHTML = "";
    pendingPlanConnectorColumnCount = currentConnectorColumnCount;
    planMapPrototype.classList.add("is-connector-pending");
    planMapPrototype.classList.remove("is-connector-ready");

    let isFinished = false;
    const finish = () => {
      if (isFinished) return;
      isFinished = true;
      if (planConnectorTransitionCleanup) {
        planConnectorTransitionCleanup();
        planConnectorTransitionCleanup = null;
      }
      if (planConnectorTransitionTimer) {
        window.clearTimeout(planConnectorTransitionTimer);
        planConnectorTransitionTimer = null;
      }
      pendingPlanConnectorColumnCount = null;
      drawPlanLinksWhenReady({ animateNodes: true });
    };

    const handleTransitionEnd = (event) => {
      if (
        event.target === planMapWorkspace
        && (event.propertyName === "width" || event.propertyName === "max-width")
      ) {
        finish();
      }
    };

    planMapWorkspace.addEventListener("transitionend", handleTransitionEnd);
    planConnectorTransitionCleanup = () => {
      planMapWorkspace.removeEventListener("transitionend", handleTransitionEnd);
    };
    planConnectorTransitionTimer = window.setTimeout(finish, PLAN_MENU_TRANSITION_MS + 90);
  }

  function renderPlanLinkPaths(renderOptions = {}) {
    if (!planMapLinks || !planMapWorkspace) return;
    if (planMapPrototype?.classList.contains("is-connector-pending")) return;
    if (!planMapPrototype?.classList.contains("has-child-plan")) {
      planMapLinks.innerHTML = "";
      return;
    }
    if (planMapPrototype.classList.contains("is-focus-desktop")) {
      planMapLinks.innerHTML = "";
      return;
    }
    planMapLinks.innerHTML = "";

    const namespace = "http://www.w3.org/2000/svg";
    const workspaceRect = planMapWorkspace.getBoundingClientRect();
    const svgWidth = Math.max(0, Math.ceil(workspaceRect.width));
    const svgHeight = Math.max(0, Math.ceil(workspaceRect.height));
    planMapLinks.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    const drawRelations = (source, targets, options = {}) => {
      if (!source || !targets.length) return;
      const sourceRect = source.getBoundingClientRect();
      const sourceNode = options.sourceNodeSelector
        ? source.querySelector(options.sourceNodeSelector)
        : null;
      const sourceNodeRect = sourceNode?.getBoundingClientRect();
      const startX = (sourceNodeRect ? sourceNodeRect.left + (sourceNodeRect.width / 2) : sourceRect.right) - workspaceRect.left;
      const startY = (sourceNodeRect ? sourceNodeRect.top + (sourceNodeRect.height / 2) : sourceRect.top + (sourceRect.height / 2)) - workspaceRect.top;

      targets.forEach((target, relationIndex) => {
        const targetRect = target.getBoundingClientRect();
        const targetNode = options.targetNodeSelector
          ? target.querySelector(options.targetNodeSelector)
          : null;
        const targetNodeRect = targetNode?.getBoundingClientRect();
        const hasVisibleTargetNode = targetNodeRect && targetNodeRect.width > 0 && targetNodeRect.height > 0;
        const endX = (hasVisibleTargetNode ? targetNodeRect.left + (targetNodeRect.width / 2) : targetRect.left) - workspaceRect.left;
        const endY = (hasVisibleTargetNode ? targetNodeRect.top + (targetNodeRect.height / 2) : targetRect.top + (targetRect.height / 2)) - workspaceRect.top;
        const controlDistance = Math.max(34, (endX - startX) * 0.42);
        const isPrimary = options.isPrimary
          ? options.isPrimary(target)
          : target.classList.contains("is-primary-link-target")
            || target.classList.contains("plan-map-node-selected");

        const path = document.createElementNS(namespace, "path");
        path.setAttribute("d", `M ${startX} ${startY} C ${startX + controlDistance} ${startY}, ${endX - controlDistance} ${endY}, ${endX} ${endY}`);
        path.setAttribute("class", isPrimary ? "plan-map-link-path is-primary" : "plan-map-link-path");
        path.setAttribute("pathLength", "1");
        path.style.animationDelay = `${Math.min(relationIndex * 55, 180)}ms`;
        if (renderOptions.disableAnimation) {
          path.style.animation = "none";
          path.style.strokeDashoffset = "0";
        }
        planMapLinks.appendChild(path);
      });
    };

    if (planMapPrototype?.dataset.planStage === "hop-direct") {
      const directSource = planMapWorkspace.querySelector(".plan-map-link-source");
      const activeHop = getCurrentHopItem();
      const activeHopKey = activeHop ? getNodeKey(activeHop) : null;
      const hopTargets = Array.from(planMapWorkspace.querySelectorAll(".plan-map-hop-link-target"));
      let visibleHopTargets = activeHopKey
        ? hopTargets.filter((target) => target.dataset.hopKey === activeHopKey)
        : hopTargets.filter((target) => target.classList.contains("is-visible-hop-target"));
      visibleHopTargets = visibleHopTargets.filter((target) => target.getClientRects().length > 0);
      drawRelations(directSource, visibleHopTargets, {
        sourceNodeSelector: ".plan-map-link-source-node",
        targetNodeSelector: ".plan-map-hop-link-target-node",
        isPrimary: (target) => target.classList.contains("is-primary-hop-target")
          || target.classList.contains("plan-map-node-selected")
      });
      return;
    }

    const activeStrategyKey = getActiveStrategyTargetKey();
    const source = planMapWorkspace.querySelector(".plan-map-link-source");
    const allTargets = Array.from(planMapWorkspace.querySelectorAll(".plan-map-link-target"));
    let targets = activeStrategyKey
      ? allTargets.filter((target) => target.dataset.linkTargetKey === activeStrategyKey)
      : allTargets.filter((target) => target.classList.contains("is-visible-link-target"));
    if (activeStrategyKey && !targets.length) {
      targets = allTargets.filter((target) => target.classList.contains("plan-map-node-selected"));
    }
    targets = targets.filter((target) => target.getClientRects().length > 0);
    drawRelations(source, targets, {
      sourceNodeSelector: ".plan-map-link-source-node",
      targetNodeSelector: ".plan-map-link-target-node"
    });

    const activeHop = getCurrentHopItem();
    const activeHopKey = activeHop ? getNodeKey(activeHop) : null;
    const hopSource = planMapWorkspace.querySelector(".plan-map-link-target.plan-map-node-selected");
    const hopTargets = Array.from(planMapWorkspace.querySelectorAll(".plan-map-hop-link-target"));
    let visibleHopTargets = activeHopKey
      ? hopTargets.filter((target) => target.dataset.hopKey === activeHopKey)
      : hopTargets.filter((target) => target.classList.contains("is-visible-hop-target"));
    visibleHopTargets = visibleHopTargets.filter((target) => target.getClientRects().length > 0);
    drawRelations(hopSource, visibleHopTargets, {
      sourceNodeSelector: ".plan-map-hop-source-node",
      targetNodeSelector: ".plan-map-hop-link-target-node",
      isPrimary: (target) => target.classList.contains("is-primary-hop-target")
        || target.classList.contains("plan-map-node-selected")
    });
  }

  function renderPlanMenus() {
    const layoutState = isMobile() ? getLayoutState() : "flat-desktop";
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
      "hop-direct-entry": { kommune: "collapsed", strategi: "hidden", hop: "open" },
      "hop-entry": { kommune: "collapsed", strategi: "hidden", hop: "open" },
      "full": { kommune: "open", strategi: "open", hop: "open" }
    };

    const columnStates = isMobile()
      ? (columnStatesByLayout[layoutState] || columnStatesByLayout["kommune-only"])
      : { kommune: "open", strategi: "open", hop: "open" };
    const columnMap = getPlanColumnMap();

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
    syncChildPlanMenu();
    const visibleColumnKeys = getCurrentPlanVisibleColumnKeys();
    const previousVisibleColumnKeys = previousPlanVisibleColumnKeys;
    const previousVisibleSet = new Set(previousVisibleColumnKeys || []);
    const visibleSet = new Set(visibleColumnKeys);
    Object.entries(columnMap).forEach(([key, column]) => {
      if (!column) return;
      const isEntering = !!previousVisibleColumnKeys
        && visibleSet.has(key)
        && !previousVisibleSet.has(key);
      column.classList.toggle("is-column-entering", isEntering);
    });
    previousPlanVisibleColumnKeys = visibleColumnKeys;
    updateFocusedDesktopState();
    const nextConnectorColumnCount = getPlanConnectorColumnCount();
    const shouldDeferConnectorRender = previousPlanConnectorColumnCount !== null
      && nextConnectorColumnCount !== previousPlanConnectorColumnCount
      && nextConnectorColumnCount > 1;
    previousPlanConnectorColumnCount = nextConnectorColumnCount;
    schedulePlanLinkPaths({ defer: shouldDeferConnectorRender });
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
    const previousMode = body.dataset.mode || "plan";
    const nextMode = isReport ? "rapport" : "plan";
    const shouldAnimate = previousMode !== nextMode && !isMobile();

    if (modeTransitionTimer) window.clearTimeout(modeTransitionTimer);
    body.classList.remove("is-mode-switching", "mode-switch-plan-to-rapport", "mode-switch-rapport-to-plan");
    if (shouldAnimate) {
      body.classList.add("is-mode-switching", `mode-switch-${previousMode}-to-${nextMode}`);
      modeTransitionTimer = window.setTimeout(() => {
        body.classList.remove("is-mode-switching", "mode-switch-plan-to-rapport", "mode-switch-rapport-to-plan");
        modeTransitionTimer = null;
      }, 460);
    }

    body.dataset.mode = nextMode;

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
    if (isReport) {
      clearFocusedDesktopTimer();
      applyFocusedDesktopState(false);
    } else {
      updateFocusedDesktopState();
    }
    closeSidebar();
    if (isReport) {
      setActiveReportLink(location.hash || "#rapport-sammendrag");
    } else {
      setupPlanScrollSpy();
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

  Object.entries(getPlanColumnMap()).forEach(([columnKey, column]) => {
    if (!column) return;
    column.addEventListener("click", (event) => {
      if (!column.classList.contains("is-focus-collapsed")) return;
      event.preventDefault();
      focusDesktopColumn(columnKey);
    });
    column.addEventListener("keydown", (event) => {
      if (!column.classList.contains("is-focus-collapsed")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      focusDesktopColumn(columnKey);
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
  if (planMapStrategyClose) {
    planMapStrategyClose.addEventListener("click", () => {
      switchToPlan(KOMMUNEPLAN_ID, {
        entryColumn: "kommune",
        sectionKey: planSelection.sectionKey,
        leafKey: planSelection.leafKey,
        selectedSubgoalKey: null,
        strategyKey: null,
        hopKey: null
      });
    });
  }
  if (planMapHopClose) {
    planMapHopClose.addEventListener("click", () => {
      const currentLeaf = getCurrentLeaf();
      const leaf = currentLeaf?.leaf || null;
      if (isDirectHopSelection()) {
        switchToPlan(KOMMUNEPLAN_ID, {
          entryColumn: "kommune",
          sectionKey: currentLeaf?.section.key || null,
          leafKey: leaf?.key || null,
          selectedSubgoalKey: null,
          strategyKey: null,
          hopKey: null
        });
        return;
      }
      switchToPlan(getStrategyPlanIdForLeaf(leaf) || OPPVEKSTPLAN_ID, {
        entryColumn: "strategi",
        sectionKey: currentLeaf?.section.key || null,
        leafKey: leaf?.key || null,
        selectedSubgoalKey: leaf?.selectedSubgoalKey || null,
        strategyKey: planSelection.strategyKey,
        hopKey: null
      });
    });
  }

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
  if (planContent) {
    const observer = new MutationObserver(schedulePlanScrollSpySetup);
    observer.observe(planContent, { childList: true, subtree: false });
  }

  window.addEventListener("resize", () => {
    applyModeVisibility(body.dataset.mode === "rapport");
    updateFocusedDesktopState({ immediate: focusedDesktopActive });
    syncOverlay();
    schedulePlanLinkPaths();
  });

  window.addEventListener("popstate", syncPlanContextFromLocation);

  async function init() {
    assignOppvekstSubgoalIds();
    await Promise.all([
      hydratePlanModelFromData(),
      hydrateKpiModelFromData()
    ]);
    syncPlanContextFromLocation();
    renderPlanMenus();
    setupPlanScrollSpy();
    syncOverlay();
    setMode(body.dataset.mode || "plan");
  }

  init();
})();
