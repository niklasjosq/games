# Creif — Spiele, Quiz, Schule und Konzentration

Eine kleine Plattform fürs Heimnetz: Die Kinder öffnen im Browser eine Seite,
wählen ihr Profil und finden dort **Spiele**, **Quiz**, **Schule** und
**Konzentration** in je einem Reiter. Läuft auf einem Jetson Nano im Haus —
ohne Internet, ohne Anmeldung bei irgendeinem Dienst, ohne Datenbank.

```
        ┌────────────────────────────────────────────────────┐
        │  🦊 Emma                   [Profil wechseln]       │
        ├────────────────────────────────────────────────────┤
        │  🎮 Spiele   🧠 Quiz   📚 Schule   🧩 Konzentration │
        ├────────────────────────────────────────────────────┤
        │  ┌───────────┐  ┌───────────┐                      │
        │  │ 🎅        │  │ ⛏️        │                      │
        │  │ Nikolaus  │  │ NiceCraft │                      │
        │  │ 5 Level   │  │ 3D bauen  │                      │
        │  └───────────┘  └───────────┘                      │
        └────────────────────────────────────────────────────┘
```

## Sofort ausprobieren

```bash
git clone https://github.com/niklasjosq/games.git Games
cd Games/web
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen. Mehr braucht es nicht — kein
`npm install`, kein Build, keine Abhängigkeiten.

Für den Jetson Nano im Heimnetz reicht ein Befehl:

```bash
./deploy/deploy-jetson.sh benutzer@jetson.local -i ~/.ssh/jetson
```

Danach läuft die Plattform dort auf **Port 8080** in einem eigenen, komplett
abgeschotteten Container, der anderen Diensten auf dem Gerät nicht in die Quere
kommt. Alle Einzelheiten: **[deploy/LIESMICH.md](deploy/LIESMICH.md)**

## Was gibt es?

### 🎮 Spiele

**Nikolaus vs. Mutanten-Minions** — [`web/spiele/nikolaus/`](web/spiele/nikolaus/)
Fünf Level: auf der Wiese durchhalten, eine Treppe hochhüpfen, über Wasserlöcher
springen, im Wettrennen Schokolade sammeln und zum Schluss den großen Turm
hinaufklettern, während Minions von oben fallen.
Steuerung: <kbd>←</kbd> <kbd>→</kbd> laufen, <kbd>↑</kbd> springen,
<kbd>Leertaste</kbd> werfen, <kbd>N</kbd> klettern, <kbd>P</kbd> Pause.

**NiceCraft** — [`web/spiele/nicecraft/`](web/spiele/nicecraft/)
Eine 3D-Welt zum Herumlaufen und Bauen: Klötze abbauen, Klötze setzen,
acht Sorten zur Auswahl. Steuerung: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
laufen, Maus umschauen, <kbd>Leertaste</kbd> springen, Maustasten bauen und abbauen.
Am besten mit einer echten Maus.

### 🧠 Quiz

**Rettet die ISS!** — [`web/quiz/rettet-die-iss/`](web/quiz/rettet-die-iss/)
Für 1 oder 2 Spieler: erst den Raumanzug auf der Raumstation suchen, dann die
ISS gegen fremde Raumschiffe verteidigen. Wer keine Munition mehr hat, muss ein
Rätsel lösen. Drei Schwierigkeitsstufen.
Details und eigene Rätsel: [LIESMICH.md](web/quiz/rettet-die-iss/LIESMICH.md)

### 📚 Schule

**Mathe** — [`web/schule/mathe/`](web/schule/mathe/)
Zwei Klassenstufen, je Lektion zwei Modi:

* **Üben** — endlos, sofortige Rückmeldung, bei Fehlern ein Tipp, Serienzähler
* **Test** — 10 Aufgaben, Uhr läuft, am Ende eine **Note von 1 bis 6** und ein
  Rückblick auf alle Aufgaben

| 3. Klasse (8 Jahre) | 5. Klasse (10 Jahre) |
|---|---|
| Plus und Minus bis 1000 | Große Zahlen bis eine Million |
| Das kleine Einmaleins | Schriftlich rechnen |
| Teilen mit Rest | Brüche |
| Sachaufgaben | Dezimalzahlen |
| Geld, Zeit und Längen | Einheiten umrechnen |
| | Umfang und Fläche |

Die Aufgaben werden jedes Mal neu gewürfelt, es gibt also keine Lösung zum
Auswendiglernen. Bei den Eingaben sind wir großzügig: `3,5` und `3.5` gelten
beide, `17:30` genauso wie `1730`.

**Englisch** — [`web/schule/englisch/`](web/schule/englisch/)
Über 400 Vokabeln für die 5. Klasse in 12 Lektionen, sortiert nach den *Themes*
von **Camden Town** (Westermann, Ausgabe 2020 für Gymnasien). Drei Wege zu üben:

* **Üben** — endlos, mit sofortiger Rückmeldung und Serienzähler. Drei Richtungen
  zur Wahl: Englisch tippen, Deutsch tippen oder aus vier Möglichkeiten auswählen
* **Test** — 10 Vokabeln, Uhr läuft, deutsch sehen und englisch schreiben wie in
  der Schule, am Ende eine **Note von 1 bis 6**
* **Lernbox** — der Karteikasten mit **fünf Fächern**: Was du kannst, wandert ein
  Fach weiter und kommt später wieder dran (Fach 1 heute, dann morgen, nach 3
  Tagen, nach einer Woche, nach zwei Wochen). Was du nicht wusstest, geht zurück
  in Fach 1

| Themes von Camden Town 5 | Lektionen |
|---|---|
| Welcome to Camden Town! | Begrüßung, Farben, Zahlen |
| Theme 1 — New in Camden | Zuhause und Camden · Familie und Freunde |
| Theme 2 — At school | Schulsachen und Classroom phrases · Schulfächer und Kantine |
| Theme 3 — Hobbies and activities | Hobbys, Uhrzeit, Wochentage · Talentshow |
| Theme 4 — Birthdays | Geburtstag, Monate, Jahreszeiten · Einkaufen und Kleidung |
| Theme 5 — Pets and animals | Tiere und Körperteile · Im Tierheim |
| Theme 6 — Holidays in Britain | Ferien in Großbritannien (freiwillig) |

Bei den Eingaben zählt das Wort, nicht die Form: Groß- und Kleinschreibung ist
egal, `colour` und `color` gelten beide, `run` genauso wie `to run`, `Küche`
genauso wie `Kueche` und `die Küche`. Ein echter Tippfehler gilt aber nicht —
im Vokabeltest muss man die Wörter schreiben können.

Wenn das Gerät eine englische Stimme hat, gibt es einen 🔊-Knopf zum Anhören.
Ohne Stimme ist er einfach nicht da; Tondateien braucht es keine.

> Die Wortliste ist eine **eigene Auswahl** zu den Wortfeldern des Buchs, keine
> Abschrift der Verlags-Vokabelliste. Einzelne Wörter aus dem Buch fehlen
> deshalb, andere stehen zusätzlich drin.

### 🧩 Konzentration

**Konzentration** — [`web/konzentration/`](web/konzentration/)
Übungen für 8- bis 12-Jährige, bei denen es ums **Lernen** geht, nicht ums
Punktesammeln. Fünf Gruppen mit zwölf Übungen, jede mit dem Alter, für das sie
gedacht ist:

| Gruppe | Übung | Alter |
|---|---|---|
| 🧠 Gedächtnis | **Merkfolge** (Figuren nacheinander, später auch rückwärts) | 8–12 |
| | **Gitter merken** | 8–12 |
| ➡️ Muster | **Reihe fortsetzen** (Form, Farbe, Größe, Drehung, Anzahl, Platz) | 8–12 |
| | **Matrix 3×3** | 10–12 |
| 🔷 Formen | **Was passt nicht?** (Ecken, rechte Winkel, gleich lange Seiten, Symmetrie) | 8–12 |
| | **Spiegeln und Drehen** | 9–12 |
| 🃏 Lern-Memory | Form ↔ Name, Form ↔ Eigenschaft, Englisch ↔ Deutsch aus den Vokabeln der 5. Klasse | 8–12 |
| 🔍 Aufmerksamkeit | **Suchbild** (alle Sterne, alle „d“ zwischen b, p und q, alle großen Dreiecke …) | 8–10 |
| | **Fehlerbild** (Vorlage und Bild vergleichen: Form, Farbe, Größe, Drehung, Spiegelung) | 8–10 |
| | **Linien verfolgen** (wo kommt die Linie von B an?) | 8–12 |
| | **Zahlentabelle** (der Reihe nach antippen, rückwärts, Kreise und Quadrate im Wechsel) | 9–12 |
| | **Pfeil oder Wort?** (zählen, ohne sich vom Wort auf dem Pfeil ablenken zu lassen) | 10–12 |

* **Wie alt bist du?** — oben auf der Seite wählt das Kind sein Alter (8 bis
  12), dann stehen nur die passenden Übungen da. Die Wahl wird im Profil
  gemerkt, „Alle“ zeigt wieder alles. Auf jeder Übung steht ihr Alter

* **Stufen statt Noten** — jede Übung hat die Stufen 1 bis 8. Zwei Treffer
  hintereinander: eine Stufe schwerer. Zwei Fehler: eine Stufe leichter. Wer auf
  Stufe 1 zweimal danebenliegt, bekommt ab dann vor jeder Aufgabe einen Tipp
* Beim ersten Mal fragt die Seite nach der **Klasse** (3. bis 6.) und fängt
  passend an — ist das Alter schon gewählt, ist die Klasse vorausgewählt
* Vor jeder Runde stehen ein **Lernziel** und ein **Trick**, nach jedem Fehler
  eine **Erklärung**, die die Regel oder Eigenschaft beim Namen nennt — die
  Formen heißen immer richtig: Raute, Trapez, Drachenviereck …
* Am Ende einer Runde: die neue Stufe, ein Rückblick auf jede Aufgabe und ein
  Satz wie „Bei Drehungen warst du schon sicher, bei Farbwechseln lohnt sich
  noch Üben.“
* **Ohne Uhr** ist der Normalfall. Wer mag, schaltet „Mit Uhr“ ein
* Die Farben sind so gewählt, dass Kinder mit Rot-Grün-Schwäche sie möglichst
  auseinanderhalten — und keine Aufgabe hängt allein an der Farbe

Die Figuren werden als SVG gezeichnet, Aufgaben jedes Mal neu gewürfelt.

## Profile

Auf der Startseite legt sich jedes Kind ein Profil an: Name, ein Tierbild und
eine vierstellige PIN. Danach werden Punkte, Bestwerte und Noten pro Kind
gemerkt.

> **Zur PIN:** Sie ist ein Riegel gegen versehentliches Verwechseln, **kein
> echter Schutz**. Sie liegt unverschlüsselt im Browser. Für eine Spieleseite
> im Kinderzimmer ist das genau richtig — für alles andere nicht.

Alles wird **im Browser** gespeichert (`localStorage`), nicht auf dem Server.
Das heißt: Auf dem Tablet und auf dem Laptop gibt es getrennte Profile und
getrennte Punkte. Dafür gibt es auch nichts zu sichern, nichts zu warten und
keine Daten, die das Haus verlassen. Unter „Für Eltern“ auf der Startseite
lassen sich Profile löschen und PINs zurücksetzen.

## Aufbau des Repos

```
web/                        ← das liefert der Webserver aus
├── index.html, shell.js    Startseite: Profilwahl und die vier Reiter
├── shared/                 von allen Seiten benutzt
│   ├── basis.css           gemeinsames Aussehen
│   ├── profil.js           Profile anlegen, PIN prüfen, anmelden
│   ├── speicher.js         Punkte, Bestenlisten, Lernfortschritt, Lernbox, Stufen
│   ├── katalog.js          alle Kacheln an einer Stelle
│   ├── schule.js           was alle Fächer teilen: Zufall, Noten, Lob
│   └── schule.css          wie Lektionen, Aufgaben und Ergebnis aussehen
├── spiele/nikolaus/        level.js (die Level) + spiel.js (Ablauf) + seite.js (Seite)
├── spiele/nicecraft/       welt.js + lib/ (three.js, mitgeliefert)
├── quiz/rettet-die-iss/    unverändert übernommen
├── schule/mathe/           aufgaben.js (Kern) + aufgaben-klasse3/5.js + mathe.js
├── schule/englisch/        vokabeln.js (Kern) + vokabeln-klasse5.js + englisch.js
└── konzentration/          formen.js (Figuren, SVG, Gitter) + kern.js (Übungen, Stufen)
                            + gedaechtnis/muster/geometrie/memory/aufmerksamkeit.js
                            + konzentration.js

legacy/                     die alten Python-Spiele (nur Desktop)
deploy/                     Deploy-Skript und Anleitung für den Jetson Nano
Dockerfile, nginx.conf      das Image: nur web/ und ein nginx
docker-compose*.yml         Betrieb auf dem Jetson (host bzw. bridge)
tests.sh                    alle Selbsttests (braucht nur node)
rauchtest.sh                jede Seite in echtem Chrome laden
```

**Ein neues Spiel dazubauen?** Einen Ordner unter `web/spiele/` anlegen und in
[`web/shared/katalog.js`](web/shared/katalog.js) einen Eintrag ergänzen — dann
erscheint es als Kachel. Punkte speichern mit
`speichereErgebnis('mein-spiel', punkte)`.

**Eine neue Mathe-Aufgabe?** In `aufgaben-klasse3.js` oder `-klasse5.js` eine
Funktion in die passende Liste schreiben, die `{frage, antwort, eingabe, hilfe}`
zurückgibt. `./tests.sh` rechnet sie dann 500-mal nach.

**Eine neue Vokabel?** In [`vokabeln-klasse5.js`](web/schule/englisch/vokabeln-klasse5.js)
`{ englisch: 'dog', deutsch: 'der Hund' }` in die passende Lektion schreiben.
Mehrere gültige Formen gehen als Liste: `englisch: ['colour', 'color']`.
`./tests.sh` prüft dann, dass es das Wort nicht schon gibt und dass es seine
eigene Antwort akzeptiert.

**Eine neue Konzentrationsübung?** In einer der Übungsdateien in
[`web/konzentration/`](web/konzentration/) mit
`uebung('meine-uebung', { gruppe, titel, symbol, alter: [8, 12], beschreibung, lernziel, tipps, stufen, beispiel, macheAufgabe })`
anmelden. `stufen` hat acht Einträge, `macheAufgabe(stufe)` gibt eine Aufgabe
wie in [`kern.js`](web/konzentration/kern.js) beschrieben zurück. `./tests.sh`
würfelt sie dann 300-mal pro Stufe und prüft jede nach.

## Tests

```bash
./tests.sh        # alle Selbsttests, braucht nur node — keine Pakete
./rauchtest.sh    # lädt jede Seite in echtem Chrome und sucht JS-Fehler
```

`tests.sh` prüft unter anderem: Profile und PINs, Punktespeicherung, alle fünf
Nikolaus-Level (inklusive Turmklettern bis zum Sieg), **500 gewürfelte Aufgaben
pro Mathe-Lektion** samt Nachrechnen der eigenen Lösung, **alle Englisch-Vokabeln**
auf Dubletten und darauf, dass jede ihre eigene Antwort akzeptiert, das Wandern
der Wörter durch die fünf Lernbox-Fächer, den kompletten Ablauf von Übung und
Test mit Notengebung, **300 gewürfelte Aufgaben pro Stufe und
Konzentrationsübung** (Lösung folgt aus der Regel, kein Ablenker ist zufällig
auch richtig, Spiegelbilder sind nie bloß Drehungen, jede Memory-Aussage passt
auf genau eine Form), das Steigen und Fallen der Stufen, und eine ganze
Quiz-Runde mit zwei Spielern.

In der Browser-Konsole geht außerdem:

```js
testeAufgaben(200)   // auf der Mathe-Seite: würfelt Aufgaben und rechnet nach
testeVokabeln()      // auf der Englisch-Seite: prüft alle Vokabeln
testeRaetsel(900)    // im Quiz: prüft die Quiz-Rätsel
testeUebungen(200)   // auf der Konzentrations-Seite: würfelt alle Übungen und prüft sie
```

## Die alten Python-Spiele

`nikolaus_spiel.py` und `nicecraft.py` liegen weiterhin in
[`legacy/`](legacy/). Sie brauchen einen Desktop mit OpenGL und laufen deshalb
**nicht** auf dem Jetson — dafür gibt es ja jetzt die Browser-Fassungen.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r legacy/requirements.txt
python legacy/nikolaus_spiel.py
```

## Voraussetzungen

| Wofür | Was |
|---|---|
| Die Plattform benutzen | Ein Browser. Sonst nichts. |
| Lokal ausprobieren | Python 3 (für `python3 -m http.server`) |
| Auf den Jetson ausrollen | Docker auf dem Mac, Docker auf dem Jetson, SSH-Zugang |
| Die Tests laufen lassen | `node` (ohne Pakete), für den Rauchtest zusätzlich Chrome |
| Die alten Python-Spiele | Python 3 mit `pygame` und `ursina`, siehe `legacy/` |

three.js (MIT-Lizenz) liegt in
[`web/spiele/nicecraft/lib/`](web/spiele/nicecraft/lib/) im Repo, damit die
Kinder-Geräte kein Internet brauchen.

## Lizenz

Creif steht unter der **MIT-Lizenz** — frei benutzen, verändern und
weitergeben, solange der Lizenzhinweis dabeibleibt. Der vollständige Text
steht in [`LICENSE`](LICENSE). Für three.js gilt dessen eigene Lizenz in
[`web/spiele/nicecraft/lib/LIZENZ-three.txt`](web/spiele/nicecraft/lib/LIZENZ-three.txt).
