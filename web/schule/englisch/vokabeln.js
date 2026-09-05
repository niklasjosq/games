/* ============================================================
   ENGLISCH — der Kern: Vokabeln prüfen, auswählen, wiederholen.

   Die Wörter selbst stehen in vokabeln-klasse5.js.
   Diese Datei kennt keine Seite und kein HTML — sie rechnet nur.

   Drei Richtungen zum Üben:
     'de-en'   — deutsch steht da, englisch tippen (wie im Vokabeltest)
     'en-de'   — englisch steht da, deutsch tippen
     'auswahl' — deutsch steht da, aus vier englischen Wörtern wählen
   ============================================================ */

/* ============================================================
   DER LEKTIONS-KATALOG
   Wird von vokabeln-klasse5.js gefüllt.
   ============================================================ */

const ENGLISCH = {
  klasse5: { titel: '5. Klasse', alter: '10 Jahre', lektionen: {} }
};

/* Aus 'hallo' wird ['hallo'] — aus einer Liste bleibt die Liste. */
function alsListe(wert) {
  if (Array.isArray(wert)) return wert.slice();
  return [wert];
}

/* Eine Lektion anmelden. Die Wörter werden dabei vereinheitlicht. */
function lektion(klasse, id, daten) {
  const woerter = (daten.woerter || []).map(function (w) {
    return Object.assign({}, w, {
      englisch: alsListe(w.englisch),
      deutsch: alsListe(w.deutsch)
    });
  });

  ENGLISCH[klasse].lektionen[id] = Object.assign({
    id: id,
    klasse: klasse,
    testAnzahl: 10,
    testZeitSek: 300
  }, daten, { woerter: woerter });
}

function alleLektionen(klasse) {
  return Object.values(ENGLISCH[klasse].lektionen);
}

function findeLektion(klasse, id) {
  return ENGLISCH[klasse] ? ENGLISCH[klasse].lektionen[id] || null : null;
}

/* Alle Wörter einer Klassenstufe, jeweils mit ihrer Lektion */
function alleWoerter(klasse) {
  const liste = [];
  for (const l of alleLektionen(klasse)) {
    for (const w of l.woerter) liste.push({ wort: w, lektion: l });
  }
  return liste;
}

/* Wie heißt dieses Wort im Speicher? Die erste englische Form. */
function wortId(wort) {
  return wort.englisch[0];
}

/* ============================================================
   ANTWORTEN PRÜFEN

   Wir sind bei Groß-/Kleinschreibung, Leerzeichen und
   Satzzeichen großzügig — beim Wort selbst aber streng.
   Tippfehler gelten nicht als richtig, denn im Vokabeltest
   muss man die Wörter wirklich schreiben können.
   ============================================================ */

function normalVokabel(text, sprache) {
  let t = String(text === undefined || text === null ? '' : text);
  if (t.normalize) t = t.normalize('NFC');
  t = t.toLowerCase()
       .replace(/[’‘´`]/g, "'")        // krumme Hochkommas gerade machen
       .replace(/\s+/g, ' ')
       .trim()
       .replace(/[.!?,;:]+$/, '');     // Satzzeichen am Ende weg

  if (sprache === 'de') {
    t = t.replace(/ä/g, 'ae').replace(/ö/g, 'oe')
         .replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  }
  return t.trim();
}

/* Ein führendes "to ", "the ", "der " … abschneiden.
   Nur eines, und nur wenn danach noch etwas übrig bleibt. */
const VORSILBEN = {
  en: ['to ', 'the ', 'a ', 'an '],
  de: ['der ', 'die ', 'das ']
};

function ohneVorsilbe(text, sprache) {
  const silben = VORSILBEN[sprache] || [];
  for (const silbe of silben) {
    if (text.indexOf(silbe) === 0) {
      const rest = text.slice(silbe.length).trim();
      if (rest !== '') return rest;
    }
  }
  return text;
}

/* Stimmt die Eingabe mit einer der Möglichkeiten überein? */
function vokabelStimmt(eingabe, moeglichkeiten, sprache) {
  const e = normalVokabel(eingabe, sprache);
  if (e === '') return false;

  for (const m of alsListe(moeglichkeiten)) {
    const s = normalVokabel(m, sprache);
    if (e === s) return true;
    if (ohneVorsilbe(e, sprache) === ohneVorsilbe(s, sprache)) return true;
  }
  return false;
}

/* Welche Sprache muss getippt werden? */
function zielSprache(richtung) {
  return richtung === 'en-de' ? 'de' : 'en';
}

function zielFormen(wort, richtung) {
  return richtung === 'en-de' ? wort.deutsch : wort.englisch;
}

function pruefeVokabel(wort, eingabe, richtung) {
  return vokabelStimmt(eingabe, zielFormen(wort, richtung), zielSprache(richtung));
}

/* ============================================================
   ANZEIGE
   ============================================================ */

/* Was steht als Frage da? */
function frageText(wort, richtung) {
  return richtung === 'en-de' ? wort.englisch[0] : wort.deutsch[0];
}

/* Wie lautet die Lösung — mit allen erlaubten Formen? */
function loesungText(wort, richtung) {
  const formen = zielFormen(wort, richtung);
  if (formen.length === 1) return formen[0];
  return formen[0] + ' (auch: ' + formen.slice(1).join(', ') + ')';
}

/* ============================================================
   AUSWAHL — der leichte Modus: vier Knöpfe, einer stimmt.
   Die Ablenker kommen aus derselben Lektion und möglichst aus
   derselben Wortart, damit die Auswahl nicht zu leicht wird.
   ============================================================ */

const AUSWAHL_ANZAHL = 4;

function baueAuswahl(wort, woerter) {
  const richtigeFormen = wort.englisch.map(function (f) { return normalVokabel(f, 'en'); });

  function passtNicht(k) {
    if (wortId(k) === wortId(wort)) return true;
    // Kein Ablenker, der dasselbe bedeutet wie die richtige Antwort
    for (const f of k.englisch) {
      if (richtigeFormen.indexOf(normalVokabel(f, 'en')) !== -1) return true;
    }
    return false;
  }

  const moegliche = woerter.filter(function (k) { return !passtNicht(k); });
  const gleicheArt = moegliche.filter(function (k) { return k.wortart === wort.wortart; });

  const ablenker = [];
  const genommen = {};
  function nimmAus(liste) {
    for (const k of mischen(liste.slice())) {
      if (ablenker.length >= AUSWAHL_ANZAHL - 1) return;
      if (genommen[wortId(k)]) continue;
      // Zwei Ablenker dürfen nicht dasselbe Wort anbieten
      let doppelt = false;
      for (const schon of ablenker) {
        for (const f of k.englisch) {
          if (schon.englisch.map(function (g) { return normalVokabel(g, 'en'); })
                            .indexOf(normalVokabel(f, 'en')) !== -1) doppelt = true;
        }
      }
      if (doppelt) continue;
      genommen[wortId(k)] = true;
      ablenker.push(k);
    }
  }

  nimmAus(gleicheArt);
  nimmAus(moegliche);

  return mischen(ablenker.concat([wort]));
}

/* ============================================================
   TEST — zehn Wörter, keines doppelt.
   ============================================================ */

function testWoerter(lektion, anzahl) {
  const kopie = lektion.woerter.slice();
  return mischen(kopie).slice(0, Math.min(anzahl, kopie.length));
}

/* ============================================================
   LERNBOX (Karteikasten mit fünf Fächern)

   So machen es die Kinder auch mit Papierkärtchen:
     richtig -> das Kärtchen wandert ein Fach weiter
     falsch  -> zurück in Fach 1

   Je weiter hinten ein Wort liegt, desto später kommt es dran:
     Fach 1 heute · Fach 2 morgen · Fach 3 in 3 Tagen
     Fach 4 in einer Woche · Fach 5 in zwei Wochen
   ============================================================ */

const LERNBOX_STUFEN = 5;
const LERNBOX_ABSTAND = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
const LERNBOX_PORTION = 20;

/* Der heutige Tag als glatte Zahl — damit sich Tage rechnen lassen. */
function tagesnummer(datum) {
  const d = datum || new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}

function neuerStand(heuteNr) {
  return { stufe: 1, faellig: heuteNr, richtig: 0, falsch: 0 };
}

/* Ein Wort wurde beantwortet: Wohin wandert das Kärtchen? */
function lernboxSchritt(stand, warRichtig, heuteNr) {
  const alt = stand || neuerStand(heuteNr);
  const neu = {
    stufe: alt.stufe || 1,
    faellig: alt.faellig || heuteNr,
    richtig: alt.richtig || 0,
    falsch: alt.falsch || 0
  };

  if (warRichtig) {
    neu.stufe = Math.min(neu.stufe + 1, LERNBOX_STUFEN);
    neu.richtig += 1;
  } else {
    neu.stufe = 1;
    neu.falsch += 1;
  }
  neu.faellig = heuteNr + LERNBOX_ABSTAND[neu.stufe];
  return neu;
}

/* Ist das Wort heute dran? Unbekannte Wörter sind immer dran. */
function istFaellig(stand, heuteNr) {
  return !stand || (stand.faellig || 0) <= heuteNr;
}

/* Welche Wörter kommen in dieser Sitzung dran?
   Erst Wiederholungen (die am längsten überfälligen zuerst),
   dann neue Wörter in der Reihenfolge der Lektionen. */
function faelligeWoerter(lektionen, lernboxen, heuteNr, portion) {
  const wiederholung = [];
  const neue = [];

  for (const l of lektionen) {
    const kasten = (lernboxen[l.id] || {}).woerter || {};
    for (const w of l.woerter) {
      const stand = kasten[wortId(w)];
      if (!stand) {
        neue.push({ wort: w, lektion: l, stand: null });
      } else if (istFaellig(stand, heuteNr)) {
        wiederholung.push({ wort: w, lektion: l, stand: stand });
      }
    }
  }

  wiederholung.sort(function (a, b) {
    if (a.stand.faellig !== b.stand.faellig) return a.stand.faellig - b.stand.faellig;
    return a.stand.stufe - b.stand.stufe;
  });

  const alle = wiederholung.concat(neue);
  if (portion === undefined || portion === null) return alle;
  return alle.slice(0, portion);
}

/* Wie viele Wörter liegen in welchem Fach? */
function zaehleStufen(lektionen, lernboxen) {
  const zahlen = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, neu: 0 };
  for (const l of lektionen) {
    const kasten = (lernboxen[l.id] || {}).woerter || {};
    for (const w of l.woerter) {
      const stand = kasten[wortId(w)];
      if (!stand) zahlen.neu += 1;
      else zahlen[stand.stufe] = (zahlen[stand.stufe] || 0) + 1;
    }
  }
  return zahlen;
}

/* ============================================================
   SELBSTKONTROLLE

   Prüft, ob jede Vokabel ihre eigene Antwort akzeptiert und ob
   sich keine zwei Wörter in die Quere kommen.
   In der Browser-Konsole: testeVokabeln()
   ============================================================ */

function testeVokabeln() {
  const probleme = [];
  const gesehen = {};

  for (const klasse of Object.keys(ENGLISCH)) {
    for (const l of alleLektionen(klasse)) {
      const wo = klasse + '/' + l.id;

      for (const w of l.woerter) {
        const id = wortId(w);

        if (!id || !w.deutsch[0]) { probleme.push(wo + ': Wort ohne Englisch oder Deutsch'); continue; }
        if (gesehen[id]) probleme.push(wo + ': "' + id + '" gibt es schon in ' + gesehen[id]);
        gesehen[id] = wo;

        // Jede erlaubte Form muss auch als richtig durchgehen
        for (const form of w.englisch) {
          if (!pruefeVokabel(w, form, 'de-en')) {
            probleme.push(wo + ': "' + form + '" gilt als falsch bei ' + id);
          }
        }
        for (const form of w.deutsch) {
          if (!pruefeVokabel(w, form, 'en-de')) {
            probleme.push(wo + ': "' + form + '" gilt als falsch bei ' + id);
          }
        }
      }
    }
  }
  return probleme;
}
