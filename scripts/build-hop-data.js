const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_HOP = path.join(ROOT, "data-hop");

const KLASSE_NAVN = {
  "0": "Investering",
  "1": "Drift",
  "2": "Balanse"
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  const fullPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function codeNameMap(relativePath) {
  const data = readJson(relativePath);
  const map = new Map();
  (data.classificationItems || []).forEach((item) => {
    map.set(String(item.code), item.name || "");
  });
  return map;
}

function splitCodeAndName(value) {
  const text = String(value || "");
  const match = text.match(/^([^\s]+)\s+-\s*(.*)$/);
  if (!match) return { kode: "", navn: text };
  return { kode: match[1], navn: match[2] };
}

function parseDim(cell) {
  if (!Array.isArray(cell)) return { kode: "", navn: "", tekst: "" };
  return {
    id: cell[0] || 0,
    level: cell[1] || 0,
    kode: String(cell[2] || ""),
    tekst: String(cell[3] || ""),
    beskrivelse: String(cell[4] || ""),
    navn: String(cell[5] || "")
  };
}

function parseSystemkonto(cell, kostraArtsMap, begrepMap) {
  const text = Array.isArray(cell) ? String(cell[1] || "") : String(cell || "");
  const parsed = splitCodeAndName(text);
  const systemkonto = String(parsed.kode || "").padStart(4, "0");
  const klasse = systemkonto.slice(0, 1);
  const kostraart = systemkonto.slice(1);
  const kapittel = systemkonto.slice(1, 3);

  return {
    systemkontoKode: systemkonto,
    systemkontoNavn: parsed.navn,
    systemkontoTekst: text,
    klasse,
    klasseNavn: KLASSE_NAVN[klasse] || "Ukjent",
    kostraart,
    kostraartNavn: kostraArtsMap.get(kostraart) || "",
    kapittel,
    kapittelNavn: begrepMap.get(kapittel) || ""
  };
}

function normalizeBudget(year) {
  const budget = readJson(`data-hop/vedtatt/${year}.adv.json`);
  const kostraArtsMap = codeNameMap("data-hop/referanse/kostra-regnskapsarter-2025.json");
  const begrepMap = codeNameMap("data-hop/referanse/kostra-regnskapsbegrep-arter-kapitler-2025.json");
  const funksjonMap = codeNameMap("data-hop/referanse/kostra-regnskapsfunksjoner-2025.json");

  const groups = budget.field_groups || [];
  const groupIndex = Object.fromEntries(groups.map((group, index) => [group.title, index]));
  const amountIndex = groupIndex[String(year)];

  if (amountIndex == null) {
    throw new Error(`Fant ikke belopsgruppe ${year} i data-hop/vedtatt/${year}.adv.json`);
  }

  const rows = (budget.rows || []).map((row, index) => {
    const systemkonto = parseSystemkonto(row[groupIndex.Systemkonto], kostraArtsMap, begrepMap);
    const ansvar = parseDim(row[groupIndex.Ansvar]);
    const prosjekt = parseDim(row[groupIndex.Prosjekt]);
    const funksjon = parseDim(row[groupIndex["Funksjon (K)"]]);
    const fridimensjon = parseDim(row[groupIndex.Fridimensjon]);
    const belop = Number(row[amountIndex]?.[0] || 0);
    const count = Number(row[groupIndex.Count]?.[0] || 0);

    return {
      row: index + 1,
      aar: year,
      belop,
      count,
      ...systemkonto,
      ansvarKode: ansvar.kode,
      ansvarNavn: ansvar.navn,
      ansvarTekst: ansvar.tekst,
      prosjektKode: prosjekt.kode,
      prosjektNavn: prosjekt.navn,
      prosjektTekst: prosjekt.tekst,
      funksjonKode: funksjon.kode,
      funksjonNavn: funksjonMap.get(funksjon.kode) || funksjon.navn,
      funksjonTekst: funksjon.tekst,
      fridimensjonKode: fridimensjon.kode,
      fridimensjonNavn: fridimensjon.navn,
      fridimensjonTekst: fridimensjon.tekst
    };
  });

  const result = {
    type: "hop-normalisert-vedtatt-budsjett",
    version: 1,
    year,
    source: `data-hop/vedtatt/${year}.adv.json`,
    generated: new Date().toISOString().slice(0, 10),
    rowCount: rows.length,
    rows
  };

  writeJson(`data-hop/normalisert/vedtatt-${year}.json`, result);
  return result;
}

function makeAmountByArt(rows, klasse) {
  const map = new Map();
  rows
    .filter((row) => row.klasse === klasse)
    .forEach((row) => {
      map.set(row.kostraart, (map.get(row.kostraart) || 0) + row.belop);
    });
  return map;
}

function sumRange(amounts, from, to) {
  let total = 0;
  for (const [code, amount] of amounts.entries()) {
    if (/^\d+$/.test(code) && Number(code) >= Number(from) && Number(code) <= Number(to)) {
      total += amount;
    }
  }
  return total;
}

function artValue(amounts, code) {
  return amounts.get(String(code).padStart(3, "0")) || 0;
}

function rowDisplayMultiplier(tableId, post) {
  const postNumber = Number(post);
  if (tableId === "okonomisk-oversikt-drift-5-6") {
    if ((postNumber >= 1 && postNumber <= 9) || [17, 18, 23, 27, 29].includes(postNumber)) return -1;
    if ([16, 24, 32].includes(postNumber)) return -1;
    return 1;
  }
  if (tableId === "bevilgningsoversikt-drift-5-4-forste-ledd") {
    if ((postNumber >= 1 && postNumber <= 5) || [10, 11, 16, 20, 22].includes(postNumber)) return -1;
    if ([9, 17, 25].includes(postNumber)) return -1;
    return 1;
  }
  if (tableId === "bevilgningsoversikt-investering-5-5-forste-ledd") {
    if (postNumber >= 7 && postNumber <= 14) return -1;
    if ([16, 18, 20, 22, 24].includes(postNumber)) return -1;
    if (postNumber === 27) return -1;
    return 1;
  }
  return 1;
}

function evalArtRule(rule, amounts) {
  if (!rule || /post\(|fra_/.test(rule)) return null;
  let expr = rule.replace(/;.*$/, "");
  expr = expr.replace(/sum\((\d+):(\d+)\)/g, (_, from, to) => String(sumRange(amounts, from, to)));
  expr = expr.replace(/(?<![A-Za-z])\b(\d{3})\b/g, (_, code) => String(artValue(amounts, code)));
  if (!/^[0-9+\-*/ ().]+$/.test(expr)) return null;
  return Function(`return (${expr})`)();
}

function evalPostRule(rule, values) {
  if (!rule || /fra_/.test(rule)) return null;
  let expr = rule.replace(/.*;/, "").trim();
  expr = expr.replace(/post\((\d+):(\d+)\)/g, (_, from, to) => {
    let total = 0;
    for (let post = Number(from); post <= Number(to); post += 1) total += values.get(String(post)) || 0;
    return String(total);
  });
  expr = expr.replace(/post\((\d+)\)/g, (_, post) => String(values.get(String(Number(post))) || 0));
  if (!/^[0-9+\-*/ ().]+$/.test(expr)) return null;
  return Function(`return (${expr})`)();
}

function calculateStatements(year, normalized) {
  const statements = readJson("data-hop/oppstillinger/obligatoriske-tabeller-2026.json");
  const tables = statements.tables.map((table) => {
    const amounts = makeAmountByArt(normalized.rows, table.klasse);
    const values = new Map();
    const rows = table.rows.map((row) => {
      let rawAmount = evalArtRule(row.rule, amounts);
      const isArtRule = rawAmount != null;
      if (rawAmount == null) rawAmount = evalPostRule(row.rule, values);
      const canCalculate = rawAmount != null;
      const displayAmount = canCalculate
        ? isArtRule
          ? rawAmount * rowDisplayMultiplier(table.id, row.post)
          : rawAmount
        : null;
      if (canCalculate) values.set(row.post, displayAmount);
      return {
        post: row.post,
        label: row.label,
        rule: row.rule,
        rowType: row.rowType || "line",
        canCalculate,
        amount: displayAmount
      };
    });
    return {
      id: table.id,
      name: table.name,
      legalRef: table.legalRef,
      klasse: table.klasse,
      klasseNavn: KLASSE_NAVN[table.klasse] || "Ukjent",
      rows
    };
  });

  const result = {
    type: "hop-beregnet-obligatoriske-tabeller",
    version: 1,
    year,
    source: `data-hop/normalisert/vedtatt-${year}.json`,
    statementDefinition: "data-hop/oppstillinger/obligatoriske-tabeller-2026.json",
    generated: new Date().toISOString().slice(0, 10),
    tables
  };

  writeJson(`data-hop/aggregert/obligatoriske-tabeller-${year}-vedtatt.json`, result);
  return result;
}

const years = process.argv.slice(2).map(Number);
const targetYears = years.length ? years : [2025, 2026];

for (const year of targetYears) {
  const normalized = normalizeBudget(year);
  const calculated = calculateStatements(year, normalized);
  console.log(`${year}: normaliserte ${normalized.rowCount} linjer, beregnet ${calculated.tables.length} oppstillinger`);
}
