# Creif: Games Collection

Dieses Repository enthält eine Sammlung von kleinen Spielen — in Python und im Browser.

## Spiele

### 1. Nikolaus vs. Mutanten-Minions (2D Platformer)

Ein 2D-Platformer-Spiel, in dem der Nikolaus gegen Mutanten-Minions kämpft und Schokolade sammelt.

**Steuerung:**
*   **Pfeiltasten**: Bewegen und Springen
*   **Leertaste**: Schießen

**Start:**
```bash
python nikolaus_spiel.py
```

### 2. NiceCraft (3D Experiment)

Ein kleines 3D-Experiment, das mit der Ursina-Engine erstellt wurde.

**Start:**
```bash
python nicecraft.py
```

### 3. Rettet die ISS! (Weltraum-Quiz im Browser)

Ein Quiz-Spiel für 1 oder 2 Spieler: erst den Raumanzug auf der ISS suchen,
dann die Raumstation gegen fremde Raumschiffe verteidigen — mit Mathe- und
Logik-Rätseln zwischendurch. Läuft ohne Installation und ohne Internet.

**Steuerung:**
*   **Pfeiltasten** / **A**, **D**: Raumschiff bewegen
*   **Leertaste**: Schießen
*   **1**–**4**: Antwort beim Rätsel wählen (Maus geht auch)

**Start:**
```bash
firefox quiz/index.html
```
Oder einfach `quiz/index.html` doppelklicken.

Details, eigene Rätsel und Tests: siehe [quiz/LIESMICH.md](quiz/LIESMICH.md).

## Installation

1.  Klone dieses Repository:
    ```bash
    git clone https://github.com/niklasjosq/games.git
    cd games
    ```

2.  Installiere die benötigten Abhängigkeiten:
    ```bash
    pip install -r requirements.txt
    ```

## Voraussetzungen

*   Python 3.x
*   `pygame` (für Nikolaus Spiel)
*   `ursina` (für NiceCraft)
*   Ein Browser (für das Weltraum-Quiz — sonst nichts)
