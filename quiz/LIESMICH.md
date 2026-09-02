# 🚀 Rettet die ISS! — dein Weltraum-Quiz

Ein Quiz-Spiel für 1 oder 2 Spieler. Du suchst zuerst deinen Raumanzug auf der
Raumstation ISS und verteidigst sie danach gegen fremde Raumschiffe.
Zwischendurch musst du immer Mathe- und Logik-Rätsel lösen.

## So startest du das Spiel

Mach einen **Doppelklick auf `index.html`** — dann geht Firefox auf und das Spiel läuft.

Oder im Terminal:

```bash
firefox quiz/index.html
```

Du brauchst **kein Internet** und musst **nichts installieren**. 🎉

## Die Tasten

| Taste | Was passiert |
|---|---|
| **←** **→** (oder **A** **D**) | Raumschiff nach links/rechts fliegen |
| **Leertaste** | schießen |
| **1** **2** **3** **4** | Antwort beim Rätsel auswählen (geht auch mit der Maus) |

## So wird gespielt

**Phase 1 — Schatzsuche nach dem Raumanzug**
Du bekommst einen Hinweis, zum Beispiel *"Geh dorthin, wo man durch das große
Fenster auf die Erde schaut!"*. Klick das richtige Modul der ISS an, löse das
Rätsel — und du hast ein Anzug-Teil gefunden. Es gibt 5 Teile.
Falsch geraten ist nicht schlimm, du darfst es nochmal probieren.

**Phase 2 — Die ISS verteidigen**
Fremde Raumschiffe fliegen auf die ISS zu. Schieß sie ab!
Wenn dein Akku leer ist, kommt ein Rätsel: eine richtige Antwort gibt **+8 Schuss**.
Schafft es ein Raumschiff bis zur ISS, verlierst du ein ❤️. Bei 3 Wellen ohne
Herz-Verlust bekommst du dicke Bonuspunkte.

**Bei 2 Spielern** spielt erst Spieler 1 beide Phasen komplett durch, dann Spieler 2.
Am Ende werden die Punkte verglichen.

## Punkte

| Was | Punkte |
|---|---|
| Rätsel richtig | +10 (und +5 extra, wenn du schneller als 5 Sekunden bist) |
| Anzug-Teil gefunden | +20 |
| Raumschiff abgeschossen | +5 |
| Übriges ❤️ am Ende | +20 |

## Die Dateien

| Datei | Was drin ist |
|---|---|
| `index.html` | Das Grundgerüst mit allen Bildschirmen |
| `stil.css` | Die Farben, Knöpfe und Sterne |
| `raetsel.js` | **Alle Aufgaben** — hier kannst du eigene Rätsel dazuschreiben! |
| `spiel.js` | Der Spiel-Ablauf und das Weltraum-Bild (Canvas) |

## Was du selbst ändern kannst

Öffne die Dateien mit einem Text-Editor (z. B. `mousepad` oder `nano`).

**Ein eigenes Rätsel dazu?** In `raetsel.js` bei `LOGIK_RAETSEL` einfach eine Zeile ergänzen:

```js
{ frage: '🛸 Wie viele Beine haben 3 Marsmännchen mit je 4 Beinen?', antwort: 12 },
```

**Mehr Herzen?** In `spiel.js` nach `herzen: 3` suchen und die 3 ändern.

**Andere Farben?** In `stil.css` ganz oben bei `--blau`, `--gruen`, `--rot` … drehen.

**Leichter oder schwerer?** In `spiel.js` im Kasten `const K = {` findest du:
- `wellenGesamt: 3` — wie viele Wellen du überstehen musst
- `maxMunition: 16` — wie voll der Akku maximal wird
- `tempo: 6.5` beim `schiff` — wie schnell du fliegst

## Selbst-Test

Drück im Spiel **F12** (Entwickler-Werkzeuge), geh auf "Konsole", tipp `testeRaetsel()`
und drück Enter. Dann werden 900 Aufgaben geprüft und es sollte
`✅ alles ok` erscheinen.

### Für Erwachsene: der große Test

Im Terminal spielt dieser Test eine komplette 2-Spieler-Runde automatisch durch
(braucht nur Node, keine Pakete):

```bash
node quiz/test/test-spiel.js
```

Viel Spaß, Astronaut! 🧑‍🚀
