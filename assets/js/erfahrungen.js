/* Erfahrungsberichte — Firebase Firestore
   Security lives in firestore.rules: clients may only CREATE documents with status "pending"
   and READ documents with status "approved". Approval happens in the Firebase console.
   Firebase web config is public by design; it is not a secret. No Analytics is loaded. */
const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';

const firebaseConfig = {
  apiKey: 'AIzaSyDqFD9U0En155plnC6JaO-QA9N7iLGC1V0',
  authDomain: 'alkohol-2ae09.firebaseapp.com',
  projectId: 'alkohol-2ae09',
  storageBucket: 'alkohol-2ae09.firebasestorage.app',
  messagingSenderId: '1033744238393',
  appId: '1:1033744238393:web:c56598f2ef65cd25f40ae8'
};

const COLL = 'erfahrungen';

// Firebase is loaded lazily so tabs and form keep working even if the SDK is blocked or slow.
let fbPromise = null;
function fb() {
  if (!fbPromise) {
    fbPromise = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')])
      .then(([appMod, fs]) => ({ fs, db: fs.getFirestore(appMod.initializeApp(firebaseConfig)) }));
    fbPromise.catch(() => { fbPromise = null; });
  }
  return fbPromise;
}
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const LABELS = {
  kategorie: {
    gewalt: 'Gewalt', familie: 'Familie & Beziehung', gesundheit: 'Gesundheit', verkehr: 'Verkehr',
    arbeit: 'Arbeit', freundeskreis: 'Ausgang & Freundeskreis', 'eigener-konsum': 'Eigener Konsum', anderes: 'Anderes'
  },
  perspektive: {
    selbst: 'Selbst betroffen', angehoerige: 'Angehörige', beobachtung: 'Beobachtet', fachperson: 'Beruflich'
  },
  alter: { 'unter-18': 'unter 18', '18-25': '18–25', '26-40': '26–40', '41-60': '41–60', '60-plus': 'über 60' }
};
const KANTONE = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'];

/* ---------- Tabs ---------- */
const tabs = $$('.ex-tabs [role="tab"]');
function selectTab(tab, focus) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
  history.replaceState(null, '', tab.id === 'tab-teilen' ? '#teilen' : '#lesen');
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    let n = null;
    if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
    if (n) { e.preventDefault(); selectTab(n, true); }
  });
});
$$('[data-goto="teilen"]').forEach(b => b.addEventListener('click', () => selectTab($('#tab-teilen'), true)));
if (location.hash === '#teilen') selectTab($('#tab-teilen'));

/* ---------- Read approved stories ---------- */
const list = $('.stories');
const statusEl = $('.ex-status');
const emptyEl = $('.ex-empty');
let stories = [];
let activeFilter = 'all';

function fmtDate(ts) {
  if (!ts || !ts.toDate) return '';
  return ts.toDate().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
}

function storyNode(d) {
  const li = document.createElement('li');
  li.className = 'story';
  li.dataset.kategorie = d.kategorie;

  const meta = document.createElement('p');
  meta.className = 'story__meta mono';
  meta.textContent = [
    LABELS.kategorie[d.kategorie], LABELS.perspektive[d.perspektive],
    d.kanton || '', LABELS.alter[d.alter] || '', fmtDate(d.createdAt)
  ].filter(Boolean).join(' · ');
  li.appendChild(meta);

  if (d.verbindung) {
    const q = document.createElement('p');
    q.className = 'story__quote';
    q.textContent = '«' + d.verbindung + '»';
    li.appendChild(q);
  }

  const body = document.createElement('div');
  body.className = 'story__body';
  String(d.text).split(/\n{2,}/).forEach(par => {
    const p = document.createElement('p');
    p.textContent = par;
    body.appendChild(p);
  });

  if (d.kategorie === 'gewalt') {
    // Content note: violence reports are collapsed until the reader chooses to open them.
    const id = 'sb-' + Math.random().toString(36).slice(2, 9);
    body.id = id;
    body.hidden = true;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'story__cw';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.textContent = 'Inhaltshinweis: Gewalt. Bericht anzeigen';
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      body.hidden = !open;
      btn.textContent = open ? 'Bericht ausblenden' : 'Inhaltshinweis: Gewalt. Bericht anzeigen';
    });
    li.appendChild(btn);
  }
  li.appendChild(body);
  return li;
}

function render() {
  list.textContent = '';
  const shown = stories.filter(s => activeFilter === 'all' || s.kategorie === activeFilter);
  shown.forEach(s => list.appendChild(storyNode(s)));
  emptyEl.hidden = stories.length > 0;
  if (!stories.length) statusEl.textContent = '';
  else statusEl.textContent = shown.length === 1 ? '1 Bericht' : shown.length + ' Berichte';
}

async function load() {
  try {
    const { fs, db } = await withTimeout(fb(), 15000);
    const { collection, getDocs, query, where, orderBy, limit } = fs;
    const base = collection(db, COLL);
    let snap;
    try {
      snap = await withTimeout(getDocs(query(base, where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(100))), 15000);
    } catch (e) {
      // Composite index missing (failed-precondition): fall back and sort locally.
      if (e.code !== 'failed-precondition') throw e;
      snap = await withTimeout(getDocs(query(base, where('status', '==', 'approved'), limit(100))), 15000);
    }
    stories = snap.docs.map(d => d.data())
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    render();
  } catch (e) {
    console.error(e);
    statusEl.textContent = 'Die Berichte konnten nicht geladen werden. Bitte später erneut versuchen.';
  }
}

$$('.ex-filter .chip').forEach(c => c.addEventListener('click', () => {
  activeFilter = c.dataset.filter;
  $$('.ex-filter .chip').forEach(x => {
    const on = x === c;
    x.classList.toggle('is-active', on);
    x.setAttribute('aria-pressed', String(on));
  });
  render();
}));

load();

/* ---------- Submit ---------- */
const form = $('#ex-form');
const kantonSel = $('#x-kanton');
KANTONE.forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = k; kantonSel.appendChild(o); });

const text = $('#x-text');
const count = $('#x-text-count');
text.addEventListener('input', () => { count.textContent = text.value.length + ' / 3000'; });

const err = $('.form__error', form);
const ok = $('.form__status', form);
const WAIT_MS = 2 * 60 * 1000;

function lastSent() { try { return Number(localStorage.getItem('ex-last') || 0); } catch (e) { return 0; } }
function markSent() { try { localStorage.setItem('ex-last', String(Date.now())); } catch (e) { /* ignore */ } }

form.addEventListener('submit', async e => {
  e.preventDefault();
  err.textContent = '';
  ok.textContent = '';

  // Honeypot filled → silently pretend success.
  if ($('#x-website').value) { form.reset(); ok.textContent = 'Danke. Dein Bericht wurde eingereicht.'; return; }

  const fields = $$('input, select, textarea', form).filter(el => el.name !== 'website');
  let first = null;
  fields.forEach(el => {
    const bad = !el.checkValidity() || (el === text && text.value.trim().length < 40);
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (bad && !first) first = el;
  });
  if (first) {
    err.textContent = first === text
      ? 'Bitte beschreibe deine Erfahrung mit mindestens 40 Zeichen.'
      : first.type === 'checkbox' ? 'Bitte bestätige beide Punkte am Ende des Formulars.'
      : 'Bitte fülle alle Pflichtfelder (*) aus.';
    first.focus();
    return;
  }
  if (Date.now() - lastSent() < WAIT_MS) {
    err.textContent = 'Du hast eben einen Bericht eingereicht. Bitte warte zwei Minuten, bevor du einen weiteren sendest.';
    return;
  }

  const data = {
    text: text.value.trim().slice(0, 3000),
    kategorie: $('#x-kategorie').value,
    perspektive: form.querySelector('input[name="perspektive"]:checked').value,
    alter: $('#x-alter').value,
    kanton: kantonSel.value,
    consent: true,
    status: 'pending',
    createdAt: null
  };
  const verbindung = $('#x-verbindung').value.trim().slice(0, 200);
  if (verbindung) data.verbindung = verbindung;

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Wird gesendet …';
  try {
    const { fs, db } = await withTimeout(fb(), 15000);
    data.createdAt = fs.serverTimestamp();
    await withTimeout(fs.addDoc(fs.collection(db, COLL), data), 20000);
    markSent();
    form.reset();
    count.textContent = '0 / 3000';
    ok.textContent = 'Danke. Dein Bericht ist eingegangen und wird vor der Veröffentlichung gelesen. Das kann einige Tage dauern.';
    ok.focus?.();
  } catch (e2) {
    console.error(e2);
    err.textContent = 'Senden fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Erfahrung einreichen';
  }
});
$$('input, select, textarea', form).forEach(el => el.addEventListener('input', () => {
  if (el.getAttribute('aria-invalid') === 'true' && el.checkValidity()) el.setAttribute('aria-invalid', 'false');
}));
