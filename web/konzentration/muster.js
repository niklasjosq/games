/* ============================================================
   MUSTER — Reihe fortsetzen und Matrix 3×3.

   Eine Figur hat sechs Eigenschaften (Attribute):
     form, farbe, groesse, drehung, anzahl, position
   Eine Regel verändert genau eine davon von Figur zu Figur:
     { art: 'ab' | 'abc' | 'abcd' | 'aabb' | 'abb' | 'schritt',
       attribut: 'farbe', werte: [...] }
   ============================================================ */

const MUSTER_FORMEN = ['kreis', 'dreieck', 'quadrat', 'stern', 'herz', 'sechseck', 'raute', 'fuenfeck'];
const MUSTER_DREHFORMEN = ['pfeil', 'halbkreis', 'flagge', 'herz', 'trapez', 'lForm'];

const MUSTERARTEN = {
  ab: [0, 1], abc: [0, 1, 2], abcd: [0, 1, 2, 3], aabb: [0, 0, 1, 1], abb: [0, 1, 1]
};
const MIN_FIGUREN = { ab: 3, abc: 4, abcd: 5, aabb: 5, abb: 6, schritt: 3 };

const ATTR_NAME = {
  form: 'die Form', farbe: 'die Farbe', groesse: 'die Größe',
  drehung: 'die Drehung', anzahl: 'die Anzahl', position: 'der Platz'
};

const ATTR_DATIV = {
  form: 'der Form', farbe: 'der Farbe', groesse: 'der Größe',
  drehung: 'der Drehung', anzahl: 'der Anzahl', position: 'dem Platz'
};

const GROESSEN_NAME = { klein: 'klein', mittel: 'mittel', gross: 'groß' };

/* Welche Regeln gibt es ab welcher Stufe? */
const REGELKATALOG = [
  { art: 'ab', attribut: 'farbe', ab: 1 },
  { art: 'ab', attribut: 'form', ab: 1 },
  { art: 'schritt', attribut: 'groesse', variante: 'auf', ab: 1 },
  { art: 'ab', attribut: 'groesse', ab: 2 },
  { art: 'ab', attribut: 'drehung', ab: 2 },
  { art: 'abc', attribut: 'farbe', ab: 2 },
  { art: 'abc', attribut: 'form', ab: 2 },
  { art: 'schritt', attribut: 'anzahl', variante: 'plus', ab: 2 },
  { art: 'schritt', attribut: 'drehung', variante: '90', ab: 3 },
  { art: 'abc', attribut: 'groesse', ab: 3 },
  { art: 'ab', attribut: 'position', ab: 3 },
  { art: 'ab', attribut: 'anzahl', ab: 3 },
  { art: 'schritt', attribut: 'anzahl', variante: 'minus', ab: 3 },
  { art: 'schritt', attribut: 'groesse', variante: 'ab', ab: 3 },
  { art: 'aabb', attribut: 'form', ab: 4 },
  { art: 'aabb', attribut: 'farbe', ab: 4 },
  { art: 'abcd', attribut: 'form', ab: 5 },
  { art: 'abcd', attribut: 'farbe', ab: 5 },
  { art: 'schritt', attribut: 'drehung', variante: '45', ab: 5 },
  { art: 'abc', attribut: 'anzahl', ab: 5 },
  { art: 'schritt', attribut: 'position', ab: 6 },
  { art: 'abb', attribut: 'form', ab: 6 },
  { art: 'abb', attribut: 'farbe', ab: 6 },
  { art: 'abc', attribut: 'position', ab: 6 },
  { art: 'schritt', attribut: 'drehung', variante: 'gegen', ab: 8 }
];

/* Passen diese Regeln zusammen? */
function regelnGueltig(regeln, stufe, figuren) {
  const attribute = regeln.map(function (r) { return r.attribut; });
  const hat = function (a) { return attribute.indexOf(a) !== -1; };
  if (new Set(attribute).size !== attribute.length) return false;
  if (hat('anzahl') && hat('position')) return false;
  if (hat('groesse') && (hat('anzahl') || hat('position'))) return false;
  if (hat('drehung') && hat('anzahl') && stufe < 7) return false;
  for (const r of regeln) {
    if (figuren < MIN_FIGUREN[r.art]) return false;
    if (r.art === 'schritt' && r.attribut === 'groesse' && figuren + 1 > GROESSEN_REIHE.length) return false;
    if (r.art === 'schritt' && r.attribut === 'anzahl' && figuren + 1 > 6) return false;
  }
  return true;
}

function anzahlVerschieden(art) {
  return new Set(MUSTERARTEN[art]).size;
}

/* Die Werte einer Regel auswürfeln */
function baueRegel(vorlage, figuren, formPool) {
  const r = { art: vorlage.art, attribut: vorlage.attribut, variante: vorlage.variante || null, werte: [] };
  const k = r.art === 'schritt' ? 0 : anzahlVerschieden(r.art);
  const lang = figuren + 3;

  if (r.attribut === 'farbe') r.werte = waehleFarben(k);
  else if (r.attribut === 'form') r.werte = mischen(formPool.slice()).slice(0, k);
  else if (r.attribut === 'groesse') {
    if (r.art === 'schritt') r.werte = r.variante === 'ab' ? GROESSEN_REIHE.slice().reverse() : GROESSEN_REIHE.slice();
    else if (k === 2) r.werte = mischen(['klein', 'gross']);
    else r.werte = rotiere(['klein', 'mittel', 'gross'], zufall(0, 2));
  } else if (r.attribut === 'drehung') {
    const start = zufall(0, 3) * 90;
    if (r.art === 'schritt') {
      const schritt = r.variante === '45' ? 45 : (r.variante === 'gegen' ? -90 : 90);
      for (let i = 0; i < lang; i++) r.werte.push((((start + i * schritt) % 360) + 360) % 360);
    } else {
      r.werte = [start, (start + 180) % 360];
    }
  } else if (r.attribut === 'anzahl') {
    if (r.art === 'schritt') {
      if (r.variante === 'minus') {
        const start = zufall(figuren + 1, 6);
        for (let v = start; v >= 1; v--) r.werte.push(v);
      } else {
        const start = zufall(1, 6 - figuren);
        for (let v = start; v <= 6; v++) r.werte.push(v);
      }
    } else if (k === 2) r.werte = mischen(zufallsElement([[1, 2], [2, 3]]).slice());
    else r.werte = rotiere([1, 2, 3], zufall(0, 2));
  } else if (r.attribut === 'position') {
    if (r.art === 'schritt') {
      const start = zufall(0, 7);
      for (let i = 0; i < lang; i++) r.werte.push(RANDPLAETZE[(start + i) % 8]);
    } else if (k === 2) r.werte = mischen(['links', 'rechts']);
    else r.werte = rotiere(['links', 'mitte', 'rechts'], zufall(0, 2));
  }
  return r;
}

function rotiere(liste, um) {
  return liste.slice(um).concat(liste.slice(0, um));
}

/* Welchen Wert hat die Regel an Stelle i (0 = erste Figur)? */
function wertAn(regel, i) {
  if (i < 0) return undefined;
  if (regel.art === 'schritt') return regel.werte[i];
  const muster = MUSTERARTEN[regel.art];
  return regel.werte[muster[i % muster.length]];
}

function figurAnPosition(basis, regeln, i) {
  const f = Object.assign({}, basis);
  for (const r of regeln) f[r.attribut] = wertAn(r, i);
  return f;
}

/* ---------------- Werte in Worten ---------------- */

function wertName(attribut, wert) {
  if (attribut === 'farbe') return farbe(wert).name;
  if (attribut === 'form') return formWort(wert);
  if (attribut === 'groesse') return GROESSEN_NAME[wert] || wert;
  if (attribut === 'anzahl') return String(wert);
  if (attribut === 'position') return POSITIONS_NAMEN[wert] || wert;
  if (attribut === 'drehung') return wert + '°';
  return String(wert);
}

function beschreibeRegel(r, n, basis) {
  const w = function (v) { return wertName(r.attribut, v); };
  const naechster = wertAn(r, n);
  const letzter = wertAn(r, n - 1);

  if (r.art === 'schritt') {
    if (r.attribut === 'groesse') {
      return r.variante === 'ab' ? 'Die Figur wird jedes Mal ein Stück kleiner.'
                                 : 'Die Figur wird jedes Mal ein Stück größer.';
    }
    if (r.attribut === 'anzahl') {
      const bisher = [];
      for (let i = 0; i < n; i++) bisher.push(wertAn(r, i));
      return (r.variante === 'minus' ? 'Es wird jedes Mal eine Figur weniger: '
                                     : 'Es kommt jedes Mal eine Figur dazu: ') +
             bisher.join(', ') + ' – also jetzt ' + naechster + '.';
    }
    if (r.attribut === 'drehung') {
      if (r.variante === '45') {
        return 'Die Figur dreht sich jedes Mal um eine Achteldrehung (45°) im Uhrzeigersinn – halb so weit wie eine Vierteldrehung.';
      }
      if (r.variante === 'gegen') {
        return 'Die Figur dreht sich jedes Mal um eine Vierteldrehung (90°) gegen den Uhrzeigersinn – also rückwärts wie ein Uhrzeiger.';
      }
      return 'Die Figur dreht sich jedes Mal um eine Vierteldrehung (90°) im Uhrzeigersinn – wie der Zeiger einer Uhr.';
    }
    if (r.attribut === 'position') {
      return 'Die Figur wandert jedes Mal ein Feld weiter im Uhrzeigersinn um den Rand.';
    }
  }

  const k = anzahlVerschieden(r.art);
  const zyklus = r.werte.slice(0, k).map(w);

  if (r.art === 'ab') {
    if (r.attribut === 'farbe') {
      return 'Die Farbe wechselt immer ab: ' + zyklus[0] + ', ' + zyklus[1] + ', ' + zyklus[0] + ', ' +
             zyklus[1] + ' … Als Nächstes kommt also wieder ' + w(naechster) + '.';
    }
    if (r.attribut === 'form') {
      return 'Die Form wechselt immer ab: ' + zyklus[0] + ', ' + zyklus[1] + ', ' + zyklus[0] + ', ' +
             zyklus[1] + ' … Jetzt ist wieder ' + formMitArtikel(naechster) + ' dran.';
    }
    if (r.attribut === 'groesse') {
      return 'Die Figur ist abwechselnd klein und groß. Jetzt kommt wieder eine ' +
             beuge(naechster === 'gross' ? 'groß' : 'klein', 'die', true, false) + ' Figur.';
    }
    if (r.attribut === 'drehung') {
      return grossAnfang(formMitArtikel(basis.form)) +
             ' dreht sich immer hin und her: mal so, mal um eine halbe Drehung auf dem Kopf.';
    }
    if (r.attribut === 'anzahl') {
      return 'Es sind abwechselnd ' + zyklus[0] + ' und ' + zyklus[1] + ' Figuren im Feld – jetzt also ' +
             w(naechster) + '.';
    }
    if (r.attribut === 'position') {
      return 'Die Figur springt immer zwischen links und rechts hin und her.';
    }
  }

  if (r.art === 'abc' || r.art === 'abcd') {
    if (r.attribut === 'farbe' || r.attribut === 'form') {
      return (r.attribut === 'farbe' ? 'Die Farbe' : 'Die Form') +
             ' geht immer in derselben Reihenfolge weiter: ' + zyklus.join(' → ') +
             ' → und dann wieder von vorn. Nach ' + w(letzter) + ' kommt ' + w(naechster) + '.';
    }
    if (r.attribut === 'groesse') return 'Die Größe geht immer reihum: ' + zyklus.join(' → ') + ' → und wieder von vorn.';
    if (r.attribut === 'anzahl') return 'Die Anzahl geht immer reihum: ' + zyklus.join(' → ') + ' → und wieder von vorn.';
    if (r.attribut === 'position') return 'Die Figur wandert ' + zyklus.join(' → ') + ' → und fängt wieder von vorn an.';
  }

  if (r.art === 'aabb') {
    return 'Immer zwei gleiche, dann wechselt es: ' + [zyklus[0], zyklus[0], zyklus[1], zyklus[1], zyklus[0], zyklus[0]].join(', ') + ' …';
  }
  if (r.art === 'abb') {
    return 'Das Muster ist: einmal ' + zyklus[0] + ', dann zweimal ' + zyklus[1] + ' – und wieder von vorn.';
  }
  return 'Achte auf ' + ATTR_NAME[r.attribut] + '.';
}

function beschreibeRegeln(regeln, n, basis) {
  if (regeln.length === 1) return beschreibeRegel(regeln[0], n, basis);
  const zahlwort = regeln.length === 2 ? 'zwei' : 'drei';
  return 'Hier gelten ' + zahlwort + ' Regeln: ' + regeln.map(function (r, i) {
    return (i + 1) + ') ' + beschreibeRegel(r, n, basis);
  }).join(' ');
}

/* ---------------- Falsche Möglichkeiten ---------------- */

function konstantesGeaendertText(attribut, basis, falsch) {
  if (attribut === 'form') {
    return 'Die Form ändert sich in dieser Reihe gar nicht – alle sind ' + formWort(basis.form, { plural: true }) +
           '. Deine Figur ist aber ' + formMitEin(falsch.form) + '.';
  }
  if (attribut === 'farbe') {
    return 'Die Farbe ändert sich in dieser Reihe gar nicht – alle sind ' + farbe(basis.farbe).name +
           '. Deine Figur ist aber ' + farbe(falsch.farbe).name + '.';
  }
  if (attribut === 'groesse') {
    return 'Die Größe ändert sich in dieser Reihe gar nicht. Deine Figur ist aber ' +
           (GROESSEN[falsch.groesse] > GROESSEN[basis.groesse] ? 'größer' : 'kleiner') + '.';
  }
  if (attribut === 'drehung') {
    return 'Die Drehung ändert sich in dieser Reihe gar nicht – alle stehen gleich. Deine Figur ist aber gedreht.';
  }
  return 'In jedem Feld ist genau eine Figur. Bei dir sind es ' + falsch.anzahl + '.';
}

/* Alle Arten, eine konstante Eigenschaft zu verändern */
function konstanteAblenker(basis, regeln, formPool, antwort) {
  const geregelt = regeln.map(function (r) { return r.attribut; });
  const frei = function (a) { return geregelt.indexOf(a) === -1; };
  const liste = [];
  const neu = function (attribut, wert) {
    const f = Object.assign({}, antwort);
    f[attribut] = wert;
    liste.push({ figur: f, fehler: 'konstantesGeaendert', falschThemen: geregelt.slice(),
                 fehlerText: konstantesGeaendertText(attribut, basis, f) });
  };

  if (frei('form')) {
    for (const f of mischen(formPool.filter(function (x) { return x !== basis.form; })).slice(0, 2)) neu('form', f);
  }
  if (frei('farbe')) {
    const andere = FARBEN.map(function (f) { return f.id; })
      .filter(function (c) { return c !== basis.farbe && !verwechselbar(c, basis.farbe); });
    for (const c of mischen(andere).slice(0, 2)) neu('farbe', c);
  }
  if (frei('groesse') && frei('anzahl') && frei('position')) neu('groesse', zufallsElement(['klein', 'gross']));
  if (frei('drehung') && FORMEN[antwort.form].drehordnung === 1) neu('drehung', (antwort.drehung + 90) % 360);
  if (frei('anzahl') && frei('position') && frei('groesse')) neu('anzahl', 2);
  return mischen(liste);
}

/* Ein Fehler bei genau einer Regel */
function einzelAblenker(r, n, antwort, reihenfolge) {
  const arten = reihenfolge || mischen(['stehengeblieben', 'uebersprungen', 'rueckwaerts']);
  const liste = [];
  for (const art of arten) {
    const index = { stehengeblieben: n - 1, uebersprungen: n + 1, rueckwaerts: n - 2 }[art];
    const wert = wertAn(r, index);
    if (wert === undefined) continue;
    const f = Object.assign({}, antwort);
    f[r.attribut] = wert;
    const text = {
      stehengeblieben: 'Bei deiner Figur ist ' + ATTR_NAME[r.attribut] + ' stehen geblieben.',
      uebersprungen: 'Deine Figur hat bei ' + ATTR_DATIV[r.attribut] + ' einen Schritt übersprungen.',
      rueckwaerts: 'Bei deiner Figur geht ' + ATTR_NAME[r.attribut] + ' rückwärts statt vorwärts.'
    }[art];
    liste.push({ figur: f, fehler: art, falschThemen: [r.attribut], fehlerText: text });
  }
  return liste;
}

function beideAblenker(r1, r2, n, antwort) {
  const liste = [];
  for (const i1 of [n - 1, n + 1]) {
    for (const i2 of [n - 1, n + 1]) {
      const w1 = wertAn(r1, i1), w2 = wertAn(r2, i2);
      if (w1 === undefined || w2 === undefined) continue;
      const f = Object.assign({}, antwort);
      f[r1.attribut] = w1;
      f[r2.attribut] = w2;
      liste.push({ figur: f, fehler: 'beideFalsch', falschThemen: [r1.attribut, r2.attribut],
                   fehlerText: 'Bei deiner Figur stimmen ' + ATTR_NAME[r1.attribut] + ' und ' +
                               ATTR_NAME[r2.attribut] + ' nicht.' });
    }
  }
  return mischen(liste);
}

/* Aus Kandidaten drei verschiedene Ablenker auswählen */
function waehleAblenker(antwort, gruppen, reserve, anzahl) {
  const gewaehlt = [];
  const schon = [figurSchluessel(antwort)];
  const nimm = function (k) {
    const s = figurSchluessel(k.figur);
    if (schon.indexOf(s) !== -1) return false;
    schon.push(s);
    gewaehlt.push(k);
    return true;
  };
  for (const gruppe of gruppen) {
    if (gewaehlt.length >= anzahl) break;
    for (const k of gruppe) if (nimm(k)) break;
  }
  for (const k of mischen(reserve.slice())) {
    if (gewaehlt.length >= anzahl) break;
    nimm(k);
  }
  return gewaehlt;
}

function baueOptionen(antwort, ablenker, zeichne, schluessel) {
  const optionen = [{ figur: antwort, richtig: true }].concat(ablenker);
  mischen(optionen);
  let richtigeId = null;
  const liste = optionen.map(function (o, i) {
    const id = 'o' + i;
    if (o.richtig) richtigeId = id;
    return {
      id: id, svg: zeichne(o.figur), figur: o.figur, schluessel: schluessel(o.figur),
      fehler: o.richtig ? null : o.fehler, fehlerText: o.richtig ? null : o.fehlerText,
      falschThemen: o.richtig ? [] : (o.falschThemen || [])
    };
  });
  return { optionen: liste, richtig: richtigeId };
}

/* ============================================================
   REIHE FORTSETZEN
   ============================================================ */

const REIHE_STUFEN = [
  { figuren: 4, regeln: 1, plan: ['stehen', 'konst', 'konst'] },
  { figuren: 4, regeln: 1, plan: ['stehen', 'konst', 'konst'] },
  { figuren: 5, regeln: 1, plan: ['stehen', 'sprung', 'konst'] },
  { figuren: 5, regeln: 2, plan: ['einzel0', 'einzel1', 'konst'], nurFFG: true },
  { figuren: 5, regeln: 2, plan: ['einzel0', 'einzel1', 'beide'] },
  { figuren: 6, regeln: 2, plan: ['einzel0', 'einzel1', 'beide'] },
  { figuren: 6, regeln: 3, plan: ['einzel0', 'einzel1', 'einzel2'] },
  { figuren: 6, regeln: 3, plan: ['letzte', 'einzel0', 'einzel1', 'einzel2'] }
];

function waehleRegeln(stufe, p) {
  const pool = REGELKATALOG.filter(function (v) {
    if (v.ab > stufe) return false;
    if (MIN_FIGUREN[v.art] > p.figuren) return false;
    if (p.nurFFG) {
      return ['form', 'farbe', 'groesse'].indexOf(v.attribut) !== -1 &&
             ['ab', 'abc', 'aabb'].indexOf(v.art) !== -1;
    }
    return true;
  });
  // Bei einer einzigen Regel die neuen Regeln der Stufe bevorzugen
  for (let versuch = 0; versuch < 300; versuch++) {
    const auswahl = mischen(pool.slice()).slice(0, p.regeln);
    if (regelnGueltig(auswahl, stufe, p.figuren)) return auswahl;
  }
  throw new Error('keine passenden Regeln für Stufe ' + stufe);
}

function macheReihe(stufe) {
  const p = REIHE_STUFEN[klemmeStufe(stufe) - 1];
  const vorlagen = waehleRegeln(stufe, p);
  const dreht = vorlagen.some(function (v) { return v.attribut === 'drehung'; });
  const formPool = dreht ? MUSTER_DREHFORMEN : MUSTER_FORMEN;

  const basis = { form: zufallsElement(formPool), farbe: zufallsElement(FARBEN).id,
                  groesse: 'mittel', drehung: 0, anzahl: 1, position: null };
  const regeln = vorlagen.map(function (v) { return baueRegel(v, p.figuren, formPool); });
  const n = p.figuren;

  const figuren = [];
  for (let i = 0; i < n; i++) figuren.push(figurAnPosition(basis, regeln, i));
  const antwort = figurAnPosition(basis, regeln, n);
  const letzte = figuren[n - 1];

  const konst = konstanteAblenker(basis, regeln, formPool, antwort);
  const gruppen = p.plan.map(function (schritt) {
    if (schritt === 'stehen') return einzelAblenker(regeln[0], n, antwort, ['stehengeblieben', 'rueckwaerts', 'uebersprungen']);
    if (schritt === 'sprung') return einzelAblenker(regeln[0], n, antwort, mischen(['uebersprungen', 'rueckwaerts']).concat(['stehengeblieben']));
    if (schritt === 'konst') return konst.slice();
    if (schritt === 'beide') return beideAblenker(regeln[0], regeln[1], n, antwort);
    if (schritt === 'letzte') {
      return [{ figur: letzte, fehler: 'letzteKopie', falschThemen: regeln.map(function (r) { return r.attribut; }),
                fehlerText: 'Das ist einfach die letzte Figur noch einmal – aber die Reihe geht weiter.' }];
    }
    const i = Number(schritt.replace('einzel', ''));
    return regeln[i] ? einzelAblenker(regeln[i], n, antwort) : [];
  });

  let reserve = konst.slice();
  for (const r of regeln) reserve = reserve.concat(einzelAblenker(r, n, antwort));
  if (regeln.length > 1) reserve = reserve.concat(beideAblenker(regeln[0], regeln[1], n, antwort));

  const ablenker = waehleAblenker(antwort, gruppen, reserve, 3);
  const auswahl = baueOptionen(antwort, ablenker, figurSvg, figurSchluessel);
  const erklaerung = beschreibeRegeln(regeln, n, basis);

  return {
    uebung: 'reihe', stufe: stufe, art: 'auswahl',
    frage: 'Welche Figur kommt als Nächstes?',
    anzeige: { layout: 'reihe', bilder: figuren.map(figurSvg) },
    optionen: auswahl.optionen,
    richtig: auswahl.richtig,
    erklaerung: erklaerung,
    richtigText: 'Die Regel: ' + erklaerung,
    themen: regeln.map(function (r) { return r.attribut; }),
    // für die Selbsttests
    basis: basis, regeln: regeln, figuren: figuren, antwort: antwort
  };
}

uebung('reihe', {
  gruppe: 'muster',
  titel: 'Reihe fortsetzen',
  symbol: '➡️',
  alter: [8, 12],
  beschreibung: 'Figuren folgen einer Regel: Farbe, Form, Größe, Drehung, Anzahl oder Platz. Welche kommt als Nächstes?',
  lernziel: 'Du lernst, Regeln in Mustern zu erkennen – das ist wie Detektivarbeit und hilft in Mathe bei Zahlenreihen.',
  tipps: [
    'Frag dich nacheinander: Ändert sich die Farbe? Die Form? Die Größe? Die Drehung? Die Anzahl?',
    'Vergleiche immer nur zwei Nachbarn: Was ist von der ersten zur zweiten Figur passiert – und passiert dasselbe von der zweiten zur dritten?'
  ],
  stufen: REIHE_STUFEN,
  beispiel: function () {
    return ['rot', 'blau', 'rot', 'blau'].map(function (c) { return formSvg('dreieck', { farbe: c }); }).join('');
  },
  macheAufgabe: macheReihe,
  zeitMitUhr: function (aufgabe) { return aufgabe.stufe <= 3 ? 30 : (aufgabe.stufe <= 6 ? 40 : 50); }
});

/* ============================================================
   MATRIX 3×3
   ============================================================ */

const MATRIX_STUFEN = [
  { typen: ['kk'], paare: [['form', 'farbe'], ['farbe', 'form']], luecke: 'ecke' },
  { typen: ['kk'], paare: [['form', 'farbe'], ['farbe', 'form'], ['form', 'groesse'], ['groesse', 'form'],
                           ['farbe', 'groesse'], ['groesse', 'farbe'], ['form', 'anzahl'], ['anzahl', 'farbe']], luecke: 'ecke' },
  { typen: ['kl'], paare: [['form', 'farbe'], ['farbe', 'form'], ['form', 'groesse'], ['farbe', 'groesse']], luecke: 'ecke' },
  { typen: ['kl'], paare: [['form', 'farbe'], ['farbe', 'form'], ['form', 'groesse'], ['farbe', 'groesse'],
                           ['form', 'anzahl'], ['farbe', 'anzahl']], luecke: 'zufall' },
  { typen: ['ll', 'sk'], paare: [['form', 'farbe'], ['farbe', 'groesse'], ['form', 'anzahl']], luecke: 'zufall' },
  { typen: ['ss'], luecke: 'zufall' },
  { typen: ['ll', 'sk', 'ss'], paare: [['form', 'farbe'], ['farbe', 'groesse'], ['form', 'anzahl']], luecke: 'zufall', tauschen: true },
  { typen: ['drei'], luecke: 'zufall' }
];

const JEDE = { farbe: 'Jede Farbe', form: 'Jede Form', groesse: 'Jede Größe', anzahl: 'Jede Anzahl' };

function attrWert(attribut, wert) {
  if (attribut === 'form') return 'die Form ' + FORMEN[wert].name;
  if (attribut === 'anzahl') return 'die Anzahl ' + wert;
  return ATTR_NAME[attribut] + ' ' + wertName(attribut, wert);
}

function werteSatz(attribut) {
  if (attribut === 'farbe') return waehleFarben(3);
  if (attribut === 'form') return mischen(MUSTER_FORMEN.slice()).slice(0, 3);
  if (attribut === 'groesse') return mischen(['klein', 'mittel', 'gross']);
  if (attribut === 'anzahl') return mischen([1, 2, 3]);
  return [];
}

function schrittText(attribut) {
  if (attribut === 'anzahl') return 'kommt immer eine Figur dazu';
  if (attribut === 'drehung') return 'dreht sich die Figur immer um eine Vierteldrehung im Uhrzeigersinn weiter';
  return 'wird die Figur immer größer';
}

function macheMatrix(stufe) {
  const p = MATRIX_STUFEN[klemmeStufe(stufe) - 1];
  const typ = zufallsElement(p.typen);
  const basis = { form: zufallsElement(MUSTER_FORMEN), farbe: zufallsElement(FARBEN).id,
                  groesse: 'mittel', drehung: 0, anzahl: 1, position: null };

  let zelle;              // (r, c) → Figur
  let attribute;          // welche Eigenschaften sich ändern
  let erklaere;           // (r, c, antwort) → Text mit {ZEILE} {SPALTE} {LR} {OU}
  let richtungen = {};    // attribut → 'zeile' | 'spalte' (für „passt zur Spalte …“)

  if (typ === 'kk' || typ === 'kl' || typ === 'll') {
    const [A, B] = zufallsElement(p.paare);
    const aW = werteSatz(A), bW = werteSatz(B);
    attribute = [A, B];
    if (typ === 'kk') {
      richtungen[A] = 'zeile'; richtungen[B] = 'spalte';
      zelle = function (r, c) { const f = Object.assign({}, basis); f[A] = aW[r]; f[B] = bW[c]; return f; };
      erklaere = function (r, c, ant) {
        return 'Schau in die {ZEILE} mit der Lücke: Dort haben alle Figuren ' + attrWert(A, ant[A]) +
               '. Schau in die {SPALTE}: Dort haben alle ' + attrWert(B, ant[B]) +
               '. Das fehlende Feld braucht beides: ' + figurName(ant) + '.';
      };
    } else if (typ === 'kl') {
      richtungen[A] = 'zeile';
      const s = zufall(1, 2);
      zelle = function (r, c) { const f = Object.assign({}, basis); f[A] = aW[r]; f[B] = bW[(c + r * s) % 3]; return f; };
      erklaere = function (r, c, ant) {
        return 'In jeder {ZEILE} haben alle Figuren ' + ATTR_NAME[A].replace(/^die |^der /, 'dieselbe ') + ' – hier ' +
               wertName(A, ant[A]) + '. ' + JEDE[B] + ' kommt in jeder {ZEILE} und jeder {SPALTE} genau einmal vor – wie beim Sudoku. ' +
               'In dieser {ZEILE} fehlt noch ' + attrWert(B, ant[B]) + '. Also: ' + figurName(ant) + '.';
      };
    } else {
      zelle = function (r, c) { const f = Object.assign({}, basis); f[A] = aW[(r + c) % 3]; f[B] = bW[(r + 2 * c) % 3]; return f; };
      erklaere = function (r, c, ant) {
        return JEDE[A] + ' und ' + JEDE[B].replace('Jede', 'jede') + ' kommt in jeder {ZEILE} und jeder {SPALTE} genau einmal vor – wie beim Sudoku. ' +
               'In dieser {ZEILE} fehlen noch ' + attrWert(A, ant[A]) + ' und ' + attrWert(B, ant[B]) + '. Also: ' + figurName(ant) + '.';
      };
    }
  } else if (typ === 'sk') {
    const S = zufallsElement(['anzahl', 'drehung', 'groesse']);
    const K = S === 'drehung' ? 'farbe' : zufallsElement(['farbe', 'form']);
    if (S === 'drehung') basis.form = zufallsElement(MUSTER_DREHFORMEN);
    const kW = werteSatz(K);
    const start = zufall(0, 3) * 90;
    const versatz = zufall(0, 1);
    attribute = [S, K];
    richtungen[K] = 'zeile';
    zelle = function (r, c) {
      const f = Object.assign({}, basis);
      if (S === 'anzahl') f.anzahl = c + 1 + versatz;
      if (S === 'drehung') f.drehung = (start + 90 * c) % 360;
      if (S === 'groesse') f.groesse = ['klein', 'mittel', 'gross'][c];
      f[K] = kW[r];
      return f;
    };
    erklaere = function (r, c, ant) {
      return '{LR} ' + schrittText(S) + '. In jeder {ZEILE} haben alle Figuren ' + attrWert(K, ant[K]) +
             '. Also: ' + figurName(ant) + '.';
    };
  } else if (typ === 'ss') {
    const variante = zufall(0, 1);
    const start = zufall(0, 3) * 90;
    if (variante === 0) {
      basis.form = zufallsElement(MUSTER_DREHFORMEN);
      attribute = ['anzahl', 'drehung'];
      zelle = function (r, c) {
        return Object.assign({}, basis, { anzahl: c + 1, drehung: (start + 90 * r) % 360 });
      };
    } else {
      attribute = ['groesse', 'anzahl'];
      zelle = function (r, c) {
        return Object.assign({}, basis, { groesse: ['klein', 'mittel', 'gross'][c], anzahl: r + 1 });
      };
    }
    erklaere = function (r, c, ant) {
      return '{LR} ' + schrittText(attribute[0]) + '. {OU} ' + schrittText(attribute[1]) +
             '. Also: ' + figurName(ant) + '.';
    };
  } else {
    const F = werteSatz('form'), C = werteSatz('farbe');
    attribute = ['form', 'farbe', 'anzahl'];
    zelle = function (r, c) {
      return Object.assign({}, basis, { form: F[(r + c) % 3], farbe: C[(r + 2 * c) % 3], anzahl: c + 1 });
    };
    erklaere = function (r, c, ant) {
      return 'Jede Form und jede Farbe kommt in jeder {ZEILE} und jeder {SPALTE} genau einmal vor – und {LR} kommt immer eine Figur dazu. Also: ' +
             figurName(ant) + '.';
    };
  }

  // Zeilen und Spalten tauschen (nur höhere Stufen)
  const getauscht = !!p.tauschen && Math.random() < 0.5;
  const figurBei = function (r, c) { return getauscht ? zelle(c, r) : zelle(r, c); };

  const luecke = p.luecke === 'ecke' ? { r: 2, c: 2 } : { r: zufall(0, 2), c: zufall(0, 2) };
  const antwort = figurBei(luecke.r, luecke.c);

  const bilder = [];
  const alle = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const f = figurBei(r, c);
      alle.push(f);
      bilder.push(r === luecke.r && c === luecke.c ? null : figurSvg(f));
    }
  }

  // Wertebereiche der sich ändernden Eigenschaften
  const bereich = {};
  for (const a of attribute) {
    bereich[a] = [];
    for (const f of alle) if (bereich[a].indexOf(f[a]) === -1) bereich[a].push(f[a]);
  }

  const passtText = function (a) {
    const richtung = richtungen[a];
    if (!richtung) return '';
    const soll = getauscht ? (richtung === 'zeile' ? 'spalte' : 'zeile') : richtung;
    return soll === 'zeile' ? 'Das passt zur Spalte, aber nicht zur Zeile: ' : 'Das passt zur Zeile, aber nicht zur Spalte: ';
  };

  const falschEin = function (a) {
    return mischen(bereich[a].filter(function (v) { return v !== antwort[a]; })).map(function (v) {
      const f = Object.assign({}, antwort);
      f[a] = v;
      return { figur: f, fehler: 'falsch_' + a, falschThemen: [a],
               fehlerText: passtText(a) + 'Bei deiner Figur stimmt ' + ATTR_NAME[a] + ' nicht.' };
    });
  };

  const beide = [];
  for (let i = 0; i < attribute.length; i++) {
    for (let j = i + 1; j < attribute.length; j++) {
      const a = attribute[i], b = attribute[j];
      for (const va of bereich[a]) {
        for (const vb of bereich[b]) {
          if (va === antwort[a] || vb === antwort[b]) continue;
          const f = Object.assign({}, antwort);
          f[a] = va; f[b] = vb;
          beide.push({ figur: f, fehler: 'beideFalsch', falschThemen: [a, b],
                       fehlerText: 'Bei deiner Figur stimmen ' + ATTR_NAME[a] + ' und ' + ATTR_NAME[b] + ' nicht.' });
        }
      }
    }
  }

  const nachbarn = [];
  for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const r = luecke.r + dr, c = luecke.c + dc;
    if (r < 0 || c < 0 || r > 2 || c > 2) continue;
    nachbarn.push({ figur: figurBei(r, c), fehler: 'nachbarKopie', falschThemen: attribute.slice(),
                    fehlerText: 'Das ist die Figur aus dem Nachbarfeld – im fehlenden Feld muss aber etwas anderes stehen.' });
  }

  const gruppen = attribute.map(falschEin).slice(0, 2).concat([mischen(beide.concat(nachbarn))]);
  let reserve = beide.concat(nachbarn);
  for (const a of attribute) reserve = reserve.concat(falschEin(a));
  const ablenker = waehleAblenker(antwort, gruppen, reserve, 3);
  const auswahl = baueOptionen(antwort, ablenker, figurSvg, figurSchluessel);

  const woerter = getauscht
    ? { ZEILE: 'Spalte', SPALTE: 'Zeile', LR: 'Von oben nach unten', OU: 'Von links nach rechts' }
    : { ZEILE: 'Zeile', SPALTE: 'Spalte', LR: 'Von links nach rechts', OU: 'Von oben nach unten' };
  const erklaerung = erklaere(luecke.r, luecke.c, antwort)
    .replace(/\{(ZEILE|SPALTE|LR|OU)\}/g, function (_, k) { return woerter[k]; })
    .replace(/– und Von/g, '– und von');

  return {
    uebung: 'matrix', stufe: stufe, art: 'auswahl',
    frage: 'Welche Figur gehört in das leere Feld?',
    anzeige: { layout: 'matrix', bilder: bilder },
    optionen: auswahl.optionen,
    richtig: auswahl.richtig,
    erklaerung: erklaerung,
    richtigText: 'Die Regel: ' + erklaerung,
    themen: attribute.slice(),
    // für die Selbsttests
    typ: typ, luecke: luecke, antwort: antwort, alle: alle, getauscht: getauscht
  };
}

uebung('matrix', {
  gruppe: 'muster',
  titel: 'Matrix 3×3',
  symbol: '🔳',
  alter: [10, 12],
  beschreibung: 'Neun Felder, eins ist leer. Für die Zeilen gilt eine Regel, für die Spalten eine andere.',
  lernziel: 'Du lernst, zwei Regeln gleichzeitig zu beachten: eine für die Zeilen und eine für die Spalten.',
  tipps: [
    'Schau erst nur die Zeile mit dem Loch an: Was haben die zwei Figuren gemeinsam? Dann die Spalte.',
    'Bei Sudoku-Mustern fragst du: Welche Form fehlt in dieser Zeile noch? Welche Farbe fehlt in dieser Spalte noch?'
  ],
  stufen: MATRIX_STUFEN,
  beispiel: function () {
    return formSvg('kreis', { farbe: 'rot' }) + formSvg('kreis', { farbe: 'blau' }) + formSvg('kreis', { farbe: 'gelb' });
  },
  macheAufgabe: macheMatrix,
  zeitMitUhr: function (aufgabe) { return aufgabe.stufe <= 3 ? 40 : (aufgabe.stufe <= 6 ? 50 : 60); }
});
