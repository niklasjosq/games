from pathlib import Path

from panda3d.core import loadPrcFileData

# Kompatibilitätsmodus für ältere/strengere OpenGL-Treiber.
loadPrcFileData("", "gl-version 2 1")
loadPrcFileData("", "basic-shaders-only #t")
loadPrcFileData("", "auto-shader #f")

from ursina import *
from ursina.prefabs.first_person_controller import FirstPersonController

# Startet das Spiel
icon_file = (Path(__file__).parent / ".." / "web" / "spiele" / "nikolaus"
             / "bilder" / "monster.png")
icon_path = str(icon_file.resolve()) if icon_file.exists() else None
app = Ursina(icon=icon_path)

# --- DIE REPARATUR ---
# Wir schalten die komplizierten Licht-Effekte aus.
# Das hilft, wenn der Computer "GLSL version not supported" sagt.
Entity.default_shader = None 
# ---------------------

# Der Boden
boden = Entity(
    model='plane',
    texture='grass',
    collider='box',
    scale=(100, 1, 100),
    color=color.green,
    double_sided=True # Hilft manchmal, dass man den Boden sicher sieht
)

# Hintergrundfarbe statt Himmel-Shader
window.color = color.rgb(125, 185, 235)

# Der Spieler
spieler = FirstPersonController()
spieler.cursor.visible = False # Versteckt den Mauszeiger, sieht schöner aus

# Startet das Spiel
app.run()
