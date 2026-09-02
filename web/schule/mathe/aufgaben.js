/* ============================================================
   MATHE — der Kern: Aufgaben prüfen und Noten berechnen.

   Die Aufgaben selbst stehen in aufgaben-klasse3.js und
   aufgaben-klasse5.js. Eine Aufgabe sieht immer so aus:

     {
       frage:    '347 + 285 = ?',       // was dasteht
       antwort:  '632',                 // was rauskommen soll
       eingabe:  'zahl',                // wie getippt wird
       einheit:  '€',                   // steht hinter dem Feld (oder nichts)
       hilfe:    'Rechne erst 347 + 200 …'   // Tipp nach einem Fehler
     }

   Eingabe-Arten:
     'zahl'  — eine Zahl (Komma erlaubt: 3,5)
     'text'  — ein Wort
     'rest'  — zwei Felder: Ergebnis und Rest
     'bruch' — ein Bruch wie 3/4
   ============================================================ */

/* ---------- Kleine Helfer ---------- */

function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function zufallsElement(liste) {
  return liste[zufall(0, liste.length - 1)];
}

function mischen(liste) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = zufall(0, i);
    const merken = liste[i];
    liste[i] = liste[j];
    liste[j] = merken;
  }
  return liste;
}

/* Eine Zahl deutsch schreiben: 3.5 -> "3,5", 1234 -> "1234" */
function deutsch(zahl) {
  return String(zahl).replace('.', ',');
}

/* Eine Zahl mit Tausenderpunkten: 1234567 -> "1.234.567" */
function mitPunkten(zahl) {
  return String(zahl).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* Größter gemeinsamer Teiler — fürs Kürzen von Brüchen */
function ggt(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const rest = a % b; a = b; b = rest; }
  return a || 1;
}

/* ============================================================
   ANTWORTEN PRÜFEN
   ============================================================ */

/* Eine getippte Zahl in eine echte Zahl verwandeln.
   Deutsche Schreibweise: Komma ist das Dezimalzeichen,
   Punkte sind Tausenderpunkte ("1.234,5"). */
function zahlAusText(text) {
  let t = String(text).replace(/\s/g, '');
  if (t === '') return null;

  if (t.indexOf(',') !== -1) {
    t = t.replace(/\./g, '').replace(',', '.');       // 1.234,5 -> 1234.5
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, '');                          // 1.234 -> 1234
  }

  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return parseFloat(t);
}

/* Einen getippten Bruch zerlegen: "3/4" -> {z: 3, n: 4} */
function bruchAusText(text) {
  const t = String(text).replace(/\s/g, '');
  const treffer = t.match(/^(-?\d+)\/(\d+)$/);
  if (treffer) {
    const n = parseInt(treffer[2], 10);
    if (n === 0) return null;
    return { z: parseInt(treffer[1], 10), n: n };
  }
  // Eine ganze Zahl ist auch ein Bruch (5 = 5/1)
  const zahl = zahlAusText(t);
  if (zahl !== null && Number.isInteger(zahl)) return { z: zahl, n: 1 };
  return null;
}

/* Stimmt die Antwort? Gibt true oder false zurück. */
function pruefeAntwort(aufgabe, eingabe) {
  const art = aufgabe.eingabe || 'zahl';

  if (art === 'text') {
    return normalText(eingabe) === normalText(aufgabe.antwort);
  }

  if (art === 'bruch') {
    const a = bruchAusText(eingabe);
    const b = bruchAusText(aufgabe.antwort);
    if (!a || !b) return false;
    // Gleicher Wert?
    if (a.z * b.n !== b.z * a.n) return false;
    // Bei "Kürze den Bruch" muss er auch wirklich gekürzt sein
    if (aufgabe.gekuerzt && ggt(a.z, a.n) !== 1) return false;
    return true;
  }

  if (art === 'uhrzeit') {
    // Wir sind großzügig: 17:30, 17.30, 17,30 und 1730 gelten alle
    const a = uhrzeitAusText(eingabe);
    const b = uhrzeitAusText(aufgabe.antwort);
    return a !== null && a === b;
  }

  if (art === 'rest') {
    // Erwartet wird "9 R 2" — die Seite baut das aus zwei Feldern
    const a = restAusText(eingabe);
    const b = restAusText(aufgabe.antwort);
    if (!a || !b) return false;
    return a.ergebnis === b.ergebnis && a.rest === b.rest;
  }

  // 'zahl'
  const zahl = zahlAusText(eingabe);
  const soll = zahlAusText(aufgabe.antwort);
  if (zahl === null || soll === null) return false;
  return Math.abs(zahl - soll) < 1e-9;
}

function normalText(text) {
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

/* Eine Uhrzeit auf eine einheitliche Form bringen: "7.05" -> "7:05" */
function uhrzeitAusText(text) {
  const t = String(text).replace(/\s|uhr/gi, '');
  let treffer = t.match(/^(\d{1,2})[:.,](\d{1,2})$/);
  if (!treffer) treffer = t.match(/^(\d{1,2})(\d{2})$/);      // 1730
  if (!treffer) return null;

  const std = parseInt(treffer[1], 10);
  const min = parseInt(treffer[2], 10);
  if (std > 23 || min > 59) return null;
  return std + ':' + String(min).padStart(2, '0');
}

function restAusText(text) {
  const treffer = String(text).replace(/\s/g, '').match(/^(-?\d+)R(\d+)$/i);
  if (!treffer) return null;
  return { ergebnis: parseInt(treffer[1], 10), rest: parseInt(treffer[2], 10) };
}

/* ============================================================
   NOTEN

   So viel Prozent muss man haben:
     ab 90 % -> 1,  ab 75 % -> 2,  ab 60 % -> 3,
     ab 45 % -> 4,  ab 25 % -> 5,  darunter 6
   ============================================================ */

const NOTEN_SCHWELLEN = [[90, 1], [75, 2], [60, 3], [45, 4], [25, 5]];

const NOTEN_NAMEN = {
  1: 'sehr gut', 2: 'gut', 3: 'befriedigend',
  4: 'ausreichend', 5: 'mangelhaft', 6: 'ungenügend'
};

function berechneNote(richtig, gesamt) {
  if (!gesamt) return 6;
  const prozent = (richtig / gesamt) * 100;
  for (const [schwelle, note] of NOTEN_SCHWELLEN) {
    if (prozent >= schwelle) return note;
  }
  return 6;
}

function noteName(note) {
  return NOTEN_NAMEN[note] || '';
}

/* ============================================================
   DER LEKTIONS-KATALOG

   Wird von aufgaben-klasse3.js und aufgaben-klasse5.js gefüllt.
   Deshalb steht hier erstmal nur das leere Gerüst.
   ============================================================ */

const MATHE = {
  klasse3: { titel: '3. Klasse', alter: '8 Jahre', lektionen: {} },
  klasse5: { titel: '5. Klasse', alter: '10 Jahre', lektionen: {} }
};

/* Eine Lektion anmelden */
function lektion(klasse, id, daten) {
  MATHE[klasse].lektionen[id] = Object.assign({
    id: id,
    klasse: klasse,
    testAnzahl: 10,
    testZeitSek: 300
  }, daten);
}

function alleLektionen(klasse) {
  return Object.values(MATHE[klasse].lektionen);
}

function findeLektion(klasse, id) {
  return MATHE[klasse] ? MATHE[klasse].lektionen[id] || null : null;
}

/* ============================================================
   SELBSTKONTROLLE

   Ruft jede Aufgaben-Sorte ganz oft auf und schaut, ob die
   eigene Antwort auch als richtig durchgeht. So finden wir
   kaputte Aufgaben, bevor die Kinder sie sehen.
   In der Browser-Konsole: testeAufgaben(200)
   ============================================================ */

function testeAufgaben(anzahl) {
  anzahl = anzahl || 200;
  const probleme = [];

  for (const klasse of Object.keys(MATHE)) {
    for (const l of alleLektionen(klasse)) {
      for (let i = 0; i < anzahl; i++) {
        let a;
        try {
          a = l.macheAufgabe();
        } catch (e) {
          probleme.push(klasse + '/' + l.id + ': Absturz — ' + e.message);
          break;
        }
        const wo = klasse + '/' + l.id;
        if (!a || !a.frage) { probleme.push(wo + ': keine Frage'); break; }
        if (a.antwort === undefined || a.antwort === null || a.antwort === '') {
          probleme.push(wo + ': keine Antwort bei "' + a.frage + '"'); break;
        }
        if (!pruefeAntwort(a, a.antwort)) {
          probleme.push(wo + ': eigene Antwort "' + a.antwort +
                        '" gilt als falsch bei "' + a.frage + '"');
          break;
        }
      }
    }
  }
  return probleme;
}
