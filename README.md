# Creif — Spiele, Quiz und Schule

Eine kleine Plattform fürs Heimnetz: Die Kinder öffnen im Browser eine Seite,
wählen ihr Profil und finden dort **Spiele**, **Quiz** und **Schule** in
je einem Reiter. Läuft auf einem Jetson Nano im Haus — ohne Internet, ohne
Anmeldung bei irgendeinem Dienst, ohne Datenbank.

```
        ┌─────────────────────────────────────────┐
        │  🦊 Emma        [Profil wechseln]       │
        ├─────────────────────────────────────────┤
        │  🎮 Spiele    🧠 Quiz    📚 Schule      │
        ├─────────────────────────────────────────┤
        │  ┌───────────┐  ┌───────────┐           │
        │  │ 🎅        │  │ ⛏️        │           │
        │  │ Nikolaus  │  │ NiceCraft │           │
        │  │ 5 Level   │  │ 3D bauen  │           │
        │  └───────────┘  └───────────┘           │
        └─────────────────────────────────────────┘
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
abgeschotteten Container — neben dem ein anderer Dienst auf Port 8000, das davon nichts
merkt. Alle Einzelheiten: **[deploy/LIESMICH.md](deploy/LIESMICH.md)**

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
├── index.html, shell.js    Startseite: Profilwahl und die drei Reiter
├── shared/                 von allen Seiten benutzt
│   ├── basis.css           gemeinsames Aussehen
│   ├── profil.js           Profile anlegen, PIN prüfen, anmelden
│   ├── speicher.js         Punkte, Bestenlisten, Lernfortschritt
│   └── katalog.js          alle Kacheln an einer Stelle
├── spiele/nikolaus/        level.js (die Level) + spiel.js (Ablauf) + seite.js (Seite)
├── spiele/nicecraft/       welt.js + lib/ (three.js, mitgeliefert)
├── quiz/rettet-die-iss/    unverändert übernommen
└── schule/mathe/           aufgaben.js (Kern) + aufgaben-klasse3/5.js + mathe.js

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

## Tests

```bash
./tests.sh        # alle Selbsttests, braucht nur node — keine Pakete
./rauchtest.sh    # lädt jede Seite in echtem Chrome und sucht JS-Fehler
```

`tests.sh` prüft unter anderem: Profile und PINs, Punktespeicherung, alle fünf
Nikolaus-Level (inklusive Turmklettern bis zum Sieg), **500 gewürfelte Aufgaben
pro Mathe-Lektion** samt Nachrechnen der eigenen Lösung, den kompletten Ablauf
von Übung und Test mit Notengebung, und eine ganze Quiz-Runde mit zwei Spielern.

In der Browser-Konsole geht außerdem:

```js
testeAufgaben(200)   // auf der Mathe-Seite: würfelt Aufgaben und rechnet nach
testeRaetsel(900)    // im Quiz: prüft die Quiz-Rätsel
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
