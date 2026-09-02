# Die Plattform auf dem Jetson Nano einrichten

Die Plattform besteht **nur aus Dateien** — HTML, CSS, JavaScript und drei Bilder.
Es gibt keine Datenbank, kein Backend und nichts zu bauen. Der Jetson muss die
Dateien also bloß ausliefern. Deshalb reicht der Webserver, der bei Python
schon dabei ist.

## 1. Repo auf den Jetson holen

```bash
cd ~
git clone https://github.com/niklasjosq/games.git Games
```

Später aktualisieren (das ist das ganze „Deployment“):

```bash
cd ~/Games && git pull
```

Ein Neustart des Dienstes ist dabei **nicht** nötig — der Server liest die
Dateien bei jedem Aufruf frisch von der Platte.

## 2. Dienst einrichten

Erst die beiden markierten Zeilen in `spiele-server.service` prüfen
(`User=` und `WorkingDirectory=`) und auf den eigenen Benutzernamen anpassen:

```bash
nano ~/Games/jetson/spiele-server.service
```

Dann installieren und starten:

```bash
sudo cp ~/Games/jetson/spiele-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now spiele-server
```

Läuft alles?

```bash
systemctl status spiele-server
curl -I http://localhost:8000/
```

Der Dienst startet ab jetzt automatisch mit, wenn der Jetson bootet.

## 3. Wie kommen die Kinder auf die Seite?

**Der verlässlichste Weg: feste IP-Adresse.** Im Router (Fritzbox & Co.) für
den Jetson eine feste Adresse vergeben („DHCP-Reservierung“, z. B.
`192.168.1.50`). Dann geht auf jedem Gerät im Haus:

```
http://192.168.1.50:8000
```

**Bequemer, wenn es funktioniert: der Name.** Auf JetPack läuft normalerweise
`avahi`, dann klappt auch:

```
http://<hostname>.local:8000
```

Das versteht macOS, iPhone, iPad und neuere Android-Geräte. Ältere Android-
Tablets kennen `.local` nicht — die brauchen die IP-Adresse.

**Tipp:** Auf den Tablets der Kinder die Seite als Lesezeichen auf den
Startbildschirm legen. Dann sieht es aus wie eine App.

## 4. Firewall

JetPack hat normalerweise keine aktive Firewall — dann ist nichts zu tun.
Falls doch `ufw` eingeschaltet wurde:

```bash
sudo ufw allow 8000/tcp
```

Warum Port 8000 und nicht 80? Für Port 80 bräuchte der Dienst Root-Rechte.
Das ist für eine Spieleseite im Heimnetz unnötig.

## 5. Kein HTTPS nötig

Alles bleibt im Heimnetz, und keine der benutzten Browser-Funktionen verlangt
eine verschlüsselte Verbindung: Canvas, WebGL, Pointer Lock, Töne (nach einem
Klick) und der lokale Speicher funktionieren alle über `http://`.

## 6. Wenn es mal nicht läuft

| Problem | Was tun |
|---|---|
| Seite lädt nicht | `systemctl status spiele-server` — läuft der Dienst? |
| „Address already in use“ | Ein anderer Dienst hat Port 8000. Im Service-File eine andere Nummer eintragen. |
| Dienst startet nicht | `journalctl -u spiele-server -n 50` zeigt die Ursache. Meistens ist `WorkingDirectory` falsch. |
| Kinder sehen alte Version | Im Browser einmal hart neu laden (Strg+Umschalt+R bzw. lange auf Neu-Laden tippen). |
| NiceCraft bleibt schwarz | Das Gerät kann kein 3D (WebGL). Die Seite erklärt das inzwischen selbst. |

## 7. Später mal mehr Betrieb?

`python3 -m http.server` bedient eine Anfrage nach der anderen. Für zwei bis
vier Kinder im Haus ist das völlig ausreichend. Wenn es mal ruckelt, ist nginx
der nächste Schritt:

```bash
sudo apt install nginx
sudo ln -s /home/jetson/Games/web /var/www/spiele
# in /etc/nginx/sites-available/default: root /var/www/spiele;
sudo systemctl restart nginx
```

Dann kann der `spiele-server`-Dienst abgeschaltet werden
(`sudo systemctl disable --now spiele-server`).

## Was NICHT auf dem Jetson läuft

Die alten Python-Spiele in [`../legacy/`](../legacy/) brauchen einen Desktop mit
OpenGL (`pygame`, `ursina`). Die laufen weiterhin nur auf dem Rechner, nicht auf
dem Jetson. Ihre Nachfolger im Browser gibt es dafür überall:
`web/spiele/nikolaus/` und `web/spiele/nicecraft/`.
