# PlanPortal

Prototype for Randaberg kommunes planportal. Repoet inneholder statiske HTML-, CSS- og JavaScript-filer for planvisning, rapportvisning og HOP-data.

## Lokalt

Kjor en enkel statisk webserver fra repo-roten:

```bash
python -m http.server 8787
```

Apne deretter:

```text
http://127.0.0.1:8787/v2.html
```

Hvis Python ikke er tilgjengelig, kan tilsvarende statisk server brukes. Filene er statiske og krever ikke build-steg.

## Viktige innganger

- `v2.html` - ny planportalvisning.
- `app-v2.js` og `styles-v2.css` - logikk og styling for v2.
- `data/` - planinnhold, mal, KPI-er og faktakartdata.
- `data-hop/` - HOP-grunnlag, normaliserte data, oppstillinger og rapportdata.
- `rapport/` og `hop/` - separate visningsflater for rapport og HOP.

## Datarydding

Store regnskaps- og HOP-filer ligger bevisst i `data-hop/` nar de er kuraterte deler av prototypen. Lokale testeksporter og scratchfiler bor holdes utenfor repoet.
