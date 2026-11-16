/* ============================================================
   KONZENTRATION — der Kern: Übungen, Stufen und Prüfen.

   Auch diese Datei kennt keine Seite. Die Übungen selbst stehen
   in gedaechtnis.js, muster.js, geometrie.js, memory.js und
   aufmerksamkeit.js und
   melden sich hier mit uebung('id', {...}) an.

   Eine Aufgabe sieht immer so aus:
     {
       uebung: 'reihe', stufe: 4,
       art: 'auswahl' | 'gitter' | 'folge' | 'paare' | 'antippen',
       frage: 'Welche Figur kommt als Nächstes?',
       anzeige: { ... },             // was gezeigt wird, je nach Art
       optionen: [{ id, svg, text, schluessel, fehler, fehlerText, falschThemen }],
       richtig: 'o2',                // die Lösung
       erklaerung: 'Die Farbe wechselt …',
       merksatz: '…',                // optional
       themen: ['farbe']             // wofür die Aufgabe steht (Rückblick)
     }
   ============================================================ */

const STUFE_MIN = 1;
const STUFE_MAX = 8;

const GRUPPEN = [
  { id: 'gedaechtnis', titel: 'Gedächtnis', symbol: '🧠',
    text: 'Figuren kurz ansehen und in der richtigen Reihenfolge oder am richtigen Platz wiedergeben.' },
  { id: 'muster', titel: 'Muster', symbol: '➡️',
    text: 'Regeln entdecken: Wie geht die Reihe weiter, was fehlt im Quadrat?' },
  { id: 'formen', titel: 'Formen', symbol: '🔷',
    text: 'Ecken, rechte Winkel, Symmetrie — und der Unterschied zwischen Spiegeln und Drehen.' },
  { id: 'memory', titel: 'Lern-Memory', symbol: '🃏',
    text: 'Paare finden und dabei Namen und Eigenschaften von Formen oder englische Wörter lernen.' },
  { id: 'aufmerksamkeit', titel: 'Aufmerksamkeit', symbol: '🔍',
    text: 'Genau hinsehen und dranbleiben: suchen, vergleichen, Linien verfolgen und sich nicht ablenken lassen.' }
];

const UEBUNGEN = {};
const UEBUNGS_REIHENFOLGE = [];

/* Eine Übung anmelden.
   daten = { gruppe, titel, symbol, alter: [von, bis], beschreibung, lernziel,
             tipps: [...], stufen: [8 Einträge], macheAufgabe(stufe, wahl), ... } */
function uebung(id, daten) {
  UEBUNGEN[id] = Object.assign({
    id: id,
    rundenLaenge: function () { return 8; },
    zeitMitUhr: function () { return 30; }
  }, daten);
  if (UEBUNGS_REIHENFOLGE.indexOf(id) === -1) UEBUNGS_REIHENFOLGE.push(id);
  return UEBUNGEN[id];
}

function alleUebungen(gruppe) {
  return UEBUNGS_REIHENFOLGE.map(function (id) { return UEBUNGEN[id]; })
    .filter(function (u) { return !gruppe || u.gruppe === gruppe; });
}

function findeUebung(id) {
  return UEBUNGEN[id] || null;
}

function findeGruppe(id) {
  return GRUPPEN.filter(function (g) { return g.id === id; })[0] || null;
}

/* ============================================================
   ALTER — jede Übung sagt, für welches Alter sie gedacht ist.
   Die Stufen passen sich trotzdem an jedes Kind an.
   ============================================================ */

const ALTER_MIN = 8;
const ALTER_MAX = 12;
const KLASSE_ALTER = { 3: '8–9', 4: '9–10', 5: '10–11', 6: '11–12' };

function alterText(u) {
  return u.alter[0] + '–' + u.alter[1] + ' Jahre';
}

function passtZumAlter(u, jahre) {
  if (!jahre) return true;
  return jahre >= u.alter[0] && jahre <= u.alter[1];
}

/* In welche Klasse geht man meistens mit so vielen Jahren? */
function klasseFuerAlter(jahre) {
  if (!jahre) return null;
  return Math.max(3, Math.min(6, jahre - 5));
}

function klemmeStufe(stufe) {
  return Math.max(STUFE_MIN, Math.min(STUFE_MAX, Math.round(stufe) || STUFE_MIN));
}

/* Die Einstellungen einer Übung auf einer Stufe */
function parameterFuer(uebungId, stufe) {
  const u = findeUebung(uebungId);
  return u.stufen[klemmeStufe(stufe) - 1];
}

/* ============================================================
   DIE STUFE PASST SICH AN
   Zwei Treffer hintereinander: eine Stufe schwerer.
   Zwei Fehler hintereinander: eine Stufe leichter.
   Nach jedem Wechsel fängt das Zählen von vorn an.
   amBoden: zwei Fehler auf Stufe 1 — dann gibt es Tipps vorab.
   verlauf = Treffer (true) und Fehler (false) seit dem letzten Wechsel.
   ============================================================ */

function naechsteStufe(stufe, verlauf) {
  const n = verlauf.length;
  const letzte = verlauf[n - 1];
  const vorletzte = verlauf[n - 2];

  if (n >= 2 && letzte === true && vorletzte === true) {
    const neu = Math.min(stufe + 1, STUFE_MAX);
    return { stufe: neu, verlauf: [], aenderung: neu - stufe, amBoden: false };
  }
  if (n >= 2 && letzte === false && vorletzte === false) {
    const neu = Math.max(stufe - 1, STUFE_MIN);
    return { stufe: neu, verlauf: [], aenderung: neu - stufe, amBoden: stufe === STUFE_MIN };
  }
  return { stufe: stufe, verlauf: verlauf.slice(), aenderung: 0, amBoden: false };
}

function stufenText(aenderung, stufe) {
  if (aenderung > 0) return '⬆️ Du bist jetzt auf Stufe ' + stufe + ' – ein Stück schwerer.';
  if (aenderung < 0) return 'Wir gehen eine Stufe zurück auf Stufe ' + stufe +
                            ', damit du die Regel in Ruhe üben kannst.';
  return '';
}

/* Womit fängt ein Kind an, das die Übung noch nie gemacht hat? */
const START_STUFE = { 3: 1, 4: 2, 5: 4, 6: 5 };

function startStufeFuerKlasse(klasse) {
  return START_STUFE[klasse] || 1;
}

/* ============================================================
   PRÜFEN
   Gibt 'richtig', 'falsch' oder 'neutral' zurück. 'neutral' gibt
   es nur beim Memory: nicht toll, nicht schlecht — dann ändert
   sich die Stufe nicht.
   ============================================================ */

function pruefeAufgabe(aufgabe, antwort) {
  if (antwort === null || antwort === undefined) return 'falsch';

  if (aufgabe.art === 'auswahl') {
    return antwort === aufgabe.richtig ? 'richtig' : 'falsch';
  }
  if (aufgabe.art === 'gitter') {
    if (!Array.isArray(antwort)) return 'falsch';
    return zellenSchluessel(antwort) === zellenSchluessel(aufgabe.richtig) ? 'richtig' : 'falsch';
  }
  if (aufgabe.art === 'folge') {
    return JSON.stringify(antwort) === JSON.stringify(aufgabe.richtig) ? 'richtig' : 'falsch';
  }
  if (aufgabe.art === 'paare') {
    const f = typeof antwort.fehlversuche === 'number' ? antwort.fehlversuche : Infinity;
    if (antwort.fertig === false) return 'falsch';
    if (f <= aufgabe.erfolgBis) return 'richtig';
    if (f > 2 * aufgabe.erfolgBis) return 'falsch';
    return 'neutral';
  }
  if (aufgabe.art === 'antippen') {
    if (antwort.fertig === false || typeof antwort.fehlgriffe !== 'number') return 'falsch';
    return antwort.fehlgriffe <= aufgabe.erlaubt ? 'richtig' : 'falsch';
  }
  return 'falsch';
}

/* Die Antwort, die ein perfektes Kind geben würde (für Selbsttests) */
function musterAntwort(aufgabe) {
  if (aufgabe.art === 'paare') return { fehlversuche: 0, fertig: true };
  if (aufgabe.art === 'antippen') return { fehlgriffe: 0, fertig: true };
  return aufgabe.richtig;
}

/* ============================================================
   RÜCKBLICK: Was klappt schon, was lohnt sich zu üben?
   eintrag = { ergebnis, themen: [...], falschThemen: [...] }
   ============================================================ */

const THEMEN_TEXT = {
  farbe: 'bei Farbwechseln', form: 'bei Formwechseln', groesse: 'bei Größen',
  drehung: 'bei Drehungen', anzahl: 'beim Zählen der Figuren', position: 'beim Wandern der Figur',
  vorwaerts: 'beim Vorwärts-Merken', rueckwaerts: 'beim Rückwärts-Merken',
  gitter3: 'bei 3×3-Gittern', gitter4: 'bei 4×4-Gittern', gitter5: 'bei 5×5-Gittern',
  rund: 'bei rund und eckig', ecken: 'beim Ecken-Zählen', rechterWinkel: 'bei rechten Winkeln',
  gleichlang: 'bei gleich langen Seiten', achsensymmetrisch: 'bei der Achsensymmetrie',
  punktsymmetrisch: 'bei der Punktsymmetrie', parallel: 'bei parallelen Seiten',
  achsenAnzahl: 'beim Zählen der Symmetrieachsen',
  spiegelnSenkrecht: 'beim Spiegeln an der senkrechten Achse',
  spiegelnWaagerecht: 'beim Spiegeln an der waagerechten Achse',
  spiegelnDiagonal: 'beim Spiegeln an der schrägen Achse',
  drehen: 'beim Drehen', formName: 'bei den Namen der Formen',
  eigenschaft: 'bei den Eigenschaften', englisch: 'bei den englischen Wörtern',
  suchenForm: 'beim Suchen von Formen', richtung: 'bei Richtungen',
  buchstaben: 'bei b, d, p und q', ziffern: 'bei ähnlichen Ziffern',
  zweiMerkmale: 'wenn zwei Dinge zugleich stimmen müssen', unterschiede: 'beim Vergleichen von Bildern',
  tabelle: 'beim Zahlen-Suchen', tabelleWechsel: 'beim Abwechseln',
  linien: 'beim Linien-Verfolgen', pfeile: 'beim Zählen der Pfeile',
  woerter: 'beim Lesen der Wörter', passen: 'beim Vergleichen von Pfeil und Wort'
};

function reflexionsText(rueckblick) {
  const zaehler = {};
  let richtig = 0;
  let gewertet = 0;

  for (const e of rueckblick) {
    if (e.ergebnis === 'richtig') richtig += 1;
    if (e.ergebnis !== 'neutral') gewertet += 1;
    for (const t of e.themen || []) {
      if (!THEMEN_TEXT[t]) continue;
      if (!zaehler[t]) zaehler[t] = { gesamt: 0, gut: 0 };
      zaehler[t].gesamt += 1;
      const gut = e.ergebnis === 'richtig' || e.ergebnis === 'neutral' ||
                  (e.falschThemen && e.falschThemen.length && e.falschThemen.indexOf(t) === -1);
      if (gut) zaehler[t].gut += 1;
    }
  }

  let sicher = null;
  let ueben = null;
  for (const t of Object.keys(zaehler)) {
    const z = zaehler[t];
    if (z.gesamt < 2) continue;
    if (z.gut === z.gesamt && (!sicher || z.gesamt > zaehler[sicher].gesamt)) sicher = t;
    if (z.gut / z.gesamt <= 0.5 && (!ueben || z.gesamt > zaehler[ueben].gesamt)) ueben = t;
  }

  if (sicher && ueben) {
    return grossAnfang(THEMEN_TEXT[sicher]) + ' warst du schon sicher, ' +
           THEMEN_TEXT[ueben] + ' lohnt sich noch Üben.';
  }
  if (sicher) return grossAnfang(THEMEN_TEXT[sicher]) + ' warst du richtig sicher – weiter so!';
  if (ueben) return grossAnfang(THEMEN_TEXT[ueben]) + ' lohnt sich noch Üben – die Erklärungen helfen dir dabei.';

  const quote = gewertet ? richtig / gewertet : 1;
  if (quote >= 0.85) return 'Fast alles richtig – du bist bereit für die nächste Stufe.';
  if (quote >= 0.45) return 'Gut geübt! Mit jeder Runde wird es leichter.';
  return 'Das war heute eine schwere Runde. Beim nächsten Mal fangen wir eine Stufe leichter an.';
}

/* ============================================================
   SELBSTTEST — in der Browser-Konsole: testeUebungen(200)
   Gibt eine Liste mit Problemen zurück (leer = alles gut).
   ============================================================ */

function pruefeAufgabeFormal(a) {
  const probleme = [];
  const wer = a.uebung + ' Stufe ' + a.stufe + ': ';
  const texte = [a.frage, a.erklaerung, a.merksatz || '']
    .concat((a.optionen || []).map(function (o) { return (o.text || '') + (o.fehlerText || ''); }));

  if (!a.frage) probleme.push(wer + 'keine Frage');
  if (!a.erklaerung) probleme.push(wer + 'keine Erklärung');
  for (const t of texte) {
    if (/undefined|NaN|\[object/.test(String(t))) probleme.push(wer + 'kaputter Text: ' + t);
  }
  if (pruefeAufgabe(a, musterAntwort(a)) !== 'richtig') probleme.push(wer + 'die eigene Lösung gilt nicht');

  if (a.art === 'gitter' && a.anzeige.inhalte && a.anzeige.inhalte.length !== a.anzeige.breite * a.anzeige.hoehe) {
    probleme.push(wer + 'nicht jedes Feld hat einen Inhalt');
  }
  if (a.art === 'antippen') {
    const ids = a.anzeige.felder.map(function (f) { return f.id; });
    if (a.richtig.length !== ids.length || new Set(a.richtig).size !== ids.length ||
        a.richtig.some(function (id) { return ids.indexOf(id) === -1; })) {
      probleme.push(wer + 'die Reihenfolge passt nicht zu den Feldern');
    }
  }

  if (a.art === 'auswahl') {
    const treffer = a.optionen.filter(function (o) { return o.id === a.richtig; });
    if (treffer.length !== 1) probleme.push(wer + 'die Lösung steht nicht genau einmal zur Wahl');
    if (a.optionen.length < 2) probleme.push(wer + 'zu wenige Möglichkeiten');
    const ids = a.optionen.map(function (o) { return o.id; });
    if (new Set(ids).size !== ids.length) probleme.push(wer + 'doppelte Kennungen');
    if (!a.optionenGleichErlaubt) {
      const schluessel = a.optionen.map(function (o) { return o.schluessel; });
      if (new Set(schluessel).size !== schluessel.length) probleme.push(wer + 'zwei Möglichkeiten sehen gleich aus');
    }
    for (const o of a.optionen) {
      if (o.id !== a.richtig && !o.fehlerText) probleme.push(wer + 'eine falsche Möglichkeit ohne Erklärung');
    }
  }
  return probleme;
}

function testeUebungen(anzahl) {
  const probleme = [];
  for (const u of alleUebungen()) {
    if (!Array.isArray(u.alter) || u.alter[0] < ALTER_MIN || u.alter[1] > ALTER_MAX || u.alter[0] > u.alter[1]) {
      probleme.push(u.id + ': keine passende Altersangabe');
    }
    for (let stufe = STUFE_MIN; stufe <= STUFE_MAX; stufe++) {
      for (let i = 0; i < (anzahl || 50); i++) {
        try {
          const a = u.macheAufgabe(stufe, {});
          for (const p of pruefeAufgabeFormal(a)) probleme.push(p);
        } catch (e) {
          probleme.push(u.id + ' Stufe ' + stufe + ': Fehler ' + e.message);
        }
        if (probleme.length > 30) return probleme;
      }
    }
  }
  return probleme;
}
