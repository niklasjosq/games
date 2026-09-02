/* ============================================================
   NIKOLAUS — die Level.

   Diese Datei beschreibt nur, WIE die Level aussehen. Das Spielen
   selbst steht in spiel.js. Hier darf man gefahrlos herumbasteln:
   Plattformen verschieben, mehr Monster einbauen, Zeit ändern.

   Die Zahlen kommen aus der alten Python-Version (legacy/nikolaus_spiel.py).
   Dort wurde pro Bild gerechnet (60 Bilder je Sekunde), hier pro Sekunde —
   deshalb sind alle Geschwindigkeiten mit 60 multipliziert.
   ============================================================ */

const BREITE = 800;
const HOEHE = 600;
const BODEN = HOEHE - 60;          // Oberkante der Wiese
const SPIELER_BREITE = 50;
const SPIELER_HOEHE = 70;
const SPIELER_BODEN_Y = HOEHE - 130;   // hier steht Nikolaus auf der Wiese

/* ---------- Wie schnell ist alles? (Pixel pro Sekunde) ---------- */
const TEMPO = {
  laufen:      5 * 60,       // 300
  schwerkraft: 0.35 * 60 * 60,
  sprung:      -10 * 60,     // -600
  wurf:        10 * 60,      // 600
  klettern:    -5 * 60       // -300
};

/* ---------- Farben wie im alten Spiel ---------- */
const FARBEN = {
  himmel:      '#ffffff',
  wiese:       '#228b22',
  nikolaus:    '#c80000',
  monster:     '#800080',
  wurf:        '#8b4513',
  schoko:      '#ffd700',
  kiste:       '#cd853f',
  container:   '#646464',
  baumstamm:   '#006400',
  ziel:        '#ffd700',
  wasser:      '#0000ff',
  schrift:     '#000000'
};

/* Wie weit ragt das Wasser über die Wiesenkante? (siehe Level 3) */
const WASSER_RAND = 12;

/* Die Treppe in Level 2. Zwei Regeln müssen stimmen, sonst ist das
   Level nicht zu schaffen:

   1) Höhe:  STUFEN_ABSTAND − STUFEN_DICKE > Spielerhöhe (70)
      Sonst stößt Nikolaus mit dem Kopf an die nächste Stufe und
      kann gar nicht auf der unteren stehen.   95 − 20 = 75 ✓
      Und STUFEN_ABSTAND < Sprunghöhe (143), sonst kommt er nicht hoch.

   2) Seite: STUFEN_VERSATZ > STUFEN_BREITE
      Die Stufen dürfen sich nicht überlappen — sonst steht Nikolaus
      beim Absprung unter der nächsten Stufe und stößt sich den Kopf.

   Der Test in test/test-spiel.js springt die Treppe wirklich hoch
   und merkt, wenn hier etwas nicht mehr passt. */
const STUFEN_ANZAHL = 3;
const STUFEN_ABSTAND = 95;
const STUFEN_DICKE = 20;
const STUFEN_BREITE = 80;
const STUFEN_VERSATZ = 95;
const STUFEN_START_X = 520;

/* Wie hoch ist der gelbe Zielklotz in Level 3? */
const ZIEL_KLOTZ_HOEHE = 70;

/* ---------- Zeit pro Level (Sekunden) ---------- */
const ZEIT_NORMAL = 20;
const ZEIT_LEVEL5 = 120;

function zeitFuerLevel(nr) {
  return nr === 5 ? ZEIT_LEVEL5 : ZEIT_NORMAL;
}

/* ---------- Kleine Helfer ---------- */

function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function zufallsElement(liste) {
  return liste[zufall(0, liste.length - 1)];
}

/* Stoßen sich zwei Kästen? (x, y, b, h) */
function beruehrt(a, b) {
  return a.x < b.x + b.b && a.x + a.b > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ============================================================
   MONSTER
   ============================================================ */

function macheMonster(level) {
  const m = { b: SPIELER_BREITE, h: SPIELER_HOEHE, level: level, x: 0, y: 0, vx: 0, vy: 0 };
  setzeMonsterNeu(m, true);
  return m;
}

/* Ein Monster (neu) an den Rand setzen — genau wie reset_pos() früher */
function setzeMonsterNeu(m, erstesMal) {
  m.vy = 0;

  if (m.level === 1 || m.level === 4) {
    m.x = BREITE + zufall(100, 1000);
    m.y = HOEHE - 90;
    m.vx = -zufall(2, 5) * 60;

  } else if (m.level === 2) {
    m.x = erstesMal ? BREITE + 100 : BREITE + 50;
    m.y = HOEHE - 90;
    m.vx = -zufall(2, 5) * 60;

  } else if (m.level === 3) {
    m.x = BREITE + zufall(50, 300);
    m.y = HOEHE - 90;
    m.vx = -zufall(2, 6) * 60;
    // Manche Monster laufen oben auf den Plattformen
    if (Math.random() > 0.7) m.y = HOEHE - 270;

  } else if (m.level === 5) {
    // Im letzten Level fallen die Monster von oben herab
    m.x = zufall(0, BREITE - SPIELER_BREITE);
    m.y = -80;
    m.vy = zufall(3, 7) * 60;
    m.vx = zufallsElement([-2, -1, 0, 1, 2]) * 60;
  }
  return m;
}

/* Ein Monster ein Stück weiterbewegen. dt = Sekunden seit dem letzten Bild. */
function bewegeMonster(m, dt) {
  m.x += m.vx * dt;
  m.y += m.vy * dt;

  if (m.level === 1 || m.level === 3 || m.level === 4) {
    if (m.x + m.b < 0) setzeMonsterNeu(m, false);

  } else if (m.level === 2) {
    // Level 2: Monster laufen im Kreis durchs Bild
    if (m.vx < 0 && m.x + m.b < 0) m.x = BREITE;
    else if (m.vx > 0 && m.x > BREITE) m.x = -m.b;

  } else if (m.level === 5) {
    if (m.y > HOEHE) setzeMonsterNeu(m, false);
  }
  return m;
}

/* ============================================================
   SAMMEL-SCHOKOLADE (liegt auf der Wiese)
   ============================================================ */

function macheSchoko() {
  return {
    x: zufall(0, BREITE - SPIELER_BREITE),
    y: HOEHE - 80,
    b: SPIELER_BREITE,
    h: SPIELER_HOEHE
  };
}

/* ============================================================
   DIE LEVEL

   Ein Level gibt zurück:
     plattformen  — hier bleibt man drauf stehen
     deko         — sieht man, läuft aber durch (Turm in Level 5)
     wasser       — reinfallen = verloren
     ziele        — berühren = Level geschafft
     monster, schokos
     zeitLimit    — Sekunden
     hinweis      — was oben im Bild steht
     monsterSpaeter — Anzahl Monster, die erst nach 5 Sekunden kommen
   ============================================================ */

function macheLevel(nr) {
  const level = {
    nr: nr,
    plattformen: [],
    deko: [],
    wasser: [],
    ziele: [],
    monster: [],
    schokos: [],
    zeitLimit: zeitFuerLevel(nr),
    hinweis: '',
    monsterSpaeter: 0
  };

  if (nr === 1) {
    for (let i = 0; i < 3; i++) level.monster.push(macheMonster(1));
    for (let i = 0; i < 5; i++) level.schokos.push(macheSchoko());
    level.hinweis = 'Sammle Schokolade und wirf mit der Leertaste! Halte bis zum Ende durch.';

  } else if (nr === 2) {
    // Kisten und ein Baumstamm zum Hochhüpfen
    level.plattformen.push(
      { x: 200, y: HOEHE - 150, b: 100, h: 20, farbe: FARBEN.kiste },
      { x: 400, y: HOEHE - 250, b: 120, h: 20, farbe: FARBEN.baumstamm },
      { x: 100, y: HOEHE - 300, b: 80,  h: 20, farbe: FARBEN.kiste }
    );

    // Die Treppe nach oben rechts. Die Stufen müssen weit genug
    // auseinander liegen, damit Nikolaus (70 px hoch) dazwischen passt:
    // STUFEN_ABSTAND − Stufendicke muss größer als 70 sein.
    // (Im alten Python-Spiel standen die Container direkt aufeinander —
    //  damit war der Turm eine geschlossene Wand und Level 2 nicht
    //  zu schaffen.)
    for (let i = 0; i < STUFEN_ANZAHL; i++) {
      const oberste = i === STUFEN_ANZAHL - 1;
      const stufe = {
        x: STUFEN_START_X + i * STUFEN_VERSATZ,
        y: BODEN - STUFEN_ABSTAND * (i + 1),
        b: STUFEN_BREITE,
        h: STUFEN_DICKE,
        farbe: oberste ? FARBEN.ziel : (i === 1 ? FARBEN.baumstamm : FARBEN.kiste)
      };
      level.plattformen.push(stufe);
      if (oberste) level.ziele.push(stufe);      // die gelbe Stufe ist das Ziel
    }

    level.monsterSpaeter = 5;
    level.hinweis = 'Spring die Treppe hoch bis zur gelben Stufe! In 5 Sekunden kommen die Minions.';

  } else if (nr === 3) {
    // Löcher in der Wiese. Sie reichen ein Stück über die Wiesenkante
    // hinauf — sonst würde man knapp drüberlaufen, ohne nass zu werden.
    // (Genau das war ein Fehler in der alten Python-Fassung.)
    level.wasser.push(
      { x: 200, y: BODEN - WASSER_RAND, b: 80, h: 60 + WASSER_RAND },
      { x: 480, y: BODEN - WASSER_RAND, b: 80, h: 60 + WASSER_RAND }
    );

    // Hier stehen bewusst KEINE schwebenden Kisten. Vor einem Loch
    // braucht man freien Anlauf — steht eine Kiste im Weg, stößt man
    // beim Absprung mit dem Kopf an und fällt ins Wasser. Das Level
    // hat schon genug Aufgabe mit den beiden Löchern.

    // Das Ziel ist ein gelber Klotz, der auf der Wiese steht. Ihn
    // einfach zu berühren genügt — an einen Klotz am Boden kann man
    // sich anlehnen, das ist viel freundlicher als eine schwebende
    // Plattform, die man treffen muss.
    const ziel = { x: 650, y: BODEN - ZIEL_KLOTZ_HOEHE, b: 120,
                   h: ZIEL_KLOTZ_HOEHE, farbe: FARBEN.ziel };
    level.plattformen.push(ziel);
    level.ziele.push(ziel);

    for (let i = 0; i < 4; i++) level.monster.push(macheMonster(3));
    level.hinweis = 'Spring über die Wasserlöcher bis zum gelben Klotz rechts!';

  } else if (nr === 4) {
    for (let i = 0; i < 5; i++) level.monster.push(macheMonster(4));
    for (let i = 0; i < 8; i++) level.schokos.push(macheSchoko());
    level.hinweis = 'Sammle 100 Punkte Schokolade, bevor die Minions sie wegfressen!';

  } else if (nr === 5) {
    // Schräger Turm aus Containern. Er ist nur Deko — man klettert mit N.
    const startX = BREITE - 180;
    for (let i = 0; i < 10; i++) {
      const kiste = {
        x: startX + i * 8,
        y: HOEHE - 60 - i * 60,
        b: 100, h: 50,
        farbe: i === 9 ? FARBEN.ziel : FARBEN.container
      };
      level.deko.push(kiste);
      if (i === 9) level.ziele.push(kiste);
    }
    for (let i = 0; i < 6; i++) level.monster.push(macheMonster(5));
    level.hinweis = 'LETZTES LEVEL: Halte am Turm die Taste N zum Klettern! Weiche den Monstern aus.';
  }

  return level;
}

const LETZTES_LEVEL = 5;
