from ursina import *
from ursina.prefabs.first_person_controller import FirstPersonController

# Startet das Spiel
app = Ursina()

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

# Der Himmel
Sky()

# Der Spieler
spieler = FirstPersonController()
spieler.cursor.visible = False # Versteckt den Mauszeiger, sieht schöner aus

# Startet das Spiel
app.run()