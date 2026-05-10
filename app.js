// =========================
  // Søk
  // =========================
  let searchData = { plans: [], goals: [], innhold: [] };

  function buildSearchIndex(plans, goals, innhold) {
    searchData = { plans, goals, innhold };
  }

  function runSearch(query) {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();

    if (q.length < 2) {
      searchResults.classList.remove("open");
      searchResults.innerHTML = "";
      return;
    }

    const planMap = new Map(searchData.plans.map(function(p) { return [p.planID, p.planNavn]; }));

    const goalHits = searchData.goals.filter(function(g) {
      return (g.maalNavn || "").toLowerCase().includes(q);
    });

    const innholdHits = searchData.innhold.filter(function(r) {
      return (r.overskrift || "").toLowerCase().includes(q) ||
             (r.brodtekst  || "").toLowerCase().includes(q);
    });

    if (goalHits.length === 0 && innholdHits.length === 0) {
      searchResults.innerHTML = "<div class=\"search-empty\">Ingen treff for «" + query.trim() + "»</div>";
      searchResults.classList.add("open");
      return;
    }

    // Gruppér på plan
    const groups = new Map();

    goalHits.forEach(function(g) {
      const planId   = g.maalPlan;
      const planNavn = planMap.get(planId) || "Ukjent plan";
      if (!groups.has(planId)) groups.set(planId, { planNavn, goals: [], innhold: [] });
      groups.get(planId).goals.push(g);
    });

    innholdHits.forEach(function(r) {
      const planId   = r.innholdPlan;
      const planNavn = planMap.get(planId) || "Ukjent plan";
      if (!groups.has(planId)) groups.set(planId, { planNavn, goals: [], innhold: [] });
      groups.get(planId).innhold.push(r);
    });

    searchResults.innerHTML = "";

    groups.forEach(function(group, planId) {
      const groupLabel = document.createElement("div");
      groupLabel.className = "search-group-label";
      groupLabel.textContent = group.planNavn;
      searchResults.appendChild(groupLabel);

      group.goals.forEach(function(g) {
        const anchorId = "maal-" + safeId(g.maalID);
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML =
          "<i class=\"ti ti-target search-result-icon\" aria-hidden=\"true\"></i>" +
          "<div>" +
            "<div class=\"search-result-title\">" + (g.maalNavn || "") + "</div>" +
            "<div class=\"search-result-sub\">Mål</div>" +
          "</div>";
        item.addEventListener("click", function() {
          searchResults.classList.remove("open");
          searchInput.value = "";
          if (planId !== currentPlanId) {
            history.pushState(null, "", "?id=" + encodeURIComponent(planId) + "#" + anchorId);
            currentPlanId = planId;
            init().then(function() {
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          } else {
            const el = document.getElementById(anchorId);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        searchResults.appendChild(item);
      });

      group.innhold.forEach(function(r) {
        const anchorId = "maal-" + safeId(r.innholdMaal);
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML =
          "<i class=\"ti ti-file-text search-result-icon\" aria-hidden=\"true\"></i>" +
          "<div>" +
            "<div class=\"search-result-title\">" + (r.overskrift || "") + "</div>" +
            "<div class=\"search-result-sub\">" + (group.planNavn || "") + "</div>" +
          "</div>";
        item.addEventListener("click", function() {
          searchResults.classList.remove("open");
          searchInput.value = "";
          if (planId !== currentPlanId) {
            history.pushState(null, "", "?id=" + encodeURIComponent(planId) + "#" + anchorId);
            currentPlanId = planId;
            init().then(function() {
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          } else {
            const el = document.getElementById(anchorId);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        searchResults.appendChild(item);
      });
    });

    searchResults.classList.add("open");
  }

  function attachSearchListeners() {
    if (!searchInput) return;

    searchInput.addEventListener("input", function() {
      runSearch(searchInput.value);
    });

    searchInput.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        searchResults.classList.remove("open");
        searchInput.value = "";
      }
    });

    document.addEventListener("click", function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.remove("open");
      }
    });
  }
