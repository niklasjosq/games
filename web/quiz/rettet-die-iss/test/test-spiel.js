/* Integrationstest: spielt eine komplette 2-Spieler-Runde durch,
   mit einem winzigen Fake-Browser (DOM-Shim). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;

/* ---------------- Mini-DOM ---------------- */
const alleElemente = [];

function neuesElement(tag) {
  const klassen = new Set();
  const el = {
    tagName: (tag || 'DIV').toUpperCase(),
    id: '', children: [], parent: null, _html: '', textContent: '',
    style: {}, dataset: {}, onclick: null, disabled: false, value: '',
    get className() { return [...klassen].join(' '); },
    set className(v) { klassen.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => klassen.add(c)); },
    classList: {
      add: (...c) => c.forEach(x => klassen.add(x)),
      remove: (...c) => c.forEach(x => klassen.delete(x)),
      contains: (c) => klassen.has(c),
      toggle: (c, an) => { if (an === undefined) an = !klassen.has(c); an ? klassen.add(c) : klassen.delete(c); return an; }
    },
    get innerHTML() { return el._html; },
    set innerHTML(v) { el._html = String(v); if (v === '') el.children = []; },
    appendChild(k) { k.parent = el; el.children.push(k); return k; },
    querySelectorAll(sel) {
      const klasse = sel.replace('.', '');
      const treffer = [];
      (function suche(n) { for (const k of n.children) { if (k.classList.contains(klasse)) treffer.push(k); suche(k); } })(el);
      return treffer;
    },
    getContext() { return ctxStub; },
    focus() {}
  };
  alleElemente.push(el);
  return el;
}

const ctxStub = new Proxy({}, {
  get(_, p) {
    if (p === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (p === 'canvas') return { width: 900, height: 540 };
    return () => {};
  },
  set() { return true; }
});

const nachId = {};
function reg(id, klasse, tag) {
  const el = neuesElement(tag || 'div');
  el.id = id;
  if (klasse) el.className = klasse;
  nachId[id] = el;
  return el;
}

// Bildschirme
['start', 'anzug', 'kampf', 'uebergang', 'ergebnis'].forEach(id => reg(id, 'bildschirm'));
// Alle weiteren IDs aus der index.html einsammeln
const html = fs.readFileSync(ORDNER + 'index.html', 'utf8');
for (const m of html.matchAll(/id="([^"]+)"/g)) if (!nachId[m[1]]) reg(m[1], '', m[1].startsWith('name') ? 'input' : 'div');

// Wahl-Knöpfe nachbauen
function wahlKnoepfe(behaelterId, werte) {
  const b = nachId[behaelterId];
  werte.forEach(w => { const k = neuesElement('button'); k.className = 'wahl'; k.dataset.wert = w; b.appendChild(k); });
}
wahlKnoepfe('wahlSpieler', ['1', '2']);
wahlKnoepfe('wahlStufe', ['leicht', 'mittel', 'schwer']);

const speicher = {};
const zuhoerer = {};

const fenster = {
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  setTimeout, clearTimeout, console, Math, JSON, String, Number, Set, Array, Object, parseInt, parseFloat, Date,
  localStorage: {
    getItem: k => (k in speicher ? speicher[k] : null),
    setItem: (k, v) => { speicher[k] = String(v); },
    removeItem: k => { delete speicher[k]; }
  },
  document: {
    getElementById: id => nachId[id] || reg(id),
    createElement: t => neuesElement(t),
    querySelectorAll(sel) {
      const klasse = sel.replace('.', '');
      return alleElemente.filter(e => e.classList.contains(klasse));
    },
    addEventListener: (typ, fn) => { (zuhoerer[typ] = zuhoerer[typ] || []).push(fn); }
  }
};
fenster.window = fenster;
fenster.globalThis = fenster;

vm.createContext(fenster);
vm.runInContext(fs.readFileSync(ORDNER + 'raetsel.js', 'utf8'), fenster, { filename: 'raetsel.js' });
vm.runInContext(fs.readFileSync(ORDNER + 'spiel.js', 'utf8'), fenster, { filename: 'spiel.js' });

/* ---------------- Test-Ablauf ---------------- */
// const/let landen nicht auf dem globalen Objekt -> per eval im Kontext holen
const hole = (name) => vm.runInContext(name, fenster);
const G = {
  SPIEL: hole('SPIEL'), K: hole('K'), MODULE: hole('MODULE'), TEILE: hole('TEILE'),
  rechne: hole('rechne'), schiessen: hole('schiessen'), antwortGeben: hole('antwortGeben'),
  get raetselAktiv() { return hole('raetselAktiv'); }
};
const warte = ms => new Promise(r => setTimeout(r, ms));
const sichtbar = () => ['start', 'anzug', 'kampf', 'uebergang', 'ergebnis'].find(id => nachId[id].classList.contains('aktiv'));
let fehler = 0;
function pruefe(bedingung, text) {
  if (bedingung) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}

// Rätsel richtig beantworten
function beantworteRaetsel(richtig) {
  const a = G.raetselAktiv;
  if (!a) return false;
  let i = a.auswahl.findIndex(w => String(w) === String(a.antwort));
  if (!richtig) i = a.auswahl.findIndex(w => String(w) !== String(a.antwort));
  G.antwortGeben(i);
  return true;
}

async function wartetAufRaetselEnde() {
  for (let i = 0; i < 60; i++) { if (!nachId.raetsel.classList.contains('aktiv')) return; await warte(50); }
}

(async function () {
  console.log('\n=== TEST: 2 Spieler, Stufe schwer ===');
  (zuhoerer.DOMContentLoaded || []).forEach(fn => fn());

  nachId.wahlSpieler.children[1].onclick();   // 2 Spieler
  nachId.wahlStufe.children[2].onclick();     // schwer
  pruefe(G.SPIEL.anzahlSpieler === 2, '2 Spieler ausgewählt');
  pruefe(G.SPIEL.stufe === 'schwer', 'Stufe "schwer" ausgewählt');

  nachId.name1.value = 'Niklas';
  nachId.name2.value = 'Papa';
  nachId.knopfStart.onclick();
  pruefe(sichtbar() === 'anzug', 'Phase 1 (Raumanzug) startet');
  pruefe(G.SPIEL.spieler.length === 2 && G.SPIEL.spieler[0].name === 'Niklas', 'Namen übernommen');

  for (let runde = 1; runde <= 2; runde++) {
    const spieler = G.SPIEL.spieler[G.SPIEL.amZug];
    console.log('\n--- ' + spieler.name + ': Phase 1 Schatzsuche ---');

    // falsches Modul anklicken darf nichts kaputt machen
    const richtigesModul = G.SPIEL.kette[0].modul.id;
    const falsches = G.MODULE.find(m => m.id !== richtigesModul);
    nachId.issKarte.children[G.MODULE.indexOf(falsches)].onclick();
    pruefe(G.SPIEL.anzugSchritt === 0 && !nachId.raetsel.classList.contains('aktiv'),
           'falsches Modul: kein Rätsel, kein Fortschritt');

    let schutz = 0;
    while (G.SPIEL.anzugSchritt < 5 && schutz++ < 40) {
      const ziel = G.SPIEL.kette[G.SPIEL.anzugSchritt].modul.id;
      nachId.issKarte.children[G.MODULE.findIndex(m => m.id === ziel)].onclick();
      await warte(20);
      // beim 2. Teil absichtlich einmal falsch antworten
      const absichtlichFalsch = (G.SPIEL.anzugSchritt === 1);
      beantworteRaetsel(!absichtlichFalsch);
      await wartetAufRaetselEnde();
      if (absichtlichFalsch) { beantworteRaetsel(true); await wartetAufRaetselEnde(); }
    }
    pruefe(G.SPIEL.anzugSchritt === 5, 'alle 5 Anzugteile gefunden');
    pruefe(!nachId.anzugWeiter.classList.contains('versteckt'), 'Weiter-Knopf erscheint');
    pruefe(spieler.punkte > 100, 'Punkte gesammelt: ' + spieler.punkte);

    console.log('--- ' + spieler.name + ': Phase 2 ISS verteidigen ---');
    nachId.anzugWeiter.onclick();
    pruefe(sichtbar() === 'kampf', 'Phase 2 startet');

    // Spiel-Schleife von Hand drehen (max. 20000 Bilder)
    let bilder = 0, raetselGezaehlt = 0;
    while (!G.K.vorbei && bilder++ < 20000) {
      if (G.raetselAktiv) { raetselGezaehlt++; beantworteRaetsel(true); await wartetAufRaetselEnde(); continue; }
      if (G.K.laeuft) {
        const ziel = G.K.gegner.find(g => !g.tot);
        if (ziel && bilder % 9 === 0) { G.K.schiff.x = ziel.x; G.schiessen(); }  // wie ein Mensch: nicht jedes Bild
        G.rechne(1);
      } else { await warte(20); }
    }
    pruefe(G.K.vorbei, 'Runde ist zu Ende (nach ' + bilder + ' Bildern, ' + raetselGezaehlt + ' Nachschub-Rätseln)');
    pruefe(spieler.gerettet === true, 'ISS gerettet (alle 3 Wellen geschafft)');
    pruefe(G.K.welle === 3, 'alle 3 Wellen durchgespielt');

    await warte(800);
    pruefe(sichtbar() === 'uebergang', 'Übergangs-Bildschirm erscheint');
    nachId.uebergangKnopf.onclick();
  }

  pruefe(sichtbar() === 'ergebnis', 'Ergebnis-Bildschirm erscheint');
  pruefe(nachId.ergebnisListe.children.length === 2, 'beide Spieler im Ergebnis');
  pruefe(/gewinnt|Unentschieden/.test(nachId.ergebnisSieger.textContent), 'Sieger steht fest: ' + nachId.ergebnisSieger.textContent);
  const besten = JSON.parse(speicher['weltraum-quiz-bestenliste'] || '[]');
  pruefe(besten.length === 2 && besten[0].punkte >= besten[1].punkte, 'Bestenliste gespeichert und sortiert');
  console.log('  ℹ️  Punkte: ' + G.SPIEL.spieler.map(s => s.name + '=' + s.punkte).join(', '));

  // Neustart
  nachId.knopfNochmal.onclick();
  pruefe(sichtbar() === 'start', 'Neustart führt zum Startbildschirm');

  console.log('\n=== TEST: 1 Spieler, Herzen aufbrauchen ===');
  nachId.wahlSpieler.children[0].onclick();
  nachId.wahlStufe.children[0].onclick();
  nachId.knopfStart.onclick();
  let s2 = 0;
  while (G.SPIEL.anzugSchritt < 5 && s2++ < 40) {
    const ziel = G.SPIEL.kette[G.SPIEL.anzugSchritt].modul.id;
    nachId.issKarte.children[G.MODULE.findIndex(m => m.id === ziel)].onclick();
    await warte(20);
    beantworteRaetsel(true);
    await wartetAufRaetselEnde();
  }
  nachId.anzugWeiter.onclick();
  let b2 = 0;
  while (!G.K.vorbei && b2++ < 20000) {         // nicht schießen -> Herzen gehen verloren
    if (G.raetselAktiv) { beantworteRaetsel(false); await wartetAufRaetselEnde(); continue; }
    if (G.K.laeuft) G.rechne(1); else await warte(20);
  }
  pruefe(G.SPIEL.spieler[0].herzen === 0, 'alle 3 Herzen verloren');
  pruefe(G.SPIEL.spieler[0].gerettet === false, 'Runde als verloren gewertet');
  await warte(800);
  pruefe(sichtbar() === 'uebergang', 'Übergang nach Niederlage');
  nachId.uebergangKnopf.onclick();
  pruefe(sichtbar() === 'ergebnis', '1-Spieler geht direkt zum Ergebnis');

  console.log(fehler === 0 ? '\n🎉 ALLE TESTS BESTANDEN\n' : '\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(fehler === 0 ? 0 : 1);
})();
