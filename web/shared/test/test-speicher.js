/* Test für Profile und Speicher — ganz ohne Browser.
   Wir bauen uns ein Mini-localStorage und laden die echten Dateien. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;

/* ---------------- Mini-localStorage ---------------- */
function neuerSpeicher() {
  const daten = new Map();
  return {
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => { daten.set(k, String(v)); },
    removeItem: (k) => { daten.delete(k); },
    key: (i) => [...daten.keys()][i] ?? null,
    get length() { return daten.size; },
    _daten: daten
  };
}

/* ---------------- Test-Helfer ---------------- */
let fehler = 0;
function pruefe(bedingung, text) {
  if (bedingung) {
    console.log('  ✅ ' + text);
  } else {
    console.log('  ❌ ' + text);
    fehler++;
  }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

/* ---------------- Umgebung frisch aufbauen ---------------- */
function frischeWelt() {
  const umgebung = { localStorage: neuerSpeicher(), console: console, Date: Date, Math: Math, JSON: JSON };
  umgebung.window = umgebung;
  const kontext = vm.createContext(umgebung);
  for (const datei of ['speicher.js', 'profil.js']) {
    vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), kontext, { filename: datei });
  }
  return kontext;
}

/* ============================================================
   TEST 1: Profile anlegen, anmelden, PIN
   ============================================================ */
console.log('\n=== TEST: Profile und PIN ===');
{
  const w = frischeWelt();
  const lauf = (code) => vm.runInContext(code, w);

  gleich(lauf('ladeProfile().length'), 0, 'am Anfang gibt es keine Profile');
  gleich(lauf('aktivesProfil()'), null, 'niemand ist angemeldet (Gast)');

  const emma = lauf('neuesProfil("Emma", "🦊", "1234")');
  pruefe(emma.ok === true, 'Emma wird angelegt');
  gleich(lauf('ladeProfile().length'), 1, 'jetzt gibt es 1 Profil');

  pruefe(lauf('neuesProfil("E", "🐼", "1234")').ok === false, 'Name mit 1 Buchstaben wird abgelehnt');
  pruefe(lauf('neuesProfil("Max", "🐼", "12")').ok === false, 'zu kurze PIN wird abgelehnt');
  pruefe(lauf('neuesProfil("Max", "🐼", "abcd")').ok === false, 'PIN aus Buchstaben wird abgelehnt');
  pruefe(lauf('neuesProfil("emma", "🐼", "5678")').ok === false, 'gleicher Name (auch klein) wird abgelehnt');
  gleich(lauf('ladeProfile().length'), 1, 'nach allen Fehlversuchen immer noch 1 Profil');

  const max = lauf('neuesProfil("Max", "🐼", "5678")');
  pruefe(max.ok === true, 'Max wird angelegt');
  pruefe(emma.profil.id !== max.profil.id, 'beide haben verschiedene Ausweise (id)');

  // Anmelden
  pruefe(lauf(`meldeAn("${emma.profil.id}", "9999")`) === false, 'falsche PIN meldet nicht an');
  gleich(lauf('aktivesProfil()'), null, 'nach falscher PIN weiterhin Gast');
  pruefe(lauf(`meldeAn("${emma.profil.id}", "1234")`) === true, 'richtige PIN meldet an');
  gleich(lauf('aktivesProfil().name'), 'Emma', 'Emma ist angemeldet');

  lauf('meldeAb()');
  gleich(lauf('aktivesProfil()'), null, 'nach Abmelden wieder Gast');

  // PIN ändern
  pruefe(lauf(`setzePin("${max.profil.id}", "0000")`) === true, 'PIN von Max wird geändert');
  pruefe(lauf(`meldeAn("${max.profil.id}", "0000")`) === true, 'Anmelden mit neuer PIN geht');
  pruefe(lauf(`setzePin("${max.profil.id}", "12")`) === false, 'ungültige neue PIN wird abgelehnt');
}

/* ============================================================
   TEST 2: Punkte und Bestenliste
   ============================================================ */
console.log('\n=== TEST: Punkte und Bestenliste ===');
{
  const w = frischeWelt();
  const lauf = (code) => vm.runInContext(code, w);

  const emma = lauf('neuesProfil("Emma", "🦊", "1234")');
  lauf(`meldeAn("${emma.profil.id}", "1234")`);

  lauf('speichereErgebnis("nikolaus", 120)');
  gleich(lauf('holeBestwert("nikolaus")'), 120, 'erster Bestwert ist 120');

  lauf('speichereErgebnis("nikolaus", 80)');
  gleich(lauf('holeBestwert("nikolaus")'), 120, 'schlechteres Spiel senkt den Bestwert nicht');
  gleich(lauf('leseSpeicher("p.' + emma.profil.id + '.spiele.nikolaus").zuletzt'), 80,
         'das letzte Ergebnis wird trotzdem gemerkt');
  gleich(lauf('leseSpeicher("p.' + emma.profil.id + '.spiele.nikolaus").anzahl'), 2,
         'zwei Spiele gezählt');

  lauf('speichereErgebnis("nikolaus", 300)');
  gleich(lauf('holeBestwert("nikolaus")'), 300, 'besseres Spiel hebt den Bestwert');

  gleich(lauf('holeBestenliste("nikolaus").map(e => e.punkte)'), [300, 120, 80],
         'Bestenliste ist absteigend sortiert');
  gleich(lauf('holeBestenliste("nikolaus")[0].name'), 'Emma', 'Name steht in der Bestenliste');

  // Bestenliste hält nur 5 Einträge
  for (const p of [10, 20, 30, 40, 50]) lauf(`speichereErgebnis("nikolaus", ${p})`);
  gleich(lauf('holeBestenliste("nikolaus").length'), 5, 'Bestenliste bleibt bei 5 Einträgen');

  // Gast: Punkte landen nur in der Geräte-Bestenliste
  lauf('meldeAb()');
  lauf('speichereErgebnis("nikolaus", 5000)');
  gleich(lauf('holeBestwert("nikolaus")'), 0, 'als Gast gibt es keinen persönlichen Bestwert');
  gleich(lauf('holeBestenliste("nikolaus")[0].name'), 'Gast', 'Gast steht aber in der Bestenliste');
  lauf(`meldeAn("${emma.profil.id}", "1234")`);
  gleich(lauf('holeBestwert("nikolaus")'), 300, 'Emmas Bestwert ist unverändert');

  // Jedes Kind hat seine eigenen Punkte
  const max = lauf('neuesProfil("Max", "🐼", "5678")');
  lauf(`meldeAn("${max.profil.id}", "5678")`);
  gleich(lauf('holeBestwert("nikolaus")'), 0, 'Max fängt bei 0 an');
  lauf('speichereErgebnis("nikolaus", 60)');
  gleich(lauf('holeBestwert("nikolaus")'), 60, 'Max hat jetzt 60');
  gleich(lauf(`holeBestwert("nikolaus", "${emma.profil.id}")`), 300, 'Emma hat weiterhin 300');
}

/* ============================================================
   TEST 3: Schul-Fortschritt
   ============================================================ */
console.log('\n=== TEST: Schul-Fortschritt ===');
{
  const w = frischeWelt();
  const lauf = (code) => vm.runInContext(code, w);

  const emma = lauf('neuesProfil("Emma", "🦊", "1234")');
  lauf(`meldeAn("${emma.profil.id}", "1234")`);

  gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").training.gesamt'), 0,
         'ohne Übung ist der Fortschritt leer');

  lauf('speichereTraining("klasse3", "einmaleins", true, 1)');
  lauf('speichereTraining("klasse3", "einmaleins", true, 2)');
  lauf('speichereTraining("klasse3", "einmaleins", false, 0)');
  const t = lauf('holeSchulFortschritt("klasse3", "einmaleins").training');
  gleich(t.gesamt, 3, 'drei Aufgaben geübt');
  gleich(t.richtig, 2, 'davon zwei richtig');
  gleich(t.besteSerie, 2, 'beste Serie war 2');

  lauf('speichereTest("klasse3", "einmaleins", {richtig: 8, gesamt: 10, note: 2, dauerSek: 95})');
  gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").besteNote'), 2, 'beste Note ist 2');

  lauf('speichereTest("klasse3", "einmaleins", {richtig: 5, gesamt: 10, note: 4, dauerSek: 200})');
  gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").besteNote'), 2,
         'schlechterer Test verschlechtert die beste Note nicht');
  gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").tests.length'), 2, 'zwei Tests im Verlauf');
  gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").tests[0].note'), 4,
         'der neueste Test steht vorn');

  lauf('speichereTest("klasse3", "einmaleins", {richtig: 10, gesamt: 10, note: 1, dauerSek: 60})');
  gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").besteNote'), 1, 'Note 1 wird übernommen');

  // Verlauf wird auf 10 begrenzt
  for (let i = 0; i < 12; i++) {
    lauf('speichereTest("klasse5", "brueche", {richtig: 6, gesamt: 10, note: 3, dauerSek: 100})');
  }
  gleich(lauf('holeSchulFortschritt("klasse5", "brueche").tests.length'), 10,
         'es werden nur die letzten 10 Tests behalten');

  // Andere Lektion bleibt unberührt
  gleich(lauf('holeSchulFortschritt("klasse3", "plus-minus").tests.length'), 0,
         'eine andere Lektion ist noch leer');
}

/* ============================================================
   TEST 4: Profil löschen räumt alles weg
   ============================================================ */
console.log('\n=== TEST: Profil löschen ===');
{
  const w = frischeWelt();
  const lauf = (code) => vm.runInContext(code, w);

  const emma = lauf('neuesProfil("Emma", "🦊", "1234")');
  const max  = lauf('neuesProfil("Max", "🐼", "5678")');
  lauf(`meldeAn("${emma.profil.id}", "1234")`);
  lauf('speichereErgebnis("nikolaus", 200)');
  lauf('speichereTest("klasse3", "einmaleins", {richtig: 9, gesamt: 10, note: 1, dauerSek: 70})');

  lauf(`meldeAn("${max.profil.id}", "5678")`);
  lauf('speichereErgebnis("nikolaus", 111)');

  lauf(`loescheProfil("${emma.profil.id}")`);
  gleich(lauf('ladeProfile().length'), 1, 'nur noch ein Profil da');
  gleich(lauf(`holeBestwert("nikolaus", "${emma.profil.id}")`), 0, 'Emmas Punkte sind weg');
  gleich(lauf(`holeSchulFortschritt("klasse3", "einmaleins", "${emma.profil.id}").besteNote`), null,
         'Emmas Noten sind weg');
  gleich(lauf(`holeBestwert("nikolaus", "${max.profil.id}")`), 111, 'Max behält seine Punkte');
  gleich(lauf('aktivesProfil().name'), 'Max', 'Max ist noch angemeldet');

  // Wer angemeldet ist und gelöscht wird, ist danach Gast
  lauf(`loescheProfil("${max.profil.id}")`);
  gleich(lauf('aktivesProfil()'), null, 'nach dem Löschen des eigenen Profils ist man Gast');
}

/* ============================================================
   TEST 5: Speichern verboten (privates Fenster) — nichts stürzt ab
   ============================================================ */
console.log('\n=== TEST: Browser verbietet Speichern ===');
{
  const umgebung = {
    console: console, Date: Date, Math: Math, JSON: JSON,
    localStorage: {
      getItem() { throw new Error('verboten'); },
      setItem() { throw new Error('verboten'); },
      removeItem() { throw new Error('verboten'); },
      key() { throw new Error('verboten'); },
      get length() { throw new Error('verboten'); }
    }
  };
  umgebung.window = umgebung;
  const kontext = vm.createContext(umgebung);
  for (const datei of ['speicher.js', 'profil.js']) {
    vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), kontext, { filename: datei });
  }
  const lauf = (code) => vm.runInContext(code, kontext);

  let geknallt = false;
  try {
    gleich(lauf('ladeProfile()'), [], 'Profile lesen ergibt eine leere Liste');
    gleich(lauf('aktivesProfil()'), null, 'niemand angemeldet');
    lauf('speichereErgebnis("nikolaus", 50)');
    gleich(lauf('holeBestwert("nikolaus")'), 0, 'Bestwert bleibt 0');
    gleich(lauf('holeSchulFortschritt("klasse3", "einmaleins").tests'), [], 'Fortschritt ist leer');
    gleich(lauf('holeQuizBestenliste()'), [], 'Quiz-Bestenliste ist leer');
  } catch (e) {
    geknallt = true;
    console.log('  ❌ Es hat geknallt: ' + e.message);
    fehler++;
  }
  pruefe(!geknallt, 'die Plattform läuft auch ohne Speicher weiter');
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
