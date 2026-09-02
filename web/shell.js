/* ============================================================
   SHELL — die Startseite der Plattform.
   Profil auswählen, dann Kacheln in drei Tabs anzeigen.
   ============================================================ */

function $(id) { return document.getElementById(id); }

function zeigeBildschirm(id) {
  for (const b of document.querySelectorAll('.bildschirm')) b.classList.remove('aktiv');
  $(id).classList.add('aktiv');
}

function setzeMeldung(id, text, art) {
  const el = $(id);
  el.textContent = text || '';
  el.className = 'meldung' + (art ? ' ' + art : '');
}

/* Welcher Tab ist offen? */
let offenerTab = 'spiele';

/* Beim Anlegen gewähltes Bild und gerade gewähltes Profil */
let gewaehlterAvatar = AVATARE[0];
let pinProfilId = null;
let pinEingegeben = '';

/* ============================================================
   PROFILWAHL
   ============================================================ */

function zeichneProfilwahl() {
  const liste = ladeProfile();
  const kasten = $('profilListe');
  kasten.innerHTML = '';

  if (liste.length === 0) {
    const leer = document.createElement('p');
    leer.className = 'hinweistext';
    leer.textContent = 'Noch keine Profile. Legt euch eins an!';
    kasten.appendChild(leer);
  }

  for (const profil of liste) {
    const knopf = document.createElement('button');
    knopf.className = 'profilknopf';
    knopf.innerHTML = '<span class="profilavatar">' + profil.avatar + '</span>' +
                      '<span class="profilname">' + textSicher(profil.name) + '</span>';
    knopf.onclick = function () { fragePin(profil.id); };
    kasten.appendChild(knopf);
  }
  zeigeBildschirm('profilwahl');
}

/* Kleine Vorsichtsmaßnahme: Namen dürfen kein HTML einschmuggeln */
function textSicher(text) {
  return String(text).replace(/[&<>"']/g, function (z) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z];
  });
}

/* ============================================================
   NEUES PROFIL
   ============================================================ */

function zeichneAvatarWahl() {
  const kasten = $('avatarWahl');
  kasten.innerHTML = '';
  for (const a of AVATARE) {
    const knopf = document.createElement('button');
    knopf.className = 'avatar' + (a === gewaehlterAvatar ? ' aktiv' : '');
    knopf.textContent = a;
    knopf.onclick = function () { gewaehlterAvatar = a; zeichneAvatarWahl(); };
    kasten.appendChild(knopf);
  }
}

function starteProfilNeu() {
  $('neuName').value = '';
  $('neuPin').value = '';
  $('neuPin2').value = '';
  gewaehlterAvatar = AVATARE[Math.floor(Math.random() * AVATARE.length)];
  setzeMeldung('neuMeldung', '');
  zeichneAvatarWahl();
  zeigeBildschirm('profilNeu');
  $('neuName').focus();
}

function speichereNeuesProfil() {
  const pin  = $('neuPin').value.trim();
  const pin2 = $('neuPin2').value.trim();

  if (pin !== pin2) {
    setzeMeldung('neuMeldung', 'Die beiden PINs sind nicht gleich. Probier es nochmal.', 'falsch');
    return;
  }

  const ergebnis = neuesProfil($('neuName').value, gewaehlterAvatar, pin);
  if (!ergebnis.ok) {
    setzeMeldung('neuMeldung', ergebnis.fehler, 'falsch');
    return;
  }

  meldeAn(ergebnis.profil.id, pin);
  zeigeHauptmenue();
}

/* ============================================================
   PIN EINGEBEN
   ============================================================ */

function fragePin(id) {
  const profil = profilNachId(id);
  if (!profil) { zeichneProfilwahl(); return; }

  pinProfilId = id;
  pinEingegeben = '';
  $('pinAvatar').textContent = profil.avatar;
  $('pinName').textContent = profil.name;
  setzeMeldung('pinMeldung', '');
  zeichnePinPunkte();
  zeichneZiffernblock();
  zeigeBildschirm('pinEingabe');
}

function zeichnePinPunkte() {
  const kasten = $('pinPunkte');
  kasten.innerHTML = '';
  for (let i = 0; i < PIN_LAENGE; i++) {
    const punkt = document.createElement('span');
    punkt.className = 'pinpunkt' + (i < pinEingegeben.length ? ' gefuellt' : '');
    kasten.appendChild(punkt);
  }
}

function zeichneZiffernblock() {
  const kasten = $('ziffernblock');
  kasten.innerHTML = '';
  const tasten = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '✓'];
  for (const t of tasten) {
    const knopf = document.createElement('button');
    knopf.className = 'ziffer' + (t === '✓' ? ' ok' : '') + (t === '←' ? ' weg' : '');
    knopf.textContent = t;
    knopf.onclick = function () { ziffer(t); };
    kasten.appendChild(knopf);
  }
}

function ziffer(t) {
  if (t === '←') {
    pinEingegeben = pinEingegeben.slice(0, -1);
  } else if (t === '✓') {
    pruefePin();
    return;
  } else if (pinEingegeben.length < PIN_LAENGE) {
    pinEingegeben += t;
  }
  setzeMeldung('pinMeldung', '');
  zeichnePinPunkte();

  // Bei voller PIN gleich selbst prüfen — spart einen Tipp
  if (pinEingegeben.length === PIN_LAENGE) pruefePin();
}

function pruefePin() {
  if (meldeAn(pinProfilId, pinEingegeben)) {
    zeigeHauptmenue();
    return;
  }
  pinEingegeben = '';
  zeichnePinPunkte();
  setzeMeldung('pinMeldung', 'Das war nicht die richtige PIN. Nochmal!', 'falsch');
  $('pinPunkte').classList.remove('wackeln');
  void $('pinPunkte').offsetWidth;          // Animation neu starten
  $('pinPunkte').classList.add('wackeln');
}

/* ============================================================
   FÜR ELTERN
   ============================================================ */

function zeichneEltern() {
  const kasten = $('elternListe');
  kasten.innerHTML = '';
  const liste = ladeProfile();

  if (liste.length === 0) {
    kasten.innerHTML = '<p class="hinweistext">Noch keine Profile angelegt.</p>';
  }

  for (const profil of liste) {
    const zeile = document.createElement('div');
    zeile.className = 'elternzeile';
    zeile.innerHTML = '<span>' + profil.avatar + ' <b>' + textSicher(profil.name) + '</b></span>';

    const neuePin = document.createElement('button');
    neuePin.className = 'klein';
    neuePin.textContent = 'PIN ändern';
    neuePin.onclick = function () {
      const eingabe = prompt('Neue 4-stellige PIN für ' + profil.name + ':');
      if (eingabe === null) return;
      if (setzePin(profil.id, eingabe.trim())) {
        alert('PIN geändert.');
      } else {
        alert('Das war keine 4-stellige Zahl.');
      }
    };

    const weg = document.createElement('button');
    weg.className = 'klein gefahr';
    weg.textContent = 'Profil löschen';
    weg.onclick = function () {
      const sicher = confirm('Profil "' + profil.name +
        '" wirklich löschen? Alle Punkte und Lernfortschritte gehen dabei verloren.');
      if (!sicher) return;
      loescheProfil(profil.id);
      zeichneEltern();
    };

    const knoepfe = document.createElement('span');
    knoepfe.className = 'elternknoepfe';
    knoepfe.appendChild(neuePin);
    knoepfe.appendChild(weg);
    zeile.appendChild(knoepfe);
    kasten.appendChild(zeile);
  }
  zeigeBildschirm('eltern');
}

/* ============================================================
   HAUPTMENÜ MIT TABS UND KACHELN
   ============================================================ */

function zeigeHauptmenue() {
  const profil = aktivesProfil();

  $('werAvatar').textContent = profil ? profil.avatar : '👤';
  $('werName').textContent   = profil ? profil.name : 'Gast';
  $('werZusatz').textContent = profil
    ? 'angemeldet — deine Punkte werden gespeichert'
    : 'ohne Profil — Punkte werden nicht gespeichert';
  $('knopfWechseln').textContent = profil ? 'Profil wechseln' : 'Anmelden';

  zeichneTabs();
  zeichneKacheln();
  $('menueFuss').textContent =
    'Alles läuft auf diesem Gerät — es gibt keinen Server und kein Internet wird gebraucht.';
  zeigeBildschirm('hauptmenue');
}

function zeichneTabs() {
  const leiste = $('tableiste');
  leiste.innerHTML = '';
  for (const k of KATEGORIEN) {
    const knopf = document.createElement('button');
    knopf.className = 'tab' + (k.id === offenerTab ? ' aktiv' : '');
    knopf.innerHTML = '<span class="tabsymbol">' + k.symbol + '</span>' + k.titel;
    knopf.onclick = function () {
      offenerTab = k.id;
      zeichneTabs();
      zeichneKacheln();
    };
    leiste.appendChild(knopf);
  }
}

function zeichneKacheln() {
  const kasten = $('kacheln');
  kasten.innerHTML = '';

  for (const eintrag of katalogFuer(offenerTab)) {
    const kachel = document.createElement('a');
    kachel.className = 'kachel';
    kachel.href = eintrag.pfad;
    kachel.innerHTML =
      '<span class="kachelsymbol">' + eintrag.symbol + '</span>' +
      '<span class="kacheltitel">' + eintrag.titel + '</span>' +
      '<span class="kacheltext">' + eintrag.beschreibung + '</span>' +
      '<span class="kachelinfo">' + kachelInfo(eintrag) + '</span>' +
      '<span class="kachelstart">Losspielen →</span>';
    kasten.appendChild(kachel);
  }
}

/* ============================================================
   KNÖPFE VERBINDEN UND LOSLEGEN
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  $('knopfNeuesProfil').onclick = starteProfilNeu;
  $('neuSpeichern').onclick     = speichereNeuesProfil;
  $('neuAbbrechen').onclick     = zeichneProfilwahl;
  $('pinZurueck').onclick       = zeichneProfilwahl;
  $('elternZurueck').onclick    = zeichneProfilwahl;

  $('linkGast').onclick = function (e) {
    e.preventDefault();
    meldeAb();
    zeigeHauptmenue();
  };

  $('linkEltern').onclick = function (e) {
    e.preventDefault();
    zeichneEltern();
  };

  $('knopfWechseln').onclick = function () {
    meldeAb();
    zeichneProfilwahl();
  };

  // Enter im Formular = fertig
  for (const id of ['neuName', 'neuPin', 'neuPin2']) {
    $(id).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') speichereNeuesProfil();
    });
  }

  // Auf dem PIN-Bildschirm kann man auch einfach tippen
  document.addEventListener('keydown', function (e) {
    if (!$('pinEingabe').classList.contains('aktiv')) return;
    if (/^\d$/.test(e.key)) ziffer(e.key);
    else if (e.key === 'Backspace') ziffer('←');
    else if (e.key === 'Enter') ziffer('✓');
  });

  // Wer schon angemeldet ist, kommt direkt ins Menü
  if (aktivesProfil()) zeigeHauptmenue();
  else zeichneProfilwahl();
});
