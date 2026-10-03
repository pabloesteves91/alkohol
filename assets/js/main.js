/* ALKOHOL? — progressive enhancement. Page is fully readable without JS. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-loaded'); }); });

  /* ---------- Number formatting (de-CH) ---------- */
  function fmt(n, decimals) {
    var s = n.toFixed(decimals || 0).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '’');
    return s.join(',');
  }

  /* ---------- Hero: abstract shelf of bottles ---------- */
  (function buildShelf() {
    var g = $('.shelf__rows');
    if (!g) return;
    var NS = 'http://www.w3.org/2000/svg';
    var rows = 3, perRow = 15, w = 480, rowH = 100, bw = 18;
    var step = w / perRow;
    // Deterministic pattern: a few gaps (bought), one red (the question)
    var gaps = { '0-4': 1, '0-11': 1, '1-2': 1, '1-7': 1, '1-8': 1, '2-13': 1 };
    var redKey = '1-10';
    for (var r = 0; r < rows; r++) {
      var base = (r + 1) * rowH - 6;
      var shelf = document.createElementNS(NS, 'line');
      shelf.setAttribute('x1', 0); shelf.setAttribute('x2', w);
      shelf.setAttribute('y1', base + .5); shelf.setAttribute('y2', base + .5);
      shelf.setAttribute('stroke-width', '2');
      g.appendChild(shelf);
      for (var i = 0; i < perRow; i++) {
        var key = r + '-' + i;
        var x = i * step + (step - bw) / 2;
        var tall = (i + r) % 3 === 0 ? 74 : ((i + r) % 3 === 1 ? 66 : 58);
        var neck = tall > 70 ? 6 : 7;
        var top = base - tall;
        var d = 'M' + x + ',' + base +
          ' V' + (top + 26) +
          ' Q' + x + ',' + (top + 18) + ' ' + (x + bw / 2 - neck / 2) + ',' + (top + 12) +
          ' V' + top + ' H' + (x + bw / 2 + neck / 2) + ' V' + (top + 12) +
          ' Q' + (x + bw) + ',' + (top + 18) + ' ' + (x + bw) + ',' + (top + 26) +
          ' V' + base + ' Z';
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        if (gaps[key]) p.setAttribute('class', 'gap');
        if (key === redKey) p.setAttribute('class', 'is-red');
        g.appendChild(p);
      }
    }
  })();

  /* ---------- Sticky nav: mobile menu, scrollspy, progress ---------- */
  var burger = $('.nav__burger');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1080 && !menu.hidden) setMenu(false); });
  }

  var progress = $('.nav__progress span');
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = map[en.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Reveal + counters + rules ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduceMotion || isNaN(target)) { el.textContent = fmt(target, dec); return; }
    var start = null, dur = 1400;
    function tick(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(target * eased, dec);
      if (k < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target, dec);
    }
    requestAnimationFrame(tick);
  }

  var revealEls = $$('.reveal, .rule--red, .rule-x, .disclaimer-line');
  var countEls = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('.rule-x', en.target).forEach(function (r) { r.classList.add('is-in'); });
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        animateCount(en.target);
        co.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { co.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }
  // Safety net: fast anchor jumps can skip observer frames — reveal anything already passed.
  var pending = revealEls.slice();
  var sweepQueued = false;
  function sweep() {
    sweepQueued = false;
    pending = pending.filter(function (el) {
      if (el.classList.contains('is-in')) return false;
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { el.classList.add('is-in'); return false; }
      return true;
    });
  }
  window.addEventListener('scroll', function () {
    if (!sweepQueued && pending.length) { sweepQueued = true; setTimeout(sweep, 120); }
  }, { passive: true });

  /* ---------- Disclosure (accordion + "Mehr erfahren") with height transition ---------- */
  function toggle(btn, force) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var open = typeof force === 'boolean' ? force : btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    if (reduceMotion) { panel.hidden = !open; return; }
    if (open) {
      panel.hidden = false;
      var h = panel.scrollHeight;
      panel.style.height = '0px';
      panel.classList.add('is-anim');
      requestAnimationFrame(function () { panel.style.height = h + 'px'; });
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      panel.classList.add('is-anim');
      requestAnimationFrame(function () { panel.style.height = '0px'; });
    }
    panel.addEventListener('transitionend', function done(e) {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', done);
      panel.classList.remove('is-anim');
      panel.style.height = '';
      if (btn.getAttribute('aria-expanded') !== 'true') panel.hidden = true;
    });
  }
  $$('.acc button[aria-controls], .more[aria-controls]').forEach(function (btn) {
    btn.addEventListener('click', function () { toggle(btn); });
  });

  /* ---------- Petition document: collapse / expand ---------- */
  var docBody = $('#doc-body'), docBtn = $('#doc-toggle');
  if (docBody && docBtn) {
    docBody.classList.add('is-collapsed');
    docBtn.addEventListener('click', function () {
      var open = docBtn.getAttribute('aria-expanded') !== 'true';
      docBtn.setAttribute('aria-expanded', String(open));
      docBody.classList.toggle('is-collapsed', !open);
      docBtn.textContent = open ? 'Text einklappen' : 'Petition vollständig lesen';
    });
    // Links to #petitionstext from the support area should show the full text
    $$('a[href="#petitionstext"]').forEach(function (a) {
      if (a.closest('.form, .checklist')) a.addEventListener('click', function () {
        docBody.classList.remove('is-collapsed');
        docBtn.setAttribute('aria-expanded', 'true');
        docBtn.textContent = 'Text einklappen';
      });
    });
  }

  /* ---------- 22:00 — cantons ---------- */
  // STATUS IS SCHEMATIC. Verify every entry against current cantonal law before publishing.
  var V = '[zu verifizieren]';
  var cantons = [
    ['BS', 'Basel-Stadt', 3, 1], ['BL', 'Basel-Landschaft', 4, 1], ['SH', 'Schaffhausen', 6, 1], ['TG', 'Thurgau', 7, 1],
    ['JU', 'Jura', 2, 2], ['SO', 'Solothurn', 3, 2], ['AG', 'Aargau', 4, 2], ['ZH', 'Zürich', 5, 2], ['SG', 'St. Gallen', 6, 2], ['AR', 'Appenzell A. Rh.', 7, 2], ['AI', 'Appenzell I. Rh.', 8, 2],
    ['NE', 'Neuenburg', 1, 3], ['BE', 'Bern', 2, 3], ['LU', 'Luzern', 3, 3], ['ZG', 'Zug', 4, 3], ['SZ', 'Schwyz', 5, 3], ['GL', 'Glarus', 6, 3],
    ['VD', 'Waadt', 1, 4], ['FR', 'Freiburg', 2, 4], ['OW', 'Obwalden', 3, 4], ['NW', 'Nidwalden', 4, 4], ['UR', 'Uri', 5, 4], ['GR', 'Graubünden', 6, 4],
    ['GE', 'Genf', 1, 5], ['VS', 'Wallis', 2, 5], ['TI', 'Tessin', 4, 5]
  ];
  var status = { GE: 'yes', FR: 'yes', VD: 'part' };
  var statusText = {
    yes: 'Nächtliche Einschränkung vorhanden',
    part: 'Nächtliche Einschränkung für bestimmte Kategorien',
    'var': 'Regeln variieren – zu prüfen'
  };
  var mapEl = $('.cantons__map');
  var detail = $('.cantons__detail');
  function showCanton(c, btn) {
    var st = status[c[0]] || 'var';
    $('.cantons__name', detail).textContent = c[1];
    $('.cantons__status', detail).innerHTML = '<span class="state state--' + st + '">' + statusText[st] + '</span>';
    var dds = $$('dd', detail);
    dds[0].textContent = V; dds[1].textContent = V; dds[2].textContent = '[Erlass + Artikel einsetzen]';
    $$('.ct', mapEl).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    if (btn) btn.setAttribute('aria-pressed', 'true');
  }
  if (mapEl) {
    cantons.forEach(function (c) {
      var st = status[c[0]] || 'var';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ct ct--' + st;
      b.textContent = c[0];
      b.style.gridColumn = c[2];
      b.style.gridRow = c[3];
      b.setAttribute('aria-label', c[1] + ': ' + statusText[st]);
      b.setAttribute('aria-pressed', c[0] === 'GE' ? 'true' : 'false');
      b.addEventListener('click', function () { showCanton(c, b); });
      mapEl.appendChild(b);
    });
    // Full table, alphabetical
    var tbody = $('#canton-table tbody');
    cantons.slice().sort(function (a, b) { return a[1].localeCompare(b[1], 'de'); }).forEach(function (c) {
      var st = status[c[0]] || 'var';
      var tr = document.createElement('tr');
      tr.innerHTML = '<td><strong>' + c[1] + '</strong> <span class="mono">' + c[0] + '</span></td>' +
        '<td><span class="state state--' + st + '">' + statusText[st] + '</span></td>' +
        '<td class="todo">' + V + '</td>';
      tbody.appendChild(tr);
    });
  }
  var ctToggle = $('#canton-toggle');
  if (ctToggle) ctToggle.addEventListener('click', function () {
    var t = $('#canton-table');
    var open = ctToggle.getAttribute('aria-expanded') !== 'true';
    ctToggle.setAttribute('aria-expanded', String(open));
    t.hidden = !open;
    ctToggle.textContent = open ? 'Übersicht schliessen' : 'Regelungen nach Kanton ansehen';
  });

  /* ---------- Country tabs (mobile/tablet; desktop shows all columns) ---------- */
  var tabs = $$('.compare__tabs [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
    });
    if (focus) tab.focus();
  }
  if (tabs.length) {
    selectTab(tabs[0]);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); selectTab(n, true); }
      });
    });
  }

  /* ---------- Source library: filter + highlight on jump ---------- */
  var chips = $$('.chip');
  var rows = $$('.sources tbody tr');
  function filter(cat) {
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === cat;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    rows.forEach(function (r) { r.hidden = !(cat === 'all' || r.getAttribute('data-cat') === cat); });
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { filter(c.getAttribute('data-filter')); }); });
  $$('a[href^="#q-"]').forEach(function (a) {
    a.addEventListener('click', function () {
      filter('all');
      var row = document.getElementById(a.getAttribute('href').slice(1));
      if (!row) return;
      row.classList.remove('is-flash');
      void row.offsetWidth;
      row.classList.add('is-flash');
      setTimeout(function () { row.classList.remove('is-flash'); }, 2400);
    });
  });

  /* ---------- Support form (prototype: no data is sent or stored) ---------- */
  var form = $('#support-form');
  if (form) {
    var err = $('.form__error', form), statusEl = $('.form__status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = [];
      $$('input', form).forEach(function (inp) {
        var bad = !inp.checkValidity();
        inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) problems.push(inp);
      });
      if (problems.length) {
        var first = problems[0];
        var label = $('label[for="' + first.id + '"]', form);
        var name = label ? label.textContent.replace('optional', '').trim() : 'Feld';
        err.textContent = first.type === 'checkbox'
          ? 'Bitte bestätigen Sie, dass Sie den Petitionstext gelesen haben.'
          : 'Bitte prüfen Sie das Feld «' + name + '».';
        first.focus();
        return;
      }
      err.textContent = '';
      // TODO(backend): POST to the real endpoint; show the server's confirmation.
      statusEl.textContent = 'Prototyp: Es wurden keine Daten übermittelt oder gespeichert. Formular vor Veröffentlichung mit dem Backend verbinden.';
    });
    $$('input', form).forEach(function (inp) {
      inp.addEventListener('input', function () { if (inp.getAttribute('aria-invalid') === 'true' && inp.checkValidity()) inp.setAttribute('aria-invalid', 'false'); });
      inp.addEventListener('change', function () { if (inp.checkValidity()) inp.setAttribute('aria-invalid', 'false'); });
    });
  }
})();
