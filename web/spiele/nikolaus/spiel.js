/* ============================================================
   NIKOLAUS VS. MUTANTEN-MINIONS — der Spielablauf.

   Das ist die Browser-Fassung des alten Python-Spiels
   (liegt noch in legacy/nikolaus_spiel.py).

   Aufbau wie beim Weltraum-Quiz:
     rechne(dt)  — denkt: wo ist jetzt alles?
     zeichne()   — malt: so sieht es aus.
   Beides passiert 60-mal pro Sekunde in schleife().
   ============================================================ */

/* ---------- Der ganze Spielstand ---------- */
const SPIEL = {
  status: 'start',      // 'start' | 'laeuft' | 'countdown' | 'verloren' | 'gewonnen'
  level: 1,
  punkte: 0,
  level4Punkte: 0,
  zeitRest: 0,
  countdownRest: 0,
  monsterWartezeit: 0,  // Level 2: Monster kommen erst nach 5 Sekunden
  monsterKommenNoch: 0,
  spieler: null,
  daten: null,          // das aktuelle Level aus level.js
  wuerfe: [],
  grund: ''             // warum ist Schluss? (für den Endbildschirm)
};

const COUNTDOWN_SEK = 5;
const MONSTER_VERZOEGERUNG = 5;
const PUNKTE_TREFFER = 10;
const PUNKTE_SCHOKO = 5;
const LEVEL4_ZIEL = 100;
const DT_MAX = 0.05;             // nie mehr als 50 ms auf einmal rechnen

/* ---------- Welche Tasten sind gerade gedrückt? ---------- */
const TASTEN = {};

/* ---------- Die Bilder (funktioniert auch ohne sie) ---------- */
const BILDER = {};

function ladeBilder() {
  if (typeof Image !== 'function') return;      // im Test gibt es keine Bilder
  for (const name of ['nikolaus', 'monster', 'schoko']) {
    const bild = new Image();
    bild.src = 'bilder/' + name + '.png';
    bild.onload = function () { BILDER[name] = bild; };
  }
}

/* ============================================================
   EIN LEVEL STARTEN
   ============================================================ */

function macheSpieler() {
  return {
    x: 50,
    y: SPIELER_BODEN_Y,
    b: SPIELER_BREITE,
    h: SPIELER_HOEHE,
    vx: 0,
    vy: 0,
    schautRechts: true
  };
}

function starteLevel(nr) {
  SPIEL.level = nr;
  SPIEL.daten = macheLevel(nr);
  SPIEL.spieler = macheSpieler();
  SPIEL.wuerfe = [];
  SPIEL.zeitRest = SPIEL.daten.zeitLimit;
  SPIEL.monsterKommenNoch = SPIEL.daten.monsterSpaeter;
  SPIEL.monsterWartezeit = SPIEL.daten.monsterSpaeter > 0 ? MONSTER_VERZOEGERUNG : 0;
  if (nr === 4) SPIEL.level4Punkte = 0;
  SPIEL.status = 'laeuft';
}

function starteSpiel() {
  SPIEL.punkte = 0;
  SPIEL.level4Punkte = 0;
  SPIEL.grund = '';
  starteLevel(1);
  if (typeof zeigeBildschirm === 'function') zeigeBildschirm('spiel');
}

/* Level geschafft — 5 Sekunden Countdown, dann das nächste */
function levelGeschafft() {
  if (SPIEL.level >= LETZTES_LEVEL) {
    gewonnen();
    return;
  }
  SPIEL.status = 'countdown';
  SPIEL.countdownRest = COUNTDOWN_SEK;
}

function verloren(grund) {
  SPIEL.status = 'verloren';
  SPIEL.grund = grund || 'Ein Minion hat dich erwischt!';
  spielEnde();
}

function gewonnen() {
  SPIEL.status = 'gewonnen';
  SPIEL.grund = 'Du hast alle 5 Level geschafft!';
  spielEnde();
}

function spielEnde() {
  if (typeof speichereErgebnis === 'function') speichereErgebnis('nikolaus', SPIEL.punkte);
  if (typeof zeigeEndbildschirm === 'function') zeigeEndbildschirm();
}

/* ============================================================
   WERFEN
   ============================================================ */

function wirfSchokolade() {
  let vx = 0, vy = 0, gezielt = false;

  if (TASTEN.oben)   { vy = -TEMPO.wurf; gezielt = true; }
  if (TASTEN.unten)  { vy =  TEMPO.wurf; gezielt = true; }
  if (TASTEN.rechts) { vx =  TEMPO.wurf; gezielt = true; }
  if (!gezielt) vx = TEMPO.wurf;          // ohne Pfeiltaste immer nach rechts

  const s = SPIEL.spieler;
  SPIEL.wuerfe.push({
    x: s.x + s.b / 2 - 7,
    y: s.y + s.h / 2 - 7,
    b: 15, h: 15,
    vx: vx, vy: vy
  });
}

/* ============================================================
   RECHNEN — ein Bild weiterdenken
   ============================================================ */

function rechne(dt) {
  if (dt > DT_MAX) dt = DT_MAX;

  /* --- Countdown zwischen zwei Level --- */
  if (SPIEL.status === 'countdown') {
    SPIEL.countdownRest -= dt;
    if (SPIEL.countdownRest <= 0) starteLevel(SPIEL.level + 1);
    return;
  }

  if (SPIEL.status !== 'laeuft') return;

  const level = SPIEL.daten;
  const s = SPIEL.spieler;

  /* --- Die Uhr läuft --- */
  SPIEL.zeitRest -= dt;
  if (SPIEL.zeitRest <= 0) {
    SPIEL.zeitRest = 0;
    if (SPIEL.level === 1) {
      levelGeschafft();          // Level 1: Zeit überlebt = geschafft
    } else {
      verloren('Die Zeit ist um!');
    }
    return;
  }

  /* --- Monster, die erst später kommen (Level 2) --- */
  if (SPIEL.monsterKommenNoch > 0) {
    SPIEL.monsterWartezeit -= dt;
    if (SPIEL.monsterWartezeit <= 0) {
      for (let i = 0; i < SPIEL.monsterKommenNoch; i++) {
        level.monster.push(macheMonster(SPIEL.level));
      }
      SPIEL.monsterKommenNoch = 0;
    }
  }

  /* --- Nikolaus bewegen --- */
  bewegeSpieler(s, level, dt);

  /* --- Klettern im letzten Level --- */
  if (SPIEL.level === 5 && TASTEN.klettern && s.x > BREITE - 250) {
    s.vy = TEMPO.klettern;
  }

  /* --- Monster bewegen --- */
  for (const m of level.monster) bewegeMonster(m, dt);

  /* --- Würfe bewegen und aufräumen --- */
  for (const w of SPIEL.wuerfe) {
    w.x += w.vx * dt;
    w.y += w.vy * dt;
  }
  SPIEL.wuerfe = SPIEL.wuerfe.filter(function (w) {
    return w.x + w.b > 0 && w.x < BREITE && w.y + w.h > 0 && w.y < HOEHE;
  });

  /* --- Wurf trifft Monster: 10 Punkte, neues Monster kommt nach --- */
  for (let i = level.monster.length - 1; i >= 0; i--) {
    let getroffen = false;
    for (let j = SPIEL.wuerfe.length - 1; j >= 0; j--) {
      if (beruehrt(level.monster[i], SPIEL.wuerfe[j])) {
        SPIEL.wuerfe.splice(j, 1);
        getroffen = true;
        break;
      }
    }
    if (getroffen) {
      level.monster.splice(i, 1);
      level.monster.push(macheMonster(SPIEL.level));
      SPIEL.punkte += PUNKTE_TREFFER;
    }
  }

  /* --- Nikolaus sammelt Schokolade (Level 1 und 4) --- */
  if (SPIEL.level === 1 || SPIEL.level === 4) {
    for (let i = level.schokos.length - 1; i >= 0; i--) {
      if (beruehrt(s, level.schokos[i])) {
        level.schokos.splice(i, 1);
        level.schokos.push(macheSchoko());
        SPIEL.punkte += PUNKTE_SCHOKO;
        if (SPIEL.level === 4) SPIEL.level4Punkte += PUNKTE_SCHOKO;
      }
    }
  }

  /* --- Level 4: die Minions fressen die Schokolade weg --- */
  if (SPIEL.level === 4) {
    for (let i = level.schokos.length - 1; i >= 0; i--) {
      for (const m of level.monster) {
        if (beruehrt(m, level.schokos[i])) {
          level.schokos.splice(i, 1);
          level.schokos.push(macheSchoko());
          break;
        }
      }
    }
  }

  /* --- Ziel erreicht? --- */
  if (zielErreicht(s, level)) {
    if (SPIEL.level === 5) gewonnen();
    else levelGeschafft();
    return;
  }
  if (SPIEL.level === 4 && SPIEL.level4Punkte >= LEVEL4_ZIEL) {
    levelGeschafft();
    return;
  }

  /* --- Monster oder Wasser berührt = verloren --- */
  for (const m of level.monster) {
    if (beruehrt(s, m)) { verloren('Ein Minion hat dich erwischt!'); return; }
  }
  for (const w of level.wasser) {
    if (beruehrt(s, { x: w.x, y: w.y, b: w.b, h: w.h })) {
      verloren('Platsch! Ins Wasser gefallen.');
      return;
    }
  }
}

/* ---------- Ziel je Level ---------- */
function zielErreicht(s, level) {
  // Level 2: oben auf dem Turm rechts
  if (level.nr === 2) return s.x > 650 && s.y < HOEHE - 300;

  // Level 3 und 5: die gelbe Kiste bzw. Plattform berühren
  const etwasGroesser = { x: s.x - 1, y: s.y - 1, b: s.b + 2, h: s.h + 2 };
  for (const z of level.ziele) {
    if (beruehrt(etwasGroesser, z)) return true;
  }
  return false;
}

/* ---------- Nikolaus bewegen (erst seitwärts, dann hoch/runter) ---------- */
function bewegeSpieler(s, level, dt) {
  // Laufen
  s.vx = 0;
  if (TASTEN.links)  { s.vx = -TEMPO.laufen; s.schautRechts = false; }
  if (TASTEN.rechts) { s.vx =  TEMPO.laufen; s.schautRechts = true; }

  // Schwerkraft
  s.vy += TEMPO.schwerkraft * dt;

  // --- seitwärts ---
  s.x += s.vx * dt;
  for (const p of level.plattformen) {
    if (!beruehrt(s, p)) continue;
    if (s.vx > 0) s.x = p.x - s.b;
    else if (s.vx < 0) s.x = p.x + p.b;
  }
  if (s.x < 0) s.x = 0;
  if (s.x + s.b > BREITE) s.x = BREITE - s.b;

  // --- hoch und runter ---
  s.y += s.vy * dt;
  for (const p of level.plattformen) {
    if (!beruehrt(s, p)) continue;
    if (s.vy > 0) { s.y = p.y - s.h; s.vy = 0; }        // von oben gelandet
    else if (s.vy < 0) { s.y = p.y + p.h; s.vy = 0; }   // von unten angestoßen
  }

  // Auf der Wiese ist Schluss
  if (s.y >= SPIELER_BODEN_Y) {
    s.y = SPIELER_BODEN_Y;
    s.vy = 0;
  }
}

/* ---------- Springen: nur wenn man auf etwas steht ---------- */
function springe() {
  const s = SPIEL.spieler;
  if (!s) return false;

  if (s.y >= SPIELER_BODEN_Y - 1) { s.vy = TEMPO.sprung; return true; }

  // Steht Nikolaus auf einer Plattform? (2 Pixel tiefer nachschauen)
  const drunter = { x: s.x, y: s.y + 2, b: s.b, h: s.h };
  for (const p of SPIEL.daten.plattformen) {
    if (beruehrt(drunter, p)) { s.vy = TEMPO.sprung; return true; }
  }
  return false;
}

/* ============================================================
   ZEICHNEN
   ============================================================ */

let leinwand = null;
let stift = null;

function zeichne() {
  if (!stift) return;
  const level = SPIEL.daten;

  // Himmel und Wiese
  stift.fillStyle = FARBEN.himmel;
  stift.fillRect(0, 0, BREITE, HOEHE);
  stift.fillStyle = FARBEN.wiese;
  stift.fillRect(0, BODEN, BREITE, HOEHE - BODEN);

  if (!level) return;

  // Wasser
  for (const w of level.wasser) {
    stift.fillStyle = FARBEN.wasser;
    stift.fillRect(w.x, w.y, w.b, w.h);
  }

  // Turm-Deko (Level 5) und Plattformen
  for (const p of level.deko) kasten(p);
  for (const p of level.plattformen) kasten(p);

  // Schokolade zum Sammeln
  for (const sch of level.schokos) figur('schoko', sch, FARBEN.schoko);

  // Monster
  for (const m of level.monster) figur('monster', m, FARBEN.monster);

  // Würfe
  stift.fillStyle = FARBEN.wurf;
  for (const w of SPIEL.wuerfe) {
    stift.beginPath();
    stift.arc(w.x + w.b / 2, w.y + w.h / 2, w.b / 2, 0, Math.PI * 2);
    stift.fill();
  }

  // Nikolaus
  if (SPIEL.spieler) figur('nikolaus', SPIEL.spieler, FARBEN.nikolaus);

  // Hinweis oben
  stift.fillStyle = 'rgba(255,255,255,.8)';
  stift.fillRect(0, 0, BREITE, 34);
  stift.fillStyle = FARBEN.schrift;
  stift.font = 'bold 18px system-ui, sans-serif';
  stift.textAlign = 'center';
  stift.fillText(level.hinweis, BREITE / 2, 23);

  // Countdown zum nächsten Level
  if (SPIEL.status === 'countdown') {
    stift.fillStyle = 'rgba(0,0,0,.6)';
    stift.fillRect(0, 0, BREITE, HOEHE);
    stift.fillStyle = '#ffffff';
    stift.font = 'bold 34px system-ui, sans-serif';
    stift.fillText('Geschafft!', BREITE / 2, HOEHE / 2 - 40);
    stift.fillStyle = FARBEN.schoko;
    stift.font = 'bold 52px system-ui, sans-serif';
    stift.fillText('Level ' + (SPIEL.level + 1) + ' in ' + Math.ceil(SPIEL.countdownRest),
                   BREITE / 2, HOEHE / 2 + 25);
  }
  stift.textAlign = 'left';
}

function kasten(p) {
  stift.fillStyle = p.farbe;
  stift.fillRect(p.x, p.y, p.b, p.h);
  stift.strokeStyle = 'rgba(0,0,0,.35)';
  stift.lineWidth = 2;
  stift.strokeRect(p.x, p.y, p.b, p.h);
}

/* Ein Bild malen — und wenn es noch nicht geladen ist, ein Rechteck */
function figur(name, d, ersatzFarbe) {
  if (BILDER[name]) {
    stift.drawImage(BILDER[name], d.x, d.y, d.b, d.h);
  } else {
    stift.fillStyle = ersatzFarbe;
    stift.fillRect(d.x, d.y, d.b, d.h);
  }
}

/* Die Schleife (60 Bilder pro Sekunde) läuft in seite.js —
   dort kann man auch pausieren. */
