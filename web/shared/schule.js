/* ============================================================
   SCHULE — Bausteine, die sich alle Schulfächer teilen.

   Hier steht, was Mathe und Englisch gleichermaßen brauchen:
   Zufall, Noten und Lob. Fachspezifisches (wie Brüche kürzen
   oder Vokabeln prüfen) steht beim jeweiligen Fach.
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
   LOB BEIM ÜBEN
   Je länger die Serie, desto größer die Freude.
   ============================================================ */

function lobText(serie) {
  if (serie >= 10) return '🏆 Unglaublich! ' + serie + ' richtige hintereinander!';
  if (serie >= 5)  return '🔥 Super! ' + serie + ' richtige hintereinander!';
  if (serie >= 3)  return '⭐ Sehr gut weiter so!';
  return '✅ Richtig!';
}
