/* ============================================================
   KONZENTRATION — der Ablauf auf der Seite.

   Übersicht → Einführung (Lernziel, Tipp, Stufe) → eine Runde
   Aufgaben → Ergebnis mit Stufe und Rückblick.

   Die Aufgaben kommen aus gedaechtnis.js, muster.js, geometrie.js,
   memory.js und aufmerksamkeit.js; kern.js prüft und rechnet die Stufe aus. Hier
   wird nur gezeichnet und geklickt.
   ============================================================ */

function $(id) { return document.getElementById(id); }

function zeigeBildschirm(id) {
  for (const b of document.querySelectorAll('.bildschirm')) b.classList.remove('aktiv');
  $(id).classList.add('aktiv');
  if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
}

function element(tag, klasse, html) {
  const el = document.createElement(tag);
  if (klasse) el.className = klasse;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

function zeige(id, sichtbar) {
  $(id).classList.toggle('versteckt', !sichtbar);
}

function setzeMeldung(text, art) {
  $('aufgabeMeldung').textContent = text || '';
  $('aufgabeMeldung').className = 'meldung' + (art ? ' ' + art : '');
}

function textSicher(text) {
  return String(text).replace(/[&<>"']/g, function (z) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z];
  });
}

/* Was läuft gerade? */
const LAUF = {
  gruppe: 'gedaechtnis',
  alter: null,               // 8 bis 12 oder null = alle Übungen zeigen
  uebung: null,
  stufe: 1,
  stufeStart: 1,
  verlauf: [],
  hilfeModus: false,
  mitUhr: false,
  paartyp: 'auto',
  nummer: 0,
  gesamt: 8,
  richtig: 0,
  serie: 0,
  fehlversuche: 0,
  aufgabe: null,
  antwort: null,
  phase: 'antworten',        // 'zeigen' | 'antworten' | 'geprueft'
  zeitRest: 0,
  zeitGesamt: 0,
  uhr: null,
  timer: [],
  start: 0,
  rueckblick: []
};

/* Gäste: die Stufe gilt nur für diesen Besuch */
const GAST_STAND = {};

function holeStand(uebungId) {
  if (aktivesProfil()) return holeKonzentration(uebungId);
  return Object.assign(leererKonzentrationsStand(), GAST_STAND[uebungId] || {});
}

function merkeGast(uebungId, aenderung) {
  if (aktivesProfil()) return;
  const s = holeStand(uebungId);
  Object.assign(s, aenderung);
  GAST_STAND[uebungId] = s;
}

/* ---------------- Zeitgeber ----------------
   Jeder setTimeout läuft über spaeter(), damit wir beim Abbrechen
   oder bei der nächsten Aufgabe alles sauber anhalten können. */

function spaeter(fn, ms) {
  const h = setTimeout(fn, ms);
  LAUF.timer.push(h);
  return h;
}

function stoppeUhr() {
  if (LAUF.uhr) { clearInterval(LAUF.uhr); LAUF.uhr = null; }
}

function stoppeAlles() {
  stoppeUhr();
  for (const h of LAUF.timer) clearTimeout(h);
  LAUF.timer = [];
}

/* Mit Uhr wird die Merkzeit kürzer */
function merkzeit(ms, mindestens) {
  return LAUF.mitUhr ? Math.max(mindestens, Math.round(ms * 0.7)) : ms;
}

/* ============================================================
   ÜBERSICHT
   ============================================================ */

function zeichneGruppenwahl() {
  const leiste = $('gruppenwahl');
  leiste.innerHTML = '';
  for (const g of GRUPPEN) {
    const knopf = element('button', 'gruppentab' + (g.id === LAUF.gruppe ? ' aktiv' : ''),
                          '<b>' + g.symbol + ' ' + g.titel + '</b>');
    knopf.dataset.gruppe = g.id;
    knopf.onclick = function () {
      LAUF.gruppe = g.id;
      location.hash = g.id;
      zeichneUebersicht();
    };
    leiste.appendChild(knopf);
  }
}

/* „Wie alt bist du?“ — zeigt nur die Übungen, die zum Alter passen */
function zeichneAlterswahl() {
  const leiste = $('alterswahl');
  leiste.innerHTML = '';
  const wahl = [null];
  for (let j = ALTER_MIN; j <= ALTER_MAX; j++) wahl.push(j);
  for (const j of wahl) {
    const knopf = element('button', 'alterknopf' + (j === LAUF.alter ? ' aktiv' : ''));
    knopf.textContent = j === null ? 'Alle' : String(j);
    knopf.dataset.alter = j === null ? 'alle' : String(j);
    knopf.setAttribute('aria-label', j === null ? 'Übungen für jedes Alter zeigen' : 'Übungen für ' + j + ' Jahre zeigen');
    knopf.onclick = function () {
      LAUF.alter = j;
      speichereKonzentrationsAlter(j);
      zeichneUebersicht();
    };
    leiste.appendChild(knopf);
  }
}

function standText(s) {
  if (!s.aufgaben && !s.runden) return 'noch nicht geübt';
  return 'Stufe ' + s.stufe + ' · Beste Stufe ' + s.hoechsteStufe + ' · ' +
         s.runden + ' Runde' + (s.runden === 1 ? '' : 'n');
}

function zeichneUebersicht() {
  stoppeAlles();
  const profil = aktivesProfil();
  $('uebersichtWer').innerHTML = profil
    ? 'Angemeldet als ' + profil.avatar + ' <b>' + textSicher(profil.name) +
      '</b> — deine Stufen werden gespeichert.'
    : 'Als Gast — deine Stufe wird nicht gespeichert. <a href="../index.html">Profil auswählen</a>';

  zeichneAlterswahl();
  zeichneGruppenwahl();
  const gruppe = findeGruppe(LAUF.gruppe);
  $('gruppeText').textContent = gruppe ? gruppe.text : '';

  const kasten = $('uebungen');
  kasten.innerHTML = '';
  const inGruppe = alleUebungen(LAUF.gruppe);
  const passend = inGruppe.filter(function (u) { return passtZumAlter(u, LAUF.alter); });
  const versteckt = inGruppe.length - passend.length;
  $('alterHinweis').textContent = !versteckt ? ''
    : (passend.length ? versteckt + (versteckt === 1 ? ' weitere Übung ist' : ' weitere Übungen sind') + ' für ein anderes Alter gedacht. '
                      : 'In dieser Gruppe ist keine Übung für ' + LAUF.alter + ' Jahre gedacht. ') +
      'Mit „Alle“ siehst du alles.';

  for (const u of passend) {
    const karte = element('div', 'lektion');
    karte.innerHTML =
      '<span class="lektionsymbol">' + u.symbol + '</span>' +
      '<span class="altersmarke" title="gedacht für ' + u.alter[0] + ' bis ' + u.alter[1] + ' Jahre">🎂 ' + alterText(u) + '</span>' +
      '<h3>' + u.titel + '</h3>' +
      '<p class="lektiontext">' + u.beschreibung + '</p>' +
      '<div class="lektionstand"><span>🧩 ' + standText(holeStand(u.id)) + '</span></div>';

    const reihe = element('div', 'lektionknoepfe');
    const knopf = element('button', 'gross');
    knopf.textContent = 'Üben 🧩';
    knopf.dataset.uebung = u.id;
    knopf.onclick = function () { zeigeEinfuehrung(u); };
    reihe.appendChild(knopf);
    karte.appendChild(reihe);
    kasten.appendChild(karte);
  }
  zeigeBildschirm('uebersicht');
}

/* ============================================================
   EINFÜHRUNG: Lernziel, Tipps, Stufe, Uhr
   ============================================================ */

function klasseZurStufe(stufe) {
  return stufe <= 2 ? 3 : (stufe <= 4 ? 4 : (stufe <= 6 ? 5 : 6));
}

function zeigeEinfuehrung(u) {
  LAUF.uebung = u;
  LAUF.gruppe = u.gruppe;
  const stand = holeStand(u.id);
  LAUF.stufe = klemmeStufe(stand.stufe);
  const neu = !stand.aufgaben && !stand.runden;

  $('einfTitel').textContent = u.symbol + ' ' + u.titel;
  $('einfLernziel').textContent = u.lernziel;
  $('einfAlter').textContent = 'Gedacht für ' + alterText(u) + ' – die Stufe passt sich an dich an.';
  $('einfBeispiel').innerHTML = u.beispiel ? u.beispiel() : '';
  zeichneTipps();

  zeige('einfKlasseBox', neu);
  if (neu) {
    // Wer sein Alter schon gewählt hat, fängt gleich passend an
    const klasse = klasseFuerAlter(LAUF.alter);
    if (klasse) LAUF.stufe = startStufeFuerKlasse(klasse);
    zeichneKlassenwahl(klasse);
  }

  zeige('einfPaartypBox', !!u.paartypen);
  if (u.paartypen) zeichnePaartypen();

  zeichneUhrKnopf();
  zeichneStufenleiste();
  zeigeBildschirm('einfuehrung');
}

function zeichneTipps() {
  const u = LAUF.uebung;
  const liste = $('einfTipps');
  liste.innerHTML = '';
  const tipps = u.tipps.slice();
  for (const ab of Object.keys(u.tippAbStufe || {})) {
    if (LAUF.stufe >= Number(ab)) tipps.push(u.tippAbStufe[ab]);
  }
  for (const t of tipps) {
    const li = element('li');
    li.textContent = t;
    liste.appendChild(li);
  }
}

function zeichneKlassenwahl(gewaehlt) {
  const leiste = $('einfKlasse');
  leiste.innerHTML = '';
  for (const k of [3, 4, 5, 6]) {
    const knopf = element('button', 'wahl' + (k === gewaehlt ? ' aktiv' : ''));
    knopf.innerHTML = k + '. Klasse <small>(' + KLASSE_ALTER[k] + ' Jahre)</small>';
    knopf.dataset.klasse = String(k);
    knopf.onclick = function () {
      LAUF.stufe = startStufeFuerKlasse(k);
      zeichneKlassenwahl(k);
      zeichneStufenleiste();
      zeichneTipps();
    };
    leiste.appendChild(knopf);
  }
}

function zeichnePaartypen() {
  const leiste = $('einfPaartyp');
  leiste.innerHTML = '';
  for (const p of LAUF.uebung.paartypen) {
    const knopf = element('button', 'wahl' + (p.id === LAUF.paartyp ? ' aktiv' : ''));
    knopf.textContent = p.text;
    knopf.dataset.paartyp = p.id;
    knopf.onclick = function () { LAUF.paartyp = p.id; zeichnePaartypen(); };
    leiste.appendChild(knopf);
  }
}

function zeichneStufenleiste() {
  const leiste = $('einfStufen');
  leiste.innerHTML = '';
  for (let s = STUFE_MIN; s <= STUFE_MAX; s++) {
    leiste.appendChild(element('span', 'stufenpunkt' + (s <= LAUF.stufe ? ' an' : ''), String(s)));
  }
  $('einfStufeText').textContent = 'Du übst auf Stufe ' + LAUF.stufe + ' von ' + STUFE_MAX +
    ' (passt etwa zur ' + klasseZurStufe(LAUF.stufe) + '. Klasse). Die Stufe passt sich beim Üben an.';
}

function zeichneUhrKnopf() {
  const knopf = $('einfUhr');
  knopf.textContent = LAUF.mitUhr ? '⏱️ Mit Uhr: an' : '⏱️ Mit Uhr: aus';
  knopf.classList.toggle('aktiv', LAUF.mitUhr);
  $('einfUhrText').textContent = LAUF.mitUhr
    ? 'Jede Aufgabe hat eine Zeit. Beim Merken siehst du die Figuren etwas kürzer.'
    : 'Ohne Uhr hast du so viel Zeit, wie du brauchst.';
}

/* ============================================================
   EINE RUNDE
   ============================================================ */

function starteRunde() {
  const u = LAUF.uebung;
  stoppeAlles();
  LAUF.stufeStart = LAUF.stufe;
  LAUF.verlauf = [];
  LAUF.hilfeModus = false;
  LAUF.nummer = 0;
  LAUF.richtig = 0;
  LAUF.serie = 0;
  LAUF.fehlversuche = 0;
  LAUF.rueckblick = [];
  LAUF.gesamt = u.rundenLaenge(LAUF.stufe);
  LAUF.start = Date.now();

  $('aufgabeTitel').textContent = u.symbol + ' ' + u.titel;
  $('aufgabeAnzahl').textContent = LAUF.gesamt;
  naechsteAufgabe();
  zeigeBildschirm('aufgabe');
}

function setzeWeiter(text, modus, sichtbar, aktiv) {
  const knopf = $('aufgabeWeiter');
  knopf.textContent = text || '';
  knopf.dataset.modus = modus || '';
  knopf.classList.toggle('versteckt', !sichtbar);
  knopf.disabled = aktiv === false;
}

function naechsteAufgabe() {
  stoppeAlles();
  const u = LAUF.uebung;
  LAUF.nummer += 1;
  LAUF.aufgabe = u.macheAufgabe(LAUF.stufe, { paartyp: LAUF.paartyp });
  LAUF.antwort = null;
  LAUF.phase = 'antworten';

  $('aufgabeNummer').textContent = LAUF.nummer;
  $('aufgabeStufe').textContent = LAUF.stufe;
  $('aufgabeBalken').style.width = Math.round(((LAUF.nummer - 1) / LAUF.gesamt) * 100) + '%';
  $('aufgabeFrage').textContent = LAUF.aufgabe.frage;
  setzeMeldung('');
  $('aufgabeStufeInfo').textContent = '';
  zeige('aufgabeErklaerung', false);
  zeige('aufgabeRueckgaengig', false);
  zeige('aufgabeNochmal', false);
  zeige('aufgabeZeit', false);

  $('aufgabeHilfe').textContent = LAUF.hilfeModus ? '💡 Tipp: ' + u.tipps[0] : '';
  zeige('aufgabeHilfe', LAUF.hilfeModus);

  $('aufgabeAnzeige').innerHTML = '';
  $('aufgabeAnzeige').className = 'anzeige';
  $('aufgabeAntwort').innerHTML = '';
  $('aufgabeAntwort').className = '';
  setzeWeiter('', '', false);

  RENDERER[LAUF.aufgabe.art].baue(LAUF.aufgabe);
  if (LAUF.phase === 'antworten') starteUhr();
}

/* ---------------- Die Uhr (nur wenn eingeschaltet) ---------------- */

function starteUhr() {
  stoppeUhr();
  if (!LAUF.mitUhr) return;
  LAUF.zeitGesamt = LAUF.uebung.zeitMitUhr(LAUF.aufgabe);
  LAUF.zeitRest = LAUF.zeitGesamt;
  zeige('aufgabeZeit', true);
  zeigeZeit();
  LAUF.uhr = setInterval(function () {
    LAUF.zeitRest -= 1;
    zeigeZeit();
    if (LAUF.zeitRest <= 0) zeitAbgelaufen();
  }, 1000);
}

function zeigeZeit() {
  const anteil = LAUF.zeitGesamt ? Math.max(0, LAUF.zeitRest) / LAUF.zeitGesamt : 0;
  $('aufgabeZeitBalken').style.width = Math.round(anteil * 100) + '%';
  $('aufgabeZeit').classList.toggle('knapp', anteil <= 0.25);
}

function zeitAbgelaufen() {
  stoppeUhr();
  if (LAUF.phase !== 'antworten') return;
  const r = RENDERER[LAUF.aufgabe.art];
  antwortAbgeben(r.stand ? r.stand() : null, true);
}

/* ---------------- Antwort prüfen ---------------- */

function fehlerTextFuer(aufgabe, antwort) {
  if (aufgabe.art === 'auswahl') {
    const o = aufgabe.optionen.filter(function (x) { return x.id === antwort; })[0];
    if (o && o.fehlerText) return o.fehlerText;
  }
  const u = LAUF.uebung;
  return (u.fehlerText && u.fehlerText(aufgabe, antwort)) || 'Nicht ganz.';
}

function antwortAbgeben(antwort, zeitUm) {
  if (LAUF.phase !== 'antworten') return;
  LAUF.phase = 'geprueft';
  stoppeAlles();

  const u = LAUF.uebung;
  const a = LAUF.aufgabe;
  LAUF.antwort = antwort;
  const ergebnis = zeitUm ? 'falsch' : pruefeAufgabe(a, antwort);
  let falschThemen = [];

  if (a.art === 'paare' && antwort) LAUF.fehlversuche += antwort.fehlversuche || 0;

  if (ergebnis === 'richtig') {
    LAUF.richtig += 1;
    LAUF.serie += 1;
    let zusatz = '';
    if (a.art === 'paare') {
      zusatz = ' Geschafft mit ' + antwort.fehlversuche + ' Fehlversuch' + (antwort.fehlversuche === 1 ? '' : 'en') + '!';
    } else if (a.art === 'antippen') {
      zusatz = ' Geschafft' + (antwort.sekunden ? ' in ' + antwort.sekunden + ' Sekunden' : '') + ' mit ' +
               antwort.fehlgriffe + ' Fehlgriff' + (antwort.fehlgriffe === 1 ? '' : 'en') + '!';
    }
    setzeMeldung(lobText(LAUF.serie) + zusatz, 'richtig');
    $('aufgabeErklaerung').textContent = '💡 ' + (a.richtigText || a.erklaerung);
  } else if (ergebnis === 'neutral') {
    setzeMeldung('👍 Geschafft – mit ' + antwort.fehlversuche + ' Fehlversuchen. Beim nächsten Mal klappt es mit weniger!', 'tipp');
    $('aufgabeErklaerung').textContent = '💡 ' + a.erklaerung;
  } else {
    LAUF.serie = 0;
    setzeMeldung(zeitUm ? '⏰ Die Zeit ist um!' : '❌ ' + fehlerTextFuer(a, antwort), 'falsch');
    $('aufgabeErklaerung').textContent = '💡 ' + a.erklaerung + (a.merksatz ? '\n📌 ' + a.merksatz : '');
    if (a.art === 'auswahl') {
      const o = a.optionen.filter(function (x) { return x.id === antwort; })[0];
      falschThemen = o ? (o.falschThemen || []) : [];
    }
  }
  zeige('aufgabeErklaerung', true);

  // Die Stufe anpassen (beim Memory zählt „neutral“ nicht)
  let info = '';
  if (ergebnis !== 'neutral') {
    LAUF.verlauf.push(ergebnis === 'richtig');
    const neu = naechsteStufe(LAUF.stufe, LAUF.verlauf);
    LAUF.stufe = neu.stufe;
    LAUF.verlauf = neu.verlauf;
    info = stufenText(neu.aenderung, neu.stufe);
    if (neu.amBoden && !LAUF.hilfeModus) {
      LAUF.hilfeModus = true;
      info = 'Ab jetzt bekommst du vor jeder Aufgabe einen Tipp. 💡';
    }
  }
  $('aufgabeStufeInfo').textContent = info;

  speichereKonzentrationsAufgabe(u.id, LAUF.stufe, ergebnis === 'richtig', a.stufe);
  const alt = holeStand(u.id);
  merkeGast(u.id, {
    stufe: LAUF.stufe,
    aufgaben: alt.aufgaben + 1,
    richtig: alt.richtig + (ergebnis === 'richtig' ? 1 : 0),
    hoechsteStufe: ergebnis === 'richtig' ? Math.max(alt.hoechsteStufe, a.stufe) : alt.hoechsteStufe
  });

  LAUF.rueckblick.push({
    nr: LAUF.nummer, stufe: a.stufe, ergebnis: ergebnis, frage: a.frage,
    erklaerung: a.erklaerung, themen: a.themen || [], falschThemen: falschThemen
  });

  RENDERER[a.art].sperre(a, antwort, ergebnis);
  zeige('aufgabeRueckgaengig', false);
  setzeWeiter(LAUF.nummer >= LAUF.gesamt ? 'Zur Auswertung ✓' : 'Nächste Aufgabe →', 'weiter', true, true);
  if ($('aufgabeWeiter').focus) $('aufgabeWeiter').focus();
}

function weiterGeklickt() {
  const knopf = $('aufgabeWeiter');
  if (knopf.disabled || knopf.classList.contains('versteckt')) return;
  const modus = knopf.dataset.modus;
  if (modus === 'pruefen') {
    RENDERER[LAUF.aufgabe.art].abgeben();
  } else if (modus === 'weiter') {
    if (LAUF.nummer >= LAUF.gesamt) beendeRunde();
    else naechsteAufgabe();
  }
}

/* ============================================================
   DIE VIER ARTEN, EINE AUFGABE ZU ZEIGEN
   ============================================================ */

const RENDERER = {};

/* ---------- Auswahl: Bilder ansehen, eine Möglichkeit antippen ---------- */
RENDERER.auswahl = {
  baue: function (a) {
    const anzeige = $('aufgabeAnzeige');
    const layout = a.anzeige.layout || 'keine';
    anzeige.className = 'anzeige ' + layout;

    if (layout === 'reihe') {
      for (const svg of a.anzeige.bilder) anzeige.appendChild(element('div', 'feld', svg));
      anzeige.appendChild(element('div', 'feld luecke', '?'));
    } else if (layout === 'matrix') {
      for (const svg of a.anzeige.bilder) {
        anzeige.appendChild(svg ? element('div', 'feld', svg) : element('div', 'feld luecke', '?'));
      }
    } else if (layout === 'bild') {
      anzeige.appendChild(element('div', 'grossbild', a.anzeige.bild));
    } else if (layout === 'karten') {
      a.anzeige.bilder.forEach(function (svg, i) {
        const b = (a.anzeige.beschriftungen || [])[i];
        anzeige.appendChild(element('figure', 'kartenbild', svg + (b ? '<figcaption>' + b + '</figcaption>' : '')));
      });
    } else if (layout === 'vorlage') {
      a.anzeige.bilder.forEach(function (svg, i) {
        const b = (a.anzeige.beschriftungen || [])[i];
        anzeige.appendChild(element('figure', 'vorlagebild', svg + (b ? '<figcaption>' + b + '</figcaption>' : '')));
      });
    }

    const box = $('aufgabeAntwort');
    box.className = 'optionen anzahl-' + a.optionen.length;
    for (const o of a.optionen) {
      const knopf = element('button', 'option' + (o.svg ? '' : ' nurtext'),
        (o.svg || '') + (o.text ? '<span class="optiontext">' + o.text + '</span>' : ''));
      knopf.dataset.id = o.id;
      knopf.onclick = function () {
        if (knopf.disabled || LAUF.phase !== 'antworten') return;
        antwortAbgeben(o.id);
      };
      box.appendChild(knopf);
    }
  },
  stand: function () { return null; },
  sperre: function (a, antwort) {
    for (const knopf of $('aufgabeAntwort').children) {
      knopf.disabled = true;
      if (knopf.dataset.id === a.richtig) knopf.classList.add('richtig');
      else if (knopf.dataset.id === antwort) knopf.classList.add('falsch');
    }
  }
};

/* ---------- Gitter: Felder antippen (Gitter merken, Spiegeln) ---------- */
function gitterZelle(x, y) {
  for (const z of $('aufgabeAntwort').children) {
    if (Number(z.dataset.x) === x && Number(z.dataset.y) === y) return z;
  }
  return null;
}

RENDERER.gitter = {
  baue: function (a) {
    const z = a.anzeige;
    const box = $('aufgabeAntwort');
    box.className = 'gitter breite-' + z.breite + (z.inhalte ? ' mitinhalt' : '');
    box.style.gridTemplateColumns = 'repeat(' + z.breite + ', 1fr)';
    LAUF.antwort = [];

    // Fehlerbild: oben die Vorlage zum Vergleichen
    if (z.vergleich) {
      const anzeige = $('aufgabeAnzeige');
      anzeige.className = 'anzeige vergleich';
      const bild = element('figure', 'vergleichsbild');
      const mini = element('div', 'minigitter breite-' + z.vergleich.breite);
      mini.style.gridTemplateColumns = 'repeat(' + z.vergleich.breite + ', 1fr)';
      for (const svg of z.vergleich.inhalte) mini.appendChild(element('div', 'minizelle', svg));
      bild.appendChild(mini);
      bild.appendChild(element('figcaption', '', z.vergleich.titel));
      anzeige.appendChild(bild);
    }

    for (let y = 0; y < z.hoehe; y++) {
      for (let x = 0; x < z.breite; x++) {
        const vorgabe = enthaeltZelle(z.vorgabe, x, y);
        let klasse = 'zelle' + (vorgabe ? ' vorgabe' : '');
        if (z.achse === 'senkrecht' && x === z.breite / 2 - 1) klasse += ' achse-rechts';
        if (z.achse === 'waagerecht' && y === z.hoehe / 2 - 1) klasse += ' achse-unten';
        if (z.achse === 'diagonal' && x === y) klasse += ' achse-diag';
        if (z.achse === 'gegendiagonal' && x + y === z.breite - 1) klasse += ' achse-gegen';
        const knopf = element('button', klasse, z.inhalte ? z.inhalte[y * z.breite + x] : undefined);
        knopf.dataset.x = String(x);
        knopf.dataset.y = String(y);
        knopf.disabled = vorgabe;
        knopf.setAttribute && knopf.setAttribute('aria-label', 'Zeile ' + (y + 1) + ', Spalte ' + (x + 1));
        knopf.onclick = function () {
          if (vorgabe || LAUF.phase !== 'antworten') return;
          const i = LAUF.antwort.findIndex(function (c) { return c.x === x && c.y === y; });
          if (i === -1) LAUF.antwort.push({ x: x, y: y });
          else LAUF.antwort.splice(i, 1);
          knopf.classList.toggle('an', i === -1);
          RENDERER.gitter.zaehle();
        };
        box.appendChild(knopf);
      }
    }

    if (z.zeigeZuerst && z.zeigeZuerst.length) {
      // Erst zeigen, dann verstecken, dann antippen
      LAUF.phase = 'zeigen';
      for (const k of box.children) k.disabled = true;
      setzeMeldung('👀 Gut aufpassen!', 'tipp');
      spaeter(function () {
        for (const c of z.zeigeZuerst) gitterZelle(c.x, c.y).classList.add('leuchtet');
        spaeter(function () {
          for (const c of z.zeigeZuerst) gitterZelle(c.x, c.y).classList.remove('leuchtet');
          for (const k of box.children) k.disabled = false;
          LAUF.phase = 'antworten';
          RENDERER.gitter.zaehle();
          setzeWeiter('Prüfen ✓', 'pruefen', true, true);
          starteUhr();
        }, merkzeit(z.merkzeit, 1500));
      }, 600);
    } else {
      RENDERER.gitter.zaehle();
      setzeWeiter('Prüfen ✓', 'pruefen', true, true);
    }
  },
  zaehle: function () {
    const z = LAUF.aufgabe.anzeige;
    const n = LAUF.antwort.length;
    let text;
    if (z.zeigeZuerst && z.zeigeZuerst.length) text = 'Du suchst ' + z.ziel + ' Felder – ' + n + ' markiert.';
    else if (z.ziel === null || z.ziel === undefined) text = 'Markiert: ' + n + (n === 1 ? ' Feld.' : ' Felder.');
    else text = 'Markiert: ' + n + ' von ' + z.ziel + ' Feldern.';
    setzeMeldung(text, 'tipp');
  },
  stand: function () {
    return LAUF.aufgabe.anzeige.vorgabe.concat(LAUF.antwort || []);
  },
  abgeben: function () {
    if (!LAUF.antwort.length) {
      setzeMeldung('Tippe erst die Felder an.', 'tipp');
      return;
    }
    antwortAbgeben(RENDERER.gitter.stand());
  },
  sperre: function (a, antwort) {
    const ist = antwort || [];
    for (const knopf of $('aufgabeAntwort').children) {
      const x = Number(knopf.dataset.x), y = Number(knopf.dataset.y);
      knopf.disabled = true;
      if (enthaeltZelle(a.anzeige.vorgabe, x, y)) continue;
      const soll = enthaeltZelle(a.richtig, x, y);
      const hat = enthaeltZelle(ist, x, y);
      const zeichen = soll && hat ? '✓' : (hat ? '✗' : (soll ? '○' : ''));
      if (soll && hat) knopf.classList.add('treffer');
      else if (hat) knopf.classList.add('zuviel');
      else if (soll) knopf.classList.add('vergessen');
      if (!zeichen) continue;
      // Mit Bild im Feld bleibt das Bild stehen, das Zeichen kommt als Marke dazu
      if (a.anzeige.inhalte) knopf.innerHTML = knopf.innerHTML + '<span class="marke">' + zeichen + '</span>';
      else knopf.textContent = zeichen;
    }
  }
};

/* ---------- Folge: Figuren nacheinander ansehen, dann antippen ---------- */
RENDERER.folge = {
  taste: function (id) {
    return LAUF.aufgabe.anzeige.tasten.filter(function (t) { return t.id === id; })[0];
  },
  spiele: function (buehne, ms, pause, fertig) {
    const folge = LAUF.aufgabe.anzeige.folge;
    const schritt = function (i) {
      if (i >= folge.length) { buehne.innerHTML = ''; buehne.dataset.zeigt = ''; if (fertig) fertig(); return; }
      buehne.innerHTML = RENDERER.folge.taste(folge[i]).svg;
      buehne.dataset.zeigt = folge[i];
      buehne.classList.add('blitz');
      spaeter(function () {
        buehne.innerHTML = '';
        buehne.dataset.zeigt = '';
        buehne.classList.remove('blitz');
        spaeter(function () { schritt(i + 1); }, pause);
      }, ms);
    };
    schritt(0);
  },
  baue: function (a) {
    const z = a.anzeige;
    const anzeige = $('aufgabeAnzeige');
    anzeige.className = 'anzeige folge';
    const buehne = element('div', 'folgebuehne');
    anzeige.appendChild(buehne);
    LAUF.buehne = buehne;

    const box = $('aufgabeAntwort');
    box.className = 'folgeantwort';
    const gewaehlt = element('div', 'gewaehlt');
    const pad = element('div', 'pad versteckt');
    box.appendChild(gewaehlt);
    box.appendChild(pad);
    LAUF.gewaehlt = gewaehlt;
    LAUF.pad = pad;
    LAUF.antwort = [];

    for (const t of z.tasten) {
      const knopf = element('button', 'taste', t.svg + (z.beschriften ? '<small>' + t.name + '</small>' : ''));
      knopf.dataset.id = t.id;
      knopf.onclick = function () {
        if (LAUF.phase !== 'antworten' || LAUF.antwort.length >= a.richtig.length) return;
        LAUF.antwort.push(t.id);
        RENDERER.folge.zeigeGewaehlt();
      };
      pad.appendChild(knopf);
    }

    LAUF.phase = 'zeigen';
    setzeMeldung('👀 Gut aufpassen!', 'tipp');
    const ms = merkzeit(z.zeigeMs, 500);
    const pause = merkzeit(z.pauseMs, 200);
    spaeter(function () {
      RENDERER.folge.spiele(buehne, ms, pause, function () {
        pad.classList.remove('versteckt');
        LAUF.phase = 'antworten';
        setzeMeldung('Jetzt du! Tippe die ' + a.richtig.length + ' Figuren' +
                     (z.rueckwaerts ? ' rückwärts – die letzte zuerst.' : ' in derselben Reihenfolge.'), 'tipp');
        RENDERER.folge.zeigeGewaehlt();
        starteUhr();
      });
    }, 600);
  },
  zeigeGewaehlt: function () {
    const a = LAUF.aufgabe;
    LAUF.gewaehlt.innerHTML = '';
    for (const id of LAUF.antwort) {
      const t = RENDERER.folge.taste(id);
      const feld = element('span', 'gewaehltfeld', t.svg);
      feld.dataset.id = id;
      LAUF.gewaehlt.appendChild(feld);
    }
    for (let i = LAUF.antwort.length; i < a.richtig.length; i++) {
      LAUF.gewaehlt.appendChild(element('span', 'gewaehltfeld leer', String(i + 1)));
    }
    zeige('aufgabeRueckgaengig', LAUF.phase === 'antworten' && LAUF.antwort.length > 0);
    setzeWeiter('Prüfen ✓', 'pruefen', true, LAUF.antwort.length === a.richtig.length);
  },
  rueckgaengig: function () {
    if (LAUF.phase !== 'antworten' || !LAUF.antwort.length) return;
    LAUF.antwort.pop();
    RENDERER.folge.zeigeGewaehlt();
  },
  stand: function () { return (LAUF.antwort || []).slice(); },
  abgeben: function () {
    const fehlen = LAUF.aufgabe.richtig.length - LAUF.antwort.length;
    if (fehlen > 0) {
      setzeMeldung('Es fehl' + (fehlen === 1 ? 't noch eine Figur.' : 'en noch ' + fehlen + ' Figuren.'), 'tipp');
      return;
    }
    antwortAbgeben(LAUF.antwort.slice());
  },
  sperre: function (a, antwort, ergebnis) {
    for (const knopf of LAUF.pad.children) knopf.disabled = true;
    const felder = LAUF.gewaehlt.children;
    for (let i = 0; i < felder.length; i++) {
      if (felder[i].classList.contains('leer')) continue;
      felder[i].classList.add(felder[i].dataset.id === a.richtig[i] ? 'stimmt' : 'stimmtnicht');
    }
    if (ergebnis !== 'richtig') zeige('aufgabeNochmal', true);
  },
  nochmal: function () {
    stoppeAlles();
    RENDERER.folge.spiele(LAUF.buehne, 1500, 400, null);
  }
};

/* ---------- Antippen: Felder der Reihe nach (Zahlentabelle) ---------- */
RENDERER.antippen = {
  feld: function (id) {
    return LAUF.aufgabe.anzeige.felder.filter(function (f) { return f.id === id; })[0];
  },
  baue: function (a) {
    const z = a.anzeige;
    const box = $('aufgabeAntwort');
    box.className = 'zahlentafel breite-' + z.breite;
    box.style.gridTemplateColumns = 'repeat(' + z.breite + ', 1fr)';
    $('aufgabeAnzeige').className = 'anzeige keine';
    LAUF.antwort = { schritt: 0, fehlgriffe: 0, start: Date.now() };

    for (const f of z.felder) {
      const knopf = element('button', 'zahlfeld' + (f.sorte ? ' sorte-' + f.sorte : ''));
      knopf.textContent = f.text;
      knopf.dataset.id = f.id;
      knopf.setAttribute('aria-label', f.name);
      knopf.onclick = function () { RENDERER.antippen.tippe(f, knopf); };
      box.appendChild(knopf);
    }
    RENDERER.antippen.melde();
  },
  tippe: function (f, knopf) {
    const st = LAUF.antwort;
    const a = LAUF.aufgabe;
    if (LAUF.phase !== 'antworten' || knopf.disabled) return;

    if (f.id === a.richtig[st.schritt]) {
      st.schritt += 1;
      if (a.anzeige.markieren) {
        knopf.classList.add('erledigt');
        knopf.disabled = true;
      } else {
        knopf.classList.add('getroffen');
        spaeter(function () { knopf.classList.remove('getroffen'); }, 250);
      }
      if (st.schritt === a.richtig.length) {
        antwortAbgeben({ fehlgriffe: st.fehlgriffe, fertig: true, sekunden: RENDERER.antippen.sekunden() });
        return;
      }
    } else {
      st.fehlgriffe += 1;
      knopf.classList.add('daneben');
      spaeter(function () { knopf.classList.remove('daneben'); }, 400);
    }
    RENDERER.antippen.melde();
  },
  sekunden: function () {
    return Math.max(1, Math.round((Date.now() - LAUF.antwort.start) / 1000));
  },
  melde: function () {
    const a = LAUF.aufgabe;
    const st = LAUF.antwort;
    const naechstes = RENDERER.antippen.feld(a.richtig[st.schritt]);
    setzeMeldung((a.anzeige.zeigeZiel && naechstes ? 'Gesucht: ' + naechstes.name + ' · ' : '') +
                 'Fehlgriffe: ' + st.fehlgriffe + ' (erlaubt: ' + a.erlaubt + ')',
                 st.fehlgriffe > a.erlaubt ? 'falsch' : 'tipp');
  },
  stand: function () {
    const st = LAUF.antwort;
    return { fehlgriffe: st.fehlgriffe, fertig: false, geschafft: st.schritt, sekunden: RENDERER.antippen.sekunden() };
  },
  sperre: function (a, antwort) {
    const naechstes = antwort && !antwort.fertig ? a.richtig[antwort.geschafft || 0] : null;
    for (const knopf of $('aufgabeAntwort').children) {
      knopf.disabled = true;
      if (knopf.dataset.id === naechstes) knopf.classList.add('vergessen');
    }
  }
};

/* ---------- Paare: Memory ---------- */
RENDERER.paare = {
  karte: function (id) {
    return LAUF.aufgabe.anzeige.karten.filter(function (k) { return k.id === id; })[0];
  },
  vorderseite: function (k) {
    return k.svg ? k.svg : '<span class="mtext"' + (k.sprache ? ' lang="' + k.sprache + '"' : '') + '>' +
                           textSicher(k.text) + '</span>';
  },
  knopf: function (id) {
    for (const k of $('aufgabeAntwort').children) if (k.dataset.id === id) return k;
    return null;
  },
  baue: function (a) {
    const box = $('aufgabeAntwort');
    box.className = 'memory spalten-' + a.anzeige.spalten;
    box.style.gridTemplateColumns = 'repeat(' + a.anzeige.spalten + ', 1fr)';
    $('aufgabeAnzeige').className = 'anzeige keine';
    LAUF.antwort = { offen: [], gefunden: [], fehlversuche: 0, fertig: false, gesperrt: false };

    for (const k of a.anzeige.karten) {
      const knopf = element('button', 'mkarte', '<span class="rueckseite">?</span>');
      knopf.dataset.id = k.id;
      knopf.dataset.paar = k.paarId;
      knopf.onclick = function () { RENDERER.paare.drehe(k, knopf); };
      box.appendChild(knopf);
    }
    setzeMeldung('Fehlversuche: 0', 'tipp');
  },
  drehe: function (k, knopf) {
    const st = LAUF.antwort;
    if (LAUF.phase !== 'antworten' || st.gesperrt) return;
    if (st.gefunden.indexOf(k.paarId) !== -1 || st.offen.indexOf(k.id) !== -1) return;

    knopf.classList.add('offen');
    knopf.innerHTML = RENDERER.paare.vorderseite(k);
    st.offen.push(k.id);
    if (st.offen.length < 2) return;

    const k1 = RENDERER.paare.karte(st.offen[0]);
    const k2 = RENDERER.paare.karte(st.offen[1]);
    const b1 = RENDERER.paare.knopf(k1.id), b2 = RENDERER.paare.knopf(k2.id);

    if (k1.paarId === k2.paarId) {
      st.gefunden.push(k1.paarId);
      st.offen = [];
      for (const b of [b1, b2]) { b.classList.add('gefunden'); b.disabled = true; }
      if (st.gefunden.length === LAUF.aufgabe.anzeige.paare) {
        st.fertig = true;
        antwortAbgeben({ fehlversuche: st.fehlversuche, fertig: true });
        return;
      }
      setzeMeldung('✅ Ein Paar! Fehlversuche: ' + st.fehlversuche, 'richtig');
      return;
    }

    st.fehlversuche += 1;
    st.gesperrt = true;
    setzeMeldung(memoryFehlgriffText(k1, k2) + ' (Fehlversuche: ' + st.fehlversuche + ')', 'tipp');
    spaeter(function () {
      for (const b of [b1, b2]) {
        b.classList.remove('offen');
        b.innerHTML = '<span class="rueckseite">?</span>';
      }
      st.offen = [];
      st.gesperrt = false;
    }, 1200);
  },
  stand: function () {
    return { fehlversuche: LAUF.antwort.fehlversuche, fertig: false, zeitUm: true };
  },
  sperre: function (a) {
    for (const knopf of $('aufgabeAntwort').children) {
      const k = RENDERER.paare.karte(knopf.dataset.id);
      knopf.disabled = true;
      knopf.classList.add('offen');
      knopf.innerHTML = RENDERER.paare.vorderseite(k);
    }
  }
};

/* ============================================================
   ERGEBNIS
   ============================================================ */

function beendeRunde() {
  stoppeAlles();
  const u = LAUF.uebung;
  const dauerSek = Math.round((Date.now() - LAUF.start) / 1000);

  speichereKonzentrationsRunde(u.id, {
    stufe: LAUF.stufe, richtig: LAUF.richtig, gesamt: LAUF.gesamt, dauerSek: dauerSek, mitUhr: LAUF.mitUhr
  });
  merkeGast(u.id, { stufe: LAUF.stufe, runden: holeStand(u.id).runden + 1, zuletzt: heute() });

  const vorher = LAUF.stufeStart, nachher = LAUF.stufe;
  $('ergebnisStufe').textContent = nachher > vorher ? 'Stufe ' + vorher + ' → ' + nachher + ' ⬆️'
    : (nachher < vorher ? 'Stufe ' + vorher + ' → ' + nachher + ' – hier übst du weiter'
                        : 'Stufe ' + nachher + ' (gehalten)');

  $('ergebnisPunkte').textContent = u.id === 'memory'
    ? LAUF.gesamt + ' Runde' + (LAUF.gesamt === 1 ? '' : 'n') + ', ' + LAUF.fehlversuche + ' Fehlversuche'
    : LAUF.richtig + ' von ' + LAUF.gesamt + ' richtig';
  $('ergebnisReflexion').textContent = reflexionsText(LAUF.rueckblick);

  let zusatz = '';
  if (LAUF.mitUhr) {
    const min = Math.floor(dauerSek / 60), sek = dauerSek % 60;
    zusatz = '⏱️ Gebraucht: ' + (min > 0 ? min + ' min ' : '') + sek + ' s. ';
  }
  if (!aktivesProfil()) zusatz += 'Als Gast wird die Stufe nicht gespeichert.';
  $('ergebnisZusatz').textContent = zusatz;

  const ol = $('ergebnisRueckblick');
  ol.innerHTML = '';
  for (const r of LAUF.rueckblick) {
    const li = element('li', r.ergebnis === 'richtig' ? 'war-richtig' : (r.ergebnis === 'neutral' ? 'war-neutral' : 'war-falsch'));
    li.innerHTML =
      '<span class="rueckFrage">' + (r.ergebnis === 'richtig' ? '✅' : (r.ergebnis === 'neutral' ? '👍' : '❌')) +
      ' Aufgabe ' + r.nr + ' (Stufe ' + r.stufe + ')</span>' +
      '<span class="rueckAntwort">' + textSicher(r.erklaerung) + '</span>';
    ol.appendChild(li);
  }
  zeigeBildschirm('ergebnis');
}

/* ============================================================
   LOSLEGEN
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const hash = String(location.hash || '').replace('#', '');
  if (findeGruppe(hash)) LAUF.gruppe = hash;
  LAUF.alter = holeKonzentrationsAlter();

  $('einfUhr').onclick = function () { LAUF.mitUhr = !LAUF.mitUhr; zeichneUhrKnopf(); };
  $('einfLos').onclick = starteRunde;
  $('einfZurueck').onclick = zeichneUebersicht;

  $('aufgabeWeiter').onclick = weiterGeklickt;
  $('aufgabeRueckgaengig').onclick = function () { RENDERER.folge.rueckgaengig(); };
  $('aufgabeNochmal').onclick = function () { RENDERER.folge.nochmal(); };
  $('aufgabeAbbrechen').onclick = function () {
    if (!confirm('Runde wirklich abbrechen? Deine Stufe ist schon gespeichert.')) return;
    stoppeAlles();
    zeichneUebersicht();
  };

  $('ergebnisNochmal').onclick = starteRunde;
  $('ergebnisAndere').onclick = zeichneUebersicht;
  $('ergebnisStart').onclick = function () { location.href = '../index.html'; };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && $('aufgabe').classList.contains('aktiv')) weiterGeklickt();
  });

  zeichneUebersicht();

  // Direkt eine Übung öffnen: konzentration/index.html#merkfolge
  const direkt = findeUebung(hash);
  if (direkt) zeigeEinfuehrung(direkt);
});
