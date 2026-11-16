/* Test für den Kern: Formen, Namen, Gitter-Rechnen, Stufen und
   das Übungs-Register. Ganz ohne Browser. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const GETEILT = path.join(__dirname, '..', '..', 'shared') + path.sep;

let fehler = 0;
function pruefe(b, text) {
  if (b) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

const kontext = vm.createContext({ console: console, Math: Math, JSON: JSON, Object: Object,
                                   Array: Array, String: String, Number: Number, Set: Set });
vm.runInContext(fs.readFileSync(GETEILT + 'schule.js', 'utf8'), kontext, { filename: 'schule.js' });
for (const datei of ['formen.js', 'kern.js', 'gedaechtnis.js', 'muster.js', 'geometrie.js', 'memory.js', 'aufmerksamkeit.js']) {
  vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), kontext, { filename: datei });
}
const lauf = (code) => vm.runInContext(code, kontext);

/* ============================================================ */
console.log('\n=== TEST: Der Formen-Katalog ===');
{
  const ids = lauf('Object.keys(FORMEN)');
  pruefe(ids.length >= 17, 'es gibt ' + ids.length + ' Formen');
  let vollstaendig = true;
  for (const id of ids) {
    const ok = lauf(`(function (f) { return !!f.name && ['der','die','das'].indexOf(f.artikel) !== -1 && !!f.plural &&
                     f.drehordnung >= 1 && typeof f.chiral === 'boolean' && f.svg.indexOf('<') === 0; })(FORMEN.${id})`);
    if (!ok) { vollstaendig = false; console.log('     unvollständig: ' + id); }
  }
  pruefe(vollstaendig, 'jede Form hat Name, Artikel, Plural, Drehordnung, Chiralität und ein Bild');
  gleich(lauf('GRUNDFORMEN.length'), 12, 'zwölf Grundformen mit Eigenschaften');
  pruefe(lauf('DREHBARE_FORMEN.indexOf("quadrat") === -1 && DREHBARE_FORMEN.indexOf("pfeil") !== -1'),
         'drehbar sind nur Formen, bei denen man jede Drehung sieht');
  pruefe(lauf('["rechtwinkligesDreieck","lForm","flagge"].every(f => FORMEN[f].chiral && FORMEN[f].drehordnung === 1)'),
         'rechtwinkliges Dreieck, L-Form und Flagge sind chiral');
}

console.log('\n=== TEST: Farben ===');
{
  gleich(lauf('FARBEN.length'), 6, 'sechs Farben');
  pruefe(lauf('verwechselbar("rot", "gruen") && verwechselbar("gruen", "rot")'), 'rot und grün gelten als verwechselbar');
  pruefe(!lauf('verwechselbar("rot", "blau")'), 'rot und blau nicht');
  let gut = true;
  for (let i = 0; i < 300; i++) {
    const f = lauf('waehleFarben(' + (2 + (i % 3)) + ')');
    for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) {
      if (lauf(`verwechselbar("${f[a]}", "${f[b]}")`) || f[a] === f[b]) gut = false;
    }
  }
  pruefe(gut, 'waehleFarben liefert bis zu 4 Farben ohne verwechselbares Paar');
}

console.log('\n=== TEST: Bilder ===');
{
  const svg = lauf('formSvg("dreieck", { farbe: "rot", drehung: 90 })');
  pruefe(svg.indexOf('<svg') === 0, 'formSvg liefert ein SVG');
  pruefe(svg.indexOf('rotate(90') !== -1, 'mit Drehung steht rotate(90) darin');
  pruefe(lauf('formSvg("dreieck", { farbe: "rot" })').indexOf('rotate(') === -1, 'ohne Drehung kein rotate');
  pruefe(lauf('formSvg("lForm", { spiegeln: true })').indexOf('scale(-') !== -1, 'gespiegelt steht scale(- darin');
  pruefe(lauf('formSvg("lForm", {})').indexOf('scale(-') === -1, 'nicht gespiegelt kein scale(-');
  pruefe(svg.indexOf('aria-label="rotes Dreieck"') !== -1, 'das Bild hat einen vorlesbaren Namen');
  pruefe(svg.indexOf('#ff4d6d') !== -1, 'in der richtigen Farbe');
  const drei = lauf('figurSvg({ form: "stern", farbe: "blau", anzahl: 3 })');
  gleich((drei.match(/<g /g) || []).length, 3, 'drei Sterne werden dreimal gezeichnet');
  pruefe(lauf('figurSvg({ form: "kreis", farbe: "gelb", position: "r3" })').indexOf('<circle cx="83" cy="17"') !== -1,
         'bei einer Platz-Regel sieht man die möglichen Plätze');
  pruefe(lauf('gitterSvg([{x:0,y:0}], 3)').indexOf('<rect') !== -1, 'ein Gitter wird als Bild gezeichnet');
}

console.log('\n=== TEST: Namen richtig gebeugt ===');
{
  gleich(lauf('figurName({ form: "dreieck", farbe: "rot" })'), 'rotes Dreieck', 'rotes Dreieck');
  gleich(lauf('figurName({ form: "kreis", farbe: "rot" })'), 'roter Kreis', 'roter Kreis');
  gleich(lauf('figurName({ form: "raute", farbe: "gruen" })'), 'grüne Raute', 'grüne Raute');
  gleich(lauf('figurName({ form: "stern", farbe: "lila" }, { artikel: true })'), 'der lila Stern', 'der lila Stern (lila bleibt ungebeugt)');
  gleich(lauf('figurName({ form: "dreieck", farbe: "rot", groesse: "klein", anzahl: 2 })'), 'zwei kleine rote Dreiecke',
         'zwei kleine rote Dreiecke');
  gleich(lauf('figurName({ form: "quadrat", farbe: "orange", groesse: "gross" })'), 'großes orange Quadrat',
         'großes orange Quadrat');
  gleich(lauf('formMitArtikel("rechtwinkligesDreieck")'), 'das rechtwinklige Dreieck', 'das rechtwinklige Dreieck');
  gleich(lauf('formWort("rechtwinkligesDreieck", { plural: true })'), 'rechtwinklige Dreiecke', 'rechtwinklige Dreiecke');
  gleich(lauf('formMitEin("raute")'), 'eine Raute', 'eine Raute');
  gleich(lauf('beiForm("raute") + " / " + beiForm("rechteck")'), 'bei der Raute / beim Rechteck', 'bei der Raute, beim Rechteck');
}

console.log('\n=== TEST: Sehen zwei Figuren gleich aus? ===');
{
  pruefe(lauf('figurenGleich({form:"kreis", drehung:0}, {form:"kreis", drehung:270})'), 'ein Kreis sieht gedreht gleich aus');
  pruefe(lauf('figurenGleich({form:"dreieck", drehung:0}, {form:"dreieck", drehung:120})'), 'ein Dreieck nach 120° auch');
  pruefe(!lauf('figurenGleich({form:"dreieck", drehung:0}, {form:"dreieck", drehung:90})'), 'nach 90° nicht');
  pruefe(lauf('figurenGleich({form:"quadrat", drehung:0}, {form:"quadrat", drehung:90})'), 'ein Quadrat nach 90° schon');
  pruefe(!lauf('figurenGleich({form:"pfeil", drehung:0}, {form:"pfeil", drehung:180})'), 'ein Pfeil nach 180° nicht');
  pruefe(!lauf('figurenGleich({form:"lForm"}, {form:"lForm", spiegeln:true})'), 'eine gespiegelte L-Form ist anders');
  pruefe(lauf('figurenGleich({form:"trapez"}, {form:"trapez", spiegeln:true})'), 'ein gespiegeltes Trapez nicht (es ist symmetrisch)');
}

console.log('\n=== TEST: Rechnen im Gitter ===');
{
  const L = '[{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:2}]';
  const T = '[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:1,y:1}]';
  for (const achse of ['senkrecht', 'waagerecht', 'diagonal', 'gegendiagonal']) {
    pruefe(lauf(`zellenSchluessel(spiegleZellen(spiegleZellen(${L}, 4, 4, "${achse}"), 4, 4, "${achse}")) === zellenSchluessel(${L})`),
           'zweimal ' + achse + ' spiegeln ergibt das Original');
  }
  pruefe(lauf(`zellenSchluessel(dreheZellen(${L}, 4, 360)) === zellenSchluessel(${L})`), 'viermal drehen ergibt das Original');
  gleich(lauf(`zellenSchluessel(spiegleZellen([{x:0,y:0},{x:1,y:2}], 3, 3, "senkrecht"))`), '1,2;2,0', 'senkrecht gespiegelt (von Hand nachgerechnet)');
  gleich(lauf(`zellenSchluessel(spiegleZellen([{x:0,y:2}], 3, 3, "diagonal"))`), '2,0', 'an der Diagonale tauschen Zeile und Spalte');
  gleich(lauf(`zellenSchluessel(dreheZellen([{x:0,y:0}], 3, 90))`), '2,0', 'oben links wandert bei 90° nach oben rechts');
  pruefe(lauf(`istChiral(${L})`), 'ein L ist chiral');
  pruefe(!lauf(`istChiral(${T})`), 'ein T nicht');
  pruefe(lauf(`zusammenhaengend(${L})`), 'ein L hängt zusammen');
  pruefe(!lauf('zusammenhaengend([{x:0,y:0},{x:2,y:2}])'), 'zwei einzelne Felder nicht');
  gleich(lauf('zaehleTeile([{x:0,y:0},{x:2,y:2},{x:2,y:1}])'), 2, 'zwei Teile gezählt');
  let wachsenGut = true;
  for (let i = 0; i < 200; i++) {
    const f = lauf('wachseFigur(5, 4, 4)');
    if (!f || f.length !== 5 || !lauf('zusammenhaengend(' + JSON.stringify(f) + ')')) wachsenGut = false;
  }
  pruefe(wachsenGut, 'wachseFigur baut immer eine zusammenhängende Figur');
}

console.log('\n=== TEST: Die Stufe passt sich an ===');
{
  gleich(lauf('naechsteStufe(3, [true, true]).stufe'), 4, 'zwei Treffer: eine Stufe hoch');
  gleich(lauf('naechsteStufe(3, [false, false]).stufe'), 2, 'zwei Fehler: eine Stufe runter');
  gleich(lauf('naechsteStufe(3, [true, false]).stufe'), 3, 'Treffer und Fehler: bleibt');
  gleich(lauf('naechsteStufe(3, [true]).stufe'), 3, 'ein einzelner Treffer: bleibt');
  gleich(lauf('naechsteStufe(3, [true, true]).verlauf'), [], 'nach dem Wechsel fängt das Zählen neu an');
  gleich(lauf('naechsteStufe(8, [true, true]).stufe'), 8, 'höher als 8 geht es nicht');
  gleich(lauf('naechsteStufe(8, [true, true]).aenderung'), 0, 'und dann meldet es auch keinen Wechsel');
  gleich(lauf('naechsteStufe(1, [false, false]).stufe'), 1, 'tiefer als 1 geht es nicht');
  pruefe(lauf('naechsteStufe(1, [false, false]).amBoden'), 'zwei Fehler auf Stufe 1: ab jetzt Tipps vorab');
  pruefe(!lauf('naechsteStufe(2, [false, false]).amBoden'), 'von 2 auf 1 noch nicht');
  pruefe(lauf('stufenText(1, 4)').indexOf('Stufe 4') !== -1, 'der Text nennt die neue Stufe');
  gleich(lauf('stufenText(0, 4)'), '', 'ohne Wechsel kein Text');
  gleich(lauf('[3,4,5,6].map(startStufeFuerKlasse)'), [1, 2, 4, 5], 'Startstufe je Klasse');
}

console.log('\n=== TEST: Prüfen ===');
{
  gleich(lauf('pruefeAufgabe({art:"auswahl", richtig:"o2"}, "o2")'), 'richtig', 'Auswahl richtig');
  gleich(lauf('pruefeAufgabe({art:"auswahl", richtig:"o2"}, "o1")'), 'falsch', 'Auswahl falsch');
  gleich(lauf('pruefeAufgabe({art:"gitter", richtig:[{x:0,y:0},{x:1,y:1}]}, [{x:1,y:1},{x:0,y:0}])'), 'richtig',
         'Gitter: die Reihenfolge der Felder ist egal');
  gleich(lauf('pruefeAufgabe({art:"gitter", richtig:[{x:0,y:0}]}, [{x:0,y:0},{x:1,y:1}])'), 'falsch', 'Gitter: ein Feld zu viel');
  gleich(lauf('pruefeAufgabe({art:"folge", richtig:["a","b"]}, ["a","b"])'), 'richtig', 'Folge richtig');
  gleich(lauf('pruefeAufgabe({art:"folge", richtig:["a","b"]}, ["b","a"])'), 'falsch', 'Folge in falscher Reihenfolge');
  gleich(lauf('pruefeAufgabe({art:"paare", erfolgBis:6}, {fehlversuche:6, fertig:true})'), 'richtig', 'Memory: höchstens so viele Fehlversuche wie Paare');
  gleich(lauf('pruefeAufgabe({art:"paare", erfolgBis:6}, {fehlversuche:9, fertig:true})'), 'neutral', 'Memory: dazwischen neutral');
  gleich(lauf('pruefeAufgabe({art:"paare", erfolgBis:6}, {fehlversuche:13, fertig:true})'), 'falsch', 'Memory: mehr als doppelt so viele');
  gleich(lauf('pruefeAufgabe({art:"paare", erfolgBis:6}, {fehlversuche:0, fertig:false})'), 'falsch', 'Memory: nicht fertig geworden');
  gleich(lauf('pruefeAufgabe({art:"auswahl", richtig:"o1"}, null)'), 'falsch', 'keine Antwort ist falsch');
  gleich(lauf('pruefeAufgabe({art:"antippen", erlaubt:1}, {fehlgriffe:1, fertig:true})'), 'richtig', 'Antippen: erlaubte Fehlgriffe');
  gleich(lauf('pruefeAufgabe({art:"antippen", erlaubt:1}, {fehlgriffe:2, fertig:true})'), 'falsch', 'Antippen: zu viele Fehlgriffe');
  gleich(lauf('pruefeAufgabe({art:"antippen", erlaubt:1}, {fehlgriffe:0, fertig:false})'), 'falsch', 'Antippen: nicht fertig');
  gleich(lauf('pruefeAufgabe({art:"antippen", erlaubt:1}, {fertig:true})'), 'falsch', 'Antippen: ohne Zählung');
}

console.log('\n=== TEST: Rückblick-Satz ===');
{
  const sicherUndUeben = lauf(`reflexionsText([
    {ergebnis:'richtig', themen:['drehung']}, {ergebnis:'richtig', themen:['drehung']},
    {ergebnis:'falsch', themen:['farbe'], falschThemen:['farbe']}, {ergebnis:'falsch', themen:['farbe'], falschThemen:['farbe']}])`);
  gleich(sicherUndUeben, 'Bei Drehungen warst du schon sicher, bei Farbwechseln lohnt sich noch Üben.', 'sicher und üben');
  pruefe(lauf(`reflexionsText([{ergebnis:'richtig', themen:['ecken']}, {ergebnis:'richtig', themen:['ecken']}])`)
    .indexOf('richtig sicher') !== -1, 'nur sicher');
  pruefe(lauf(`reflexionsText([{ergebnis:'falsch', themen:['ecken']}, {ergebnis:'falsch', themen:['ecken']}])`)
    .indexOf('lohnt sich noch Üben') !== -1, 'nur üben');
  pruefe(lauf(`reflexionsText([{ergebnis:'richtig', themen:['a']}, {ergebnis:'richtig', themen:['b']}])`)
    .indexOf('Fast alles richtig') !== -1, 'ohne Themen: nach Anteil richtig');
  const teilweise = lauf(`reflexionsText([
    {ergebnis:'falsch', themen:['farbe','drehung'], falschThemen:['farbe']},
    {ergebnis:'falsch', themen:['farbe','drehung'], falschThemen:['farbe']}])`);
  gleich(teilweise, 'Bei Drehungen warst du schon sicher, bei Farbwechseln lohnt sich noch Üben.',
         'bei zwei Regeln zählt nur die, bei der der Fehler lag');
}

console.log('\n=== TEST: Das Übungs-Register ===');
{
  gleich(lauf('GRUPPEN.map(g => g.id)'), ['gedaechtnis', 'muster', 'formen', 'memory', 'aufmerksamkeit'], 'fünf Gruppen');
  gleich(lauf('alleUebungen().map(u => u.id)'), ['merkfolge', 'gitter', 'reihe', 'matrix', 'ausreisser', 'spiegeln', 'memory',
                                                 'suchbild', 'fehlerbild', 'zahlentabelle', 'linien', 'pfeilwort'],
         'zwölf Übungen');
  gleich(lauf('alleUebungen("aufmerksamkeit").length'), 5, 'fünf davon in Aufmerksamkeit');
  gleich(lauf('alleUebungen("gedaechtnis").length'), 2, 'zwei davon im Gedächtnis');
  let vollstaendig = true;
  for (const u of lauf('alleUebungen().map(u => u.id)')) {
    const ok = lauf(`(function (u) { return !!u.titel && !!u.symbol && !!u.beschreibung && !!u.lernziel &&
                     u.tipps.length >= 1 && u.stufen.length === STUFE_MAX && typeof u.macheAufgabe === 'function' &&
                     typeof u.beispiel === 'function' && u.beispiel().indexOf('<svg') !== -1 &&
                     Array.isArray(u.alter) && u.alter[0] >= ALTER_MIN && u.alter[1] <= ALTER_MAX && u.alter[0] < u.alter[1] &&
                     GRUPPEN.some(g => g.id === u.gruppe); })(findeUebung('${u}'))`);
    if (!ok) { vollstaendig = false; console.log('     unvollständig: ' + u); }
  }
  pruefe(vollstaendig, 'jede Übung hat Titel, Lernziel, Tipps, Alter, 8 Stufen, einen Aufgaben-Würfel und ein Beispielbild');

  // Für jedes Alter von 8 bis 12 gibt es genug zu üben
  for (let jahre = 8; jahre <= 12; jahre++) {
    const n = lauf(`alleUebungen().filter(u => passtZumAlter(u, ${jahre})).length`);
    pruefe(n >= 6, 'mit ' + jahre + ' Jahren passen ' + n + ' Übungen');
  }
  pruefe(lauf('GRUPPEN.every(g => alleUebungen(g.id).some(u => passtZumAlter(u, 8)) && alleUebungen(g.id).some(u => passtZumAlter(u, 12)))'),
         'jede Gruppe hat etwas für 8- und für 12-Jährige');
  gleich(lauf('alterText(findeUebung("pfeilwort"))'), '10–12 Jahre', 'das Alter wird lesbar geschrieben');
  gleich(lauf('passtZumAlter(findeUebung("pfeilwort"), 9)'), false, 'Pfeil oder Wort ist für 9-Jährige noch nicht gedacht');
  gleich(lauf('passtZumAlter(findeUebung("pfeilwort"), null)'), true, 'ohne Alter passt alles');
  gleich(lauf('[8, 9, 10, 11, 12].map(klasseFuerAlter)'), [3, 4, 5, 6, 6], 'Alter → Klasse');
  gleich(lauf('klasseFuerAlter(null)'), null, 'ohne Alter keine Klasse');
  const tabelle = lauf('findeUebung("zahlentabelle").stufen.map(s => s.n)');
  pruefe(tabelle[0] < tabelle[tabelle.length - 1], 'Zahlentabelle: die Tabellen werden größer');
  const linien = lauf('findeUebung("linien").stufen.map(s => s.kreuzungen)');
  pruefe(linien.every((v, i) => i === 0 || v >= linien[i - 1]), 'Linien: mehr Kreuzungen je Stufe');

  // Die Stufen werden schwerer
  const merk = lauf('findeUebung("merkfolge").stufen.map(s => s.laenge)');
  pruefe(merk.every((v, i) => i === 0 || v >= merk[i - 1]), 'Merkfolge: die Reihen werden länger');
  const gitter = lauf('findeUebung("gitter").stufen.map(s => s.n * 10 + s.zellen)');
  pruefe(gitter.every((v, i) => i === 0 || v >= gitter[i - 1]), 'Gitter: Gitter und Felderzahl wachsen');
  const paare = lauf('findeUebung("memory").stufen.map(s => s.paare)');
  pruefe(paare.every((v, i) => i === 0 || v >= paare[i - 1]), 'Memory: mehr Paare je Stufe');
  gleich(lauf('parameterFuer("gitter", 99).n'), 5, 'zu hohe Stufen werden auf 8 begrenzt');
  gleich(lauf('parameterFuer("gitter", 0).n'), 3, 'zu tiefe auf 1');
}

console.log('\n=== TEST: Eigenschaften passen zum Katalog ===');
{
  let stimmig = true;
  for (const id of lauf('Object.keys(EIGENSCHAFTEN)')) {
    const ok = lauf(`(function (e) {
      const w = e.gruppe.map(e.wert);
      return w.every(x => x === w[0]) && e.fremdling.every(f => e.wert(f) !== w[0]);
    })(EIGENSCHAFTEN.${id})`);
    if (!ok) { stimmig = false; console.log('     passt nicht: ' + id); }
  }
  pruefe(stimmig, 'alle Gruppen-Formen teilen die Eigenschaft, kein Fremdling hat sie');
  const texte = lauf('EIGENSCHAFTS_AUSSAGEN.leicht.concat(EIGENSCHAFTS_AUSSAGEN.schwer).map(a => a.text)');
  gleich(new Set(texte).size, texte.length, 'jede Memory-Aussage gibt es nur einmal');
  pruefe(lauf('EIGENSCHAFTS_AUSSAGEN.leicht.concat(EIGENSCHAFTS_AUSSAGEN.schwer).every(a => GRUNDFORMEN.some(a.passt))'),
         'jede Memory-Aussage passt auf mindestens eine Grundform');
}

console.log('\n=== TEST: Memory — was beim Danebengreifen gesagt wird ===');
{
  const form = (f) => `{ typ: 'form', name: formMitArtikel('${f}') }`;
  gleich(lauf(`memoryFehlgriffText(${form('trapez')}, ${form('raute')})`), 'Das ist das Trapez, das ist die Raute.', 'zwei Formen');
  gleich(lauf(`memoryFehlgriffText({ typ: 'name', name: 'die Raute' }, ${form('trapez')})`), 'Das ist das Trapez, nicht die Raute.',
         'Form und falscher Name');
  gleich(lauf(`memoryFehlgriffText({ typ: 'de', text: 'der Hund', partner: 'dog' }, { typ: 'en', text: 'cat', partner: 'die Katze' })`),
         'cat heißt die Katze, nicht der Hund.', 'englisch und falsches deutsches Wort');
  gleich(lauf(`memoryFehlgriffText({ typ: 'name', name: 'a' }, { typ: 'name', name: 'b' })`),
         'Zwei Namen – zu jedem Namen gehört ein Bild.', 'zwei Namen');
  pruefe(lauf(`memoryFehlgriffText(${form('kreis')}, { typ: 'aussage', text: '3 Ecken' })`).indexOf('passt nicht dazu') !== -1,
         'Form und falsche Eigenschaft');
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
