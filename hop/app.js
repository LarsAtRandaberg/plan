(() => {
  const DATA_INDEX_URL = "../data-hop/index.json";

  const yearSwitcher = document.getElementById("year-switcher");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const summaryGrid = document.getElementById("summary-grid");
  const tabsEl = document.getElementById("statement-tabs");
  const panelsEl = document.getElementById("statement-panels");

  function formatAmount(amount) {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return "Ikke beregnet";
    return Math.round(Number(amount)).toLocaleString("nb-NO");
  }

  function safeId(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function setUrlYear(year) {
    const url = new URL(window.location.href);
    url.searchParams.set("year", year);
    history.replaceState(null, "", url);
  }

  function findRow(table, post) {
    return table && table.rows ? table.rows.find((row) => row.post === post) : null;
  }

  function makeSummary(data) {
    const drift = data.tables.find((table) => table.id === "okonomisk-oversikt-drift-5-6");
    const investering = data.tables.find((table) => table.id === "bevilgningsoversikt-investering-5-5-forste-ledd");
    const items = [
      { label: "Sum driftsinntekter", row: findRow(drift, "9"), icon: "ti-arrow-down-left" },
      { label: "Sum driftsutgifter", row: findRow(drift, "15"), icon: "ti-arrow-up-right" },
      { label: "Netto driftsresultat", row: findRow(drift, "24"), icon: "ti-chart-line" },
      { label: "Investeringer", row: findRow(investering, "6"), icon: "ti-building-community" }
    ];

    summaryGrid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "summary-card";
      const icon = document.createElement("i");
      icon.className = "ti " + item.icon;
      icon.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = item.label;
      const value = document.createElement("strong");
      value.textContent = item.row ? formatAmount(item.row.amount) : "Ikke beregnet";
      card.appendChild(icon);
      card.appendChild(label);
      card.appendChild(value);
      summaryGrid.appendChild(card);
    });
  }

  function makeTableRow(row, tableKey) {
    const hasChildren = Array.isArray(row.children) && row.children.length > 0;
    const tr = document.createElement("tr");
    tr.className = "statement-row statement-row-" + (row.rowType || "line");

    const labelTd = document.createElement("td");
    const labelWrap = document.createElement("div");
    labelWrap.className = "statement-label";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = hasChildren ? "row-toggle" : "row-toggle placeholder";
    toggle.textContent = hasChildren ? "▸" : "";
    toggle.setAttribute("aria-label", "Vis detaljer for " + row.label);
    labelWrap.appendChild(toggle);

    const text = document.createElement("span");
    text.textContent = row.post + ". " + row.label;
    labelWrap.appendChild(text);
    labelTd.appendChild(labelWrap);
    tr.appendChild(labelTd);

    const amountTd = document.createElement("td");
    amountTd.className = "amount";
    amountTd.textContent = formatAmount(row.amount);
    tr.appendChild(amountTd);

    if (hasChildren) {
      toggle.addEventListener("click", () => {
        const open = tr.classList.toggle("open");
        toggle.textContent = open ? "▾" : "▸";
        tr.parentElement.querySelectorAll(`tr[data-parent="${tableKey}-${row.post}"]`).forEach((childRow) => {
          childRow.classList.toggle("open", open);
        });
      });
    }

    return tr;
  }

  function makeChildRow(parentPost, child, tableKey) {
    const tr = document.createElement("tr");
    tr.className = "child-row";
    tr.dataset.parent = tableKey + "-" + parentPost;

    const labelTd = document.createElement("td");
    labelTd.className = "child-label";
    labelTd.textContent = child.code + " " + child.name;
    tr.appendChild(labelTd);

    const amountTd = document.createElement("td");
    amountTd.className = "amount";
    amountTd.textContent = formatAmount(child.amount);
    tr.appendChild(amountTd);
    return tr;
  }

  function renderStatements(data) {
    tabsEl.innerHTML = "";
    panelsEl.innerHTML = "";

    data.tables.forEach((tableData, index) => {
      const tableKey = safeId(tableData.id || tableData.name || index);
      const tabId = "tab-" + tableKey;
      const panelId = "panel-" + tableKey;

      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "statement-tab" + (index === 0 ? " active" : "");
      tab.id = tabId;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
      tab.setAttribute("aria-controls", panelId);
      tab.textContent = tableData.name;
      tabsEl.appendChild(tab);

      const panel = document.createElement("section");
      panel.className = "statement-panel" + (index === 0 ? " active" : "");
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);

      const header = document.createElement("div");
      header.className = "table-heading";
      const h2 = document.createElement("h2");
      h2.textContent = tableData.name;
      const ref = document.createElement("span");
      ref.textContent = tableData.legalRef || "";
      header.appendChild(h2);
      header.appendChild(ref);
      panel.appendChild(header);

      const tableWrap = document.createElement("div");
      tableWrap.className = "table-wrap";
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      ["Post", "Beløp"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      tableData.rows.forEach((row) => {
        tbody.appendChild(makeTableRow(row, tableKey));
        (row.children || []).forEach((child) => tbody.appendChild(makeChildRow(row.post, child, tableKey)));
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      panel.appendChild(tableWrap);
      panelsEl.appendChild(panel);

      tab.addEventListener("click", () => {
        tabsEl.querySelectorAll(".statement-tab").forEach((btn) => {
          const active = btn === tab;
          btn.classList.toggle("active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
        });
        panelsEl.querySelectorAll(".statement-panel").forEach((p) => p.classList.toggle("active", p === panel));
      });
    });
  }

  function renderYearSwitcher(indexData, activeYear) {
    const datasets = indexData.datasets
      .filter((dataset) => dataset.kind === "beregnet-obligatoriske-tabeller")
      .sort((a, b) => a.year - b.year);

    yearSwitcher.innerHTML = "";
    datasets.forEach((dataset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = dataset.year === activeYear ? "active" : "";
      btn.textContent = dataset.year;
      btn.addEventListener("click", () => loadYear(dataset.year));
      yearSwitcher.appendChild(btn);
    });
  }

  async function loadYear(year) {
    const indexData = await fetch(DATA_INDEX_URL, { cache: "no-store" }).then((r) => r.json());
    const datasets = indexData.datasets.filter((dataset) => dataset.kind === "beregnet-obligatoriske-tabeller");
    const active = datasets.find((dataset) => dataset.year === year) || datasets[datasets.length - 1];
    if (!active) throw new Error("Fant ingen beregnede HØP-tabeller.");

    setUrlYear(active.year);
    renderYearSwitcher(indexData, active.year);
    heroSubtitle.textContent = "Opprinnelig vedtatt budsjett " + active.year;

    tabsEl.innerHTML = "";
    panelsEl.innerHTML = "<div class=\"loading\">Laster tabeller...</div>";
    const data = await fetch("../" + active.path, { cache: "no-store" }).then((r) => r.json());
    makeSummary(data);
    renderStatements(data);
  }

  const requestedYear = Number(new URLSearchParams(location.search).get("year"));
  loadYear(requestedYear || 2026).catch((error) => {
    console.error(error);
    heroSubtitle.textContent = "Kunne ikke laste HØP-data.";
    panelsEl.innerHTML = "<div class=\"error\">HØP-data kunne ikke lastes.</div>";
  });
})();
