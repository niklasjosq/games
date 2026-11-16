/* Test für den Ablauf: Übersicht, Einführung, eine ganze Runde und
   das Ergebnis — für alle vier Arten von Aufgaben. Wir bauen einen
   winzigen Fake-Browser mit einer Uhr, die wir selbst weiterdrehen. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ORDNER = path.join(__dirname, '..') + path.sep;
const WEB = path.join(__dirname, '..', '..') + path.sep;

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
      textContent: '', value: '', disabled: false, title: '',
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
            if (sel.startsWith('.') ? k.classList.contains(sel.slice(1)) : k.tagName === sel.toUpperCase()) treffer.push(k);
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

  function reg(id, klasse) {
    const el = neuesElement('div');
    el.id = id;
    if (klasse) el.className = klasse;
    nachId[id] = el;
    return el;
  }

  for (const id of ['uebersicht', 'einfuehrung', 'aufgabe', 'ergebnis']) reg(id, 'bildschirm');
  nachId.uebersicht.classList.add('aktiv');

  // Alle weiteren IDs (mit ihren Klassen, z. B. „versteckt“) aus der echten index.html
  const html = fs.readFileSync(ORDNER + 'index.html', 'utf8');
  for (const t of html.matchAll(/<(\w+)([^>]*?)id="([^"]+)"([^>]*)>/g)) {
    if (nachId[t[3]]) continue;
    const klasse = ((t[2] + t[4]).match(/class="([^"]*)"/) || [])[1];
    reg(t[3], klasse);
  }

  const dokument = {
    getElementById: (id) => nachId[id] || reg(id),
    createElement: neuesElement,
    querySelectorAll: (sel) => alle.filter((e) => e.classList.contains(sel.replace('.', ''))),
    addEventListener(art, fn) { dokument._hoerer[art] = fn; },
    _hoerer: {}
  };
  return { dokument: dokument, nachId: nachId };
}

/* ---------------- Frische Welt ---------------- */
function frischeWelt(hash) {
  const fake = baueFakeBrowser();
  const speicher = new Map();
  const zeitgeber = [];
  const intervalle = [];

  const umgebung = {
    console: console, Math: Math, JSON: JSON, Object: Object, Number: Number, String: String,
    Date: Date, Set: Set, Array: Array,
    document: fake.dokument,
    location: { hash: hash || '', search: '', href: '' },
    confirm: () => true,
    alert: () => {},
    setTimeout: (fn) => { zeitgeber.push(fn); return zeitgeber.length; },
    clearTimeout: (id) => { zeitgeber[id - 1] = null; },
    setInterval: (fn) => { intervalle.push(fn); return intervalle.length; },
    clearInterval: (id) => { intervalle[id - 1] = null; },
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

  const kontext = vm.createContext(umgebung);
  for (const datei of ['shared/speicher.js', 'shared/profil.js', 'shared/schule.js',
                       'schule/englisch/vokabeln.js', 'schule/englisch/vokabeln-klasse5.js']) {
    vm.runInContext(fs.readFileSync(WEB + datei, 'utf8'), kontext, { filename: datei });
  }
  for (const datei of ['formen.js', 'kern.js', 'gedaechtnis.js', 'muster.js', 'geometrie.js', 'memory.js', 'aufmerksamkeit.js',
                       'konzentration.js']) {
    vm.runInContext(fs.readFileSync(ORDNER + datei, 'utf8'), kontext, { filename: datei });
  }
  if (fake.dokument._hoerer.DOMContentLoaded) fake.dokument._hoerer.DOMContentLoaded();

  return {
    el: fake.nachId,
    lauf: (code) => vm.runInContext(code, kontext),
    /* Die Uhr weiterdrehen: alles, was per setTimeout wartet, läuft ab */
    tick: () => {
      for (let runde = 0; runde < 500; runde++) {
        const i = zeitgeber.findIndex((f) => f);
        if (i === -1) return;
        const fn = zeitgeber[i];
        zeitgeber[i] = null;
        fn();
      }
    },
    wartend: () => zeitgeber.filter((f) => f).length,
    /* Eine Sekunde der Aufgaben-Uhr */
    sekunde: () => { for (const f of intervalle.slice()) if (f) f(); }
  };
}

/* ---------------- Helfer ---------------- */

function sichtbar(w) {
  for (const id of ['uebersicht', 'einfuehrung', 'aufgabe', 'ergebnis']) {
    if (w.el[id].classList.contains('aktiv')) return id;
  }
  return null;
}

function meldeAnAls(w, name) {
  const p = w.lauf(`neuesProfil("${name}", "🦊", "1234")`);
  w.lauf(`meldeAn("${p.profil.id}", "1234")`);
  w.lauf('zeichneUebersicht()');
  return p.profil.id;
}

function oeffneUebung(w, gruppe, uebungId) {
  const tab = w.el.gruppenwahl.children.find((k) => k.dataset.gruppe === gruppe);
  tab.onclick();
  const karte = w.el.uebungen.children.find((k) => k.children[0].children[0].dataset.uebung === uebungId);
  karte.children[0].children[0].onclick();
}

function knopfMit(liste, feld, wert) {
  return liste.find((k) => k.dataset[feld] === wert);
}

/* Die aktuelle Aufgabe lösen — richtig oder absichtlich falsch */
function loese(w, richtig) {
  w.tick();
  const a = w.lauf('LAUF.aufgabe');

  if (a.art === 'auswahl') {
    const knoepfe = w.el.aufgabeAntwort.children;
    const ziel = richtig ? knopfMit(knoepfe, 'id', a.richtig) : knoepfe.find((k) => k.dataset.id !== a.richtig);
    ziel.onclick();
  } else if (a.art === 'gitter') {
    const zellen = w.el.aufgabeAntwort.children;
    const zelle = (c) => zellen.find((z) => Number(z.dataset.x) === c.x && Number(z.dataset.y) === c.y);
    const vorgabe = (c) => a.anzeige.vorgabe.some((v) => v.x === c.x && v.y === c.y);
    if (richtig) {
      for (const c of a.richtig.filter((c) => !vorgabe(c))) zelle(c).onclick();
    } else {
      const falsch = zellen.find((z) => !z.classList.contains('vorgabe') &&
        !a.richtig.some((c) => c.x === Number(z.dataset.x) && c.y === Number(z.dataset.y)));
      falsch.onclick();
    }
    w.el.aufgabeWeiter.onclick();
  } else if (a.art === 'folge') {
    const pad = w.lauf('LAUF.pad').children;
    let ids = a.richtig.slice();
    if (!richtig) ids[0] = a.anzeige.tasten.find((t) => t.id !== a.richtig[0]).id;
    for (const id of ids) knopfMit(pad, 'id', id).onclick();
    w.el.aufgabeWeiter.onclick();
  } else if (a.art === 'paare') {
    loeseMemory(w, richtig ? 0 : 2 * a.erfolgBis + 1);
  } else if (a.art === 'antippen') {
    loeseTabelle(w, richtig ? 0 : a.erlaubt + 1);
  }
}

/* Eine Zahlentabelle mit genau „fehlgriffe“ falschen Tipps lösen */
function loeseTabelle(w, fehlgriffe) {
  const a = w.lauf('LAUF.aufgabe');
  const knopf = (id) => knopfMit(w.el.aufgabeAntwort.children, 'id', id);
  for (let i = 0; i < fehlgriffe; i++) knopf(a.richtig[a.richtig.length - 1]).onclick();
  for (const id of a.richtig) knopf(id).onclick();
}

/* Ein Memory-Feld mit genau „fehlgriffe“ Fehlversuchen lösen */
function loeseMemory(w, fehlgriffe) {
  const a = w.lauf('LAUF.aufgabe');
  const karten = a.anzeige.karten;
  const knopf = (id) => knopfMit(w.el.aufgabeAntwort.children, 'id', id);
  for (let i = 0; i < fehlgriffe; i++) {
    const erste = karten[0];
    const andere = karten.find((k) => k.paarId !== erste.paarId);
    knopf(erste.id).onclick();
    knopf(andere.id).onclick();
    w.tick();                       // die Karten drehen sich wieder um
  }
  const paare = {};
  for (const k of karten) (paare[k.paarId] = paare[k.paarId] || []).push(k.id);
  for (const ids of Object.values(paare)) {
    knopf(ids[0]).onclick();
    knopf(ids[1]).onclick();
  }
}

function weiter(w) { w.el.aufgabeWeiter.onclick(); }

/* ============================================================
   TEST 1: Die Übersicht
   ============================================================ */
console.log('\n=== TEST: Übersicht ===');
{
  const w = frischeWelt('#muster');
  gleich(sichtbar(w), 'uebersicht', 'die Übersicht ist offen');
  pruefe(w.el.uebersichtWer.innerHTML.indexOf('Als Gast') !== -1, 'als Gast steht der Hinweis da');
  gleich(w.el.gruppenwahl.children.length, 5, 'fünf Gruppen zur Wahl');
  pruefe(knopfMit(w.el.gruppenwahl.children, 'gruppe', 'muster').className.indexOf('aktiv') !== -1,
         '#muster öffnet direkt die Gruppe Muster');
  gleich(w.el.uebungen.children.length, 2, 'zwei Übungen: Reihe und Matrix');
  pruefe(w.el.uebungen.children[0].innerHTML.indexOf('Reihe fortsetzen') !== -1, 'Reihe fortsetzen steht da');
  pruefe(w.el.uebungen.children[0].innerHTML.indexOf('noch nicht geübt') !== -1, 'mit „noch nicht geübt“');
  pruefe(w.el.uebungen.children[0].innerHTML.indexOf('8–12 Jahre') !== -1, 'mit dem Alter, für das sie gedacht ist');
  pruefe(w.el.uebungen.children[1].innerHTML.indexOf('10–12 Jahre') !== -1, 'die Matrix ist für 10- bis 12-Jährige');

  knopfMit(w.el.gruppenwahl.children, 'gruppe', 'formen').onclick();
  gleich(w.lauf('location.hash'), 'formen', 'ein Klick auf eine Gruppe merkt sie sich in der Adresse');
  pruefe(w.el.uebungen.children[0].innerHTML.indexOf('Was passt nicht?') !== -1, 'bei Formen: Was passt nicht?');
  pruefe(w.el.uebungen.children[1].innerHTML.indexOf('Spiegeln und Drehen') !== -1, 'und Spiegeln und Drehen');
}

/* ============================================================
   TEST 2: Einführung mit Lernziel, Tipps, Klasse und Uhr
   ============================================================ */
console.log('\n=== TEST: Einführung ===');
{
  const w = frischeWelt('');
  meldeAnAls(w, 'Emma');
  pruefe(w.el.uebersichtWer.innerHTML.indexOf('Emma') !== -1, 'Emma ist angemeldet');
  oeffneUebung(w, 'gedaechtnis', 'merkfolge');

  gleich(sichtbar(w), 'einfuehrung', 'die Einführung ist offen');
  pruefe(w.el.einfLernziel.textContent.indexOf('Reihenfolge') !== -1, 'das Lernziel steht da');
  pruefe(w.el.einfTipps.children.length >= 2, 'mindestens zwei Tipps');
  pruefe(w.el.einfBeispiel.innerHTML.indexOf('<svg') !== -1, 'ein Beispielbild');
  pruefe(!w.el.einfKlasseBox.classList.contains('versteckt'), 'beim ersten Mal wird nach der Klasse gefragt');
  gleich(w.el.einfStufen.children.length, 8, 'acht Stufen-Punkte');

  knopfMit(w.el.einfKlasse.children, 'klasse', '5').onclick();
  gleich(w.lauf('LAUF.stufe'), 4, '5. Klasse beginnt auf Stufe 4');
  pruefe(w.el.einfStufeText.textContent.indexOf('Stufe 4') !== -1, 'die Stufe steht da');
  knopfMit(w.el.einfKlasse.children, 'klasse', '3').onclick();
  gleich(w.lauf('LAUF.stufe'), 1, '3. Klasse beginnt auf Stufe 1');

  w.el.einfUhr.onclick();
  pruefe(w.lauf('LAUF.mitUhr') === true, 'die Uhr lässt sich einschalten');
  pruefe(w.el.einfUhr.textContent.indexOf('an') !== -1, 'der Knopf zeigt es an');
  w.el.einfUhr.onclick();
  pruefe(w.lauf('LAUF.mitUhr') === false, 'und wieder ausschalten');
  pruefe(w.el.einfPaartypBox.classList.contains('versteckt'), 'die Memory-Wahl gibt es hier nicht');

  w.el.einfZurueck.onclick();
  gleich(sichtbar(w), 'uebersicht', 'Zurück führt zur Übersicht');
}

/* ============================================================
   TEST 3: Merkfolge — zeigen, merken, antippen, Stufe steigt
   ============================================================ */
console.log('\n=== TEST: Merkfolge ===');
{
  const w = frischeWelt('');
  meldeAnAls(w, 'Emma');
  oeffneUebung(w, 'gedaechtnis', 'merkfolge');
  w.el.einfLos.onclick();

  gleich(sichtbar(w), 'aufgabe', 'die Aufgabe ist offen');
  gleich(w.lauf('LAUF.phase'), 'zeigen', 'erst werden die Figuren gezeigt');
  pruefe(w.lauf('LAUF.pad').classList.contains('versteckt'), 'das Tastenfeld ist dabei versteckt');
  pruefe(w.el.aufgabeWeiter.classList.contains('versteckt'), 'und es gibt noch nichts zu prüfen');

  w.tick();
  gleich(w.lauf('LAUF.phase'), 'antworten', 'danach darf man antippen');
  pruefe(!w.lauf('LAUF.pad').classList.contains('versteckt'), 'das Tastenfeld ist da');
  pruefe(w.el.aufgabeWeiter.disabled, 'Prüfen geht erst, wenn alle Figuren getippt sind');

  // Einmal vertippen und zurücknehmen
  const a = w.lauf('LAUF.aufgabe');
  const pad = w.lauf('LAUF.pad').children;
  knopfMit(pad, 'id', a.anzeige.tasten[0].id).onclick();
  pruefe(!w.el.aufgabeRueckgaengig.classList.contains('versteckt'), 'nach dem ersten Tippen gibt es ↶ Zurück');
  w.el.aufgabeRueckgaengig.onclick();
  gleich(w.lauf('LAUF.antwort.length'), 0, '↶ Zurück nimmt die Figur wieder weg');

  for (const id of a.richtig) knopfMit(pad, 'id', id).onclick();
  pruefe(!w.el.aufgabeWeiter.disabled, 'jetzt kann man prüfen');
  weiter(w);
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'richtig getippt');
  pruefe(!w.el.aufgabeErklaerung.classList.contains('versteckt'), 'die Erklärung ist zu sehen');
  gleich(w.el.aufgabeWeiter.dataset.modus, 'weiter', 'der Knopf heißt jetzt weiter');

  weiter(w);
  loese(w, true);
  gleich(w.lauf('LAUF.stufe'), 2, 'nach zwei Treffern geht es auf Stufe 2');
  pruefe(w.el.aufgabeStufeInfo.textContent.indexOf('Stufe 2') !== -1, 'das wird angesagt');
  gleich(w.lauf('holeKonzentration("merkfolge").stufe'), 2, 'und gleich gespeichert');
  gleich(w.lauf('holeKonzentration("merkfolge").hoechsteStufe'), 1, 'geschafft ist bisher Stufe 1');

  // Ein Fehler
  weiter(w);
  loese(w, false);
  pruefe(w.el.aufgabeMeldung.className.indexOf('falsch') !== -1, 'falsch getippt wird erkannt');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('An Stelle 1') !== -1, 'die Meldung sagt, wo der Fehler war');
  pruefe(!w.el.aufgabeNochmal.classList.contains('versteckt'), 'man kann sich die Reihe nochmal ansehen');
  w.el.aufgabeNochmal.onclick();
  pruefe(w.wartend() > 0, 'die Wiederholung läuft');
  w.tick();
  gleich(w.lauf('LAUF.buehne.dataset.zeigt'), '', 'und ist danach wieder vorbei');

  // Rest der Runde
  while (w.lauf('LAUF.nummer') < w.lauf('LAUF.gesamt')) { weiter(w); loese(w, true); }
  pruefe(w.el.aufgabeWeiter.textContent.indexOf('Auswertung') !== -1, 'nach der letzten Aufgabe geht es zur Auswertung');
  weiter(w);
  gleich(sichtbar(w), 'ergebnis', 'das Ergebnis ist offen');
  gleich(w.el.ergebnisRueckblick.children.length, 8, 'acht Aufgaben im Rückblick');
  pruefe(w.el.ergebnisStufe.textContent.indexOf('Stufe') !== -1, 'die Stufe steht oben');
  pruefe(w.el.ergebnisPunkte.textContent.indexOf('7 von 8') !== -1, '7 von 8 richtig');
  pruefe(w.el.ergebnisReflexion.textContent.length > 10, 'ein Satz zum Nachdenken: „' + w.el.ergebnisReflexion.textContent + '“');
  gleich(w.lauf('holeKonzentration("merkfolge").runden'), 1, 'eine Runde gespeichert');

  w.el.ergebnisNochmal.onclick();
  gleich(sichtbar(w), 'aufgabe', 'Noch eine Runde startet sofort');
  gleich(w.lauf('LAUF.nummer'), 1, 'wieder bei Aufgabe 1');
}

/* ============================================================
   TEST 4: Zwei Fehler auf Stufe 1 — dann Tipps vorab
   ============================================================ */
console.log('\n=== TEST: Nie in der Sackgasse ===');
{
  const w = frischeWelt('');
  meldeAnAls(w, 'Max');
  oeffneUebung(w, 'formen', 'ausreisser');
  knopfMit(w.el.einfKlasse.children, 'klasse', '3').onclick();
  w.el.einfLos.onclick();

  loese(w, false);
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('❌') === 0, 'ein Fehler bekommt eine Erklärung');
  pruefe(w.el.aufgabeErklaerung.textContent.length > 10, '💡 mit Erklärung');
  weiter(w);
  loese(w, false);
  gleich(w.lauf('LAUF.stufe'), 1, 'tiefer als Stufe 1 geht es nicht');
  pruefe(w.lauf('LAUF.hilfeModus') === true, 'aber jetzt gibt es Tipps vorab');
  weiter(w);
  pruefe(!w.el.aufgabeHilfe.classList.contains('versteckt'), 'der Tipp steht vor der nächsten Aufgabe');

  // Was passt nicht? richtig lösen
  loese(w, true);
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'die richtige Figur wird erkannt');
  const markiert = w.el.aufgabeAntwort.children.filter((k) => k.classList.contains('richtig'));
  gleich(markiert.length, 1, 'genau eine Figur ist grün markiert');
  pruefe(w.el.aufgabeAntwort.children.every((k) => k.disabled), 'danach kann man nichts mehr antippen');
}

/* ============================================================
   TEST 5: Gitter merken und Spiegeln
   ============================================================ */
console.log('\n=== TEST: Gitter ===');
{
  const w = frischeWelt('');
  meldeAnAls(w, 'Emma');
  oeffneUebung(w, 'gedaechtnis', 'gitter');
  w.el.einfLos.onclick();

  gleich(w.lauf('LAUF.phase'), 'zeigen', 'die Felder werden erst gezeigt');
  pruefe(w.el.aufgabeAntwort.children.every((z) => z.disabled), 'solange kann man nicht tippen');
  gleich(w.el.aufgabeAntwort.children.length, 9, 'ein 3×3-Gitter');
  loese(w, true);
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'richtig nachgetippt');
  const treffer = w.el.aufgabeAntwort.children.filter((z) => z.classList.contains('treffer'));
  gleich(treffer.length, w.lauf('LAUF.aufgabe.richtig.length'), 'alle Treffer sind markiert');

  weiter(w);
  loese(w, false);
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Zu viel') !== -1, 'ein falsches Feld wird benannt');
  pruefe(w.el.aufgabeAntwort.children.some((z) => z.classList.contains('zuviel')), 'und rot markiert');
  pruefe(w.el.aufgabeAntwort.children.some((z) => z.classList.contains('vergessen')), 'vergessene Felder sieht man auch');

  // Spiegeln auf Stufe 1: Gitter mit Achse
  w.lauf('zeichneUebersicht()');
  oeffneUebung(w, 'formen', 'spiegeln');
  knopfMit(w.el.einfKlasse.children, 'klasse', '3').onclick();
  w.el.einfLos.onclick();
  const a = w.lauf('LAUF.aufgabe');
  gleich(a.art, 'gitter', 'Spiegeln auf Stufe 1 ist eine Gitter-Aufgabe');
  pruefe(w.el.aufgabeAntwort.children.some((z) => z.classList.contains('achse-rechts')), 'die Achse ist eingezeichnet');
  gleich(w.el.aufgabeAntwort.children.filter((z) => z.classList.contains('vorgabe')).length, a.anzeige.vorgabe.length,
         'die Vorlage ist schon ausgefüllt');
  w.el.aufgabeWeiter.onclick();
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Tippe erst') !== -1, 'ohne getippte Felder wird nicht geprüft');
  loese(w, true);
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'richtig gespiegelt');
}

/* ============================================================
   TEST 6: Lern-Memory
   ============================================================ */
console.log('\n=== TEST: Lern-Memory ===');
{
  const w = frischeWelt('#memory');
  meldeAnAls(w, 'Emma');
  oeffneUebung(w, 'memory', 'memory');
  pruefe(!w.el.einfPaartypBox.classList.contains('versteckt'), 'beim Memory kann man die Sorte wählen');
  knopfMit(w.el.einfPaartyp.children, 'paartyp', 'formName').onclick();
  gleich(w.lauf('LAUF.paartyp'), 'formName', 'Formen-Namen gewählt');
  w.el.einfLos.onclick();

  const a = w.lauf('LAUF.aufgabe');
  gleich(a.art, 'paare', 'ein Memory-Feld');
  gleich(w.el.aufgabeAntwort.children.length, 2 * a.erfolgBis, 'mit doppelt so vielen Karten wie Paaren');
  gleich(w.lauf('LAUF.gesamt'), 2, 'eine Runde sind zwei Felder');

  // Zwei Karten, die nicht passen
  const karten = a.anzeige.karten;
  const k1 = karten.find((k) => k.typ === 'form');
  const k2 = karten.find((k) => k.typ === 'form' && k.paarId !== k1.paarId) || karten.find((k) => k.paarId !== k1.paarId);
  const knopf = (id) => knopfMit(w.el.aufgabeAntwort.children, 'id', id);
  knopf(k1.id).onclick();
  pruefe(knopf(k1.id).classList.contains('offen'), 'eine Karte dreht sich um');
  knopf(k2.id).onclick();
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Fehlversuche: 1') !== -1, 'ein Fehlversuch wird gezählt');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Das ist') === 0, 'und die Formen werden benannt: „' +
         w.el.aufgabeMeldung.textContent + '“');
  const k3 = karten.find((k) => k.id !== k1.id && k.id !== k2.id);
  knopf(k3.id).onclick();
  pruefe(!knopf(k3.id).classList.contains('offen'), 'solange zwei offen liegen, dreht sich keine dritte um');
  w.tick();
  pruefe(!knopf(k1.id).classList.contains('offen'), 'danach drehen sich beide wieder um');

  // Den Rest lösen: 1 Fehlversuch bei 4 Paaren ist ein Treffer
  loeseMemory(w, 0);
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'mit wenigen Fehlversuchen gilt das Feld als geschafft');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('1 Fehlversuch') !== -1, 'die Fehlversuche stehen dabei');

  // Zweites Feld: dazwischen = neutral, die Stufe bleibt
  weiter(w);
  const n = w.lauf('LAUF.aufgabe.erfolgBis');
  const verlaufVorher = w.lauf('LAUF.verlauf.length');
  loeseMemory(w, n + 1);
  pruefe(w.el.aufgabeMeldung.className.indexOf('tipp') !== -1, 'mit etwas mehr Fehlversuchen: geschafft, aber neutral');
  gleich(w.lauf('LAUF.verlauf.length'), verlaufVorher, 'ein neutrales Feld zählt nicht für die Stufe');
  weiter(w);
  gleich(sichtbar(w), 'ergebnis', 'nach zwei Feldern kommt das Ergebnis');
  pruefe(w.el.ergebnisPunkte.textContent.indexOf('Fehlversuche') !== -1, 'dort stehen die Fehlversuche');
}

/* ============================================================
   TEST 7: Abbrechen, Uhr, Gast, direkter Link
   ============================================================ */
console.log('\n=== TEST: Abbrechen und Uhr ===');
{
  const w = frischeWelt('');
  meldeAnAls(w, 'Emma');
  oeffneUebung(w, 'gedaechtnis', 'merkfolge');
  w.el.einfLos.onclick();
  pruefe(w.wartend() > 0, 'die Figuren warten darauf, gezeigt zu werden');
  w.el.aufgabeAbbrechen.onclick();
  gleich(sichtbar(w), 'uebersicht', 'Abbrechen führt zur Übersicht');
  gleich(w.lauf('LAUF.timer.length'), 0, 'alle Zeitgeber sind angehalten');
  gleich(w.wartend(), 0, 'es läuft nichts mehr im Hintergrund');

  // Mit Uhr: die Zeit läuft ab
  oeffneUebung(w, 'muster', 'reihe');
  w.el.einfUhr.onclick();
  w.el.einfLos.onclick();
  pruefe(!w.el.aufgabeZeit.classList.contains('versteckt'), 'mit Uhr ist der Zeitbalken zu sehen');
  const sek = w.lauf('LAUF.zeitGesamt');
  gleich(sek, 30, 'Reihe auf Stufe 1: 30 Sekunden');
  for (let i = 0; i < sek; i++) w.sekunde();
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Zeit ist um') !== -1, 'nach Ablauf: „Die Zeit ist um“');
  gleich(w.lauf('LAUF.rueckblick[0].ergebnis'), 'falsch', 'das zählt als Fehler');
  pruefe(!w.el.aufgabeErklaerung.classList.contains('versteckt'), 'die Erklärung gibt es trotzdem');
}

console.log('\n=== TEST: Als Gast ===');
{
  const w = frischeWelt('#formen');
  oeffneUebung(w, 'formen', 'ausreisser');
  knopfMit(w.el.einfKlasse.children, 'klasse', '3').onclick();
  w.el.einfLos.onclick();
  loese(w, true);
  weiter(w);
  loese(w, true);
  gleich(w.lauf('LAUF.stufe'), 2, 'auch als Gast steigt die Stufe');
  gleich(w.lauf('holeKonzentration("ausreisser").aufgaben'), 0, 'gespeichert wird aber nichts');
  w.el.aufgabeAbbrechen.onclick();
  pruefe(w.el.uebungen.children[0].innerHTML.indexOf('Stufe 2') !== -1, 'für diesen Besuch merkt sich die Seite die Stufe');
  w.el.uebungen.children[0].children[0].children[0].onclick();
  pruefe(w.el.einfKlasseBox.classList.contains('versteckt'), 'beim zweiten Mal wird nicht mehr nach der Klasse gefragt');
  gleich(w.lauf('LAUF.stufe'), 2, 'es geht auf Stufe 2 weiter');
}

/* ============================================================
   TEST 8: Wie alt bist du?
   ============================================================ */
console.log('\n=== TEST: Altersauswahl ===');
{
  const w = frischeWelt('#aufmerksamkeit');
  const pid = meldeAnAls(w, 'Emma');
  gleich(w.el.alterswahl.children.length, 6, 'Alle, 8, 9, 10, 11, 12');
  pruefe(knopfMit(w.el.alterswahl.children, 'alter', 'alle').className.indexOf('aktiv') !== -1, 'am Anfang ist „Alle“ gewählt');
  gleich(w.el.uebungen.children.length, 5, 'Aufmerksamkeit hat fünf Übungen');

  knopfMit(w.el.alterswahl.children, 'alter', '8').onclick();
  const titel = () => w.el.uebungen.children.map((k) => k.innerHTML.match(/<h3>(.*?)<\/h3>/)[1]);
  gleich(titel(), ['Suchbild', 'Fehlerbild', 'Linien verfolgen'], 'mit 8 Jahren: Suchbild, Fehlerbild und Linien');
  pruefe(w.el.alterHinweis.textContent.indexOf('2 weitere Übungen') !== -1, 'ein Hinweis sagt, dass 2 Übungen fehlen');

  knopfMit(w.el.alterswahl.children, 'alter', '12').onclick();
  gleich(titel(), ['Zahlentabelle', 'Linien verfolgen', 'Pfeil oder Wort?'], 'mit 12 Jahren: Zahlentabelle, Linien, Pfeil oder Wort');
  gleich(w.lauf(`leseSpeicher("p.${pid}.konzentrationsalter", null)`), 12, 'das Alter wird im Profil gemerkt');

  // Neue Übung: die Klasse ist schon passend vorgewählt
  w.el.uebungen.children[0].children[0].children[0].onclick();
  gleich(w.lauf('LAUF.stufe'), 5, '12 Jahre → 6. Klasse → Stufe 5');
  pruefe(knopfMit(w.el.einfKlasse.children, 'klasse', '6').className.indexOf('aktiv') !== -1, 'die 6. Klasse ist vorgewählt');
  pruefe(w.el.einfAlter.textContent.indexOf('9–12 Jahre') !== -1, 'die Einführung nennt das Alter');
  pruefe(w.el.einfKlasse.children[0].innerHTML.indexOf('8–9 Jahre') !== -1, 'bei den Klassen steht das Alter dabei');

  // Nach dem Neuladen ist das Alter noch da
  const w2 = frischeWelt('#formen');
  w2.lauf(`(function () { const p = neuesProfil("Ben", "🐻", "1234"); meldeAn(p.profil.id, "1234");
             speichereKonzentrationsAlter(9); })()`);
  w2.lauf('LAUF.alter = holeKonzentrationsAlter(); zeichneUebersicht()');
  pruefe(knopfMit(w2.el.alterswahl.children, 'alter', '9').className.indexOf('aktiv') !== -1, 'nach dem Neuladen ist 9 gewählt');
  knopfMit(w2.el.alterswahl.children, 'alter', 'alle').onclick();
  gleich(w2.lauf('holeKonzentrationsAlter()'), null, '„Alle“ vergisst das Alter wieder');

  // Als Gast: wählbar, aber nicht gespeichert
  const g = frischeWelt('#muster');
  knopfMit(g.el.alterswahl.children, 'alter', '8').onclick();
  gleich(g.el.uebungen.children.length, 1, 'Gast mit 8 Jahren: nur Reihe fortsetzen');
  pruefe(g.el.alterHinweis.textContent.indexOf('1 weitere Übung ist') !== -1, 'und der Hinweis auf die Matrix');
}

/* ============================================================
   TEST 9: Zahlentabelle — der Reihe nach antippen
   ============================================================ */
console.log('\n=== TEST: Zahlentabelle ===');
{
  const w = frischeWelt('#aufmerksamkeit');
  meldeAnAls(w, 'Emma');
  oeffneUebung(w, 'aufmerksamkeit', 'zahlentabelle');
  knopfMit(w.el.einfKlasse.children, 'klasse', '3').onclick();
  w.el.einfLos.onclick();
  const a = w.lauf('LAUF.aufgabe');
  gleich(a.art, 'antippen', 'eine Tabelle zum Antippen');
  gleich(w.el.aufgabeAntwort.children.length, 9, 'Stufe 1: 3×3 Felder');
  gleich(w.lauf('LAUF.gesamt'), 4, 'eine Runde sind vier Tabellen');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Gesucht: 1') !== -1, 'auf Stufe 1 steht da, welche Zahl dran ist');

  const knopf = (id) => knopfMit(w.el.aufgabeAntwort.children, 'id', id);
  knopf('n5').onclick();
  pruefe(knopf('n5').classList.contains('daneben'), 'ein falscher Tipp wackelt');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Fehlgriffe: 1') !== -1, 'und wird gezählt');
  w.tick();
  pruefe(!knopf('n5').classList.contains('daneben'), 'danach ist das Wackeln vorbei');

  knopf('n1').onclick();
  pruefe(knopf('n1').disabled && knopf('n1').classList.contains('erledigt'), 'die 1 ist abgehakt');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Gesucht: 2') !== -1, 'jetzt wird die 2 gesucht');
  for (const id of a.richtig.slice(1)) knopf(id).onclick();
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'mit einem Fehlgriff ist es auf Stufe 1 geschafft');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('1 Fehlgriff') !== -1, 'die Fehlgriffe stehen dabei');

  weiter(w);
  loeseTabelle(w, 2);
  pruefe(w.el.aufgabeMeldung.className.indexOf('falsch') !== -1, 'zwei Fehlgriffe sind auf Stufe 1 zu viel');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('erlaubt ist einer') !== -1, 'und die Meldung sagt, wie viele erlaubt sind');

  // Mit Uhr läuft die Zeit ab
  w.el.aufgabeAbbrechen.onclick();
  oeffneUebung(w, 'aufmerksamkeit', 'zahlentabelle');
  w.el.einfUhr.onclick();
  w.el.einfLos.onclick();
  const b = w.lauf('LAUF.aufgabe');
  knopfMit(w.el.aufgabeAntwort.children, 'id', b.richtig[0]).onclick();
  for (let i = 0; i < w.lauf('LAUF.zeitGesamt'); i++) w.sekunde();
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Zeit ist um') !== -1, 'mit Uhr: „Die Zeit ist um“');
  pruefe(knopfMit(w.el.aufgabeAntwort.children, 'id', b.richtig[1]).classList.contains('vergessen'),
         'die nächste Zahl wird gezeigt');
}

/* ============================================================
   TEST 10: Fehlerbild — Vorlage oben, Bild darunter
   ============================================================ */
console.log('\n=== TEST: Fehlerbild und Suchbild ===');
{
  const w = frischeWelt('#aufmerksamkeit');
  meldeAnAls(w, 'Emma');
  oeffneUebung(w, 'aufmerksamkeit', 'fehlerbild');
  knopfMit(w.el.einfKlasse.children, 'klasse', '4').onclick();
  w.el.einfLos.onclick();
  const a = w.lauf('LAUF.aufgabe');
  pruefe(w.el.aufgabeAnzeige.className.indexOf('vergleich') !== -1, 'oben steht die Vorlage');
  const mini = w.el.aufgabeAnzeige.children[0].children[0];
  gleich(mini.children.length, a.anzeige.breite * a.anzeige.hoehe, 'die Vorlage hat alle Felder');
  pruefe(w.el.aufgabeAntwort.children.some((z) => z.innerHTML.indexOf('<svg') !== -1), 'in den Feldern zum Antippen sind Bilder');
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('von ' + a.richtig.length) !== -1, 'die Zahl der Unterschiede steht da');

  // Einen übersehen
  const zellen = w.el.aufgabeAntwort.children;
  const zelle = (c) => zellen.find((z) => Number(z.dataset.x) === c.x && Number(z.dataset.y) === c.y);
  for (const c of a.richtig.slice(1)) zelle(c).onclick();
  weiter(w);
  pruefe(w.el.aufgabeMeldung.textContent.indexOf('Übersehen') !== -1, 'die Meldung nennt den übersehenen Unterschied');
  const c0 = a.richtig[0];
  const bild = a.anzeige.inhalte[c0.y * a.anzeige.breite + c0.x];
  pruefe(zelle(c0).innerHTML.indexOf(bild) === 0 && zelle(c0).innerHTML.indexOf('class="marke"') !== -1,
         'das Bild bleibt stehen (oder das Feld leer, wenn dort etwas fehlt), die Markierung kommt dazu');

  // Suchbild auf Stufe 5: die Anzahl wird nicht verraten
  w.el.aufgabeAbbrechen.onclick();
  w.lauf('LAUF.uebung = findeUebung("suchbild"); LAUF.stufe = 5; LAUF.mitUhr = false; starteRunde();');
  pruefe(w.el.aufgabeMeldung.textContent === 'Markiert: 0 Felder.', 'ohne Anzahl: „Markiert: 0 Felder.“');
  loese(w, true);
  pruefe(w.el.aufgabeMeldung.className.indexOf('richtig') !== -1, 'alle gefunden ist richtig');
}

console.log('\n=== TEST: Direkter Link auf eine Übung ===');
{
  const w = frischeWelt('#spiegeln');
  gleich(sichtbar(w), 'einfuehrung', '#spiegeln öffnet gleich die Einführung');
  pruefe(w.el.einfTitel.textContent.indexOf('Spiegeln') !== -1, 'von Spiegeln und Drehen');
}

console.log('\n=== TEST: Alle Übungen einmal durch (auf jeder Stufe) ===');
{
  const w = frischeWelt('');
  meldeAnAls(w, 'Emma');
  let gut = true;
  for (const u of w.lauf('alleUebungen().map(u => u.id)')) {
    for (let stufe = 1; stufe <= 8; stufe++) {
      try {
        w.lauf(`LAUF.uebung = findeUebung("${u}"); LAUF.stufe = ${stufe}; LAUF.mitUhr = false; LAUF.paartyp = 'auto'; starteRunde();`);
        loese(w, true);
        if (w.el.aufgabeMeldung.className.indexOf('richtig') === -1) {
          gut = false;
          console.log('     nicht richtig: ' + u + ' Stufe ' + stufe + ' — ' + w.el.aufgabeMeldung.textContent);
        }
      } catch (e) {
        gut = false;
        console.log('     Fehler: ' + u + ' Stufe ' + stufe + ': ' + e.message);
      }
    }
  }
  pruefe(gut, 'jede Übung lässt sich auf jeder Stufe richtig lösen');
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
