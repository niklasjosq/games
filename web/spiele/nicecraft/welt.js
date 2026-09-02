/* ============================================================
   NICECRAFT — eine 3D-Welt zum Herumlaufen und Bauen.

   Das ist die Browser-Fassung der alten nicecraft.py (ursina).
   Die lief nur auf dem Rechner mit Bildschirm; diese hier läuft
   überall, auch auf dem Tablet-Laptop im Kinderzimmer.

   Gebaut mit three.js (liegt in lib/, damit kein Internet
   gebraucht wird).
   ============================================================ */

import * as THREE from './lib/three.module.min.js';
import { PointerLockControls } from './lib/PointerLockControls.js';

/* ---------- Wie sich alles anfühlt ---------- */
const TEMPO = 7;              // Laufgeschwindigkeit
const SPRUNG = 6.5;           // wie kräftig gesprungen wird
const SCHWERKRAFT = 18;
const AUGENHOEHE = 1.7;       // wie groß der Spieler ist
const WELT_GROESSE = 100;     // halbe Kantenlänge des Bodens
const REICHWEITE = 8;         // wie weit man Klötze setzen kann

/* ---------- Die Klotz-Sorten ---------- */
const KLOTZ_ARTEN = [
  { name: 'Gras',   farbe: 0x5aa832 },
  { name: 'Erde',   farbe: 0x8b5a2b },
  { name: 'Stein',  farbe: 0x8a8a8a },
  { name: 'Holz',   farbe: 0xb5813f },
  { name: 'Sand',   farbe: 0xe0cf87 },
  { name: 'Ziegel', farbe: 0xb44a3a },
  { name: 'Eis',    farbe: 0x8fd4e8 },
  { name: 'Gold',   farbe: 0xf0c419 }
];

let gewaehlteArt = 0;

/* ============================================================
   KANN DIESES GERÄT ÜBERHAUPT 3D?

   Manche alten Tablets können kein "WebGL". Dann soll da nicht
   einfach ein schwarzer Bildschirm sein, sondern eine Erklärung.
   ============================================================ */

function kann3D() {
  try {
    const probe = document.createElement('canvas');
    return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

if (!kann3D()) {
  document.getElementById('welt').innerHTML =
    '<div class="kein3d">' +
    '<h1 class="titel">😕 Kein 3D möglich</h1>' +
    '<p class="fliesstext">Dieses Gerät kann leider keine 3D-Bilder anzeigen ' +
    '(dafür braucht der Browser „WebGL“).</p>' +
    '<p class="fliesstext">Probiere es an einem anderen Gerät — die anderen ' +
    'Spiele und die Mathe-Aufgaben gehen hier aber trotzdem!</p>' +
    '<a class="zurueck" href="../../index.html">← Zurück zur Übersicht</a>' +
    '</div>';
  document.getElementById('start').classList.add('versteckt');
  document.getElementById('kreuz').classList.add('versteckt');
  document.getElementById('anzeige').classList.add('versteckt');
  throw new Error('Kein WebGL — NiceCraft wird nicht gestartet.');
}

/* ============================================================
   SZENE AUFBAUEN
   ============================================================ */

const szene = new THREE.Scene();
szene.background = new THREE.Color(0x7dbaeb);
szene.fog = new THREE.Fog(0x7dbaeb, 40, 130);

const kamera = new THREE.PerspectiveCamera(
  70, window.innerWidth / window.innerHeight, 0.1, 400
);
kamera.position.set(0, AUGENHOEHE, 12);

const maler = new THREE.WebGLRenderer({ antialias: true });
maler.setPixelRatio(Math.min(window.devicePixelRatio, 2));
maler.setSize(window.innerWidth, window.innerHeight);
document.getElementById('welt').appendChild(maler.domElement);

/* ---------- Licht ---------- */
szene.add(new THREE.HemisphereLight(0xbfe3ff, 0x4a6b3a, 1.1));
const sonne = new THREE.DirectionalLight(0xffffff, 1.4);
sonne.position.set(30, 60, 20);
szene.add(sonne);

/* ---------- Der Boden ----------
   Das Karomuster malen wir selbst — dann brauchen wir keine Bilddatei. */
function macheKaroBild() {
  const gross = 64;
  const leinwand = document.createElement('canvas');
  leinwand.width = gross;
  leinwand.height = gross;
  const stift = leinwand.getContext('2d');

  stift.fillStyle = '#5aa832';
  stift.fillRect(0, 0, gross, gross);
  stift.fillStyle = '#4e9a2b';
  stift.fillRect(0, 0, gross / 2, gross / 2);
  stift.fillRect(gross / 2, gross / 2, gross / 2, gross / 2);

  const bild = new THREE.CanvasTexture(leinwand);
  bild.wrapS = THREE.RepeatWrapping;
  bild.wrapT = THREE.RepeatWrapping;
  bild.repeat.set(WELT_GROESSE, WELT_GROESSE);
  bild.magFilter = THREE.NearestFilter;
  return bild;
}

const boden = new THREE.Mesh(
  new THREE.PlaneGeometry(WELT_GROESSE * 2, WELT_GROESSE * 2),
  new THREE.MeshLambertMaterial({ map: macheKaroBild() })
);
boden.rotation.x = -Math.PI / 2;
szene.add(boden);

/* ============================================================
   DIE KLÖTZE

   Jeder Klotz merkt sich seinen Platz als "x,y,z". So finden wir
   schnell, ob dort schon einer steht.
   ============================================================ */

const KLOTZ_FORM = new THREE.BoxGeometry(1, 1, 1);
const KLOTZ_STOFFE = KLOTZ_ARTEN.map(function (a) {
  return new THREE.MeshLambertMaterial({ color: a.farbe });
});

const kloetze = new Map();       // "x,y,z" -> Mesh
const kloetzeListe = [];         // dieselben Klötze zum Anklicken

function schluessel(x, y, z) { return x + ',' + y + ',' + z; }

function setzeKlotz(x, y, z, art) {
  const s = schluessel(x, y, z);
  if (kloetze.has(s)) return null;
  if (y < 0) return null;

  const klotz = new THREE.Mesh(KLOTZ_FORM, KLOTZ_STOFFE[art]);
  klotz.position.set(x + 0.5, y + 0.5, z + 0.5);
  klotz.userData.gitter = { x: x, y: y, z: z };
  szene.add(klotz);
  kloetze.set(s, klotz);
  kloetzeListe.push(klotz);
  return klotz;
}

function entferneKlotz(klotz) {
  const g = klotz.userData.gitter;
  kloetze.delete(schluessel(g.x, g.y, g.z));
  const stelle = kloetzeListe.indexOf(klotz);
  if (stelle !== -1) kloetzeListe.splice(stelle, 1);
  szene.remove(klotz);
}

/* ---------- Ein paar Klötze zum Anfangen ---------- */
function baueStartwelt() {
  // Eine kleine Mauer
  for (let x = -6; x <= 6; x++) {
    for (let y = 0; y < 2; y++) setzeKlotz(x, y, -8, y === 1 ? 5 : 2);
  }
  // Eine Treppe
  for (let i = 0; i < 5; i++) {
    for (let y = 0; y <= i; y++) setzeKlotz(8 + i, y, 0, 2);
  }
  // Ein Sandhügel
  for (let x = -12; x <= -8; x++) {
    for (let z = 4; z <= 8; z++) {
      const hoehe = 1 + Math.floor(Math.random() * 2);
      for (let y = 0; y < hoehe; y++) setzeKlotz(x, y, z, 4);
    }
  }
  // Ein Baumstamm mit Krone
  for (let y = 0; y < 4; y++) setzeKlotz(4, y, 6, 3);
  for (let x = 3; x <= 5; x++) {
    for (let z = 5; z <= 7; z++) setzeKlotz(x, 4, z, 0);
  }
}
baueStartwelt();

/* ============================================================
   STEUERUNG (Maus fangen, WASD, Springen)
   ============================================================ */

const steuerung = new PointerLockControls(kamera, maler.domElement);
szene.add(kamera);

const TASTEN = { vor: false, zurueck: false, links: false, rechts: false };
let vy = 0;
let amBoden = true;

const startKasten = document.getElementById('start');

startKasten.addEventListener('click', function (e) {
  // Auf den "Zurück"-Link geklickt? Dann die Maus nicht fangen.
  if (e.target.closest('a')) return;
  steuerung.lock();
});
steuerung.addEventListener('lock', function () { startKasten.classList.add('versteckt'); });
steuerung.addEventListener('unlock', function () { startKasten.classList.remove('versteckt'); });

document.addEventListener('keydown', function (e) {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    TASTEN.vor = true; break;
    case 'KeyS': case 'ArrowDown':  TASTEN.zurueck = true; break;
    case 'KeyA': case 'ArrowLeft':  TASTEN.links = true; break;
    case 'KeyD': case 'ArrowRight': TASTEN.rechts = true; break;
    case 'Space':
      if (amBoden) { vy = SPRUNG; amBoden = false; }
      e.preventDefault();
      break;
  }
  // Mit den Zifferntasten die Klotz-Sorte wechseln
  if (/^Digit[1-8]$/.test(e.code)) waehleArt(Number(e.code.slice(5)) - 1);
});

document.addEventListener('keyup', function (e) {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    TASTEN.vor = false; break;
    case 'KeyS': case 'ArrowDown':  TASTEN.zurueck = false; break;
    case 'KeyA': case 'ArrowLeft':  TASTEN.links = false; break;
    case 'KeyD': case 'ArrowRight': TASTEN.rechts = false; break;
  }
});

/* ============================================================
   BAUEN UND ABBAUEN

   Linke Maustaste: Klotz weg.  Rechte Maustaste: Klotz hin.
   ============================================================ */

const strahl = new THREE.Raycaster();
strahl.far = REICHWEITE;
const mitte = new THREE.Vector2(0, 0);

maler.domElement.addEventListener('mousedown', function (e) {
  if (!steuerung.isLocked) return;
  e.preventDefault();

  strahl.setFromCamera(mitte, kamera);
  const treffer = strahl.intersectObjects(kloetzeListe.concat([boden]));
  if (treffer.length === 0) return;

  const erster = treffer[0];

  if (e.button === 0) {
    // Abbauen (der Boden bleibt, den kann man nicht wegnehmen)
    if (erster.object !== boden) entferneKlotz(erster.object);
    return;
  }

  if (e.button === 2) {
    // Anbauen: einen Klotz neben die getroffene Fläche setzen
    const punkt = erster.point.clone().add(erster.face.normal.clone().multiplyScalar(0.5));
    const x = Math.floor(punkt.x);
    const y = Math.floor(punkt.y);
    const z = Math.floor(punkt.z);

    // Nicht in sich selbst hineinbauen
    const kopf = kamera.position;
    const imWeg = Math.floor(kopf.x) === x && Math.floor(kopf.z) === z &&
                  (Math.floor(kopf.y) === y || Math.floor(kopf.y - AUGENHOEHE + 0.1) === y);
    if (imWeg) return;

    setzeKlotz(x, y, z, gewaehlteArt);
  }
});

// Ohne das käme beim Rechtsklick das Browser-Menü
maler.domElement.addEventListener('contextmenu', function (e) { e.preventDefault(); });

/* ============================================================
   DIE KLOTZ-AUSWAHL UNTEN AM BILDSCHIRM
   ============================================================ */

function baueAuswahlleiste() {
  const leiste = document.getElementById('auswahl');
  leiste.innerHTML = '';

  KLOTZ_ARTEN.forEach(function (art, i) {
    const knopf = document.createElement('button');
    knopf.className = 'klotzknopf' + (i === gewaehlteArt ? ' aktiv' : '');
    knopf.innerHTML = '<span class="klotzfarbe" style="background:#' +
                      art.farbe.toString(16).padStart(6, '0') + '"></span>' +
                      '<small>' + (i + 1) + ' ' + art.name + '</small>';
    knopf.onclick = function () { waehleArt(i); };
    leiste.appendChild(knopf);
  });
}

function waehleArt(i) {
  if (i < 0 || i >= KLOTZ_ARTEN.length) return;
  gewaehlteArt = i;
  baueAuswahlleiste();
}
baueAuswahlleiste();

/* ============================================================
   LAUFEN UND FALLEN

   Ganz einfache Physik: Wir schauen nur, ob unter unseren Füßen
   ein Klotz steht — dann stehen wir darauf.
   ============================================================ */

function bodenhoeheBei(x, z) {
  const gx = Math.floor(x);
  const gz = Math.floor(z);
  let hoechste = 0;
  for (let y = 0; y < 24; y++) {
    if (kloetze.has(schluessel(gx, y, gz))) hoechste = y + 1;
  }
  return hoechste;
}

function bewege(dt) {
  const pos = kamera.position;

  // Vorwärts und seitwärts (PointerLockControls rechnet die Blickrichtung mit)
  const vor = (TASTEN.vor ? 1 : 0) - (TASTEN.zurueck ? 1 : 0);
  const seite = (TASTEN.rechts ? 1 : 0) - (TASTEN.links ? 1 : 0);

  if (vor !== 0 || seite !== 0) {
    // Damit man diagonal nicht schneller ist
    const laenge = Math.hypot(vor, seite);
    const altY = pos.y;
    steuerung.moveForward((vor / laenge) * TEMPO * dt);
    steuerung.moveRight((seite / laenge) * TEMPO * dt);
    pos.y = altY;

    // Am Weltrand ist Schluss
    const grenze = WELT_GROESSE - 1;
    pos.x = Math.max(-grenze, Math.min(grenze, pos.x));
    pos.z = Math.max(-grenze, Math.min(grenze, pos.z));
  }

  // Hoch und runter
  vy -= SCHWERKRAFT * dt;
  pos.y += vy * dt;

  const fussboden = bodenhoeheBei(pos.x, pos.z) + AUGENHOEHE;
  if (pos.y <= fussboden) {
    pos.y = fussboden;
    vy = 0;
    amBoden = true;
  }
}

/* ============================================================
   DIE SCHLEIFE
   ============================================================ */

const uhr = new THREE.Clock();
const anzeige = document.getElementById('anzeige');

function schleife() {
  const dt = Math.min(uhr.getDelta(), 0.05);
  if (steuerung.isLocked) bewege(dt);

  maler.render(szene, kamera);

  anzeige.textContent = 'Klötze: ' + kloetze.size + '  ·  ausgewählt: ' +
                        KLOTZ_ARTEN[gewaehlteArt].name;
  requestAnimationFrame(schleife);
}
schleife();

/* ---------- Fenstergröße geändert ---------- */
window.addEventListener('resize', function () {
  kamera.aspect = window.innerWidth / window.innerHeight;
  kamera.updateProjectionMatrix();
  maler.setSize(window.innerWidth, window.innerHeight);
});
