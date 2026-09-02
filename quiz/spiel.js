/* ============================================================
   RETTET DIE ISS — der Spiel-Ablauf
   Phase 1: Raumanzug-Schatzsuche   Phase 2: ISS verteidigen
   ============================================================ */

/* ---------- Hier steht der ganze Spielstand drin ---------- */
const SPIEL = {
  stufe: 'mittel',
  anzahlSpieler: 1,
  amZug: 0,
  spieler: [],
  kette: [],
  anzugSchritt: 0
};

/* ---------- Die Module der ISS mit ihren Hinweisen ---------- */
const MODULE = [
  { id: 'schlaf',    emoji: '🛏️', name: 'Schlafkabine', hinweis: 'Geh dorthin, wo die Astronauten im Schlafsack an der Wand schlafen!' },
  { id: 'labor',     emoji: '🔬', name: 'Labor',         hinweis: 'Geh dorthin, wo man durch das Mikroskop schaut!' },
  { id: 'kueche',    emoji: '🍽️', name: 'Küche',         hinweis: 'Geh dorthin, wo das Essen aus der Tüte kommt!' },
  { id: 'cupola',    emoji: '🪟', name: 'Cupola',        hinweis: 'Geh dorthin, wo man durch das große Fenster auf die Erde schaut!' },
  { id: 'werkstatt', emoji: '🔧', name: 'Werkstatt',     hinweis: 'Geh dorthin, wo Schraubenschlüssel und Werkzeug liegen!' },
  { id: 'sport',     emoji: '🚴', name: 'Sportraum',     hinweis: 'Geh dorthin, wo die Astronauten auf dem Fahrrad trainieren!' }
];

/* ---------- Die 5 Teile vom Raumanzug ---------- */
const TEILE = [
  { emoji: '🧑‍🚀', name: 'Raumanzug' },
  { emoji: '🥾',   name: 'Stiefel' },
  { emoji: '🧤',   name: 'Handschuhe' },
  { emoji: '🧯',   name: 'Sauerstofftank' },
  { emoji: '🪖',   name: 'Helm' }
];

/* ============================================================
   KLEINE HELFER
   ============================================================ */

function $(id) { return document.getElementById(id); }

function zeigeBildschirm(id) {
  const alle = document.querySelectorAll('.bildschirm');
  for (const b of alle) b.classList.remove('aktiv');
  $(id).classList.add('aktiv');
}

function aktuellerSpieler() { return SPIEL.spieler[SPIEL.amZug]; }

function punkteGeben(punkte) {
  aktuellerSpieler().punkte += punkte;
  aktualisiereAnzeigen();
}

function aktualisiereAnzeigen() {
  const s = aktuellerSpieler();
  if (!s) return;
  $('anzugSpieler').textContent = s.name;
  $('anzugPunkte').textContent = s.punkte + ' Punkte';
  $('kampfSpieler').textContent = s.name;
  $('kampfPunkte').textContent = s.punkte + ' Punkte';
  $('kampfHerzen').textContent = '❤️'.repeat(s.herzen) + '🖤'.repeat(3 - s.herzen);
}

function setzeMeldung(id, text, art) {
  const el = $(id);
  el.textContent = text;
  el.className = 'meldung' + (art ? ' ' + art : '');
}

/* ---------- Kleine Töne, ganz ohne Sound-Dateien ---------- */
let tonMaschine = null;
function piep(frequenz, dauer, art) {
  try {
    if (!tonMaschine) tonMaschine = new (window.AudioContext || window.webkitAudioContext)();
    const o = tonMaschine.createOscillator();
    const g = tonMaschine.createGain();
    o.type = art || 'square';
    o.frequency.value = frequenz;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(tonMaschine.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, tonMaschine.currentTime + dauer);
    o.stop(tonMaschine.currentTime + dauer);
  } catch (e) { /* kein Ton? Nicht schlimm, das Spiel läuft trotzdem. */ }
}

function tonRichtig() { piep(660, 0.09); setTimeout(() => piep(990, 0.16), 90); }
function tonFalsch()  { piep(200, 0.25, 'sawtooth'); }

/* ============================================================
   DAS RÄTSEL-FENSTER (wird von beiden Phasen benutzt)
   ============================================================ */

let raetselAktiv = null;    // die Aufgabe, die gerade dran ist
let raetselFertig = null;   // was danach passieren soll
let raetselStart = 0;       // wann die Frage kam (für den Schnell-Bonus)

function frageStellen(fertig) {
  raetselAktiv = macheRaetsel(SPIEL.stufe);
  raetselFertig = fertig;
  raetselStart = performance.now();

  $('raetselFrage').textContent = raetselAktiv.frage;
  setzeMeldung('raetselMeldung', '');

  const kasten = $('raetselAuswahl');
  kasten.innerHTML = '';
  raetselAktiv.auswahl.forEach(function (wert, i) {
    const knopf = document.createElement('button');
    knopf.className = 'antwort';
    knopf.innerHTML = '<span class="nummer">' + (i + 1) + '</span>' + wert;
    knopf.onclick = function () { antwortGeben(i); };
    kasten.appendChild(knopf);
  });

  $('raetsel').classList.add('aktiv');
}

function antwortGeben(index) {
  if (!raetselAktiv) return;
  const aufgabe = raetselAktiv;
  raetselAktiv = null;   // sofort sperren, damit man nicht zweimal klickt

  const richtig = String(aufgabe.auswahl[index]) === String(aufgabe.antwort);
  const sekunden = (performance.now() - raetselStart) / 1000;

  const knoepfe = $('raetselAuswahl').querySelectorAll('.antwort');
  knoepfe.forEach(function (k, i) {
    k.disabled = true;
    if (String(aufgabe.auswahl[i]) === String(aufgabe.antwort)) k.classList.add('richtig');
    else if (i === index) k.classList.add('falsch');
  });

  let punkte = 0;
  if (richtig) {
    punkte = 10 + (sekunden < 5 ? 5 : 0);
    setzeMeldung('raetselMeldung', sekunden < 5 ? 'Richtig — und blitzschnell! +' + punkte : 'Richtig! +' + punkte, 'richtig');
    tonRichtig();
  } else {
    setzeMeldung('raetselMeldung', 'Die richtige Antwort war: ' + aufgabe.antwort, 'falsch');
    tonFalsch();
  }

  const weiter = raetselFertig;
  raetselFertig = null;
  setTimeout(function () {
    $('raetsel').classList.remove('aktiv');
    if (weiter) weiter(richtig, punkte);
  }, richtig ? 900 : 1700);
}

/* ============================================================
   PHASE 1 — RAUMANZUG-SCHATZSUCHE
   ============================================================ */

function starteAnzugPhase() {
  // 5 verschiedene Module zufällig aussuchen — für jedes Teil eines
  const module = mischen(MODULE.slice()).slice(0, TEILE.length);
  SPIEL.kette = TEILE.map(function (teil, i) {
    return { teil: teil, modul: module[i] };
  });
  SPIEL.anzugSchritt = 0;

  baueAnzugLeiste();
  baueIssKarte();
  $('anzugWeiter').classList.add('versteckt');
  setzeMeldung('anzugMeldung', '');
  zeigeHinweis();
  aktualisiereAnzeigen();
  zeigeBildschirm('anzug');
}

function baueAnzugLeiste() {
  const leiste = $('anzugLeiste');
  leiste.innerHTML = '';
  TEILE.forEach(function (teil, i) {
    const kasten = document.createElement('div');
    kasten.className = 'teil' + (i < SPIEL.anzugSchritt ? ' gefunden' : '');
    kasten.innerHTML = '<span class="emoji">' + teil.emoji + '</span>' + teil.name;
    leiste.appendChild(kasten);
  });
}

function baueIssKarte() {
  const karte = $('issKarte');
  karte.innerHTML = '';
  for (const modul of MODULE) {
    const knopf = document.createElement('button');
    knopf.className = 'modul';
    knopf.innerHTML = '<span class="emoji">' + modul.emoji + '</span>' + modul.name;
    knopf.onclick = function () { modulGeklickt(modul); };
    karte.appendChild(knopf);
  }
}

function zeigeHinweis() {
  const schritt = SPIEL.kette[SPIEL.anzugSchritt];
  $('anzugSuche').textContent = 'Du suchst: ' + schritt.teil.emoji + ' ' + schritt.teil.name +
    '  (' + (SPIEL.anzugSchritt + 1) + ' von ' + SPIEL.kette.length + ')';
  $('anzugHinweis').textContent = schritt.modul.hinweis;
}

function modulGeklickt(modul) {
  if (raetselAktiv) return;                       // gerade läuft schon eine Frage
  if (SPIEL.anzugSchritt >= SPIEL.kette.length) return;

  const schritt = SPIEL.kette[SPIEL.anzugSchritt];
  if (modul.id !== schritt.modul.id) {
    piep(180, 0.15, 'triangle');
    setzeMeldung('anzugMeldung', 'Hier ist nichts … lies den Hinweis nochmal! 🔎', 'falsch');
    return;
  }
  setzeMeldung('anzugMeldung', '');
  loeseAufgabeFuerTeil();
}

function loeseAufgabeFuerTeil() {
  frageStellen(function (richtig, punkte) {
    if (!richtig) {
      setzeMeldung('anzugMeldung', 'Nicht schlimm! Hier kommt eine neue Aufgabe. 💪', 'falsch');
      loeseAufgabeFuerTeil();     // gleiches Modul, neue Aufgabe — nie eine Sackgasse
      return;
    }
    const schritt = SPIEL.kette[SPIEL.anzugSchritt];
    punkteGeben(punkte + 20);
    SPIEL.anzugSchritt++;
    baueAnzugLeiste();

    if (SPIEL.anzugSchritt >= SPIEL.kette.length) {
      anzugFertig();
    } else {
      setzeMeldung('anzugMeldung', 'Super! ' + schritt.teil.emoji + ' ' + schritt.teil.name + ' gefunden! +' + (punkte + 20), 'richtig');
      zeigeHinweis();
    }
  });
}

function anzugFertig() {
  $('anzugSuche').textContent = 'Alle 5 Teile gefunden!';
  $('anzugHinweis').textContent = '🎉 Du bist fertig angezogen und startklar!';
  setzeMeldung('anzugMeldung', 'Achtung: Fremde Raumschiffe nähern sich der ISS!', 'falsch');
  $('anzugWeiter').classList.remove('versteckt');
  tonRichtig();
}

/* ============================================================
   PHASE 2 — DIE ISS VERTEIDIGEN (auf dem Canvas)
   ============================================================ */

const K = {
  breite: 900,
  hoehe: 540,
  ctx: null,
  schiff: { x: 450, y: 390, tempo: 6.5 },
  taste: { links: false, rechts: false },
  gegner: [], schuesse: [], funken: [], sterne: [],
  munition: 10,
  maxMunition: 16,
  welle: 1,
  wellenGesamt: 3,
  nochZuSpawnen: 0,
  spawnPause: 0,
  zeitSeitFrage: 0,
  beben: 0,
  laeuft: false,
  vorbei: true,
  letzteZeit: 0,
  animation: null
};

const ISS_LINIE = K.hoehe - 118;   // so tief dürfen Gegner kommen, dann tut es weh

function starteKampfPhase() {
  K.ctx = $('leinwand').getContext('2d');
  K.schiff.x = K.breite / 2;
  K.taste.links = false;
  K.taste.rechts = false;
  K.gegner = [];
  K.schuesse = [];
  K.funken = [];
  K.munition = 10;
  K.welle = 0;
  K.zeitSeitFrage = 0;
  K.beben = 0;
  K.vorbei = false;

  // Sternenhimmel für den Hintergrund
  K.sterne = [];
  for (let i = 0; i < 70; i++) {
    K.sterne.push({ x: zufall(0, K.breite), y: zufall(0, K.hoehe), r: zufall(1, 2), tempo: zufall(2, 8) / 20 });
  }

  naechsteWelle();
  aktualisiereAnzeigen();
  aktualisiereKampfAnzeige();
  zeigeBildschirm('kampf');

  K.laeuft = true;
  K.letzteZeit = performance.now();
  K.animation = requestAnimationFrame(schleife);
}

function naechsteWelle() {
  K.welle++;
  K.nochZuSpawnen = 4 + K.welle * 3;
  K.spawnPause = 40;
  aktualisiereKampfAnzeige();
}

function aktualisiereKampfAnzeige() {
  $('kampfWelle').textContent = 'Welle ' + K.welle + ' / ' + K.wellenGesamt;
  $('munitionZahl').textContent = K.munition;
  $('munitionBalken').style.width = Math.round(100 * K.munition / K.maxMunition) + '%';
}

/* ---------- Die Spiel-Schleife: rechnen und zeichnen ---------- */
function schleife(zeit) {
  const dt = Math.min((zeit - K.letzteZeit) / 16.667, 3);   // wie viele "Bilder" sind vergangen
  K.letzteZeit = zeit;
  if (K.laeuft) rechne(dt);
  zeichne();
  if (!K.vorbei) K.animation = requestAnimationFrame(schleife);
}

function rechne(dt) {
  const s = aktuellerSpieler();

  // Sterne scrollen
  for (const st of K.sterne) {
    st.y += st.tempo * dt;
    if (st.y > K.hoehe) { st.y = 0; st.x = zufall(0, K.breite); }
  }

  // Eigenes Schiff bewegen
  if (K.taste.links)  K.schiff.x -= K.schiff.tempo * dt;
  if (K.taste.rechts) K.schiff.x += K.schiff.tempo * dt;
  if (K.schiff.x < 30) K.schiff.x = 30;
  if (K.schiff.x > K.breite - 30) K.schiff.x = K.breite - 30;

  // Schüsse fliegen nach oben
  for (const sch of K.schuesse) sch.y -= 11 * dt;
  K.schuesse = K.schuesse.filter(sch => sch.y > -20);

  // Neue Gegner auftauchen lassen
  K.spawnPause -= dt;
  if (K.nochZuSpawnen > 0 && K.spawnPause <= 0) {
    K.gegner.push({
      x: zufall(50, K.breite - 50),
      y: -30,
      groesse: zufall(16, 24),
      tempo: 0.5 + K.welle * 0.32 + zufall(0, 10) / 22,
      pendel: zufall(0, 100) / 100,
      farbe: zufallsElement(['#ff5470', '#b06bff', '#ff9f43', '#4be1c0'])
    });
    K.nochZuSpawnen--;
    K.spawnPause = zufall(35, 70) - K.welle * 5;
  }

  // Gegner bewegen
  for (const g of K.gegner) {
    g.y += g.tempo * dt;
    g.pendel += 0.03 * dt;
    g.x += Math.sin(g.pendel) * 0.9 * dt;
  }

  // Treffer prüfen: Schuss gegen Gegner
  for (const sch of K.schuesse) {
    for (const g of K.gegner) {
      if (g.tot) continue;
      const dx = sch.x - g.x, dy = sch.y - g.y;
      if (dx * dx + dy * dy < (g.groesse + 6) * (g.groesse + 6)) {
        g.tot = true;
        sch.weg = true;
        explosion(g.x, g.y, g.farbe);
        punkteGeben(5);
        piep(520, 0.08, 'triangle');
        break;
      }
    }
  }
  K.schuesse = K.schuesse.filter(sch => !sch.weg);

  // Gegner, die die ISS erreichen, tun weh
  for (const g of K.gegner) {
    if (!g.tot && g.y > ISS_LINIE) {
      g.tot = true;
      explosion(g.x, g.y, '#ffffff');
      herzVerlieren();
    }
  }
  K.gegner = K.gegner.filter(g => !g.tot);

  // Funken (Explosions-Teilchen)
  for (const f of K.funken) {
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vy += 0.08 * dt;
    f.leben -= dt;
  }
  K.funken = K.funken.filter(f => f.leben > 0);

  if (K.vorbei) return;

  // Zeit bis zum nächsten Nachschub-Rätsel
  K.zeitSeitFrage += dt / 60;
  if (K.munition <= 0 || K.zeitSeitFrage > 16) {
    nachschubRaetsel();
    return;
  }

  // Welle geschafft?
  if (K.nochZuSpawnen === 0 && K.gegner.length === 0) {
    if (K.welle >= K.wellenGesamt) rundeVorbei(true);
    else naechsteWelle();
  }
}

function explosion(x, y, farbe) {
  for (let i = 0; i < 16; i++) {
    K.funken.push({
      x: x, y: y,
      vx: zufall(-30, 30) / 10,
      vy: zufall(-30, 30) / 10,
      leben: zufall(15, 40),
      farbe: i % 3 === 0 ? '#ffffff' : farbe
    });
  }
}

function schiessen() {
  if (!K.laeuft || K.vorbei) return;
  if (K.munition <= 0) { piep(120, 0.12, 'sawtooth'); return; }
  K.munition--;
  K.schuesse.push({ x: K.schiff.x, y: K.schiff.y - 24 });
  piep(880, 0.05);
  aktualisiereKampfAnzeige();
}

function herzVerlieren() {
  const s = aktuellerSpieler();
  s.herzen--;
  K.beben = 14;
  piep(90, 0.45, 'sawtooth');
  aktualisiereAnzeigen();
  if (s.herzen <= 0) rundeVorbei(false);
}

function nachschubRaetsel() {
  K.laeuft = false;
  K.zeitSeitFrage = 0;
  frageStellen(function (richtig, punkte) {
    K.munition = Math.min(K.maxMunition, K.munition + (richtig ? 8 : 3));
    if (richtig) punkteGeben(punkte);
    aktualisiereKampfAnzeige();
    if (K.vorbei) return;
    K.letzteZeit = performance.now();
    K.laeuft = true;
  });
}

/* ============================================================
   ZEICHNEN
   ============================================================ */

function rundesRechteck(c, x, y, b, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + b, y, x + b, y + h, r);
  c.arcTo(x + b, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + b, y, r);
  c.closePath();
}

function zeichne() {
  const c = K.ctx;
  if (!c) return;
  c.save();
  if (K.beben > 0) {
    c.translate(zufall(-K.beben, K.beben) / 2, zufall(-K.beben, K.beben) / 2);
    K.beben -= 0.8;
  }

  // Hintergrund
  const g = c.createLinearGradient(0, 0, 0, K.hoehe);
  g.addColorStop(0, '#05081f');
  g.addColorStop(1, '#161f56');
  c.fillStyle = g;
  c.fillRect(-30, -30, K.breite + 60, K.hoehe + 60);

  // Sterne
  c.fillStyle = '#ffffff';
  for (const st of K.sterne) {
    c.globalAlpha = 0.4 + st.tempo;
    c.fillRect(st.x, st.y, st.r, st.r);
  }
  c.globalAlpha = 1;

  zeichneErde(c);
  zeichneISS(c);

  // Schüsse
  for (const sch of K.schuesse) {
    c.fillStyle = '#9fe8ff';
    c.shadowColor = '#4fd0ff';
    c.shadowBlur = 12;
    rundesRechteck(c, sch.x - 3, sch.y - 12, 6, 20, 3);
    c.fill();
    c.shadowBlur = 0;
  }

  for (const geg of K.gegner) zeichneGegner(c, geg);
  zeichneSchiff(c);

  // Funken
  for (const f of K.funken) {
    c.globalAlpha = Math.max(0, f.leben / 40);
    c.fillStyle = f.farbe;
    c.fillRect(f.x - 2, f.y - 2, 4, 4);
  }
  c.globalAlpha = 1;

  // Pause-Hinweis, während das Rätsel offen ist
  if (!K.laeuft && !K.vorbei) {
    c.fillStyle = 'rgba(5, 8, 30, 0.55)';
    c.fillRect(0, 0, K.breite, K.hoehe);
  }

  c.restore();
}

function zeichneErde(c) {
  c.save();
  c.beginPath();
  c.arc(K.breite / 2, K.hoehe + 300, 420, 0, Math.PI * 2);
  const g = c.createLinearGradient(0, K.hoehe - 130, 0, K.hoehe);
  g.addColorStop(0, '#1f6fd0');
  g.addColorStop(1, '#0c3f86');
  c.fillStyle = g;
  c.fill();
  c.restore();
}

function zeichneISS(c) {
  const y = K.hoehe - 62;

  // Träger (die lange Stange)
  c.strokeStyle = '#a9b8dd';
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(45, y);
  c.lineTo(K.breite - 45, y);
  c.stroke();

  // Solarpanels
  const panels = [[60, y - 48], [60, y + 12], [K.breite - 200, y - 48], [K.breite - 200, y + 12]];
  for (const p of panels) {
    c.fillStyle = '#26379a';
    c.fillRect(p[0], p[1], 140, 36);
    c.strokeStyle = 'rgba(150, 190, 255, 0.55)';
    c.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      c.beginPath();
      c.moveTo(p[0] + i * 28, p[1]);
      c.lineTo(p[0] + i * 28, p[1] + 36);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(p[0], p[1] + 18);
    c.lineTo(p[0] + 140, p[1] + 18);
    c.stroke();
  }

  // Hauptmodul
  c.fillStyle = '#e2e9fd';
  rundesRechteck(c, K.breite / 2 - 115, y - 21, 230, 42, 21);
  c.fill();
  c.fillStyle = '#39b6ff';
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.arc(K.breite / 2 - 69 + i * 46, y, 8, 0, Math.PI * 2);
    c.fill();
  }
}

function zeichneSchiff(c) {
  const s = K.schiff;
  c.save();
  c.translate(s.x, s.y);

  // Antriebs-Flamme
  c.fillStyle = 'rgba(255, 170, 50, 0.9)';
  c.beginPath();
  c.moveTo(-7, 16);
  c.lineTo(0, 16 + zufall(9, 22));
  c.lineTo(7, 16);
  c.closePath();
  c.fill();

  // Flügel
  c.fillStyle = '#3aa0ff';
  c.beginPath(); c.moveTo(-15, 16); c.lineTo(-26, 26); c.lineTo(-9, 6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(15, 16);  c.lineTo(26, 26);  c.lineTo(9, 6);  c.closePath(); c.fill();

  // Rumpf
  c.fillStyle = '#eef3ff';
  c.beginPath();
  c.moveTo(0, -24);
  c.lineTo(15, 16);
  c.lineTo(-15, 16);
  c.closePath();
  c.fill();

  // Fenster
  c.fillStyle = '#1b3a8f';
  c.beginPath(); c.arc(0, -3, 5.5, 0, Math.PI * 2); c.fill();
  c.restore();
}

function zeichneGegner(c, g) {
  c.save();
  c.translate(g.x, g.y);

  // Rumpf
  c.fillStyle = g.farbe;
  c.beginPath(); c.ellipse(0, 0, g.groesse, g.groesse * 0.45, 0, 0, Math.PI * 2); c.fill();

  // Glaskuppel
  c.fillStyle = 'rgba(190, 240, 255, 0.85)';
  c.beginPath(); c.ellipse(0, -g.groesse * 0.22, g.groesse * 0.5, g.groesse * 0.45, 0, Math.PI, 0); c.fill();

  // Lichter unten
  c.fillStyle = '#fff59a';
  for (let i = -1; i <= 1; i++) {
    c.beginPath(); c.arc(i * g.groesse * 0.55, g.groesse * 0.2, 2.6, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/* ============================================================
   RUNDE ZU ENDE / SPIELERWECHSEL / ERGEBNIS
   ============================================================ */

function rundeVorbei(gewonnen) {
  if (K.vorbei) return;
  K.vorbei = true;
  K.laeuft = false;
  cancelAnimationFrame(K.animation);

  const s = aktuellerSpieler();
  s.gerettet = gewonnen;
  if (gewonnen) punkteGeben(s.herzen * 20);

  const nochEinSpieler = SPIEL.amZug + 1 < SPIEL.anzahlSpieler;

  $('uebergangTitel').textContent = gewonnen ? '🏆 Die ISS ist gerettet!' : '💥 Die ISS wurde getroffen!';
  $('uebergangText').innerHTML = (gewonnen
      ? 'Stark gemacht, ' + s.name + '! Alle ' + K.wellenGesamt + ' Wellen abgewehrt.<br>'
      : 'Die ISS hat keine Herzen mehr, ' + s.name + '. Beim nächsten Mal klappt es!<br>')
    + '<b>' + s.punkte + ' Punkte</b>';

  const knopf = $('uebergangKnopf');
  if (nochEinSpieler) {
    knopf.textContent = 'Weiter — ' + SPIEL.spieler[SPIEL.amZug + 1].name + ' ist dran! 👉';
    knopf.onclick = naechsterSpieler;
  } else {
    knopf.textContent = 'Ergebnis ansehen 🏅';
    knopf.onclick = zeigeErgebnis;
  }

  setTimeout(function () { zeigeBildschirm('uebergang'); }, 700);
}

function naechsterSpieler() {
  SPIEL.amZug++;
  starteAnzugPhase();
}

function zeigeErgebnis() {
  const liste = $('ergebnisListe');
  liste.innerHTML = '';
  const beste = Math.max.apply(null, SPIEL.spieler.map(s => s.punkte));

  for (const s of SPIEL.spieler) {
    const zeile = document.createElement('div');
    zeile.className = 'ergebniszeile' + (s.punkte === beste ? ' sieger' : '');
    zeile.innerHTML = '<span>' + (s.gerettet ? '🏆' : '🧑‍🚀') + ' ' + s.name + '</span>' +
                      '<span><b>' + s.punkte + '</b> Punkte</span>';
    liste.appendChild(zeile);
  }

  if (SPIEL.anzahlSpieler === 2) {
    const sieger = SPIEL.spieler.filter(s => s.punkte === beste);
    $('ergebnisSieger').textContent = sieger.length > 1
      ? '🤝 Unentschieden — ihr seid beide super!'
      : '🎉 ' + sieger[0].name + ' gewinnt!';
  } else {
    const s = SPIEL.spieler[0];
    $('ergebnisSieger').textContent = s.gerettet
      ? '🎉 Mission erfüllt — die ISS fliegt weiter!'
      : 'Nächster Versuch? Die ISS braucht dich!';
  }

  merkeBestenliste();
  zeichneBestenliste();
  zeigeBildschirm('ergebnis');
}

/* ---------- Bestenliste im Browser speichern ---------- */
const BESTEN_SCHLUESSEL = 'weltraum-quiz-bestenliste';

function ladeBestenliste() {
  try {
    return JSON.parse(localStorage.getItem(BESTEN_SCHLUESSEL)) || [];
  } catch (e) { return []; }
}

function merkeBestenliste() {
  try {
    const liste = ladeBestenliste();
    for (const s of SPIEL.spieler) liste.push({ name: s.name, punkte: s.punkte, stufe: SPIEL.stufe });
    liste.sort((a, b) => b.punkte - a.punkte);
    localStorage.setItem(BESTEN_SCHLUESSEL, JSON.stringify(liste.slice(0, 5)));
  } catch (e) { /* Speichern verboten? Egal, das Spiel läuft trotzdem. */ }
}

function zeichneBestenliste() {
  const liste = ladeBestenliste();
  const ol = $('bestenliste');
  ol.innerHTML = '';
  if (liste.length === 0) {
    ol.innerHTML = '<li class="leer">Noch keine Punkte — sei die oder der Erste!</li>';
    return;
  }
  const medaillen = ['🥇', '🥈', '🥉', '4.', '5.'];
  liste.forEach(function (e, i) {
    const li = document.createElement('li');
    li.innerHTML = '<span>' + medaillen[i] + ' ' + e.name + '</span><span><b>' + e.punkte + '</b> (' + e.stufe + ')</span>';
    ol.appendChild(li);
  });
}

/* ============================================================
   TASTATUR
   ============================================================ */

document.addEventListener('keydown', function (e) {
  if (e.target && e.target.tagName === 'INPUT') return;   // beim Namen tippen nichts stören

  // Rätsel offen? Dann Antwort mit 1 2 3 4 auswählen
  if (raetselAktiv) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= raetselAktiv.auswahl.length) {
      e.preventDefault();
      antwortGeben(n - 1);
    }
    return;
  }

  // Die Steuertasten gelten nur im Kampf-Bildschirm
  if (!$('kampf').classList.contains('aktiv')) return;

  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') K.taste.links = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') K.taste.rechts = true;
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) schiessen();
  }
});

document.addEventListener('keyup', function (e) {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') K.taste.links = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') K.taste.rechts = false;
});

/* ============================================================
   START
   ============================================================ */

function wahlreiheEinrichten(id, beiWahl) {
  const knoepfe = $(id).querySelectorAll('.wahl');
  knoepfe.forEach(function (knopf) {
    knopf.onclick = function () {
      knoepfe.forEach(k => k.classList.remove('aktiv'));
      knopf.classList.add('aktiv');
      piep(700, 0.05);
      beiWahl(knopf.dataset.wert);
    };
  });
}

function spielStarten() {
  const name1 = $('name1').value.trim() || 'Astronaut 1';
  const name2 = $('name2').value.trim() || 'Astronaut 2';

  SPIEL.spieler = [{ name: name1, punkte: 0, herzen: 3, gerettet: false }];
  if (SPIEL.anzahlSpieler === 2) {
    SPIEL.spieler.push({ name: name2, punkte: 0, herzen: 3, gerettet: false });
  }
  SPIEL.amZug = 0;
  starteAnzugPhase();
}

function zurueckZumStart() {
  K.vorbei = true;
  K.laeuft = false;
  cancelAnimationFrame(K.animation);
  zeichneBestenliste();
  zeigeBildschirm('start');
}

document.addEventListener('DOMContentLoaded', function () {
  wahlreiheEinrichten('wahlSpieler', function (wert) {
    SPIEL.anzahlSpieler = parseInt(wert, 10);
    $('name2').classList.toggle('versteckt', SPIEL.anzahlSpieler === 1);
  });
  wahlreiheEinrichten('wahlStufe', function (wert) { SPIEL.stufe = wert; });

  $('knopfStart').onclick = spielStarten;
  $('anzugWeiter').onclick = starteKampfPhase;
  $('knopfNochmal').onclick = zurueckZumStart;

  zeichneBestenliste();
});
