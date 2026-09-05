/* ============================================================
   ENGLISCH — der Ablauf auf der Seite.

   Drei Möglichkeiten pro Lektion:
     ÜBEN    — endlos, sofort sehen ob es stimmt, mit Tipps
     TEST    — 10 Vokabeln, Uhr läuft, am Ende gibt es eine Note
     LERNBOX — Karteikasten mit fünf Fächern über alle Lektionen

   Die Wörter kommen aus vokabeln-klasse5.js, das Rechnen
   erledigt vokabeln.js.
   ============================================================ */

function $(id) { return document.getElementById(id); }

function zeigeBildschirm(id) {
  for (const b of document.querySelectorAll('.bildschirm')) b.classList.remove('aktiv');
  $(id).classList.add('aktiv');
  window.scrollTo(0, 0);
}

const FACH = 'englisch';
let offeneKlasse = 'klasse5';

/* Die drei Übungsrichtungen */
const RICHTUNGEN = [
  { id: 'de-en', text: '🇩🇪 → 🇬🇧 Englisch tippen',
    erklaerung: 'Du siehst das deutsche Wort und schreibst das englische. So läuft auch der Vokabeltest.' },
  { id: 'en-de', text: '🇬🇧 → 🇩🇪 Deutsch tippen',
    erklaerung: 'Du siehst das englische Wort und schreibst das deutsche. Gut zum Lesen üben.' },
  { id: 'auswahl', text: '🔤 Auswahl (leicht)',
    erklaerung: 'Du siehst das deutsche Wort und suchst das richtige englische aus vier Möglichkeiten. Gut für den Anfang.' }
];

/* Was läuft gerade? */
const LAUF = {
  art: null,            // 'uebung' | 'test' | 'lernbox'
  lektion: null,
  richtung: 'de-en',
  wort: null,
  auswahl: [],
  stapel: [],
  richtig: 0,
  gesamt: 0,
  serie: 0,
  nummer: 0,
  zeitRest: 0,
  uhr: null,
  start: 0,
  rueckblick: [],
  testWoerter: [],
  warteschlange: [],
  lektionenImLauf: null,
  lernboxen: {},
  heuteNr: 0,
  fachVorher: 1
};

/* ============================================================
   ÜBERSICHT
   ============================================================ */

/* Die Lernbox-Stände aller Lektionen einsammeln */
function ladeLernboxen() {
  const kaesten = {};
  for (const l of alleLektionen(offeneKlasse)) {
    kaesten[l.id] = holeLernbox(FACH, offeneKlasse, l.id);
  }
  return kaesten;
}

function zeichneFachleiste(kasten, zahlen) {
  kasten.innerHTML = '';
  for (let stufe = 1; stufe <= LERNBOX_STUFEN; stufe++) {
    const fach = document.createElement('div');
    fach.className = 'fach' + (zahlen[stufe] > 0 ? ' voll' : '');
    fach.innerHTML = '<b>' + (zahlen[stufe] || 0) + '</b><small>Fach ' + stufe + '</small>';
    kasten.appendChild(fach);
  }
  const neu = document.createElement('div');
  neu.className = 'fach neu';
  neu.innerHTML = '<b>' + (zahlen.neu || 0) + '</b><small>neu</small>';
  kasten.appendChild(neu);
}

function zeichneUebersicht() {
  const profil = aktivesProfil();
  $('uebersichtWer').innerHTML = profil
    ? 'Angemeldet als ' + profil.avatar + ' <b>' + profil.name +
      '</b> — dein Fortschritt, deine Noten und deine Lernbox werden gespeichert.'
    : 'Als Gast — dein Fortschritt wird nicht gespeichert. ' +
      '<a href="../../index.html">Profil auswählen</a>';

  LAUF.heuteNr = tagesnummer();
  LAUF.lernboxen = ladeLernboxen();

  const lektionen = alleLektionen(offeneKlasse);
  const faellig = faelligeWoerter(lektionen, LAUF.lernboxen, LAUF.heuteNr, null);
  const zahlen = zaehleStufen(lektionen, LAUF.lernboxen);

  $('lernboxStand').textContent = faellig.length > 0
    ? faellig.length + ' Wörter sind heute dran'
    : 'Heute ist nichts fällig — gut gemacht! 🎉';
  zeichneFachleiste($('lernboxFaecher'), zahlen);
  $('lernboxAlle').textContent = faellig.length > 0
    ? 'Lernbox starten 🗂️ (' + Math.min(faellig.length, LERNBOX_PORTION) + ' Wörter)'
    : 'Lernbox starten 🗂️';
  $('lernboxHinweis').textContent = '';
  $('lernboxHinweis').className = 'meldung';

  const kasten = $('lektionen');
  kasten.innerHTML = '';

  let letztesThema = null;
  for (const l of lektionen) {
    if (l.thema && l.thema !== letztesThema) {
      const kopf = document.createElement('h2');
      kopf.className = 'themenkopf';
      kopf.textContent = l.thema;
      kasten.appendChild(kopf);
      letztesThema = l.thema;
    }

    const f = holeSchulFortschritt(FACH, offeneKlasse, l.id);
    const faelligHier = faelligeWoerter([l], LAUF.lernboxen, LAUF.heuteNr, null).length;

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
        '<span>📖 ' + l.woerter.length + ' Vokabeln · ' + quote + '</span>' +
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
    uebenKnopf.onclick = function () { zeigeRichtungswahl(l); };

    const testKnopf = document.createElement('button');
    testKnopf.className = 'gross blau';
    testKnopf.textContent = 'Test schreiben 📝';
    testKnopf.onclick = function () { starteTest(l); };

    const boxKnopf = document.createElement('button');
    boxKnopf.className = 'klein';
    boxKnopf.textContent = faelligHier > 0
      ? 'Lernbox 🗂️ (' + faelligHier + ' fällig)'
      : 'Lernbox 🗂️ (nichts fällig)';
    boxKnopf.onclick = function () { starteLernbox([l]); };

    reihe.appendChild(uebenKnopf);
    reihe.appendChild(testKnopf);
    reihe.appendChild(boxKnopf);
    karte.appendChild(reihe);
    kasten.appendChild(karte);
  }

  zeigeBildschirm('uebersicht');
}

/* ============================================================
   RICHTUNG WÄHLEN
   ============================================================ */

function zeigeRichtungswahl(l) {
  LAUF.lektion = l;
  $('richtungTitel').textContent = l.symbol + ' ' + l.titel;
  zeichneRichtungswahl();
  zeigeBildschirm('richtungswahl');
}

function zeichneRichtungswahl() {
  const leiste = $('wahlRichtung');
  leiste.innerHTML = '';

  for (const r of RICHTUNGEN) {
    const knopf = document.createElement('button');
    knopf.className = 'wahl' + (r.id === LAUF.richtung ? ' aktiv' : '');
    knopf.dataset.wert = r.id;
    knopf.textContent = r.text;
    knopf.onclick = function () {
      LAUF.richtung = r.id;
      zeichneRichtungswahl();
    };
    leiste.appendChild(knopf);
  }

  const gewaehlt = RICHTUNGEN.filter(function (r) { return r.id === LAUF.richtung; })[0];
  $('richtungErklaerung').textContent = gewaehlt ? gewaehlt.erklaerung : '';
}

/* ============================================================
   DAS ANTWORTFELD BAUEN
   ============================================================ */

function baueAntwortzeile(kasten, wort, richtung, lektion) {
  kasten.innerHTML = '';

  if (richtung === 'auswahl') {
    kasten.className = 'auswahlgitter';
    LAUF.auswahl = baueAuswahl(wort, lektion.woerter);
    for (const k of LAUF.auswahl) {
      const knopf = document.createElement('button');
      knopf.className = 'auswahl';
      knopf.textContent = k.englisch[0];
      knopf.dataset.wert = k.englisch[0];
      knopf.onclick = function () {
        if (knopf.disabled) return;
        kasten.dataset.gewaehlt = k.englisch[0];
        antwortAbschicken();
      };
      kasten.appendChild(knopf);
    }
    return;
  }

  kasten.className = 'antwortzeile';
  const el = document.createElement('input');
  el.type = 'text';
  el.className = 'antwortfeld breit';
  el.placeholder = richtung === 'en-de' ? 'auf Deutsch' : 'auf Englisch';
  el.autocomplete = 'off';
  el.lang = richtung === 'en-de' ? 'de' : 'en';
  // Auf Tablet und Handy nicht automatisch groß schreiben oder korrigieren
  el.setAttribute('autocapitalize', 'off');
  el.setAttribute('autocorrect', 'off');
  el.setAttribute('spellcheck', 'false');
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); antwortAbschicken(); }
  });
  kasten.appendChild(el);
  el.focus();
}

function leseAntwort(kasten, richtung) {
  if (richtung === 'auswahl') return kasten.dataset.gewaehlt || '';
  const felder = kasten.querySelectorAll('input');
  return felder[0] ? felder[0].value : '';
}

function antwortLeer(kasten, richtung) {
  return String(leseAntwort(kasten, richtung)).trim() === '';
}

/* Nach dem Prüfen: nichts mehr anklicken, richtige Antwort zeigen */
function sperreAntwortzeile(kasten, wort, richtung) {
  if (richtung === 'auswahl') {
    const richtigeForm = wort.englisch[0];
    for (const knopf of kasten.querySelectorAll('.auswahl')) {
      knopf.disabled = true;
      if (knopf.dataset.wert === richtigeForm) knopf.classList.add('richtig');
      else if (knopf.dataset.wert === kasten.dataset.gewaehlt) knopf.classList.add('falsch');
    }
    return;
  }
  for (const f of kasten.querySelectorAll('input')) f.disabled = true;
}

/* ============================================================
   VORLESEN (nur wenn das Gerät eine englische Stimme hat)
   ============================================================ */

function englischeStimme() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  let stimmen = [];
  try { stimmen = window.speechSynthesis.getVoices() || []; } catch (e) { return null; }

  const briten = stimmen.filter(function (s) { return /^en[-_]GB/i.test(s.lang || ''); });
  const englisch = stimmen.filter(function (s) { return /^en/i.test(s.lang || ''); });
  const liste = briten.length ? briten : englisch;
  if (!liste.length) return null;

  const offline = liste.filter(function (s) { return s.localService; });
  return (offline.length ? offline : liste)[0];
}

function kannSprechen() {
  return englischeStimme() !== null;
}

function sprich(text) {
  if (!kannSprechen()) return;
  try {
    window.speechSynthesis.cancel();
    const spruch = new window.SpeechSynthesisUtterance(text);
    const stimme = englischeStimme();
    if (stimme) spruch.voice = stimme;
    spruch.lang = 'en-GB';
    spruch.rate = 0.9;
    window.speechSynthesis.speak(spruch);
  } catch (e) { /* dann eben nicht */ }
}

/* Knopf zeigen oder verstecken. text = null heißt verstecken. */
function zeigeSprechknopf(id, text) {
  const knopf = $(id);
  if (!knopf) return;
  if (!text || !kannSprechen()) {
    knopf.classList.add('versteckt');
    knopf.onclick = null;
    return;
  }
  knopf.classList.remove('versteckt');
  knopf.onclick = function () { sprich(text); };
}

/* ============================================================
   ÜBEN
   ============================================================ */

function starteUebung(l, richtung) {
  LAUF.art = 'uebung';
  LAUF.lektion = l;
  LAUF.richtung = richtung || LAUF.richtung;
  LAUF.richtig = 0;
  LAUF.gesamt = 0;
  LAUF.serie = 0;
  LAUF.stapel = [];

  $('uebungTitel').textContent = l.symbol + ' ' + l.titel;
  naechstesUebungswort();
  zeigeBildschirm('uebung');
}

/* Gemischter Stapel: jedes Wort einmal, dann neu mischen. */
function naechstesWortAusStapel(lektion) {
  if (!LAUF.stapel.length) {
    LAUF.stapel = mischen(lektion.woerter.slice());
    // Nicht zweimal hintereinander dasselbe Wort
    if (LAUF.wort && LAUF.stapel.length > 1 &&
        wortId(LAUF.stapel[LAUF.stapel.length - 1]) === wortId(LAUF.wort)) {
      LAUF.stapel.unshift(LAUF.stapel.pop());
    }
  }
  return LAUF.stapel.pop();
}

function naechstesUebungswort() {
  LAUF.wort = naechstesWortAusStapel(LAUF.lektion);

  $('uebungFrage').textContent = frageText(LAUF.wort, LAUF.richtung);
  $('uebungMeldung').textContent = '';
  $('uebungMeldung').className = 'meldung';
  $('uebungTipp').classList.add('versteckt');
  $('uebungWeiter').textContent = 'Prüfen';
  $('uebungWeiter').dataset.modus = 'pruefen';

  // Beim Lesen darf man das englische Wort gleich hören
  zeigeSprechknopf('uebungSprechen',
    LAUF.richtung === 'en-de' ? LAUF.wort.englisch[0] : null);

  baueAntwortzeile($('uebungAntwortzeile'), LAUF.wort, LAUF.richtung, LAUF.lektion);
  aktualisiereUebungsanzeige();
}

function aktualisiereUebungsanzeige() {
  $('uebungRichtig').textContent = LAUF.richtig;
  $('uebungGesamt').textContent = LAUF.gesamt;
  $('uebungSerie').textContent = LAUF.serie;
}

function pruefeUebung() {
  const kasten = $('uebungAntwortzeile');
  if (antwortLeer(kasten, LAUF.richtung)) {
    $('uebungMeldung').textContent = 'Schreib erst eine Antwort hin.';
    $('uebungMeldung').className = 'meldung tipp';
    return;
  }

  const eingabe = leseAntwort(kasten, LAUF.richtung);
  const stimmt = pruefeVokabel(LAUF.wort, eingabe, LAUF.richtung);

  LAUF.gesamt += 1;
  if (stimmt) {
    LAUF.richtig += 1;
    LAUF.serie += 1;
    $('uebungMeldung').textContent = lobText(LAUF.serie);
    $('uebungMeldung').className = 'meldung richtig';
  } else {
    LAUF.serie = 0;
    $('uebungMeldung').textContent = 'Nicht ganz. Richtig wäre: ' +
      loesungText(LAUF.wort, LAUF.richtung);
    $('uebungMeldung').className = 'meldung falsch';
  }

  zeigeTipp('uebungTipp', LAUF.wort, stimmt);
  speichereTraining(FACH, offeneKlasse, LAUF.lektion.id, stimmt, LAUF.serie);
  aktualisiereUebungsanzeige();

  // Jetzt darf man das englische Wort hören
  zeigeSprechknopf('uebungSprechen', LAUF.wort.englisch[0]);

  sperreAntwortzeile(kasten, LAUF.wort, LAUF.richtung);
  $('uebungWeiter').textContent = 'Nächstes Wort →';
  $('uebungWeiter').dataset.modus = 'weiter';
  $('uebungWeiter').focus();
}

/* Nach einem Fehler der Merksatz, nach einem Treffer der Beispielsatz */
function zeigeTipp(id, wort, warRichtig) {
  const feld = $(id);
  const text = warRichtig
    ? (wort.beispiel ? '💬 ' + wort.beispiel : null)
    : (wort.hinweis ? '💡 ' + wort.hinweis
                    : (wort.beispiel ? '💬 ' + wort.beispiel : null));
  if (text) {
    feld.textContent = text;
    feld.classList.remove('versteckt');
  } else {
    feld.classList.add('versteckt');
  }
}

/* ============================================================
   TEST — wie in der Schule: deutsch steht da, englisch tippen
   ============================================================ */

function starteTest(l) {
  LAUF.art = 'test';
  LAUF.lektion = l;
  LAUF.richtung = 'de-en';
  LAUF.richtig = 0;
  LAUF.nummer = 0;
  LAUF.rueckblick = [];
  LAUF.zeitRest = l.testZeitSek;
  LAUF.start = Date.now();
  LAUF.testWoerter = testWoerter(l, l.testAnzahl);
  LAUF.gesamt = LAUF.testWoerter.length;

  $('testTitel').textContent = l.symbol + ' Vokabeltest: ' + l.titel;
  $('testAnzahl').textContent = LAUF.gesamt;

  starteUhr();
  naechstesTestwort();
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

function naechstesTestwort() {
  LAUF.wort = LAUF.testWoerter[LAUF.nummer];
  LAUF.nummer += 1;

  $('testNummer').textContent = LAUF.nummer;
  $('testFrage').textContent = frageText(LAUF.wort, 'de-en');
  $('testBalken').style.width =
    Math.round(((LAUF.nummer - 1) / LAUF.gesamt) * 100) + '%';
  $('testWeiter').textContent = LAUF.nummer >= LAUF.gesamt ? 'Test abgeben ✓' : 'Weiter →';

  baueAntwortzeile($('testAntwortzeile'), LAUF.wort, 'de-en', LAUF.lektion);
}

function testAntwortAbschicken() {
  const kasten = $('testAntwortzeile');
  const eingabe = leseAntwort(kasten, 'de-en');
  const stimmt = pruefeVokabel(LAUF.wort, eingabe, 'de-en');

  if (stimmt) LAUF.richtig += 1;
  LAUF.rueckblick.push({
    frage: frageText(LAUF.wort, 'de-en'),
    deine: String(eingabe).trim() === '' ? '(nichts)' : eingabe,
    richtig: loesungText(LAUF.wort, 'de-en'),
    stimmt: stimmt
  });

  if (LAUF.nummer >= LAUF.gesamt) beendeTest(false);
  else naechstesTestwort();
}

function beendeTest(zeitAbgelaufen) {
  stoppeUhr();

  // Was nicht beantwortet wurde, zählt als falsch
  while (LAUF.rueckblick.length < LAUF.gesamt) {
    const offen = LAUF.testWoerter[LAUF.rueckblick.length];
    LAUF.rueckblick.push({
      frage: offen ? frageText(offen, 'de-en') : '(nicht bearbeitet)',
      deine: '(keine Antwort)',
      richtig: offen ? loesungText(offen, 'de-en') : '–',
      stimmt: false
    });
  }

  const dauerSek = Math.round((Date.now() - LAUF.start) / 1000);
  const note = berechneNote(LAUF.richtig, LAUF.gesamt);

  speichereTest(FACH, offeneKlasse, LAUF.lektion.id, {
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
    const f = holeSchulFortschritt(FACH, offeneKlasse, LAUF.lektion.id);
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
        String(r.frage).replace(/\n/g, ' ') + '</span>' +
      (r.stimmt
        ? '<span class="rueckAntwort">' + r.richtig + '</span>'
        : '<span class="rueckAntwort">deine Antwort: <s>' + r.deine +
          '</s> · richtig: <b>' + r.richtig + '</b></span>');
    ol.appendChild(li);
  }

  zeigeBildschirm('ergebnis');
}

/* ============================================================
   LERNBOX
   ============================================================ */

function starteLernbox(lektionen) {
  LAUF.heuteNr = tagesnummer();
  LAUF.lernboxen = ladeLernboxen();

  const faellig = faelligeWoerter(lektionen, LAUF.lernboxen, LAUF.heuteNr, LERNBOX_PORTION);
  if (!faellig.length) {
    $('lernboxHinweis').textContent =
      'Heute ist hier nichts fällig 🎉 Schau morgen wieder vorbei — oder üben!';
    $('lernboxHinweis').className = 'meldung tipp';
    zeigeBildschirm('uebersicht');
    return;
  }

  LAUF.art = 'lernbox';
  LAUF.richtung = 'de-en';
  LAUF.warteschlange = mischen(faellig.slice());
  LAUF.gesamt = LAUF.warteschlange.length;
  LAUF.richtig = 0;
  LAUF.nummer = 0;
  LAUF.lektionenImLauf = lektionen;

  $('lernboxTitel').textContent = lektionen.length === 1
    ? '🗂️ ' + lektionen[0].titel
    : '🗂️ Alle Lektionen';
  $('lernboxAnzahl').textContent = LAUF.gesamt;

  naechstesLernboxwort();
  zeigeBildschirm('lernbox');
}

function naechstesLernboxwort() {
  const dran = LAUF.warteschlange[LAUF.nummer];
  LAUF.nummer += 1;
  LAUF.wort = dran.wort;
  LAUF.lektion = dran.lektion;
  LAUF.fachVorher = dran.stand ? dran.stand.stufe : 1;

  $('lernboxNummer').textContent = LAUF.nummer;
  $('lernboxFach').textContent = dran.stand
    ? '🗂️ Fach ' + LAUF.fachVorher
    : '✨ neues Wort';
  $('lernboxFrage').textContent = frageText(LAUF.wort, 'de-en');
  $('lernboxBalken').style.width =
    Math.round(((LAUF.nummer - 1) / LAUF.gesamt) * 100) + '%';
  $('lernboxMeldung').textContent = '';
  $('lernboxMeldung').className = 'meldung';
  $('lernboxTipp').classList.add('versteckt');
  $('lernboxWeiter').textContent = 'Prüfen';
  $('lernboxWeiter').dataset.modus = 'pruefen';
  zeigeSprechknopf('lernboxSprechen', null);

  baueAntwortzeile($('lernboxAntwortzeile'), LAUF.wort, 'de-en', LAUF.lektion);
}

function pruefeLernbox() {
  const kasten = $('lernboxAntwortzeile');
  if (antwortLeer(kasten, 'de-en')) {
    $('lernboxMeldung').textContent = 'Schreib erst eine Antwort hin.';
    $('lernboxMeldung').className = 'meldung tipp';
    return;
  }

  const eingabe = leseAntwort(kasten, 'de-en');
  const stimmt = pruefeVokabel(LAUF.wort, eingabe, 'de-en');
  if (stimmt) LAUF.richtig += 1;

  const id = wortId(LAUF.wort);
  const kastenDaten = LAUF.lernboxen[LAUF.lektion.id] || leereLernbox();
  const standNeu = lernboxSchritt(kastenDaten.woerter[id], stimmt, LAUF.heuteNr);
  kastenDaten.woerter[id] = standNeu;
  LAUF.lernboxen[LAUF.lektion.id] = kastenDaten;
  speichereLernboxStand(FACH, offeneKlasse, LAUF.lektion.id, id, standNeu);

  $('lernboxMeldung').textContent = stimmt
    ? '✅ Richtig! Das Wort wandert in Fach ' + standNeu.stufe + '.'
    : '❌ Zurück in Fach 1. Richtig wäre: ' + loesungText(LAUF.wort, 'de-en');
  $('lernboxMeldung').className = 'meldung ' + (stimmt ? 'richtig' : 'falsch');

  zeigeTipp('lernboxTipp', LAUF.wort, stimmt);
  zeigeSprechknopf('lernboxSprechen', LAUF.wort.englisch[0]);
  sperreAntwortzeile(kasten, LAUF.wort, 'de-en');

  $('lernboxWeiter').textContent = LAUF.nummer >= LAUF.gesamt ? 'Fertig ✓' : 'Nächstes Wort →';
  $('lernboxWeiter').dataset.modus = 'weiter';
  $('lernboxWeiter').focus();
}

function lernboxWeiter() {
  if (LAUF.nummer >= LAUF.gesamt) beendeLernbox();
  else naechstesLernboxwort();
}

function beendeLernbox() {
  const lektionen = alleLektionen(offeneKlasse);
  const zahlen = zaehleStufen(lektionen, LAUF.lernboxen);
  const nochFaellig = faelligeWoerter(LAUF.lektionenImLauf || lektionen,
                                      LAUF.lernboxen, LAUF.heuteNr, null).length;

  $('lernboxErgebnisPunkte').textContent = LAUF.richtig + ' von ' + LAUF.gesamt + ' richtig';
  zeichneFachleiste($('lernboxErgebnisFaecher'), zahlen);

  let zusatz = nochFaellig > 0
    ? 'Es sind noch ' + nochFaellig + ' Wörter dran.'
    : 'Für heute bist du durch! 🎉 Morgen wartet die nächste Runde.';
  if (!aktivesProfil()) zusatz += ' Als Gast wird die Lernbox nicht gespeichert.';
  $('lernboxErgebnisZusatz').textContent = zusatz;

  $('lernboxNochmal').textContent = nochFaellig > 0 ? 'Weiter üben 🗂️' : 'Nochmal von vorn 🔁';
  $('lernboxNochmal').disabled = nochFaellig === 0;

  zeigeBildschirm('lernboxErgebnis');
}

/* ============================================================
   EIN KNOPF FÜR ALLE (Enter-Taste)
   ============================================================ */

function antwortAbschicken() {
  if ($('uebung').classList.contains('aktiv')) {
    if ($('uebungWeiter').dataset.modus === 'weiter') naechstesUebungswort();
    else pruefeUebung();

  } else if ($('test').classList.contains('aktiv')) {
    testAntwortAbschicken();

  } else if ($('lernbox').classList.contains('aktiv')) {
    if ($('lernboxWeiter').dataset.modus === 'weiter') lernboxWeiter();
    else pruefeLernbox();
  }
}

/* ============================================================
   LOSLEGEN
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const hash = location.hash.replace('#', '');
  if (ENGLISCH[hash]) offeneKlasse = hash;

  $('richtungLos').onclick = function () { starteUebung(LAUF.lektion, LAUF.richtung); };
  $('richtungZurueck').onclick = zeichneUebersicht;

  $('uebungWeiter').onclick = antwortAbschicken;
  $('uebungFertig').onclick = zeichneUebersicht;

  $('testWeiter').onclick = testAntwortAbschicken;
  $('testAbbrechen').onclick = function () {
    if (!confirm('Test wirklich abbrechen? Das Ergebnis wird dann nicht gespeichert.')) return;
    stoppeUhr();
    zeichneUebersicht();
  };

  $('ergebnisNochmal').onclick = function () { starteTest(LAUF.lektion); };
  $('ergebnisUeben').onclick   = function () { zeigeRichtungswahl(LAUF.lektion); };
  $('ergebnisZurueck').onclick = zeichneUebersicht;

  $('lernboxAlle').onclick = function () { starteLernbox(alleLektionen(offeneKlasse)); };
  $('lernboxWeiter').onclick = antwortAbschicken;
  $('lernboxAbbrechen').onclick = function () {
    if (!confirm('Lernbox wirklich abbrechen? Was du schon beantwortet hast, bleibt gespeichert.')) return;
    zeichneUebersicht();
  };
  $('lernboxNochmal').onclick = function () {
    starteLernbox(LAUF.lektionenImLauf || alleLektionen(offeneKlasse));
  };
  $('lernboxZurueck').onclick = zeichneUebersicht;

  // Manche Browser laden die Stimmen erst nach — dann Knöpfe neu bewerten
  if (typeof window !== 'undefined' && window.speechSynthesis &&
      window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener('voiceschanged', function () {
      if ($('uebung').classList.contains('aktiv') && LAUF.wort) {
        zeigeSprechknopf('uebungSprechen',
          LAUF.richtung === 'en-de' || $('uebungWeiter').dataset.modus === 'weiter'
            ? LAUF.wort.englisch[0] : null);
      }
    });
  }

  zeichneUebersicht();
});
