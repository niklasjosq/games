/* Test für die Aufgaben: Jede Übung würfelt auf jeder Stufe hunderte
   Aufgaben, und wir rechnen jede einzelne nach. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const WEB = path.join(__dirname, '..', '..') + path.sep;

const PRO_STUFE = 300;

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
for (const datei of ['shared/schule.js', 'schule/englisch/vokabeln.js', 'schule/englisch/vokabeln-klasse5.js']) {
  vm.runInContext(fs.readFileSync(WEB + datei, 'utf8'), kontext, { filename: datei });
}
for (const datei of ['formen.js', 'kern.js', 'gedaechtnis.js', 'muster.js', 'geometrie.js', 'memory.js', 'aufmerksamkeit.js']) {
  vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), kontext, { filename: datei });
}
const lauf = (code) => vm.runInContext(code, kontext);
// Die Helfer der Seite direkt in node benutzen
const K = new Proxy({}, { get: (_, name) => lauf(name) });

/* Würfelt Aufgaben und sammelt Probleme — höchstens 5 Beispiele je Prüfung */
function jedeAufgabe(uebungId, pruefung) {
  const probleme = {};
  let anzahl = 0;
  const schluessel = new Set();
  for (let stufe = 1; stufe <= 8; stufe++) {
    for (let i = 0; i < PRO_STUFE; i++) {
      let a;
      try {
        a = K.findeUebung(uebungId).macheAufgabe(stufe, {});
      } catch (e) {
        (probleme['Absturz'] = probleme['Absturz'] || []).push('Stufe ' + stufe + ': ' + e.message);
        continue;
      }
      anzahl += 1;
      schluessel.add(JSON.stringify([a.richtig, a.frage, a.anzeige && a.anzeige.bilder, a.anzeige && a.anzeige.folge,
                                     a.anzeige && a.anzeige.zeigeZuerst, a.anzeige && a.anzeige.vorgabe,
                                     a.paare && a.paare.map((p) => p.paarId), a.optionen && a.optionen.map((o) => o.schluessel),
                                     a.anzeige && (a.anzeige.inhalte || a.anzeige.bild ||
                                                   (a.anzeige.felder && a.anzeige.felder.map((f) => f.id)))]));
      for (const p of K.pruefeAufgabeFormal(a)) (probleme['Grundprüfung'] = probleme['Grundprüfung'] || []).push(p);
      pruefung(a, stufe, function (name, ok, beispiel) {
        if (!ok) (probleme[name] = probleme[name] || []).push('Stufe ' + stufe + ': ' + (beispiel || ''));
      });
    }
  }
  return { probleme: probleme, anzahl: anzahl, verschiedene: schluessel.size };
}

function melde(titel, ergebnis, pruefungen) {
  console.log('\n=== TEST: ' + titel + ' (' + ergebnis.anzahl + ' Aufgaben) ===');
  pruefe(!ergebnis.probleme['Absturz'], 'keine Aufgabe stürzt ab' +
         (ergebnis.probleme['Absturz'] ? ' — ' + ergebnis.probleme['Absturz'].slice(0, 3).join(' | ') : ''));
  pruefe(!ergebnis.probleme['Grundprüfung'], 'Frage, Erklärung und Lösung stimmen' +
         (ergebnis.probleme['Grundprüfung'] ? ' — ' + ergebnis.probleme['Grundprüfung'].slice(0, 3).join(' | ') : ''));
  for (const name of pruefungen) {
    const p = ergebnis.probleme[name];
    pruefe(!p, name + (p ? ' — ' + p.length + '×, z. B. ' + p.slice(0, 2).join(' | ') : ''));
  }
  pruefe(ergebnis.verschiedene >= Math.min(ergebnis.anzahl, 8 * 100),
         'die Aufgaben sind abwechslungsreich (' + ergebnis.verschiedene + ' verschiedene)');
}

const zs = (z) => K.zellenSchluessel(z);
const imGitter = (z, b, h) => z.every((c) => c.x >= 0 && c.y >= 0 && c.x < b && c.y < h);

/* ============================================================
   MERKFOLGE
   ============================================================ */
{
  const P = ['Länge wie in der Tabelle', 'alle Figuren stehen auf dem Tastenfeld', 'nie zweimal dieselbe Figur direkt hintereinander',
             'ohne Wiederholung keine Figur doppelt', 'rückwärts ist die Lösung umgedreht', 'Tastenfeld hat Formen × Farben',
             'kein verwechselbares Farbpaar', 'Rückwärts erst ab Stufe 5'];
  const e = jedeAufgabe('merkfolge', function (a, stufe, ok) {
    const p = K.parameterFuer('merkfolge', stufe);
    const z = a.anzeige;
    const ids = z.tasten.map((t) => t.id);
    ok(P[0], z.folge.length === p.laenge, z.folge.length);
    ok(P[1], z.folge.every((id) => ids.indexOf(id) !== -1));
    ok(P[2], z.folge.every((id, i) => i === 0 || id !== z.folge[i - 1]));
    ok(P[3], p.wiederholung || new Set(z.folge).size === z.folge.length);
    ok(P[4], JSON.stringify(a.richtig) === JSON.stringify(z.rueckwaerts ? z.folge.slice().reverse() : z.folge));
    ok(P[5], z.tasten.length === p.formen * p.farben && new Set(ids).size === ids.length);
    const farben = [...new Set(z.tasten.map((t) => t.figur.farbe))];
    ok(P[6], farben.every((f, i) => farben.every((g, j) => j <= i || !K.verwechselbar(f, g))), farben.join(','));
    ok(P[7], !z.rueckwaerts || stufe >= 5);
  });
  melde('Merkfolge', e, P);
}

/* ============================================================
   GITTER MERKEN
   ============================================================ */
{
  const P = ['Gittergröße und Felderzahl wie in der Tabelle', 'alle Felder im Gitter und keins doppelt',
             'bis Stufe 4 eine zusammenhängende Figur', 'Stufe 5 und 6 höchstens zwei Teile', 'Merkzeit wie in der Tabelle'];
  const e = jedeAufgabe('gitter', function (a, stufe, ok) {
    const p = K.parameterFuer('gitter', stufe);
    const z = a.richtig;
    ok(P[0], a.anzeige.breite === p.n && z.length === p.zellen && a.anzeige.ziel === p.zellen);
    ok(P[1], imGitter(z, p.n, p.n) && new Set(z.map((c) => c.x + ',' + c.y)).size === z.length);
    ok(P[2], p.form !== 'zusammen' || K.zusammenhaengend(z), JSON.stringify(z));
    ok(P[3], p.form !== 'zwei' || K.zaehleTeile(z) <= 2);
    ok(P[4], a.anzeige.merkzeit === p.zeigeMs);
  });
  melde('Gitter merken', e, P);
}

/* ============================================================
   REIHE FORTSETZEN
   ============================================================ */
{
  const P = ['die Lösung folgt aus den Regeln', 'genau vier Möglichkeiten', 'kein Ablenker erfüllt die Regeln',
             'Regeln passen zusammen', 'gedreht werden nur drehbare Formen', 'zwei Farben im Wechsel nie verwechselbar',
             'die gezeigten Figuren folgen den Regeln', 'Anzahl der Regeln wie in der Tabelle', 'neue Regeln erst ab ihrer Stufe'];
  const e = jedeAufgabe('reihe', function (a, stufe, ok) {
    const n = a.figuren.length;
    const soll = K.figurAnPosition(a.basis, a.regeln, n);
    const richtig = a.optionen.filter((o) => o.id === a.richtig)[0];
    ok(P[0], K.figurenGleich(soll, richtig.figur));
    ok(P[1], a.optionen.length === 4, a.optionen.length);
    ok(P[2], a.optionen.every((o) => o.id === a.richtig || !K.figurenGleich(o.figur, soll)));
    ok(P[3], K.regelnGueltig(a.regeln, stufe, n), JSON.stringify(a.regeln.map((r) => r.art + ':' + r.attribut)));
    const dreht = a.regeln.some((r) => r.attribut === 'drehung');
    const formen = [a.basis.form].concat(a.regeln.filter((r) => r.attribut === 'form').flatMap((r) => r.werte));
    ok(P[4], !dreht || formen.every((f) => K.FORMEN[f].drehordnung === 1), formen.join(','));
    const farbRegel = a.regeln.filter((r) => r.attribut === 'farbe' && new Set(r.werte).size === 2)[0];
    ok(P[5], !farbRegel || !K.verwechselbar(farbRegel.werte[0], farbRegel.werte[1]));
    ok(P[6], a.figuren.every((f, i) => K.figurenGleich(f, K.figurAnPosition(a.basis, a.regeln, i))));
    ok(P[7], a.regeln.length === K.REIHE_STUFEN[stufe - 1].regeln);
    ok(P[8], a.regeln.every((r) => K.REGELKATALOG.some((v) => v.art === r.art && v.attribut === r.attribut &&
                                                          (v.variante || null) === r.variante && v.ab <= stufe)));
  });
  melde('Reihe fortsetzen', e, P);
}

/* ============================================================
   MATRIX 3×3
   ============================================================ */
{
  const P = ['die Lösung ist die Figur im leeren Feld', 'genau vier Möglichkeiten', 'kein Ablenker gleicht der Lösung',
             'das leere Feld fehlt in der Anzeige', 'jede Zeile und Spalte folgt einer Regel', 'bis Stufe 3 fehlt das Feld unten rechts'];
  const e = jedeAufgabe('matrix', function (a, stufe, ok) {
    const richtig = a.optionen.filter((o) => o.id === a.richtig)[0];
    const gap = a.luecke.r * 3 + a.luecke.c;
    ok(P[0], K.figurenGleich(richtig.figur, a.alle[gap]));
    ok(P[1], a.optionen.length === 4);
    ok(P[2], a.optionen.every((o) => o.id === a.richtig || !K.figurenGleich(o.figur, a.antwort)));
    ok(P[3], a.anzeige.bilder[gap] === null && a.anzeige.bilder.filter((b) => b === null).length === 1);
    // Jede sich ändernde Eigenschaft ist in jeder Zeile oder in jeder Spalte „geordnet“:
    // gleich, jeder Wert einmal, oder gleichmäßiger Schritt
    let geordnet = true;
    for (const attr of a.themen) {
      const wert = (r, c) => a.alle[r * 3 + c][attr];
      const linieOk = (werte) => new Set(werte).size === 1 || new Set(werte).size === 3;
      const zeilen = [0, 1, 2].every((r) => linieOk([0, 1, 2].map((c) => wert(r, c))));
      const spalten = [0, 1, 2].every((c) => linieOk([0, 1, 2].map((r) => wert(r, c))));
      if (!zeilen || !spalten) geordnet = false;
    }
    ok(P[4], geordnet, a.typ);
    ok(P[5], stufe > 3 || gap === 8);
  });
  melde('Matrix 3×3', e, P);
}

/* ============================================================
   WAS PASST NICHT?
   ============================================================ */
{
  const P = ['genau eine Figur ist in der Eigenschaft anders', 'ab Stufe 4 sind die vier anderen verschiedene Formen',
             'Farbe und Größe verraten nichts', 'ohne genannte Eigenschaft gibt es nur eine Lösung',
             'die richtige Figur ist der Fremdling', 'bis Stufe 3 stehen die Namen darunter'];
  const e = jedeAufgabe('ausreisser', function (a, stufe, ok) {
    const formen = a.figuren.map((f) => f.form);
    const eig = a.eigenschaft;
    ok(P[4], a.richtig === 'o' + a.fremdIndex);
    if (K.EIGENSCHAFTEN[eig]) {
      ok(P[0], lauf('einzigeMitWert(' + JSON.stringify(formen) + ', ' + a.fremdIndex + ', "' + eig + '")'), formen.join(','));
    } else {
      const attr = { farbe: 'farbe', form: 'form', groesse: 'groesse', drehung: 'drehung' }[eig];
      const werte = a.figuren.map((f) => K.normalisiereFigur(f)[attr]);
      const fremd = werte[a.fremdIndex];
      ok(P[0], werte.filter((w) => w === fremd).length === 1 && new Set(werte).size === 2, werte.join(','));
    }
    if (stufe >= 4) ok(P[1], new Set(formen.filter((f, i) => i !== a.fremdIndex)).size === 4, formen.join(','));
    for (const attr of ['farbe', 'groesse']) {
      if (attr === eig) continue;
      const werte = a.figuren.map((f) => f[attr] || 'mittel');
      const einzeln = [...new Set(werte)].some((w) => werte.filter((x) => x === w).length === 1);
      ok(P[2], !einzeln, attr + ': ' + werte.join(','));
    }
    if (stufe === 8) {
      const k = lauf('ausreisserKandidaten(' + JSON.stringify(formen) + ')');
      ok(P[3], k.length === 1 && k[0] === a.fremdIndex, formen.join(','));
    }
    ok(P[5], stufe > 3 || a.optionen.every((o) => !!o.text));
  });
  melde('Was passt nicht?', e, P);
}

/* ============================================================
   SPIEGELN UND DREHEN
   ============================================================ */
{
  const P = ['die Lösung ist Vorlage plus Spiegelbild', 'die Vorlage liegt auf einer Seite der Achse', 'alle Felder im Gitter',
             'es gibt etwas zu tippen', 'Dreh-Figuren sind chiral', 'die richtige Kopie ist eine Drehung des Originals',
             'kein Ablenker ist eine Drehung des Originals', 'Möglichkeiten sehen verschieden aus', 'Diagonale erst ab Stufe 6'];
  const e = jedeAufgabe('spiegeln', function (a, stufe, ok) {
    if (a.art === 'gitter') {
      const z = a.anzeige;
      const bild = K.spiegleZellen(z.vorgabe, z.breite, z.hoehe, z.achse);
      ok(P[0], zs(a.richtig) === zs(z.vorgabe.concat(bild)));
      const seite = (c) => {
        if (z.achse === 'senkrecht') return c.x < z.breite / 2 ? -1 : 1;
        if (z.achse === 'waagerecht') return c.y < z.hoehe / 2 ? -1 : 1;
        const d = z.achse === 'diagonal' ? c.y - c.x : c.x + c.y - (z.breite - 1);
        return d === 0 ? 0 : (d > 0 ? 1 : -1);
      };
      const seiten = new Set(z.vorgabe.map(seite).filter((s) => s !== 0));
      ok(P[1], seiten.size === 1, z.achse + ' ' + JSON.stringify(z.vorgabe));
      ok(P[2], imGitter(a.richtig, z.breite, z.hoehe));
      ok(P[3], z.ziel >= 1 && z.ziel === a.richtig.length - z.vorgabe.length);
      ok(P[8], stufe >= 6 || (z.achse === 'senkrecht' || z.achse === 'waagerecht'));
    } else if (a.figur && a.optionen.length === 4) {
      // Drehen mit Gitterfigur
      ok(P[4], K.istChiral(a.figur));
      const drehungen = K.drehSchluessel(a.figur);
      const richtig = a.optionen.filter((o) => o.id === a.richtig)[0];
      ok(P[5], drehungen.indexOf(K.formSchluessel(richtig.figur)) !== -1);
      ok(P[6], a.optionen.every((o) => o.id === a.richtig || drehungen.indexOf(K.formSchluessel(o.figur)) === -1));
      ok(P[7], new Set(a.optionen.map((o) => o.schluessel)).size === 4);
    } else if (a.figur) {
      // Gespiegelt oder gedreht?
      ok(P[4], K.istChiral(a.figur));
      const istDrehung = K.drehSchluessel(a.figur).indexOf(K.formSchluessel(a.kopie)) !== -1;
      ok(P[5], (a.richtig === 'gedreht') === istDrehung);
    } else {
      // Drehen mit Katalogform
      const richtig = a.optionen.filter((o) => o.id === a.richtig)[0];
      ok(P[4], K.FORMEN[richtig.figur.form].chiral);
      ok(P[5], !richtig.figur.spiegeln);
      ok(P[6], a.optionen.every((o) => o.id === a.richtig || o.figur.spiegeln || o.figur.form !== richtig.figur.form));
      ok(P[7], new Set(a.optionen.map((o) => o.schluessel)).size === a.optionen.length);
    }
  });
  melde('Spiegeln und Drehen', e, P);
}

/* ============================================================
   LERN-MEMORY
   ============================================================ */
{
  const P = ['Anzahl der Paare wie in der Tabelle', 'jedes Paar liegt genau zweimal', 'keine Karte doppelt beschriftet',
             'jede Aussage passt auf genau eine Form des Felds', 'englische und deutsche Wörter sind eindeutig',
             'nie Dreieck und rechtwinkliges Dreieck zusammen', 'Spalten passen zur Kartenzahl', 'englische Paare ab Stufe 5 kommen aus den Vokabeln'];
  const e = jedeAufgabe('memory', function (a, stufe, ok) {
    const p = K.MEMORY_STUFEN[stufe - 1];
    const karten = a.anzeige.karten;
    ok(P[0], a.paare.length === p.paare && karten.length === 2 * p.paare);
    const zaehler = {};
    for (const k of karten) zaehler[k.paarId] = (zaehler[k.paarId] || 0) + 1;
    ok(P[1], Object.values(zaehler).every((n) => n === 2));
    const inhalte = karten.map((k) => k.text || k.svg);
    ok(P[2], new Set(inhalte).size === inhalte.length);
    const formen = a.paare.filter((q) => q.form).map((q) => q.form);
    const alle = lauf('EIGENSCHAFTS_AUSSAGEN.leicht.concat(EIGENSCHAFTS_AUSSAGEN.schwer)');
    for (const q of a.paare.filter((x) => x.sorte === 'eigenschaft')) {
      const aussage = alle.filter((x) => x.text === q.aussage)[0];
      const treffer = formen.filter((f) => aussage.passt(f));
      ok(P[3], treffer.length === 1 && treffer[0] === q.form, q.aussage + ' → ' + treffer.join(','));
    }
    const woerter = a.paare.filter((q) => q.sorte === 'englisch');
    ok(P[4], new Set(woerter.map((q) => q.a.text.toLowerCase())).size === woerter.length &&
             new Set(woerter.map((q) => q.b.text)).size === woerter.length);
    ok(P[5], !(formen.indexOf('dreieck') !== -1 && formen.indexOf('rechtwinkligesDreieck') !== -1));
    ok(P[6], a.anzeige.spalten * Math.ceil(karten.length / a.anzeige.spalten) === karten.length);
    if (p.sorte === 'englisch') ok(P[7], woerter.length === p.paare);
  });
  melde('Lern-Memory', e, P);
}

/* ============================================================
   SUCHBILD
   ============================================================ */
{
  const P = ['Gittergröße wie in der Tabelle', 'jedes Feld hat ein Bild und einen Namen', 'die Lösung sind genau die Ziel-Felder',
             'Anzahl der Ziele wie in der Tabelle', 'kein Ablenker sieht aus wie das Ziel', 'jeder Ablenker kommt mindestens einmal vor',
             'die Anzahl steht nur auf den unteren Stufen da', 'Fehlertext nennt, was zu viel war'];
  const e = jedeAufgabe('suchbild', function (a, stufe, ok) {
    const p = K.parameterFuer('suchbild', stufe);
    const z = a.anzeige;
    const n = p.breite * p.hoehe;
    ok(P[0], z.breite === p.breite && z.hoehe === p.hoehe);
    ok(P[1], z.inhalte.length === n && z.namen.length === n && z.inhalte.every((s) => s.indexOf('<svg') === 0) &&
             z.namen.every((t) => t && !/undefined/.test(t)));
    const ziele = a.schluessel.map((k, i) => (k === a.zielSchluessel ? i : -1)).filter((i) => i !== -1);
    ok(P[2], K.zellenSchluessel(a.richtig) === K.zellenSchluessel(ziele.map((i) => ({ x: i % p.breite, y: Math.floor(i / p.breite) }))));
    ok(P[3], a.richtig.length >= p.ziele[0] && a.richtig.length <= p.ziele[1], a.richtig.length);
    const svgZiel = z.inhalte[ziele[0]];
    ok(P[4], z.inhalte.every((s, i) => a.schluessel[i] === a.zielSchluessel || s !== svgZiel));
    ok(P[5], new Set(a.schluessel).size === p.sorten);
    ok(P[6], (z.ziel === a.richtig.length) === p.zahlNennen && (z.ziel === null) === !p.zahlNennen);
    const falsch = a.schluessel.findIndex((k) => k !== a.zielSchluessel);
    const text = K.findeUebung('suchbild').fehlerText(a, a.richtig.concat([{ x: falsch % p.breite, y: Math.floor(falsch / p.breite) }]));
    ok(P[7], text.indexOf(z.namen[falsch]) !== -1 && text.indexOf('gehört nicht dazu') !== -1, text);
  });
  melde('Suchbild', e, P);
}

/* ============================================================
   FEHLERBILD
   ============================================================ */
{
  const P = ['genau so viele Unterschiede wie in der Tabelle', 'die Lösung sind genau die veränderten Felder',
             'alle anderen Felder sind gleich', 'nur Veränderungen dieser Stufe', 'gedreht werden nur drehbare Formen',
             'gespiegelt werden nur Formen, bei denen man es sieht', 'Farbwechsel nie zwischen verwechselbaren Farben',
             'Vorlage und Bild sind gleich groß', 'Fehlertext nennt den übersehenen Unterschied'];
  const e = jedeAufgabe('fehlerbild', function (a, stufe, ok) {
    const p = K.parameterFuer('fehlerbild', stufe);
    const key = (f) => (f ? K.figurSchluessel(f) : 'leer');
    const anders = a.vorher.map((f, i) => (key(f) !== key(a.nachher[i]) ? i : -1)).filter((i) => i !== -1);
    ok(P[0], a.richtig.length === p.unterschiede && a.anzeige.ziel === p.unterschiede);
    ok(P[1], K.zellenSchluessel(a.richtig) === K.zellenSchluessel(anders.map((i) => ({ x: i % p.breite, y: Math.floor(i / p.breite) }))));
    ok(P[2], a.vorher.every((f, i) => anders.indexOf(i) !== -1 || a.anzeige.inhalte[i] === a.anzeige.vergleich.inhalte[i]));
    ok(P[3], a.unterschiede.every((d) => p.arten.indexOf(d.art) !== -1));
    ok(P[4], a.unterschiede.every((d) => d.art !== 'drehung' || K.FORMEN[a.vorher[d.i].form].drehordnung === 1));
    ok(P[5], a.unterschiede.every((d) => d.art !== 'spiegeln' || K.FORMEN[a.vorher[d.i].form].chiral));
    ok(P[6], a.unterschiede.every((d) => d.art !== 'farbe' || !K.verwechselbar(a.vorher[d.i].farbe, a.nachher[d.i].farbe)));
    ok(P[7], a.anzeige.vergleich.inhalte.length === p.breite * p.hoehe && a.anzeige.inhalte.length === p.breite * p.hoehe);
    const text = K.findeUebung('fehlerbild').fehlerText(a, a.richtig.slice(1));
    ok(P[8], text.indexOf(a.unterschiede[0].text) !== -1, text);
  });
  melde('Fehlerbild', e, P);
}

/* ============================================================
   ZAHLENTABELLE
   ============================================================ */
{
  const P = ['n×n Felder, jede Kennung einmal', 'die Reihenfolge enthält jedes Feld genau einmal',
             'aufwärts: 1, 2, 3 …', 'rückwärts: von oben nach 1', 'im Wechsel: Kreis und Quadrat abwechselnd',
             'gegenläufig: Kreise hoch, Quadrate runter', 'die Felder sind gemischt'];
  let gemischt = 0;
  const e = jedeAufgabe('zahlentabelle', function (a, stufe, ok) {
    const p = K.parameterFuer('zahlentabelle', stufe);
    const z = a.anzeige;
    const ids = z.felder.map((f) => f.id);
    const zahl = (id) => Number(id.slice(1));
    ok(P[0], z.felder.length === p.n * p.n && new Set(ids).size === ids.length);
    ok(P[1], a.richtig.length === ids.length && a.richtig.every((id) => ids.indexOf(id) !== -1));
    if (p.art === 'auf') ok(P[2], a.richtig.every((id, i) => id === 'n' + (i + 1)));
    if (p.art === 'ab') ok(P[3], a.richtig.every((id, i) => id === 'n' + (ids.length - i)));
    if (p.art === 'wechsel' || p.art === 'gegen') {
      ok(P[4], a.richtig.every((id, i) => id[0] === (i % 2 === 0 ? 'k' : 'q')));
      const kreise = a.richtig.filter((id) => id[0] === 'k').map(zahl);
      const quadrate = a.richtig.filter((id) => id[0] === 'q').map(zahl);
      const steigt = (l) => l.every((x, i) => i === 0 || x === l[i - 1] + 1);
      const faellt = (l) => l.every((x, i) => i === 0 || x === l[i - 1] - 1);
      ok(P[5], steigt(kreise) && kreise[0] === 1 && (p.art === 'wechsel' ? steigt(quadrate) && quadrate[0] === 1
                                                                          : faellt(quadrate) && quadrate[quadrate.length - 1] === 1));
    }
    if (ids.join() !== a.richtig.slice().sort().join()) gemischt += 1;
  });
  melde('Zahlentabelle', e, P);
  pruefe(gemischt > e.anzahl * 0.95, 'die Zahlen stehen fast immer durcheinander (' + gemischt + ' von ' + e.anzahl + ')');
  gleich(K.pruefeAufgabe({ art: 'antippen', erlaubt: 2 }, { fehlgriffe: 2, fertig: true }), 'richtig', 'zwei Fehlgriffe sind erlaubt');
  gleich(K.pruefeAufgabe({ art: 'antippen', erlaubt: 2 }, { fehlgriffe: 3, fertig: true }), 'falsch', 'drei sind zu viel');
  gleich(K.pruefeAufgabe({ art: 'antippen', erlaubt: 2 }, { fehlgriffe: 0, fertig: false, geschafft: 5 }), 'falsch', 'nicht fertig ist falsch');
}

/* ============================================================
   LINIEN VERFOLGEN
   ============================================================ */
{
  const P = ['so viele Linien wie in der Tabelle', 'so viele Kreuzungen wie in der Tabelle', 'die Lösung ist das Ende der gefragten Linie',
             'jede falsche Möglichkeit nennt die Linie, die dort ankommt', 'die gefragte Linie kreuzt mindestens einmal',
             'ab Stufe 3 kommt sie nicht geradeaus an', 'jeder Schritt tauscht nur Nachbarn', 'das Bild hat eine Linie pro Buchstabe'];
  const e = jedeAufgabe('linien', function (a, stufe, ok) {
    const p = K.parameterFuer('linien', stufe);
    const letzte = a.spalten[a.spalten.length - 1];
    ok(P[0], a.optionen.length === p.n && letzte.length === p.n);
    ok(P[1], a.kreuzt.reduce((s, k) => s + k, 0) === 2 * p.kreuzungen);
    ok(P[2], a.richtig === 'e' + (letzte.indexOf(a.linie) + 1));
    ok(P[3], a.optionen.every((o) => o.id === a.richtig ||
      o.fehlerText.indexOf('Linie von ' + 'ABCDEF'[letzte[Number(o.text) - 1]]) !== -1));
    ok(P[4], a.kreuzt[a.linie] >= 1);
    ok(P[5], stufe < 3 || letzte.indexOf(a.linie) !== a.linie);
    ok(P[6], a.spalten.every((s, i) => i === 0 || s.every((l, spur) => Math.abs(a.spalten[i - 1].indexOf(l) - spur) <= 1)));
    ok(P[7], (a.anzeige.bild.match(/class="linie"/g) || []).length === p.n);
  });
  melde('Linien verfolgen', e, P);
}

/* ============================================================
   PFEIL ODER WORT
   ============================================================ */
{
  const P = ['so viele Karten wie in der Tabelle', 'die Lösung ist richtig gezählt', 'die Falle steht zur Wahl und hat ihren eigenen Text',
             'die Falle ist nie zugleich die Lösung', 'genau vier Zahlen, aufsteigend', 'Regeln nur ab ihrer Stufe',
             'nur links und rechts auf Stufe 1 und 2', 'unpassende Karten wie in der Tabelle'];
  const e = jedeAufgabe('pfeilwort', function (a, stufe, ok) {
    const p = K.parameterFuer('pfeilwort', stufe);
    const k = a.karten;
    const zaehle = {
      pfeil: k.filter((x) => x.pfeil === a.ziel).length,
      wort: k.filter((x) => x.wort === a.ziel).length,
      passt: k.filter((x) => x.pfeil === x.wort).length,
      passtNicht: k.filter((x) => x.pfeil !== x.wort).length
    };
    const falle = { pfeil: zaehle.wort, wort: zaehle.pfeil, passt: zaehle.passtNicht, passtNicht: zaehle.passt }[a.regel];
    ok(P[0], k.length === p.karten && a.anzeige.bilder.length === p.karten);
    ok(P[1], a.richtig === 'z' + zaehle[a.regel], a.regel + ' ' + a.richtig + ' ' + zaehle[a.regel]);
    const fo = a.optionen.filter((o) => o.id === 'z' + falle)[0];
    ok(P[2], fo && /Gefragt war|gefragt war/.test(fo.fehlerText));
    ok(P[3], falle !== zaehle[a.regel]);
    const zahlen = a.optionen.map((o) => Number(o.text));
    ok(P[4], zahlen.length === 4 && zahlen.every((z, i) => i === 0 || z > zahlen[i - 1]));
    ok(P[5], p.regeln.indexOf(a.regel) !== -1);
    ok(P[6], p.richtungen === 4 || k.every((x) => ['links', 'rechts'].indexOf(x.pfeil) !== -1 && ['links', 'rechts'].indexOf(x.wort) !== -1));
    ok(P[7], zaehle.passtNicht >= p.unpassend[0] && zaehle.passtNicht <= p.unpassend[1]);
  });
  melde('Pfeil oder Wort', e, P);
}

console.log('\n=== TEST: Memory ohne Vokabeln und mit gewählter Sorte ===');
{
  const ohne = vm.createContext({ console: console, Math: Math, JSON: JSON, Object: Object,
                                  Array: Array, String: String, Number: Number, Set: Set });
  vm.runInContext(fs.readFileSync(WEB + 'shared/schule.js', 'utf8'), ohne);
  for (const datei of ['formen.js', 'kern.js', 'memory.js']) {
    vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), ohne);
  }
  const a = vm.runInContext('macheMemory(5, {})', ohne);
  pruefe(a.paare.length === 8 && a.paare.every((p) => p.sorte === 'formName'),
         'ohne Englisch-Dateien gibt es stattdessen Formen-Paare');

  for (const sorte of ['formName', 'eigenschaft', 'englisch']) {
    let gut = true;
    for (let stufe = 1; stufe <= 8; stufe++) {
      for (let i = 0; i < 30; i++) {
        const m = lauf('macheMemory(' + stufe + ', { paartyp: "' + sorte + '" })');
        if (m.paare.length !== K.MEMORY_STUFEN[stufe - 1].paare) gut = false;
        if (!m.paare.some((p) => p.sorte === sorte)) gut = false;
      }
    }
    pruefe(gut, 'gewählte Sorte „' + sorte + '“ klappt auf allen Stufen');
  }
}

console.log('\n=== TEST: Selbsttest für die Konsole ===');
{
  const probleme = lauf('testeUebungen(40)');
  pruefe(probleme.length === 0, 'testeUebungen(40) findet nichts' + (probleme.length ? ': ' + probleme.slice(0, 3).join(' | ') : ''));
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
