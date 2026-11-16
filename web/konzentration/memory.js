/* ============================================================
   LERN-MEMORY — Paare finden und dabei etwas lernen.

   Drei Sorten Paare:
     formName        Form ↔ ihr Name          (🔷 ↔ „die Raute“)
     eigenschaft     Form ↔ eine Eigenschaft  (🔷 ↔ „4 gleich lange Seiten, …“)
     englisch        englisches ↔ deutsches Wort (aus der Englisch-Seite)
   ============================================================ */

/* Aussagen über Formen. Auf einem Spielfeld muss jede Aussage auf
   GENAU EINE der Formen passen — sonst wäre ein Paar nicht eindeutig. */
const EIGENSCHAFTS_AUSSAGEN = {
  leicht: [
    { text: 'keine Ecke, ganz rund', passt: function (f) { return FORMEN[f].ecken === 0; } },
    { text: '3 Ecken', passt: function (f) { return FORMEN[f].ecken === 3; } },
    { text: '4 Ecken, 4 rechte Winkel, alle Seiten gleich lang', passt: function (f) { return f === 'quadrat'; } },
    { text: '4 rechte Winkel, 2 lange und 2 kurze Seiten', passt: function (f) { return f === 'rechteck'; } },
    { text: '5 Ecken', passt: function (f) { return FORMEN[f].ecken === 5; } },
    { text: '6 Ecken', passt: function (f) { return FORMEN[f].ecken === 6; } },
    { text: 'eine gerade und eine runde Seite', passt: function (f) { return f === 'halbkreis'; } },
    { text: 'genau 1 rechter Winkel', passt: function (f) { return FORMEN[f].rechteWinkel === 1; } },
    { text: '4 gleich lange Seiten, aber keine rechten Winkel',
      passt: function (f) { return FORMEN[f].ecken === 4 && FORMEN[f].gleicheSeiten === 'ja' && FORMEN[f].rechteWinkel === 0; } }
  ],
  schwer: [
    { text: 'genau 1 Symmetrieachse', passt: function (f) { return FORMEN[f].achsen === 1; } },
    { text: '2 Symmetrieachsen', passt: function (f) { return FORMEN[f].achsen === 2; } },
    { text: '3 Symmetrieachsen', passt: function (f) { return FORMEN[f].achsen === 3; } },
    { text: '4 Symmetrieachsen', passt: function (f) { return FORMEN[f].achsen === 4; } },
    { text: '5 Symmetrieachsen', passt: function (f) { return FORMEN[f].achsen === 5; } },
    { text: '6 Symmetrieachsen', passt: function (f) { return FORMEN[f].achsen === 6; } },
    { text: 'unendlich viele Symmetrieachsen', passt: function (f) { return FORMEN[f].achsen === Infinity; } },
    { text: 'keine Symmetrieachse, aber punktsymmetrisch',
      passt: function (f) { return FORMEN[f].achsen === 0 && FORMEN[f].punktsymm; } },
    { text: 'keine Symmetrieachse, 1 rechter Winkel',
      passt: function (f) { return FORMEN[f].achsen === 0 && FORMEN[f].rechteWinkel === 1; } },
    { text: 'genau 1 Paar parallele Seiten', passt: function (f) { return FORMEN[f].parallelePaare === 1; } },
    { text: '2 Paar parallele Seiten, keine rechten Winkel',
      passt: function (f) { return FORMEN[f].parallelePaare === 2 && FORMEN[f].rechteWinkel === 0; } },
    { text: '2 Paar gleich lange Nachbarseiten, wie ein Drachen',
      passt: function (f) { return ['drachen', 'raute', 'quadrat'].indexOf(f) !== -1; } }
  ]
};

/* Die Stufen: wie viele Paare und welche Sorte */
const MEMORY_STUFEN = [
  { paare: 4, sorte: 'formName', formen: ['kreis', 'dreieck', 'quadrat', 'rechteck'] },
  { paare: 6, sorte: 'formName', formen: ['kreis', 'dreieck', 'quadrat', 'rechteck', 'raute', 'sechseck', 'stern', 'herz', 'pfeil'] },
  { paare: 6, sorte: 'eigenschaft', liste: 'leicht' },
  { paare: 8, sorte: 'formName', formen: GRUNDFORMEN, muss: ['trapez', 'parallelogramm', 'drachen', 'halbkreis', 'fuenfeck'] },
  { paare: 8, sorte: 'englisch', lektionen: 1 },
  { paare: 8, sorte: 'eigenschaft', liste: 'schwer' },
  { paare: 10, sorte: 'englisch', lektionen: 2 },
  { paare: 12, sorte: 'gemischt' }
];

const MEMORY_LEKTIONEN = ['t5-tiere', 't1-haus', 't2-schule', 't1-familie', 't4-geburtstag', 't3-hobbys', 't4-einkaufen'];
const MEMORY_SPALTEN = { 4: 4, 6: 4, 8: 4, 10: 5, 12: 6 };
const MEMORY_MAX_EIGENSCHAFT = 8;

/* ---------------- Formen-Karten ---------------- */

function formKarte(formId) {
  return { svg: formSvg(formId, { farbe: 'neutral', groesse: 'gross', name: formMitArtikel(formId) }),
           typ: 'form', name: formMitArtikel(formId) };
}

function formNamePaar(formId) {
  return {
    paarId: 'name-' + formId, sorte: 'formName', form: formId,
    a: formKarte(formId),
    b: { text: formMitArtikel(formId), typ: 'name', name: formMitArtikel(formId) },
    loesung: formMitArtikel(formId)
  };
}

/* ---------------- Englische Wörter ----------------
   Kommen direkt aus der Englisch-Seite (vokabeln.js + vokabeln-klasse5.js).
   Fehlen die, gibt es eben Formen-Paare. */

function vokabelnDa() {
  return typeof alleLektionen === 'function' && typeof ENGLISCH !== 'undefined' && !!ENGLISCH.klasse5;
}

function memoryWortTauglich(w, arten) {
  return arten.indexOf(w.wortart) !== -1 &&
         w.englisch[0].indexOf(' ') === -1 && w.englisch[0].indexOf('…') === -1 &&
         w.englisch[0].length <= 9 && w.deutsch[0].length <= 16;
}

function vokabelPaare(anzahl, lektionenAnzahl) {
  if (!vokabelnDa()) return null;
  const lektionen = alleLektionen('klasse5');
  const finde = function (id) { return lektionen.filter(function (l) { return l.id === id; })[0]; };

  let kandidaten = [];
  const erste = finde(zufallsElement(MEMORY_LEKTIONEN));
  if (!erste) return null;
  kandidaten = erste.woerter.filter(function (w) { return memoryWortTauglich(w, ['nomen']); });
  if (lektionenAnzahl > 1) {
    const mitAdjektiven = lektionen.filter(function (l) {
      return l.id !== erste.id && l.woerter.filter(function (w) { return memoryWortTauglich(w, ['adjektiv']); }).length >= 4;
    });
    const zweite = zufallsElement(mitAdjektiven);
    if (zweite) {
      const adjektive = mischen(zweite.woerter.filter(function (w) { return memoryWortTauglich(w, ['adjektiv', 'nomen']); }));
      kandidaten = mischen(kandidaten).slice(0, Math.ceil(anzahl / 2) + 2).concat(adjektive);
    }
  }

  const paare = [];
  const schonEn = [], schonDe = [];
  for (const w of mischen(kandidaten.slice())) {
    if (paare.length >= anzahl) break;
    const en = w.englisch[0].toLowerCase();
    const de = normalVokabel(w.deutsch[0], 'de');
    // „wild“ = „wild“ taugt nicht: die beiden Karten sähen gleich aus
    if (en === w.deutsch[0].toLowerCase() || en === de) continue;
    if (schonEn.indexOf(en) !== -1 || schonDe.indexOf(de) !== -1) continue;
    if (schonEn.indexOf(de) !== -1 || schonDe.indexOf(en) !== -1) continue;
    schonEn.push(en); schonDe.push(de);
    paare.push({
      paarId: 'wort-' + wortId(w), sorte: 'englisch',
      a: { text: w.englisch[0], sprache: 'en', typ: 'en', partner: w.deutsch[0] },
      b: { text: w.deutsch[0], sprache: 'de', typ: 'de', partner: w.englisch[0] },
      loesung: w.englisch[0] + ' = ' + w.deutsch[0]
    });
  }
  return paare.length === anzahl ? paare : null;
}

/* ---------------- Ein ganzes Spielfeld ----------------
   wunsch = { formName: 4, eigenschaft: 4, englisch: 4, liste: 'leicht' | 'schwer' | 'beide',
              formen: [...], muss: [...] } */

function baueMemoryFeld(wunsch) {
  for (let versuch = 0; versuch < 400; versuch++) {
    const paare = [];
    const benutzt = [];
    let ok = true;

    // 1) Form ↔ Eigenschaft zuerst: jede Aussage passt auf genau eine Form des Felds
    const gewaehlt = [];
    if (wunsch.eigenschaft) {
      const aussagen = wunsch.liste === 'beide'
        ? EIGENSCHAFTS_AUSSAGEN.leicht.concat(EIGENSCHAFTS_AUSSAGEN.schwer)
        : EIGENSCHAFTS_AUSSAGEN[wunsch.liste || 'leicht'];
      for (const a of mischen(aussagen.slice())) {
        if (gewaehlt.length >= wunsch.eigenschaft) break;
        // Die neue Aussage darf auf keine Form passen, die schon liegt …
        if (benutzt.some(function (f) { return a.passt(f); })) continue;
        const moeglich = GRUNDFORMEN.filter(function (f) {
          // … und ihre Form auf keine Aussage, die schon liegt
          return a.passt(f) && benutzt.indexOf(f) === -1 &&
                 !gewaehlt.some(function (g) { return g.aussage.passt(f); });
        });
        if (!moeglich.length) continue;
        const f = zufallsElement(moeglich);
        gewaehlt.push({ aussage: a, form: f });
        benutzt.push(f);
      }
      if (gewaehlt.length < wunsch.eigenschaft) ok = false;
    }
    if (!ok) continue;

    // 2) Form ↔ Name: nur Formen, auf die keine Aussage des Felds passt
    const erlaubt = (wunsch.formen || GRUNDFORMEN.concat(['stern', 'herz', 'pfeil', 'lForm', 'flagge']))
      .filter(function (f) {
        return benutzt.indexOf(f) === -1 && !gewaehlt.some(function (g) { return g.aussage.passt(f); });
      });
    let namen = (wunsch.muss || []).filter(function (f) { return erlaubt.indexOf(f) !== -1; })
      .slice(0, wunsch.formName || 0);
    namen = namen.concat(mischen(erlaubt.filter(function (f) { return namen.indexOf(f) === -1; })))
      .slice(0, wunsch.formName || 0);
    if (namen.length < (wunsch.formName || 0)) continue;
    for (const f of namen) benutzt.push(f);

    // „das Dreieck“ würde auch zum rechtwinkligen Dreieck passen — nie beide auf ein Feld
    if (benutzt.indexOf('dreieck') !== -1 && benutzt.indexOf('rechtwinkligesDreieck') !== -1) continue;

    for (const f of namen) paare.push(formNamePaar(f));
    for (const g of gewaehlt) {
      paare.push({
        paarId: 'eig-' + g.form, sorte: 'eigenschaft', form: g.form, aussage: g.aussage.text,
        a: formKarte(g.form),
        b: { text: g.aussage.text, typ: 'aussage' },
        loesung: formMitArtikel(g.form) + ': ' + g.aussage.text
      });
    }

    // 3) Englisch ↔ Deutsch
    if (wunsch.englisch) {
      const woerter = vokabelPaare(wunsch.englisch, wunsch.lektionen || 1);
      if (!woerter) {
        // Ohne Vokabeln: stattdessen weitere Formen-Namen
        const frei = mischen(GRUNDFORMEN.concat(['stern', 'herz', 'pfeil', 'lForm', 'flagge']).filter(function (f) {
          return benutzt.indexOf(f) === -1 && !gewaehlt.some(function (g) { return g.aussage.passt(f); }) &&
                 !(f === 'dreieck' && benutzt.indexOf('rechtwinkligesDreieck') !== -1) &&
                 !(f === 'rechtwinkligesDreieck' && benutzt.indexOf('dreieck') !== -1);
        }));
        if (frei.length < wunsch.englisch) continue;
        for (const f of frei.slice(0, wunsch.englisch)) { paare.push(formNamePaar(f)); benutzt.push(f); }
      } else {
        for (const p of woerter) paare.push(p);
      }
    }
    return paare;
  }
  throw new Error('kein Memory-Feld gefunden');
}

/* Was steht auf dem Feld? — aus Stufe und gewünschter Sorte */
function memoryWunsch(stufe, sorte) {
  const p = MEMORY_STUFEN[klemmeStufe(stufe) - 1];
  const n = p.paare;
  const wahl = sorte && sorte !== 'auto' ? sorte : p.sorte;

  if (wahl === 'formName') {
    return { formName: n, formen: p.sorte === 'formName' ? p.formen : null, muss: p.muss };
  }
  if (wahl === 'eigenschaft') {
    const e = Math.min(n, MEMORY_MAX_EIGENSCHAFT);
    return { eigenschaft: e, formName: n - e, liste: p.liste || (stufe >= 6 ? 'schwer' : 'leicht') };
  }
  if (wahl === 'englisch') return { englisch: n, lektionen: p.lektionen || (stufe >= 7 ? 2 : 1) };
  return { formName: 4, eigenschaft: 4, englisch: 4, liste: 'beide', lektionen: 1 };
}

function macheMemory(stufe, wahl) {
  const w = wahl || {};
  const wunsch = memoryWunsch(stufe, w.paartyp);
  const paare = baueMemoryFeld(wunsch);

  const karten = [];
  for (const p of paare) {
    karten.push(Object.assign({ paarId: p.paarId, seite: 'a' }, p.a));
    karten.push(Object.assign({ paarId: p.paarId, seite: 'b' }, p.b));
  }
  mischen(karten);
  karten.forEach(function (k, i) { k.id = 'k' + i; });

  const sorten = [];
  for (const p of paare) if (sorten.indexOf(p.sorte) === -1) sorten.push(p.sorte);

  return {
    uebung: 'memory', stufe: stufe, art: 'paare',
    frage: 'Finde die Paare! Dreh immer zwei Karten um.',
    anzeige: { karten: karten, spalten: MEMORY_SPALTEN[paare.length] || 4, paare: paare.length },
    richtig: { fehlversuche: 0 },
    erfolgBis: paare.length,
    paare: paare,
    erklaerung: 'Die Paare waren: ' + paare.map(function (p) { return p.loesung; }).join(' · ') + '.',
    themen: sorten
  };
}

/* Was sagen wir, wenn zwei Karten nicht zusammenpassen?
   Gelernt wird gerade beim Danebengreifen — also benennen wir, was man sah. */
function memoryFehlgriffText(k1, k2) {
  const reihenfolge = ['form', 'en', 'de', 'name', 'aussage'];
  const [a, b] = [k1, k2].sort(function (x, y) { return reihenfolge.indexOf(x.typ) - reihenfolge.indexOf(y.typ); });

  if (a.typ === 'form' && b.typ === 'form') return 'Das ist ' + a.name + ', das ist ' + b.name + '.';
  if (a.typ === 'form' && b.typ === 'name') return 'Das ist ' + a.name + ', nicht ' + b.name + '.';
  if (a.typ === 'form' && b.typ === 'aussage') return 'Das ist ' + a.name + '. „' + b.text + '“ passt nicht dazu.';
  if (a.typ === 'en' && b.typ === 'de') return a.text + ' heißt ' + a.partner + ', nicht ' + b.text + '.';
  if (a.typ === b.typ) {
    return {
      en: 'Zwei englische Wörter – zu jedem gehört ein deutsches.',
      de: 'Zwei deutsche Wörter – zu jedem gehört ein englisches.',
      name: 'Zwei Namen – zu jedem Namen gehört ein Bild.',
      aussage: 'Zwei Beschreibungen – zu jeder gehört ein Bild.'
    }[a.typ];
  }

  // Gemischtes Feld: jede Karte für sich erklären
  const satz = function (k) {
    if (k.typ === 'form') return 'Das ist ' + k.name + '.';
    if (k.typ === 'en') return k.text + ' heißt ' + k.partner + '.';
    if (k.typ === 'de') return k.text + ' heißt auf Englisch ' + k.partner + '.';
    return '';
  };
  const text = [satz(a), satz(b)].filter(Boolean).join(' ');
  return text || 'Diese beiden gehören nicht zusammen – zu jedem Namen und jeder Beschreibung gehört ein Bild.';
}

uebung('memory', {
  gruppe: 'memory',
  titel: 'Lern-Memory',
  symbol: '🃏',
  alter: [8, 12],
  beschreibung: 'Paare finden: Form und Name, Form und Eigenschaft oder englisches und deutsches Wort.',
  lernziel: 'Du merkst dir, wo die Karten liegen – und lernst nebenbei die Namen und Eigenschaften der Formen (oder englische Wörter).',
  tipps: [
    'Sag dir beim Umdrehen leise, was du siehst und wo es liegt: „Trapez – oben links.“',
    'Dreh lieber eine neue Karte um als zweimal dieselbe – so lernst du das Feld schneller kennen.'
  ],
  stufen: MEMORY_STUFEN,
  paartypen: [
    { id: 'auto', text: '✨ Passend zur Stufe' },
    { id: 'formName', text: '🔷 Formen-Namen' },
    { id: 'eigenschaft', text: '📐 Eigenschaften' },
    { id: 'englisch', text: '🇬🇧 Englisch' }
  ],
  beispiel: function () {
    return formSvg('trapez', { farbe: 'neutral' }) + formSvg('raute', { farbe: 'neutral' });
  },
  macheAufgabe: macheMemory,
  fehlerText: function (aufgabe, antwort) {
    if (antwort && antwort.zeitUm) return 'Die Zeit ist um.';
    return 'Diesmal waren es ' + ((antwort && antwort.fehlversuche) || 0) + ' Fehlversuche – mehr als doppelt so viele wie Paare.';
  },
  rundenLaenge: function (stufe) { return stufe >= 8 ? 1 : 2; },
  zeitMitUhr: function (aufgabe) { return 10 * aufgabe.erfolgBis; }
});
