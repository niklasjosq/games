/* ============================================================
   MATHE 5. KLASSE (etwa 10 Jahre)

   Stoff: große Zahlen, schriftliche Rechenverfahren, Brüche,
   Dezimalzahlen, Einheiten umrechnen und Geometrie
   (Umfang und Fläche).
   ============================================================ */

/* ============================================================
   1. GROSSE ZAHLEN
   ============================================================ */

const K5_GROSSE_ZAHLEN = [
  // Stellenwert
  function () {
    const zahl = zufall(100000, 999999);
    const stellen = [
      { name: 'Hunderttausender', teiler: 100000 },
      { name: 'Zehntausender', teiler: 10000 },
      { name: 'Tausender', teiler: 1000 },
      { name: 'Hunderter', teiler: 100 },
      { name: 'Zehner', teiler: 10 }
    ];
    const s = zufallsElement(stellen);
    return {
      frage: 'Welche Ziffer steht bei ' + mitPunkten(zahl) + ' an der ' + s.name + '-Stelle?',
      antwort: String(Math.floor(zahl / s.teiler) % 10),
      eingabe: 'zahl',
      hilfe: 'Zähle von rechts: Einer, Zehner, Hunderter, Tausender, Zehntausender, Hunderttausender.'
    };
  },
  // Runden
  function () {
    const zahl = zufall(10000, 999999);
    const auf = zufallsElement([
      { name: 'Tausender', teiler: 1000 },
      { name: 'Zehntausender', teiler: 10000 },
      { name: 'Hunderter', teiler: 100 }
    ]);
    return {
      frage: 'Runde ' + mitPunkten(zahl) + ' auf ' + auf.name + '.',
      antwort: String(Math.round(zahl / auf.teiler) * auf.teiler),
      eingabe: 'zahl',
      hilfe: 'Schau auf die Stelle rechts daneben: ab 5 wird aufgerundet, sonst abgerundet.'
    };
  },
  // Plus und Minus mit großen Zahlen.
  // Beim Minus ist die erste Zahl immer die größere — negative
  // Ergebnisse kommen erst in einer späteren Klasse dran.
  function () {
    const plus = Math.random() < 0.5;
    const a = zufall(120000, 480000);
    const b = zufall(1000, plus ? 320000 : a - 1000);
    return {
      frage: mitPunkten(a) + (plus ? ' + ' : ' − ') + mitPunkten(b) + ' = ?',
      antwort: String(plus ? a + b : a - b),
      eingabe: 'zahl',
      hilfe: 'Schreibe die Zahlen stellenrichtig untereinander und rechne schriftlich.'
    };
  },
  // Vorgänger und Nachfolger
  function () {
    const zahl = zufall(10000, 999998);
    const nachfolger = Math.random() < 0.5;
    return {
      frage: 'Wie heißt der ' + (nachfolger ? 'Nachfolger' : 'Vorgänger') +
             ' von ' + mitPunkten(zahl) + '?',
      antwort: String(nachfolger ? zahl + 1 : zahl - 1),
      eingabe: 'zahl',
      hilfe: nachfolger ? 'Der Nachfolger ist eins mehr.' : 'Der Vorgänger ist eins weniger.'
    };
  },
  // Die größte von vier Zahlen
  function () {
    const zahlen = [];
    while (zahlen.length < 4) {
      const z = zufall(10000, 999999);
      if (!zahlen.includes(z)) zahlen.push(z);
    }
    const groesste = Math.random() < 0.5;
    return {
      frage: 'Welche Zahl ist die ' + (groesste ? 'größte' : 'kleinste') + '?\n' +
             zahlen.map(mitPunkten).join('   ·   '),
      antwort: String(groesste ? Math.max(...zahlen) : Math.min(...zahlen)),
      eingabe: 'zahl',
      hilfe: 'Vergleiche zuerst, wie viele Stellen die Zahlen haben, dann Stelle für Stelle von links.'
    };
  },
  // Zahl in Worten lesen
  function () {
    const tausender = zufall(2, 99);
    const rest = zufall(1, 999);
    const zahl = tausender * 1000 + rest;
    return {
      frage: 'Schreibe als Zahl:\n' + tausender + ' Tausender und ' + rest + ' Einer',
      antwort: String(zahl),
      eingabe: 'zahl',
      hilfe: '1 Tausender sind 1000. Rechne ' + tausender + ' · 1000 + ' + rest + '.'
    };
  }
];

/* ============================================================
   2. SCHRIFTLICH RECHNEN
   ============================================================ */

const K5_SCHRIFTLICH = [
  // Schriftliche Addition (drei Zahlen)
  function () {
    const a = zufall(1200, 8900), b = zufall(1200, 8900), c = zufall(120, 890);
    return {
      frage: 'Rechne schriftlich auf einem Blatt:\n' + a + ' + ' + b + ' + ' + c + ' = ?',
      antwort: String(a + b + c),
      eingabe: 'zahl',
      hilfe: 'Stellen untereinander schreiben, von rechts anfangen, Überträge nicht vergessen.'
    };
  },
  // Schriftliche Subtraktion
  function () {
    const a = zufall(4000, 9999);
    const b = zufall(1000, a - 500);
    return {
      frage: 'Rechne schriftlich auf einem Blatt:\n' + a + ' − ' + b + ' = ?',
      antwort: String(a - b),
      eingabe: 'zahl',
      hilfe: 'Von rechts anfangen. Wenn du nicht abziehen kannst, borge dir eine Stelle.'
    };
  },
  // Schriftliche Multiplikation (einstellig)
  function () {
    const a = zufall(120, 980);
    const b = zufall(3, 9);
    return {
      frage: 'Rechne schriftlich auf einem Blatt:\n' + a + ' · ' + b + ' = ?',
      antwort: String(a * b),
      eingabe: 'zahl',
      hilfe: 'Multipliziere jede Stelle von ' + a + ' mit ' + b + ' und merke die Überträge.'
    };
  },
  // Schriftliche Multiplikation (zweistellig)
  function () {
    const a = zufall(23, 98);
    const b = zufall(12, 49);
    return {
      frage: 'Rechne schriftlich auf einem Blatt:\n' + a + ' · ' + b + ' = ?',
      antwort: String(a * b),
      eingabe: 'zahl',
      hilfe: 'Rechne ' + a + ' · ' + Math.floor(b / 10) * 10 + ' und ' + a + ' · ' + (b % 10) +
             ', dann beides zusammenzählen.'
    };
  },
  // Schriftliche Division (geht auf)
  function () {
    const teiler = zufall(3, 9);
    const ergebnis = zufall(120, 890);
    return {
      frage: 'Rechne schriftlich auf einem Blatt:\n' + (teiler * ergebnis) + ' : ' + teiler + ' = ?',
      antwort: String(ergebnis),
      eingabe: 'zahl',
      hilfe: 'Teile von links nach rechts Stelle für Stelle.'
    };
  },
  // Schriftliche Division mit Rest
  function () {
    const teiler = zufall(3, 9);
    const ergebnis = zufall(120, 890);
    const rest = zufall(1, teiler - 1);
    return {
      frage: 'Rechne schriftlich:\n' + (teiler * ergebnis + rest) + ' : ' + teiler + ' = ?',
      antwort: ergebnis + ' R ' + rest,
      eingabe: 'rest',
      hilfe: 'Teile von links nach rechts. Was am Ende nicht mehr aufgeht, ist der Rest.'
    };
  }
];

/* ============================================================
   3. BRÜCHE
   ============================================================ */

const K5_BRUECHE = [
  // Bruch kürzen
  function () {
    const z = zufall(1, 9);
    const n = zufall(z + 1, 12);
    const faktor = zufall(2, 6);
    const teiler = ggt(z, n);
    return {
      frage: 'Kürze den Bruch so weit wie möglich:\n' + (z * faktor) + '/' + (n * faktor),
      antwort: (z / teiler) + '/' + (n / teiler),
      eingabe: 'bruch',
      gekuerzt: true,
      hilfe: 'Suche eine Zahl, durch die Zähler UND Nenner teilbar sind, und teile beide.'
    };
  },
  // Bruch erweitern
  function () {
    const z = zufall(1, 7);
    const n = zufall(z + 1, 9);
    const faktor = zufall(2, 6);
    return {
      frage: 'Erweitere ' + z + '/' + n + ' auf den Nenner ' + (n * faktor) + '.\n' +
             'Wie heißt der Zähler?',
      antwort: String(z * faktor),
      eingabe: 'zahl',
      hilfe: 'Der Nenner wurde mit ' + faktor + ' multipliziert — der Zähler auch.'
    };
  },
  // Gleichnamige Brüche addieren
  function () {
    const n = zufall(5, 12);
    const a = zufall(1, n - 2);
    const b = zufall(1, n - a - 1);
    const summe = a + b;
    const teiler = ggt(summe, n);
    return {
      frage: a + '/' + n + ' + ' + b + '/' + n + ' = ?\nKürze, wenn es geht.',
      antwort: (summe / teiler) + '/' + (n / teiler),
      eingabe: 'bruch',
      gekuerzt: true,
      hilfe: 'Bei gleichem Nenner zählst du nur die Zähler zusammen: ' + a + ' + ' + b + '.'
    };
  },
  // Bruch vom Ganzen
  function () {
    const n = zufallsElement([2, 3, 4, 5, 6, 8, 10]);
    const z = zufall(1, n - 1);
    const ganzes = n * zufall(2, 12);
    return {
      frage: 'Wie viel sind ' + z + '/' + n + ' von ' + ganzes + '?',
      antwort: String((ganzes / n) * z),
      eingabe: 'zahl',
      hilfe: 'Teile ' + ganzes + ' erst in ' + n + ' Teile (' + ganzes + ' : ' + n +
             ' = ' + (ganzes / n) + ') und nimm davon ' + z + '.'
    };
  },
  // Brüche vergleichen
  function () {
    const n = zufall(4, 12);
    let a = zufall(1, n - 1), b = zufall(1, n - 1);
    while (a === b) b = zufall(1, n - 1);
    return {
      frage: 'Welcher Bruch ist größer?\n' + a + '/' + n + '  oder  ' + b + '/' + n,
      antwort: Math.max(a, b) + '/' + n,
      eingabe: 'bruch',
      hilfe: 'Bei gleichem Nenner ist der Bruch mit dem größeren Zähler größer.'
    };
  },
  // Bruch als Dezimalzahl
  function () {
    const paar = zufallsElement([
      { b: '1/2', d: '0,5' }, { b: '1/4', d: '0,25' }, { b: '3/4', d: '0,75' },
      { b: '1/5', d: '0,2' }, { b: '2/5', d: '0,4' }, { b: '3/5', d: '0,6' },
      { b: '1/10', d: '0,1' }, { b: '7/10', d: '0,7' }, { b: '1/100', d: '0,01' }
    ]);
    return {
      frage: 'Schreibe ' + paar.b + ' als Dezimalzahl.',
      antwort: paar.d,
      eingabe: 'zahl',
      hilfe: 'Teile den Zähler durch den Nenner.'
    };
  }
];

/* ============================================================
   4. DEZIMALZAHLEN
   ============================================================ */

const K5_DEZIMALZAHLEN = [
  // Plus und Minus (beim Minus ist die erste Zahl immer die größere —
  // negative Zahlen kommen erst später dran)
  function () {
    const plus = Math.random() < 0.5;
    const a = zufall(1005, 9995) / 10;
    const b = zufall(15, 995) / 10;
    const ergebnis = plus ? a + b : a - b;
    return {
      frage: deutsch(a) + (plus ? ' + ' : ' − ') + deutsch(b) + ' = ?',
      antwort: deutsch(Math.round(ergebnis * 100) / 100),
      eingabe: 'zahl',
      hilfe: 'Schreibe Komma unter Komma, dann rechne wie gewohnt.'
    };
  },
  // Mal 10, 100, 1000
  function () {
    const a = zufall(105, 9995) / 100;
    const mal = zufallsElement([10, 100, 1000]);
    const stellen = String(mal).length - 1;
    return {
      frage: deutsch(a) + ' · ' + mal + ' = ?',
      antwort: deutsch(Math.round(a * mal * 100) / 100),
      eingabe: 'zahl',
      hilfe: 'Das Komma wandert um ' + stellen + ' Stelle(n) nach rechts.'
    };
  },
  // Geteilt durch 10, 100
  function () {
    const a = zufall(15, 9990);
    const durch = zufallsElement([10, 100]);
    return {
      frage: a + ' : ' + durch + ' = ?',
      antwort: deutsch(a / durch),
      eingabe: 'zahl',
      hilfe: 'Das Komma wandert um ' + (String(durch).length - 1) + ' Stelle(n) nach links.'
    };
  },
  // Vergleichen
  function () {
    const a = zufall(101, 999) / 100;
    let b = zufall(101, 999) / 100;
    while (a === b) b = zufall(101, 999) / 100;
    return {
      frage: 'Welche Zahl ist größer?\n' + deutsch(a) + '  oder  ' + deutsch(b),
      antwort: deutsch(Math.max(a, b)),
      eingabe: 'zahl',
      hilfe: 'Vergleiche erst die ganzen Zahlen vor dem Komma, dann Stelle für Stelle dahinter.'
    };
  },
  // Stellenwert nach dem Komma
  function () {
    const ganz = zufall(1, 99);
    const zehntel = zufall(0, 9);
    const hundertstel = zufall(1, 9);
    const zahl = ganz + zehntel / 10 + hundertstel / 100;
    const frageNach = Math.random() < 0.5;
    return {
      frage: 'Welche Ziffer steht bei ' + deutsch(Math.round(zahl * 100) / 100) +
             ' an der ' + (frageNach ? 'Zehntel' : 'Hundertstel') + '-Stelle?',
      antwort: String(frageNach ? zehntel : hundertstel),
      eingabe: 'zahl',
      hilfe: 'Direkt hinter dem Komma stehen die Zehntel, danach die Hundertstel.'
    };
  },
  // Kommazahl mit Geld
  function () {
    const preis = zufall(150, 4999) / 100;
    const anzahl = zufall(2, 6);
    const gesamt = Math.round(preis * anzahl * 100) / 100;
    return {
      frage: 'Ein Eis kostet ' + deutsch(preis) + ' €.\nWie viel kosten ' + anzahl + ' Eis?',
      antwort: deutsch(gesamt),
      eingabe: 'zahl',
      einheit: '€',
      hilfe: 'Rechne in Cent, wenn es leichter ist: ' + Math.round(preis * 100) +
             ' ct · ' + anzahl + '.'
    };
  }
];

/* ============================================================
   5. EINHEITEN UMRECHNEN
   ============================================================ */

const EINHEITEN_PAARE = [
  { gross: 'km', klein: 'm',   faktor: 1000 },
  { gross: 'm',  klein: 'cm',  faktor: 100 },
  { gross: 'm',  klein: 'mm',  faktor: 1000 },
  { gross: 'cm', klein: 'mm',  faktor: 10 },
  { gross: 'kg', klein: 'g',   faktor: 1000 },
  { gross: 't',  klein: 'kg',  faktor: 1000 },
  { gross: 'l',  klein: 'ml',  faktor: 1000 },
  { gross: '€',  klein: 'ct',  faktor: 100 },
  { gross: 'h',  klein: 'min', faktor: 60 },
  { gross: 'min', klein: 's',  faktor: 60 }
];

const K5_EINHEITEN = [
  // Von groß nach klein, mit Komma
  function () {
    const p = zufallsElement(EINHEITEN_PAARE);
    const wert = zufall(11, 995) / 10;                 // z. B. 3,5
    return {
      frage: deutsch(wert) + ' ' + p.gross + ' = ? ' + p.klein,
      antwort: deutsch(Math.round(wert * p.faktor * 100) / 100),
      eingabe: 'zahl',
      einheit: p.klein,
      hilfe: '1 ' + p.gross + ' sind ' + p.faktor + ' ' + p.klein +
             '. Rechne ' + deutsch(wert) + ' · ' + p.faktor + '.'
    };
  },
  // Von klein nach groß — nur Zehnereinheiten, damit höchstens zwei
  // Stellen hinter dem Komma stehen (bei 60 min käme 99,983 h heraus)
  function () {
    const p = zufallsElement(EINHEITEN_PAARE.filter(function (e) {
      return e.faktor % 10 === 0;
    }));
    const schritt = p.faktor >= 1000 ? p.faktor / 100 : 1;
    const wert = zufall(2, 99) * p.faktor + zufall(0, p.faktor / schritt - 1) * schritt;
    return {
      frage: wert + ' ' + p.klein + ' = ? ' + p.gross,
      antwort: deutsch(Math.round((wert / p.faktor) * 100) / 100),
      eingabe: 'zahl',
      einheit: p.gross,
      hilfe: p.faktor + ' ' + p.klein + ' sind 1 ' + p.gross +
             '. Teile also durch ' + p.faktor + '.'
    };
  },
  // Gemischte Schreibweise
  function () {
    const p = zufallsElement([
      { gross: 'm', klein: 'cm', faktor: 100 },
      { gross: 'kg', klein: 'g', faktor: 1000 },
      { gross: '€', klein: 'ct', faktor: 100 },
      { gross: 'h', klein: 'min', faktor: 60 }
    ]);
    const g = zufall(2, 9);
    const k = zufall(1, p.faktor - 1);
    return {
      frage: g + ' ' + p.gross + ' ' + k + ' ' + p.klein + ' = ? ' + p.klein,
      antwort: String(g * p.faktor + k),
      eingabe: 'zahl',
      einheit: p.klein,
      hilfe: 'Rechne erst die ' + p.gross + ' um: ' + g + ' · ' + p.faktor +
             ' = ' + (g * p.faktor) + ' ' + p.klein + '. Dann die ' + k + ' dazu.'
    };
  },
  // Zusammenzählen mit Einheiten
  function () {
    const p = zufallsElement([
      { gross: 'm', klein: 'cm', faktor: 100 },
      { gross: 'kg', klein: 'g', faktor: 1000 },
      { gross: 'l', klein: 'ml', faktor: 1000 }
    ]);
    const a = zufall(1, 8) * p.faktor;
    const b = zufall(50, p.faktor - 1);
    return {
      frage: (a / p.faktor) + ' ' + p.gross + ' + ' + b + ' ' + p.klein + ' = ? ' + p.klein,
      antwort: String(a + b),
      eingabe: 'zahl',
      einheit: p.klein,
      hilfe: 'Bring erst beide auf die gleiche Einheit.'
    };
  },
  // Zeitspanne
  function () {
    const std = zufall(1, 5);
    const min = zufall(5, 55);
    return {
      frage: 'Wie viele Minuten sind ' + std + ' h ' + min + ' min?',
      antwort: String(std * 60 + min),
      eingabe: 'zahl',
      einheit: 'min',
      hilfe: '1 h sind 60 min. Rechne ' + std + ' · 60 + ' + min + '.'
    };
  }
];

/* ============================================================
   6. GEOMETRIE — UMFANG UND FLÄCHE
   ============================================================ */

const K5_GEOMETRIE = [
  // Umfang Rechteck
  function () {
    const a = zufall(3, 40), b = zufall(3, 40);
    return {
      frage: 'Ein Rechteck ist ' + a + ' cm lang und ' + b + ' cm breit.\nWie groß ist der Umfang?',
      antwort: String(2 * (a + b)),
      eingabe: 'zahl',
      einheit: 'cm',
      hilfe: 'Der Umfang ist einmal rundherum: 2 · (' + a + ' + ' + b + ').'
    };
  },
  // Fläche Rechteck
  function () {
    const a = zufall(3, 25), b = zufall(3, 25);
    return {
      frage: 'Ein Rechteck ist ' + a + ' cm lang und ' + b + ' cm breit.\nWie groß ist die Fläche?',
      antwort: String(a * b),
      eingabe: 'zahl',
      einheit: 'cm²',
      hilfe: 'Fläche = Länge · Breite, also ' + a + ' · ' + b + '.'
    };
  },
  // Quadrat
  function () {
    const a = zufall(3, 30);
    const umfangGefragt = Math.random() < 0.5;
    return {
      frage: 'Ein Quadrat hat die Seitenlänge ' + a + ' cm.\nWie groß ist ' +
             (umfangGefragt ? 'der Umfang' : 'die Fläche') + '?',
      antwort: String(umfangGefragt ? 4 * a : a * a),
      eingabe: 'zahl',
      einheit: umfangGefragt ? 'cm' : 'cm²',
      hilfe: umfangGefragt
        ? 'Ein Quadrat hat 4 gleiche Seiten: 4 · ' + a + '.'
        : 'Fläche = Seite · Seite, also ' + a + ' · ' + a + '.'
    };
  },
  // Fehlende Seite
  function () {
    const a = zufall(3, 20), b = zufall(3, 20);
    return {
      frage: 'Ein Rechteck hat die Fläche ' + (a * b) + ' cm² und ist ' + a + ' cm lang.\n' +
             'Wie breit ist es?',
      antwort: String(b),
      eingabe: 'zahl',
      einheit: 'cm',
      hilfe: 'Teile die Fläche durch die Länge: ' + (a * b) + ' : ' + a + '.'
    };
  },
  // Sachaufgabe Fläche
  function () {
    const a = zufall(3, 12), b = zufall(2, 9);
    return {
      frage: 'Ein Zimmer ist ' + a + ' m lang und ' + b + ' m breit.\n' +
             'Wie viele Quadratmeter Teppich braucht man?',
      antwort: String(a * b),
      eingabe: 'zahl',
      einheit: 'm²',
      hilfe: 'Fläche = Länge · Breite.'
    };
  },
  // Zaun-Sachaufgabe
  function () {
    const a = zufall(5, 30), b = zufall(5, 30);
    return {
      frage: 'Ein Garten ist ' + a + ' m lang und ' + b + ' m breit und soll einen Zaun bekommen.\n' +
             'Wie viele Meter Zaun braucht man?',
      antwort: String(2 * (a + b)),
      eingabe: 'zahl',
      einheit: 'm',
      hilfe: 'Der Zaun geht einmal rundherum: 2 · (' + a + ' + ' + b + ').'
    };
  }
];

/* ============================================================
   DIE LEKTIONEN ANMELDEN
   ============================================================ */

lektion('klasse5', 'grosse-zahlen', {
  titel: 'Große Zahlen',
  symbol: '🔟',
  beschreibung: 'Bis zu einer Million: Stellenwerte, runden, vergleichen, plus und minus.',
  macheAufgabe: eineVon(K5_GROSSE_ZAHLEN),
  testZeitSek: 360
});

lektion('klasse5', 'schriftlich', {
  titel: 'Schriftlich rechnen',
  symbol: '📝',
  beschreibung: 'Die vier Rechenarten schriftlich — Zettel und Stift bereithalten!',
  macheAufgabe: eineVon(K5_SCHRIFTLICH),
  testZeitSek: 600
});

lektion('klasse5', 'brueche', {
  titel: 'Brüche',
  symbol: '🍕',
  beschreibung: 'Kürzen, erweitern, zusammenzählen, vergleichen und als Dezimalzahl schreiben.',
  macheAufgabe: eineVon(K5_BRUECHE),
  testZeitSek: 480
});

lektion('klasse5', 'dezimalzahlen', {
  titel: 'Dezimalzahlen',
  symbol: '🔸',
  beschreibung: 'Kommazahlen: rechnen, vergleichen und Stellenwerte erkennen.',
  macheAufgabe: eineVon(K5_DEZIMALZAHLEN),
  testZeitSek: 420
});

lektion('klasse5', 'einheiten', {
  titel: 'Einheiten umrechnen',
  symbol: '📏',
  beschreibung: 'km und m, kg und g, Liter, Euro und Cent, Stunden und Minuten.',
  macheAufgabe: eineVon(K5_EINHEITEN),
  testZeitSek: 420
});

lektion('klasse5', 'geometrie', {
  titel: 'Umfang und Fläche',
  symbol: '📐',
  beschreibung: 'Rechteck und Quadrat: einmal rundherum und wie viel Platz drin ist.',
  macheAufgabe: eineVon(K5_GEOMETRIE),
  testZeitSek: 420
});
