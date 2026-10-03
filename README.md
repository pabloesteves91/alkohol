# ALKOHOL? — Wie normal ist zu normal?

Prototype of an editorial petition website on alcohol policy in Switzerland (German, Swiss spelling).
Static HTML/CSS/JS, no build step, no dependencies.

```
index.html              Homepage (all sections)
petition.html           Print version of the petition text (source of the PDF)
datenschutz.html        Privacy notice (draft)
impressum.html          Legal notice / contact (draft)
assets/css/style.css    Design system + layout
assets/js/main.js       Progressive enhancement (menu, reveal, counters, accordions, canton map, tabs, filter, form)
assets/petitionstext.pdf  Generated from petition.html
assets/img/             favicon.svg, og-image.svg (+ .png export)
```

Run locally: `npx http-server .` and open http://localhost:8080.

## Before publishing — mandatory

Everything marked in the UI with **PRÜFEN**, **[zu verifizieren]**, **JJJJ** or red hatched text is a placeholder.

- [ ] Verify every statistic against the original source (BAG / MonAM, BFS); add year and **direct** link. Currently links point to institution home pages.
- [ ] Replace the schematic consumption trend (section 02) with the real BAG time series.
- [ ] Verify cantonal night-sale rules (GE, FR, VD and all others) in `assets/js/main.js` → `status` and the detail fields.
- [ ] Verify country facts (SE, SCO, LV, NO) and add research summaries only with citations.
- [ ] EBG source and victim-support contacts in section 06.
- [ ] **Support counter: CONNECT TO REAL DATABASE DATA BEFORE PUBLISHING.** `XX’XXX` is a placeholder — never show an invented number.
- [ ] Connect the form to a backend (`TODO(backend)` in `main.js`). Currently nothing is sent or stored.
- [ ] Complete Datenschutz (revDSG) and Impressum; name the responsible organisation.
- [ ] Self-host fonts (Inter, Inter Tight, IBM Plex Mono) instead of Google Fonts, or mention it in the privacy notice.
- [ ] Replace `https://example.ch/` in Open Graph tags; regenerate `og-image.png` and the PDF after text changes.
