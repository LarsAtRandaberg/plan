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

function referencePathForYear(prefix, year) {
  const referanseDir = path.join(DATA_HOP, "referanse");
  const candidates = fs
    .readdirSync(referanseDir)
    .map((fileName) => {
      const match = fileName.match(new RegExp(`^${prefix}-(\\d{4})\\.json$`));
      return match ? { year: Number(match[1]), path: `data-hop/referanse/${fileName}` } : null;
    })
    .filter(Boolean)
    .filter((candidate) => candidate.year <= year)
    .sort((a, b) => b.year - a.year);

  if (!candidates.length) {
    throw new Error(`Fant ingen referansefil for ${prefix} for ${year} eller tidligere`);
  }

  return candidates[0].path;
}

function referencePathsForYear(year) {
  return {
    kostraArter: referencePathForYear("kostra-regnskapsarter", year),
    kostraBegrepArterKapitler: referencePathForYear("kostra-regnskapsbegrep-arter-kapitler", year),
    kostraFunksjoner: referencePathForYear("kostra-regnskapsfunksjoner", year)
  };
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
  const references = referencePathsForYear(year);
  const kostraArtsMap = codeNameMap(references.kostraArter);
  const begrepMap = codeNameMap(references.kostraBegrepArterKapitler);
  const funksjonMap = codeNameMap(references.kostraFunksjoner);

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
    references,
    generated: new Date().toISOString().slice(0, 10),
    rowCount: rows.length,
    rows
  };

  writeJson(`data-hop/normalisert/vedtatt-${year}.json`, result);
  return result;
}

function normalizeAccounting(year) {
  const source = `data-hop/regnskap/${year}.adv.json`;
  const accounting = readJson(source);
  const references = referencePathsForYear(year);
  const kostraArtsMap = codeNameMap(references.kostraArter);
  const begrepMap = codeNameMap(references.kostraBegrepArterKapitler);
  const funksjonMap = codeNameMap(references.kostraFunksjoner);

  const groups = accounting.field_groups || [];
  const groupIndex = Object.fromEntries(groups.map((group, index) => [group.title, index]));
  const totalIndex = groupIndex.Totalt;

  if (totalIndex == null) {
    throw new Error(`Fant ikke Totalt-gruppe i ${source}`);
  }

  const periodGroups = groups
    .map((group, index) => ({ ...group, index }))
    .filter((group) => group.fields?.[0]?.title === "Beløp" && group.title !== "Totalt");

  const rows = (accounting.rows || []).map((row, index) => {
    const systemkonto = parseSystemkonto(row[groupIndex.Systemkonto], kostraArtsMap, begrepMap);
    const ansvar = parseDim(row[groupIndex.Ansvar]);
    const prosjekt = parseDim(row[groupIndex.Prosjekt]);
    const funksjon = parseDim(row[groupIndex["Funksjon (K)"]]);
    const fridimensjon = parseDim(row[groupIndex.Fridimensjon]);
    const totalBelop = Number(row[totalIndex]?.[0] || 0);
    const count = Number(row[groupIndex.Count]?.[0] || 0);
    let previousCumulative = 0;
    const perioder = periodGroups.map((group) => {
      const cumulative = Number(row[group.index]?.[0] || 0);
      const period = group.periods?.[group.periods.length - 1] || {};
      const periodBelop = cumulative - previousCumulative;
      previousCumulative = cumulative;
      return {
        title: group.title,
        fiscalYear: period.fiscal_year || year,
        period: period.period ?? null,
        description: period.description || group.title,
        hittilBelop: cumulative,
        periodBelop
      };
    });

    return {
      row: index + 1,
      aar: year,
      belop: totalBelop,
      totalBelop,
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
      fridimensjonTekst: fridimensjon.tekst,
      perioder
    };
  });

  const result = {
    type: "hop-normalisert-regnskap",
    version: 1,
    year,
    source,
    references,
    generated: new Date().toISOString().slice(0, 10),
    rowCount: rows.length,
    perioder: periodGroups.map((group) => {
      const period = group.periods?.[group.periods.length - 1] || {};
      return {
        title: group.title,
        fiscalYear: period.fiscal_year || year,
        period: period.period ?? null,
        description: period.description || group.title
      };
    }),
    rows
  };

  writeJson(`data-hop/normalisert/regnskap-${year}.json`, result);
  return result;
}

function makeArtIndex(rows, klasse) {
  const map = new Map();
  rows
    .filter((row) => row.klasse === klasse)
    .forEach((row) => {
      if (!map.has(row.kostraart)) {
        map.set(row.kostraart, {
          code: row.kostraart,
          name: row.kostraartNavn || row.systemkontoNavn || "",
          rawAmount: 0
        });
      }
      map.get(row.kostraart).rawAmount += row.belop;
    });
  return map;
}

function makeBalanceIndex(rows) {
  const map = new Map();
  rows
    .filter((row) => row.klasse === "2")
    .forEach((row) => {
      const keys = [
        {
          code: row.kapittel,
          name: row.kapittelNavn || row.systemkontoNavn || ""
        },
        {
          code: row.systemkontoKode.slice(1, 4),
          name: row.systemkontoNavn || row.kapittelNavn || ""
        },
        {
          code: row.systemkontoKode.slice(1, 5),
          name: row.systemkontoNavn || row.kapittelNavn || ""
        }
      ].filter((item) => item.code);

      keys.forEach((key) => {
        if (!map.has(key.code)) {
          map.set(key.code, {
            code: key.code,
            name: key.name,
            rawAmount: 0,
            ib: 0,
            endring: 0,
            ub: 0
          });
        }
        const item = map.get(key.code);
        const ib = row.perioder?.find((periode) => periode.period === 0)?.hittilBelop || 0;
        const ub = row.perioder?.find((periode) => periode.period === 12)?.hittilBelop ?? row.belop;
        item.rawAmount += row.belop;
        item.ib += ib;
        item.ub += ub;
        item.endring += ub - ib;
      });
    });
  return map;
}

function makeSourceIndex(rows, table) {
  if (table.amountSource === "balansekapittel") return makeBalanceIndex(rows);
  return makeArtIndex(rows, table.klasse);
}

function normalizeSourceCode(amountSource, code) {
  const text = String(code);
  if (amountSource === "balansekapittel") return text;
  return text.padStart(3, "0");
}

function amountForCode(sourceIndex, amountSource, code) {
  return sourceIndex.get(normalizeSourceCode(amountSource, code))?.rawAmount || 0;
}

function sourceMeasure(item, measure) {
  if (!item) return 0;
  if (measure === "rawAmount") return item.rawAmount || 0;
  return item[measure] || 0;
}

function sumRange(sourceIndex, from, to, measure = "rawAmount") {
  let total = 0;
  for (const [code, item] of sourceIndex.entries()) {
    if (/^\d+$/.test(code) && Number(code) >= Number(from) && Number(code) <= Number(to)) {
      total += sourceMeasure(item, measure);
    }
  }
  return total;
}

function sourceValue(sourceIndex, amountSource, code, measure = "rawAmount") {
  return sourceMeasure(sourceIndex.get(normalizeSourceCode(amountSource, code)), measure);
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

function sourceCodesInRange(sourceIndex, from, to) {
  return [...sourceIndex.keys()]
    .filter((code) => /^\d+$/.test(code) && Number(code) >= Number(from) && Number(code) <= Number(to))
    .sort((a, b) => Number(a) - Number(b));
}

function directSourceContributions(rule, sourceIndex, amountSource, multiplier, parentPost) {
  if (!rule || /post\(|fra_/.test(rule)) return [];
  const expr = rule.replace(/;.*$/, "");
  const normalized = expr.replace(/-/g, "+-");
  const terms = normalized
    .split("+")
    .map((term) => term.trim())
    .filter(Boolean);
  const contributions = new Map();

  terms.forEach((term) => {
    let sign = 1;
    if (term.startsWith("-")) {
      sign = -1;
      term = term.slice(1).trim();
    }

    const rangeMatch = term.match(/^sum\((\d+):(\d+)\)$/);
    if (rangeMatch) {
      sourceCodesInRange(sourceIndex, rangeMatch[1], rangeMatch[2]).forEach((code) => {
        contributions.set(code, (contributions.get(code) || 0) + sign);
      });
      return;
    }

    if (/^\d+$/.test(term)) {
      const code = normalizeSourceCode(amountSource, term);
      if (sourceIndex.has(code)) contributions.set(code, (contributions.get(code) || 0) + sign);
    }
  });

  return [...contributions.entries()]
    .map(([code, factor]) => {
      const item = sourceIndex.get(code);
      const rawAmount = sourceMeasure(item, "rawAmount") * factor;
      const contribution = {
        type: amountSource,
        code,
        name: item.name,
        factor,
        rawAmount,
        amount: rawAmount * multiplier
      };
      if (amountSource === "balansekapittel") {
        const endringMultiplier = balanceChangeMultiplier(parentPost);
        contribution.balance = {
          ib: sourceMeasure(item, "ib") * factor * multiplier,
          endring: sourceMeasure(item, "endring") * factor * multiplier * endringMultiplier,
          ub: sourceMeasure(item, "ub") * factor * multiplier
        };
      }
      return contribution;
    })
    .filter((item) => item.amount !== 0)
    .sort((a, b) => Number(a.code) - Number(b.code));
}

function evalSourceRule(rule, sourceIndex, amountSource, measure = "rawAmount") {
  if (!rule || /post\(|fra_/.test(rule)) return null;
  let expr = rule.replace(/;.*$/, "");
  const values = [];
  const addValue = (value) => {
    const token = `__value_${values.length}__`;
    values.push(value);
    return token;
  };
  expr = expr.replace(/sum\((\d+):(\d+)\)/g, (_, from, to) => addValue(sumRange(sourceIndex, from, to, measure)));
  expr = expr.replace(/(?<![A-Za-z_])\b(\d+)\b/g, (_, code) =>
    addValue(sourceValue(sourceIndex, amountSource, code, measure))
  );
  expr = expr.replace(/__value_(\d+)__/g, (_, index) => String(values[Number(index)]));
  if (!/^[0-9+\-*/ ().]+$/.test(expr)) return null;
  return Function(`return (${expr})`)();
}

function calculateMeasureValues(table, sourceIndex, hasSourceRows, measure) {
  const values = new Map();
  const postOrder = table.rows.map((row) => row.post);
  table.rows.forEach((row) => {
    const multiplier = rowDisplayMultiplier(table.id, row.post);
    const rawAmount = hasSourceRows ? evalSourceRule(row.rule, sourceIndex, table.amountSource, measure) : null;
    if (rawAmount != null && Number.isFinite(rawAmount)) {
      values.set(row.post, rawAmount * multiplier);
    }
  });

  for (let i = 0; i < table.rows.length; i += 1) {
    let changed = false;
    table.rows.forEach((row) => {
      if (values.has(row.post) || !hasSourceRows) return;
      const rawAmount = evalPostRule(row.rule, values, postOrder);
      if (rawAmount == null || !Number.isFinite(rawAmount)) return;
      values.set(row.post, rawAmount);
      changed = true;
    });
    if (!changed) break;
  }

  return values;
}

function evalPostRule(rule, values, postOrder) {
  if (!rule || /fra_/.test(rule)) return null;
  let expr = rule.replace(/.*;/, "").trim();
  let missingPostReference = false;
  expr = expr.replace(/post\(([^():]+):([^()]+)\)/g, (_, from, to) => {
    let total = 0;
    if (/^\d+$/.test(from) && /^\d+$/.test(to)) {
      for (let post = Number(from); post <= Number(to); post += 1) {
        const key = String(post);
        if (!values.has(key)) missingPostReference = true;
        total += values.get(key) || 0;
      }
    } else {
      const fromIndex = postOrder.indexOf(from);
      const toIndex = postOrder.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex > toIndex) {
        missingPostReference = true;
        return "0";
      }
      const fromDepth = from.split(".").length;
      postOrder.slice(fromIndex, toIndex + 1).forEach((key) => {
        if (key.split(".").length !== fromDepth) return;
        if (!values.has(key)) missingPostReference = true;
        total += values.get(key) || 0;
      });
    }
    return String(total);
  });
  expr = expr.replace(/post\(([^()]+)\)/g, (_, post) => {
    const key = /^\d+$/.test(post) ? String(Number(post)) : post;
    if (!values.has(key)) missingPostReference = true;
    return String(values.get(key) || 0);
  });
  if (missingPostReference) return null;
  if (!/^[0-9+\-*/ ().]+$/.test(expr)) return null;
  return Function(`return (${expr})`)();
}

function balanceChangeMultiplier(post) {
  return /^[CDEF](\.|$)/.test(String(post)) || String(post) === "SUM_EGENKAPITAL_GJELD" ? -1 : 1;
}

function calculateStatements(year, normalized, variant = "vedtatt") {
  const statementDefinition = fs.existsSync(path.join(DATA_HOP, "oppstillinger", `obligatoriske-tabeller-${year}.json`))
    ? `data-hop/oppstillinger/obligatoriske-tabeller-${year}.json`
    : "data-hop/oppstillinger/obligatoriske-tabeller-2026.json";
  const statements = readJson(statementDefinition);
  const tables = statements.tables.map((table) => {
    const sourceIndex = makeSourceIndex(normalized.rows, table);
    const hasSourceRows = normalized.rows.some((row) => row.klasse === table.klasse);
    const values = new Map();
    const postOrder = table.rows.map((row) => row.post);
    const rows = table.rows.map((row) => {
      const multiplier = rowDisplayMultiplier(table.id, row.post);
      let rawAmount = hasSourceRows ? evalSourceRule(row.rule, sourceIndex, table.amountSource) : null;
      const isSourceRule = rawAmount != null;
      const canCalculate = rawAmount != null && Number.isFinite(rawAmount);
      const displayAmount = canCalculate
        ? isSourceRule
          ? rawAmount * multiplier
          : rawAmount
        : null;
      if (canCalculate) values.set(row.post, displayAmount);
      return {
        post: row.post,
        label: row.label,
        rule: row.rule,
        rowType: row.rowType || "line",
        valueType: row.valueType || "amount",
        canCalculate,
        amount: displayAmount,
        isSourceRule,
        children: isSourceRule
          ? directSourceContributions(row.rule, sourceIndex, table.amountSource || "kostraart", multiplier, row.post)
          : []
      };
    });

    rows.forEach((row) => {
      if (row.canCalculate) values.set(row.post, row.amount);
    });

    for (let i = 0; i < rows.length; i += 1) {
      let changed = false;
      rows.forEach((calculatedRow, index) => {
        if (calculatedRow.canCalculate || !hasSourceRows) return;
        const definitionRow = table.rows[index];
        const rawAmount = evalPostRule(definitionRow.rule, values, postOrder);
        const canCalculate = rawAmount != null && Number.isFinite(rawAmount);
        if (!canCalculate) return;
        calculatedRow.canCalculate = true;
        calculatedRow.amount = rawAmount;
        values.set(calculatedRow.post, rawAmount);
        changed = true;
      });
      if (!changed) break;
    }

    rows.forEach((row) => {
      delete row.isSourceRule;
    });

    if (table.amountSource === "balansekapittel" && variant === "regnskap") {
      const balanceValues = {
        ib: calculateMeasureValues(table, sourceIndex, hasSourceRows, "ib"),
        endring: calculateMeasureValues(table, sourceIndex, hasSourceRows, "endring"),
        ub: calculateMeasureValues(table, sourceIndex, hasSourceRows, "ub")
      };

      rows.forEach((row) => {
        const endringMultiplier = balanceChangeMultiplier(row.post);
        row.balance = {
          ib: balanceValues.ib.get(row.post) ?? null,
          endring: balanceValues.endring.has(row.post) ? balanceValues.endring.get(row.post) * endringMultiplier : null,
          ub: balanceValues.ub.get(row.post) ?? null
        };
        row.amount = row.balance.ub;
      });
    }

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
    source: `data-hop/normalisert/${variant}-${year}.json`,
    statementDefinition,
    generated: new Date().toISOString().slice(0, 10),
    tables
  };

  writeJson(`data-hop/aggregert/obligatoriske-tabeller-${year}-${variant}.json`, result);
  return result;
}

const years = process.argv.slice(2).map(Number);
const targetYears = years.length ? years : [2025, 2026];

for (const year of targetYears) {
  const normalized = normalizeBudget(year);
  const calculated = calculateStatements(year, normalized);
  console.log(`${year}: normaliserte ${normalized.rowCount} linjer, beregnet ${calculated.tables.length} oppstillinger`);

  const accountingSource = path.join(DATA_HOP, "regnskap", `${year}.adv.json`);
  if (fs.existsSync(accountingSource)) {
    const accounting = normalizeAccounting(year);
    const calculatedAccounting = calculateStatements(year, accounting, "regnskap");
    console.log(
      `${year}: normaliserte ${accounting.rowCount} regnskapslinjer, beregnet ${calculatedAccounting.tables.length} regnskapsoppstillinger`
    );
  }
}
