/* Test für das Nikolaus-Spiel — spielt ohne Browser.
   Wir laden level.js und spiel.js in eine Mini-Umgebung und
   rechnen die Bilder selbst weiter (kein requestAnimationFrame). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const GETEILT = path.join(__dirname, '..', '..', '..', 'shared') + path.sep;

/* ---------------- Test-Helfer ---------------- */
let fehler = 0;
function pruefe(bedingung, text) {
  if (bedingung) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

/* ---------------- Mini-localStorage (für die Punkte) ---------------- */
function neuerSpeicher() {
  const daten = new Map();
  return {
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => { daten.set(k, String(v)); },
    removeItem: (k) => { daten.delete(k); },
    key: (i) => [...daten.keys()][i] ?? null,
    get length() { return daten.size; }
  };
}

/* ---------------- Eine frische Spielwelt bauen ---------------- */
function frischeWelt() {
  const umgebung = {
    console: console, Math: Math, JSON: JSON, Date: Date, Object: Object,
    localStorage: neuerSpeicher(),
    // Kein Browser: kein Bild, keine Leinwand, kein Bildschirmwechsel
    requestAnimationFrame: function () {},
    location: { search: '' }
  };
  umgebung.window = umgebung;
  const kontext = vm.createContext(umgebung);

  for (const datei of [GETEILT + 'speicher.js', GETEILT + 'profil.js',
                       ORDNER + 'level.js', ORDNER + 'spiel.js']) {
    vm.runInContext(fs.readFileSync(datei, 'utf8'), kontext, { filename: path.basename(datei) });
  }
  return kontext;
}

/* Ein Stück Spielzeit vergehen lassen: sek Sekunden in 60er-Schritten */
function spieleZeit(kontext, sek) {
  const schritte = Math.round(sek * 60);
  for (let i = 0; i < schritte; i++) {
    vm.runInContext('rechne(1/60)', kontext);
  }
}

const w = (kontext) => (code) => vm.runInContext(code, kontext);

/* ============================================================
   TEST 1: Die Level sind so gebaut wie geplant
   ============================================================ */
console.log('\n=== TEST: Aufbau der Level ===');
{
  const k = frischeWelt();
  const lauf = w(k);

  gleich(lauf('macheLevel(1).monster.length'), 3, 'Level 1 hat 3 Monster');
  gleich(lauf('macheLevel(1).schokos.length'), 5, 'Level 1 hat 5 Schokoladen');
  gleich(lauf('macheLevel(1).zeitLimit'), 20, 'Level 1 dauert 20 Sekunden');

  gleich(lauf('macheLevel(2).plattformen.length'), 8, 'Level 2 hat 3 Plattformen + 5 Turmteile');
  gleich(lauf('macheLevel(2).monster.length'), 0, 'in Level 2 sind am Anfang keine Monster da');
  gleich(lauf('macheLevel(2).monsterSpaeter'), 5, 'in Level 2 kommen 5 Monster später');

  gleich(lauf('macheLevel(3).wasser.length'), 2, 'Level 3 hat 2 Wasserlöcher');
  gleich(lauf('macheLevel(3).ziele.length'), 1, 'Level 3 hat eine Zielplattform');
  gleich(lauf('macheLevel(3).monster.length'), 4, 'Level 3 hat 4 Monster');
  gleich(lauf('macheLevel(3).monster[0].vx > 0'), true, 'das Plattform-Monster läuft nach rechts');

  gleich(lauf('macheLevel(4).monster.length'), 5, 'Level 4 hat 5 Monster');
  gleich(lauf('macheLevel(4).schokos.length'), 8, 'Level 4 hat 8 Schokoladen');

  gleich(lauf('macheLevel(5).deko.length'), 10, 'Level 5 hat 10 Turmkisten');
  gleich(lauf('macheLevel(5).plattformen.length'), 0,
         'die Turmkisten sind nur Deko — man bleibt nicht hängen');
  gleich(lauf('macheLevel(5).ziele.length'), 1, 'die oberste Kiste ist das Ziel');
  gleich(lauf('macheLevel(5).ziele[0].farbe'), '#ffd700', 'das Ziel ist gelb');
  gleich(lauf('macheLevel(5).monster.length'), 6, 'Level 5 hat 6 fallende Monster');
  gleich(lauf('macheLevel(5).zeitLimit'), 120, 'Level 5 dauert 120 Sekunden');
  gleich(lauf('macheLevel(5).monster.every(m => m.vy > 0)'), true,
         'alle Monster in Level 5 fallen nach unten');
  gleich(lauf('macheLevel(5).deko[9].y < macheLevel(5).deko[0].y'), true,
         'die oberste Kiste liegt höher als die unterste');
}

/* ============================================================
   TEST 2: Nikolaus läuft, springt und fällt nicht durch den Boden
   ============================================================ */
console.log('\n=== TEST: Laufen und Springen ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel()');
  lauf('SPIEL.daten.monster = []');      // in Ruhe üben, ohne Minions

  gleich(lauf('SPIEL.status'), 'laeuft', 'das Spiel läuft');
  gleich(lauf('SPIEL.level'), 1, 'wir sind in Level 1');
  gleich(lauf('SPIEL.spieler.y'), lauf('SPIELER_BODEN_Y'), 'Nikolaus steht auf der Wiese');

  // nach rechts laufen
  const vorher = lauf('SPIEL.spieler.x');
  lauf('TASTEN.rechts = true');
  spieleZeit(k, 0.5);
  pruefe(lauf('SPIEL.spieler.x') > vorher + 100, 'nach rechts laufen bewegt Nikolaus');
  gleich(lauf('SPIEL.spieler.schautRechts'), true, 'er schaut nach rechts');

  // nach links laufen
  lauf('TASTEN.rechts = false; TASTEN.links = true');
  spieleZeit(k, 0.5);
  gleich(lauf('SPIEL.spieler.schautRechts'), false, 'er schaut nach links');
  lauf('TASTEN.links = false');

  // nicht aus dem Bild laufen
  lauf('TASTEN.links = true');
  spieleZeit(k, 3);
  pruefe(lauf('SPIEL.spieler.x') >= 0, 'Nikolaus läuft nicht links aus dem Bild');
  lauf('TASTEN.links = false');
  lauf('TASTEN.rechts = true');
  spieleZeit(k, 4);
  pruefe(lauf('SPIEL.spieler.x + SPIEL.spieler.b') <= lauf('BREITE'),
         'Nikolaus läuft nicht rechts aus dem Bild');
  lauf('TASTEN.rechts = false');

  // springen
  gleich(lauf('springe()'), true, 'vom Boden aus kann man springen');
  pruefe(lauf('SPIEL.spieler.vy') < 0, 'nach dem Sprung geht es nach oben');
  spieleZeit(k, 0.15);
  pruefe(lauf('SPIEL.spieler.y') < lauf('SPIELER_BODEN_Y'), 'Nikolaus ist in der Luft');
  gleich(lauf('springe()'), false, 'in der Luft kann man nicht nochmal springen');
  spieleZeit(k, 2);
  gleich(lauf('SPIEL.spieler.y'), lauf('SPIELER_BODEN_Y'), 'danach landet er wieder');
}

/* ============================================================
   TEST 3: Werfen und treffen
   ============================================================ */
console.log('\n=== TEST: Schokolade werfen ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel()');

  gleich(lauf('SPIEL.wuerfe.length'), 0, 'am Anfang fliegt nichts');
  lauf('wirfSchokolade()');
  gleich(lauf('SPIEL.wuerfe.length'), 1, 'nach der Leertaste fliegt eine Schokolade');
  pruefe(lauf('SPIEL.wuerfe[0].vx') > 0, 'sie fliegt nach rechts');
  gleich(lauf('SPIEL.wuerfe[0].vy'), 0, 'und nicht nach oben oder unten');

  // Mit Pfeiltaste zielen
  lauf('SPIEL.wuerfe = []; TASTEN.oben = true; wirfSchokolade(); TASTEN.oben = false');
  pruefe(lauf('SPIEL.wuerfe[0].vy') < 0, 'mit ↑ fliegt sie nach oben');
  lauf('SPIEL.wuerfe = []; TASTEN.unten = true; wirfSchokolade(); TASTEN.unten = false');
  pruefe(lauf('SPIEL.wuerfe[0].vy') > 0, 'mit ↓ fliegt sie nach unten');

  // Wurf verschwindet am Bildrand
  lauf('SPIEL.wuerfe = []; wirfSchokolade()');
  spieleZeit(k, 3);
  gleich(lauf('SPIEL.wuerfe.length'), 0, 'am Bildrand verschwindet der Wurf');

  // Treffer: Monster direkt vor die Nase setzen
  const punkteVorher = lauf('SPIEL.punkte');
  lauf(`
    SPIEL.daten.monster = [];
    const m = macheMonster(1);
    m.x = SPIEL.spieler.x + 60; m.y = SPIEL.spieler.y; m.vx = 0;
    SPIEL.daten.monster.push(m);
    wirfSchokolade();
  `);
  spieleZeit(k, 0.3);
  gleich(lauf('SPIEL.punkte'), punkteVorher + 10, 'ein Treffer gibt 10 Punkte');
  gleich(lauf('SPIEL.daten.monster.length'), 1, 'für das getroffene Monster kommt ein neues nach');
  pruefe(lauf('SPIEL.daten.monster[0].x') > lauf('BREITE'), 'das neue Monster startet außerhalb');
}

/* ============================================================
   TEST 4: Schokolade sammeln
   ============================================================ */
console.log('\n=== TEST: Schokolade sammeln ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel()');
  lauf('SPIEL.daten.monster = []');            // in Ruhe sammeln

  const vorher = lauf('SPIEL.punkte');
  lauf('SPIEL.daten.schokos = [{x: SPIEL.spieler.x, y: SPIEL.spieler.y, b: 50, h: 70}]');
  spieleZeit(k, 1 / 60);
  gleich(lauf('SPIEL.punkte'), vorher + 5, 'eine Schokolade gibt 5 Punkte');
  gleich(lauf('SPIEL.daten.schokos.length'), 1, 'es liegt gleich eine neue Schokolade bereit');
}

/* ============================================================
   TEST 5: Der Ablauf durch die Level
   ============================================================ */
console.log('\n=== TEST: Level 1 — Zeit überleben ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel()');
  lauf('SPIEL.daten.monster = []');

  spieleZeit(k, 20.5);
  gleich(lauf('SPIEL.status'), 'countdown', 'in Level 1 heißt Zeit-um: geschafft!');
  gleich(Math.ceil(lauf('SPIEL.countdownRest')), 5, 'der Countdown steht auf 5');

  spieleZeit(k, 5.2);
  gleich(lauf('SPIEL.status'), 'laeuft', 'danach geht es weiter');
  gleich(lauf('SPIEL.level'), 2, 'jetzt sind wir in Level 2');
  gleich(lauf('SPIEL.spieler.x'), 50, 'Nikolaus fängt wieder links an');
}

console.log('\n=== TEST: Level 2 — Turm und späte Monster ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel(); starteLevel(2)');

  gleich(lauf('SPIEL.daten.monster.length'), 0, 'anfangs ist es ruhig');
  spieleZeit(k, 4);
  gleich(lauf('SPIEL.daten.monster.length'), 0, 'nach 4 Sekunden noch immer ruhig');
  spieleZeit(k, 1.5);
  gleich(lauf('SPIEL.daten.monster.length'), 5, 'nach 5 Sekunden kommen 5 Monster');

  // Oben auf dem Turm = geschafft
  lauf('SPIEL.daten.monster = []');
  lauf('SPIEL.spieler.x = 700; SPIEL.spieler.y = HOEHE - 320');
  spieleZeit(k, 1 / 60);
  gleich(lauf('SPIEL.status'), 'countdown', 'oben rechts auf dem Turm ist Level 2 geschafft');
}

console.log('\n=== TEST: Level 2 — Zeit um heißt verloren ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel(); starteLevel(2)');
  lauf('SPIEL.daten.monster = []');
  lauf('SPIEL.monsterKommenNoch = 0');

  spieleZeit(k, 20.5);
  gleich(lauf('SPIEL.status'), 'verloren', 'ab Level 2 ist Zeit-um verloren');
  gleich(lauf('SPIEL.grund'), 'Die Zeit ist um!', 'und der Grund steht dran');
}

console.log('\n=== TEST: Level 3 — Wasser und Ziel ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel(); starteLevel(3)');
  lauf('SPIEL.daten.monster = []');

  // Ins Wasser
  lauf('SPIEL.spieler.x = SPIEL.daten.wasser[0].x; SPIEL.spieler.y = SPIELER_BODEN_Y');
  spieleZeit(k, 1 / 60);
  gleich(lauf('SPIEL.status'), 'verloren', 'ins Wasser fallen ist verloren');
  gleich(lauf('SPIEL.grund'), 'Platsch! Ins Wasser gefallen.', 'mit passendem Grund');
}
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel(); starteLevel(3)');
  lauf('SPIEL.daten.monster = []');

  // Auf die gelbe Zielplattform
  lauf('const z = SPIEL.daten.ziele[0]; SPIEL.spieler.x = z.x + 10; SPIEL.spieler.y = z.y - SPIELER_HOEHE');
  spieleZeit(k, 1 / 60);
  gleich(lauf('SPIEL.status'), 'countdown', 'die gelbe Plattform schafft Level 3');
}

console.log('\n=== TEST: Level 4 — 100 Punkte sammeln ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel(); starteLevel(4)');
  lauf('SPIEL.daten.monster = []');

  gleich(lauf('SPIEL.level4Punkte'), 0, 'Level 4 fängt bei 0 Sammelpunkten an');

  // 20-mal eine Schokolade direkt vor die Füße legen
  for (let i = 0; i < 20; i++) {
    lauf('SPIEL.daten.schokos = [{x: SPIEL.spieler.x, y: SPIEL.spieler.y, b: 50, h: 70}]');
    spieleZeit(k, 1 / 60);
    if (lauf('SPIEL.status') !== 'laeuft') break;
  }
  gleich(lauf('SPIEL.level4Punkte') >= 100, true, '100 Sammelpunkte sind erreicht');
  gleich(lauf('SPIEL.status'), 'countdown', 'damit ist Level 4 geschafft');
}

console.log('\n=== TEST: Level 5 — Turm klettern und gewinnen ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel(); starteLevel(5)');
  lauf('SPIEL.daten.monster = []');       // ohne Monster in Ruhe klettern

  gleich(lauf('SPIEL.level'), 5, 'wir sind in Level 5');

  // Klettern geht nur rechts am Turm
  lauf('SPIEL.spieler.x = 100; TASTEN.klettern = true');
  spieleZeit(k, 0.5);
  gleich(lauf('SPIEL.spieler.y'), lauf('SPIELER_BODEN_Y'),
         'links im Bild bringt Klettern nichts');

  // Jetzt an den Turm und hochklettern
  lauf('SPIEL.spieler.x = BREITE - 150');
  const hoeheVorher = lauf('SPIEL.spieler.y');
  spieleZeit(k, 1);
  pruefe(lauf('SPIEL.spieler.y') < hoeheVorher - 100, 'am Turm klettert Nikolaus nach oben');

  // Weiter klettern bis zum Ziel
  let bilder = 0;
  while (lauf('SPIEL.status') === 'laeuft' && bilder < 60 * 30) {
    lauf('rechne(1/60)');
    bilder++;
  }
  gleich(lauf('SPIEL.status'), 'gewonnen', 'oben auf der gelben Kiste ist das Spiel gewonnen');
  gleich(lauf('SPIEL.grund'), 'Du hast alle 5 Level geschafft!', 'mit Siegermeldung');
  lauf('TASTEN.klettern = false');
}

/* ============================================================
   TEST 6: Monster erwischt Nikolaus
   ============================================================ */
console.log('\n=== TEST: Monster erwischt Nikolaus ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel()');
  lauf(`
    SPIEL.daten.monster = [];
    const m = macheMonster(1);
    m.x = SPIEL.spieler.x; m.y = SPIEL.spieler.y; m.vx = 0;
    SPIEL.daten.monster.push(m);
  `);
  spieleZeit(k, 1 / 60);
  gleich(lauf('SPIEL.status'), 'verloren', 'Monsterberührung ist verloren');
  gleich(lauf('SPIEL.grund'), 'Ein Minion hat dich erwischt!', 'mit passendem Grund');
}

/* ============================================================
   TEST 7: Monster bewegen sich richtig
   ============================================================ */
console.log('\n=== TEST: Monster-Verhalten ===');
{
  const k = frischeWelt();
  const lauf = w(k);

  // Level 1: läuft links raus und kommt rechts neu
  lauf('const m1 = macheMonster(1); m1.x = -60; m1.vx = -120; bewegeMonster(m1, 1/60); globalThis.m1 = m1');
  pruefe(lauf('m1.x') > lauf('BREITE'), 'Level-1-Monster startet rechts neu, wenn es links rausläuft');

  // Level 2: läuft im Kreis
  lauf('const m2 = macheMonster(2); m2.x = -60; m2.vx = -120; bewegeMonster(m2, 1/60); globalThis.m2 = m2');
  gleich(lauf('m2.x'), lauf('BREITE'), 'Level-2-Monster taucht sofort am rechten Rand wieder auf');

  // Level 5: fällt und kommt oben neu
  lauf('const m5 = macheMonster(5); m5.y = HOEHE + 10; bewegeMonster(m5, 1/60); globalThis.m5 = m5');
  pruefe(lauf('m5.y') < 0, 'Level-5-Monster fängt oben wieder an, wenn es unten rausfällt');
}

/* ============================================================
   TEST 8: Große Zeitsprünge machen nichts kaputt
   ============================================================ */
console.log('\n=== TEST: Tab war lange im Hintergrund ===');
{
  const k = frischeWelt();
  const lauf = w(k);
  lauf('starteSpiel()');
  lauf('SPIEL.daten.monster = []');

  lauf('rechne(30)');    // 30 Sekunden auf einmal
  pruefe(lauf('SPIEL.zeitRest') > 19, 'ein riesiger Zeitsprung wird auf 50 ms gedeckelt');
  pruefe(lauf('SPIEL.spieler.y') <= lauf('SPIELER_BODEN_Y'),
         'Nikolaus fällt dabei nicht durch den Boden');
}

/* ============================================================
   TEST 9: Punkte landen im Profil
   ============================================================ */
console.log('\n=== TEST: Punkte werden gespeichert ===');
{
  const k = frischeWelt();
  const lauf = w(k);

  const emma = lauf('neuesProfil("Emma", "🦊", "1234")');
  lauf(`meldeAn("${emma.profil.id}", "1234")`);

  lauf('starteSpiel()');
  lauf('SPIEL.punkte = 250');
  lauf('verloren("Test")');

  gleich(lauf('holeBestwert("nikolaus")'), 250, 'der Bestwert steht im Profil');
  gleich(lauf('holeBestenliste("nikolaus")[0].name'), 'Emma', 'Emma steht in der Bestenliste');
  gleich(lauf('holeBestenliste("nikolaus")[0].punkte'), 250, 'mit 250 Punkten');
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
