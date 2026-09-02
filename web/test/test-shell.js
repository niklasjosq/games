/* Test für die Startseite: Profil anlegen, PIN eingeben, Reiter
   umschalten, Kacheln anschauen. Alles in einem Fake-Browser. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const WEB = path.join(__dirname, '..') + path.sep;

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
    const el = {
      tagName: (tag || 'DIV').toUpperCase(),
      id: '', children: [], parent: null, _html: '',
      textContent: '', value: '', href: '', placeholder: '',
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
      get innerHTML() { return el._html; },
      set innerHTML(v) { el._html = String(v); if (v === '') el.children = []; },
      appendChild(k) { k.parent = el; el.children.push(k); return k; },
      addEventListener(art, fn) { el._hoerer[art] = fn; },
      querySelectorAll() { return []; },
      focus() {},
      get offsetWidth() { return 100; }
    };
    alle.push(el);
    return el;
  }

  function reg(id) {
    const el = neuesElement('div');
    el.id = id;
    nachId[id] = el;
    return el;
  }

  // Alle IDs aus der echten index.html übernehmen
  const html = fs.readFileSync(WEB + 'index.html', 'utf8');
  for (const t of html.matchAll(/id="([^"]+)"/g)) reg(t[1]);

  // Die Bildschirme kennzeichnen, wie es im HTML steht
  for (const id of ['profilwahl', 'profilNeu', 'pinEingabe', 'eltern', 'hauptmenue']) {
    nachId[id].className = 'bildschirm';
  }
  nachId.profilwahl.classList.add('aktiv');

  const dokument = {
    getElementById: (id) => nachId[id] || reg(id),
    createElement: neuesElement,
    querySelectorAll: (sel) => {
      const klasse = sel.replace('.', '');
      return alle.filter((e) => e.classList.contains(klasse));
    },
    addEventListener(art, fn) { dokument._hoerer[art] = fn; },
    _hoerer: {}
  };

  return { dokument: dokument, nachId: nachId };
}

function frischeWelt() {
  const fake = baueFakeBrowser();
  const daten = new Map();

  const umgebung = {
    console: console, Math: Math, JSON: JSON, Object: Object,
    Number: Number, String: String, Date: Date, Set: Set,
    document: fake.dokument,
    location: { hash: '', search: '' },
    confirm: () => true,
    alert: () => {},
    prompt: () => '0000',
    localStorage: {
      getItem: (k) => (daten.has(k) ? daten.get(k) : null),
      setItem: (k, v) => { daten.set(k, String(v)); },
      removeItem: (k) => { daten.delete(k); },
      key: (i) => [...daten.keys()][i] ?? null,
      get length() { return daten.size; }
    }
  };
  umgebung.window = umgebung;
  umgebung.window.addEventListener = () => {};

  const kontext = vm.createContext(umgebung);
  for (const datei of ['shared/speicher.js', 'shared/profil.js',
                       'shared/katalog.js', 'shell.js']) {
    vm.runInContext(fs.readFileSync(WEB + datei, 'utf8'), kontext, { filename: datei });
  }
  if (fake.dokument._hoerer.DOMContentLoaded) fake.dokument._hoerer.DOMContentLoaded();

  return { el: fake.nachId, lauf: (code) => vm.runInContext(code, kontext) };
}

/* PIN über den Ziffernblock eintippen */
function tippePin(w, pin) {
  for (const z of String(pin)) {
    const knopf = w.el.ziffernblock.children.find((k) => k.textContent === z);
    knopf.onclick();
  }
}

/* ============================================================
   TEST 1: Ein Kind legt sich ein Profil an
   ============================================================ */
console.log('\n=== TEST: Profil anlegen ===');
{
  const w = frischeWelt();

  pruefe(w.el.profilwahl.classList.contains('aktiv'), 'die Profilwahl ist zu sehen');
  // Der Hinweis wird als eigenes <p> eingehängt (unser Fake-Browser
  // baut Kinder nicht ins innerHTML ein, echte Browser schon)
  gleich(w.el.profilListe.children.length, 1, 'ein Hinweis steht in der leeren Liste');
  pruefe(w.el.profilListe.children[0].textContent.indexOf('Noch keine Profile') !== -1,
         'es steht da, dass noch keine Profile existieren');

  // Auf "Neues Profil anlegen"
  w.el.knopfNeuesProfil.onclick();
  pruefe(w.el.profilNeu.classList.contains('aktiv'), 'das Anlege-Formular ist offen');
  gleich(w.el.avatarWahl.children.length, 16, 'es stehen 16 Tierbilder zur Auswahl');

  // Ein Bild aussuchen
  w.el.avatarWahl.children[2].onclick();
  gleich(w.lauf('gewaehlterAvatar'), w.lauf('AVATARE[2]'), 'das gewählte Bild ist gemerkt');

  // Zu kurzer Name
  w.el.neuName.value = 'E';
  w.el.neuPin.value = '1234';
  w.el.neuPin2.value = '1234';
  w.el.neuSpeichern.onclick();
  pruefe(w.el.neuMeldung.textContent.indexOf('2 Buchstaben') !== -1,
         'ein zu kurzer Name wird bemängelt');
  gleich(w.lauf('ladeProfile().length'), 0, 'es wurde nichts angelegt');

  // PINs stimmen nicht überein
  w.el.neuName.value = 'Emma';
  w.el.neuPin.value = '1234';
  w.el.neuPin2.value = '4321';
  w.el.neuSpeichern.onclick();
  pruefe(w.el.neuMeldung.textContent.indexOf('nicht gleich') !== -1,
         'zwei verschiedene PINs werden bemängelt');
  gleich(w.lauf('ladeProfile().length'), 0, 'auch dann wird nichts angelegt');

  // Jetzt richtig
  w.el.neuPin2.value = '1234';
  w.el.neuSpeichern.onclick();
  gleich(w.lauf('ladeProfile().length'), 1, 'Emma ist angelegt');
  gleich(w.lauf('aktivesProfil().name'), 'Emma', 'und gleich angemeldet');
  pruefe(w.el.hauptmenue.classList.contains('aktiv'), 'wir landen im Hauptmenü');
  gleich(w.el.werName.textContent, 'Emma', 'oben steht Emmas Name');
}

/* ============================================================
   TEST 2: Anmelden mit dem Ziffernblock
   ============================================================ */
console.log('\n=== TEST: PIN eingeben ===');
{
  const w = frischeWelt();
  w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf('neuesProfil("Max", "🐼", "5678")');
  w.lauf('meldeAb()');
  w.lauf('zeichneProfilwahl()');

  gleich(w.el.profilListe.children.length, 2, 'beide Kinder stehen zur Auswahl');
  pruefe(w.el.profilListe.children[0].innerHTML.indexOf('Emma') !== -1,
         'Emma ist dabei');

  // Emma antippen
  w.el.profilListe.children[0].onclick();
  pruefe(w.el.pinEingabe.classList.contains('aktiv'), 'der PIN-Bildschirm ist offen');
  gleich(w.el.pinName.textContent, 'Emma', 'Emmas Name steht oben');
  gleich(w.el.pinAvatar.textContent, '🦊', 'und ihr Tierbild');
  gleich(w.el.ziffernblock.children.length, 12, 'der Ziffernblock hat 12 Tasten');
  gleich(w.el.pinPunkte.children.length, 4, 'es gibt vier PIN-Punkte');

  // Falsche PIN
  tippePin(w, '9999');
  pruefe(w.el.pinMeldung.textContent.indexOf('nicht die richtige') !== -1,
         'bei falscher PIN kommt ein Hinweis');
  gleich(w.lauf('aktivesProfil()'), null, 'niemand ist angemeldet');
  pruefe(w.el.pinPunkte.classList.contains('wackeln'), 'die Punkte wackeln');
  gleich(w.lauf('pinEingegeben'), '', 'die Eingabe wurde geleert');

  // Löschtaste probieren
  tippePin(w, '12');
  gleich(w.lauf('pinEingegeben'), '12', 'zwei Ziffern sind eingetippt');
  w.el.ziffernblock.children.find((k) => k.textContent === '←').onclick();
  gleich(w.lauf('pinEingegeben'), '1', 'die Löschtaste nimmt eine Ziffer weg');

  // Richtige PIN — nach der vierten Ziffern geht es von selbst weiter
  w.el.ziffernblock.children.find((k) => k.textContent === '←').onclick();
  tippePin(w, '1234');
  gleich(w.lauf('aktivesProfil().name'), 'Emma', 'mit richtiger PIN ist Emma angemeldet');
  pruefe(w.el.hauptmenue.classList.contains('aktiv'), 'wir sind im Hauptmenü');

  // Max kann nicht mit Emmas PIN rein
  w.el.knopfWechseln.onclick();
  w.el.profilListe.children[1].onclick();
  gleich(w.el.pinName.textContent, 'Max', 'jetzt ist Max ausgewählt');
  tippePin(w, '1234');
  gleich(w.lauf('aktivesProfil()'), null, 'Emmas PIN öffnet Max' + "'" + ' Profil nicht');
  tippePin(w, '5678');
  gleich(w.lauf('aktivesProfil().name'), 'Max', 'mit seiner eigenen PIN kommt Max rein');
}

/* ============================================================
   TEST 3: Reiter und Kacheln
   ============================================================ */
console.log('\n=== TEST: Reiter und Kacheln ===');
{
  const w = frischeWelt();
  const emma = w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf(`meldeAn("${emma.profil.id}", "1234")`);
  w.lauf('zeigeHauptmenue()');

  gleich(w.el.tableiste.children.length, 3, 'es gibt drei Reiter');
  pruefe(w.el.tableiste.children[0].innerHTML.indexOf('Spiele') !== -1, 'Reiter 1: Spiele');
  pruefe(w.el.tableiste.children[1].innerHTML.indexOf('Quiz') !== -1, 'Reiter 2: Quiz');
  pruefe(w.el.tableiste.children[2].innerHTML.indexOf('Schule') !== -1, 'Reiter 3: Schule');
  pruefe(w.el.tableiste.children[0].className.indexOf('aktiv') !== -1,
         'Spiele ist zuerst offen');

  gleich(w.el.kacheln.children.length, 2, 'im Reiter Spiele stehen 2 Kacheln');
  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('Nikolaus') !== -1, 'Nikolaus ist dabei');
  pruefe(w.el.kacheln.children[0].href.indexOf('spiele/nikolaus') !== -1,
         'die Kachel verlinkt aufs Spiel');
  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('Noch nicht gespielt') !== -1,
         'ohne Punkte steht "Noch nicht gespielt"');

  // Schule-Reiter
  w.el.tableiste.children[2].onclick();
  gleich(w.el.kacheln.children.length, 2, 'im Reiter Schule stehen 2 Kacheln');
  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('3. Klasse') !== -1, '3. Klasse ist dabei');
  pruefe(w.el.kacheln.children[1].innerHTML.indexOf('5. Klasse') !== -1, '5. Klasse ist dabei');
  pruefe(w.el.kacheln.children[0].href.indexOf('#klasse3') !== -1,
         'die Kachel springt direkt in die 3. Klasse');
  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('kein Test') !== -1,
         'ohne Test steht "Noch kein Test geschrieben"');

  // Quiz-Reiter
  w.el.tableiste.children[1].onclick();
  gleich(w.el.kacheln.children.length, 1, 'im Reiter Quiz steht 1 Kachel');
  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('Rettet die ISS') !== -1,
         'Rettet die ISS ist dabei');
}

/* ============================================================
   TEST 4: Punkte und Noten erscheinen auf den Kacheln
   ============================================================ */
console.log('\n=== TEST: Kacheln zeigen den Stand ===');
{
  const w = frischeWelt();
  const emma = w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf(`meldeAn("${emma.profil.id}", "1234")`);

  // Ein Spiel und ein Test wie im echten Leben
  w.lauf('speichereErgebnis("nikolaus", 340)');
  w.lauf('speichereTest("klasse3", "einmaleins", {richtig: 9, gesamt: 10, note: 1, dauerSek: 80})');
  w.lauf('speichereTest("klasse3", "plus-minus", {richtig: 7, gesamt: 10, note: 3, dauerSek: 150})');
  w.lauf('zeigeHauptmenue()');

  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('340') !== -1,
         'der Bestwert 340 steht auf der Nikolaus-Kachel');

  w.el.tableiste.children[2].onclick();
  const dreier = w.el.kacheln.children[0].innerHTML;
  pruefe(dreier.indexOf('2 Lektionen getestet') !== -1, 'zwei getestete Lektionen werden gezählt');
  pruefe(dreier.indexOf('Note 2') !== -1, 'der Notenschnitt aus 1 und 3 ist 2');

  // Das Quiz hat seine eigene Bestenliste — die lesen wir nur mit
  w.lauf(`localStorage.setItem('weltraum-quiz-bestenliste',
          JSON.stringify([{name: 'Emma', punkte: 610, stufe: 'mittel'}]))`);
  w.lauf('zeigeHauptmenue()');
  w.el.tableiste.children[1].onclick();
  pruefe(w.el.kacheln.children[0].innerHTML.indexOf('610') !== -1,
         'die Quiz-Kachel zeigt die Punkte aus der Quiz-Bestenliste');
}

/* ============================================================
   TEST 5: Als Gast weiterspielen
   ============================================================ */
console.log('\n=== TEST: Ohne Profil (Gast) ===');
{
  const w = frischeWelt();
  w.lauf('neuesProfil("Emma", "🦊", "1234")');
  w.lauf('meldeAb()');
  w.lauf('zeichneProfilwahl()');

  w.el.linkGast.onclick({ preventDefault: () => {} });
  pruefe(w.el.hauptmenue.classList.contains('aktiv'), 'auch als Gast kommt man ins Menü');
  gleich(w.el.werName.textContent, 'Gast', 'oben steht "Gast"');
  pruefe(w.el.werZusatz.textContent.indexOf('nicht gespeichert') !== -1,
         'es wird erklärt, dass nichts gespeichert wird');
  gleich(w.el.knopfWechseln.textContent, 'Anmelden', 'der Knopf heißt jetzt "Anmelden"');
  gleich(w.el.kacheln.children.length, 2, 'die Spiele sind trotzdem alle da');
}

/* ============================================================
   TEST 6: Der Eltern-Bereich
   ============================================================ */
console.log('\n=== TEST: Für Eltern ===');
{
  const w = frischeWelt();
  w.lauf('neuesProfil("Emma", "🦊", "1234")');
  const max = w.lauf('neuesProfil("Max", "🐼", "5678")');
  w.lauf(`meldeAn("${max.profil.id}", "5678")`);
  w.lauf('speichereErgebnis("nikolaus", 99)');
  w.lauf('zeichneProfilwahl()');

  w.el.linkEltern.onclick({ preventDefault: () => {} });
  pruefe(w.el.eltern.classList.contains('aktiv'), 'der Eltern-Bereich ist offen');
  gleich(w.el.elternListe.children.length, 2, 'beide Profile werden aufgelistet');

  // PIN von Emma zurücksetzen (prompt() gibt im Test "0000")
  const emmaZeile = w.el.elternListe.children[0];
  const pinKnopf = emmaZeile.children[0].children.find(
    (k) => k.textContent === 'PIN ändern');
  pinKnopf.onclick();
  pruefe(w.lauf('pinStimmt(ladeProfile()[0].id, "0000")'), 'Emmas PIN ist jetzt 0000');

  // Max löschen
  const maxZeile = w.el.elternListe.children[1];
  const wegKnopf = maxZeile.children[0].children.find(
    (k) => k.textContent === 'Profil löschen');
  wegKnopf.onclick();
  gleich(w.lauf('ladeProfile().length'), 1, 'Max ist gelöscht');
  gleich(w.lauf(`holeBestwert("nikolaus", "${max.profil.id}")`), 0, 'seine Punkte auch');
  gleich(w.lauf('aktivesProfil()'), null, 'und er ist abgemeldet');
}

/* ============================================================
   TEST 7: Namen mit Sonderzeichen richten keinen Schaden an
   ============================================================ */
console.log('\n=== TEST: Komische Namen ===');
{
  const w = frischeWelt();
  w.lauf(`neuesProfil("<b>Hacki", "🦊", "1111")`);
  w.lauf('meldeAb()');
  w.lauf('zeichneProfilwahl()');

  const html = w.el.profilListe.children[0].innerHTML;
  pruefe(html.indexOf('<b>Hacki') === -1, 'der Name wird nicht als HTML eingebaut');
  pruefe(html.indexOf('&lt;b&gt;Hacki') !== -1, 'sondern als harmloser Text angezeigt');
}

/* ---------------- Ergebnis ---------------- */
if (fehler === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN\n');
} else {
  console.log('\n💥 ' + fehler + ' TEST(S) FEHLGESCHLAGEN\n');
  process.exit(1);
}
