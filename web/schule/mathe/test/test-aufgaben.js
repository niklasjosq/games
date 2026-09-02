/* Test für die Mathe-Aufgaben.
   Wichtigster Punkt: Jede Aufgabe muss lösbar sein und die eigene
   Antwort muss als richtig durchgehen — sonst ärgern sich die Kinder. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;

let fehler = 0;
function pruefe(bedingung, text) {
  if (bedingung) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

/* ---------------- Die Aufgaben-Dateien laden ---------------- */
const umgebung = { console: console, Math: Math, JSON: JSON, Object: Object, Number: Number, String: String };
umgebung.window = umgebung;
const K = vm.createContext(umgebung);
for (const datei of ['aufgaben.js', 'aufgaben-klasse3.js', 'aufgaben-klasse5.js']) {
  vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), K, { filename: datei });
}
const lauf = (code) => vm.runInContext(code, K);

/* ============================================================
   TEST 1: Zahlen einlesen (deutsche Schreibweise)
   ============================================================ */
console.log('\n=== TEST: Zahlen einlesen ===');
gleich(lauf('zahlAusText("42")'), 42, '"42" wird gelesen');
gleich(lauf('zahlAusText("3,5")'), 3.5, 'Komma ist das Dezimalzeichen');
gleich(lauf('zahlAusText("1.234")'), 1234, 'Punkt ist der Tausenderpunkt');
gleich(lauf('zahlAusText("1.234,5")'), 1234.5, 'Tausenderpunkt und Komma zusammen');
gleich(lauf('zahlAusText(" 7 ")'), 7, 'Leerzeichen stören nicht');
gleich(lauf('zahlAusText("-5")'), -5, 'negative Zahlen gehen auch');
gleich(lauf('zahlAusText("")'), null, 'leere Eingabe ist keine Zahl');
gleich(lauf('zahlAusText("hallo")'), null, 'Buchstaben sind keine Zahl');
gleich(lauf('zahlAusText("3,5,2")'), null, 'Unsinn wird abgelehnt');

/* ============================================================
   TEST 2: Antworten prüfen
   ============================================================ */
console.log('\n=== TEST: Antworten prüfen ===');
{
  const zahl = '{frage: "1+1", antwort: "2", eingabe: "zahl"}';
  pruefe(lauf(`pruefeAntwort(${zahl}, "2")`), 'richtige Zahl gilt');
  pruefe(!lauf(`pruefeAntwort(${zahl}, "3")`), 'falsche Zahl gilt nicht');
  pruefe(!lauf(`pruefeAntwort(${zahl}, "")`), 'leere Antwort gilt nicht');

  const komma = '{antwort: "2,5", eingabe: "zahl"}';
  pruefe(lauf(`pruefeAntwort(${komma}, "2,5")`), '2,5 mit Komma gilt');
  pruefe(lauf(`pruefeAntwort(${komma}, "2.5")`), '2.5 mit Punkt gilt auch');
  pruefe(lauf(`pruefeAntwort(${komma}, "2,50")`), '2,50 gilt auch (gleiche Zahl)');

  const text = '{antwort: "cm", eingabe: "text"}';
  pruefe(lauf(`pruefeAntwort(${text}, "cm")`), 'Text gilt');
  pruefe(lauf(`pruefeAntwort(${text}, " CM ")`), 'Groß/klein und Leerzeichen sind egal');
  pruefe(!lauf(`pruefeAntwort(${text}, "m")`), 'falscher Text gilt nicht');

  const rest = '{antwort: "9 R 2", eingabe: "rest"}';
  pruefe(lauf(`pruefeAntwort(${rest}, "9 R 2")`), 'Teilen mit Rest gilt');
  pruefe(lauf(`pruefeAntwort(${rest}, "9R2")`), 'auch ohne Leerzeichen');
  pruefe(!lauf(`pruefeAntwort(${rest}, "9 R 3")`), 'falscher Rest gilt nicht');
  pruefe(!lauf(`pruefeAntwort(${rest}, "8 R 2")`), 'falsches Ergebnis gilt nicht');

  const bruch = '{antwort: "3/4", eingabe: "bruch"}';
  pruefe(lauf(`pruefeAntwort(${bruch}, "3/4")`), 'Bruch gilt');
  pruefe(lauf(`pruefeAntwort(${bruch}, "6/8")`), 'gleichwertiger Bruch gilt (ohne Kürz-Pflicht)');
  pruefe(!lauf(`pruefeAntwort(${bruch}, "4/3")`), 'umgedrehter Bruch gilt nicht');
  pruefe(!lauf(`pruefeAntwort(${bruch}, "1/0")`), 'Nenner 0 wird abgelehnt');
  pruefe(!lauf(`pruefeAntwort(${bruch}, "drei viertel")`), 'ausgeschrieben gilt nicht');

  const gekuerzt = '{antwort: "3/4", eingabe: "bruch", gekuerzt: true}';
  pruefe(lauf(`pruefeAntwort(${gekuerzt}, "3/4")`), 'gekürzter Bruch gilt');
  pruefe(!lauf(`pruefeAntwort(${gekuerzt}, "6/8")`),
         'bei "Kürze den Bruch" gilt 6/8 nicht mehr');

  const uhr = '{antwort: "17:30", eingabe: "uhrzeit"}';
  pruefe(lauf(`pruefeAntwort(${uhr}, "17:30")`), 'Uhrzeit mit Doppelpunkt gilt');
  pruefe(lauf(`pruefeAntwort(${uhr}, "17.30")`), 'mit Punkt gilt auch');
  pruefe(lauf(`pruefeAntwort(${uhr}, "17,30")`), 'mit Komma gilt auch');
  pruefe(lauf(`pruefeAntwort(${uhr}, "1730")`), 'ohne Trennzeichen gilt auch');
  pruefe(lauf(`pruefeAntwort(${uhr}, "17:30 Uhr")`), '"Uhr" dahinter stört nicht');
  pruefe(!lauf(`pruefeAntwort(${uhr}, "17:31")`), 'falsche Minute gilt nicht');
  const uhrFrueh = '{antwort: "9:05", eingabe: "uhrzeit"}';
  pruefe(lauf(`pruefeAntwort(${uhrFrueh}, "9:5")`), '9:5 wird als 9:05 verstanden');
  pruefe(!lauf(`pruefeAntwort(${uhr}, "25:30")`), 'Stunde 25 gibt es nicht');
  pruefe(!lauf(`pruefeAntwort(${uhr}, "quatsch")`), 'Unsinn gilt nicht');
}

/* ============================================================
   TEST 3: Noten
   ============================================================ */
console.log('\n=== TEST: Noten bei 10 Aufgaben ===');
gleich(lauf('berechneNote(10, 10)'), 1, '10 von 10 ist eine 1');
gleich(lauf('berechneNote(9, 10)'), 1, '9 von 10 ist eine 1');
gleich(lauf('berechneNote(8, 10)'), 2, '8 von 10 ist eine 2');
gleich(lauf('berechneNote(7, 10)'), 3, '7 von 10 ist eine 3');
gleich(lauf('berechneNote(6, 10)'), 3, '6 von 10 ist eine 3');
gleich(lauf('berechneNote(5, 10)'), 4, '5 von 10 ist eine 4');
gleich(lauf('berechneNote(4, 10)'), 5, '4 von 10 ist eine 5');
gleich(lauf('berechneNote(3, 10)'), 5, '3 von 10 ist eine 5');
gleich(lauf('berechneNote(2, 10)'), 6, '2 von 10 ist eine 6');
gleich(lauf('berechneNote(0, 10)'), 6, '0 von 10 ist eine 6');
gleich(lauf('berechneNote(0, 0)'), 6, 'ohne Aufgaben gibt es eine 6');
gleich(lauf('noteName(1)'), 'sehr gut', 'Note 1 heißt "sehr gut"');
gleich(lauf('noteName(6)'), 'ungenügend', 'Note 6 heißt "ungenügend"');

/* ============================================================
   TEST 4: Der Lektions-Katalog
   ============================================================ */
console.log('\n=== TEST: Lektionen ===');
gleich(lauf('alleLektionen("klasse3").length'), 5, 'die 3. Klasse hat 5 Lektionen');
gleich(lauf('alleLektionen("klasse5").length'), 6, 'die 5. Klasse hat 6 Lektionen');
gleich(lauf('findeLektion("klasse3", "einmaleins").titel'), 'Das kleine Einmaleins',
       'eine Lektion lässt sich finden');
gleich(lauf('findeLektion("klasse3", "gibtsnicht")'), null, 'unbekannte Lektion gibt null');
pruefe(lauf('alleLektionen("klasse3").every(l => l.titel && l.symbol && l.beschreibung)'),
       'jede Lektion hat Titel, Symbol und Beschreibung');
pruefe(lauf('alleLektionen("klasse3").concat(alleLektionen("klasse5"))' +
            '.every(l => l.testAnzahl >= 5 && l.testZeitSek >= 120)'),
       'jeder Test hat genug Aufgaben und genug Zeit');

/* ============================================================
   TEST 5: DER WICHTIGSTE TEST
   Jede Aufgabensorte 500-mal würfeln und nachrechnen.
   ============================================================ */
console.log('\n=== TEST: 500 Aufgaben je Lektion durchrechnen ===');
{
  const probleme = lauf('testeAufgaben(500)');
  if (probleme.length === 0) {
    pruefe(true, 'alle Aufgaben sind lösbar und ihre Antworten gelten als richtig');
  } else {
    for (const p of probleme.slice(0, 12)) { console.log('  ❌ ' + p); fehler++; }
    if (probleme.length > 12) console.log('  … und ' + (probleme.length - 12) + ' weitere');
  }
}

/* ============================================================
   TEST 6: Aufgaben sind kindgerecht
   Keine negativen Ergebnisse, keine ewig langen Kommazahlen,
   keine Frage ohne Fragezeichen-Sinn.
   ============================================================ */
console.log('\n=== TEST: Aufgaben sind kindgerecht ===');
{
  const meckern = lauf(`(function () {
    const probleme = [];
    for (const klasse of Object.keys(MATHE)) {
      for (const l of alleLektionen(klasse)) {
        for (let i = 0; i < 400; i++) {
          const a = l.macheAufgabe();
          const wo = klasse + '/' + l.id;

          if (String(a.frage).indexOf('undefined') !== -1 ||
              String(a.antwort).indexOf('undefined') !== -1) {
            probleme.push(wo + ': "undefined" in der Aufgabe — ' + a.frage);
            break;
          }
          if (String(a.frage).indexOf('NaN') !== -1 ||
              String(a.antwort).indexOf('NaN') !== -1 ||
              (a.hilfe && String(a.hilfe).indexOf('NaN') !== -1)) {
            probleme.push(wo + ': "NaN" in der Aufgabe — ' + a.frage + ' / ' + a.hilfe);
            break;
          }

          if ((a.eingabe || 'zahl') === 'zahl') {
            const wert = zahlAusText(a.antwort);
            if (wert !== null && wert < 0) {
              probleme.push(wo + ': negatives Ergebnis (' + a.antwort + ') bei ' + a.frage);
              break;
            }
            const komma = String(a.antwort).split(',')[1];
            if (komma && komma.length > 2) {
              probleme.push(wo + ': zu viele Stellen hinter dem Komma (' + a.antwort + ')');
              break;
            }
          }

          if (!a.hilfe) { probleme.push(wo + ': kein Tipp bei "' + a.frage + '"'); break; }
        }
      }
    }
    return probleme;
  })()`);

  if (meckern.length === 0) {
    pruefe(true, 'keine negativen Ergebnisse, keine NaN, überall ein Tipp dabei');
  } else {
    for (const p of meckern.slice(0, 12)) { console.log('  ❌ ' + p); fehler++; }
    if (meckern.length > 12) console.log('  … und ' + (meckern.length - 12) + ' weitere');
  }
}

/* ============================================================
   TEST 7: Die Aufgaben wiederholen sich nicht ständig
   ============================================================ */
console.log('\n=== TEST: Abwechslung ===');
{
  const wenigAbwechslung = lauf(`(function () {
    const schlimm = [];
    for (const klasse of Object.keys(MATHE)) {
      for (const l of alleLektionen(klasse)) {
        const gesehen = new Set();
        for (let i = 0; i < 200; i++) gesehen.add(l.macheAufgabe().frage);
        if (gesehen.size < 100) {
          schlimm.push(klasse + '/' + l.id + ': nur ' + gesehen.size +
                       ' verschiedene Aufgaben in 200 Versuchen');
        }
      }
    }
    return schlimm;
  })()`);

  if (wenigAbwechslung.length === 0) {
    pruefe(true, 'jede Lektion würfelt genug verschiedene Aufgaben');
  } else {
    for (const p of wenigAbwechslung) { console.log('  ❌ ' + p); fehler++; }
  }
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
