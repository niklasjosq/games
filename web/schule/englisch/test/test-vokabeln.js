/* Test für die Englisch-Vokabeln.
   Wichtigster Punkt: Jede Vokabel muss ihre eigene Antwort als richtig
   durchgehen lassen — und kein Wort darf doppelt vorkommen, sonst
   verwirrt die Lernbox. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const GETEILT = path.join(__dirname, '..', '..', '..', 'shared') + path.sep;

let fehler = 0;
function pruefe(bedingung, text) {
  if (bedingung) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

/* ---------------- Die Vokabel-Dateien laden ---------------- */
const umgebung = {
  console: console, Math: Math, JSON: JSON, Object: Object,
  Number: Number, String: String, Array: Array, Date: Date
};
umgebung.window = umgebung;
const K = vm.createContext(umgebung);
vm.runInContext(fs.readFileSync(GETEILT + 'schule.js', 'utf8'), K, { filename: 'schule.js' });
for (const datei of ['vokabeln.js', 'vokabeln-klasse5.js']) {
  vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), K, { filename: datei });
}
const lauf = (code) => vm.runInContext(code, K);

const LEKTIONEN = lauf('alleLektionen("klasse5")');
const WOERTER = lauf('alleWoerter("klasse5")');
const normalVokabel = lauf('normalVokabel');
const vokabelStimmt = lauf('vokabelStimmt');
const pruefeVokabel = lauf('pruefeVokabel');
const baueAuswahl = lauf('baueAuswahl');
const lernboxSchritt = lauf('lernboxSchritt');
const istFaellig = lauf('istFaellig');
const faelligeWoerter = lauf('faelligeWoerter');
const zaehleStufen = lauf('zaehleStufen');
const testWoerterFn = lauf('testWoerter');
const wortIdFn = lauf('wortId');
const tagesnummer = lauf('tagesnummer');

function finde(id) {
  const treffer = WOERTER.filter((x) => wortIdFn(x.wort) === id)[0];
  if (!treffer) throw new Error('Wort nicht gefunden: ' + id);
  return treffer.wort;
}

/* ============================================================
   TEST 1: Der Lektions-Katalog
   ============================================================ */
console.log('\n=== TEST: Lektionen ===');
{
  gleich(LEKTIONEN.length, 12, 'es gibt 12 Lektionen');

  let alleVollstaendig = true;
  let alleGrossGenug = true;
  let testWerteOk = true;
  for (const l of LEKTIONEN) {
    if (!l.titel || !l.symbol || !l.beschreibung || !l.thema) alleVollstaendig = false;
    if (l.woerter.length < 20) { alleGrossGenug = false; console.log('     zu klein: ' + l.id); }
    if (l.testAnzahl < 5 || l.testZeitSek < 120) testWerteOk = false;
  }
  pruefe(alleVollstaendig, 'jede Lektion hat Thema, Titel, Symbol und Beschreibung');
  pruefe(alleGrossGenug, 'jede Lektion hat mindestens 20 Wörter');
  pruefe(testWerteOk, 'jede Lektion hat sinnvolle Testwerte');

  pruefe(WOERTER.length >= 350 && WOERTER.length <= 450,
         'es sind zwischen 350 und 450 Wörter (' + WOERTER.length + ')');

  // Die Lektions-Kennungen werden zu Speicherschlüsseln — nur ASCII
  let idsSauber = true;
  for (const l of LEKTIONEN) if (!/^[a-z0-9-]+$/.test(l.id)) idsSauber = false;
  pruefe(idsSauber, 'alle Lektions-Kennungen sind einfache ASCII-Namen');

  // Die Themes stehen zusammen, damit die Überschriften stimmen
  const themen = LEKTIONEN.map((l) => l.thema);
  let gruppiert = true;
  for (let i = 0; i < themen.length; i++) {
    const ersteStelle = themen.indexOf(themen[i]);
    if (i > ersteStelle && themen[i - 1] !== themen[i]) gruppiert = false;
  }
  pruefe(gruppiert, 'Lektionen desselben Themes stehen direkt beieinander');
}

/* ============================================================
   TEST 2: Wie ein Wort aussehen muss
   ============================================================ */
console.log('\n=== TEST: Die Wörter selbst ===');
{
  const erlaubteArten = ['nomen', 'verb', 'adjektiv', 'zahl', 'satz', 'sonst'];
  let formOk = true, artOk = true, keinMuell = true;

  for (const { wort, lektion } of WOERTER) {
    if (!Array.isArray(wort.englisch) || !Array.isArray(wort.deutsch)) formOk = false;
    if (!wort.englisch.length || !wort.deutsch.length) formOk = false;
    for (const f of wort.englisch.concat(wort.deutsch)) {
      if (typeof f !== 'string' || f.trim() === '') formOk = false;
      if (/undefined|NaN|null/.test(f)) { keinMuell = false; console.log('     Müll in ' + lektion.id + ': ' + f); }
    }
    if (wort.wortart && erlaubteArten.indexOf(wort.wortart) === -1) {
      artOk = false; console.log('     unbekannte Wortart: ' + wort.wortart);
    }
  }
  pruefe(formOk, 'jedes Wort hat englische und deutsche Formen als Liste');
  pruefe(artOk, 'alle Wortarten sind bekannt');
  pruefe(keinMuell, 'kein undefined oder NaN in den Wörtern');
}

/* ============================================================
   TEST 3: Nichts doppelt
   ============================================================ */
console.log('\n=== TEST: Keine Dubletten ===');
{
  const gesehen = {};
  let doppelt = [];
  for (const { wort, lektion } of WOERTER) {
    const id = wortIdFn(wort);
    if (gesehen[id]) doppelt.push(id + ' (' + gesehen[id] + ' und ' + lektion.id + ')');
    gesehen[id] = lektion.id;
  }
  pruefe(doppelt.length === 0, 'jedes englische Wort gibt es im ganzen Fach nur einmal' +
         (doppelt.length ? ' — doppelt: ' + doppelt.slice(0, 5).join(', ') : ''));

  // Innerhalb einer Lektion darf sich auch keine Bedeutung überschneiden
  let ueberschneidung = [];
  for (const l of LEKTIONEN) {
    for (const sprache of ['englisch', 'deutsch']) {
      const belegt = {};
      for (const w of l.woerter) {
        for (const f of w[sprache]) {
          const norm = normalVokabel(f, sprache === 'deutsch' ? 'de' : 'en');
          if (belegt[norm]) ueberschneidung.push(l.id + ': "' + f + '"');
          belegt[norm] = true;
        }
      }
    }
  }
  pruefe(ueberschneidung.length === 0, 'in einer Lektion bedeutet kein Wort dasselbe wie ein anderes' +
         (ueberschneidung.length ? ' — ' + ueberschneidung.slice(0, 5).join(', ') : ''));
}

/* ============================================================
   TEST 4: Eingaben glattziehen
   ============================================================ */
console.log('\n=== TEST: Eingaben glattziehen ===');
{
  gleich(normalVokabel(' The  Colour. ', 'en'), 'the colour', 'Groß/klein, Leerzeichen und Punkt egal');
  gleich(normalVokabel('don’t', 'en'), "don't", 'krummes Hochkomma wird gerade');
  gleich(normalVokabel('HELLO!', 'en'), 'hello', 'Ausrufezeichen am Ende weg');
  gleich(normalVokabel('die Küche', 'de'), 'die kueche', 'Umlaute werden umgeschrieben');
  gleich(normalVokabel('Fluß', 'de'), 'fluss', 'ß wird ss');
  gleich(normalVokabel('', 'en'), '', 'leer bleibt leer');
  gleich(normalVokabel(undefined, 'en'), '', 'undefined stürzt nicht ab');
}

/* ============================================================
   TEST 5: Antworten prüfen
   ============================================================ */
console.log('\n=== TEST: Antworten prüfen ===');
{
  const colour = finde('colour');
  pruefe(pruefeVokabel(colour, 'colour', 'de-en'), 'colour gilt');
  pruefe(pruefeVokabel(colour, 'color', 'de-en'), 'die amerikanische Form color gilt auch');
  pruefe(pruefeVokabel(colour, '  COLOUR!  ', 'de-en'), 'Groß/klein und Satzzeichen egal');
  pruefe(!pruefeVokabel(colour, 'colur', 'de-en'), 'ein Tippfehler gilt NICHT');
  pruefe(!pruefeVokabel(colour, '', 'de-en'), 'leere Antwort gilt nicht');

  const cat = finde('cat');
  pruefe(pruefeVokabel(cat, 'cat', 'de-en'), 'cat gilt');
  pruefe(pruefeVokabel(cat, 'the cat', 'de-en'), 'mit Artikel gilt auch');
  pruefe(pruefeVokabel(cat, 'die Katze', 'en-de'), 'deutscher Artikel gilt');
  pruefe(pruefeVokabel(cat, 'Katze', 'en-de'), 'ohne deutschen Artikel gilt auch');

  const run = finde('to run');
  pruefe(pruefeVokabel(run, 'to run', 'de-en'), 'to run gilt');
  pruefe(pruefeVokabel(run, 'run', 'de-en'), 'run ohne to gilt auch');

  const kitchen = finde('kitchen');
  pruefe(pruefeVokabel(kitchen, 'Küche', 'en-de'), 'Küche mit Umlaut gilt');
  pruefe(pruefeVokabel(kitchen, 'Kueche', 'en-de'), 'Kueche ohne Umlaut gilt auch');
  pruefe(!pruefeVokabel(kitchen, 'Kuche', 'en-de'), 'Kuche (falsch geschrieben) gilt nicht');

  // "die" ist im Englischen ein Wort, kein Artikel
  pruefe(!vokabelStimmt('die', ['to die'], 'de'),
         'der deutsche Artikel wird bei englischen Wörtern nicht abgeschnitten');
  pruefe(vokabelStimmt('a', ['a'], 'en'), 'das Wort "a" allein bleibt erhalten');
}

/* ============================================================
   TEST 6: Selbstkontrolle — der wichtigste Test
   ============================================================ */
console.log('\n=== TEST: Jede Vokabel akzeptiert sich selbst ===');
{
  const probleme = lauf('testeVokabeln()');
  pruefe(probleme.length === 0, 'testeVokabeln() findet keine Probleme');
  for (const p of probleme.slice(0, 10)) console.log('     ' + p);
}

/* ============================================================
   TEST 7: Auswahl mit vier Knöpfen
   ============================================================ */
console.log('\n=== TEST: Auswahl (leichter Modus) ===');
{
  let laengeOk = true, genauEinsRichtig = true, ausLektion = true, keinDoppel = true;

  for (let i = 0; i < 500; i++) {
    const eintrag = WOERTER[Math.floor(Math.random() * WOERTER.length)];
    const optionen = baueAuswahl(eintrag.wort, eintrag.lektion.woerter);

    if (optionen.length !== 4) { laengeOk = false; continue; }

    const treffer = optionen.filter((o) => wortIdFn(o) === wortIdFn(eintrag.wort));
    if (treffer.length !== 1) genauEinsRichtig = false;

    const idsDerLektion = eintrag.lektion.woerter.map(wortIdFn);
    for (const o of optionen) if (idsDerLektion.indexOf(wortIdFn(o)) === -1) ausLektion = false;

    const formen = optionen.map((o) => normalVokabel(o.englisch[0], 'en'));
    if (new Set(formen).size !== formen.length) keinDoppel = false;
  }

  pruefe(laengeOk, 'es stehen immer vier Möglichkeiten zur Wahl');
  pruefe(genauEinsRichtig, 'genau eine davon ist richtig');
  pruefe(ausLektion, 'alle Möglichkeiten kommen aus derselben Lektion');
  pruefe(keinDoppel, 'keine zwei Möglichkeiten sind gleich');
}

/* ============================================================
   TEST 8: Die Lernbox
   ============================================================ */
console.log('\n=== TEST: Lernbox (fünf Fächer) ===');
{
  gleich(lernboxSchritt(undefined, true, 100), { stufe: 2, faellig: 101, richtig: 1, falsch: 0 },
         'ein neues Wort richtig -> Fach 2, morgen wieder');
  gleich(lernboxSchritt({ stufe: 2, faellig: 100, richtig: 1, falsch: 0 }, true, 100),
         { stufe: 3, faellig: 103, richtig: 2, falsch: 0 },
         'aus Fach 2 richtig -> Fach 3, in 3 Tagen');
  gleich(lernboxSchritt({ stufe: 3, faellig: 100, richtig: 2, falsch: 0 }, true, 100),
         { stufe: 4, faellig: 107, richtig: 3, falsch: 0 },
         'aus Fach 3 richtig -> Fach 4, in einer Woche');
  gleich(lernboxSchritt({ stufe: 4, faellig: 100, richtig: 3, falsch: 0 }, true, 100),
         { stufe: 5, faellig: 114, richtig: 4, falsch: 0 },
         'aus Fach 4 richtig -> Fach 5, in zwei Wochen');
  gleich(lernboxSchritt({ stufe: 5, faellig: 100, richtig: 9, falsch: 0 }, true, 100),
         { stufe: 5, faellig: 114, richtig: 10, falsch: 0 },
         'Fach 5 ist das letzte — es geht nicht weiter');
  gleich(lernboxSchritt({ stufe: 4, faellig: 100, richtig: 3, falsch: 0 }, false, 100),
         { stufe: 1, faellig: 100, richtig: 3, falsch: 1 },
         'falsch -> zurück in Fach 1 und heute nochmal');

  pruefe(istFaellig(undefined, 100), 'ein unbekanntes Wort ist immer dran');
  pruefe(istFaellig({ stufe: 2, faellig: 99 }, 100), 'überfällig heißt dran');
  pruefe(istFaellig({ stufe: 2, faellig: 100 }, 100), 'heute fällig heißt dran');
  pruefe(!istFaellig({ stufe: 2, faellig: 101 }, 100), 'morgen fällig heißt heute nicht dran');

  const heute = tagesnummer(new Date(2026, 8, 5));
  const morgen = tagesnummer(new Date(2026, 8, 6));
  gleich(morgen - heute, 1, 'zwei aufeinanderfolgende Tage liegen 1 auseinander');
}

/* ============================================================
   TEST 9: Was kommt in einer Lernbox-Runde dran?
   ============================================================ */
console.log('\n=== TEST: Fällige Wörter aussuchen ===');
{
  const l = LEKTIONEN[0];
  const ids = l.woerter.map(wortIdFn);

  // Nichts gelernt -> alles ist neu und dran
  let leer = {};
  leer[l.id] = { woerter: {} };
  gleich(faelligeWoerter([l], leer, 100, null).length, l.woerter.length,
         'ohne Lernbox sind alle Wörter dran');
  gleich(faelligeWoerter([l], leer, 100, 20).length, 20, 'die Portion begrenzt auf 20');

  // Zwei Wiederholungen (eine stark überfällig) und der Rest neu
  let stand = {};
  stand[l.id] = { woerter: {} };
  stand[l.id].woerter[ids[0]] = { stufe: 3, faellig: 100, richtig: 2, falsch: 0 };  // heute
  stand[l.id].woerter[ids[1]] = { stufe: 2, faellig: 90, richtig: 1, falsch: 1 };   // lange überfällig
  stand[l.id].woerter[ids[2]] = { stufe: 5, faellig: 200, richtig: 8, falsch: 0 };  // noch nicht dran

  const dran = faelligeWoerter([l], stand, 100, null);
  gleich(wortIdFn(dran[0].wort), ids[1], 'das am längsten überfällige Wort kommt zuerst');
  gleich(wortIdFn(dran[1].wort), ids[0], 'dann das heute fällige');
  pruefe(dran.every((d) => wortIdFn(d.wort) !== ids[2]),
         'ein Wort in Fach 5 mit späterem Termin kommt nicht dran');
  gleich(dran.length, l.woerter.length - 1, 'alle übrigen Wörter sind neu und damit dran');
  pruefe(dran[2].stand === null, 'nach den Wiederholungen kommen die neuen Wörter');

  const zahlen = zaehleStufen([l], stand);
  gleich(zahlen[3], 1, 'ein Wort liegt in Fach 3');
  gleich(zahlen[5], 1, 'ein Wort liegt in Fach 5');
  gleich(zahlen.neu, l.woerter.length - 3, 'der Rest ist noch neu');
}

/* ============================================================
   TEST 10: Der Vokabeltest
   ============================================================ */
console.log('\n=== TEST: Wörter für den Vokabeltest ===');
{
  for (const l of LEKTIONEN) {
    const auswahl = testWoerterFn(l, 10);
    if (auswahl.length !== 10) { pruefe(false, l.id + ': 10 Wörter'); break; }
    const ids = auswahl.map(wortIdFn);
    if (new Set(ids).size !== 10) { pruefe(false, l.id + ': keine Dublette im Test'); break; }
  }
  pruefe(true, 'jede Lektion liefert 10 verschiedene Wörter für den Test');

  const l = LEKTIONEN[0];
  const idsDerLektion = l.woerter.map(wortIdFn);
  pruefe(testWoerterFn(l, 10).every((w) => idsDerLektion.indexOf(wortIdFn(w)) !== -1),
         'alle Testwörter stammen aus der Lektion');
}

console.log(fehler === 0 ? '\n🎉 ALLE TESTS BESTANDEN\n'
                         : '\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
process.exit(fehler === 0 ? 0 : 1);
