/* ============================================================
   FORMEN — alle Figuren, Farben und das Rechnen mit Gittern.

   Diese Datei kennt keine Seite und kein HTML-Dokument. Sie
   baut nur Text: fertige SVG-Bilder als Zeichenkette. Darum
   kann node sie ohne Browser testen.

   Eine Figur sieht so aus:
     { form: 'dreieck', farbe: 'rot', groesse: 'mittel',
       drehung: 90, anzahl: 1, position: null, spiegeln: false }
   ============================================================ */

/* ---------------- Der Formen-Katalog ----------------
   drehordnung: nach wie vielen gleichen Drehungen sieht die Form
   wieder gleich aus (Quadrat 4, also sieht man 90° nicht; Kreis
   unendlich). Zum Drehen taugen nur Formen mit drehordnung 1.
   chiral: das Spiegelbild ist nie bloß eine Drehung.
   grund: Grundform mit Eigenschaften, die man lernt. */

function sternPunkte() {
  const punkte = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 44 : 18;
    const w = (-90 + i * 36) * Math.PI / 180;
    punkte.push((50 + r * Math.cos(w)).toFixed(1) + ',' + (50 + r * Math.sin(w)).toFixed(1));
  }
  return punkte.join(' ');
}

const FORMEN = {
  kreis: {
    name: 'Kreis', artikel: 'der', plural: 'Kreise',
    ecken: 0, rechteWinkel: 0, gleicheSeiten: null, parallelePaare: 0,
    achsen: Infinity, punktsymm: true, drehordnung: Infinity, rund: true, chiral: false, grund: true,
    svg: '<circle cx="50" cy="50" r="40"/>'
  },
  halbkreis: {
    name: 'Halbkreis', artikel: 'der', plural: 'Halbkreise',
    ecken: 2, rechteWinkel: 0, gleicheSeiten: 'nein', parallelePaare: 0,
    achsen: 1, punktsymm: false, drehordnung: 1, rund: true, chiral: false, grund: true,
    svg: '<path d="M10,68 A40,40 0 0 1 90,68 Z"/>'
  },
  dreieck: {
    name: 'Dreieck', artikel: 'das', plural: 'Dreiecke',
    ecken: 3, rechteWinkel: 0, gleicheSeiten: 'ja', parallelePaare: 0,
    achsen: 3, punktsymm: false, drehordnung: 3, rund: false, chiral: false, grund: true,
    svg: '<polygon points="50,12 88,78 12,78"/>'
  },
  rechtwinkligesDreieck: {
    name: 'Dreieck', adjektiv: 'rechtwinklig', artikel: 'das', plural: 'Dreiecke',
    ecken: 3, rechteWinkel: 1, gleicheSeiten: 'nein', parallelePaare: 0,
    achsen: 0, punktsymm: false, drehordnung: 1, rund: false, chiral: true, grund: true,
    svg: '<polygon points="15,85 85,85 15,25"/>'
  },
  quadrat: {
    name: 'Quadrat', artikel: 'das', plural: 'Quadrate',
    ecken: 4, rechteWinkel: 4, gleicheSeiten: 'ja', parallelePaare: 2,
    achsen: 4, punktsymm: true, drehordnung: 4, rund: false, chiral: false, grund: true,
    svg: '<polygon points="15,15 85,15 85,85 15,85"/>'
  },
  rechteck: {
    name: 'Rechteck', artikel: 'das', plural: 'Rechtecke',
    ecken: 4, rechteWinkel: 4, gleicheSeiten: 'teils', parallelePaare: 2,
    achsen: 2, punktsymm: true, drehordnung: 2, rund: false, chiral: false, grund: true,
    svg: '<polygon points="8,28 92,28 92,72 8,72"/>'
  },
  raute: {
    name: 'Raute', artikel: 'die', plural: 'Rauten',
    ecken: 4, rechteWinkel: 0, gleicheSeiten: 'ja', parallelePaare: 2,
    achsen: 2, punktsymm: true, drehordnung: 2, rund: false, chiral: false, grund: true,
    svg: '<polygon points="50,8 80,50 50,92 20,50"/>'
  },
  parallelogramm: {
    name: 'Parallelogramm', artikel: 'das', plural: 'Parallelogramme',
    ecken: 4, rechteWinkel: 0, gleicheSeiten: 'teils', parallelePaare: 2,
    achsen: 0, punktsymm: true, drehordnung: 2, rund: false, chiral: true, grund: true,
    svg: '<polygon points="25,30 92,30 75,70 8,70"/>'
  },
  trapez: {
    name: 'Trapez', artikel: 'das', plural: 'Trapeze',
    ecken: 4, rechteWinkel: 0, gleicheSeiten: 'teils', parallelePaare: 1,
    achsen: 1, punktsymm: false, drehordnung: 1, rund: false, chiral: false, grund: true,
    svg: '<polygon points="25,30 75,30 92,70 8,70"/>'
  },
  drachen: {
    name: 'Drachenviereck', artikel: 'das', plural: 'Drachenvierecke',
    ecken: 4, rechteWinkel: 0, gleicheSeiten: 'teils', parallelePaare: 0,
    achsen: 1, punktsymm: false, drehordnung: 1, rund: false, chiral: false, grund: true,
    svg: '<polygon points="50,6 78,38 50,94 22,38"/>'
  },
  fuenfeck: {
    name: 'Fünfeck', artikel: 'das', plural: 'Fünfecke',
    ecken: 5, rechteWinkel: 0, gleicheSeiten: 'ja', parallelePaare: 0,
    achsen: 5, punktsymm: false, drehordnung: 5, rund: false, chiral: false, grund: true,
    svg: '<polygon points="50,8 89.9,37 74.7,84 25.3,84 10.1,37"/>'
  },
  sechseck: {
    name: 'Sechseck', artikel: 'das', plural: 'Sechsecke',
    ecken: 6, rechteWinkel: 0, gleicheSeiten: 'ja', parallelePaare: 3,
    achsen: 6, punktsymm: true, drehordnung: 6, rund: false, chiral: false, grund: true,
    svg: '<polygon points="50,8 86.4,29 86.4,71 50,92 13.6,71 13.6,29"/>'
  },
  pfeil: {
    name: 'Pfeil', artikel: 'der', plural: 'Pfeile',
    ecken: 7, rechteWinkel: 2, gleicheSeiten: 'teils', parallelePaare: null,
    achsen: 1, punktsymm: false, drehordnung: 1, rund: false, chiral: false, grund: false,
    svg: '<polygon points="50,8 85,45 65,45 65,90 35,90 35,45 15,45"/>'
  },
  lForm: {
    name: 'L-Form', artikel: 'die', plural: 'L-Formen',
    ecken: 6, rechteWinkel: 5, gleicheSeiten: 'teils', parallelePaare: null,
    achsen: 0, punktsymm: false, drehordnung: 1, rund: false, chiral: true, grund: false,
    svg: '<polygon points="20,10 45,10 45,65 85,65 85,90 20,90"/>'
  },
  flagge: {
    name: 'Flagge', artikel: 'die', plural: 'Flaggen',
    ecken: null, rechteWinkel: null, gleicheSeiten: null, parallelePaare: null,
    achsen: 0, punktsymm: false, drehordnung: 1, rund: false, chiral: true, grund: false,
    svg: '<rect x="22" y="10" width="8" height="82"/><polygon points="30,12 82,30 30,48"/>'
  },
  stern: {
    name: 'Stern', artikel: 'der', plural: 'Sterne',
    ecken: 10, rechteWinkel: 0, gleicheSeiten: 'ja', parallelePaare: null,
    achsen: 5, punktsymm: false, drehordnung: 5, rund: false, chiral: false, grund: false,
    svg: '<polygon points="' + sternPunkte() + '"/>'
  },
  herz: {
    name: 'Herz', artikel: 'das', plural: 'Herzen',
    ecken: 1, rechteWinkel: 0, gleicheSeiten: null, parallelePaare: null,
    achsen: 1, punktsymm: false, drehordnung: 1, rund: true, chiral: false, grund: false,
    svg: '<path d="M50,88 C20,65 8,48 12,32 C16,16 38,14 50,30 C62,14 84,16 88,32 C92,48 80,65 50,88 Z"/>'
  }
};

/* Formen, die sich zum Drehen eignen (man sieht jede Drehung) */
const DREHBARE_FORMEN = Object.keys(FORMEN).filter(function (id) {
  return FORMEN[id].drehordnung === 1;
});

const GRUNDFORMEN = Object.keys(FORMEN).filter(function (id) { return FORMEN[id].grund; });

/* ---------------- Farben ----------------
   Auf dem dunklen Hintergrund gut zu sehen und so gewählt, dass
   Kinder mit Rot-Grün-Schwäche sie möglichst auseinanderhalten.
   Trotzdem trägt die Farbe nie allein die Bedeutung. */
const FARBEN = [
  { id: 'rot',    name: 'rot',    hex: '#ff4d6d' },
  { id: 'orange', name: 'orange', hex: '#ff9a2e' },
  { id: 'gelb',   name: 'gelb',   hex: '#ffe14d' },
  { id: 'gruen',  name: 'grün',   hex: '#2fd07a' },
  { id: 'blau',   name: 'blau',   hex: '#3aa0ff' },
  { id: 'lila',   name: 'lila',   hex: '#b07cff' }
];

const NEUTRAL_HEX = '#bcd4ff';

/* Diese Paare sehen manche Kinder fast gleich */
const FARBEN_VERWECHSELBAR = [
  ['rot', 'gruen'], ['orange', 'gelb'], ['orange', 'gruen'], ['orange', 'rot']
];

function farbe(id) {
  return FARBEN.filter(function (f) { return f.id === id; })[0] || null;
}

function verwechselbar(a, b) {
  return FARBEN_VERWECHSELBAR.some(function (p) {
    return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a);
  });
}

/* k verschiedene Farben, von denen keine zwei verwechselbar sind
   (geht bis 4). Braucht zufall/mischen aus shared/schule.js. */
function waehleFarben(k) {
  for (let versuch = 0; versuch < 200; versuch++) {
    const ids = mischen(FARBEN.map(function (f) { return f.id; })).slice(0, k);
    let gut = true;
    for (let i = 0; i < ids.length && gut; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (verwechselbar(ids[i], ids[j])) { gut = false; break; }
      }
    }
    if (gut || k > 4) return ids;
  }
  return mischen(FARBEN.map(function (f) { return f.id; })).slice(0, k);
}

/* ---------------- Größen und Plätze ---------------- */

const GROESSEN = {
  klein: 0.5, mittel: 0.72, gross: 0.95,
  s1: 0.35, s2: 0.5, s3: 0.65, s4: 0.8, s5: 0.95      // Reihe „wird immer größer“
};
const GROESSEN_REIHE = ['s1', 's2', 's3', 's4', 's5'];

/* Plätze in einem Feld: links/Mitte/rechts und die 8 Randfelder
   eines 3×3-Feldes im Uhrzeigersinn, oben links angefangen. */
const POSITIONEN = {
  links: [17, 50], mitte: [50, 50], rechts: [83, 50],
  r0: [17, 17], r1: [50, 17], r2: [83, 17], r3: [83, 50],
  r4: [83, 83], r5: [50, 83], r6: [17, 83], r7: [17, 50]
};
const RANDPLAETZE = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
const POSITIONS_NAMEN = { links: 'links', mitte: 'Mitte', rechts: 'rechts' };

/* Mehrere Figuren in einem Feld: wie die Augen auf einem Würfel */
const ANZAHL_PLAETZE = {
  1: { skala: 1, plaetze: [[50, 50]] },
  2: { skala: 0.42, plaetze: [[29, 29], [71, 71]] },
  3: { skala: 0.36, plaetze: [[24, 24], [50, 50], [76, 76]] },
  4: { skala: 0.4, plaetze: [[29, 29], [71, 29], [29, 71], [71, 71]] },
  5: { skala: 0.34, plaetze: [[24, 24], [76, 24], [50, 50], [24, 76], [76, 76]] },
  6: { skala: 0.3, plaetze: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]] }
};

/* ============================================================
   ZEICHNEN
   ============================================================ */

function farbHex(farbId) {
  if (!farbId || farbId === 'neutral') return NEUTRAL_HEX;
  const f = farbe(farbId);
  return f ? f.hex : NEUTRAL_HEX;
}

function zahl(x) {
  return String(Math.round(x * 1000) / 1000);
}

/* Eine Form an einen Platz setzen (Mitte cx/cy, Skala s) */
function platziereForm(formId, cx, cy, s, drehung, spiegeln, hex) {
  const f = FORMEN[formId];
  let transform = 'translate(' + zahl(cx) + ' ' + zahl(cy) + ')';
  if (drehung) transform += ' rotate(' + zahl(drehung) + ')';
  transform += ' scale(' + (spiegeln ? '-' : '') + zahl(s) + ' ' + zahl(s) + ')';
  transform += ' translate(-50 -50)';
  return '<g transform="' + transform + '" fill="' + hex + '" stroke="rgba(234,240,255,.85)"' +
         ' stroke-width="' + zahl(2.5 / s) + '" stroke-linejoin="round">' + f.svg + '</g>';
}

function svgRahmen(inhalt, name, klasse) {
  return '<svg class="' + (klasse || 'form') + '" viewBox="0 0 100 100" role="img" aria-label="' +
         String(name).replace(/"/g, '') + '">' + inhalt + '</svg>';
}

/* Eine einzelne Form, groß in der Mitte */
function formSvg(formId, einstellung) {
  const e = einstellung || {};
  const s = typeof e.groesse === 'number' ? e.groesse : (GROESSEN[e.groesse || 'gross'] || GROESSEN.gross);
  const figur = { form: formId, farbe: e.farbe || null, groesse: e.groesse || 'mittel',
                  drehung: e.drehung || 0, anzahl: 1, spiegeln: !!e.spiegeln };
  return svgRahmen(platziereForm(formId, 50, 50, s, e.drehung || 0, !!e.spiegeln, farbHex(e.farbe)),
                   e.name || figurName(figur));
}

/* Eine ganze Figur: Anzahl, Größe, Drehung, Platz */
function figurSvg(figur) {
  const f = normalisiereFigur(figur);
  const hex = farbHex(f.farbe);
  let inhalt = '';

  if (f.position) {
    // Leise Hilfspunkte zeigen, wo die Figur überall stehen könnte
    const plaetze = RANDPLAETZE.indexOf(f.position) !== -1 ? RANDPLAETZE : ['links', 'mitte', 'rechts'];
    for (const p of plaetze) {
      inhalt += '<circle cx="' + POSITIONEN[p][0] + '" cy="' + POSITIONEN[p][1] +
                '" r="4" fill="rgba(188,212,255,.25)"/>';
    }
    const ort = POSITIONEN[f.position];
    inhalt += platziereForm(f.form, ort[0], ort[1], 0.34, f.drehung, f.spiegeln, hex);
  } else {
    const lage = ANZAHL_PLAETZE[f.anzahl] || ANZAHL_PLAETZE[1];
    const faktor = f.anzahl === 1 ? GROESSEN[f.groesse] : lage.skala * GROESSEN[f.groesse] / GROESSEN.mittel;
    for (const p of lage.plaetze) {
      inhalt += platziereForm(f.form, p[0], p[1], faktor, f.drehung, f.spiegeln, hex);
    }
  }
  return svgRahmen(inhalt, figurName(f));
}

/* ============================================================
   NAMEN — richtig gebeugt: „rotes Dreieck“, „der lila Kreis“,
   „zwei kleine rote Dreiecke“
   ============================================================ */

const UNBEUGBAR = ['lila', 'orange', 'rosa'];
const ZAHLWOERTER = ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs'];

/* Endung eines Eigenschaftsworts im ersten Fall (Nominativ) */
function beuge(stamm, artikel, mitArtikel, plural) {
  if (UNBEUGBAR.indexOf(stamm) !== -1) return stamm;
  if (plural) return stamm + (mitArtikel ? 'en' : 'e');
  if (mitArtikel) return stamm + 'e';
  return stamm + { der: 'er', die: 'e', das: 'es' }[artikel];
}

function groessenWort(groesse) {
  if (groesse === 'klein') return 'klein';
  if (groesse === 'gross') return 'groß';
  return null;
}

/* Der Name der Form, z. B. „das rechtwinklige Dreieck“ oder „Raute“ */
function formWort(formId, wie) {
  const w = wie || {};
  const f = FORMEN[formId];
  const nomen = w.plural ? f.plural : f.name;
  const teile = [];
  if (w.artikel) teile.push(w.plural ? 'die' : f.artikel);
  for (const adj of w.adjektive || []) teile.push(beuge(adj, f.artikel, !!w.artikel, !!w.plural));
  if (f.adjektiv) teile.push(beuge(f.adjektiv, f.artikel, !!w.artikel, !!w.plural));
  teile.push(nomen);
  return teile.join(' ');
}

function formMitArtikel(formId) {
  return formWort(formId, { artikel: true });
}

/* „ein Kreis“, „eine Raute“, „ein Dreieck“ */
function formMitEin(formId) {
  const f = FORMEN[formId];
  return (f.artikel === 'die' ? 'eine ' : 'ein ') +
         (f.adjektiv ? beuge(f.adjektiv, f.artikel, false, false) + ' ' : '') + f.name;
}

/* „Der Kreis“ → „Er“ */
function pronomen(formId) {
  return { der: 'Er', die: 'Sie', das: 'Es' }[FORMEN[formId].artikel];
}

function grossAnfang(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function figurName(figur, wie) {
  const f = normalisiereFigur(figur);
  const w = wie || {};
  const adjektive = [];
  const gross = groessenWort(f.groesse);
  if (gross) adjektive.push(gross);
  if (f.farbe && f.farbe !== 'neutral') adjektive.push(farbe(f.farbe).name);

  if (f.anzahl > 1) {
    return ZAHLWOERTER[f.anzahl] + ' ' + formWort(f.form, { plural: true, adjektive: adjektive });
  }
  return formWort(f.form, { artikel: !!w.artikel, adjektive: adjektive });
}

/* ============================================================
   GLEICH AUSSEHEN?
   ============================================================ */

function normalisiereFigur(figur) {
  const f = Object.assign({
    form: 'kreis', farbe: null, groesse: 'mittel', drehung: 0,
    anzahl: 1, position: null, spiegeln: false
  }, figur || {});
  const ordnung = FORMEN[f.form] ? FORMEN[f.form].drehordnung : 1;
  let d = ((Math.round(f.drehung) % 360) + 360) % 360;
  if (ordnung === Infinity) d = 0;
  else if (ordnung > 1) d = d % (360 / ordnung);
  return {
    form: f.form, farbe: f.farbe || null, groesse: f.groesse || 'mittel', drehung: d,
    anzahl: f.anzahl || 1, position: f.position || null,
    spiegeln: !!(f.spiegeln && FORMEN[f.form] && FORMEN[f.form].chiral)
  };
}

function figurSchluessel(figur) {
  return JSON.stringify(normalisiereFigur(figur));
}

function figurenGleich(a, b) {
  return figurSchluessel(a) === figurSchluessel(b);
}

/* ============================================================
   GITTER — Felder sind {x, y}; x nach rechts, y nach unten
   ============================================================ */

function zellenSchluessel(zellen) {
  return zellen.map(function (z) { return z.x + ',' + z.y; })
    .filter(function (k, i, alle) { return alle.indexOf(k) === i; })
    .sort().join(';');
}

function enthaeltZelle(zellen, x, y) {
  return zellen.some(function (z) { return z.x === x && z.y === y; });
}

/* An einer Achse spiegeln. breite/hoehe = Größe des Gitters.
   senkrecht: links ↔ rechts, waagerecht: oben ↔ unten,
   diagonal: von oben links nach unten rechts, gegendiagonal: die andere */
function spiegleZellen(zellen, breite, hoehe, achse) {
  if (hoehe === undefined) hoehe = breite;
  return zellen.map(function (z) {
    if (achse === 'senkrecht') return { x: breite - 1 - z.x, y: z.y };
    if (achse === 'waagerecht') return { x: z.x, y: hoehe - 1 - z.y };
    if (achse === 'diagonal') return { x: z.y, y: z.x };
    if (achse === 'gegendiagonal') return { x: breite - 1 - z.y, y: breite - 1 - z.x };
    throw new Error('unbekannte Achse ' + achse);
  });
}

/* Im Uhrzeigersinn um die Mitte eines n×n-Gitters drehen */
function dreheZellen(zellen, n, grad) {
  let ergebnis = zellen.map(function (z) { return { x: z.x, y: z.y }; });
  const schritte = ((Math.round(grad / 90) % 4) + 4) % 4;
  for (let s = 0; s < schritte; s++) {
    ergebnis = ergebnis.map(function (z) { return { x: n - 1 - z.y, y: z.x }; });
  }
  return ergebnis;
}

/* In die linke obere Ecke schieben — so vergleicht man die Form,
   egal wo sie im Gitter steht */
function normiereZellen(zellen) {
  const minX = Math.min.apply(null, zellen.map(function (z) { return z.x; }));
  const minY = Math.min.apply(null, zellen.map(function (z) { return z.y; }));
  return zellen.map(function (z) { return { x: z.x - minX, y: z.y - minY }; });
}

function formSchluessel(zellen) {
  return zellenSchluessel(normiereZellen(zellen));
}

/* Die vier Drehungen einer Gitterfigur (als Form-Schlüssel) */
function drehSchluessel(zellen) {
  const n = 1 + Math.max.apply(null, zellen.map(function (z) { return Math.max(z.x, z.y); }));
  const liste = [];
  for (const g of [0, 90, 180, 270]) {
    const k = formSchluessel(dreheZellen(zellen, n, g));
    if (liste.indexOf(k) === -1) liste.push(k);
  }
  return liste;
}

/* Chiral = das Spiegelbild lässt sich durch keine Drehung erreichen */
function istChiral(zellen) {
  const n = 1 + Math.max.apply(null, zellen.map(function (z) { return Math.max(z.x, z.y); }));
  const gedreht = drehSchluessel(zellen);
  const gespiegelt = drehSchluessel(spiegleZellen(zellen, n, n, 'senkrecht'));
  return gespiegelt.every(function (k) { return gedreht.indexOf(k) === -1; });
}

/* Wie viele zusammenhängende Teile (Nachbarn über eine Kante)? */
function zaehleTeile(zellen) {
  const offen = zellen.map(function (z) { return z.x + ',' + z.y; });
  let teile = 0;
  while (offen.length) {
    teile += 1;
    const stapel = [offen.pop()];
    while (stapel.length) {
      const [x, y] = stapel.pop().split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = (x + dx) + ',' + (y + dy);
        const i = offen.indexOf(k);
        if (i !== -1) { offen.splice(i, 1); stapel.push(k); }
      }
    }
  }
  return teile;
}

function zusammenhaengend(zellen) {
  return zellen.length > 0 && zaehleTeile(zellen) === 1;
}

/* Eine zufällige zusammenhängende Figur aus k Feldern wachsen lassen,
   nur in den erlaubten Feldern (erlaubt(x, y) → true/false) */
function wachseFigur(k, breite, hoehe, erlaubt) {
  const darf = erlaubt || function () { return true; };
  for (let versuch = 0; versuch < 200; versuch++) {
    const start = { x: zufall(0, breite - 1), y: zufall(0, hoehe - 1) };
    if (!darf(start.x, start.y)) continue;
    const figur = [start];
    let klemmt = 0;
    while (figur.length < k && klemmt < 100) {
      const von = zufallsElement(figur);
      const [dx, dy] = zufallsElement([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const x = von.x + dx, y = von.y + dy;
      if (x < 0 || y < 0 || x >= breite || y >= hoehe || !darf(x, y) || enthaeltZelle(figur, x, y)) {
        klemmt += 1;
        continue;
      }
      figur.push({ x: x, y: y });
    }
    if (figur.length === k) return figur;
  }
  return null;
}

/* Ein Gitter als Bild (für Auswahlknöpfe) */
function gitterSvg(zellen, n, einstellung) {
  const e = einstellung || {};
  const g = 100 / n;
  let inhalt = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const an = enthaeltZelle(zellen, x, y);
      inhalt += '<rect x="' + zahl(x * g + 1.5) + '" y="' + zahl(y * g + 1.5) + '" width="' + zahl(g - 3) +
                '" height="' + zahl(g - 3) + '" rx="3" fill="' +
                (an ? (e.hex || '#ffe14d') : 'rgba(188,212,255,.12)') + '"/>';
    }
  }
  return svgRahmen(inhalt, e.name || 'Gitterfigur', 'gitterbild');
}
