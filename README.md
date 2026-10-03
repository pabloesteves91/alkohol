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

## Before publishing

- [ ] Complete Datenschutz and Impressum; name the responsible organisation.
- [ ] Self-host fonts (Inter, Inter Tight, IBM Plex Mono) instead of Google Fonts, or mention it in the privacy notice.
- [ ] Replace `https://example.ch/` in Open Graph tags; regenerate `og-image.png` and the PDF after text changes.
