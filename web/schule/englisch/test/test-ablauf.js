/* Test für den Ablauf: Üben, Vokabeltest und Lernbox.
   Wir bauen einen winzigen Fake-Browser und spielen alles durch. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const GETEILT = path.join(__dirname, '..', '..', '..', 'shared') + path.sep;

let fehler = 0;
function pruefe(b, text) {
  if (b) console.log('  ✅ ' + text);
  else { console.log('  ❌ ' + text); fehler++; }
}
function gleich(ist, soll, text) {
  pruefe(JSON.stringify(ist) === JSON.stringify(soll),
         text + '  (ist: ' + JSON.stringify(ist) + ', soll: ' + JSON.stringify(soll) + ')');
}

/* ---------------- Mini-DOM ---------------- */
function baueFakeBrowser() {
  const alle = [];
  const nachId = {};

  function neuesElement(tag) {
    const klassen = new Set();
    const attribute = {};
    const el = {
      tagName: (tag || 'DIV').toUpperCase(),
      id: '', children: [], parent: null, _html: '',
      textContent: '', value: '', placeholder: '', type: '', lang: '',
      disabled: false, autocomplete: '', inputMode: '', title: '',
      style: {}, dataset: {}, onclick: null, _hoerer: {},
      get className() { return [...klassen].join(' '); },
      set className(v) {
        klassen.clear();
        String(v).split(/\s+/).filter(Boolean).forEach((c) => klassen.add(c));
      },
      classList: {
        add: (...c) => c.forEach((x) => klassen.add(x)),
        remove: (...c) => c.forEach((x) => klassen.delete(x)),
        contains: (c) => klassen.has(c),
        toggle: (c, an) => {
          if (an === undefined) an = !klassen.has(c);
          an ? klassen.add(c) : klassen.delete(c);
          return an;
        }
      },
      setAttribute(name, wert) { attribute[name] = String(wert); },
      getAttribute(name) { return attribute[name] === undefined ? null : attribute[name]; },
      get innerHTML() { return el._html; },
      set innerHTML(v) { el._html = String(v); if (v === '') el.children = []; },
      appendChild(k) { k.parent = el; el.children.push(k); return k; },
      addEventListener(art, fn) { el._hoerer[art] = fn; },
      querySelectorAll(sel) {
        const treffer = [];
        (function suche(n) {
          for (const k of n.children) {
            if (sel.startsWith('.') ? k.classList.contains(sel.slice(1))
                                    : k.tagName === sel.toUpperCase()) treffer.push(k);
            suche(k);
          }
        })(el);
        return treffer;
      },
      focus() {}
    };
    alle.push(el);
    return el;
  }

  function reg(id, klasse, tag) {
    const el = neuesElement(tag || 'div');
    el.id = id;
    if (klasse) el.className = klasse;
    nachId[id] = el;
    return el;
  }

  // Die Bildschirme
  for (const id of ['uebersicht', 'richtungswahl', 'uebung', 'test', 'ergebnis',
                    'lernbox', 'lernboxErgebnis']) reg(id, 'bildschirm');
  nachId.uebersicht.classList.add('aktiv');

  // Alle weiteren Element-IDs aus der echten index.html holen
  const html = fs.readFileSync(ORDNER + 'index.html', 'utf8');
  for (const treffer of html.matchAll(/id="([^"]+)"/g)) {
    if (!nachId[treffer[1]]) reg(treffer[1]);
  }

  const dokument = {
    getElementById: (id) => nachId[id] || reg(id),
    createElement: neuesElement,
    querySelectorAll: (sel) => {
      const klasse = sel.replace('.', '');
      return alle.filter((e) => e.classList.contains(klasse));
    },
    addEventListener(art, fn) { dokument._hoerer = dokument._hoerer || {}; dokument._hoerer[art] = fn; },
    _hoerer: {}
  };

  return { dokument: dokument, nachId: nachId };
}

/* ---------------- Frische Welt bauen ----------------
   stimmen = Liste der Sprachausgabe-Stimmen (null = das Gerät kann nicht sprechen) */
function frischeWelt(stimmen) {
  const fake = baueFakeBrowser();
  const speicher = new Map();
  const gesprochen = [];

  const umgebung = {
    console: console, Math: Math, JSON: JSON, Object: Object,
    Number: Number, String: String, Date: Date, Set: Set, Array: Array,
    document: fake.dokument,
    location: { hash: '', search: '' },
    confirm: () => true,
    alert: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    localStorage: {
      getItem: (k) => (speicher.has(k) ? speicher.get(k) : null),
      setItem: (k, v) => { speicher.set(k, String(v)); },
      removeItem: (k) => { speicher.delete(k); },
      key: (i) => [...speicher.keys()][i] ?? null,
      get length() { return speicher.size; }
    }
  };
  umgebung.window = umgebung;
  umgebung.window.scrollTo = () => {};

  if (stimmen) {
    umgebung.SpeechSynthesisUtterance = function (text) { this.text = text; };
    umgebung.speechSynthesis = {
      getVoices: () => stimmen,
      cancel: () => {},
      speak: (spruch) => { gesprochen.push(spruch); },
      addEventListener: () => {}
    };
  }

  const kontext = vm.createContext(umgebung);
  for (const datei of [GETEILT + 'speicher.js', GETEILT + 'profil.js', GETEILT + 'schule.js',
                       ORDNER + 'vokabeln.js', ORDNER + 'vokabeln-klasse5.js',
                       ORDNER + 'englisch.js']) {
    vm.runInContext(fs.readFileSync(datei, 'utf8'), kontext, { filename: path.basename(datei) });
  }
  // Die Seite "lädt"
  if (fake.dokument._hoerer.DOMContentLoaded) fake.dokument._hoerer.DOMContentLoaded();

  return {
    k: kontext, el: fake.nachId, gesprochen: gesprochen,
    lauf: (code) => vm.runInContext(code, kontext)
  };
}

/* ---------------- Kleine Helfer fürs Durchspielen ---------------- */

/* Die Karten auf der Übersicht (Überschriften zählen nicht mit) */
function lektionsKarten(w) {
  return w.el.lektionen.children.filter((k) => k.className.indexOf('lektion') !== -1);
}

/* Übungsknopf, Testknopf, Lernboxknopf einer Karte */
function knopfDerKarte(karte, nummer) {
  const reihe = karte.children[karte.children.length - 1];
  return reihe.children[nummer];
}

/* Die aktuelle Frage richtig (oder absichtlich falsch) beantworten */
function antworte(w, kastenId, richtig) {
  const kasten = w.el[kastenId];
  const wort = w.lauf('LAUF.wort');
  const richtung = w.lauf('LAUF.richtung');

  if (richtung === 'auswahl') {
    const knoepfe = kasten.querySelectorAll('.auswahl');
    const treffer = knoepfe.filter((k) => k.dataset.wert === wort.englisch[0])[0];
    const daneben = knoepfe.filter((k) => k.dataset.wert !== wort.englisch[0])[0];
    (richtig ? treffer : daneben).onclick();
    return;
  }

  const feld = kasten.querySelectorAll('input')[0];
  const loesung = richtung === 'en-de' ? wort.deutsch[0] : wort.englisch[0];
  feld.value = richtig ? loesung : 'zzz-falsch';
}

function sichtbar(w) {
  for (const id of ['uebersicht', 'richtungswahl', 'uebung', 'test', 'ergebnis',
                    'lernbox', 'lernboxErgebnis']) {
    if (w.el[id].classList.contains('aktiv')) return id;
  }
  return null;
}

function meldeAnAls(w, name) {
  const profil = w.lauf(`neuesProfil("${name}", "🦊", "1234")`);
  w.lauf(`meldeAn("${profil.profil.id}", "1234")`);
  w.lauf('zeichneUebersicht()');
  return profil.profil.id;
}

/* ============================================================
   TEST 1: Die Übersicht
   ============================================================ */
console.log('\n=== TEST: Übersicht ===');
{
  const w = frischeWelt();

  gleich(sichtbar(w), 'uebersicht', 'die Übersicht ist der erste Bildschirm');
  gleich(lektionsKarten(w).length, 12, 'es stehen 12 Lektionen da');

  const ueberschriften = w.el.lektionen.children.filter((k) => k.className === 'themenkopf');
  pruefe(ueberschriften.length >= 6, 'die Themes stehen als Überschriften darüber');
  pruefe(ueberschriften[0].textContent.indexOf('Welcome') !== -1,
         'ganz oben steht "Welcome to Camden Town!"');

  pruefe(w.el.lernboxStand.textContent.indexOf('dran') !== -1,
         'die Lernbox sagt, wie viele Wörter dran sind');
  gleich(w.el.lernboxFaecher.children.length, 6, 'fünf Fächer und ein Feld für neue Wörter');
  pruefe(w.el.uebersichtWer.innerHTML.indexOf('Gast') !== -1, 'ohne Profil steht da "Gast"');

  const karte = lektionsKarten(w)[0];
  pruefe(karte.innerHTML.indexOf('Vokabeln') !== -1, 'auf der Karte steht die Wörterzahl');
  pruefe(knopfDerKarte(karte, 0).textContent.indexOf('Üben') !== -1, 'es gibt einen Übungsknopf');
  pruefe(knopfDerKarte(karte, 1).textContent.indexOf('Test') !== -1, 'es gibt einen Testknopf');
  pruefe(knopfDerKarte(karte, 2).textContent.indexOf('Lernbox') !== -1, 'es gibt einen Lernboxknopf');
}

/* ============================================================
   TEST 2: Üben — deutsch sehen, englisch tippen
   ============================================================ */
console.log('\n=== TEST: Üben (Englisch tippen) ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');

  knopfDerKarte(lektionsKarten(w)[0], 0).onclick();
  gleich(sichtbar(w), 'richtungswahl', 'zuerst kommt die Richtungswahl');
  gleich(w.el.wahlRichtung.children.length, 3, 'drei Richtungen stehen zur Wahl');

  w.el.wahlRichtung.children[0].onclick();       // 🇩🇪 -> 🇬🇧
  gleich(w.lauf('LAUF.richtung'), 'de-en', 'die erste Richtung ist "Englisch tippen"');
  pruefe(w.el.wahlRichtung.children[0].className.indexOf('aktiv') !== -1,
         'die gewählte Richtung ist markiert');

  w.el.richtungLos.onclick();
  gleich(sichtbar(w), 'uebung', 'jetzt wird geübt');

  const wort = w.lauf('LAUF.wort');
  gleich(w.el.uebungFrage.textContent, wort.deutsch[0], 'die Frage ist das deutsche Wort');

  const feld = w.el.uebungAntwortzeile.querySelectorAll('input')[0];
  gleich(feld.getAttribute('autocapitalize'), 'off', 'das Tablet schreibt nicht groß');
  gleich(feld.getAttribute('autocorrect'), 'off', 'und korrigiert nicht');
  gleich(feld.getAttribute('spellcheck'), 'false', 'und prüft keine Rechtschreibung');
  gleich(feld.lang, 'en', 'das Feld erwartet Englisch');

  // Leere Antwort zählt nicht
  w.el.uebungWeiter.onclick();
  gleich(w.lauf('LAUF.gesamt'), 0, 'eine leere Antwort zählt nicht');
  pruefe(w.el.uebungMeldung.className.indexOf('tipp') !== -1, 'stattdessen kommt ein Hinweis');

  // Dreimal richtig
  for (let i = 0; i < 3; i++) {
    antworte(w, 'uebungAntwortzeile', true);
    w.el.uebungWeiter.onclick();     // prüfen
    w.el.uebungWeiter.onclick();     // weiter
  }
  gleich(w.lauf('LAUF.richtig'), 3, 'drei richtige Antworten');
  gleich(w.lauf('LAUF.serie'), 3, 'die Serie steht auf 3');

  // Einmal falsch
  antworte(w, 'uebungAntwortzeile', false);
  const wortFalsch = w.lauf('LAUF.wort');
  w.el.uebungWeiter.onclick();
  gleich(w.lauf('LAUF.serie'), 0, 'ein Fehler reißt die Serie ab');
  pruefe(w.el.uebungMeldung.className.indexOf('falsch') !== -1, 'die Meldung ist rot');
  pruefe(w.el.uebungMeldung.textContent.indexOf(wortFalsch.englisch[0]) !== -1,
         'die richtige Antwort wird gezeigt');
  pruefe(w.el.uebungAntwortzeile.querySelectorAll('input')[0].disabled,
         'das Feld ist gesperrt, bis es weitergeht');

  // Der Fortschritt landet unter Englisch — und NICHT unter Mathe
  const f = w.lauf('holeSchulFortschritt("englisch", "klasse5", "welcome")');
  gleich(f.training.gesamt, 4, 'vier Antworten sind gespeichert');
  gleich(f.training.richtig, 3, 'davon drei richtig');
  gleich(w.lauf('holeSchulFortschritt("mathe", "klasse5", "welcome").training.gesamt'), 0,
         'in Mathe ist dadurch nichts angekommen');
}

/* ============================================================
   TEST 3: Üben — Auswahl mit vier Knöpfen
   ============================================================ */
console.log('\n=== TEST: Üben (Auswahl) ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');

  knopfDerKarte(lektionsKarten(w)[0], 0).onclick();
  w.el.wahlRichtung.children[2].onclick();       // Auswahl
  gleich(w.lauf('LAUF.richtung'), 'auswahl', 'der leichte Modus ist gewählt');
  w.el.richtungLos.onclick();

  gleich(w.el.uebungAntwortzeile.querySelectorAll('.auswahl').length, 4,
         'es stehen vier Knöpfe zur Wahl');

  // Richtig tippen
  antworte(w, 'uebungAntwortzeile', true);
  gleich(w.lauf('LAUF.richtig'), 1, 'der richtige Knopf zählt als Treffer');
  const knoepfe = w.el.uebungAntwortzeile.querySelectorAll('.auswahl');
  pruefe(knoepfe.every((k) => k.disabled), 'danach ist nichts mehr anklickbar');
  pruefe(knoepfe.some((k) => k.classList.contains('richtig')), 'der richtige Knopf wird grün');

  // Falsch tippen — der richtige wird trotzdem gezeigt
  w.el.uebungWeiter.onclick();
  antworte(w, 'uebungAntwortzeile', false);
  const wort = w.lauf('LAUF.wort');
  const knoepfe2 = w.el.uebungAntwortzeile.querySelectorAll('.auswahl');
  const richtigerKnopf = knoepfe2.filter((k) => k.dataset.wert === wort.englisch[0])[0];
  pruefe(richtigerKnopf.classList.contains('richtig'),
         'auch nach einem Fehler leuchtet die richtige Antwort auf');
  pruefe(knoepfe2.some((k) => k.classList.contains('falsch')),
         'und der falsche Knopf wird rot');
}

/* ============================================================
   TEST 4: Üben — englisch sehen, deutsch tippen
   ============================================================ */
console.log('\n=== TEST: Üben (Deutsch tippen) ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');

  knopfDerKarte(lektionsKarten(w)[1], 0).onclick();
  w.el.wahlRichtung.children[1].onclick();       // 🇬🇧 -> 🇩🇪
  w.el.richtungLos.onclick();

  const wort = w.lauf('LAUF.wort');
  gleich(w.el.uebungFrage.textContent, wort.englisch[0], 'die Frage ist das englische Wort');
  gleich(w.el.uebungAntwortzeile.querySelectorAll('input')[0].lang, 'de',
         'jetzt wird Deutsch erwartet');

  // Deutsche Nomen gelten auch ohne Artikel
  const ohneArtikel = wort.deutsch[0].replace(/^(der|die|das) /, '');
  w.el.uebungAntwortzeile.querySelectorAll('input')[0].value = ohneArtikel;
  w.el.uebungWeiter.onclick();
  gleich(w.lauf('LAUF.richtig'), 1, 'ohne Artikel gilt die Antwort trotzdem');
}

/* ============================================================
   TEST 5: Der Vokabeltest
   ============================================================ */
console.log('\n=== TEST: Vokabeltest ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');

  knopfDerKarte(lektionsKarten(w)[0], 1).onclick();
  gleich(sichtbar(w), 'test', 'der Test läuft');
  gleich(w.lauf('LAUF.gesamt'), 10, 'zehn Vokabeln');
  gleich(w.el.testAnzahl.textContent, 10, 'das steht auch oben');

  const ids = w.lauf('LAUF.testWoerter.map(function (x) { return x.englisch[0]; })');
  gleich(new Set(ids).size, 10, 'kein Wort kommt zweimal dran');

  // Alles richtig
  for (let i = 0; i < 10; i++) {
    antworte(w, 'testAntwortzeile', true);
    w.el.testWeiter.onclick();
  }

  gleich(sichtbar(w), 'ergebnis', 'am Ende kommt das Ergebnis');
  gleich(w.el.ergebnisNote.textContent, 1, 'alles richtig gibt eine 1');
  gleich(w.el.ergebnisNotenText.textContent, 'sehr gut', 'und heißt "sehr gut"');
  gleich(w.el.ergebnisRueckblick.children.length, 10, 'der Rückblick zeigt alle zehn');
  gleich(w.lauf('holeSchulFortschritt("englisch", "klasse5", "welcome").besteNote'), 1,
         'die Note ist unter Englisch gespeichert');
}

console.log('\n=== TEST: Test mit Fehlern und abgelaufener Zeit ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');
  knopfDerKarte(lektionsKarten(w)[0], 1).onclick();

  // Drei richtig, dann läuft die Zeit ab
  for (let i = 0; i < 3; i++) {
    antworte(w, 'testAntwortzeile', true);
    w.el.testWeiter.onclick();
  }
  w.lauf('beendeTest(true)');

  gleich(sichtbar(w), 'ergebnis', 'auch bei Zeitablauf gibt es ein Ergebnis');
  gleich(w.el.ergebnisRueckblick.children.length, 10,
         'die unbeantworteten Wörter stehen als falsch im Rückblick');
  pruefe(w.el.ergebnisZusatz.textContent.indexOf('Zeit war um') !== -1,
         'es wird erklärt, dass die Zeit um war');
  gleich(w.el.ergebnisNote.textContent, 5, '3 von 10 ergibt eine 5');
}

/* ============================================================
   TEST 6: Die Lernbox
   ============================================================ */
console.log('\n=== TEST: Lernbox ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');
  const heute = w.lauf('tagesnummer()');

  // Eine einzelne Lektion üben
  knopfDerKarte(lektionsKarten(w)[0], 2).onclick();
  gleich(sichtbar(w), 'lernbox', 'die Lernbox läuft');
  gleich(w.lauf('LAUF.gesamt'), 20, 'es kommen 20 Wörter dran (die Portion)');
  pruefe(w.el.lernboxFach.textContent.indexOf('neu') !== -1,
         'beim ersten Mal sind alle Wörter neu');

  // Erstes Wort richtig -> Fach 2
  const wort1 = w.lauf('LAUF.wort');
  antworte(w, 'lernboxAntwortzeile', true);
  w.el.lernboxWeiter.onclick();
  pruefe(w.el.lernboxMeldung.textContent.indexOf('Fach 2') !== -1,
         'nach einer richtigen Antwort wandert das Wort in Fach 2');

  const kasten = w.lauf('holeLernbox("englisch", "klasse5", "welcome")');
  gleich(kasten.woerter[wort1.englisch[0]].stufe, 2, 'das ist auch so gespeichert');
  gleich(kasten.woerter[wort1.englisch[0]].faellig, heute + 1, 'und morgen wieder dran');

  // Zweites Wort falsch -> Fach 1
  w.el.lernboxWeiter.onclick();
  const wort2 = w.lauf('LAUF.wort');
  antworte(w, 'lernboxAntwortzeile', false);
  w.el.lernboxWeiter.onclick();
  pruefe(w.el.lernboxMeldung.textContent.indexOf('Fach 1') !== -1,
         'nach einem Fehler geht das Wort in Fach 1');
  const kasten2 = w.lauf('holeLernbox("englisch", "klasse5", "welcome")');
  gleich(kasten2.woerter[wort2.englisch[0]].faellig, heute,
         'und ist heute gleich nochmal dran');

  // Die Runde zu Ende spielen
  let schutz = 0;
  while (sichtbar(w) === 'lernbox' && schutz++ < 60) {
    if (w.el.lernboxWeiter.dataset.modus === 'weiter') {
      w.el.lernboxWeiter.onclick();
    } else {
      antworte(w, 'lernboxAntwortzeile', true);
      w.el.lernboxWeiter.onclick();
    }
  }
  gleich(sichtbar(w), 'lernboxErgebnis', 'am Ende kommt die Auswertung');
  pruefe(w.el.lernboxErgebnisPunkte.textContent.indexOf('von 20') !== -1,
         'es steht da, wie viele von 20 richtig waren');
  gleich(w.el.lernboxErgebnisFaecher.children.length, 6, 'die Fächer werden gezeigt');

  // Zweite Runde: das falsche Wort ist wieder dabei, die richtigen nicht
  w.el.lernboxNochmal.onclick();
  gleich(sichtbar(w), 'lernbox', 'die nächste Runde startet');
  const dran = w.lauf('LAUF.warteschlange.map(function (x) { return x.wort.englisch[0]; })');
  pruefe(dran.indexOf(wort2.englisch[0]) !== -1, 'das falsche Wort ist wieder dran');
  pruefe(dran.indexOf(wort1.englisch[0]) === -1, 'das richtige Wort ruht bis morgen');
}

console.log('\n=== TEST: Lernbox über alle Lektionen ===');
{
  const w = frischeWelt();
  meldeAnAls(w, 'Emma');

  w.el.lernboxAlle.onclick();
  gleich(sichtbar(w), 'lernbox', 'die Lernbox über alle Lektionen läuft');
  gleich(w.lauf('LAUF.gesamt'), 20, 'auch hier sind es 20 Wörter');
  pruefe(w.el.lernboxTitel.textContent.indexOf('Alle Lektionen') !== -1,
         'die Überschrift sagt "Alle Lektionen"');
}

console.log('\n=== TEST: Lernbox, wenn nichts fällig ist ===');
{
  const w = frischeWelt();
  const id = meldeAnAls(w, 'Emma');
  const heute = w.lauf('tagesnummer()');

  // Alle Wörter der ersten Lektion auf "später" setzen
  const lektion = w.lauf('alleLektionen("klasse5")[0]');
  const woerter = {};
  for (const wort of lektion.woerter) {
    woerter[wort.englisch[0]] = { stufe: 5, faellig: heute + 14, richtig: 5, falsch: 0 };
  }
  w.lauf(`localStorage.setItem('plattform.p.${id}.schule.englisch.lernbox.klasse5.${lektion.id}',
          JSON.stringify({woerter: ${JSON.stringify(woerter)}}))`);
  w.lauf('zeichneUebersicht()');

  knopfDerKarte(lektionsKarten(w)[0], 2).onclick();
  gleich(sichtbar(w), 'uebersicht', 'wir bleiben auf der Übersicht');
  pruefe(w.el.lernboxHinweis.textContent.indexOf('nichts fällig') !== -1,
         'es wird erklärt, dass heute nichts dran ist');
  pruefe(knopfDerKarte(lektionsKarten(w)[0], 2).textContent.indexOf('nichts fällig') !== -1,
         'das steht auch auf dem Knopf der Lektion');
}

/* ============================================================
   TEST 7: Als Gast
   ============================================================ */
console.log('\n=== TEST: Als Gast ===');
{
  const w = frischeWelt();

  // Üben geht
  knopfDerKarte(lektionsKarten(w)[0], 0).onclick();
  w.el.richtungLos.onclick();
  antworte(w, 'uebungAntwortzeile', true);
  w.el.uebungWeiter.onclick();
  gleich(w.lauf('LAUF.richtig'), 1, 'auch als Gast kann man üben');

  // Test geht, wird aber nicht gespeichert
  w.el.uebungFertig.onclick();
  knopfDerKarte(lektionsKarten(w)[0], 1).onclick();
  for (let i = 0; i < 10; i++) {
    antworte(w, 'testAntwortzeile', true);
    w.el.testWeiter.onclick();
  }
  gleich(sichtbar(w), 'ergebnis', 'der Test läuft auch als Gast');
  pruefe(w.el.ergebnisZusatz.textContent.indexOf('nicht gespeichert') !== -1,
         'es wird erklärt, dass nichts gespeichert wird');
  gleich(w.lauf('holeSchulFortschritt("englisch", "klasse5", "welcome").besteNote'), null,
         'und es ist wirklich nichts gespeichert');

  // Lernbox geht auch
  w.el.ergebnisZurueck.onclick();
  w.el.lernboxAlle.onclick();
  gleich(sichtbar(w), 'lernbox', 'die Lernbox läuft auch als Gast');
  antworte(w, 'lernboxAntwortzeile', true);
  w.el.lernboxWeiter.onclick();
  gleich(w.lauf('holeLernbox("englisch", "klasse5", "welcome").woerter'), {},
         'gespeichert wird dabei nichts');
}

/* ============================================================
   TEST 8: Vorlesen
   ============================================================ */
console.log('\n=== TEST: Aussprache vorlesen ===');
{
  // Gerät ohne Sprachausgabe
  const ohne = frischeWelt(null);
  knopfDerKarte(lektionsKarten(ohne)[0], 0).onclick();
  ohne.el.wahlRichtung.children[1].onclick();      // englisch sehen
  ohne.el.richtungLos.onclick();
  pruefe(ohne.el.uebungSprechen.classList.contains('versteckt'),
         'ohne englische Stimme ist der Vorlese-Knopf versteckt');

  // Gerät mit englischer Stimme
  const mit = frischeWelt([{ lang: 'de-DE', localService: true },
                           { lang: 'en-GB', localService: true }]);
  knopfDerKarte(lektionsKarten(mit)[0], 0).onclick();
  mit.el.wahlRichtung.children[1].onclick();
  mit.el.richtungLos.onclick();
  pruefe(!mit.el.uebungSprechen.classList.contains('versteckt'),
         'mit englischer Stimme ist der Knopf da');

  const wort = mit.lauf('LAUF.wort');
  mit.el.uebungSprechen.onclick();
  gleich(mit.gesprochen.length, 1, 'ein Klick spricht das Wort');
  gleich(mit.gesprochen[0].text, wort.englisch[0], 'und zwar das englische Wort');
  gleich(mit.gesprochen[0].lang, 'en-GB', 'mit britischer Aussprache');

  // Beim Englisch-Tippen erst nach dem Prüfen
  const nachher = frischeWelt([{ lang: 'en-GB', localService: true }]);
  knopfDerKarte(lektionsKarten(nachher)[0], 0).onclick();
  nachher.el.richtungLos.onclick();                // de-en
  pruefe(nachher.el.uebungSprechen.classList.contains('versteckt'),
         'beim Englisch-Tippen wird vorher nichts verraten');
  antworte(nachher, 'uebungAntwortzeile', true);
  nachher.el.uebungWeiter.onclick();
  pruefe(!nachher.el.uebungSprechen.classList.contains('versteckt'),
         'nach dem Prüfen darf man es hören');
}

console.log(fehler === 0 ? '\n🎉 ALLE TESTS BESTANDEN\n'
                         : '\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
process.exit(fehler === 0 ? 0 : 1);
