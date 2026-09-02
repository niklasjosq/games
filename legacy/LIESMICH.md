# Legacy — die alten Python-Spiele

Hier liegen die **Originalversionen**, die auf einem Rechner mit Bildschirm laufen
(nicht im Browser). Sie sind der Ursprung der neuen Web-Spiele unter
[`../web/spiele/`](../web/spiele/) und bleiben als Andenken und Nachschlagewerk erhalten.

| Datei | Was es ist | Nachfolger im Browser |
|---|---|---|
| `nikolaus_spiel.py` | Das originale Nikolaus-Spiel mit pygame, 5 Level | `web/spiele/nikolaus/` |
| `nicecraft.py` | Ein begehbarer Boden mit ursina/panda3d | `web/spiele/nicecraft/` |

## Starten

```bash
cd /pfad/zu/Games
python3 -m venv .venv
source .venv/bin/activate
pip install -r legacy/requirements.txt

python legacy/nikolaus_spiel.py     # fragt nach dem Namen und startet ein Fenster
python legacy/nicecraft.py
```

## Wichtig zu wissen

- Die Bilder (`nikolaus.png`, `monster.png`, `schoko.png`) liegen jetzt bei den
  Web-Spielen unter `web/spiele/nikolaus/bilder/`. Beide Python-Dateien holen sie
  von dort — deshalb dürfen die Bilder nicht verschoben werden, sonst zeichnet
  das Spiel nur farbige Rechtecke.
- `nikolaus_spiel.py` schreibt die Punkte in `legacy/highscores.txt` (wird nicht
  eingecheckt). Die Web-Version merkt sich die Punkte stattdessen pro Profil im
  Browser.
- `nicecraft.py` schaltet Shader und OpenGL absichtlich auf einen sehr einfachen
  Modus (`gl-version 2 1`, `basic-shaders-only`). Ohne das startet es auf manchen
  Grafikkarten nicht.
- **Auf dem Jetson Nano laufen diese beiden Dateien nicht** — dort läuft nur die
  Web-Plattform. `ursina`/`panda3d` brauchen einen Desktop mit OpenGL.
