/* ============================================================
   GEOMETRIE — „Was passt nicht?“ und „Spiegeln und Drehen“.
   ============================================================ */

const EINFACHE_FORMEN = ['kreis', 'dreieck', 'quadrat', 'stern', 'herz', 'sechseck', 'raute', 'fuenfeck', 'rechteck'];
const VIERECKE = ['quadrat', 'rechteck', 'raute', 'parallelogramm', 'trapez', 'drachen'];

/* ---------------- Eigenschaften von Formen ----------------
   wert(form) liefert die Eigenschaft; alle Formen der Gruppe haben
   denselben Wert, jeder Fremdling einen anderen. */
const EIGENSCHAFTEN = {
  rund: {
    wert: function (f) { return !!FORMEN[f].rund; },
    gruppe: ['dreieck', 'quadrat', 'rechteck', 'raute', 'trapez', 'fuenfeck', 'sechseck', 'parallelogramm', 'drachen'],
    fremdling: ['kreis', 'halbkreis'],
    frage: 'Was passt nicht?',
    erklaerung: function (fremd) {
      return 'Alle anderen haben nur gerade Seiten und Ecken. ' + grossAnfang(formMitArtikel(fremd)) + ' hat eine runde Seite.';
    },
    merksatz: 'Eine Figur mit lauter geraden Seiten heißt Vieleck.',
    passt: function (f) { return FORMEN[f].rund ? pronomen(f) + ' hat auch eine runde Seite' : pronomen(f) + ' hat auch nur gerade Seiten'; },
    bei: 'bei rund und eckig'
  },
  ecken: {
    wert: function (f) { return FORMEN[f].ecken; },
    gruppe: VIERECKE,
    fremdling: ['dreieck', 'rechtwinkligesDreieck', 'fuenfeck', 'sechseck'],
    frage: 'Eine Figur hat eine andere Anzahl Ecken. Welche?',
    erklaerung: function (fremd) {
      return 'Alle anderen haben 4 Ecken. ' + grossAnfang(formMitArtikel(fremd)) + ' hat ' + FORMEN[fremd].ecken + ' Ecken.';
    },
    passt: function (f) { return pronomen(f) + ' hat auch ' + FORMEN[f].ecken + ' Ecken'; },
    merksatz: 'Zähl die Ecken mit dem Finger – jede Ecke ist eine Stelle, an der zwei Seiten zusammenstoßen.',
    bei: 'bei der Zahl der Ecken'
  },
  rechterWinkel: {
    wert: function (f) { return FORMEN[f].rechteWinkel > 0; },
    gruppe: ['quadrat', 'rechteck', 'rechtwinkligesDreieck', 'lForm'],
    fremdling: ['raute', 'parallelogramm', 'trapez', 'drachen', 'dreieck', 'fuenfeck', 'sechseck'],
    frage: 'Eine Figur hat keinen rechten Winkel. Welche?',
    frageUmgekehrt: 'Nur eine Figur hat rechte Winkel. Welche?',
    erklaerung: function (fremd) {
      return 'Alle anderen haben mindestens einen rechten Winkel. ' + grossAnfang(formMitArtikel(fremd)) + ' hat keinen.';
    },
    erklaerungUmgekehrt: function (fremd) {
      return 'Alle anderen haben keinen rechten Winkel – nur ' + formMitArtikel(fremd) + ' hat welche.';
    },
    passt: function (f) {
      return FORMEN[f].rechteWinkel > 0 ? pronomen(f) + ' hat auch einen rechten Winkel'
                                        : pronomen(f) + ' hat auch keinen rechten Winkel';
    },
    merksatz: 'Ein rechter Winkel ist eine Ecke wie an einem Blatt Papier. Ein Geodreieck passt genau hinein.',
    bei: 'bei den rechten Winkeln'
  },
  gleichlang: {
    wert: function (f) { return FORMEN[f].gleicheSeiten === 'ja'; },
    gruppe: ['quadrat', 'raute', 'dreieck', 'fuenfeck', 'sechseck'],
    fremdling: ['rechteck', 'parallelogramm', 'trapez', 'drachen', 'rechtwinkligesDreieck'],
    frage: 'Bei einer Figur sind nicht alle Seiten gleich lang. Welche?',
    erklaerung: function (fremd) {
      return 'Bei allen anderen sind alle Seiten gleich lang. ' + grossAnfang(beiForm(fremd)) +
             ' sind manche Seiten länger als andere.';
    },
    passt: function (f) { return 'Auch ' + beiForm(f) + ' sind alle Seiten gleich lang'; },
    merksatz: 'Gleich lange Seiten erkennst du, wenn du die Figur in Gedanken drehst und die Seiten aufeinanderlegst.',
    bei: 'bei den gleich langen Seiten'
  },
  achsensymmetrisch: {
    wert: function (f) { return FORMEN[f].achsen > 0; },
    gruppe: ['quadrat', 'rechteck', 'raute', 'dreieck', 'trapez', 'drachen', 'fuenfeck', 'sechseck', 'halbkreis', 'pfeil', 'herz', 'stern'],
    fremdling: ['parallelogramm', 'rechtwinkligesDreieck', 'lForm', 'flagge'],
    frage: 'Eine Figur ist nicht achsensymmetrisch. Welche?',
    frageUmgekehrt: 'Nur eine Figur ist achsensymmetrisch. Welche?',
    erklaerung: function (fremd) {
      return 'Alle anderen kannst du so falten, dass beide Hälften genau aufeinanderliegen – sie sind achsensymmetrisch. ' +
             grossAnfang(formMitArtikel(fremd)) + ' geht so nicht.';
    },
    erklaerungUmgekehrt: function (fremd) {
      return 'Keine der anderen Figuren kannst du so falten, dass beide Hälften aufeinanderliegen. Nur ' +
             formMitArtikel(fremd) + ' ist achsensymmetrisch.';
    },
    passt: function (f) {
      return FORMEN[f].achsen > 0 ? pronomen(f) + ' ist auch achsensymmetrisch' : pronomen(f) + ' ist auch nicht achsensymmetrisch';
    },
    merksatz: 'Symmetrieachse = die Faltlinie, an der beide Hälften genau gleich sind.',
    bei: 'bei der Achsensymmetrie'
  },
  punktsymmetrisch: {
    wert: function (f) { return !!FORMEN[f].punktsymm; },
    gruppe: ['kreis', 'quadrat', 'rechteck', 'raute', 'parallelogramm', 'sechseck'],
    fremdling: ['dreieck', 'trapez', 'drachen', 'fuenfeck', 'halbkreis', 'pfeil', 'herz'],
    frage: 'Was passt nicht?',
    erklaerung: function (fremd) {
      return 'Alle anderen sehen nach einer halben Drehung (180°) genauso aus – sie sind punktsymmetrisch. ' +
             grossAnfang(formMitArtikel(fremd)) + ' steht dann auf dem Kopf.';
    },
    merksatz: 'Punktsymmetrisch: Kopfstand macht nichts aus.',
    passt: function (f) {
      return FORMEN[f].punktsymm ? pronomen(f) + ' sieht nach einer halben Drehung auch genauso aus'
                                 : pronomen(f) + ' steht nach einer halben Drehung auch auf dem Kopf';
    },
    bei: 'bei der Punktsymmetrie'
  },
  parallel: {
    wert: function (f) { return FORMEN[f].parallelePaare > 0; },
    gruppe: ['quadrat', 'rechteck', 'raute', 'parallelogramm', 'trapez', 'sechseck'],
    fremdling: ['dreieck', 'rechtwinkligesDreieck', 'drachen', 'fuenfeck'],
    frage: 'Was passt nicht?',
    erklaerung: function (fremd) {
      return 'Alle anderen haben mindestens ein Paar parallele Seiten. ' + grossAnfang(formMitArtikel(fremd)) + ' hat keins.';
    },
    merksatz: 'Parallele Seiten laufen nebeneinander wie Eisenbahnschienen und treffen sich nie.',
    passt: function (f) {
      return FORMEN[f].parallelePaare > 0 ? pronomen(f) + ' hat auch parallele Seiten' : pronomen(f) + ' hat auch keine parallelen Seiten';
    },
    bei: 'bei den parallelen Seiten'
  },
  achsenAnzahl: {
    wert: function (f) { return FORMEN[f].achsen === 1; },
    gruppe: ['trapez', 'drachen', 'halbkreis', 'pfeil', 'herz'],
    fremdling: ['quadrat', 'rechteck', 'raute', 'dreieck', 'fuenfeck', 'sechseck'],
    frage: 'Was passt nicht?',
    erklaerung: function (fremd) {
      return 'Alle anderen haben genau eine Symmetrieachse. ' + grossAnfang(formMitArtikel(fremd)) + ' hat ' +
             FORMEN[fremd].achsen + '.';
    },
    merksatz: 'Eine Symmetrieachse ist eine Faltlinie. Manche Formen haben nur eine, das Quadrat hat vier.',
    passt: function (f) {
      return FORMEN[f].achsen === 1 ? pronomen(f) + ' hat auch genau eine Symmetrieachse' : pronomen(f) + ' hat auch mehr als eine';
    },
    bei: 'bei der Zahl der Symmetrieachsen'
  }
};

/* „beim Rechteck“, „bei der Raute“, „beim rechtwinkligen Dreieck“ */
function beiForm(f) {
  const form = FORMEN[f];
  const adj = form.adjektiv ? form.adjektiv + 'en ' : '';
  return (form.artikel === 'die' ? 'bei der ' : 'beim ') + adj + form.name;
}

/* Welche geometrischen Eigenschaften zählen, wenn die Frage keine nennt? */
const GEOMETRISCHE = ['rund', 'ecken', 'rechterWinkel', 'gleichlang', 'achsensymmetrisch', 'punktsymmetrisch', 'parallel', 'achsenAnzahl'];

/* Ist Figur i die einzige mit einem anderen Wert (und die anderen vier sind gleich)? */
function einzigeMitWert(formen, i, eigenschaft) {
  const w = function (f) { return EIGENSCHAFTEN[eigenschaft].wert(f); };
  const andere = formen.filter(function (f, j) { return j !== i; }).map(w);
  return andere.every(function (x) { return x === andere[0]; }) && w(formen[i]) !== andere[0];
}

/* Alle Figuren, die in IRGENDEINER geometrischen Eigenschaft allein dastehen */
function ausreisserKandidaten(formen) {
  const kandidaten = [];
  for (let i = 0; i < formen.length; i++) {
    if (GEOMETRISCHE.some(function (e) { return einzigeMitWert(formen, i, e); })) kandidaten.push(i);
  }
  return kandidaten;
}

/* Farben (oder Größen) 2:3 verteilen, damit keine Figur dadurch auffällt */
function rauschen(werte) {
  const verteilung = mischen([werte[0], werte[0], werte[1], werte[1], werte[1]]);
  return verteilung;
}

function macheAusreisser(stufe) {
  const s = klemmeStufe(stufe);
  let art;
  if (s === 1) art = 'farbe';
  else if (s === 2) art = zufallsElement(['form', 'groesse']);
  else if (s === 3) art = zufallsElement(['drehung', 'rund']);
  else if (s === 4) art = 'ecken';
  else if (s === 5) art = 'rechterWinkel';
  else if (s === 6) art = zufallsElement(['gleichlang', 'rechterWinkelUmgekehrt']);
  else if (s === 7) art = zufallsElement(['achsensymmetrisch', 'achsensymmetrischUmgekehrt']);
  else art = zufallsElement(['punktsymmetrisch', 'parallel', 'achsenAnzahl', 'ecken', 'rechterWinkel', 'gleichlang', 'achsensymmetrisch']);

  const fremdIndex = zufall(0, 4);
  let figuren = [];
  let frage = 'Was passt nicht?';
  let erklaerung = '';
  let merksatz = null;
  let thema = art;
  const eigeneFarbe = zufallsElement(FARBEN).id;

  if (art === 'farbe') {
    const form = zufallsElement(EINFACHE_FORMEN);
    const [a, b] = waehleFarben(2);
    for (let i = 0; i < 5; i++) figuren.push({ form: form, farbe: i === fremdIndex ? b : a });
    erklaerung = 'Vier ' + formWort(form, { plural: true }) + ' sind ' + farbe(a).name + ' – nur ' +
                 formMitEin(form) + ' ist ' + farbe(b).name + '.';
  } else if (art === 'form') {
    const [a, b] = mischen(EINFACHE_FORMEN.slice()).slice(0, 2);
    for (let i = 0; i < 5; i++) figuren.push({ form: i === fremdIndex ? b : a, farbe: eigeneFarbe });
    erklaerung = 'Hier sind vier ' + formWort(a, { plural: true }) + ' – und ' + formMitEin(b) + '.';
  } else if (art === 'groesse') {
    const form = zufallsElement(EINFACHE_FORMEN);
    const anders = zufallsElement(['klein', 'gross']);
    for (let i = 0; i < 5; i++) figuren.push({ form: form, farbe: eigeneFarbe, groesse: i === fremdIndex ? anders : 'mittel' });
    erklaerung = 'Alle anderen sind gleich groß. Diese Figur ist ' + (anders === 'klein' ? 'kleiner' : 'größer') + '.';
  } else if (art === 'drehung') {
    const form = zufallsElement(['pfeil', 'halbkreis', 'flagge', 'herz', 'trapez', 'lForm']);
    const d0 = zufall(0, 3) * 90;
    const dazu = zufallsElement([90, 180, 270]);
    for (let i = 0; i < 5; i++) {
      figuren.push({ form: form, farbe: eigeneFarbe, drehung: i === fremdIndex ? (d0 + dazu) % 360 : d0 });
    }
    erklaerung = 'Alle ' + formWort(form, { plural: true }) + ' stehen gleich – nur einer ist gedreht.';
    if (FORMEN[form].artikel !== 'der') erklaerung = erklaerung.replace('nur einer', 'nur eine');
    if (FORMEN[form].artikel === 'das') erklaerung = erklaerung.replace('nur eine', 'nur eins');
    merksatz = 'Gedreht heißt: dieselbe Figur, nur wie ein Uhrzeiger weitergedreht.';
  } else {
    const umgekehrt = /Umgekehrt$/.test(art);
    const id = art.replace('Umgekehrt', '');
    thema = id;
    const e = EIGENSCHAFTEN[id];
    const gruppeListe = umgekehrt ? e.fremdling : e.gruppe;
    const fremdListe = umgekehrt ? e.gruppe : e.fremdling;
    const ohneFrage = s === 8;
    let formen = null;

    for (let versuch = 0; versuch < 400; versuch++) {
      const gruppe = mischen(gruppeListe.slice()).slice(0, 4);
      if (gruppe.length < 4) break;
      const fremd = zufallsElement(fremdListe);
      const liste = gruppe.slice();
      liste.splice(fremdIndex, 0, fremd);
      // Ohne genannte Eigenschaft darf keine andere Figur auch allein dastehen
      if (ohneFrage) {
        const k = ausreisserKandidaten(liste);
        if (k.length !== 1 || k[0] !== fremdIndex) continue;
      }
      formen = liste;
      break;
    }
    if (!formen) return macheAusreisser(stufe);      // sehr selten: neu würfeln

    const fremd = formen[fremdIndex];
    const farbWerte = s >= 4 ? rauschen(waehleFarben(2)) : [eigeneFarbe, eigeneFarbe, eigeneFarbe, eigeneFarbe, eigeneFarbe];
    const groessen = s >= 8 ? rauschen(['mittel', 'gross']) : ['mittel', 'mittel', 'mittel', 'mittel', 'mittel'];
    figuren = formen.map(function (f, i) { return { form: f, farbe: farbWerte[i], groesse: groessen[i] }; });
    frage = ohneFrage ? 'Was passt nicht?' : (umgekehrt ? e.frageUmgekehrt : e.frage);
    erklaerung = umgekehrt ? e.erklaerungUmgekehrt(fremd) : e.erklaerung(fremd);
    merksatz = e.merksatz;
  }

  const optionen = figuren.map(function (f, i) {
    return {
      id: 'o' + i,
      svg: figurSvg(f),
      figur: f,
      text: stufe <= 3 ? figurName(f) : null,
      schluessel: 'o' + i + figurSchluessel(f),
      fehlerText: i === fremdIndex ? null : ausreisserFehler(figuren, i, fremdIndex, thema, stufe),
      falschThemen: i === fremdIndex ? [] : [thema]
    };
  });

  return {
    uebung: 'ausreisser', stufe: stufe, art: 'auswahl',
    frage: frage,
    anzeige: { layout: 'keine', bilder: [] },
    optionen: optionen,
    optionenGleichErlaubt: true,
    richtig: 'o' + fremdIndex,
    erklaerung: erklaerung,
    merksatz: merksatz,
    themen: [thema],
    fremdIndex: fremdIndex, eigenschaft: thema, figuren: figuren
  };
}

/* Was sagen wir, wenn das Kind die falsche Figur antippt? */
function ausreisserFehler(figuren, gewaehlt, fremdIndex, thema, stufe) {
  const f = figuren[gewaehlt].form;
  const fremd = figuren[fremdIndex].form;
  const formen = figuren.map(function (x) { return x.form; });

  if (stufe >= 4 && EIGENSCHAFTEN[thema]) {
    // Hat das Kind etwas Echtes entdeckt?
    for (const e of GEOMETRISCHE) {
      if (e !== thema && einzigeMitWert(formen, gewaehlt, e)) {
        return 'Stimmt, ' + formMitArtikel(f) + ' fällt auch auf – ' + EIGENSCHAFTEN[e].bei +
               '. Gesucht war aber ' + formMitArtikel(fremd) + '.';
      }
    }
    if (EIGENSCHAFTEN[thema].passt) {
      return grossAnfang(formMitArtikel(f)) + ' passt zu den anderen: ' + EIGENSCHAFTEN[thema].passt(f) +
             '. Gesucht war ' + formMitArtikel(fremd) + '.';
    }
  }
  return 'Nicht ganz. Diese Figur passt zu den anderen. Gesucht war ' +
         (stufe >= 4 ? formMitArtikel(fremd) : 'die Figur, die anders ist') + '.';
}

uebung('ausreisser', {
  gruppe: 'formen',
  titel: 'Was passt nicht?',
  symbol: '🔍',
  alter: [8, 12],
  beschreibung: 'Fünf Figuren, eine ist anders: erst bei Farbe und Form, dann bei Ecken, rechten Winkeln und Symmetrie.',
  lernziel: 'Du lernst die Eigenschaften von Formen kennen: Ecken, rechte Winkel, gleich lange Seiten und Symmetrie.',
  tipps: [
    'Geh die Figuren einzeln durch und sag laut, was du siehst: „4 Ecken, 4 Ecken, 3 Ecken …“ – die Ausnahme fällt dann auf.',
    'Wenn die Frage eine Eigenschaft nennt, prüfe nur diese eine Eigenschaft bei jeder Figur.'
  ],
  stufen: [1, 2, 3, 4, 5, 6, 7, 8].map(function (s) { return { stufe: s }; }),
  beispiel: function () {
    return ['quadrat', 'raute', 'dreieck', 'trapez'].map(function (f) { return formSvg(f, { farbe: 'blau' }); }).join('');
  },
  macheAufgabe: macheAusreisser,
  zeitMitUhr: function (aufgabe) { return aufgabe.stufe <= 3 ? 20 : (aufgabe.stufe <= 6 ? 30 : 40); }
});

/* ============================================================
   SPIEGELN UND DREHEN
   ============================================================ */

const SPIEGEL_STUFEN = [
  { arten: ['spiegeln'], laenge: 3, halb: 2, zellen: 3, achsen: ['senkrecht'], zusammen: true },
  { arten: ['spiegeln'], laenge: 3, halb: 3, zellen: 4, achsen: ['senkrecht'], zusammen: true },
  { arten: ['spiegeln'], laenge: 4, halb: 3, zellen: 5, achsen: ['senkrecht', 'waagerecht'], zusammen: false },
  { arten: ['spiegeln'], laenge: 4, halb: 4, zellen: 6, achsen: ['senkrecht', 'waagerecht'], beruehrt: true },
  { arten: ['spiegeln', 'drehenForm'], laenge: 4, halb: 4, zellen: 6, achsen: ['senkrecht', 'waagerecht'], beruehrt: true },
  { arten: ['diagonal', 'drehenForm'], n: 4, zellen: [4, 5] },
  { arten: ['drehenGitter', 'diagonal'], n: 4, zellen: [4, 5] },
  { arten: ['diagonal', 'drehenGitter', 'schnell'], n: 5, zellen: [5, 6], aufAchse: true }
];

const ACHSEN_THEMA = { senkrecht: 'spiegelnSenkrecht', waagerecht: 'spiegelnWaagerecht',
                       diagonal: 'spiegelnDiagonal', gegendiagonal: 'spiegelnDiagonal' };
const ACHSEN_NAME = { senkrecht: 'senkrechten', waagerecht: 'waagerechten', diagonal: 'schrägen', gegendiagonal: 'schrägen' };

function macheSpiegeln(stufe) {
  const p = SPIEGEL_STUFEN[klemmeStufe(stufe) - 1];
  const art = zufallsElement(p.arten);
  if (art === 'spiegeln') return macheSpiegelGitter(stufe, p);
  if (art === 'diagonal') return macheSpiegelDiagonal(stufe, p);
  if (art === 'drehenForm') return macheDrehenForm(stufe);
  if (art === 'drehenGitter') return macheDrehenGitter(stufe, p);
  return macheSchnellfrage(stufe, p);
}

function spiegelAufgabe(stufe, breite, hoehe, achse, vorgabe) {
  const bild = spiegleZellen(vorgabe, breite, hoehe, achse);
  const richtig = vorgabe.concat(bild.filter(function (z) { return !enthaeltZelle(vorgabe, z.x, z.y); }));
  const fehlen = richtig.length - vorgabe.length;
  return {
    uebung: 'spiegeln', stufe: stufe, art: 'gitter',
    frage: 'Spiegle die Figur an der gestrichelten Linie. Tippe die ' + fehlen + ' fehlenden Felder an.',
    anzeige: { breite: breite, hoehe: hoehe, zeigeZuerst: [], vorgabe: vorgabe, achse: achse, merkzeit: 0, ziel: fehlen },
    richtig: richtig,
    erklaerung: (achse === 'diagonal' || achse === 'gegendiagonal')
      ? 'Beim Spiegeln an der schrägen Achse tauschen Zeile und Spalte die Plätze: Jedes Feld liegt danach genauso weit von der Linie weg, nur auf der anderen Seite.'
      : 'Jedes Feld liegt genauso weit von der Achse weg wie sein Spiegelbild – nur auf der anderen Seite und in derselben ' +
        (achse === 'senkrecht' ? 'Zeile' : 'Spalte') + '.',
    merksatz: 'Spiegeln heißt umklappen – wie wenn du das Blatt an der Linie faltest.',
    themen: [ACHSEN_THEMA[achse]]
  };
}

function macheSpiegelGitter(stufe, p) {
  const achse = zufallsElement(p.achsen);
  const breite = achse === 'senkrecht' ? 2 * p.halb : p.laenge;
  const hoehe = achse === 'senkrecht' ? p.laenge : 2 * p.halb;
  const inHaelfte = function (x, y) { return achse === 'senkrecht' ? x < p.halb : y < p.halb; };

  for (let versuch = 0; versuch < 300; versuch++) {
    let vorgabe;
    if (p.zusammen) {
      vorgabe = wachseFigur(p.zellen, breite, hoehe, inHaelfte);
    } else {
      const alle = [];
      for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) if (inHaelfte(x, y)) alle.push({ x: x, y: y });
      vorgabe = mischen(alle).slice(0, p.zellen);
    }
    if (!vorgabe) continue;
    if (p.beruehrt && !vorgabe.some(function (z) { return achse === 'senkrecht' ? z.x === p.halb - 1 : z.y === p.halb - 1; })) continue;
    return spiegelAufgabe(stufe, breite, hoehe, achse, vorgabe);
  }
  throw new Error('keine Spiegel-Figur gefunden');
}

function macheSpiegelDiagonal(stufe, p) {
  const n = p.n;
  const achse = zufallsElement(['diagonal', 'gegendiagonal']);
  const k = zufall(p.zellen[0], p.zellen[1]);
  // Die Vorlage liegt unterhalb der Linie
  const unten = function (x, y) {
    if (achse === 'diagonal') return p.aufAchse ? x <= y : x < y;
    return p.aufAchse ? x + y >= n - 1 : x + y > n - 1;
  };
  for (let versuch = 0; versuch < 300; versuch++) {
    const alle = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (unten(x, y)) alle.push({ x: x, y: y });
    const vorgabe = mischen(alle).slice(0, k);
    const aufDerLinie = vorgabe.filter(function (z) {
      return achse === 'diagonal' ? z.x === z.y : z.x + z.y === n - 1;
    }).length;
    if (aufDerLinie > 1) continue;
    const a = spiegelAufgabe(stufe, n, n, achse, vorgabe);
    if (a.anzeige.ziel < 1) continue;
    return a;
  }
  throw new Error('keine Diagonal-Figur gefunden');
}

/* Drehen mit einer Katalogform (rechtwinkliges Dreieck, L-Form, Flagge) */
function macheDrehenForm(stufe) {
  const chirale = ['rechtwinkligesDreieck', 'lForm', 'flagge'];
  const form = zufallsElement(chirale);
  const d0 = zufall(0, 3) * 90;
  const um = zufallsElement(stufe <= 5 ? [90, 180] : [90, 180, 270]);
  const um2 = zufallsElement([90, 180, 270]);
  const farbeId = zufallsElement(FARBEN).id;
  const f = function (extra) { return Object.assign({ form: form, farbe: farbeId, groesse: 'gross' }, extra); };

  const antwort = f({ drehung: (d0 + um) % 360 });
  const kandidaten = [
    { figur: f({ drehung: d0, spiegeln: true }), fehler: 'gespiegelt' },
    { figur: f({ drehung: (d0 + um2) % 360, spiegeln: true }), fehler: 'gespiegelt' },
    { figur: f({ drehung: (d0 + um + 90) % 360, spiegeln: true }), fehler: 'gespiegelt' },
    { figur: { form: zufallsElement(chirale.filter(function (x) { return x !== form; })), farbe: farbeId,
               groesse: 'gross', drehung: (d0 + um) % 360 }, fehler: 'andereForm' }
  ];
  const texte = {
    gespiegelt: 'Diese Kopie ist gespiegelt, nicht gedreht – wie ein linker statt ein rechter Handschuh. Dreh das Original in Gedanken weiter, dann kommst du nie auf sie.',
    andereForm: 'Das ist eine ganz andere Form. Vergleiche die Figuren genau.'
  };
  const ablenker = waehleAblenker(antwort, [[kandidaten[0]], [kandidaten[1], kandidaten[2]], [kandidaten[3]]],
                                  kandidaten, 3).map(function (k) {
    return Object.assign({}, k, { fehlerText: texte[k.fehler], falschThemen: ['drehen'] });
  });
  const auswahl = baueOptionen(antwort, ablenker, figurSvg, figurSchluessel);

  return {
    uebung: 'spiegeln', stufe: stufe, art: 'auswahl',
    frage: 'Welche Figur ist das Original – nur gedreht, nicht gespiegelt?',
    anzeige: { layout: 'vorlage', bilder: [figurSvg(f({ drehung: d0 }))], beschriftungen: ['Original'] },
    optionen: auswahl.optionen,
    richtig: auswahl.richtig,
    erklaerung: 'Die richtige Figur ist das Original, um ' +
      (um === 90 ? 'eine Vierteldrehung' : (um === 180 ? 'eine halbe Drehung' : 'eine Dreivierteldrehung')) +
      ' im Uhrzeigersinn gedreht. Ein rechter Handschuh bleibt beim Drehen ein rechter – gespiegelt wird er ein linker.',
    merksatz: 'Drehen heißt: das Blatt Papier drehen. Spiegeln heißt: das Blatt umklappen.',
    themen: ['drehen']
  };
}

/* Eine chirale Gitterfigur, die ins n×n-Gitter passt */
function chiraleFigur(n, k) {
  for (let versuch = 0; versuch < 500; versuch++) {
    const fig = wachseFigur(k, n, n);
    if (fig && istChiral(fig)) return fig;
  }
  throw new Error('keine chirale Figur gefunden');
}

function macheDrehenGitter(stufe, p) {
  const n = p.n;
  const k = zufall(p.zellen[0], p.zellen[1]);
  const fig = chiraleFigur(n, k);
  const um = zufallsElement([90, 180, 270]);
  const antwort = dreheZellen(fig, n, um);
  const gedreht = drehSchluessel(fig);
  const gespiegelt = spiegleZellen(fig, n, n, 'senkrecht');

  const kandidatenSpiegel = mischen([0, 90, 180, 270]).map(function (g) {
    return { figur: dreheZellen(gespiegelt, n, g), fehler: 'gespiegelt',
             fehlerText: 'Diese Kopie ist gespiegelt, nicht gedreht – der „linke Handschuh“. Dreh das Original in Gedanken um ' +
                         (um === 180 ? 'eine halbe Drehung' : 'eine Vierteldrehung') + ', dann siehst du den Unterschied.' };
  });

  // Eine Figur, bei der ein Feld verrutscht ist
  const verschoben = [];
  for (let versuch = 0; versuch < 60 && verschoben.length < 2; versuch++) {
    const neu = antwort.slice();
    const weg = zufall(0, neu.length - 1);
    const frei = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!enthaeltZelle(neu, x, y)) frei.push({ x: x, y: y });
    neu.splice(weg, 1, zufallsElement(frei));
    const s = formSchluessel(neu);
    if (!zusammenhaengend(neu) || gedreht.indexOf(s) !== -1 ||
        drehSchluessel(gespiegelt).indexOf(s) !== -1) continue;
    verschoben.push({ figur: neu, fehler: 'verschoben',
                      fehlerText: 'Bei dieser Figur liegt ein Feld an einer anderen Stelle – vergleiche die Felder einzeln.' });
  }

  // Auswählen: nach Form vergleichen (egal wo im Gitter)
  const gewaehlt = [];
  const schon = [formSchluessel(antwort)];
  for (const k2 of kandidatenSpiegel.concat(verschoben)) {
    if (gewaehlt.length >= 3) break;
    if (gewaehlt.filter(function (g) { return g.fehler === 'gespiegelt'; }).length >= 2 && k2.fehler === 'gespiegelt' &&
        verschoben.length) continue;
    const s = formSchluessel(k2.figur);
    if (schon.indexOf(s) !== -1) continue;
    schon.push(s);
    gewaehlt.push(Object.assign({ falschThemen: ['drehen'] }, k2));
  }
  for (const k2 of kandidatenSpiegel) {
    if (gewaehlt.length >= 3) break;
    const s = formSchluessel(k2.figur);
    if (schon.indexOf(s) !== -1) continue;
    schon.push(s);
    gewaehlt.push(Object.assign({ falschThemen: ['drehen'] }, k2));
  }

  const zeichne = function (z) { return gitterSvg(z, n, {}); };
  const auswahl = baueOptionen(antwort, gewaehlt, zeichne, formSchluessel);
  return {
    uebung: 'spiegeln', stufe: stufe, art: 'auswahl',
    frage: 'Welche Figur ist das Original – nur gedreht, nicht gespiegelt?',
    anzeige: { layout: 'vorlage', bilder: [gitterSvg(fig, n, { name: 'Original' })], beschriftungen: ['Original'] },
    optionen: auswahl.optionen,
    richtig: auswahl.richtig,
    erklaerung: 'Die richtige Figur ist das Original, um ' +
      (um === 90 ? 'eine Vierteldrehung' : (um === 180 ? 'eine halbe Drehung' : 'eine Dreivierteldrehung')) +
      ' im Uhrzeigersinn gedreht. Beim Drehen bleiben alle Felder zusammen, nur die Richtung ändert sich.',
    merksatz: 'Drehen heißt: das Blatt Papier drehen. Spiegeln heißt: das Blatt umklappen.',
    themen: ['drehen'],
    figur: fig, n: n
  };
}

/* „Gespiegelt oder gedreht?“ — zwei Knöpfe */
function macheSchnellfrage(stufe, p) {
  const n = p.n;
  const fig = chiraleFigur(n, zufall(p.zellen[0], p.zellen[1]));
  const istGespiegelt = Math.random() < 0.5;
  const kopie = istGespiegelt
    ? dreheZellen(spiegleZellen(fig, n, n, 'senkrecht'), n, zufallsElement([0, 90, 180, 270]))
    : dreheZellen(fig, n, zufallsElement([90, 180, 270]));
  const richtig = istGespiegelt ? 'gespiegelt' : 'gedreht';

  return {
    uebung: 'spiegeln', stufe: stufe, art: 'auswahl',
    frage: 'Wurde die Figur gedreht oder gespiegelt?',
    anzeige: { layout: 'vorlage', bilder: [gitterSvg(fig, n, { name: 'Original' }), gitterSvg(kopie, n, { name: 'Kopie' })],
               beschriftungen: ['Original', 'Kopie'] },
    optionen: [
      { id: 'gedreht', text: '🔄 gedreht', schluessel: 'gedreht',
        fehlerText: istGespiegelt ? 'Die Kopie ist gespiegelt: Wie du das Original auch drehst, es wird nie genau diese Figur.' : null,
        falschThemen: ['drehen'] },
      { id: 'gespiegelt', text: '🪞 gespiegelt', schluessel: 'gespiegelt',
        fehlerText: istGespiegelt ? null : 'Die Kopie ist nur gedreht: Dreh das Original in Gedanken weiter, dann passt es genau.',
        falschThemen: ['drehen'] }
    ],
    richtig: richtig,
    erklaerung: istGespiegelt
      ? 'Die Kopie ist gespiegelt – wie ein linker und ein rechter Handschuh. Durch Drehen allein kommst du nicht darauf.'
      : 'Die Kopie ist nur gedreht – alle Felder sind noch in derselben Anordnung, nur in eine andere Richtung gedreht.',
    merksatz: 'Drehen heißt: das Blatt Papier drehen. Spiegeln heißt: das Blatt umklappen.',
    themen: ['drehen'],
    figur: fig, kopie: kopie, n: n
  };
}

/* Fehlertext für die Gitter-Variante */
function spiegelFehler(aufgabe, antwort) {
  const soll = aufgabe.richtig;
  const vorgabe = aufgabe.anzeige.vorgabe;
  const ist = antwort || [];
  const zuFinden = soll.filter(function (z) { return !enthaeltZelle(vorgabe, z.x, z.y); });
  const getroffen = zuFinden.filter(function (z) { return enthaeltZelle(ist, z.x, z.y); }).length;
  let text = getroffen + ' von ' + zuFinden.length + ' Feldern stimmen.';
  const fehlt = zuFinden.filter(function (z) { return !enthaeltZelle(ist, z.x, z.y); })[0];
  const zuviel = ist.filter(function (z) { return !enthaeltZelle(soll, z.x, z.y); })[0];
  const achse = aufgabe.anzeige.achse;
  if (fehlt && (achse === 'senkrecht' || achse === 'waagerecht')) {
    const halb = achse === 'senkrecht' ? aufgabe.anzeige.breite / 2 : aufgabe.anzeige.hoehe / 2;
    const abstand = achse === 'senkrecht' ? fehlt.x - halb + 1 : fehlt.y - halb + 1;
    text += ' Das Feld in Zeile ' + (fehlt.y + 1) + ', Spalte ' + (fehlt.x + 1) + ' fehlt: Sein Spiegelbild liegt ' +
            abstand + (abstand === 1 ? ' Feld' : ' Felder') + ' vor der Achse, also liegt es ' + abstand +
            (abstand === 1 ? ' Feld' : ' Felder') + ' dahinter.';
  } else if (fehlt) {
    text += ' Es fehlt das Feld in Zeile ' + (fehlt.y + 1) + ', Spalte ' + (fehlt.x + 1) + '.';
  }
  if (zuviel) text += ' Zu viel ist das Feld in Zeile ' + (zuviel.y + 1) + ', Spalte ' + (zuviel.x + 1) + '.';
  return text;
}

uebung('spiegeln', {
  gruppe: 'formen',
  titel: 'Spiegeln und Drehen',
  symbol: '🪞',
  alter: [9, 12],
  beschreibung: 'Figuren an einer Linie spiegeln und gedrehte von gespiegelten Figuren unterscheiden.',
  lernziel: 'Du lernst den Unterschied zwischen Spiegeln (umklappen) und Drehen (wie ein Uhrzeiger) – das brauchst du in Geometrie und beim Kartenlesen.',
  tipps: [
    'Beim Spiegeln zählst du die Felder bis zur Achse: 2 Felder links von der Achse wird zu 2 Feldern rechts – in derselben Zeile.',
    'Beim Drehen stell dir vor, du drehst das Blatt Papier. Ein rechter Handschuh bleibt beim Drehen ein rechter – gespiegelt wird er ein linker.'
  ],
  stufen: SPIEGEL_STUFEN,
  beispiel: function () {
    return formSvg('lForm', { farbe: 'gelb' }) + formSvg('lForm', { farbe: 'gelb', drehung: 90 }) +
           formSvg('lForm', { farbe: 'gelb', spiegeln: true });
  },
  macheAufgabe: macheSpiegeln,
  fehlerText: function (aufgabe, antwort) {
    if (aufgabe.art === 'gitter') return spiegelFehler(aufgabe, antwort);
    return null;
  },
  zeitMitUhr: function (aufgabe) {
    if (aufgabe.art === 'gitter') return Math.max(30, 8 * aufgabe.anzeige.ziel);
    return aufgabe.optionen.length === 2 ? 15 : 30;
  }
});
