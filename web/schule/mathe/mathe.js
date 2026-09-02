/* ============================================================
   MATHE — der Ablauf auf der Seite.

   Zwei Möglichkeiten pro Lektion:
     ÜBEN  — endlos, sofort sehen ob es stimmt, mit Tipps
     TEST  — 10 Aufgaben, Uhr läuft, am Ende gibt es eine Note

   Die Aufgaben selbst kommen aus aufgaben-klasse3.js / -klasse5.js.
   ============================================================ */

function $(id) { return document.getElementById(id); }

function zeigeBildschirm(id) {
  for (const b of document.querySelectorAll('.bildschirm')) b.classList.remove('aktiv');
  $(id).classList.add('aktiv');
  window.scrollTo(0, 0);
}

/* Welche Klassenstufe ist offen? */
let offeneKlasse = 'klasse3';

/* Was läuft gerade? */
const LAUF = {
  art: null,        // 'uebung' | 'test'
  lektion: null,
  aufgabe: null,
  richtig: 0,
  gesamt: 0,
  serie: 0,
  nummer: 0,
  zeitRest: 0,
  uhr: null,
  start: 0,
  rueckblick: []
};

/* ============================================================
   ÜBERSICHT
   ============================================================ */

function zeichneKlassenwahl() {
  const leiste = $('klassenwahl');
  leiste.innerHTML = '';

  for (const id of Object.keys(MATHE)) {
    const k = MATHE[id];
    const knopf = document.createElement('button');
    knopf.className = 'klassentab' + (id === offeneKlasse ? ' aktiv' : '');
    knopf.innerHTML = '<b>' + k.titel + '</b><small>' + k.alter + '</small>';
    knopf.onclick = function () {
      offeneKlasse = id;
      location.hash = id;
      zeichneUebersicht();
    };
    leiste.appendChild(knopf);
  }
}

function zeichneUebersicht() {
  const profil = aktivesProfil();
  $('uebersichtWer').innerHTML = profil
    ? 'Angemeldet als ' + profil.avatar + ' <b>' + profil.name +
      '</b> — dein Fortschritt und deine Noten werden gespeichert.'
    : 'Als Gast — dein Fortschritt wird nicht gespeichert. ' +
      '<a href="../../index.html">Profil auswählen</a>';

  zeichneKlassenwahl();

  const kasten = $('lektionen');
  kasten.innerHTML = '';

  for (const l of alleLektionen(offeneKlasse)) {
    const f = holeSchulFortschritt(offeneKlasse, l.id);
    const karte = document.createElement('div');
    karte.className = 'lektion';

    const quote = f.training.gesamt > 0
      ? Math.round((f.training.richtig / f.training.gesamt) * 100) + '% richtig'
      : 'noch nicht geübt';

    karte.innerHTML =
      '<span class="lektionsymbol">' + l.symbol + '</span>' +
      '<h3>' + l.titel + '</h3>' +
      '<p class="lektiontext">' + l.beschreibung + '</p>' +
      '<div class="lektionstand">' +
        '<span>🏋️ ' + f.training.gesamt + ' Aufgaben geübt · ' + quote + '</span>' +
        '<span>' + (f.besteNote
          ? '📝 Beste Note: <b class="note-' + f.besteNote + '">' + f.besteNote + '</b>' +
            ' · ' + f.tests.length + ' Test(s)'
          : '📝 Noch kein Test geschrieben') + '</span>' +
      '</div>';

    const reihe = document.createElement('div');
    reihe.className = 'lektionknoepfe';

    const uebenKnopf = document.createElement('button');
    uebenKnopf.className = 'gross';
    uebenKnopf.textContent = 'Üben 🏋️';
    uebenKnopf.onclick = function () { starteUebung(l); };

    const testKnopf = document.createElement('button');
    testKnopf.className = 'gross blau';
    testKnopf.textContent = 'Test schreiben 📝';
    testKnopf.onclick = function () { starteTest(l); };

    reihe.appendChild(uebenKnopf);
    reihe.appendChild(testKnopf);
    karte.appendChild(reihe);
    kasten.appendChild(karte);
  }

  zeigeBildschirm('uebersicht');
}

/* ============================================================
   DAS ANTWORTFELD BAUEN

   Je nach Aufgabe braucht man ein Feld, zwei Felder (Teilen mit
   Rest) oder eine Einheit dahinter.
   ============================================================ */

function baueAntwortzeile(kasten, aufgabe) {
  kasten.innerHTML = '';
  const art = aufgabe.eingabe || 'zahl';

  function feld(platzhalter, breit) {
    const el = document.createElement('input');
    el.type = 'text';
    el.autocomplete = 'off';
    el.className = 'antwortfeld' + (breit ? ' breit' : '');
    el.placeholder = platzhalter || '';
    // Auf Handy und Tablet die Zifferntastatur zeigen
    if (art === 'zahl') el.inputMode = 'decimal';
    if (art === 'rest' || art === 'uhrzeit') el.inputMode = 'numeric';
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); antwortAbschicken(); }
    });
    kasten.appendChild(el);
    return el;
  }

  if (art === 'rest') {
    feld('Ergebnis');
    const wort = document.createElement('span');
    wort.className = 'zwischenwort';
    wort.textContent = 'Rest';
    kasten.appendChild(wort);
    feld('Rest');

  } else if (art === 'bruch') {
    feld('z. B. 3/4', true);

  } else if (art === 'uhrzeit') {
    feld('z. B. 17:30', true);

  } else if (art === 'text') {
    feld('Antwort', true);

  } else {
    feld('Zahl', true);
  }

  if (aufgabe.einheit) {
    const einheit = document.createElement('span');
    einheit.className = 'einheit';
    einheit.textContent = aufgabe.einheit;
    kasten.appendChild(einheit);
  }

  const felder = kasten.querySelectorAll('input');
  if (felder.length) felder[0].focus();
}

/* Was hat das Kind eingetippt? */
function leseAntwort(kasten, aufgabe) {
  const felder = kasten.querySelectorAll('input');
  if ((aufgabe.eingabe || 'zahl') === 'rest') {
    return (felder[0].value || '') + ' R ' + (felder[1].value || '');
  }
  return felder[0] ? felder[0].value : '';
}

function antwortLeer(kasten, aufgabe) {
  const felder = kasten.querySelectorAll('input');
  for (const f of felder) if (String(f.value).trim() === '') return true;
  return felder.length === 0;
}

/* ============================================================
   ÜBEN
   ============================================================ */

function starteUebung(l) {
  LAUF.art = 'uebung';
  LAUF.lektion = l;
  LAUF.richtig = 0;
  LAUF.gesamt = 0;
  LAUF.serie = 0;

  $('uebungTitel').textContent = l.symbol + ' ' + l.titel;
  naechsteUebungsaufgabe();
  zeigeBildschirm('uebung');
}

function naechsteUebungsaufgabe() {
  LAUF.aufgabe = LAUF.lektion.macheAufgabe();
  $('uebungFrage').textContent = LAUF.aufgabe.frage;
  $('uebungMeldung').textContent = '';
  $('uebungMeldung').className = 'meldung';
  $('uebungTipp').classList.add('versteckt');
  $('uebungWeiter').textContent = 'Prüfen';
  $('uebungWeiter').dataset.modus = 'pruefen';
  baueAntwortzeile($('uebungAntwortzeile'), LAUF.aufgabe);
  aktualisiereUebungsanzeige();
}

function aktualisiereUebungsanzeige() {
  $('uebungRichtig').textContent = LAUF.richtig;
  $('uebungGesamt').textContent = LAUF.gesamt;
  $('uebungSerie').textContent = LAUF.serie;
}

function pruefeUebung() {
  const kasten = $('uebungAntwortzeile');
  if (antwortLeer(kasten, LAUF.aufgabe)) {
    $('uebungMeldung').textContent = 'Schreib erst eine Antwort hin.';
    $('uebungMeldung').className = 'meldung tipp';
    return;
  }

  const eingabe = leseAntwort(kasten, LAUF.aufgabe);
  const stimmt = pruefeAntwort(LAUF.aufgabe, eingabe);

  LAUF.gesamt += 1;
  if (stimmt) {
    LAUF.richtig += 1;
    LAUF.serie += 1;
    $('uebungMeldung').textContent = lobText(LAUF.serie);
    $('uebungMeldung').className = 'meldung richtig';
  } else {
    LAUF.serie = 0;
    $('uebungMeldung').textContent = 'Nicht ganz. Richtig wäre: ' +
      schoeneAntwort(LAUF.aufgabe);
    $('uebungMeldung').className = 'meldung falsch';
    if (LAUF.aufgabe.hilfe) {
      $('uebungTipp').textContent = '💡 ' + LAUF.aufgabe.hilfe;
      $('uebungTipp').classList.remove('versteckt');
    }
  }

  speichereTraining(offeneKlasse, LAUF.lektion.id, stimmt, LAUF.serie);
  aktualisiereUebungsanzeige();

  // Felder sperren, bis es weitergeht
  for (const f of kasten.querySelectorAll('input')) f.disabled = true;
  $('uebungWeiter').textContent = 'Nächste Aufgabe →';
  $('uebungWeiter').dataset.modus = 'weiter';
  $('uebungWeiter').focus();
}

function lobText(serie) {
  if (serie >= 10) return '🏆 Unglaublich! ' + serie + ' richtige hintereinander!';
  if (serie >= 5)  return '🔥 Super! ' + serie + ' richtige hintereinander!';
  if (serie >= 3)  return '⭐ Sehr gut weiter so!';
  return '✅ Richtig!';
}

/* Die Antwort so anzeigen, wie ein Kind sie lesen würde */
function schoeneAntwort(aufgabe) {
  let text = String(aufgabe.antwort);
  if ((aufgabe.eingabe || 'zahl') === 'rest') text = text.replace(' R ', ' Rest ');
  return text + (aufgabe.einheit ? ' ' + aufgabe.einheit : '');
}

/* ============================================================
   TEST
   ============================================================ */

function starteTest(l) {
  LAUF.art = 'test';
  LAUF.lektion = l;
  LAUF.richtig = 0;
  LAUF.gesamt = l.testAnzahl;
  LAUF.nummer = 0;
  LAUF.rueckblick = [];
  LAUF.zeitRest = l.testZeitSek;
  LAUF.start = Date.now();

  $('testTitel').textContent = l.symbol + ' Test: ' + l.titel;
  $('testAnzahl').textContent = l.testAnzahl;

  starteUhr();
  naechsteTestaufgabe();
  zeigeBildschirm('test');
}

function starteUhr() {
  stoppeUhr();
  zeigeUhr();
  LAUF.uhr = setInterval(function () {
    LAUF.zeitRest -= 1;
    zeigeUhr();
    if (LAUF.zeitRest <= 0) {
      stoppeUhr();
      beendeTest(true);
    }
  }, 1000);
}

function stoppeUhr() {
  if (LAUF.uhr) { clearInterval(LAUF.uhr); LAUF.uhr = null; }
}

function zeigeUhr() {
  const min = Math.floor(Math.max(0, LAUF.zeitRest) / 60);
  const sek = Math.max(0, LAUF.zeitRest) % 60;
  $('testZeit').textContent = min + ':' + String(sek).padStart(2, '0');
  $('testUhr').classList.toggle('knapp', LAUF.zeitRest <= 30);
}

function naechsteTestaufgabe() {
  LAUF.nummer += 1;
  LAUF.aufgabe = LAUF.lektion.macheAufgabe();

  $('testNummer').textContent = LAUF.nummer;
  $('testFrage').textContent = LAUF.aufgabe.frage;
  $('testBalken').style.width =
    Math.round(((LAUF.nummer - 1) / LAUF.gesamt) * 100) + '%';
  $('testWeiter').textContent = LAUF.nummer >= LAUF.gesamt ? 'Test abgeben ✓' : 'Weiter →';

  baueAntwortzeile($('testAntwortzeile'), LAUF.aufgabe);
}

function testAntwortAbschicken() {
  const kasten = $('testAntwortzeile');
  const eingabe = leseAntwort(kasten, LAUF.aufgabe);
  const stimmt = pruefeAntwort(LAUF.aufgabe, eingabe);

  if (stimmt) LAUF.richtig += 1;
  LAUF.rueckblick.push({
    frage: LAUF.aufgabe.frage,
    deine: eingabe.trim() === 'R' || eingabe.trim() === '' ? '(nichts)' : eingabe,
    richtig: schoeneAntwort(LAUF.aufgabe),
    stimmt: stimmt
  });

  if (LAUF.nummer >= LAUF.gesamt) beendeTest(false);
  else naechsteTestaufgabe();
}

function beendeTest(zeitAbgelaufen) {
  stoppeUhr();

  // Was nicht beantwortet wurde, zählt als falsch
  while (LAUF.rueckblick.length < LAUF.gesamt) {
    LAUF.rueckblick.push({
      frage: LAUF.rueckblick.length === LAUF.nummer - 1 ? LAUF.aufgabe.frage : '(nicht bearbeitet)',
      deine: '(keine Antwort)',
      richtig: LAUF.rueckblick.length === LAUF.nummer - 1
        ? schoeneAntwort(LAUF.aufgabe) : '–',
      stimmt: false
    });
  }

  const dauerSek = Math.round((Date.now() - LAUF.start) / 1000);
  const note = berechneNote(LAUF.richtig, LAUF.gesamt);

  speichereTest(offeneKlasse, LAUF.lektion.id, {
    richtig: LAUF.richtig,
    gesamt: LAUF.gesamt,
    note: note,
    dauerSek: dauerSek
  });

  zeigeErgebnis(note, dauerSek, zeitAbgelaufen);
}

function zeigeErgebnis(note, dauerSek, zeitAbgelaufen) {
  $('ergebnisNote').textContent = note;
  $('ergebnisNote').className = 'note note-' + note;
  $('ergebnisNotenText').textContent = noteName(note);
  $('ergebnisPunkte').textContent = LAUF.richtig + ' von ' + LAUF.gesamt + ' richtig';

  const minuten = Math.floor(dauerSek / 60);
  const sekunden = dauerSek % 60;
  let zusatz = 'Gebraucht: ' + (minuten > 0 ? minuten + ' min ' : '') + sekunden + ' s';
  if (zeitAbgelaufen) zusatz = '⏰ Die Zeit war um! ' + zusatz;

  const profil = aktivesProfil();
  if (profil) {
    const f = holeSchulFortschritt(offeneKlasse, LAUF.lektion.id);
    if (f.besteNote === note && f.tests.length > 1) zusatz += ' · 🏅 Deine beste Note bisher!';
  } else {
    zusatz += ' · Als Gast wird das Ergebnis nicht gespeichert.';
  }
  $('ergebnisZusatz').textContent = zusatz;

  const ol = $('ergebnisRueckblick');
  ol.innerHTML = '';
  for (const r of LAUF.rueckblick) {
    const li = document.createElement('li');
    li.className = r.stimmt ? 'war-richtig' : 'war-falsch';
    li.innerHTML =
      '<span class="rueckFrage">' + (r.stimmt ? '✅' : '❌') + ' ' +
        r.frage.replace(/\n/g, ' ') + '</span>' +
      (r.stimmt
        ? '<span class="rueckAntwort">' + r.richtig + '</span>'
        : '<span class="rueckAntwort">deine Antwort: <s>' + r.deine +
          '</s> · richtig: <b>' + r.richtig + '</b></span>');
    ol.appendChild(li);
  }

  zeigeBildschirm('ergebnis');
}

/* ============================================================
   EIN KNOPF FÜR BEIDE (Enter-Taste)
   ============================================================ */

function antwortAbschicken() {
  if ($('uebung').classList.contains('aktiv')) {
    if ($('uebungWeiter').dataset.modus === 'weiter') naechsteUebungsaufgabe();
    else pruefeUebung();
  } else if ($('test').classList.contains('aktiv')) {
    testAntwortAbschicken();
  }
}

/* ============================================================
   LOSLEGEN
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // #klasse3 oder #klasse5 in der Adresse beachten
  const hash = location.hash.replace('#', '');
  if (MATHE[hash]) offeneKlasse = hash;

  $('uebungWeiter').onclick = antwortAbschicken;
  $('uebungFertig').onclick = zeichneUebersicht;

  $('testWeiter').onclick = testAntwortAbschicken;
  $('testAbbrechen').onclick = function () {
    if (!confirm('Test wirklich abbrechen? Das Ergebnis wird dann nicht gespeichert.')) return;
    stoppeUhr();
    zeichneUebersicht();
  };

  $('ergebnisNochmal').onclick = function () { starteTest(LAUF.lektion); };
  $('ergebnisUeben').onclick   = function () { starteUebung(LAUF.lektion); };
  $('ergebnisZurueck').onclick = zeichneUebersicht;

  zeichneUebersicht();
});
