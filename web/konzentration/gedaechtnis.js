/* ============================================================
   GEDÄCHTNIS — Merkfolge und Gitter merken.
   ============================================================ */

/* ---------------- Merkfolge ---------------- */

const MERK_FORMEN = ['kreis', 'dreieck', 'quadrat', 'stern', 'herz', 'pfeil'];

uebung('merkfolge', {
  gruppe: 'gedaechtnis',
  titel: 'Merkfolge',
  symbol: '🧠',
  alter: [8, 12],
  beschreibung: 'Figuren erscheinen nacheinander. Tippe sie danach in derselben Reihenfolge an — später auch rückwärts.',
  lernziel: 'Du übst, dir mehrere Dinge in der richtigen Reihenfolge zu merken – das brauchst du beim Diktat, beim Kopfrechnen und beim Zuhören.',
  tipps: [
    'Sprich die Formen leise mit: „rotes Dreieck, blauer Kreis, gelber Stern …“',
    'Mach aus der Reihe eine kleine Geschichte: Der Kreis rollt zum Dreieck, das Dreieck zeigt auf den Stern.'
  ],
  tippAbStufe: { 5: 'Beim Rückwärts-Merken hilft es, die Reihe erst vorwärts zu sagen und dann von hinten abzulesen wie von einem Zettel.' },

  stufen: [
    { laenge: 3, zeigeMs: 1200, pauseMs: 400, formen: 4, farben: 1, wiederholung: false, rueckwaerts: 0 },
    { laenge: 4, zeigeMs: 1100, pauseMs: 400, formen: 4, farben: 2, wiederholung: false, rueckwaerts: 0 },
    { laenge: 4, zeigeMs: 1000, pauseMs: 350, formen: 6, farben: 2, wiederholung: false, rueckwaerts: 0 },
    { laenge: 5, zeigeMs: 1000, pauseMs: 350, formen: 6, farben: 2, wiederholung: true,  rueckwaerts: 0 },
    { laenge: 5, zeigeMs: 900,  pauseMs: 300, formen: 6, farben: 2, wiederholung: true,  rueckwaerts: 0.4 },
    { laenge: 6, zeigeMs: 900,  pauseMs: 300, formen: 4, farben: 3, wiederholung: true,  rueckwaerts: 0.5 },
    { laenge: 7, zeigeMs: 800,  pauseMs: 300, formen: 4, farben: 3, wiederholung: true,  rueckwaerts: 0.5 },
    { laenge: 8, zeigeMs: 700,  pauseMs: 250, formen: 4, farben: 3, wiederholung: true,  rueckwaerts: 0.5 }
  ],

  beispiel: function () {
    return formSvg('dreieck', { farbe: 'rot' }) + formSvg('kreis', { farbe: 'blau' }) +
           formSvg('stern', { farbe: 'gelb' });
  },

  macheAufgabe: function (stufe) {
    const p = parameterFuer('merkfolge', stufe);
    const formen = mischen(MERK_FORMEN.slice(0, p.formen).slice());
    const farben = waehleFarben(p.farben);

    const tasten = [];
    for (const f of formen) {
      for (const c of farben) {
        const figur = { form: f, farbe: c };
        const name = figurName(figur);
        tasten.push({ id: f + '-' + c, svg: formSvg(f, { farbe: c, groesse: 'gross', name: name }), name: name, figur: figur });
      }
    }
    mischen(tasten);

    const folge = [];
    while (folge.length < p.laenge) {
      const t = zufallsElement(tasten);
      if (folge.length && folge[folge.length - 1] === t.id) continue;          // nie zweimal direkt
      if (!p.wiederholung && folge.indexOf(t.id) !== -1) continue;
      folge.push(t.id);
    }

    const rueckwaerts = Math.random() < p.rueckwaerts;
    const richtig = rueckwaerts ? folge.slice().reverse() : folge.slice();
    const name = function (id) { return tasten.filter(function (t) { return t.id === id; })[0].name; };

    return {
      uebung: 'merkfolge', stufe: stufe, art: 'folge',
      frage: rueckwaerts
        ? '↩ Rückwärts! Tippe die Figuren danach in umgekehrter Reihenfolge – die letzte zuerst.'
        : 'Schau gut hin und tippe die Figuren danach in derselben Reihenfolge an.',
      anzeige: {
        tasten: tasten, folge: folge, zeigeMs: p.zeigeMs, pauseMs: p.pauseMs,
        rueckwaerts: rueckwaerts, beschriften: stufe <= 3
      },
      richtig: richtig,
      erklaerung: 'Die Reihe war: ' + folge.map(name).join(' → ') + '.' +
        (rueckwaerts ? ' Rückwärts also: ' + richtig.map(name).join(' → ') + '.' : ''),
      themen: [rueckwaerts ? 'rueckwaerts' : 'vorwaerts']
    };
  },

  fehlerText: function (aufgabe, antwort) {
    const name = function (id) {
      const t = aufgabe.anzeige.tasten.filter(function (x) { return x.id === id; })[0];
      return t ? t.name : '?';
    };
    const liste = antwort || [];
    for (let i = 0; i < aufgabe.richtig.length; i++) {
      if (liste[i] !== aufgabe.richtig[i]) {
        return 'Nicht ganz. An Stelle ' + (i + 1) + ' kam „' + name(aufgabe.richtig[i]) + '“' +
               (liste[i] ? ', du hast „' + name(liste[i]) + '“ getippt.' : '.');
      }
    }
    return 'Nicht ganz.';
  },

  rundenLaenge: function () { return 8; },
  zeitMitUhr: function (aufgabe) { return Math.ceil(2.5 * aufgabe.richtig.length); }
});

/* ---------------- Gitter merken ---------------- */

/* Ein Feld beim Namen nennen: 3×3 in Worten, größer mit Zeile/Spalte */
function feldName(x, y, n) {
  if (n === 3) {
    const zeile = ['oben', 'Mitte', 'unten'][y];
    const spalte = ['links', 'Mitte', 'rechts'][x];
    if (zeile === 'Mitte' && spalte === 'Mitte') return 'in der Mitte';
    if (zeile === 'Mitte') return 'Mitte ' + spalte;
    return zeile + ' ' + (spalte === 'Mitte' ? 'in der Mitte' : spalte);
  }
  return 'Zeile ' + (y + 1) + ', Spalte ' + (x + 1);
}

/* Erkennt einfache Bilder: Reihe, Säule, Quadrat */
function gitterBild(zellen) {
  const xs = zellen.map(function (z) { return z.x; });
  const ys = zellen.map(function (z) { return z.y; });
  const breite = Math.max.apply(null, xs) - Math.min.apply(null, xs) + 1;
  const hoehe = Math.max.apply(null, ys) - Math.min.apply(null, ys) + 1;
  if (!zusammenhaengend(zellen)) return null;
  if (hoehe === 1) return 'eine liegende Reihe';
  if (breite === 1) return 'eine stehende Säule';
  if (breite === 2 && hoehe === 2 && zellen.length === 4) return 'ein kleines Quadrat';
  return null;
}

uebung('gitter', {
  gruppe: 'gedaechtnis',
  titel: 'Gitter merken',
  symbol: '🔲',
  alter: [8, 12],
  beschreibung: 'Einige Felder leuchten kurz auf. Tippe danach genau diese Felder wieder an.',
  lernziel: 'Du übst, dir ein Bild genau einzuprägen – so wie du dir merkst, wo etwas auf einer Seite im Buch steht.',
  tipps: [
    'Such dir ein Bild: Sieht das Muster aus wie ein L, eine Treppe oder ein Haus?',
    'Zähle: Wie viele Felder sind es, und in welcher Zeile liegen die meisten?'
  ],

  stufen: [
    { n: 3, zellen: 3, zeigeMs: 2500, form: 'zusammen' },
    { n: 3, zellen: 4, zeigeMs: 3000, form: 'zusammen' },
    { n: 4, zellen: 4, zeigeMs: 3000, form: 'zusammen' },
    { n: 4, zellen: 5, zeigeMs: 3500, form: 'zusammen' },
    { n: 4, zellen: 6, zeigeMs: 3000, form: 'zwei' },
    { n: 5, zellen: 6, zeigeMs: 3000, form: 'zwei' },
    { n: 5, zellen: 7, zeigeMs: 3500, form: 'frei' },
    { n: 5, zellen: 8, zeigeMs: 3500, form: 'frei' }
  ],

  beispiel: function () {
    return gitterSvg([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }], 3, { name: 'ein L im Gitter' });
  },

  macheAufgabe: function (stufe) {
    const p = parameterFuer('gitter', stufe);
    let zellen = null;

    if (p.form === 'zusammen') {
      zellen = wachseFigur(p.zellen, p.n, p.n);
    } else if (p.form === 'zwei') {
      for (let versuch = 0; versuch < 100 && !zellen; versuch++) {
        const a = zufall(2, p.zellen - 2);
        const erster = wachseFigur(a, p.n, p.n);
        const zweiter = erster && wachseFigur(p.zellen - a, p.n, p.n, function (x, y) {
          return !enthaeltZelle(erster, x, y);
        });
        if (zweiter && zaehleTeile(erster.concat(zweiter)) <= 2) zellen = erster.concat(zweiter);
      }
    }
    if (!zellen) {
      const alle = [];
      for (let y = 0; y < p.n; y++) for (let x = 0; x < p.n; x++) alle.push({ x: x, y: y });
      zellen = mischen(alle).slice(0, p.zellen);
    }

    const bild = gitterBild(zellen);
    return {
      uebung: 'gitter', stufe: stufe, art: 'gitter',
      frage: 'Merk dir die leuchtenden Felder. Dann tippe genau diese ' + p.zellen + ' Felder an.',
      anzeige: { breite: p.n, hoehe: p.n, zeigeZuerst: zellen, vorgabe: [], achse: null,
                 merkzeit: p.zeigeMs, ziel: p.zellen },
      richtig: zellen,
      erklaerung: 'Richtig waren diese ' + p.zellen + ' Felder: ' +
        zellen.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; })
          .map(function (z) { return feldName(z.x, z.y, p.n); }).join('; ') + '.' +
        (bild ? ' Das Muster sah aus wie ' + bild + '.' : ' Welches Bild siehst du darin?'),
      themen: ['gitter' + p.n]
    };
  },

  fehlerText: function (aufgabe, antwort) {
    const soll = aufgabe.richtig;
    const ist = antwort || [];
    const n = aufgabe.anzeige.breite;
    const treffer = ist.filter(function (z) { return enthaeltZelle(soll, z.x, z.y); }).length;
    const fehlt = soll.filter(function (z) { return !enthaeltZelle(ist, z.x, z.y); });
    const zuviel = ist.filter(function (z) { return !enthaeltZelle(soll, z.x, z.y); });
    let text = 'Du hattest ' + treffer + ' von ' + soll.length + ' Feldern richtig.';
    if (fehlt.length) text += ' Es fehlte das Feld ' + feldName(fehlt[0].x, fehlt[0].y, n) + '.';
    if (zuviel.length) text += ' Zu viel war das Feld ' + feldName(zuviel[0].x, zuviel[0].y, n) + '.';
    return text;
  },

  rundenLaenge: function () { return 8; },
  zeitMitUhr: function (aufgabe) { return 2 * aufgabe.richtig.length + 4; }
});
