/* ============================================================
   NIKOLAUS — die Seite drumherum.
   Landing-Page, Anzeige oben (HUD), Tasten, Pause, Bestenliste.
   Der Spielablauf selbst steht in spiel.js.
   ============================================================ */

function $(id) { return document.getElementById(id); }

function zeigeBildschirm(id) {
  for (const b of document.querySelectorAll('.bildschirm')) b.classList.remove('aktiv');
  $(id).classList.add('aktiv');
}

/* Ist gerade Pause? */
let pausiert = false;

/* ============================================================
   ANZEIGE OBEN
   ============================================================ */

function aktualisiereHud() {
  $('hudPunkte').textContent = SPIEL.punkte;
  $('hudLevel').textContent  = SPIEL.level;
  $('hudZeit').textContent   = Math.ceil(SPIEL.zeitRest);

  const zielAnzeige = $('hudZiel');
  if (SPIEL.level === 4) {
    zielAnzeige.classList.remove('versteckt');
    $('hudZielWert').textContent = SPIEL.level4Punkte;
  } else {
    zielAnzeige.classList.add('versteckt');
  }
}

/* ============================================================
   LANDING-PAGE
   ============================================================ */

function zeichneLandingPage() {
  const profil = aktivesProfil();

  if (profil) {
    const best = holeBestwert('nikolaus');
    $('deinBestwert').textContent = best > 0 ? best + ' Punkte' : 'noch nichts';
    $('werSpielt').textContent = 'Angemeldet als ' + profil.avatar + ' ' + profil.name +
                                 ' — deine Punkte werden gespeichert.';
  } else {
    $('deinBestwert').textContent = '–';
    $('werSpielt').innerHTML = 'Als Gast unterwegs — Punkte werden nicht gespeichert. ' +
                               '<a href="../../index.html">Profil auswählen</a>';
  }

  zeichneBestenliste('bestenliste');
}

function zeichneBestenliste(id) {
  const liste = holeBestenliste('nikolaus');
  const ol = $(id);
  ol.innerHTML = '';

  if (liste.length === 0) {
    ol.innerHTML = '<li class="leer">Noch keine Punkte — sei die oder der Erste!</li>';
    return;
  }

  const medaillen = ['🥇', '🥈', '🥉', '4.', '5.'];
  liste.forEach(function (e, i) {
    const li = document.createElement('li');
    li.innerHTML = '<span>' + medaillen[i] + ' ' + (e.avatar || '') + ' ' + e.name + '</span>' +
                   '<span><b>' + e.punkte + '</b></span>';
    ol.appendChild(li);
  });
}

/* ============================================================
   ENDBILDSCHIRM
   ============================================================ */

function zeigeEndbildschirm() {
  const gewonnenJa = SPIEL.status === 'gewonnen';

  $('endeTitel').textContent  = gewonnenJa ? '🏆 Gewonnen!' : '💀 Game Over';
  $('endeTitel').className    = 'titel ' + (gewonnenJa ? 'gruen' : 'rot');
  $('endeGrund').textContent  = SPIEL.grund;
  $('endePunkte').textContent = SPIEL.punkte + ' Punkte';

  const profil = aktivesProfil();
  if (profil) {
    const best = holeBestwert('nikolaus');
    $('endeZusatz').textContent = SPIEL.punkte >= best && SPIEL.punkte > 0
      ? '🎉 Neuer Bestwert für ' + profil.name + '!'
      : 'Dein Bestwert: ' + best + ' Punkte (Level ' + SPIEL.level + ' erreicht)';
  } else {
    $('endeZusatz').textContent = 'Level ' + SPIEL.level + ' erreicht. ' +
                                  'Melde dich an, damit deine Punkte gespeichert werden.';
  }

  zeichneBestenliste('endeBestenliste');
  zeigeBildschirm('ende');
}

/* ============================================================
   PAUSE
   ============================================================ */

function setzePause(an) {
  if (SPIEL.status !== 'laeuft' && SPIEL.status !== 'countdown') return;
  pausiert = an;
  $('pause').classList.toggle('offen', an);
}

/* ============================================================
   TASTEN
   ============================================================ */

const TASTEN_ZUORDNUNG = {
  ArrowLeft:  'links',
  ArrowRight: 'rechts',
  ArrowUp:    'oben',
  ArrowDown:  'unten',
  KeyA:       'links',
  KeyD:       'rechts',
  KeyW:       'oben',
  KeyS:       'unten',
  KeyN:       'klettern'
};

document.addEventListener('keydown', function (e) {
  // Nur im Spiel Tasten abfangen
  const imSpiel = $('spiel').classList.contains('aktiv');

  if (e.code === 'KeyP' && imSpiel) {
    setzePause(!pausiert);
    e.preventDefault();
    return;
  }

  if (!imSpiel || pausiert) return;

  const name = TASTEN_ZUORDNUNG[e.code];
  if (name) {
    TASTEN[name] = true;
    e.preventDefault();
  }

  if (e.code === 'Space') {
    wirfSchokolade();
    e.preventDefault();
  }

  // Springen: nur beim Drücken, nicht dauerhaft
  if ((e.code === 'ArrowUp' || e.code === 'KeyW') && !e.repeat) springe();

  // Level überspringen — nur zum Ausprobieren mit ?debug=1
  if (debugAn() && /^Digit[1-5]$/.test(e.code)) {
    starteLevel(Number(e.code.slice(5)));
  }
});

document.addEventListener('keyup', function (e) {
  const name = TASTEN_ZUORDNUNG[e.code];
  if (name) TASTEN[name] = false;
});

/* Wenn das Fenster den Fokus verliert, alle Tasten loslassen */
window.addEventListener('blur', function () {
  for (const k of Object.keys(TASTEN)) TASTEN[k] = false;
});

function debugAn() {
  return location.search.indexOf('debug=1') !== -1;
}

/* ============================================================
   EIGENE SCHLEIFE (mit Pause)
   ============================================================ */

let letztesBild = 0;

function seitenSchleife(jetzt) {
  if (!letztesBild) letztesBild = jetzt;
  const dt = (jetzt - letztesBild) / 1000;
  letztesBild = jetzt;

  if (!pausiert && (SPIEL.status === 'laeuft' || SPIEL.status === 'countdown')) {
    rechne(dt);
    zeichne();
    aktualisiereHud();
  }
  requestAnimationFrame(seitenSchleife);
}

/* ============================================================
   LOSLEGEN
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  leinwand = $('leinwand');
  stift = leinwand.getContext('2d');
  ladeBilder();

  $('knopfStart').onclick = function () {
    pausiert = false;
    starteSpiel();
  };

  $('knopfNochmal').onclick = function () {
    pausiert = false;
    starteSpiel();
  };

  $('knopfPause').onclick   = function () { setzePause(true); };
  $('knopfWeiter').onclick  = function () { setzePause(false); };
  $('knopfAufgeben').onclick = function () {
    setzePause(false);
    verloren('Aufgegeben.');
  };

  zeichneLandingPage();
  requestAnimationFrame(seitenSchleife);
});
