/* Test für den Ablauf: Üben und Test schreiben.
   Wir bauen einen winzigen Fake-Browser und spielen eine ganze
   Übungsrunde und einen ganzen Test durch. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const GETEILT = path.join(__dirname, '..', '..', '..', 'shared') + path.sep;

let fehler = 0;
function pruefe(b, text) {
  if (b) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

/* ---------------- Mini-DOM ---------------- */
function baueFakeBrowser() {
  const alle = [];
  const nachId = {};

  function neuesElement(tag) {
    const klassen = new Set();
    const el = {
      tagName: (tag || 'DIV').toUpperCase(),
      id: '', children: [], parent: null, _html: '',
      textContent: '', value: '', placeholder: '', type: '',
      disabled: false, autocomplete: '', inputMode: '',
      style: {}, dataset: {}, onclick: null, _hoerer: {},
      get className() { return [...klassen].join(' '); },
      set className(v) {
        klassen.clear();
        String(v).split(/\s+/).filter(Boolean).forEach((c) => klassen.add(c));
      },
      classList: {
        add: (...c) => c.forEach((x) => klassen.add(x)),
        remove: (...c) => c.forEach((x) => klassen.delete(x)),
        contains: (c) => klassen.has(c),
        toggle: (c, an) => {
          if (an === undefined) an = !klassen.has(c);
          an ? klassen.add(c) : klassen.delete(c);
          return an;
        }
      },
      get innerHTML() { return el._html; },
      set innerHTML(v) { el._html = String(v); if (v === '') el.children = []; },
      appendChild(k) { k.parent = el; el.children.push(k); return k; },
      addEventListener(art, fn) { el._hoerer[art] = fn; },
      querySelectorAll(sel) {
        const treffer = [];
        (function suche(n) {
          for (const k of n.children) {
            if (sel.startsWith('.') ? k.classList.contains(sel.slice(1))
                                    : k.tagName === sel.toUpperCase()) treffer.push(k);
            suche(k);
          }
        })(el);
        return treffer;
      },
      focus() {}
    };
    alle.push(el);
    return el;
  }

  function reg(id, klasse, tag) {
    const el = neuesElement(tag || 'div');
    el.id = id;
    if (klasse) el.className = klasse;
    nachId[id] = el;
    return el;
  }

  // Die Bildschirme
  for (const id of ['uebersicht', 'uebung', 'test', 'ergebnis']) reg(id, 'bildschirm');
  nachId.uebersicht.classList.add('aktiv');

  // Alle weiteren Element-IDs aus der echten index.html holen
  const html = fs.readFileSync(ORDNER + 'index.html', 'utf8');
  for (const treffer of html.matchAll(/id="([^"]+)"/g)) {
    if (!nachId[treffer[1]]) reg(treffer[1]);
  }

  const dokument = {
    getElementById: (id) => nachId[id] || reg(id),
    createElement: neuesElement,
    querySelectorAll: (sel) => {
      const klasse = sel.replace('.', '');
      return alle.filter((e) => e.classList.contains(klasse));
    },
    addEventListener(art, fn) { dokument._hoerer = dokument._hoerer || {}; dokument._hoerer[art] = fn; },
    _hoerer: {}
  };

  return { dokument: dokument, nachId: nachId };
}

/* ---------------- Frische Welt bauen ---------------- */
function frischeWelt() {
  const fake = baueFakeBrowser();
  const speicher = new Map();

  const umgebung = {
    console: console, Math: Math, JSON: JSON, Object: Object,
    Number: Number, String: String, Date: Date, Set: Set,
    document: fake.dokument,
    location: { hash: '', search: '' },
    confirm: () => true,
    alert: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    localStorage: {
      getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => { speicher.set(k, String(v)); },
      removeItem: (k) => { speicher.delete(k); },
      key: (i) => [...speicher.keys()][i] ?? null,
      get length() { return speicher.size; }
    }
  };
  umgebung.window = umgebung;
  umgebung.window.scrollTo = () => {};

  const kontext = vm.createContext(umgebung);
  for (const datei of [GETEILT + 'speicher.js', GETEILT + 'profil.js',
                       ORDNER + 'aufgaben.js', ORDNER + 'aufgaben-klasse3.js',
                       ORDNER + 'aufgaben-klasse5.js', ORDNER + 'mathe.js']) {
    vm.runInContext(fs.readFileSync(datei, 'utf8'), kontext, { filename: path.basename(datei) });
  }
  // Die Seite "lädt"
  if (fake.dokument._hoerer.DOMContentLoaded) fake.dokument._hoerer.DOMContentLoaded();

  return { k: kontext, el: fake.nachId, lauf: (code) => vm.runInContext(code, kontext) };
}

/* Die aktuelle Aufgabe richtig beantworten (oder absichtlich falsch) */
function antworteRichtig(w, kastenId, richtig) {
  const aufgabe = w.lauf('LAUF.aufgabe');
  const felder = w.el[kastenId].querySelectorAll('input');
  const art = aufgabe.eingabe || 'zahl';

  if (art === 'rest') {
    const teile = String(aufgabe.antwort).split(' R ');
    felder[0].value = richtig ? teile[0] : '99999';
    felder[1].value = richtig ? teile[1] : '7';
  } else {
    felder[0].value = richtig ? String(aufgabe.antwort) : 'völliger Quatsch 123456';
  }
}

/* ============================================================
   TEST 1: Die Übersicht wird aufgebaut
   ============================================================ */
console.log('\n=== TEST: Übersicht ===');
{
  const w = frischeWelt();
  gleich(w.lauf('offeneKlasse'), 'klasse3', 'die 3. Klasse ist zuerst offen');
  pruefe(w.el.uebersicht.classList.contains('aktiv'), 'der Übersichts-Bildschirm ist sichtbar');
  gleich(w.el.lektionen.children.length, 5, 'für die 3. Klasse stehen 5 Lektionen da');
  gleich(w.el.klassenwahl.children.length, 2, 'es gibt zwei Klassenstufen zur Auswahl');

  // Auf die 5. Klasse umschalten
  w.el.klassenwahl.children[1].onclick();
  gleich(w.lauf('offeneKlasse'), 'klasse5', 'Umschalten auf die 5. Klasse geht');
  gleich(w.el.lektionen.children.length, 6, 'für die 5. Klasse stehen 6 Lektionen da');
}

/* ============================================================
   TEST 2: Üben — richtig, falsch, Serie
   ============================================================ */
console.log('\n=== TEST: Üben ===');
{
  const w = frischeWelt();
  const emma = w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf(`meldeAn("${emma.profil.id}", "1234")`);
  w.lauf('zeichneUebersicht()');

  w.lauf('starteUebung(findeLektion("klasse3", "einmaleins"))');
  pruefe(w.el.uebung.classList.contains('aktiv'), 'der Übungsbildschirm ist offen');
  pruefe(w.el.uebungFrage.textContent.length > 3, 'eine Frage steht da');
  gleich(w.el.uebungWeiter.textContent, 'Prüfen', 'der Knopf heißt "Prüfen"');

  // Ohne Antwort geht es nicht weiter
  w.lauf('antwortAbschicken()');
  pruefe(w.el.uebungMeldung.textContent.indexOf('Antwort') !== -1,
         'ohne Antwort kommt ein Hinweis');
  gleich(w.lauf('LAUF.gesamt'), 0, 'das zählt noch nicht als Aufgabe');

  // Drei richtige hintereinander
  for (let i = 1; i <= 3; i++) {
    antworteRichtig(w, 'uebungAntwortzeile', true);
    w.lauf('antwortAbschicken()');
    gleich(w.lauf('LAUF.serie'), i, 'die Serie steht bei ' + i);
    pruefe(w.el.uebungMeldung.className.indexOf('richtig') !== -1, 'die Meldung ist grün');
    gleich(w.el.uebungWeiter.textContent, 'Nächste Aufgabe →', 'der Knopf führt weiter');
    w.lauf('antwortAbschicken()');       // nächste Aufgabe
  }
  gleich(w.lauf('LAUF.richtig'), 3, 'drei Aufgaben richtig');

  // Eine falsche
  antworteRichtig(w, 'uebungAntwortzeile', false);
  w.lauf('antwortAbschicken()');
  gleich(w.lauf('LAUF.serie'), 0, 'die Serie ist gerissen');
  pruefe(w.el.uebungMeldung.className.indexOf('falsch') !== -1, 'die Meldung ist rot');
  pruefe(w.el.uebungMeldung.textContent.indexOf('Richtig wäre') !== -1,
         'die richtige Antwort wird gezeigt');
  pruefe(!w.el.uebungTipp.classList.contains('versteckt'), 'der Tipp wird eingeblendet');
  pruefe(w.el.uebungTipp.textContent.indexOf('💡') === 0, 'der Tipp hat ein Glühbirnen-Symbol');

  // Der Fortschritt ist im Profil gelandet
  const f = w.lauf('holeSchulFortschritt("klasse3", "einmaleins")');
  gleich(f.training.gesamt, 4, 'vier geübte Aufgaben sind gespeichert');
  gleich(f.training.richtig, 3, 'davon drei richtig');
  gleich(f.training.besteSerie, 3, 'die beste Serie war 3');
}

/* ============================================================
   TEST 3: Test schreiben — alles richtig gibt Note 1
   ============================================================ */
console.log('\n=== TEST: Test schreiben (alles richtig) ===');
{
  const w = frischeWelt();
  const max = w.lauf('neuesProfil("Max", "🐼", "5678")');
  w.lauf(`meldeAn("${max.profil.id}", "5678")`);
  w.lauf('zeichneUebersicht()');

  w.lauf('starteTest(findeLektion("klasse3", "plus-minus"))');
  pruefe(w.el.test.classList.contains('aktiv'), 'der Test-Bildschirm ist offen');
  gleich(w.el.testAnzahl.textContent, 10, 'der Test hat 10 Aufgaben');
  gleich(w.el.testNummer.textContent, 1, 'wir sind bei Aufgabe 1');

  for (let i = 1; i <= 10; i++) {
    gleich(w.lauf('LAUF.nummer'), i, 'Aufgabe ' + i + ' liegt vor');
    antworteRichtig(w, 'testAntwortzeile', true);
    w.lauf('testAntwortAbschicken()');
  }

  pruefe(w.el.ergebnis.classList.contains('aktiv'), 'nach 10 Aufgaben kommt das Ergebnis');
  gleich(w.el.ergebnisNote.textContent, 1, 'alles richtig gibt Note 1');
  gleich(w.el.ergebnisNotenText.textContent, 'sehr gut', 'Note 1 heißt "sehr gut"');
  gleich(w.el.ergebnisPunkte.textContent, '10 von 10 richtig', 'die Punkte stehen da');
  gleich(w.el.ergebnisRueckblick.children.length, 10, 'alle 10 Aufgaben im Rückblick');
  pruefe(w.el.ergebnisRueckblick.children.every(
           (li) => li.classList.contains('war-richtig')),
         'alle sind als richtig markiert');

  const f = w.lauf('holeSchulFortschritt("klasse3", "plus-minus")');
  gleich(f.besteNote, 1, 'die Note 1 steht im Profil');
  gleich(f.tests.length, 1, 'ein Test im Verlauf');
  gleich(f.tests[0].richtig, 10, 'mit 10 richtigen');
}

/* ============================================================
   TEST 4: Test schreiben — die Hälfte falsch
   ============================================================ */
console.log('\n=== TEST: Test schreiben (5 von 10) ===');
{
  const w = frischeWelt();
  const emma = w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf(`meldeAn("${emma.profil.id}", "1234")`);
  w.lauf('zeichneUebersicht()');
  w.lauf('starteTest(findeLektion("klasse5", "geometrie"))');

  for (let i = 1; i <= 10; i++) {
    antworteRichtig(w, 'testAntwortzeile', i <= 5);
    w.lauf('testAntwortAbschicken()');
  }

  gleich(w.el.ergebnisNote.textContent, 4, '5 von 10 gibt Note 4');
  gleich(w.el.ergebnisPunkte.textContent, '5 von 10 richtig', 'die Punkte stimmen');

  const falsche = w.el.ergebnisRueckblick.children.filter(
    (li) => li.classList.contains('war-falsch'));
  gleich(falsche.length, 5, 'fünf Aufgaben sind als falsch markiert');
  pruefe(falsche[0].innerHTML.indexOf('deine Antwort') !== -1,
         'bei falschen steht die eigene Antwort dabei');
  pruefe(falsche[0].innerHTML.indexOf('richtig') !== -1,
         'und die richtige Antwort auch');
}

/* ============================================================
   TEST 5: Die Zeit läuft ab — offene Aufgaben zählen als falsch
   ============================================================ */
console.log('\n=== TEST: Zeit abgelaufen ===');
{
  const w = frischeWelt();
  const emma = w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf(`meldeAn("${emma.profil.id}", "1234")`);
  w.lauf('zeichneUebersicht()');
  w.lauf('starteTest(findeLektion("klasse3", "einmaleins"))');

  // Drei Aufgaben richtig, dann ist die Zeit um
  for (let i = 1; i <= 3; i++) {
    antworteRichtig(w, 'testAntwortzeile', true);
    w.lauf('testAntwortAbschicken()');
  }
  w.lauf('beendeTest(true)');

  pruefe(w.el.ergebnis.classList.contains('aktiv'), 'das Ergebnis erscheint');
  gleich(w.el.ergebnisPunkte.textContent, '3 von 10 richtig',
         'nur die bearbeiteten zählen als richtig');
  gleich(w.el.ergebnisNote.textContent, 5, '3 von 10 gibt Note 5');
  gleich(w.el.ergebnisRueckblick.children.length, 10,
         'der Rückblick zeigt trotzdem alle 10 Zeilen');
  pruefe(w.el.ergebnisZusatz.textContent.indexOf('Zeit war um') !== -1,
         'es steht dabei, dass die Zeit um war');

  const f = w.lauf('holeSchulFortschritt("klasse3", "einmaleins")');
  gleich(f.tests[0].richtig, 3, 'das Ergebnis ist gespeichert');
}

/* ============================================================
   TEST 6: Als Gast läuft alles, es wird nur nichts gespeichert
   ============================================================ */
console.log('\n=== TEST: Als Gast ===');
{
  const w = frischeWelt();
  w.lauf('starteTest(findeLektion("klasse3", "sachaufgaben"))');

  for (let i = 1; i <= 10; i++) {
    antworteRichtig(w, 'testAntwortzeile', true);
    w.lauf('testAntwortAbschicken()');
  }
  gleich(w.el.ergebnisNote.textContent, 1, 'auch als Gast gibt es eine Note');
  pruefe(w.el.ergebnisZusatz.textContent.indexOf('nicht gespeichert') !== -1,
         'es wird erklärt, dass nichts gespeichert wird');
  gleich(w.lauf('holeSchulFortschritt("klasse3", "sachaufgaben").tests.length'), 0,
         'im Speicher steht wirklich nichts');
}

/* ============================================================
   TEST 7: Antwortfelder passen zur Aufgabenart
   ============================================================ */
console.log('\n=== TEST: Antwortfelder ===');
{
  const w = frischeWelt();

  w.lauf(`baueAntwortzeile(document.getElementById('uebungAntwortzeile'),
          {frage: 'x', antwort: '9 R 2', eingabe: 'rest'})`);
  gleich(w.el.uebungAntwortzeile.querySelectorAll('INPUT').length, 2,
         'Teilen mit Rest bekommt zwei Felder');

  w.lauf(`baueAntwortzeile(document.getElementById('uebungAntwortzeile'),
          {frage: 'x', antwort: '5', eingabe: 'zahl', einheit: '€'})`);
  gleich(w.el.uebungAntwortzeile.querySelectorAll('INPUT').length, 1,
         'eine Zahl bekommt ein Feld');
  gleich(w.el.uebungAntwortzeile.querySelectorAll('.einheit').length, 1,
         'die Einheit steht dahinter');

  w.lauf(`baueAntwortzeile(document.getElementById('uebungAntwortzeile'),
          {frage: 'x', antwort: '3/4', eingabe: 'bruch'})`);
  const feld = w.el.uebungAntwortzeile.querySelectorAll('INPUT')[0];
  pruefe(feld.placeholder.indexOf('3/4') !== -1, 'beim Bruch steht ein Beispiel im Feld');

  // Aus zwei Feldern wird "9 R 2" gebaut
  w.lauf(`baueAntwortzeile(document.getElementById('uebungAntwortzeile'),
          {frage: 'x', antwort: '9 R 2', eingabe: 'rest'})`);
  const beide = w.el.uebungAntwortzeile.querySelectorAll('INPUT');
  beide[0].value = '9';
  beide[1].value = '2';
  gleich(w.lauf(`leseAntwort(document.getElementById('uebungAntwortzeile'),
                 {eingabe: 'rest'})`), '9 R 2', 'aus zwei Feldern wird "9 R 2"');
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
