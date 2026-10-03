# ALKOHOL? — Wie normal ist zu normal?

Prototype of an editorial petition website on alcohol policy in Switzerland (German, Swiss spelling).
Static HTML/CSS/JS, no build step, no dependencies.

```
index.html              Homepage (all sections)
petition.html           Print version of the petition text (source of the PDF)
datenschutz.html        Privacy notice (draft)
impressum.html          Legal notice / contact (draft)
assets/css/style.css    Design system + layout
assets/js/main.js       Progressive enhancement (menu, reveal, counters, accordions, canton map, tabs, source filter)
assets/petitionstext.pdf  Generated from petition.html
assets/img/             favicon.svg, og-image.svg (+ .png export)
```

Run locally: `npx http-server .` and open http://localhost:8080.

## Sourcing rules

- The site is information only. Signing happens exclusively on Campax:
  https://act.campax.org/petitions/alkohol-ist-kein-gewohnliches-konsumgut-strengere-regeln-fur-die-schweiz
  No form, no database, no signature counter.
- Every number and factual claim links to its source (BAG, BFU, Sucht Schweiz, BAZG, Parliament,
  Public Health Scotland, peer-reviewed studies) or to a reputable news outlet (NZZ, SRF, Beobachter, swissinfo).
- Canton data in `assets/js/main.js` is copied verbatim from the BAG overview
  "Zeitliche Verkaufseinschränkungen für Alkohol" (retrieved 3 Oct 2026).
- All links were checked in October 2026. Re-check before major updates.

## Erfahrungen (Firebase Firestore)

`erfahrungen.html` + `assets/js/erfahrungen.js` let visitors submit anonymous experience reports.

- Collection `erfahrungen`. New documents always have `status: "pending"`.
- Only documents with `status: "approved"` are public. **Moderation:** Firebase console →
  Firestore → `erfahrungen` → open a document → change `status` to `approved` (or delete it).
- Security is enforced by `firestore.rules` (create-only for visitors, field and length validation,
  no updates/deletes from the browser). The Firebase web config in the JS is public by design.
- No Analytics, no names, no e-mail. Honeypot + 2-minute client throttle against spam.

### Deploy

Rules (required, otherwise loading/submitting fails with "Missing or insufficient permissions"):
Firebase console → Firestore Database → Rules → paste `firestore.rules` → Publish.

Website: served by GitHub Pages (https://pabloesteves91.github.io/alkohol/).

Optional automatic rules deploy: `.github/workflows/firebase-deploy.yml` publishes rules + indexes when
they change on `main`, if the repository secret `FIREBASE_SERVICE_ACCOUNT` is set; otherwise it skips.

Manual: `npx firebase-tools login` then `npx firebase-tools deploy --project alkohol-2ae09`.

## Before publishing

- [ ] Add contact e-mail in impressum.html and datenschutz.html (marked [folgt]).
- [ ] Self-host fonts (Inter, Inter Tight, IBM Plex Mono) instead of Google Fonts, or mention it in the privacy notice.
- [ ] Replace `https://example.ch/` in Open Graph tags; regenerate `og-image.png` and the PDF after text changes.
