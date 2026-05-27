# HOP-data

Denne mappen inneholder datakilder for handlings- og okonomiplaner.

- `index.json` er en enkel oversikt over tilgjengelige datasett.
- `vedtatt/` inneholder opprinnelig vedtatte budsjetter, frosset per ar.
- `regnskap/` inneholder faktiske regnskapstall fra Xledger Flex.
- `normalisert/` inneholder bearbeidede budsjett- og regnskapslinjer med klasse, KOSTRA-art og KOSTRA-funksjon splittet ut.
- `justeringer/` er reservert for budsjettjusteringer fra Dataverse.
- `aggregert/` inneholder ferdig summerte visninger, blant annet obligatoriske tabeller.
- `referanse/` inneholder arsspesifikke eksterne kodeverk, forelopig KOSTRA-arter, KOSTRA arter/kapitler og KOSTRA-funksjoner fra SSB Klass. Byggescriptet velger nyeste tilgjengelige referansefil som er gyldig for ar eller tidligere.
- `oppstillinger/` inneholder arsspesifikke definisjoner for obligatoriske regnskapsoppstillinger og tabeller.
- `../scripts/build-hop-data.js` bygger normaliserte og aggregerte filer fra Xledger-kilder, referansedata og riktig oppstillingsdefinisjon for ar.

Opprinnelig vedtatt budsjett skal behandles som historisk kildegrunnlag og ikke endres etter publisering.
