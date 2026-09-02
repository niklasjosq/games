/* ============================================================
   MATHE 3. KLASSE (etwa 8 Jahre)

   Stoff: Zahlenraum bis 1000, Plus und Minus mit Übergang,
   kleines Einmaleins, Teilen mit Rest, Sachaufgaben,
   Geld, Zeit und Längen.

   Jede macheAufgabe() gibt eine fertige Aufgabe zurück.
   Neue Aufgabensorte? Einfach eine Funktion in die Liste
   der passenden Lektion schreiben.
   ============================================================ */

/* Hilfsfunktion: eine Sorte aus einer Liste ziehen und ausführen */
function eineVon(sorten) {
  return function () { return zufallsElement(sorten)(); };
}

/* ============================================================
   1. PLUS UND MINUS BIS 1000
   ============================================================ */

const K3_PLUS_MINUS = [
  // Plus, glatte Hunderter (leicht im Kopf)
  function () {
    const a = zufall(1, 8) * 100 + zufall(0, 9) * 10;
    const b = zufall(1, 9) * 100;
    return {
      frage: a + ' + ' + b + ' = ?',
      antwort: String(a + b),
      eingabe: 'zahl',
      hilfe: 'Die Hunderter kannst du einfach zusammenzählen: ' +
             Math.floor(a / 100) + ' + ' + (b / 100) + ' Hunderter.'
    };
  },
  // Plus mit Übergang
  function () {
    const a = zufall(120, 700);
    const b = zufall(100, 299);
    return {
      frage: a + ' + ' + b + ' = ?',
      antwort: String(a + b),
      eingabe: 'zahl',
      hilfe: 'Rechne in zwei Schritten: ' + a + ' + ' + Math.floor(b / 100) * 100 +
             ' = ' + (a + Math.floor(b / 100) * 100) + ', dann noch + ' + (b % 100) + '.'
    };
  },
  // Minus
  function () {
    const a = zufall(300, 999);
    const b = zufall(100, a - 50);
    return {
      frage: a + ' − ' + b + ' = ?',
      antwort: String(a - b),
      eingabe: 'zahl',
      hilfe: 'Nimm erst die Hunderter weg, dann den Rest.'
    };
  },
  // Fehlende Zahl
  function () {
    const a = zufall(150, 600);
    const b = zufall(50, 350);
    return {
      frage: a + ' + ___ = ' + (a + b),
      antwort: String(b),
      eingabe: 'zahl',
      hilfe: 'Du suchst den Unterschied: ' + (a + b) + ' − ' + a + '.'
    };
  },
  // Verdoppeln und halbieren
  function () {
    const verdoppeln = Math.random() < 0.5;
    if (verdoppeln) {
      const a = zufall(50, 480);
      return {
        frage: 'Verdopple die Zahl ' + a + '.',
        antwort: String(a * 2),
        eingabe: 'zahl',
        hilfe: 'Verdoppeln heißt: die Zahl plus sich selbst, also ' + a + ' + ' + a + '.'
      };
    }
    const a = zufall(50, 480) * 2;
    return {
      frage: 'Halbiere die Zahl ' + a + '.',
      antwort: String(a / 2),
      eingabe: 'zahl',
      hilfe: 'Halbieren heißt: durch 2 teilen.'
    };
  },
  // Runden auf Zehner/Hunderter
  function () {
    const aufHunderter = Math.random() < 0.5;
    const a = zufall(112, 987);
    if (aufHunderter) {
      return {
        frage: 'Runde ' + a + ' auf Hunderter.',
        antwort: String(Math.round(a / 100) * 100),
        eingabe: 'zahl',
        hilfe: 'Schau auf die Zehnerstelle: ab 5 wird aufgerundet.'
      };
    }
    return {
      frage: 'Runde ' + a + ' auf Zehner.',
      antwort: String(Math.round(a / 10) * 10),
      eingabe: 'zahl',
      hilfe: 'Schau auf die letzte Stelle: ab 5 wird aufgerundet.'
    };
  }
];

/* ============================================================
   2. DAS KLEINE EINMALEINS
   ============================================================ */

const K3_EINMALEINS = [
  // Malaufgabe
  function () {
    const a = zufall(2, 10), b = zufall(2, 10);
    return {
      frage: a + ' · ' + b + ' = ?',
      antwort: String(a * b),
      eingabe: 'zahl',
      hilfe: a + ' · ' + b + ' heißt: ' + b + '-mal die ' + a + ' zusammenzählen.'
    };
  },
  // Umkehraufgabe: was fehlt?
  function () {
    const a = zufall(2, 10), b = zufall(2, 10);
    return {
      frage: '___ · ' + a + ' = ' + (a * b),
      antwort: String(b),
      eingabe: 'zahl',
      hilfe: 'Teile zurück: ' + (a * b) + ' : ' + a + '.'
    };
  },
  // Geteilt
  function () {
    const a = zufall(2, 10), b = zufall(2, 10);
    return {
      frage: (a * b) + ' : ' + a + ' = ?',
      antwort: String(b),
      eingabe: 'zahl',
      hilfe: 'Frage dich: Wie oft passt die ' + a + ' in die ' + (a * b) + '?'
    };
  },
  // Reihe fortsetzen
  function () {
    const schritt = zufall(2, 9);
    const start = schritt * zufall(1, 5);
    const reihe = [start, start + schritt, start + 2 * schritt, start + 3 * schritt];
    return {
      frage: 'Wie geht die Reihe weiter?\n' + reihe.join(', ') + ', ___',
      antwort: String(start + 4 * schritt),
      eingabe: 'zahl',
      hilfe: 'Von einer Zahl zur nächsten sind es immer ' + schritt + '.'
    };
  },
  // Mit 10 und 100
  function () {
    const a = zufall(2, 9);
    const mal = zufallsElement([10, 100]);
    return {
      frage: a + ' · ' + mal + ' = ?',
      antwort: String(a * mal),
      eingabe: 'zahl',
      hilfe: 'Bei · ' + mal + ' hängst du einfach ' + (mal === 10 ? 'eine Null' : 'zwei Nullen') + ' an.'
    };
  },
  // Zwei Schritte
  function () {
    const a = zufall(2, 9), b = zufall(2, 5), c = zufall(2, 20);
    return {
      frage: a + ' · ' + b + ' + ' + c + ' = ?',
      antwort: String(a * b + c),
      eingabe: 'zahl',
      hilfe: 'Punkt vor Strich: Rechne erst ' + a + ' · ' + b + ' = ' + (a * b) + ', dann + ' + c + '.'
    };
  }
];

/* ============================================================
   3. TEILEN MIT REST
   ============================================================ */

const K3_DIVISION_REST = [
  function () {
    const teiler = zufall(2, 9);
    const ergebnis = zufall(2, 9);
    const rest = zufall(1, teiler - 1);
    const zahl = teiler * ergebnis + rest;
    return {
      frage: zahl + ' : ' + teiler + ' = ?',
      antwort: ergebnis + ' R ' + rest,
      eingabe: 'rest',
      hilfe: 'Die ' + teiler + ' passt ' + ergebnis + '-mal in die ' + zahl +
             ' (' + teiler + ' · ' + ergebnis + ' = ' + (teiler * ergebnis) + '). ' +
             'Dann bleiben noch ' + rest + ' übrig.'
    };
  },
  // Auch mal ohne Rest — man muss aufpassen!
  function () {
    const teiler = zufall(2, 9);
    const ergebnis = zufall(2, 9);
    return {
      frage: (teiler * ergebnis) + ' : ' + teiler + ' = ?',
      antwort: ergebnis + ' R 0',
      eingabe: 'rest',
      hilfe: 'Hier geht es genau auf — der Rest ist 0.'
    };
  },
  // Aufteil-Geschichte
  function () {
    const kinder = zufall(3, 6);
    const rest = zufall(1, kinder - 1);
    const jedes = zufall(2, 8);
    const gesamt = kinder * jedes + rest;
    const dinge = zufallsElement(['Bonbons', 'Kekse', 'Sticker', 'Gummibärchen', 'Nüsse']);
    return {
      frage: gesamt + ' ' + dinge + ' werden gerecht an ' + kinder +
             ' Kinder verteilt.\nWie viele bekommt jedes Kind, und wie viele bleiben übrig?',
      antwort: jedes + ' R ' + rest,
      eingabe: 'rest',
      hilfe: 'Rechne ' + gesamt + ' : ' + kinder + '. Was nicht mehr aufgeht, bleibt übrig.'
    };
  }
];

/* ============================================================
   4. SACHAUFGABEN
   ============================================================ */

const K3_SACHAUFGABEN = [
  // Einkaufen
  function () {
    const anzahl = zufall(3, 8);
    const preis = zufall(2, 9);
    const ding = zufallsElement(['Hefte', 'Stifte', 'Radiergummis', 'Lineale', 'Blöcke']);
    return {
      frage: 'Anna kauft ' + anzahl + ' ' + ding + '. Jedes kostet ' + preis + ' €.\n' +
             'Wie viel muss sie bezahlen?',
      antwort: String(anzahl * preis),
      eingabe: 'zahl',
      einheit: '€',
      hilfe: 'Rechne ' + anzahl + ' · ' + preis + ' €.'
    };
  },
  // Wechselgeld
  function () {
    const gezahlt = zufallsElement([10, 20, 50]);
    const preis = zufall(3, gezahlt - 2);
    return {
      frage: 'Ein Buch kostet ' + preis + ' €. Tim bezahlt mit ' + gezahlt + ' €.\n' +
             'Wie viel Wechselgeld bekommt er?',
      antwort: String(gezahlt - preis),
      eingabe: 'zahl',
      einheit: '€',
      hilfe: 'Rechne ' + gezahlt + ' € − ' + preis + ' €.'
    };
  },
  // Dazu und weg
  function () {
    const start = zufall(120, 500);
    const dazu = zufall(30, 200);
    const weg = zufall(20, 100);
    return {
      frage: 'In der Bibliothek stehen ' + start + ' Bücher.\n' +
             dazu + ' Bücher kommen neu dazu, ' + weg + ' werden ausgeliehen.\n' +
             'Wie viele stehen jetzt im Regal?',
      antwort: String(start + dazu - weg),
      eingabe: 'zahl',
      hilfe: 'Erst dazuzählen: ' + start + ' + ' + dazu + ' = ' + (start + dazu) +
             '. Dann abziehen: − ' + weg + '.'
    };
  },
  // Gerecht teilen
  function () {
    const gruppen = zufall(3, 8);
    const jede = zufall(3, 9);
    const ding = zufallsElement(['Luftballons', 'Murmeln', 'Karten', 'Blumen']);
    return {
      frage: (gruppen * jede) + ' ' + ding + ' werden gleichmäßig in ' + gruppen +
             ' Tüten gepackt.\nWie viele sind in jeder Tüte?',
      antwort: String(jede),
      eingabe: 'zahl',
      hilfe: 'Rechne ' + (gruppen * jede) + ' : ' + gruppen + '.'
    };
  },
  // Vergleichen
  function () {
    const a = zufall(150, 800);
    const unterschied = zufall(20, 140);
    return {
      frage: 'Lena hat ' + a + ' Sticker, Ben hat ' + (a + unterschied) + ' Sticker.\n' +
             'Wie viele Sticker hat Ben mehr?',
      antwort: String(unterschied),
      eingabe: 'zahl',
      hilfe: 'Rechne ' + (a + unterschied) + ' − ' + a + '.'
    };
  },
  // Zweischrittig mit Mal
  function () {
    const packungen = zufall(3, 7);
    const proPackung = zufall(4, 9);
    const gegessen = zufall(2, 8);
    return {
      frage: 'Papa kauft ' + packungen + ' Packungen Kekse mit je ' + proPackung + ' Keksen.\n' +
             'Die Kinder essen ' + gegessen + ' Kekse.\nWie viele Kekse sind noch da?',
      antwort: String(packungen * proPackung - gegessen),
      eingabe: 'zahl',
      hilfe: 'Erst mal: ' + packungen + ' · ' + proPackung + ' = ' +
             (packungen * proPackung) + '. Dann − ' + gegessen + '.'
    };
  }
];

/* ============================================================
   5. GELD, ZEIT UND LÄNGEN
   ============================================================ */

const K3_GELD_ZEIT_LAENGEN = [
  // Euro und Cent
  function () {
    const euro = zufall(1, 9);
    const cent = zufall(1, 99);
    return {
      frage: 'Wie viele Cent sind ' + euro + ' € und ' + cent + ' ct?',
      antwort: String(euro * 100 + cent),
      eingabe: 'zahl',
      einheit: 'ct',
      hilfe: '1 € sind 100 ct. Also ' + euro + ' · 100 = ' + (euro * 100) + ' ct, plus ' + cent + ' ct.'
    };
  },
  function () {
    const cent = zufall(2, 9) * 100 + zufall(1, 99);
    return {
      frage: cent + ' ct sind wie viele Euro?\nSchreibe es so: 3,45',
      antwort: deutsch(cent / 100),
      eingabe: 'zahl',
      einheit: '€',
      hilfe: 'Immer 100 ct sind 1 €. Setze das Komma zwei Stellen von rechts.'
    };
  },
  // Uhrzeit: Dauer
  function () {
    const start = zufall(7, 18);
    const startMin = zufallsElement([0, 15, 30, 45]);
    const dauer = zufallsElement([30, 45, 60, 75, 90, 120]);
    const gesamt = start * 60 + startMin + dauer;
    const endeStd = Math.floor(gesamt / 60);
    const endeMin = gesamt % 60;
    return {
      frage: 'Der Film beginnt um ' + start + ':' + String(startMin).padStart(2, '0') +
             ' Uhr und dauert ' + dauer + ' Minuten.\nWann ist er zu Ende? (z. B. 17:30)',
      antwort: endeStd + ':' + String(endeMin).padStart(2, '0'),
      eingabe: 'uhrzeit',
      hilfe: 'Eine Stunde hat 60 Minuten. ' + dauer + ' Minuten sind ' +
             Math.floor(dauer / 60) + ' Stunde(n) und ' + (dauer % 60) + ' Minuten.'
    };
  },
  function () {
    const std = zufall(2, 9);
    return {
      frage: 'Wie viele Minuten sind ' + std + ' Stunden?',
      antwort: String(std * 60),
      eingabe: 'zahl',
      einheit: 'min',
      hilfe: 'Eine Stunde hat 60 Minuten. Rechne ' + std + ' · 60.'
    };
  },
  // Längen
  function () {
    const m = zufall(2, 9);
    return {
      frage: 'Wie viele Zentimeter sind ' + m + ' m?',
      antwort: String(m * 100),
      eingabe: 'zahl',
      einheit: 'cm',
      hilfe: '1 m sind 100 cm. Rechne ' + m + ' · 100.'
    };
  },
  function () {
    const cm = zufall(2, 9);
    return {
      frage: 'Wie viele Millimeter sind ' + cm + ' cm?',
      antwort: String(cm * 10),
      eingabe: 'zahl',
      einheit: 'mm',
      hilfe: '1 cm sind 10 mm.'
    };
  },
  function () {
    const km = zufall(2, 9);
    return {
      frage: 'Wie viele Meter sind ' + km + ' km?',
      antwort: String(km * 1000),
      eingabe: 'zahl',
      einheit: 'm',
      hilfe: '1 km sind 1000 m.'
    };
  },
  // Längen vergleichen — mal ist das eine länger, mal das andere
  function () {
    const meter = zufall(2, 8);
    const unterschied = zufall(1, 99);
    const cmGewinnt = Math.random() < 0.5;
    const zentimeter = meter * 100 + (cmGewinnt ? unterschied : -unterschied);
    return {
      frage: 'Was ist länger: ' + meter + ' m oder ' + zentimeter + ' cm?\n' +
             'Antworte mit "m" oder "cm".',
      antwort: cmGewinnt ? 'cm' : 'm',
      eingabe: 'text',
      hilfe: 'Rechne beides in cm um: ' + meter + ' m sind ' + (meter * 100) + ' cm.'
    };
  },
  // Gewicht
  function () {
    const kg = zufall(2, 9);
    return {
      frage: 'Wie viele Gramm sind ' + kg + ' kg?',
      antwort: String(kg * 1000),
      eingabe: 'zahl',
      einheit: 'g',
      hilfe: '1 kg sind 1000 g.'
    };
  }
];

/* ============================================================
   DIE LEKTIONEN ANMELDEN
   ============================================================ */

lektion('klasse3', 'plus-minus', {
  titel: 'Plus und Minus bis 1000',
  symbol: '➕',
  beschreibung: 'Zusammenzählen und abziehen, verdoppeln, halbieren und runden.',
  macheAufgabe: eineVon(K3_PLUS_MINUS),
  testZeitSek: 300
});

lektion('klasse3', 'einmaleins', {
  titel: 'Das kleine Einmaleins',
  symbol: '✖️',
  beschreibung: 'Malaufgaben, Umkehraufgaben, Teilen und Zahlenreihen.',
  macheAufgabe: eineVon(K3_EINMALEINS),
  testZeitSek: 240
});

lektion('klasse3', 'division-rest', {
  titel: 'Teilen mit Rest',
  symbol: '➗',
  beschreibung: 'Wie oft passt es hinein — und was bleibt übrig?',
  macheAufgabe: eineVon(K3_DIVISION_REST),
  testZeitSek: 300
});

lektion('klasse3', 'sachaufgaben', {
  titel: 'Sachaufgaben',
  symbol: '📖',
  beschreibung: 'Kleine Geschichten aus dem Alltag: einkaufen, teilen, vergleichen.',
  macheAufgabe: eineVon(K3_SACHAUFGABEN),
  testZeitSek: 420
});

lektion('klasse3', 'geld-zeit-laengen', {
  titel: 'Geld, Zeit und Längen',
  symbol: '🕐',
  beschreibung: 'Euro und Cent, Uhrzeiten und Dauern, Meter, Zentimeter und Kilogramm.',
  macheAufgabe: eineVon(K3_GELD_ZEIT_LAENGEN),
  testZeitSek: 360
});
