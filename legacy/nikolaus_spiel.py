import pygame
import random
import os

# Die Bilder liegen seit der Umstrukturierung beim Web-Spiel.
BILDER = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "web", "spiele", "nikolaus", "bilder")
HIGHSCORE_DATEI = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "highscores.txt")


def bild(name):
    return os.path.join(BILDER, name)


# --- Spielernamen abfragen ---
print("--- WILLKOMMEN ZUM NIKOLAUS SPIEL CREIF ---")
spieler_name = input("Bitte gib deinen Namen ein: ")
if not spieler_name:
    spieler_name = "Unbekannt"

# --- Initialisierung ---
pygame.init()

# Farben
WEISS = (255, 255, 255)
SCHWARZ = (0, 0, 0)
ROT = (200, 0, 0)       # Nikolaus
LILA = (128, 0, 128)    # Böses Minion
BRAUN = (139, 69, 19)   # Schokolade
GRUEN = (34, 139, 34)   # Wald/Boden
GELB = (255, 215, 0)    # Sammel-Schokolade
BRAUN_HELL = (205, 133, 63) # Kisten
GRAU = (100, 100, 100)      # Container
DUNKELGRUEN = (0, 100, 0)   # Baumstamm
BLAU = (0, 0, 255)      # Wasser

# Spiel Einstellungen
GAME_DURATION = 20 * 1000 # 20 Sekunden pro Level # umgestellt von 30 sek

# Bildschirm Einstellungen
BREITE, HOEHE = 800, 600
screen = pygame.display.set_mode((BREITE, HOEHE))
pygame.display.set_caption("Nikolaus vs. Mutanten-Minions")
clock = pygame.time.Clock()

# --- Globale Gruppen (werden in setup_level gefüllt) ---
alle_sprites = pygame.sprite.Group()
monster_liste = pygame.sprite.Group()
schoko_geschosse = pygame.sprite.Group()
sammel_liste = pygame.sprite.Group()
plattform_liste = pygame.sprite.Group()
wasser_liste = pygame.sprite.Group()
ziel_sprites = pygame.sprite.Group()

# --- Klassen ---

class Wasser(pygame.sprite.Sprite):
    def __init__(self, x, y, w, h):
        super().__init__()
        self.image = pygame.Surface((w, h))
        self.image.fill(BLAU)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

class Plattform(pygame.sprite.Sprite):
    def __init__(self, x, y, w, h, farbe):
        super().__init__()
        self.image = pygame.Surface((w, h))
        self.image.fill(farbe)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y

class Spieler(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        try:
            self.image = pygame.image.load(bild("nikolaus.png")).convert_alpha()
            self.image = pygame.transform.scale(self.image, (50, 70))
        except:
            self.image = pygame.Surface((50, 70))
            self.image.fill(ROT)

        self.rect = self.image.get_rect()
        self.rect.x = 50
        self.rect.y = HOEHE - 100
        self.change_x = 0
        self.change_y = 0
        self.facing_right = True
        self.schokolade_ammo = 5 

    def update(self):
        self.calc_grav()

        self.rect.x += self.change_x
        
        # Plattform Kollision X
        block_hit_list = pygame.sprite.spritecollide(self, plattform_liste, False)
        for block in block_hit_list:
            if self.change_x > 0:
                self.rect.right = block.rect.left
            elif self.change_x < 0:
                self.rect.left = block.rect.right

        if self.rect.right > BREITE:
            self.rect.right = BREITE
        if self.rect.left < 0:
            self.rect.left = 0

        self.rect.y += self.change_y
        
        # Plattform Kollision Y
        block_hit_list = pygame.sprite.spritecollide(self, plattform_liste, False)
        for block in block_hit_list:
            if self.change_y > 0:
                self.rect.bottom = block.rect.top
                self.change_y = 0
            elif self.change_y < 0:
                self.rect.top = block.rect.bottom
                self.change_y = 0

        if self.rect.y >= HOEHE - 130:
            self.rect.y = HOEHE - 130
            self.change_y = 0

    def calc_grav(self):
        if self.rect.y == 0:
            self.change_y = 0
        else:
            self.change_y += 0.35 

    def jump(self):
        self.rect.y += 2
        platform_hit_list = pygame.sprite.spritecollide(self, plattform_liste, False)
        self.rect.y -= 2
        
        if self.rect.y >= HOEHE - 130 or len(platform_hit_list) > 0:
            self.change_y = -10

    def go_left(self):
        self.change_x = -5
        self.facing_right = False

    def go_right(self):
        self.change_x = 5
        self.facing_right = True

    def stop(self):
        self.change_x = 0

class Monster(pygame.sprite.Sprite):
    def __init__(self, level=1):
        super().__init__()
        try:
            self.image = pygame.image.load(bild("monster.png")).convert_alpha()
            self.image = pygame.transform.scale(self.image, (50, 70))
        except:
            self.image = pygame.Surface((50, 70))
            self.image.fill(LILA)

        self.rect = self.image.get_rect()
        self.level = level
        self.speed_y = 0
        self.reset_pos(first_spawn=True)

    def reset_pos(self, first_spawn=False):
        self.speed_y = 0
        if self.level == 1 or self.level == 4:
            self.rect.x = BREITE + random.randint(100, 1000)
            self.rect.y = HOEHE - 90
            self.speed_x = random.randint(2, 5) * -1
        elif self.level == 2:
            # Monster kommen nur von rechts
            self.rect.x = BREITE + 100 if first_spawn else BREITE + 50
            self.speed_x = random.randint(2, 5) * -1
            self.rect.y = HOEHE - 90
        elif self.level == 3:
            # Monster kommen von überall oder sind auf Plattformen
            # Hier einfache Logik: Spawn zufällig rechts
            self.rect.x = BREITE + random.randint(50, 300)
            self.rect.y = HOEHE - 90 
            self.speed_x = random.randint(2, 6) * -1
            
            # Chance auf höhere Position (für Plattformen)
            if random.random() > 0.7:
                self.rect.y = HOEHE - 270 # Ungefähr Plattformhöhe
        elif self.level == 5:
            # Monster fallen von oben
            self.rect.x = random.randint(0, BREITE - 50)
            self.rect.y = -80
            self.speed_y = random.randint(3, 7)
            self.speed_x = random.choice([-2, -1, 0, 1, 2]) # Leicht schräg

    def update(self):
        self.rect.x += self.speed_x
        self.rect.y += self.speed_y
        
        if self.level == 1 or self.level == 4:
            if self.rect.right < 0:
                self.reset_pos()
        elif self.level == 2:
            if self.speed_x < 0 and self.rect.right < 0:
                self.rect.left = BREITE
            elif self.speed_x > 0 and self.rect.left > BREITE:
                self.rect.right = 0
        elif self.level == 3:
            if self.rect.right < 0:
                self.reset_pos()
        elif self.level == 5:
            if self.rect.top > HOEHE:
                self.reset_pos()

class SchokoladeWurf(pygame.sprite.Sprite):
    def __init__(self, x, y, speed_x, speed_y):
        super().__init__()
        self.image = pygame.Surface((15, 15))
        self.image.fill(BRAUN)
        self.rect = self.image.get_rect()
        self.rect.centerx = x
        self.rect.centery = y
        self.speed_x = speed_x
        self.speed_y = speed_y

    def update(self):
        self.rect.x += self.speed_x
        self.rect.y += self.speed_y
        if self.rect.right < 0 or self.rect.left > BREITE or self.rect.bottom < 0 or self.rect.top > HOEHE:
            self.kill()

class SammelObjekt(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        #self.image = pygame.Surface((20, 20))
        #self.image.fill(GELB)

        self.image = pygame.image.load(bild("schoko.png")).convert_alpha()
        # Ggf. Größe anpassen:
        self.image = pygame.transform.scale(self.image, (50, 70))
        
        self.rect = self.image.get_rect()
        self.rect.x = random.randint(0, BREITE)
        self.rect.y = HOEHE - 80 # Liegt am Boden

    def update(self):
        pass # Bewegt sich nicht

# --- Highscore Funktionen ---
def load_highscores():
    scores = []
    if os.path.exists(HIGHSCORE_DATEI):
        with open(HIGHSCORE_DATEI, "r") as f:
            for line in f:
                try:
                    parts = line.strip().split(",")
                    if len(parts) == 2:
                        scores.append((parts[0], int(parts[1])))
                except ValueError:
                    continue
    # Absteigend sortieren
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores

def save_highscore(name, score):
    with open(HIGHSCORE_DATEI, "a") as f:
        f.write(f"{name},{score}\n")

# --- Setup Funktion ---
def setup_level(level_nr):
    # Alles leeren
    alle_sprites.empty()
    monster_liste.empty()
    schoko_geschosse.empty()
    sammel_liste.empty()
    plattform_liste.empty()
    wasser_liste.empty()
    ziel_sprites.empty()

    # Spieler neu setzen
    spieler.rect.x = 50
    spieler.rect.y = HOEHE - 130
    spieler.change_x = 0
    spieler.change_y = 0
    alle_sprites.add(spieler)

    if level_nr == 1:
        # Level 1 Setup
        for i in range(3):
            monster = Monster(level=1)
            alle_sprites.add(monster)
            monster_liste.add(monster)
        
        for i in range(5):
            schoko = SammelObjekt()
            alle_sprites.add(schoko)
            sammel_liste.add(schoko)
            
    elif level_nr == 2:
        # Level 2 Setup
        # Kisten und Baumstämme
        platforms = [
            # x, y, w, h, color
            (200, HOEHE - 150, 100, 20, BRAUN_HELL), # Kiste
            (400, HOEHE - 250, 120, 20, DUNKELGRUEN), # Baumstamm
            (100, HOEHE - 300, 80, 20, BRAUN_HELL),
        ]
        
        # Container Turm (Ziel für Level 3)
        # Turm rechts bauen
        tower_x = 700
        for i in range(5):
            p = Plattform(tower_x, HOEHE - 60 - (i+1)*60, 80, 50, GRAU)
            plattform_liste.add(p)
            alle_sprites.add(p)
            
        for p_data in platforms:
            p = Plattform(*p_data)
            plattform_liste.add(p)
            alle_sprites.add(p)

        # Monster von beiden Seiten (erst später im Loop spawnen)
        # for i in range(5):
        #    monster = Monster(level=2)
        #    alle_sprites.add(monster)
        #    monster_liste.add(monster)

    elif level_nr == 3:
        # Level 3 Setup - Wasser und Plattformen
        
        # Wasserlöcher am Boden (tödlich)
        # Wir platzieren Wasser auf dem Bodenlevel
        w1 = Wasser(200, HOEHE - 60, 80, 60)   # 150, 80, 60 vorher
        w2 = Wasser(500, HOEHE - 60, 80, 60)
        wasser_liste.add(w1, w2)
        alle_sprites.add(w1, w2)

        # Plattformen zum Drüberspringen
        platforms = [
            # (X, Y, Breite, Höhe, Farbe)
            # X: 0 ist ganz links, 800 ist ganz rechts
            # Y: 0 ist ganz oben, 600 ist ganz unten
            (200, HOEHE - 170, 100, 20, BRAUN_HELL),
            (520, HOEHE - 170, 100, 20, BRAUN_HELL),
            (370, HOEHE - 300, 100, 20, DUNKELGRUEN), # Hohe Plattform Mitte
        ]

        for p_data in platforms:
            p = Plattform(*p_data)
            plattform_liste.add(p)
            alle_sprites.add(p)
            
        # Ziel-Plattform rechts (Gelb) - Erreichen startet Level 4
        ziel = Plattform(680, HOEHE - 250, 100, 20, GELB)
        plattform_liste.add(ziel)
        alle_sprites.add(ziel)
        ziel_sprites.add(ziel)

        # Monster auf Plattformen
        m1 = Monster(level=3)
        m1.rect.x = 380
        m1.rect.y = HOEHE - 300 - 70 # Auf der hohen Plattform
        m1.speed_x = 2
        alle_sprites.add(m1)
        monster_liste.add(m1)

        # Weitere Monster spawnen normal
        for i in range(3):
            monster = Monster(level=3)
            alle_sprites.add(monster)
            monster_liste.add(monster)

    elif level_nr == 4:
        # Level 4 Setup - Sammeln gegen Monster
        for i in range(5):
            monster = Monster(level=4)
            alle_sprites.add(monster)
            monster_liste.add(monster)
        
        for i in range(8): # Ein paar mehr Schokos
            schoko = SammelObjekt()
            alle_sprites.add(schoko)
            sammel_liste.add(schoko)

    elif level_nr == 5:
        # Level 5 Setup - Turm klettern
        # Schräger Turm aus Containern (rechts)
        # Visuell: Wir fügen sie nur zu alle_sprites hinzu (nicht plattform_liste), 
        # damit man nicht hängen bleibt, sondern klettert.
        start_x = BREITE - 180
        for i in range(10):
            x_pos = start_x + (i * 8) # Leicht schräg nach rechts
            y_pos = HOEHE - 60 - (i * 60)
            
            if i == 9:
                # Die oberste Kiste ist das Ziel (Gelb)
                ziel = Plattform(x_pos, y_pos, 100, 50, GELB)
                ziel_sprites.add(ziel)
                alle_sprites.add(ziel)
            else:
                p = Plattform(x_pos, y_pos, 100, 50, GRAU)
                alle_sprites.add(p)
        
        # Monster von oben
        for i in range(6):
            monster = Monster(level=5)
            alle_sprites.add(monster)
            monster_liste.add(monster)

    return level_nr

# --- Main Setup ---
spieler = Spieler()
current_level = 1
setup_level(current_level)

running = True
score = 0
game_over = False
game_won = False
level_4_score = 0

# Zustandsvariablen für Levelübergang
game_state = "playing" # "playing", "countdown"
transition_start_time = 0
level_2_start_time = 0
monsters_spawned_level_2 = False

# Zeit und Highscore
start_ticks = pygame.time.get_ticks()
score_saved = False
highscores = []

while running:
    current_time = pygame.time.get_ticks()

    # 1. Event Handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        # Eingabe nur wenn Spiel läuft und nicht im Countdown
        if not game_over and not game_won and game_state == "playing":
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    spieler.go_left()
                if event.key == pygame.K_RIGHT:
                    spieler.go_right()
                if event.key == pygame.K_UP:
                    spieler.jump()
                
                if event.key == pygame.K_SPACE:
                    # Schießen logic
                    sx, sy = 0, 0
                    keys = pygame.key.get_pressed()
                    
                    # Wenn Pfeiltasten gedrückt, in diese Richtung schießen
                    # Sonst in Blickrichtung
                    fired = False
                    if keys[pygame.K_UP]:
                        sy = -10
                        fired = True
                    if keys[pygame.K_DOWN]:
                        sy = 10
                        fired = True
                    
                    # Links schießen entfernt
                    if keys[pygame.K_RIGHT]:
                        sx = 10
                        fired = True
                    
                    if not fired:
                        # Standard Blickrichtung: Immer nach rechts
                        sx = 10
                    
                    wurf = SchokoladeWurf(spieler.rect.centerx, spieler.rect.centery, sx, sy)
                    alle_sprites.add(wurf)
                    schoko_geschosse.add(wurf)

            if event.type == pygame.KEYUP:
                if event.key == pygame.K_LEFT and spieler.change_x < 0:
                    spieler.stop()
                if event.key == pygame.K_RIGHT and spieler.change_x > 0:
                    spieler.stop()

    if not game_over and not game_won:
        
        if game_state == "countdown":
            # Warten bis 5 Sekunden vorbei sind
            if current_time - transition_start_time > 5000:
                game_state = "playing"
                current_level += 1
                setup_level(current_level)
                spieler.rect.x = 50
                level_2_start_time = current_time
                monsters_spawned_level_2 = False
                start_ticks = current_time
                if current_level == 4:
                    level_4_score = 0

        elif game_state == "playing":
            # Zeit prüfen
            elapsed_time = current_time - start_ticks
            
            # Standard Zeit oder Level 5 Zeit
            limit = GAME_DURATION
            if current_level == 5:
                limit = 120 * 1000
                
            if max(0, limit - elapsed_time) == 0:
                if current_level == 1:
                    # Level 1: Wenn Zeit abgelaufen -> Weiter zu Level 2
                    game_state = "countdown"
                    transition_start_time = current_time
                else:
                    # Andere Level: Wenn Zeit abgelaufen -> Game Over
                    game_over = True

            # 2. Spiellogik
            alle_sprites.update()

            # Level Wechsel Logik (Trigger Countdown)
            # Level 1 Score-Bedingung entfernt

            # Level 2 Monster Delay (5 Sekunden nach Levelstart)
            if current_level == 2 and not monsters_spawned_level_2:
                if current_time - level_2_start_time > 5000:
                    for i in range(5):
                        monster = Monster(level=2)
                        alle_sprites.add(monster)
                        monster_liste.add(monster)
                    monsters_spawned_level_2 = True

            # Zielbedingung Level 2 -> Level 3
            if current_level == 2:
                # Check if player is high enough (top of tower)
                if spieler.rect.x > 650 and spieler.rect.y < HOEHE - 300:
                    game_state = "countdown"
                    transition_start_time = current_time

            # Zielbedingung Level 3 -> Level 4
            if current_level == 3:
                # Wenn Spieler auf der Zielplattform landet
                # Wir prüfen mit leicht vergrößertem Rect, da update() die Kollision bereits aufgelöst hat
                check_rect = spieler.rect.inflate(2, 2)
                hit = False
                for z in ziel_sprites:
                    if check_rect.colliderect(z.rect):
                        hit = True
                        break
                
                if hit:
                    game_state = "countdown"
                    transition_start_time = current_time

            # Zielbedingung Level 4 -> Level 5
            if current_level == 4:
                if level_4_score >= 100:
                    game_state = "countdown"
                    transition_start_time = current_time

            # Klettern und Zielbedingung Level 5 -> Sieg
            if current_level == 5:
                # Kletter-Logik
                keys = pygame.key.get_pressed()
                # Kletterbereich: Rechts im Bild (ungefähr ab Turm-Start)
                if keys[pygame.K_n] and spieler.rect.x > BREITE - 250:
                    spieler.change_y = -5 # Klettert hoch (schwerkraft entgegen)
                
                # Ziel erreicht (Gelbe Box berührt)
                if pygame.sprite.spritecollide(spieler, ziel_sprites, False):
                    game_won = True

            # Kollision: Schokolade trifft Monster
            hits = pygame.sprite.groupcollide(monster_liste, schoko_geschosse, True, True)
            for hit in hits:
                score += 10
                # Neues Monster spawnen
                m = Monster(level=current_level)
                alle_sprites.add(m)
                monster_liste.add(m)

            # Kollision: Spieler sammelt Schokolade
            if current_level == 1 or current_level == 4:
                hits = pygame.sprite.spritecollide(spieler, sammel_liste, True)
                for hit in hits:
                    score += 5
                    if current_level == 4:
                        level_4_score += 5
                    s = SammelObjekt()
                    alle_sprites.add(s)
                    sammel_liste.add(s)

            # Level 4: Monster sammeln Schokolade
            if current_level == 4:
                hits = pygame.sprite.groupcollide(monster_liste, sammel_liste, False, True)
                for monster, schokos in hits.items():
                    for s in schokos:
                        # Schoko weg, neue spawnen
                        ns = SammelObjekt()
                        alle_sprites.add(ns)
                        sammel_liste.add(ns)

            # Kollision: Monster trifft Nikolaus
            if pygame.sprite.spritecollide(spieler, monster_liste, False):
                game_over = True
            
            # Kollision: Wasser
            if pygame.sprite.spritecollide(spieler, wasser_liste, False):
                game_over = True

    # Highscore speichern bei Spielende
    if (game_over or game_won) and not score_saved:
        save_highscore(spieler_name, score)
        highscores = load_highscores()
        score_saved = True

    # 3. Zeichnen
    screen.fill(WEISS) # Himmel
    
    # Boden
    pygame.draw.rect(screen, GRUEN, [0, HOEHE-60, BREITE, 60])

    alle_sprites.draw(screen)

    # UI
    font = pygame.font.SysFont('Calibri', 25, True, False)
    
    # Zeit berechnen für Anzeige
    elapsed_time = current_time - start_ticks
    
    # Standard Zeit
    current_game_duration = GAME_DURATION
    
    # Level 5 hat mehr Zeit
    if current_level == 5:
        current_game_duration = 120 * 1000

    time_left_seconds = max(0, (current_game_duration - elapsed_time) // 1000)
    
    if current_level == 4:
        text = font.render(f"Punkte: {score} (Ziel: {level_4_score}/100) | Level: {current_level} | Zeit: {time_left_seconds}s", True, SCHWARZ)
    elif current_level == 5:
        text = font.render(f"LEVEL 5: Drücke 'N' am Turm zum Klettern! Weiche den Monstern aus! Zeit: {time_left_seconds}s", True, SCHWARZ)
    else:
        text = font.render(f"Punkte: {score} | Level: {current_level} | Zeit: {time_left_seconds}s", True, SCHWARZ)
    screen.blit(text, [10, 10])

    if game_state == "countdown":
        remaining_time = 5 - (current_time - transition_start_time) // 1000
        next_lvl = current_level + 1
        text_cd = font.render(f"LEVEL {next_lvl} startet in: {remaining_time}", True, ROT)
        screen.blit(text_cd, [BREITE//2 - 150, HOEHE//2])

    if game_over or game_won:
        # Overlay für bessere Lesbarkeit
        s = pygame.Surface((400, 400))
        s.set_alpha(200)
        s.fill(WEISS)
        screen.blit(s, (BREITE//2 - 200, HOEHE//2 - 200))

        if game_over:
            msg = "GAME OVER - Zeit um!" if time_left_seconds == 0 else "GAME OVER"
            text_go = font.render(msg, True, ROT)
            screen.blit(text_go, [BREITE//2 - 100, HOEHE//2 - 180])
        elif game_won:
            text_win = font.render("GEWONNEN! ALLE LEVEL GESCHAFFT!", True, GRUEN)
            screen.blit(text_win, [BREITE//2 - 200, HOEHE//2 - 180])
        
        # Highscores anzeigen
        text_hs = font.render("--- HIGHSCORES ---", True, SCHWARZ)
        screen.blit(text_hs, [BREITE//2 - 100, HOEHE//2 - 140])
        
        y_offset = -100
        for i, (name, s_score) in enumerate(highscores[:5]): # Top 5
            entry_text = font.render(f"{i+1}. {name}: {s_score}", True, SCHWARZ)
            screen.blit(entry_text, [BREITE//2 - 100, HOEHE//2 + y_offset])
            y_offset += 30

    pygame.display.flip()
    clock.tick(60)

pygame.quit()