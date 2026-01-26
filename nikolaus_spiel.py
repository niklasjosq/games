import pygame
import random

# --- Initialisierung ---
pygame.init()

# Farben (für die Platzhalter)
WEISS = (255, 255, 255)
SCHWARZ = (0, 0, 0)
ROT = (200, 0, 0)       # Nikolaus
LILA = (128, 0, 128)    # Böses Minion
BRAUN = (139, 69, 19)   # Schokolade
GRUEN = (34, 139, 34)   # Wald/Boden
GELB = (255, 215, 0)    # Sammel-Schokolade

# Bildschirm Einstellungen
BREITE, HOEHE = 800, 600
screen = pygame.display.set_mode((BREITE, HOEHE))
pygame.display.set_caption("Nikolaus vs. Mutanten-Minions")
clock = pygame.time.Clock()

# --- Klassen ---

class Spieler(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        # Hier später: self.image = pygame.image.load("nikolaus.png")
        #self.image = pygame.Surface((40, 60))
        #self.image.fill(ROT) 

        # Eigenes Bild
        self.image = pygame.image.load("nikolaus.png").convert_alpha()
        self.image = pygame.transform.scale(self.image, (50, 70))


        self.rect = self.image.get_rect()
        self.rect.x = 50
        self.rect.y = HOEHE - 100
        self.change_x = 0
        self.change_y = 0
        self.schokolade_ammo = 5 # Startmunition

    def update(self):
        # Gravitation
        self.calc_grav()

        # Bewegung Links/Rechts
        self.rect.x += self.change_x

        # Bildschirmgrenzen beachten
        if self.rect.right > BREITE:
            self.rect.right = BREITE
        if self.rect.left < 0:
            self.rect.left = 0

        # Bewegung Oben/Unten (nur für Sprung/Gravitation relevant hier)
        self.rect.y += self.change_y

        # Bodenkollision
        if self.rect.y >= HOEHE - 100:
            self.rect.y = HOEHE - 100
            self.change_y = 0

    def calc_grav(self):
        if self.rect.y == 0:
            self.change_y = 0
        else:
            self.change_y += 0.35 # Schwerkraftstärke

    def jump(self):
        # Nur springen, wenn man auf dem Boden ist
        if self.rect.y >= HOEHE - 100:
            self.change_y = -10

    def go_left(self):
        self.change_x = -5

    def go_right(self):
        self.change_x = 5

    def stop(self):
        self.change_x = 0

class Monster(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        # Platzhalter für: Minion, 3 Augen, 4 Beine, 3 Arme
        #self.image = pygame.Surface((50, 50))
        #self.image.fill(LILA) 
        
        # Wir zeichnen symbolisch 3 Augen darauf (für den Look)
        #pygame.draw.circle(self.image, WEISS, (10, 15), 5)
        #pygame.draw.circle(self.image, WEISS, (25, 10), 5)
        #pygame.draw.circle(self.image, WEISS, (40, 15), 5)

        self.image = pygame.image.load("monster.png").convert_alpha()
        # Ggf. Größe anpassen:
        self.image = pygame.transform.scale(self.image, (50, 70))

        self.rect = self.image.get_rect()
        self.rect.x = BREITE + random.randint(100, 1000)
        self.rect.y = HOEHE - 90
        self.speed = random.randint(2, 5)

    def update(self):
        self.rect.x -= self.speed
        # Wenn aus dem Bild, respawn rechts
        if self.rect.right < 0:
            self.rect.x = BREITE + random.randint(50, 200)
            self.speed = random.randint(3, 6)

class SchokoladeWurf(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((15, 15))
        self.image.fill(BRAUN)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.speed = 8

    def update(self):
        self.rect.x += self.speed
        if self.rect.x > BREITE:
            self.kill() # Entfernen wenn aus dem Bild

class SammelObjekt(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        #self.image = pygame.Surface((20, 20))
        #self.image.fill(GELB)

        self.image = pygame.image.load("schoko.png").convert_alpha()
        # Ggf. Größe anpassen:
        self.image = pygame.transform.scale(self.image, (50, 70))
        
        self.rect = self.image.get_rect()
        self.rect.x = random.randint(0, BREITE)
        self.rect.y = HOEHE - 80 # Liegt am Boden

    def update(self):
        pass # Bewegt sich nicht

# --- Setup Gruppen ---
alle_sprites = pygame.sprite.Group()
monster_liste = pygame.sprite.Group()
schoko_geschosse = pygame.sprite.Group()
sammel_liste = pygame.sprite.Group()

spieler = Spieler()
alle_sprites.add(spieler)

# Monster erstellen
for i in range(3):
    monster = Monster()
    alle_sprites.add(monster)
    monster_liste.add(monster)

# Sammelbare Schokolade erstellen
for i in range(5):
    schoko = SammelObjekt()
    alle_sprites.add(schoko)
    sammel_liste.add(schoko)

# --- Hauptschleife ---
running = True
score = 0
game_over = False

while running:
    # 1. Event Handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        if not game_over:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    spieler.go_left()
                if event.key == pygame.K_RIGHT:
                    spieler.go_right()
                if event.key == pygame.K_UP:
                    spieler.jump()
                if event.key == pygame.K_SPACE:
                    # Schokolade werfen!
                    wurf = SchokoladeWurf(spieler.rect.right, spieler.rect.centery)
                    alle_sprites.add(wurf)
                    schoko_geschosse.add(wurf)

            if event.type == pygame.KEYUP:
                if event.key == pygame.K_LEFT and spieler.change_x < 0:
                    spieler.stop()
                if event.key == pygame.K_RIGHT and spieler.change_x > 0:
                    spieler.stop()

    if not game_over:
        # 2. Spiellogik
        alle_sprites.update()

        # Kollision: Schokolade trifft Monster
        hits = pygame.sprite.groupcollide(monster_liste, schoko_geschosse, True, True)
        for hit in hits:
            # Neues Monster spawnen, damit es nicht leer wird
            m = Monster()
            alle_sprites.add(m)
            monster_liste.add(m)
            score += 10 # Punkte fürs Treffen

        # Kollision: Spieler sammelt Schokolade am Boden
        hits = pygame.sprite.spritecollide(spieler, sammel_liste, True)
        for hit in hits:
            score += 5
            # Neue Schokolade spawnen
            s = SammelObjekt()
            alle_sprites.add(s)
            sammel_liste.add(s)

        # Kollision: Monster trifft Nikolaus
        if pygame.sprite.spritecollide(spieler, monster_liste, False):
            game_over = True

    # 3. Zeichnen
    screen.fill(WEISS) # Himmel
    
    # Boden zeichnen
    pygame.draw.rect(screen, GRUEN, [0, HOEHE-60, BREITE, 60])

    alle_sprites.draw(screen)

    # Score anzeigen
    font = pygame.font.SysFont('Calibri', 25, True, False)
    text = font.render(f"Punkte: {score}", True, SCHWARZ)
    screen.blit(text, [10, 10])

    if game_over:
        text_go = font.render("GAME OVER - Neustart mit Programmneustart", True, SCHWARZ)
        screen.blit(text_go, [BREITE//2 - 200, HOEHE//2])

    pygame.display.flip()
    clock.tick(60)

pygame.quit()