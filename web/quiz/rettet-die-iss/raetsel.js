/* ============================================================
   RÄTSEL — hier werden alle Mathe- und Logik-Aufgaben gemacht.
   Du darfst hier gerne eigene Aufgaben dazuschreiben!
   ============================================================ */

/* ---------- Kleine Helfer (die benutzt auch spiel.js) ---------- */

// Eine Zufallszahl von min bis max (beide dürfen vorkommen)
function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ein zufälliges Ding aus einer Liste holen
function zufallsElement(liste) {
  return liste[zufall(0, liste.length - 1)];
}

// Eine Liste durcheinanderwürfeln
function mischen(liste) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = zufall(0, i);
    const merken = liste[i];
    liste[i] = liste[j];
    liste[j] = merken;
  }
  return liste;
}

/* ---------- Die vier Antwort-Knöpfe bauen ----------
   Die richtige Antwort kommt rein, dazu drei falsche.
   Bei Zahlen denken wir uns Nachbar-Zahlen als Ablenkung aus. */
function baueAuswahl(antwort, falsche) {
  const auswahl = [antwort];
  const kandidaten = (falsche || []).slice();

  if (typeof antwort === 'number') {
    for (const abstand of mischen([1, 2, 3, 4, 5, 6, 10])) {
      kandidaten.push(antwort + abstand);
      if (antwort - abstand >= 0) kandidaten.push(antwort - abstand);
    }
  }

  for (const k of kandidaten) {
    if (auswahl.length >= 4) break;
    const schonDa = auswahl.some(a => String(a) === String(k));
    if (!schonDa) auswahl.push(k);
  }
  return mischen(auswahl);
}

/* ---------- Logik-Rätsel zum Nachdenken ---------- */
const LOGIK_RAETSEL = [
  { frage: '🤖 Alle Roboter auf der ISS sind blau.\nR2 ist ein Roboter. Welche Farbe hat R2?',
    antwort: 'blau', falsche: ['rot', 'grün', 'gelb'] },
  { frage: 'Anna ist größer als Tim.\nTim ist größer als Mia.\nWer ist am kleinsten?',
    antwort: 'Mia', falsche: ['Anna', 'Tim', 'alle gleich groß'] },
  { frage: '📅 Heute ist Mittwoch.\nWelcher Tag ist übermorgen?',
    antwort: 'Freitag', falsche: ['Donnerstag', 'Samstag', 'Montag'] },
  { frage: '🚀 Rakete A startet vor Rakete B.\nRakete B startet vor Rakete C.\nWelche Rakete startet zuletzt?',
    antwort: 'Rakete C', falsche: ['Rakete A', 'Rakete B', 'alle gleichzeitig'] },
  { frage: '🌍 Auf der Erde wiegt ein Stein 10 kg.\nAuf der ISS ist er …?',
    antwort: 'schwerelos', falsche: ['schwerer', 'genau gleich', 'doppelt so schwer'] },
  { frage: '🧤 Ein Astronaut hat 3 Paar Handschuhe.\nWie viele Handschuhe sind das?', antwort: 6 },
  { frage: '🛰️ Die ISS fliegt in 90 Minuten einmal um die Erde.\nWie oft schafft sie das in 3 Stunden?', antwort: 2 },
  { frage: '📆 Ein Monat hat ungefähr 4 Wochen.\nWie viele Tage sind das?', antwort: 28 },
  { frage: '🍽️ 24 Essenstüten werden gleichmäßig an 6 Astronauten verteilt.\nWie viele bekommt jeder?', antwort: 4 }
];

/* ---------- Die Aufgaben-Sorten für die drei Stufen ---------- */
const RAETSEL_ARTEN = {

  /* ===== LEICHT: Plus und Minus bis 20, einfache Muster ===== */
  leicht: [
    function () {
      const a = zufall(2, 10), b = zufall(2, 10);
      return { frage: a + ' + ' + b + ' = ?', antwort: a + b };
    },
    function () {
      const a = zufall(6, 20), b = zufall(1, a - 1);
      return { frage: a + ' − ' + b + ' = ?', antwort: a - b };
    },
    function () {
      const a = zufall(2, 9);
      return { frage: 'Was ist das Doppelte von ' + a + '?', antwort: a * 2 };
    },
    function () {
      const schritt = zufall(1, 3), start = zufall(1, 6);
      const reihe = [start, start + schritt, start + 2 * schritt, start + 3 * schritt];
      return { frage: 'Wie geht die Reihe weiter?\n' + reihe.join(', ') + ', ?', antwort: start + 4 * schritt };
    },
    function () {
      const formen = mischen(['🔴', '🔵', '🟡', '🟢', '🟣', '🟠']);
      const a = formen[0], b = formen[1];
      return {
        frage: 'Welches Zeichen kommt jetzt?\n' + a + b + a + b + a + '❓',
        antwort: b,
        falsche: [a, formen[2], formen[3]]
      };
    },
    function () {
      const zahlen = [];
      while (zahlen.length < 4) {
        const z = zufall(3, 30);
        if (!zahlen.includes(z)) zahlen.push(z);
      }
      const groesste = Math.max.apply(null, zahlen);
      return {
        frage: 'Welche Zahl ist am größten?\n' + zahlen.join('   '),
        antwort: groesste,
        falsche: zahlen.filter(z => z !== groesste)
      };
    },
    function () {
      const a = zufall(2, 9), b = zufall(1, 9);
      return { frage: '🛰️ ' + a + ' Satelliten fliegen um die Erde.\n' + b + ' kommen dazu. Wie viele sind es jetzt?', antwort: a + b };
    },
    function () {
      const a = zufall(5, 10), b = zufall(1, 4);
      return { frage: '⭐ Du siehst ' + a + ' Sterne.\n' + b + ' verschwinden hinter dem Mond. Wie viele siehst du noch?', antwort: a - b };
    }
  ],

  /* ===== MITTEL: bis 100, kleines Einmaleins, Textaufgaben ===== */
  mittel: [
    function () {
      const a = zufall(11, 60), b = zufall(11, 39);
      return { frage: a + ' + ' + b + ' = ?', antwort: a + b };
    },
    function () {
      const a = zufall(40, 99), b = zufall(11, 39);
      return { frage: a + ' − ' + b + ' = ?', antwort: a - b };
    },
    function () {
      const a = zufall(2, 10), b = zufall(2, 10);
      return { frage: a + ' × ' + b + ' = ?', antwort: a * b };
    },
    function () {
      const teiler = zufall(2, 9), ergebnis = zufall(2, 9);
      return { frage: (teiler * ergebnis) + ' : ' + teiler + ' = ?', antwort: ergebnis };
    },
    function () {
      const schritt = zufallsElement([3, 4, 5, 10]), start = zufall(2, 12);
      const reihe = [start, start + schritt, start + 2 * schritt, start + 3 * schritt];
      return { frage: 'Wie geht die Reihe weiter?\n' + reihe.join(', ') + ', ?', antwort: start + 4 * schritt };
    },
    function () {
      const a = zufall(3, 12), summe = a + zufall(6, 30);
      return { frage: a + ' + ❓ = ' + summe, antwort: summe - a };
    },
    function () {
      const a = zufall(3, 9), b = zufall(3, 9);
      return { frage: '🚀 In der Rakete sind ' + a + ' Reihen mit je ' + b + ' Sitzen.\nWie viele Sitze sind das?', antwort: a * b };
    },
    function () {
      const h = zufall(11, 45);
      return { frage: 'Was ist die Hälfte von ' + (h * 2) + '?', antwort: h };
    },
    function () {
      const tage = zufall(3, 9), pro = zufall(2, 6);
      return { frage: '🥤 Ein Astronaut trinkt jeden Tag ' + pro + ' Beutel Wasser.\nWie viele sind das in ' + tage + ' Tagen?', antwort: tage * pro };
    }
  ],

  /* ===== SCHWER: großes Einmaleins, Klammern, Rest, Logik ===== */
  schwer: [
    function () {
      const a = zufall(6, 12), b = zufall(6, 12);
      return { frage: a + ' × ' + b + ' = ?', antwort: a * b };
    },
    function () {
      const teiler = zufall(3, 9), ergebnis = zufall(3, 9), rest = zufall(1, teiler - 1);
      return { frage: (teiler * ergebnis + rest) + ' : ' + teiler + '\nWelcher Rest bleibt übrig?', antwort: rest };
    },
    function () {
      const a = zufall(2, 12), b = zufall(2, 12), c = zufall(2, 6);
      return { frage: '(' + a + ' + ' + b + ') × ' + c + ' = ?', antwort: (a + b) * c };
    },
    function () {
      const a = zufall(4, 9), b = zufall(3, 9), c = zufall(2, 9);
      return { frage: a + ' × ' + b + ' − ' + c + ' = ?', antwort: a * b - c };
    },
    function () {
      const start = zufall(2, 5);
      const reihe = [start, start * 2, start * 4, start * 8];
      return { frage: 'Wie geht die Reihe weiter?\n' + reihe.join(', ') + ', ?', antwort: start * 16 };
    },
    function () {
      const a = zufall(4, 12), b = zufall(3, 9), kaputt = zufall(2, 9);
      return { frage: '🧑‍🚀 ' + a + ' Astronauten haben je ' + b + ' Wasserflaschen.\n' + kaputt + ' Flaschen gehen kaputt. Wie viele bleiben?', antwort: a * b - kaputt };
    },
    function () {
      const minuten = zufallsElement([2, 3, 4, 5]);
      return { frage: '⏱️ Ein Weltraumspaziergang dauert ' + minuten + ' Stunden.\nWie viele Minuten sind das?', antwort: minuten * 60 };
    },
    function () { return zufallsElement(LOGIK_RAETSEL); },
    function () { return zufallsElement(LOGIK_RAETSEL); }
  ]
};

/* ---------- Das ist die wichtigste Funktion:
   Sie macht eine fertige Aufgabe mit 4 Antwort-Möglichkeiten. ---------- */
function macheRaetsel(stufe) {
  const arten = RAETSEL_ARTEN[stufe] || RAETSEL_ARTEN.mittel;
  const roh = zufallsElement(arten)();
  return {
    frage: roh.frage,
    antwort: roh.antwort,
    auswahl: baueAuswahl(roh.antwort, roh.falsche)
  };
}

/* ---------- Selbst-Test: in der Konsole (F12) testeRaetsel() eingeben ---------- */
function testeRaetsel(anzahl) {
  anzahl = anzahl || 300;
  let fehler = 0;
  for (const stufe of ['leicht', 'mittel', 'schwer']) {
    for (let i = 0; i < anzahl; i++) {
      const r = macheRaetsel(stufe);
      const treffer = r.auswahl.filter(a => String(a) === String(r.antwort)).length;
      const alleVerschieden = new Set(r.auswahl.map(String)).size === r.auswahl.length;
      if (!r.frage || r.auswahl.length !== 4 || treffer !== 1 || !alleVerschieden) {
        console.error('❌ Fehler bei Stufe "' + stufe + '":', r);
        fehler++;
      }
    }
  }
  if (fehler === 0) console.log('✅ alles ok — ' + (anzahl * 3) + ' Aufgaben geprüft');
  else console.log('❌ ' + fehler + ' Fehler gefunden');
  return fehler === 0;
}
