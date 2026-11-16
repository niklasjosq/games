/* ============================================================
   AUFMERKSAMKEIT — genau hinsehen und dranbleiben.

   Suchbild, Fehlerbild, Zahlentabelle, Linien verfolgen und
   Pfeil oder Wort. Wie die anderen Übungsdateien kennt auch
   diese keine Seite: Sie baut nur Aufgaben und SVG-Text.
   ============================================================ */

/* Ein Feld beim Namen nennen — auch in Gittern, die nicht quadratisch sind */
function feldNameRechteck(x, y, breite, hoehe) {
  return feldName(x, y, breite === 3 && hoehe === 3 ? 3 : 0);
}

/* „Karte 1, 4 und 6“ */
function aufzaehlung(liste) {
  if (liste.length <= 1) return liste.join('');
  return liste.slice(0, -1).join(', ') + ' und ' + liste[liste.length - 1];
}

const SCHRIFT = 'Arial, Helvetica, sans-serif';

/* Ein Buchstabe oder eine Ziffer als Bild */
function zeichenSvg(zeichen, name) {
  return svgRahmen('<text x="50" y="74" text-anchor="middle" font-size="72" font-weight="700" font-family="' +
                   SCHRIFT + '" fill="#eaf0ff">' + zeichen + '</text>', name);
}

/* „ein großer Kreis“, „eine kleine Raute“, „ein großes Dreieck“ */
function einFigur(formId, groesse) {
  return (FORMEN[formId].artikel === 'die' ? 'eine ' : 'ein ') + figurName({ form: formId, groesse: groesse });
}

/* ============================================================
   SUCHBILD — alle Ziele in einem vollen Bild finden
   ============================================================ */

const SUCH_FORMEN = ['kreis', 'dreieck', 'quadrat', 'stern', 'herz', 'sechseck'];
const RICHTUNGS_NAMEN = { 0: 'oben', 90: 'rechts', 180: 'unten', 270: 'links' };
const BUCHSTABEN_LAGE = { b: ['oben', 'rechts'], d: ['oben', 'links'], p: ['unten', 'rechts'], q: ['unten', 'links'] };

function suchElement(schluessel, svg, name) {
  return { schluessel: schluessel, svg: svg, name: name };
}

/* Jede Art liefert: das Ziel, die Ablenker, was gesucht ist und einen Trick */
const SUCH_ARTEN = {
  form: function (p) {
    const formen = mischen(SUCH_FORMEN.slice()).slice(0, p.sorten);
    const el = function (f) { return suchElement(f, formSvg(f, { groesse: 'mittel' }), formMitEin(f)); };
    return {
      ziel: el(formen[0]), ablenker: formen.slice(1).map(el),
      gesucht: 'alle ' + FORMEN[formen[0]].plural,
      trick: 'Trick: Sag dir das Ziel leise vor („' + FORMEN[formen[0]].plural + '!“) und lies das Bild wie eine Buchseite – Zeile für Zeile.',
      thema: 'suchenForm'
    };
  },

  richtung: function (p) {
    const richtungen = mischen([0, 90, 180, 270]);
    const el = function (d) {
      const name = 'ein Dreieck, das nach ' + RICHTUNGS_NAMEN[d] + ' zeigt';
      return suchElement('dreieck' + d, formSvg('dreieck', { drehung: d, groesse: 'mittel', name: 'Dreieck nach ' + RICHTUNGS_NAMEN[d] }), name);
    };
    return {
      ziel: el(richtungen[0]), ablenker: richtungen.slice(1, p.sorten).map(el),
      gesucht: 'alle Dreiecke, die nach ' + RICHTUNGS_NAMEN[richtungen[0]] + ' zeigen',
      trick: 'Trick: Schau bei jedem Dreieck nur auf die Spitze – zeigt sie nach ' + RICHTUNGS_NAMEN[richtungen[0]] + '?',
      thema: 'richtung'
    };
  },

  buchstabe: function (p) {
    const b = mischen(['b', 'd', 'p', 'q']);
    const el = function (z) { return suchElement('z' + z, zeichenSvg(z, 'Buchstabe ' + z), 'ein „' + z + '“'); };
    const lage = BUCHSTABEN_LAGE[b[0]];
    return {
      ziel: el(b[0]), ablenker: b.slice(1, p.sorten).map(el),
      gesucht: 'alle „' + b[0] + '“',
      trick: 'Trick: Frag dich zwei Dinge – geht der Strich nach oben oder unten, und ist der Bauch links oder rechts? ' +
             'Beim „' + b[0] + '“ geht der Strich nach ' + lage[0] + ' und der Bauch ist ' + lage[1] + '.',
      thema: 'buchstaben'
    };
  },

  groesseForm: function (p) {
    const formen = mischen(['kreis', 'dreieck', 'quadrat', 'stern']).slice(0, 2);
    const groessen = mischen(['gross', 'klein']);
    const el = function (f, g) { return suchElement(f + g, formSvg(f, { groesse: g }), einFigur(f, g)); };
    const ziel = el(formen[0], groessen[0]);
    const ablenker = [el(formen[0], groessen[1]), el(formen[1], groessen[0]), el(formen[1], groessen[1])];
    return {
      ziel: ziel, ablenker: ablenker.slice(0, p.sorten - 1),
      gesucht: 'alle ' + formWort(formen[0], { plural: true, artikel: true, adjektive: [groessenWort(groessen[0])] }).replace(/^die /, ''),
      trick: 'Trick: Hier müssen zwei Dinge stimmen – die Form UND die Größe. ' +
             grossAnfang(einFigur(formen[0], groessen[1])) + ' zählt nicht, ' + einFigur(formen[1], groessen[0]) + ' auch nicht.',
      thema: 'zweiMerkmale'
    };
  },

  richtungForm: function (p) {
    const richtungen = mischen([0, 90, 180, 270]);
    const d = richtungen[0];
    const pfeil = function (r) {
      return suchElement('pfeil' + r, formSvg('pfeil', { drehung: r, groesse: 'mittel', name: 'Pfeil nach ' + RICHTUNGS_NAMEN[r] }),
                         'ein Pfeil nach ' + RICHTUNGS_NAMEN[r]);
    };
    const dreieck = suchElement('dreieck' + d, formSvg('dreieck', { drehung: d, groesse: 'mittel', name: 'Dreieck nach ' + RICHTUNGS_NAMEN[d] }),
                                'ein Dreieck nach ' + RICHTUNGS_NAMEN[d]);
    const ablenker = [dreieck].concat(richtungen.slice(1).map(pfeil));
    return {
      ziel: pfeil(d), ablenker: ablenker.slice(0, p.sorten - 1),
      gesucht: 'alle Pfeile, die nach ' + RICHTUNGS_NAMEN[d] + ' zeigen',
      trick: 'Trick: Zwei Dinge müssen stimmen – es muss ein Pfeil sein UND er muss nach ' + RICHTUNGS_NAMEN[d] +
             ' zeigen. Ein Dreieck nach ' + RICHTUNGS_NAMEN[d] + ' ist eine Falle.',
      thema: 'zweiMerkmale'
    };
  },

  ziffer: function (p) {
    const ziel = zufallsElement(['6', '9']);
    const ablenker = [ziel === '6' ? '9' : '6', '8', '0'];
    const el = function (z) { return suchElement('z' + z, zeichenSvg(z, 'Ziffer ' + z), 'eine ' + z); };
    return {
      ziel: el(ziel), ablenker: ablenker.slice(0, p.sorten - 1).map(el),
      gesucht: ziel === '6' ? 'alle Sechsen' : 'alle Neunen',
      trick: 'Trick: Die 6 hat ihren Bauch unten, die 9 hat ihn oben. Die 8 hat zwei Bäuche, die 0 gar keinen.',
      thema: 'ziffern'
    };
  }
};

const SUCH_STUFEN = [
  { breite: 4, hoehe: 4, art: 'form',         sorten: 3, ziele: [3, 4], zahlNennen: true },
  { breite: 5, hoehe: 4, art: 'form',         sorten: 4, ziele: [4, 5], zahlNennen: true },
  { breite: 5, hoehe: 5, art: 'richtung',     sorten: 4, ziele: [4, 6], zahlNennen: true },
  { breite: 5, hoehe: 5, art: 'buchstabe',    sorten: 3, ziele: [4, 6], zahlNennen: true },
  { breite: 6, hoehe: 5, art: 'groesseForm',  sorten: 4, ziele: [4, 7], zahlNennen: false },
  { breite: 6, hoehe: 6, art: 'buchstabe',    sorten: 4, ziele: [5, 8], zahlNennen: false },
  { breite: 6, hoehe: 6, art: 'richtungForm', sorten: 4, ziele: [5, 8], zahlNennen: false },
  { breite: 7, hoehe: 6, art: 'ziffer',       sorten: 4, ziele: [5, 9], zahlNennen: false }
];

function macheSuchbild(stufe) {
  const p = parameterFuer('suchbild', stufe);
  const s = SUCH_ARTEN[p.art](p);
  const anzahl = p.breite * p.hoehe;
  const zielZahl = zufall(p.ziele[0], p.ziele[1]);

  // Erst die Ziele, dann jeder Ablenker mindestens einmal, der Rest zufällig
  const felder = [];
  for (let i = 0; i < zielZahl; i++) felder.push(s.ziel);
  for (const a of s.ablenker) felder.push(a);
  while (felder.length < anzahl) felder.push(zufallsElement(s.ablenker));
  mischen(felder);

  const richtig = [];
  felder.forEach(function (f, i) {
    if (f === s.ziel) richtig.push({ x: i % p.breite, y: Math.floor(i / p.breite) });
  });

  return {
    uebung: 'suchbild', stufe: stufe, art: 'gitter',
    frage: 'Gesucht: ' + s.gesucht + '. Tippe sie alle an' +
           (p.zahlNennen ? ' – es sind ' + zielZahl + '.' : '. Wie viele es sind, musst du selbst herausfinden.'),
    anzeige: {
      breite: p.breite, hoehe: p.hoehe, zeigeZuerst: [], vorgabe: [], achse: null,
      ziel: p.zahlNennen ? zielZahl : null,
      inhalte: felder.map(function (f) { return f.svg; }),
      namen: felder.map(function (f) { return f.name; })
    },
    richtig: richtig,
    erklaerung: 'Gesucht waren ' + s.gesucht + ' – es waren ' + zielZahl + '. ' + s.trick,
    themen: [s.thema],
    // für die Selbsttests
    zielSchluessel: s.ziel.schluessel,
    schluessel: felder.map(function (f) { return f.schluessel; })
  };
}

/* Gemeinsam für Suchbild und Fehlerbild: was gefunden, was übersehen, was zu viel? */
function vergleicheZellen(aufgabe, antwort) {
  const soll = aufgabe.richtig;
  const ist = antwort || [];
  return {
    treffer: ist.filter(function (c) { return enthaeltZelle(soll, c.x, c.y); }).length,
    fehlt: soll.filter(function (c) { return !enthaeltZelle(ist, c.x, c.y); }),
    zuviel: ist.filter(function (c) { return !enthaeltZelle(soll, c.x, c.y); })
  };
}

function suchFehlerText(aufgabe, antwort) {
  const z = aufgabe.anzeige;
  const v = vergleicheZellen(aufgabe, antwort);
  let text = 'Du hast ' + v.treffer + ' von ' + aufgabe.richtig.length + ' gefunden.';
  if (v.fehlt.length) {
    const f = v.fehlt[0];
    text += ' Übersehen ' + (v.fehlt.length === 1 ? 'hast du eins' : 'hast du ' + v.fehlt.length) +
            ', zum Beispiel ' + feldNameRechteck(f.x, f.y, z.breite, z.hoehe) + '.';
  }
  if (v.zuviel.length) {
    const c = v.zuviel[0];
    text += ' ' + grossAnfang(feldNameRechteck(c.x, c.y, z.breite, z.hoehe)) + ' war ' +
            z.namen[c.y * z.breite + c.x] + ' – das gehört nicht dazu.';
  }
  return text;
}

uebung('suchbild', {
  gruppe: 'aufmerksamkeit',
  titel: 'Suchbild',
  symbol: '🔍',
  alter: [8, 10],
  beschreibung: 'In einem vollen Bild alle Sterne, alle „d“ oder alle Pfeile nach rechts finden – ohne eins zu übersehen.',
  lernziel: 'Du übst, gründlich zu suchen und dich nicht von ähnlichen Dingen täuschen zu lassen – so wie beim Korrekturlesen deines Diktats.',
  tipps: [
    'Such Zeile für Zeile, von links nach rechts – wie beim Lesen. So rutscht dir nichts durch.',
    'Sag dir leise vor, was du suchst. Wenn die Anzahl nicht dasteht: Geh am Ende noch einmal alle Zeilen durch.'
  ],
  tippAbStufe: { 4: 'Bei b, d, p und q hilft die Frage: Strich oben oder unten? Bauch links oder rechts?' },
  stufen: SUCH_STUFEN,
  beispiel: function () {
    return ['kreis', 'stern', 'quadrat', 'stern'].map(function (f) { return formSvg(f, { groesse: 'mittel' }); }).join('');
  },
  macheAufgabe: macheSuchbild,
  fehlerText: suchFehlerText,
  rundenLaenge: function () { return 6; },
  zeitMitUhr: function (aufgabe) { return Math.ceil(aufgabe.anzeige.inhalte.length * 1.2) + 5; }
});

/* ============================================================
   FEHLERBILD — zwei Bilder vergleichen, Unterschiede antippen
   ============================================================ */

const FEHLER_FORMEN = ['kreis', 'dreieck', 'quadrat', 'stern', 'herz', 'pfeil', 'flagge', 'lForm', 'halbkreis', 'trapez'];

const FEHLER_STUFEN = [
  { breite: 3, hoehe: 3, belegt: 7,  unterschiede: 1, arten: ['form', 'fehlt'] },
  { breite: 3, hoehe: 3, belegt: 8,  unterschiede: 2, arten: ['form', 'fehlt', 'farbe'] },
  { breite: 4, hoehe: 3, belegt: 10, unterschiede: 2, arten: ['form', 'fehlt', 'farbe', 'groesse', 'neu'] },
  { breite: 4, hoehe: 4, belegt: 12, unterschiede: 3, arten: ['form', 'farbe', 'groesse', 'drehung', 'fehlt', 'neu'] },
  { breite: 4, hoehe: 4, belegt: 14, unterschiede: 3, arten: ['farbe', 'groesse', 'drehung', 'form'] },
  { breite: 5, hoehe: 4, belegt: 16, unterschiede: 3, arten: ['farbe', 'groesse', 'drehung', 'spiegeln'] },
  { breite: 5, hoehe: 5, belegt: 20, unterschiede: 4, arten: ['farbe', 'groesse', 'drehung', 'spiegeln', 'form'] },
  { breite: 5, hoehe: 5, belegt: 22, unterschiede: 5, arten: ['farbe', 'groesse', 'drehung', 'spiegeln'] }
];

function zufallsFigur(farben) {
  const form = zufallsElement(FEHLER_FORMEN);
  return {
    form: form, farbe: zufallsElement(farben), groesse: 'mittel',
    drehung: FORMEN[form].drehordnung === 1 ? zufallsElement([0, 90, 180, 270]) : 0, spiegeln: false
  };
}

function figurOderLeer(f) {
  return f ? figurSchluessel(f) : 'leer';
}

/* Jede Veränderung: passt sie zu diesem Feld, und was wird daraus? */
const VERAENDERUNGEN = {
  form: {
    passt: function (f) { return !!f; },
    mache: function (f) {
      const neu = zufallsElement(FEHLER_FORMEN.filter(function (x) { return x !== f.form; }));
      return { figur: Object.assign({}, f, { form: neu, drehung: 0, spiegeln: false }),
               text: 'vorher ' + formMitEin(f.form) + ', jetzt ' + formMitEin(neu) };
    }
  },
  farbe: {
    passt: function (f, farben) { return !!f && farben.length > 1; },
    mache: function (f, farben) {
      const neu = zufallsElement(farben.filter(function (c) { return c !== f.farbe; }));
      return { figur: Object.assign({}, f, { farbe: neu }),
               text: grossAnfang(formMitArtikel(f.form)) + ' war vorher ' + farbe(f.farbe).name + ' und ist jetzt ' + farbe(neu).name };
    }
  },
  groesse: {
    passt: function (f) { return !!f; },
    mache: function (f) {
      const neu = zufallsElement(['klein', 'gross']);
      return { figur: Object.assign({}, f, { groesse: neu }),
               text: grossAnfang(formMitArtikel(f.form)) + ' ist jetzt ' + (neu === 'klein' ? 'kleiner' : 'größer') };
    }
  },
  drehung: {
    passt: function (f) { return !!f && FORMEN[f.form].drehordnung === 1; },
    mache: function (f) {
      return { figur: Object.assign({}, f, { drehung: (f.drehung + zufallsElement([90, 180, 270])) % 360 }),
               text: grossAnfang(formMitArtikel(f.form)) + ' ist gedreht' };
    }
  },
  spiegeln: {
    passt: function (f) { return !!f && FORMEN[f.form].chiral; },
    mache: function (f) {
      return { figur: Object.assign({}, f, { spiegeln: !f.spiegeln }),
               text: grossAnfang(formMitArtikel(f.form)) + ' ist gespiegelt' };
    }
  },
  fehlt: {
    passt: function (f) { return !!f; },
    mache: function (f) {
      return { figur: null, text: grossAnfang(formMitArtikel(f.form)) + ' fehlt' };
    }
  },
  neu: {
    passt: function (f) { return !f; },
    mache: function (f, farben) {
      const neu = zufallsFigur(farben);
      return { figur: neu, text: grossAnfang(formMitEin(neu.form)) + ' ist dazugekommen' };
    }
  }
};

function macheFehlerbild(stufe) {
  const p = parameterFuer('fehlerbild', stufe);
  const anzahl = p.breite * p.hoehe;

  for (let versuch = 0; versuch < 200; versuch++) {
    const farben = waehleFarben(3);
    const vorher = [];
    for (let i = 0; i < anzahl; i++) vorher.push(null);
    const plaetze = mischen(vorher.map(function (_, i) { return i; })).slice(0, p.belegt);
    for (const i of plaetze) vorher[i] = zufallsFigur(farben);

    const nachher = vorher.slice();
    const unterschiede = [];
    const arten = mischen(p.arten.slice());
    let klappt = true;

    for (let u = 0; u < p.unterschiede && klappt; u++) {
      let gefunden = false;
      for (let t = 0; t < 400 && !gefunden; t++) {
        // Erst die vorgesehene Art versuchen, damit es abwechslungsreich wird
        const art = t < 200 ? arten[u % arten.length] : zufallsElement(p.arten);
        const i = zufall(0, anzahl - 1);
        if (unterschiede.some(function (d) { return d.i === i; })) continue;
        const v = VERAENDERUNGEN[art];
        if (!v.passt(vorher[i], farben)) continue;
        const r = v.mache(vorher[i], farben);
        if (figurOderLeer(r.figur) === figurOderLeer(vorher[i])) continue;
        nachher[i] = r.figur;
        unterschiede.push({ i: i, x: i % p.breite, y: Math.floor(i / p.breite), art: art, text: r.text });
        gefunden = true;
      }
      if (!gefunden) klappt = false;
    }
    if (!klappt) continue;

    const svg = function (f) { return f ? figurSvg(f) : ''; };
    const name = function (f) { return f ? figurName(f) : 'leer'; };
    const n = p.unterschiede;
    unterschiede.sort(function (a, b) { return a.i - b.i; });

    return {
      uebung: 'fehlerbild', stufe: stufe, art: 'gitter',
      frage: 'Oben ist die Vorlage. Im Bild darunter ' + (n === 1 ? 'ist ein Feld anders. Tippe es an.' : 'sind ' + n + ' Felder anders. Tippe sie an.'),
      anzeige: {
        breite: p.breite, hoehe: p.hoehe, zeigeZuerst: [], vorgabe: [], achse: null, ziel: n,
        inhalte: nachher.map(svg), namen: nachher.map(name),
        vergleich: { breite: p.breite, hoehe: p.hoehe, inhalte: vorher.map(svg), titel: 'Vorlage' }
      },
      richtig: unterschiede.map(function (d) { return { x: d.x, y: d.y }; }),
      erklaerung: (n === 1 ? 'Der Unterschied: ' : 'Die Unterschiede: ') + unterschiede.map(function (d) {
        return feldNameRechteck(d.x, d.y, p.breite, p.hoehe) + ': ' + d.text;
      }).join(' · ') + '.',
      themen: ['unterschiede'],
      // für die Selbsttests
      unterschiede: unterschiede, vorher: vorher, nachher: nachher, farben: farben
    };
  }
  throw new Error('kein Fehlerbild für Stufe ' + stufe);
}

function fehlerbildFehlerText(aufgabe, antwort) {
  const z = aufgabe.anzeige;
  const v = vergleicheZellen(aufgabe, antwort);
  let text = 'Du hast ' + v.treffer + ' von ' + aufgabe.richtig.length + ' Unterschieden gefunden.';
  if (v.fehlt.length) {
    const d = aufgabe.unterschiede.filter(function (u) { return u.x === v.fehlt[0].x && u.y === v.fehlt[0].y; })[0];
    text += ' Übersehen: ' + feldNameRechteck(d.x, d.y, z.breite, z.hoehe) + ' – ' + d.text + '.';
  }
  if (v.zuviel.length) {
    const c = v.zuviel[0];
    text += ' ' + grossAnfang(feldNameRechteck(c.x, c.y, z.breite, z.hoehe)) + ' ist in beiden Bildern gleich.';
  }
  return text;
}

uebung('fehlerbild', {
  gruppe: 'aufmerksamkeit',
  titel: 'Fehlerbild',
  symbol: '🖼️',
  alter: [8, 10],
  beschreibung: 'Zwei Bilder, fast gleich: Wo hat sich eine Form, eine Farbe, die Größe oder die Drehung verändert?',
  lernziel: 'Du übst, zwei Dinge genau zu vergleichen – wie beim Abschreiben von der Tafel, wenn du prüfst, ob alles stimmt.',
  tipps: [
    'Vergleiche Feld für Feld: erst oben links in beiden Bildern, dann das Feld daneben.',
    'Frag bei jedem Feld: Gleiche Form? Gleiche Farbe? Gleiche Größe? Gleich gedreht?'
  ],
  tippAbStufe: { 6: 'Gespiegelt heißt: wie im Spiegel umgeklappt. Die Flagge weht dann zur anderen Seite.' },
  stufen: FEHLER_STUFEN,
  beispiel: function () {
    return formSvg('herz', { farbe: 'blau' }) + formSvg('herz', { farbe: 'gelb' });
  },
  macheAufgabe: macheFehlerbild,
  fehlerText: fehlerbildFehlerText,
  rundenLaenge: function () { return 6; },
  zeitMitUhr: function (aufgabe) { return 15 + 3 * aufgabe.anzeige.inhalte.length; }
});

/* ============================================================
   ZAHLENTABELLE — Zahlen der Reihe nach antippen
   ============================================================ */

const TABELLEN_STUFEN = [
  { n: 3, art: 'auf',     markieren: true,  zeigeZiel: true,  erlaubt: 1 },
  { n: 4, art: 'auf',     markieren: true,  zeigeZiel: true,  erlaubt: 2 },
  { n: 4, art: 'auf',     markieren: false, zeigeZiel: true,  erlaubt: 2 },
  { n: 5, art: 'auf',     markieren: true,  zeigeZiel: false, erlaubt: 2 },
  { n: 5, art: 'auf',     markieren: false, zeigeZiel: true,  erlaubt: 2 },
  { n: 5, art: 'ab',      markieren: false, zeigeZiel: true,  erlaubt: 2 },
  { n: 4, art: 'wechsel', markieren: true,  zeigeZiel: false, erlaubt: 2 },
  { n: 5, art: 'gegen',   markieren: false, zeigeZiel: false, erlaubt: 3 }
];

function macheZahlentabelle(stufe) {
  const p = parameterFuer('zahlentabelle', stufe);
  const anzahl = p.n * p.n;
  const felder = [];
  let reihe = [];
  let frage, erklaerung;

  if (p.art === 'auf' || p.art === 'ab') {
    for (let i = 1; i <= anzahl; i++) felder.push({ id: 'n' + i, text: String(i), sorte: null, name: String(i) });
    reihe = felder.map(function (f) { return f.id; });
    if (p.art === 'ab') {
      reihe.reverse();
      frage = '↩ Rückwärts! Tippe die Zahlen von ' + anzahl + ' bis 1 der Reihe nach an.';
      erklaerung = 'Die Reihenfolge war ' + anzahl + ', ' + (anzahl - 1) + ', ' + (anzahl - 2) + ' … bis 1.';
    } else {
      frage = 'Tippe die Zahlen von 1 bis ' + anzahl + ' der Reihe nach an.';
      erklaerung = 'Die Reihenfolge war 1, 2, 3 … bis ' + anzahl + '.';
    }
    erklaerung += ' Trick: Lass den Blick in der Mitte der Tabelle ruhen – so siehst du viele Felder auf einmal.';
  } else {
    const kreise = Math.ceil(anzahl / 2);
    const quadrate = Math.floor(anzahl / 2);
    for (let i = 1; i <= kreise; i++) felder.push({ id: 'k' + i, text: String(i), sorte: 'kreis', name: 'Kreis ' + i });
    for (let i = 1; i <= quadrate; i++) felder.push({ id: 'q' + i, text: String(i), sorte: 'quadrat', name: 'Quadrat ' + i });
    for (let i = 1; i <= kreise; i++) {
      reihe.push('k' + i);
      if (i <= quadrate) reihe.push(p.art === 'wechsel' ? 'q' + i : 'q' + (quadrate + 1 - i));
    }
    if (p.art === 'wechsel') {
      frage = 'Immer abwechselnd: ⚪ Kreis 1, ⬜ Quadrat 1, ⚪ Kreis 2, ⬜ Quadrat 2 … bis zum Schluss.';
      erklaerung = 'Die Reihenfolge war Kreis 1, Quadrat 1, Kreis 2, Quadrat 2 … – beide zählen hoch, immer im Wechsel.';
    } else {
      frage = 'Kreise zählen hoch, Quadrate zählen runter – abwechselnd: ⚪ 1, ⬜ ' + quadrate + ', ⚪ 2, ⬜ ' + (quadrate - 1) + ' …';
      erklaerung = 'Die Reihenfolge war Kreis 1, Quadrat ' + quadrate + ', Kreis 2, Quadrat ' + (quadrate - 1) +
                   ' … bis Kreis ' + kreise + '. Die Kreise zählen hoch, die Quadrate runter.';
    }
    erklaerung += ' Trick: Sag dir leise beide Zahlen vor, die als Nächstes dran sind.';
  }
  mischen(felder);

  return {
    uebung: 'zahlentabelle', stufe: stufe, art: 'antippen',
    frage: frage,
    anzeige: { breite: p.n, hoehe: p.n, felder: felder, markieren: p.markieren, zeigeZiel: p.zeigeZiel },
    richtig: reihe,
    erlaubt: p.erlaubt,
    erklaerung: erklaerung,
    themen: [p.art === 'wechsel' || p.art === 'gegen' ? 'tabelleWechsel' : 'tabelle']
  };
}

uebung('zahlentabelle', {
  gruppe: 'aufmerksamkeit',
  titel: 'Zahlentabelle',
  symbol: '🔢',
  alter: [9, 12],
  beschreibung: 'Zahlen stehen durcheinander. Tippe sie der Reihe nach an – später rückwärts oder im Wechsel zwischen Kreisen und Quadraten.',
  lernziel: 'Du übst, lange bei einer Sache zu bleiben und den Überblick zu behalten – das hilft bei langen Aufgaben, Tests und Hausaufgaben.',
  tipps: [
    'Schau in die Mitte der Tabelle und such mit den Augen, nicht mit dem Finger.',
    'Ein falscher Tipp ist nicht schlimm – aber in Ruhe suchen ist oft schneller als hektisch tippen.'
  ],
  tippAbStufe: { 7: 'Beim Abwechseln hilft es, die beiden nächsten Zahlen leise vorzusagen: „Kreis 3, Quadrat 3“.' },
  stufen: TABELLEN_STUFEN,
  beispiel: function () {
    return svgRahmen('<g font-family="' + SCHRIFT + '" font-size="22" font-weight="700" fill="#eaf0ff" text-anchor="middle">' +
      [[7, 2, 5], [1, 9, 4], [8, 3, 6]].map(function (zeile, y) {
        return zeile.map(function (z, x) { return '<text x="' + (20 + x * 30) + '" y="' + (28 + y * 30) + '">' + z + '</text>'; }).join('');
      }).join('') + '</g>', 'eine Zahlentabelle');
  },
  macheAufgabe: macheZahlentabelle,
  fehlerText: function (aufgabe, antwort) {
    const st = antwort || {};
    if (st.fertig === false) {
      return 'Du hast ' + (st.geschafft || 0) + ' von ' + aufgabe.richtig.length + ' Feldern geschafft.';
    }
    return 'Geschafft, aber mit ' + st.fehlgriffe + ' Fehlgriffen – erlaubt ' + (aufgabe.erlaubt === 1 ? 'ist einer' : 'sind ' + aufgabe.erlaubt) +
           '. Lieber etwas langsamer und dafür genau.';
  },
  rundenLaenge: function () { return 4; },
  zeitMitUhr: function (aufgabe) {
    const wechsel = aufgabe.anzeige.felder.some(function (f) { return f.sorte; });
    return Math.ceil(aufgabe.richtig.length * (wechsel ? 3 : 2.2)) + 5;
  }
});

/* ============================================================
   LINIEN VERFOLGEN — wo kommt die Linie an?
   Die Linien liegen in Spuren. Zwischen zwei Spalten tauschen
   Nachbarn ihre Spur — jeder Tausch ist genau eine Kreuzung.
   ============================================================ */

const LINIEN_STUFEN = [
  { n: 3, kreuzungen: 2,  abschnitte: 3, farbig: true },
  { n: 3, kreuzungen: 3,  abschnitte: 4, farbig: true },
  { n: 4, kreuzungen: 4,  abschnitte: 4, farbig: true },
  { n: 4, kreuzungen: 5,  abschnitte: 5, farbig: false },
  { n: 5, kreuzungen: 6,  abschnitte: 5, farbig: false },
  { n: 5, kreuzungen: 8,  abschnitte: 6, farbig: false },
  { n: 6, kreuzungen: 9,  abschnitte: 6, farbig: false },
  { n: 6, kreuzungen: 12, abschnitte: 7, farbig: false }
];
const LINIEN_BUCHSTABEN = 'ABCDEF';
const LINIEN_FARBEN = ['blau', 'gelb', 'rot', 'lila'];

/* c Nachbarpaare (i, i+1), die sich nicht überschneiden — oder null */
function waehleNachbarpaare(n, c) {
  for (let versuch = 0; versuch < 60; versuch++) {
    const belegt = new Set();
    const paare = [];
    for (const i of mischen(Array.from({ length: n - 1 }, function (_, k) { return k; }))) {
      if (paare.length >= c) break;
      if (belegt.has(i) || belegt.has(i + 1)) continue;
      belegt.add(i); belegt.add(i + 1);
      paare.push(i);
    }
    if (paare.length === c) return paare;
  }
  return null;
}

/* Spalten: für jede Spalte, welche Linie in welcher Spur liegt */
function baueLinienSpalten(p) {
  const proAbschnitt = Math.floor(p.n / 2);
  for (let versuch = 0; versuch < 100; versuch++) {
    const proSpalte = [];
    for (let i = 0; i < p.abschnitte; i++) proSpalte.push(0);
    for (let k = 0; k < p.kreuzungen; k++) {
      const frei = proSpalte.map(function (z, i) { return z < proAbschnitt ? i : -1; }).filter(function (i) { return i !== -1; });
      proSpalte[zufallsElement(frei)] += 1;
    }
    const spalten = [Array.from({ length: p.n }, function (_, i) { return i; })];
    const kreuzt = spalten[0].map(function () { return 0; });
    let klappt = true;
    for (let a = 0; a < p.abschnitte && klappt; a++) {
      const neu = spalten[spalten.length - 1].slice();
      const paare = waehleNachbarpaare(p.n, proSpalte[a]);
      if (!paare) { klappt = false; break; }
      for (const i of paare) {
        const merk = neu[i]; neu[i] = neu[i + 1]; neu[i + 1] = merk;
        kreuzt[neu[i]] += 1; kreuzt[neu[i + 1]] += 1;
      }
      spalten.push(neu);
    }
    if (klappt) return { spalten: spalten, kreuzt: kreuzt };
  }
  throw new Error('keine Linien für ' + p.n + ' Linien');
}

function linienSvg(spalten, n, farbig) {
  const breite = 360, oben = 26, abstand = 46, rand = 46;
  const hoehe = oben * 2 + (n - 1) * abstand;
  // Gerade Stücke am Anfang und Ende, damit Buchstaben und Zahlen klar zu ihrer Linie gehören
  const alle = [spalten[0]].concat(spalten, [spalten[spalten.length - 1]]);
  const xs = alle.map(function (_, i) { return rand + i * (breite - 2 * rand) / (alle.length - 1); });
  const y = function (spur) { return oben + spur * abstand; };
  const farbeVon = function (linie) { return farbig ? farbHex(LINIEN_FARBEN[linie]) : NEUTRAL_HEX; };

  let inhalt = '';
  for (let linie = 0; linie < n; linie++) {
    const spuren = alle.map(function (s) { return s.indexOf(linie); });
    let d = 'M' + zahl(rand - 16) + ',' + y(spuren[0]) + ' L' + zahl(xs[0]) + ',' + y(spuren[0]);
    for (let i = 1; i < alle.length; i++) {
      const mx = (xs[i - 1] + xs[i]) / 2;
      d += ' C' + zahl(mx) + ',' + y(spuren[i - 1]) + ' ' + zahl(mx) + ',' + y(spuren[i]) + ' ' + zahl(xs[i]) + ',' + y(spuren[i]);
    }
    d += ' L' + zahl(breite - rand + 16) + ',' + y(spuren[spuren.length - 1]);
    // Erst ein dunkler Rand, dann die Linie: so sieht man an jeder Kreuzung, welche oben liegt
    inhalt += '<path d="' + d + '" fill="none" stroke="#0b1030" stroke-width="11" stroke-linecap="round"/>';
    inhalt += '<path class="linie" d="' + d + '" fill="none" stroke="' + farbeVon(linie) + '" stroke-width="5" stroke-linecap="round"/>';
  }
  const schrift = ' font-family="' + SCHRIFT + '" font-size="22" font-weight="800" text-anchor="middle"';
  for (let linie = 0; linie < n; linie++) {
    inhalt += '<text x="16" y="' + (y(linie) + 8) + '" fill="' + (farbig ? farbeVon(linie) : '#eaf0ff') + '"' + schrift + '>' +
              LINIEN_BUCHSTABEN[linie] + '</text>';
  }
  for (let spur = 0; spur < n; spur++) {
    inhalt += '<text x="' + (breite - 16) + '" y="' + (y(spur) + 8) + '" fill="#ffe14d"' + schrift + '>' + (spur + 1) + '</text>';
  }
  return '<svg class="linienbild" viewBox="0 0 ' + breite + ' ' + hoehe + '" role="img" aria-label="' + n +
         ' verschlungene Linien von links nach rechts">' + inhalt + '</svg>';
}

function macheLinien(stufe) {
  const p = parameterFuer('linien', stufe);
  for (let versuch = 0; versuch < 200; versuch++) {
    const b = baueLinienSpalten(p);
    const letzte = b.spalten[b.spalten.length - 1];
    const ende = function (linie) { return letzte.indexOf(linie); };
    const meiste = Math.max.apply(null, b.kreuzt);
    const kandidaten = b.kreuzt.map(function (k, linie) { return linie; }).filter(function (linie) {
      if (b.kreuzt[linie] < Math.max(1, Math.floor(meiste / 2))) return false;
      return stufe < 3 || ende(linie) !== linie;
    });
    if (!kandidaten.length) continue;

    const linie = zufallsElement(kandidaten);
    const name = LINIEN_BUCHSTABEN[linie];
    const ziel = ende(linie) + 1;
    const k = b.kreuzt[linie];

    const optionen = [];
    for (let nr = 1; nr <= p.n; nr++) {
      const andere = letzte[nr - 1];
      optionen.push({
        id: 'e' + nr, text: String(nr), schluessel: 'e' + nr,
        fehlerText: nr === ziel ? null
          : 'Bei ' + nr + ' kommt die Linie von ' + LINIEN_BUCHSTABEN[andere] + ' an. ' +
            'Wahrscheinlich bist du an einer Kreuzung auf sie umgestiegen.',
        falschThemen: nr === ziel ? [] : ['linien']
      });
    }

    return {
      uebung: 'linien', stufe: stufe, art: 'auswahl',
      frage: 'Wo kommt die Linie von ' + name + ' an?',
      anzeige: { layout: 'bild', bild: linienSvg(b.spalten, p.n, p.farbig) },
      optionen: optionen,
      richtig: 'e' + ziel,
      erklaerung: 'Die Linie von ' + name + ' geht über ' + (k === 1 ? 'eine Kreuzung' : k + ' Kreuzungen') + ' und kommt bei ' + ziel + ' an.',
      merksatz: 'An einer Kreuzung biegt keine Linie ab – sie läuft immer in ihrem Bogen weiter.',
      themen: ['linien'],
      // für die Selbsttests
      spalten: b.spalten, linie: linie, kreuzt: b.kreuzt
    };
  }
  throw new Error('keine Linien-Aufgabe für Stufe ' + stufe);
}

uebung('linien', {
  gruppe: 'aufmerksamkeit',
  titel: 'Linien verfolgen',
  symbol: '〰️',
  alter: [8, 12],
  beschreibung: 'Linien laufen kreuz und quer von links nach rechts. Wo kommt die Linie von B an?',
  lernziel: 'Du übst, mit den Augen an einer Sache dranzubleiben, auch wenn rundherum viel los ist – wie beim Lesen einer langen Zeile.',
  tipps: [
    'Fahr mit dem Finger ganz langsam über den Bildschirm nach – an den Kreuzungen besonders langsam.',
    'An einer Kreuzung läuft die Linie immer in ihrem Bogen weiter, sie biegt nie ab.'
  ],
  tippAbStufe: { 4: 'Ab jetzt haben alle Linien dieselbe Farbe – da hilft nur noch genaues Nachfahren.' },
  stufen: LINIEN_STUFEN,
  beispiel: function () {
    return linienSvg([[0, 1, 2], [1, 0, 2], [1, 2, 0]], 3, true);
  },
  macheAufgabe: macheLinien,
  rundenLaenge: function () { return 8; },
  zeitMitUhr: function (aufgabe) { return 12 + 3 * aufgabe.optionen.length; }
});

/* ============================================================
   PFEIL ODER WORT — zählen, ohne sich ablenken zu lassen
   ============================================================ */

const PFEIL_RICHTUNGEN = ['links', 'rechts', 'oben', 'unten'];
const PFEIL_GRAD = { rechts: 0, unten: 90, links: 180, oben: 270 };

const PFEILWORT_STUFEN = [
  { karten: 4, richtungen: 2, regeln: ['pfeil'],                               unpassend: [1, 2] },
  { karten: 5, richtungen: 2, regeln: ['pfeil'],                               unpassend: [2, 3] },
  { karten: 6, richtungen: 4, regeln: ['pfeil'],                               unpassend: [2, 4] },
  { karten: 6, richtungen: 4, regeln: ['wort'],                                unpassend: [2, 4] },
  { karten: 6, richtungen: 4, regeln: ['pfeil', 'wort'],                       unpassend: [3, 5] },
  { karten: 8, richtungen: 4, regeln: ['pfeil', 'wort'],                       unpassend: [4, 6] },
  { karten: 8, richtungen: 4, regeln: ['pfeil', 'wort', 'passt'],              unpassend: [3, 6] },
  { karten: 9, richtungen: 4, regeln: ['pfeil', 'wort', 'passt', 'passtNicht'], unpassend: [3, 7] }
];

const PFEILWORT_THEMA = { pfeil: 'pfeile', wort: 'woerter', passt: 'passen', passtNicht: 'passen' };

function pfeilKarteSvg(richtung, wort) {
  const pfeil = '<polygon points="6,36 56,36 56,14 94,50 56,86 56,64 6,64" transform="rotate(' + PFEIL_GRAD[richtung] +
                ' 50 50)" fill="#4a5aa8" stroke="rgba(234,240,255,.85)" stroke-width="2.5" stroke-linejoin="round"/>';
  const text = '<text x="50" y="56" text-anchor="middle" font-size="17" font-weight="800" font-family="' + SCHRIFT +
               '" fill="#ffe14d" stroke="#0b1030" stroke-width="4" paint-order="stroke">' + wort.toUpperCase() + '</text>';
  return svgRahmen(pfeil + text, 'Pfeil nach ' + richtung + ', darauf steht ' + wort.toUpperCase());
}

function machePfeilWort(stufe) {
  const p = parameterFuer('pfeilwort', stufe);
  const richtungen = p.richtungen === 2 ? ['links', 'rechts'] : PFEIL_RICHTUNGEN;

  for (let versuch = 0; versuch < 500; versuch++) {
    const karten = [];
    for (let i = 0; i < p.karten; i++) {
      const r = zufallsElement(richtungen);
      karten.push({ pfeil: r, wort: r });
    }
    const unpassend = zufall(p.unpassend[0], p.unpassend[1]);
    for (const i of mischen(karten.map(function (_, i) { return i; })).slice(0, unpassend)) {
      karten[i].wort = zufallsElement(richtungen.filter(function (r) { return r !== karten[i].pfeil; }));
    }

    const regel = zufallsElement(p.regeln);
    const ziel = zufallsElement(richtungen);
    const nummern = function (test) {
      return karten.map(function (k, i) { return test(k) ? i + 1 : 0; }).filter(Boolean);
    };
    const pfeilNr = nummern(function (k) { return k.pfeil === ziel; });
    const wortNr = nummern(function (k) { return k.wort === ziel; });
    const passtNr = nummern(function (k) { return k.pfeil === k.wort; });
    const passtNichtNr = nummern(function (k) { return k.pfeil !== k.wort; });

    const treffer = { pfeil: pfeilNr, wort: wortNr, passt: passtNr, passtNicht: passtNichtNr }[regel];
    const falle = { pfeil: wortNr, wort: pfeilNr, passt: passtNichtNr, passtNicht: passtNr }[regel];
    const antwort = treffer.length;
    if (antwort < 1 || antwort === falle.length) continue;

    // Vier Zahlen: die richtige, die Falle und Nachbarn
    const zahlen = [antwort, falle.length];
    for (const kandidat of [antwort + 1, antwort - 1, falle.length + 1, falle.length - 1, antwort + 2, antwort - 2]) {
      if (zahlen.length >= 4) break;
      if (kandidat >= 0 && kandidat <= p.karten && zahlen.indexOf(kandidat) === -1) zahlen.push(kandidat);
    }
    if (zahlen.length < 4) continue;
    zahlen.sort(function (a, b) { return a - b; });

    const WORT = '„' + ziel.toUpperCase() + '“';
    const fallenText = {
      pfeil: 'Auf so vielen Karten steht das Wort ' + WORT + '. Gefragt war aber, wohin die Pfeile zeigen.',
      wort: 'So viele Pfeile zeigen nach ' + ziel + '. Gefragt war aber, wo das Wort ' + WORT + ' draufsteht.',
      passt: 'Bei so vielen Karten passen Pfeil und Wort NICHT zusammen – gefragt war, wie viele zusammenpassen.',
      passtNicht: 'Bei so vielen Karten passen Pfeil und Wort zusammen – gefragt war, wie viele NICHT zusammenpassen.'
    }[regel];

    const optionen = zahlen.map(function (z) {
      return {
        id: 'z' + z, text: String(z), schluessel: 'z' + z,
        fehlerText: z === antwort ? null
          : (z === falle.length ? fallenText : 'Knapp daneben – da hast du dich verzählt. Leg beim Zählen einen Finger auf jede Karte.'),
        falschThemen: z === falle.length ? [PFEILWORT_THEMA[regel]] : []
      };
    });

    const karteText = function (liste) { return (liste.length === 1 ? 'Karte ' : 'Karten ') + aufzaehlung(liste); };
    const anzahlKarten = function (z) { return z === 1 ? 'einer Karte' : z + ' Karten'; };
    const frage = {
      pfeil: 'Wie viele PFEILE zeigen nach ' + ziel + '?',
      wort: 'Auf wie vielen Karten steht das WORT ' + WORT + '?',
      passt: 'Bei wie vielen Karten PASSEN Pfeil und Wort zusammen?',
      passtNicht: 'Bei wie vielen Karten passen Pfeil und Wort NICHT zusammen?'
    }[regel];
    const erklaerung = {
      pfeil: (antwort === 1 ? 'Ein Pfeil zeigt' : antwort + ' Pfeile zeigen') + ' nach ' + ziel + ' (' + karteText(treffer) + '). ' +
             'Das Wort ' + WORT + ' steht auf ' + anzahlKarten(falle.length) + ' – davon durftest du dich nicht ablenken lassen.',
      wort: 'Das Wort ' + WORT + ' steht auf ' + anzahlKarten(antwort) + ' (' + karteText(treffer) + '). ' +
            'Wohin die Pfeile zeigen, war diesmal egal.',
      passt: 'Bei ' + anzahlKarten(antwort) + ' passen Pfeil und Wort zusammen (' + karteText(treffer) + '). ' +
             'Bei den anderen sagt das Wort etwas anderes, als der Pfeil zeigt.',
      passtNicht: 'Bei ' + anzahlKarten(antwort) + ' passen Pfeil und Wort nicht zusammen (' + karteText(treffer) + ').'
    }[regel];

    return {
      uebung: 'pfeilwort', stufe: stufe, art: 'auswahl',
      frage: frage,
      anzeige: { layout: 'karten', bilder: karten.map(function (k) { return pfeilKarteSvg(k.pfeil, k.wort); }),
                 beschriftungen: karten.map(function (_, i) { return String(i + 1); }) },
      optionen: optionen,
      richtig: 'z' + antwort,
      erklaerung: erklaerung,
      merksatz: 'Trick: Lies erst die Frage ganz genau – zählen die Pfeile oder die Wörter? Dann schau bei jeder Karte nur auf das eine.',
      themen: [PFEILWORT_THEMA[regel]],
      // für die Selbsttests
      karten: karten, regel: regel, ziel: ziel, falle: falle.length
    };
  }
  throw new Error('keine Pfeil-oder-Wort-Aufgabe für Stufe ' + stufe);
}

uebung('pfeilwort', {
  gruppe: 'aufmerksamkeit',
  titel: 'Pfeil oder Wort?',
  symbol: '↔️',
  alter: [10, 12],
  beschreibung: 'Auf jedem Pfeil steht ein Wort – aber nicht immer das passende. Zähle nur, wonach gefragt ist.',
  lernziel: 'Du übst, dich nicht ablenken zu lassen und genau das zu tun, was die Aufgabe verlangt – wie bei einer Textaufgabe mit Zahlen, die nicht gebraucht werden.',
  tipps: [
    'Lies die Frage zweimal: Geht es um die PFEILE oder um die WÖRTER?',
    'Leg beim Zählen einen Finger auf jede Karte und schau nur auf das eine, wonach gefragt ist.'
  ],
  tippAbStufe: { 5: 'Ab jetzt wechselt die Frage – mal zählen die Pfeile, mal die Wörter. Lies sie jedes Mal neu!' },
  stufen: PFEILWORT_STUFEN,
  beispiel: function () {
    return pfeilKarteSvg('links', 'links') + pfeilKarteSvg('rechts', 'links') + pfeilKarteSvg('oben', 'unten');
  },
  macheAufgabe: machePfeilWort,
  rundenLaenge: function () { return 8; },
  zeitMitUhr: function (aufgabe) { return 10 + 2 * aufgabe.anzeige.bilder.length; }
});
