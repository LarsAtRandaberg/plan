# HOP-data

Denne mappen inneholder datakilder for handlings- og okonomiplaner.

- `index.json` er en enkel oversikt over tilgjengelige datasett.
- `vedtatt/` inneholder opprinnelig vedtatte budsjetter, frosset per ar.
- `normalisert/` inneholder bearbeidede budsjettlinjer med klasse, KOSTRA-art og KOSTRA-funksjon splittet ut.
- `justeringer/` er reservert for budsjettjusteringer fra Dataverse.
- `aggregert/` inneholder ferdig summerte visninger, blant annet obligatoriske tabeller.
- `referanse/` inneholder eksterne kodeverk, forelopig KOSTRA-arter, KOSTRA arter/kapitler og KOSTRA-funksjoner fra SSB Klass.
- `oppstillinger/` inneholder definisjoner for obligatoriske regnskapsoppstillinger og tabeller.
- `../scripts/build-hop-data.js` bygger normaliserte og aggregerte filer fra Xledger-kilder og referansedata.

Opprinnelig vedtatt budsjett skal behandles som historisk kildegrunnlag og ikke endres etter publisering.
