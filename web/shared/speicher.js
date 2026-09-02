/* ============================================================
   SPEICHER — alles, was sich die Plattform merkt.

   Wichtig: Es gibt keinen Server! Alles wird direkt im Browser
   gespeichert (localStorage). Das heißt: Auf jedem Gerät (Tablet,
   Laptop) gibt es eigene Profile und eigene Punkte.
   ============================================================ */

/* Alle unsere Schlüssel fangen mit "plattform." an, damit wir dem
   Quiz nicht in die Bestenliste pfuschen. */
const PRAEFIX = 'plattform.';

/* Wie viele Namen stehen auf einer Bestenliste? */
const BESTENLISTE_LAENGE = 5;

/* Wie viele Testergebnisse pro Lektion behalten wir? */
const TEST_VERLAUF_LAENGE = 10;

/* ---------- Die zwei Grundbefehle: lesen und schreiben ----------
   Beide sind absichtlich "unzerbrechlich": Wenn der Browser das
   Speichern verbietet (privates Fenster), läuft alles trotzdem
   weiter — nur eben ohne sich etwas zu merken. */

function leseSpeicher(schluessel, standard) {
  try {
    const roh = localStorage.getItem(PRAEFIX + schluessel);
    if (roh === null) return standard;
    const wert = JSON.parse(roh);
    return wert === null ? standard : wert;
  } catch (e) {
    return standard;
  }
}

function schreibeSpeicher(schluessel, wert) {
  try {
    localStorage.setItem(PRAEFIX + schluessel, JSON.stringify(wert));
    return true;
  } catch (e) {
    return false;
  }
}

function loescheSpeicher(schluessel) {
  try {
    localStorage.removeItem(PRAEFIX + schluessel);
  } catch (e) { /* egal */ }
}

/* Alles zu einem Profil wegräumen (wenn ein Profil gelöscht wird) */
function loescheProfilDaten(profilId) {
  try {
    const anfang = PRAEFIX + 'p.' + profilId + '.';
    const weg = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(anfang) === 0) weg.push(k);
    }
    for (const k of weg) localStorage.removeItem(k);
  } catch (e) { /* egal */ }
}

/* ---------- Der heutige Tag als kurzer Text (z. B. "2.9.2026") ---------- */
function heute() {
  const d = new Date();
  return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
}

/* ============================================================
   PUNKTE FÜR SPIELE
   ============================================================ */

function spielSchluessel(profilId, spielId) {
  return 'p.' + profilId + '.spiele.' + spielId;
}

/* Nach jedem Spiel aufrufen. Ohne angemeldetes Profil (Gast) wird
   nur die Geräte-Bestenliste gefüttert, sonst nichts. */
function speichereErgebnis(spielId, punkte) {
  punkte = Math.max(0, Math.round(punkte || 0));
  const profil = typeof aktivesProfil === 'function' ? aktivesProfil() : null;

  if (profil) {
    const alt = leseSpeicher(spielSchluessel(profil.id, spielId), null) || {
      bestwert: 0, zuletzt: 0, anzahl: 0
    };
    alt.anzahl = (alt.anzahl || 0) + 1;
    alt.zuletzt = punkte;
    if (punkte > (alt.bestwert || 0)) alt.bestwert = punkte;
    alt.datum = heute();
    schreibeSpeicher(spielSchluessel(profil.id, spielId), alt);
  }

  merkeInBestenliste(spielId, profil ? profil.name : 'Gast', punkte,
                     profil ? profil.avatar : '👤');
  return punkte;
}

function holeBestwert(spielId, profilId) {
  if (profilId === undefined) {
    const profil = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
    if (!profil) return 0;
    profilId = profil.id;
  }
  const eintrag = leseSpeicher(spielSchluessel(profilId, spielId), null);
  return eintrag ? (eintrag.bestwert || 0) : 0;
}

/* ---------- Bestenliste: gilt für das ganze Gerät ---------- */

function holeBestenliste(spielId) {
  const liste = leseSpeicher('bestenliste.' + spielId, []);
  return Array.isArray(liste) ? liste : [];
}

function merkeInBestenliste(spielId, name, punkte, avatar) {
  const liste = holeBestenliste(spielId);
  liste.push({ name: name, punkte: punkte, avatar: avatar || '👤', datum: heute() });
  liste.sort(function (a, b) { return b.punkte - a.punkte; });
  schreibeSpeicher('bestenliste.' + spielId, liste.slice(0, BESTENLISTE_LAENGE));
}

/* ============================================================
   FORTSCHRITT IN DER SCHULE
   ============================================================ */

function schulSchluessel(profilId, klasse, lektion) {
  return 'p.' + profilId + '.schule.mathe.' + klasse + '.' + lektion;
}

function leerFortschritt() {
  return {
    training: { gesamt: 0, richtig: 0, besteSerie: 0 },
    tests: [],
    besteNote: null
  };
}

function holeSchulFortschritt(klasse, lektion, profilId) {
  if (profilId === undefined) {
    const profil = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
    if (!profil) return leerFortschritt();
    profilId = profil.id;
  }
  const gespeichert = leseSpeicher(schulSchluessel(profilId, klasse, lektion), null);
  if (!gespeichert) return leerFortschritt();
  // Fehlende Felder auffüllen, falls das Format mal wächst
  const f = leerFortschritt();
  if (gespeichert.training) Object.assign(f.training, gespeichert.training);
  if (Array.isArray(gespeichert.tests)) f.tests = gespeichert.tests;
  if (gespeichert.besteNote) f.besteNote = gespeichert.besteNote;
  return f;
}

/* Nach jeder Trainingsaufgabe: war sie richtig, und wie lang ist die Serie? */
function speichereTraining(klasse, lektion, warRichtig, serie) {
  const profil = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
  if (!profil) return null;

  const f = holeSchulFortschritt(klasse, lektion, profil.id);
  f.training.gesamt += 1;
  if (warRichtig) f.training.richtig += 1;
  if ((serie || 0) > f.training.besteSerie) f.training.besteSerie = serie;
  schreibeSpeicher(schulSchluessel(profil.id, klasse, lektion), f);
  return f;
}

/* Nach einem fertigen Test: {richtig, gesamt, note, dauerSek} */
function speichereTest(klasse, lektion, ergebnis) {
  const profil = typeof aktivesProfil === 'function' ? aktivesProfil() : null;
  if (!profil) return null;

  const f = holeSchulFortschritt(klasse, lektion, profil.id);
  f.tests.unshift({
    datum: heute(),
    richtig: ergebnis.richtig,
    gesamt: ergebnis.gesamt,
    note: ergebnis.note,
    dauerSek: Math.round(ergebnis.dauerSek || 0)
  });
  f.tests = f.tests.slice(0, TEST_VERLAUF_LAENGE);
  if (f.besteNote === null || ergebnis.note < f.besteNote) f.besteNote = ergebnis.note;
  schreibeSpeicher(schulSchluessel(profil.id, klasse, lektion), f);
  return f;
}

/* ============================================================
   DAS QUIZ HAT SEINE EIGENE BESTENLISTE (die lassen wir in Ruhe)
   Wir lesen sie nur, um sie auf der Kachel anzuzeigen.
   ============================================================ */

function holeQuizBestenliste() {
  try {
    const liste = JSON.parse(localStorage.getItem('weltraum-quiz-bestenliste'));
    return Array.isArray(liste) ? liste : [];
  } catch (e) {
    return [];
  }
}
