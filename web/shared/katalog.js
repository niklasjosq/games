/* ============================================================
   KATALOG — was es auf der Plattform alles gibt.

   Jeder Eintrag wird auf der Startseite zu einer Kachel.
   Neues Spiel dazubauen? Einfach hier einen Eintrag ergänzen.
   ============================================================ */

const KATEGORIEN = [
  { id: 'spiele', titel: 'Spiele',  symbol: '🎮' },
  { id: 'quiz',   titel: 'Quiz',    symbol: '🧠' },
  { id: 'schule', titel: 'Schule',  symbol: '📚' }
];

const KATALOG = [

  /* ---------------- SPIELE ---------------- */
  {
    id: 'nikolaus',
    kategorie: 'spiele',
    symbol: '🎅',
    titel: 'Nikolaus vs. Mutanten-Minions',
    beschreibung: 'Wirf Schokolade auf die Minions, sammle Süßes und klettere im letzten Level den Turm hinauf. 5 Level.',
    pfad: 'spiele/nikolaus/index.html',
    punkte: 'spiel'          // Bestwert kommt aus dem Profil
  },
  {
    id: 'nicecraft',
    kategorie: 'spiele',
    symbol: '⛏️',
    titel: 'NiceCraft',
    beschreibung: 'Eine 3D-Welt zum Herumlaufen und Bauen. Mit Maus umschauen, mit WASD gehen.',
    pfad: 'spiele/nicecraft/index.html',
    punkte: 'keine'
  },

  /* ---------------- QUIZ ---------------- */
  {
    id: 'rettet-die-iss',
    kategorie: 'quiz',
    symbol: '🚀',
    titel: 'Rettet die ISS!',
    beschreibung: 'Suche den Raumanzug und verteidige die Raumstation. Für 1 oder 2 Spieler, mit Rätseln zum Nachschub.',
    pfad: 'quiz/rettet-die-iss/index.html',
    punkte: 'quiz'           // hat seine eigene Bestenliste
  },

  /* ---------------- SCHULE ---------------- */
  {
    id: 'mathe-klasse3',
    kategorie: 'schule',
    symbol: '🔢',
    titel: 'Mathe — 3. Klasse',
    beschreibung: 'Für 8-Jährige: Plus und Minus bis 1000, das kleine Einmaleins, Teilen mit Rest, Sachaufgaben, Geld, Zeit und Längen.',
    pfad: 'schule/mathe/index.html#klasse3',
    punkte: 'schule',
    klasse: 'klasse3'
  },
  {
    id: 'mathe-klasse5',
    kategorie: 'schule',
    symbol: '📐',
    titel: 'Mathe — 5. Klasse',
    beschreibung: 'Für 10-Jährige: große Zahlen, schriftliches Rechnen, Brüche, Dezimalzahlen, Einheiten umrechnen und Geometrie.',
    pfad: 'schule/mathe/index.html#klasse5',
    punkte: 'schule',
    klasse: 'klasse5'
  }
];

function katalogFuer(kategorie) {
  return KATALOG.filter(function (e) { return e.kategorie === kategorie; });
}

/* ---------- Was steht klein unten auf der Kachel? ----------
   Braucht speicher.js (und für 'schule' auch aufgaben.js-Wissen,
   deshalb lesen wir hier nur die gespeicherten Noten). */
function kachelInfo(eintrag) {
  if (eintrag.punkte === 'spiel') {
    const best = holeBestwert(eintrag.id);
    return best > 0 ? '🏅 Dein Bestwert: ' + best + ' Punkte' : 'Noch nicht gespielt';
  }

  if (eintrag.punkte === 'quiz') {
    const liste = holeQuizBestenliste();
    if (liste.length === 0) return 'Noch nicht gespielt';
    return '🏅 Beste Runde: ' + liste[0].punkte + ' Punkte (' + liste[0].name + ')';
  }

  if (eintrag.punkte === 'schule') {
    const noten = besteNotenDerKlasse(eintrag.klasse);
    if (noten.length === 0) return 'Noch kein Test geschrieben';
    const schnitt = noten.reduce(function (a, b) { return a + b; }, 0) / noten.length;
    return '📝 ' + noten.length + ' Lektion' + (noten.length === 1 ? '' : 'en') +
           ' getestet · Schnitt: Note ' + (Math.round(schnitt * 10) / 10).toString().replace('.', ',');
  }

  return '';
}

/* Beste Noten aller Lektionen einer Klassenstufe (für die Kachel).
   Die Lektions-Namen kennt nur das Mathe-Modul — wir schauen deshalb
   direkt im Speicher nach, was schon da ist. */
function besteNotenDerKlasse(klasse) {
  const profil = aktivesProfil();
  if (!profil) return [];
  const noten = [];
  try {
    const anfang = PRAEFIX + 'p.' + profil.id + '.schule.mathe.' + klasse + '.';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf(anfang) !== 0) continue;
      const wert = JSON.parse(localStorage.getItem(k));
      if (wert && wert.besteNote) noten.push(wert.besteNote);
    }
  } catch (e) { /* egal */ }
  return noten;
}
