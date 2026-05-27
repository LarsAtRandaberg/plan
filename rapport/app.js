(() => {
  const REPORT_INDEX_URL = "../data-hop/rapporter/index.json";

  const lockedShell = document.getElementById("locked-shell");
  const lockedTitle = document.getElementById("locked-title");
  const keyForm = document.getElementById("key-form");
  const keyInput = document.getElementById("key-input");
  const layout = document.getElementById("report-layout");
  const reportMenu = document.getElementById("report-menu");
  const sidebarReportId = document.getElementById("sidebar-report-id");
  const sidebarTitle = document.getElementById("sidebar-title");
  const reportKicker = document.getElementById("report-kicker");
  const reportTitle = document.getElementById("report-title");
  const reportIntro = document.getElementById("report-intro");
  const reportMeta = document.getElementById("report-meta");
  const summaryGrid = document.getElementById("summary-grid");
  const statusGrid = document.getElementById("status-grid");
  const sourceSwitcher = document.getElementById("source-switcher");
  const tabsEl = document.getElementById("statement-tabs");
  const panelsEl = document.getElementById("statement-panels");
  const publishPanel = document.getElementById("publish-panel");

  let activeTableId = null;
  let activeSource = "regnskap";
  let statementData = {};

  function rootPath(path) {
    return "../" + path;
  }

  function safeId(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function formatDate(value) {
    if (!value) return "Ikke satt";
    return new Date(value + "T00:00:00").toLocaleDateString("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function formatAmount(amount) {
    if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "Ikke beregnet";
    return Math.round(Number(amount) / 1000).toLocaleString("nb-NO");
  }

  function formatFullAmount(amount) {
    if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "Ikke beregnet";
    return Math.round(Number(amount)).toLocaleString("nb-NO");
  }

  function formatPercent(amount) {
    if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "Ikke beregnet";
    return (Number(amount) * 100).toLocaleString("nb-NO", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + " %";
  }

  function formatValue(amount, valueType) {
    return valueType === "percent" ? formatPercent(amount) : formatAmount(amount);
  }

  function findTable(data, id) {
    return data && Array.isArray(data.tables) ? data.tables.find((table) => table.id === id) : null;
  }

  function findRow(table, post) {
    return table && Array.isArray(table.rows) ? table.rows.find((row) => row.post === post) : null;
  }

  function makeRowLookup(table) {
    const rows = table && Array.isArray(table.rows) ? table.rows : [];
    return new Map(rows.map((row) => [String(row.post), row]));
  }

  function makeChildLookup(row) {
    const children = row && Array.isArray(row.children) ? row.children : [];
    return new Map(children.map((child) => [String(child.code), child]));
  }

  function addMeta(label, value) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    reportMeta.appendChild(wrap);
  }

  function renderMenu(report) {
    reportMenu.innerHTML = "";
    report.sections.forEach((section) => {
      const link = document.createElement("a");
      link.href = "#" + section.id;
      link.textContent = section.label;
      reportMenu.appendChild(link);
    });

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      reportMenu.querySelectorAll("a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + visible[0].target.id);
      });
    }, { rootMargin: "-120px 0px -72% 0px", threshold: 0.01 });

    report.sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
  }

  function renderHero(report) {
    sidebarReportId.textContent = report.id;
    sidebarTitle.textContent = report.title;
    reportKicker.textContent = report.subtitle || "Tertialrapport";
    reportTitle.textContent = report.title;
    reportIntro.textContent = report.intro || "";
    reportMeta.innerHTML = "";
    addMeta("Periode", report.period.label);
    addMeta("Rapporteringsdato", formatDate(report.period.reportingDate));
    addMeta("Status", report.status === "draft" ? "Kladd" : "Publisert");
    addMeta("Publiseres", formatDate(report.plannedPublishDate));
  }

  function renderSummary() {
    const regnskap = statementData.regnskap;
    const vedtatt = statementData.vedtatt;
    const driftR = findTable(regnskap, "okonomisk-oversikt-drift-5-6");
    const driftB = findTable(vedtatt, "okonomisk-oversikt-drift-5-6");
    const investeringR = findTable(regnskap, "bevilgningsoversikt-investering-5-5-forste-ledd");
    const investeringB = findTable(vedtatt, "bevilgningsoversikt-investering-5-5-forste-ledd");

    const items = [
      { label: "Sum driftsinntekter", regnskap: findRow(driftR, "9"), budsjett: findRow(driftB, "9") },
      { label: "Sum driftsutgifter", regnskap: findRow(driftR, "15"), budsjett: findRow(driftB, "15") },
      { label: "Netto driftsresultat", regnskap: findRow(driftR, "24"), budsjett: findRow(driftB, "24") },
      { label: "Investeringer", regnskap: findRow(investeringR, "6"), budsjett: findRow(investeringB, "6") }
    ];

    summaryGrid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "summary-card";
      const label = document.createElement("span");
      label.textContent = item.label;
      const value = document.createElement("strong");
      value.textContent = item.regnskap ? formatFullAmount(item.regnskap.amount) : "Ikke beregnet";
      const note = document.createElement("small");
      note.textContent = "Vedtatt budsjett: " + (item.budsjett ? formatFullAmount(item.budsjett.amount) : "Ikke beregnet");
      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(note);
      summaryGrid.appendChild(card);
    });
  }

  function renderStatus(report) {
    const sourceLabel = report.dataMode === "live-until-publish" ? "Oppdateres frem til låsing" : "Låst";
    const items = [
      { label: "Datagrunnlag", value: sourceLabel, note: "Regnskap og vedtatt budsjett fra Xledger-grunnlaget." },
      { label: "Tertialavgrensing", value: report.period.label, note: "Rapportsiden er rigget for periodisert visning." },
      { label: "Kladdelenke", value: report.requiresKey ? "Nøkkel aktiv" : "Åpen", note: report.requiresKey ? "Kan åpnes med nøkkel i URL." : "Rapporten er publisert." },
      { label: "Offisiell versjon", value: report.lockedAt ? formatDate(report.lockedAt) : "Ikke låst", note: "Når rapporten låses skal tallene fryses." }
    ];

    statusGrid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "status-card";
      const label = document.createElement("span");
      label.textContent = item.label;
      const value = document.createElement("strong");
      value.textContent = item.value;
      const note = document.createElement("small");
      note.textContent = item.note;
      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(note);
      statusGrid.appendChild(card);
    });
  }

  function renderPublish(report) {
    const items = [
      ["Rapport-ID", report.id],
      ["Status", report.status === "draft" ? "Kladd" : "Publisert"],
      ["Planlagt publisering", formatDate(report.plannedPublishDate)],
      ["Låst dato", report.lockedAt ? formatDate(report.lockedAt) : "Ikke låst"]
    ];

    publishPanel.innerHTML = "";
    items.forEach(([labelText, valueText]) => {
      const item = document.createElement("div");
      item.className = "publish-item";
      const label = document.createElement("span");
      label.textContent = labelText;
      const value = document.createElement("strong");
      value.textContent = valueText;
      item.appendChild(label);
      item.appendChild(value);
      publishPanel.appendChild(item);
    });
  }

  function renderSourceSwitcher() {
    sourceSwitcher.innerHTML = "";
    [
      { id: "regnskap", label: "Regnskap" },
      { id: "vedtatt", label: "Vedtatt budsjett" }
    ].forEach((source) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = source.id === activeSource ? "active" : "";
      btn.textContent = source.label;
      btn.addEventListener("click", () => {
        activeSource = source.id;
        renderSourceSwitcher();
        renderStatements();
      });
      sourceSwitcher.appendChild(btn);
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
    toggle.textContent = hasChildren ? "+" : "";
    toggle.setAttribute("aria-label", "Vis detaljer for " + row.label);
    toggle.setAttribute("aria-expanded", "false");
    labelWrap.appendChild(toggle);

    const text = document.createElement("span");
    text.textContent = row.post + ". " + row.label;
    labelWrap.appendChild(text);
    labelTd.appendChild(labelWrap);
    tr.appendChild(labelTd);

    const amountTd = document.createElement("td");
    amountTd.className = "amount";
    amountTd.textContent = formatValue(row.amount, row.valueType);
    tr.appendChild(amountTd);

    if (hasChildren) {
      toggle.addEventListener("click", () => {
        const open = tr.classList.toggle("open");
        toggle.textContent = open ? "-" : "+";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
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

  function makeBalanceCells(tr, balance) {
    ["ib", "endring", "ub"].forEach((key) => {
      const td = document.createElement("td");
      td.className = "amount";
      td.textContent = formatAmount(balance ? balance[key] : null);
      tr.appendChild(td);
    });
  }

  function makeBalanceRow(row, tableKey) {
    const hasChildren = Array.isArray(row.children) && row.children.length > 0;
    const tr = document.createElement("tr");
    tr.className = "statement-row statement-row-" + (row.rowType || "line");
    const labelTd = document.createElement("td");
    const labelWrap = document.createElement("div");
    labelWrap.className = "statement-label";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = hasChildren ? "row-toggle" : "row-toggle placeholder";
    toggle.textContent = hasChildren ? "+" : "";
    toggle.setAttribute("aria-label", "Vis detaljer for " + row.label);
    toggle.setAttribute("aria-expanded", "false");
    labelWrap.appendChild(toggle);
    const text = document.createElement("span");
    text.textContent = row.post + ". " + row.label;
    labelWrap.appendChild(text);
    labelTd.appendChild(labelWrap);
    tr.appendChild(labelTd);
    makeBalanceCells(tr, row.balance);

    if (hasChildren) {
      toggle.addEventListener("click", () => {
        const open = tr.classList.toggle("open");
        toggle.textContent = open ? "-" : "+";
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        tr.parentElement.querySelectorAll(`tr[data-parent="${tableKey}-${row.post}"]`).forEach((childRow) => {
          childRow.classList.toggle("open", open);
        });
      });
    }
    return tr;
  }

  function makeBalanceChildRow(parentPost, child, tableKey) {
    const tr = document.createElement("tr");
    tr.className = "child-row";
    tr.dataset.parent = tableKey + "-" + parentPost;
    const labelTd = document.createElement("td");
    labelTd.className = "child-label";
    labelTd.textContent = child.code + " " + child.name;
    tr.appendChild(labelTd);
    makeBalanceCells(tr, child.balance);
    return tr;
  }

  function renderStatements() {
    const data = statementData[activeSource];
    tabsEl.innerHTML = "";
    panelsEl.innerHTML = "";
    if (!data || !Array.isArray(data.tables)) {
      panelsEl.innerHTML = "<div class=\"error\">Tabellgrunnlaget kunne ikke lastes.</div>";
      return;
    }

    const visibleTables = data.tables.filter((tableData) => {
      return tableData.id !== "balanseregnskap-5-8" || tableData.rows.some((row) => row.canCalculate);
    });
    if (!visibleTables.some((tableData) => tableData.id === activeTableId)) {
      activeTableId = visibleTables[0]?.id || null;
    }

    visibleTables.forEach((tableData, index) => {
      const tableKey = safeId(activeSource + "-" + (tableData.id || tableData.name || index));
      const tabId = "tab-" + tableKey;
      const panelId = "panel-" + tableKey;
      const isActive = tableData.id === activeTableId || (!activeTableId && index === 0);
      const isBalanceTable = tableData.id === "balanseregnskap-5-8";

      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "statement-tab" + (isActive ? " active" : "");
      tab.id = tabId;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("aria-controls", panelId);
      tab.textContent = tableData.name;
      tabsEl.appendChild(tab);

      const panel = document.createElement("section");
      panel.className = "statement-panel" + (isActive ? " active" : "");
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);

      const header = document.createElement("div");
      header.className = "table-heading";
      const h3 = document.createElement("h3");
      h3.textContent = tableData.name;
      const ref = document.createElement("span");
      ref.textContent = [tableData.legalRef, "Tall i hele tusen"].filter(Boolean).join(" · ");
      header.appendChild(h3);
      header.appendChild(ref);
      panel.appendChild(header);

      const tableWrap = document.createElement("div");
      tableWrap.className = "table-wrap";
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      const headers = isBalanceTable
        ? ["Post", "01.01." + data.year, "Endring", "31.12." + data.year]
        : ["Post", activeSource === "regnskap" ? "Regnskap" : "Vedtatt budsjett"];
      headers.forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      tableData.rows.forEach((row) => {
        if (isBalanceTable) {
          tbody.appendChild(makeBalanceRow(row, tableKey));
          (row.children || []).forEach((child) => tbody.appendChild(makeBalanceChildRow(row.post, child, tableKey)));
          return;
        }
        tbody.appendChild(makeTableRow(row, tableKey));
        (row.children || []).forEach((child) => tbody.appendChild(makeChildRow(row.post, child, tableKey)));
      });
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      panel.appendChild(tableWrap);
      panelsEl.appendChild(panel);

      tab.addEventListener("click", () => {
        activeTableId = tableData.id;
        tabsEl.querySelectorAll(".statement-tab").forEach((btn) => {
          const active = btn === tab;
          btn.classList.toggle("active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
        });
        panelsEl.querySelectorAll(".statement-panel").forEach((p) => p.classList.toggle("active", p === panel));
      });
    });
  }

  async function renderReport(reportMetaItem) {
    const report = await fetch(rootPath(reportMetaItem.path), { cache: "no-store" }).then((r) => r.json());
    renderMenu(report);
    renderHero(report);
    renderStatus(report);
    renderPublish(report);

    panelsEl.innerHTML = "<div class=\"loading\">Laster tabeller...</div>";
    statementData = {
      regnskap: await fetch(rootPath(report.sources.statementRegnskap), { cache: "no-store" }).then((r) => r.json()),
      vedtatt: await fetch(rootPath(report.sources.statementVedtatt), { cache: "no-store" }).then((r) => r.json())
    };
    renderSummary();
    renderSourceSwitcher();
    renderStatements();
  }

  function showLocked(report) {
    lockedTitle.textContent = report.title;
    lockedShell.hidden = false;
    layout.hidden = true;
    keyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.set("key", keyInput.value.trim());
      window.location.href = url.toString();
    }, { once: true });
  }

  async function init() {
    const params = new URLSearchParams(location.search);
    const requestedId = params.get("id") || "2026.T1";
    const index = await fetch(REPORT_INDEX_URL, { cache: "no-store" }).then((r) => r.json());
    const report = index.reports.find((item) => item.id === requestedId) || index.reports[0];
    const hasKey = !report.requiresKey || report.status !== "draft" || params.get("key") === report.accessKey;

    if (!hasKey) {
      showLocked(report);
      return;
    }

    lockedShell.hidden = true;
    layout.hidden = false;
    await renderReport(report);
  }

  init().catch((error) => {
    console.error(error);
    lockedShell.hidden = true;
    layout.hidden = false;
    reportTitle.textContent = "Kunne ikke laste rapporten";
    reportIntro.textContent = "Rapportdata mangler eller kunne ikke leses.";
    panelsEl.innerHTML = "<div class=\"error\">Rapporten kunne ikke lastes.</div>";
  });
})();
