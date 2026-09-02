# Auf dem Jetson Nano ausrollen

Die Plattform läuft als eigener, vollständig abgeschotteter Container. Auf dem
Gerät können daneben weitere Dienste laufen — die Plattform hat durchgängig
eigene Namen und kommt ihnen nicht in die Quere:

| | Kinder-Plattform |
|---|---|
| Port | 8080 |
| Container | `spiele` |
| Image | `spieleplattform:latest` |
| Compose-Projekt | `spieleplattform` |
| Verzeichnis | `~/spieleplattform` |
| Daten | **keine** (alles im Browser der Kinder) |

## Ausrollen

Gebaut wird auf dem Mac, übertragen über SSH:

```bash
./deploy/deploy-jetson.sh benutzer@jetson.local -i ~/.ssh/jetson
```

Das Skript baut das Image für `linux/arm64` (auf Apple Silicon Sekundensache),
schiebt es komprimiert über SSH auf den Jetson und startet den Container neu.
Eine Registry braucht es nicht, und nichts verlässt das Heimnetz.

Danach ist die Seite erreichbar unter `http://<jetson>:8080`.

Beim nächsten Mal genügt derselbe Aufruf. Es gibt keine Migration, keine
Datenbank und kein Backup — ein Deploy ist immer folgenlos.

### Optionen

```bash
SPIELE_SSH_KEY=~/.ssh/jetson ./deploy/deploy-jetson.sh benutzer@jetson.local
SPIELE_REMOTE_DIR='~/spiele'  ./deploy/deploy-jetson.sh benutzer@…  # anderes Verzeichnis
SPIELE_NETWORK=bridge         ./deploy/deploy-jetson.sh benutzer@…  # siehe unten
./deploy/deploy-jetson.sh --help
```

## Warum andere Dienste davon nichts merken

Image, Container, Compose-Projekt, Verzeichnis und Port gehören allein dieser
Anwendung. Ein `docker compose down` in diesem Verzeichnis betrifft immer nur
sie. Zusätzlich achtet das Deploy-Skript darauf:

* Es **räumt keine Images auf**. Ein `docker prune` würde anderen Anwendungen
  auf dem Gerät ihre Images wegnehmen — deshalb kommt es im Skript nicht vor.
* Es **verweigert den Start**, wenn im Zielverzeichnis schon ein fremdes
  Compose-Projekt liegt, dessen Konfiguration es überschreiben würde.
* Es **merkt sich vor dem Deploy, welche Container laufen**, und meldet
  hinterher, falls einer davon verschwunden ist.
* Es **warnt**, wenn auf Port 8080 schon etwas Fremdes lauscht.

## Wie abgeschottet der Container ist

Weil die Plattform nichts speichert — alle Punkte, Noten und Profile liegen im
Browser der Kinder — braucht der Container kein einziges beschreibbares
Verzeichnis. Das macht ihn ungewöhnlich harmlos:

| Einstellung | Wirkung |
|---|---|
| `read_only: true` | Das Dateisystem im Container ist schreibgeschützt. |
| `tmpfs: /tmp` (16 MB) | Das Einzige, was beschreibbar ist. Liegt im RAM, beim Neustart weg. |
| `user: 101:101` | nginx läuft als eigener Benutzer, nicht als root. |
| `cap_drop: ALL` | Keine Linux-Sonderrechte. |
| `no-new-privileges` | Kein setuid-Trick kann Rechte hinzugewinnen. |
| keine `volumes` | Der Container sieht vom Jetson nichts außer sich selbst. |
| `mem_limit: 128m` | Kann anderen Diensten nie den Speicher wegnehmen. Braucht im Betrieb ~3 MB. |
| `pids_limit: 64` | Keine Prozesslawine. |

Im Image liegt nur `web/` und ein nginx: kein Python, kein node, kein
Quellcode, keine Tests.

### Zum Netzwerkmodus

Vorgabe ist `network_mode: host`, und zwar aus einem Kernel-Grund: für
ein Bridge-Netzwerk schreibt Docker iptables-Regeln in die Tabelle `raw`, die
der 4.9er-Tegra-Kernel des Jetson nicht kennt
(`can't initialize iptables table 'raw'`).

Das ist der eine Punkt, an dem die Abschottung nicht vollständig ist: der
Container teilt sich den Netzwerk-Stack des Hosts. Wer einen Kernel mit
`iptable_raw` hat, bekommt mit `SPIELE_NETWORK=bridge` zusätzlich einen eigenen
Netzwerk-Namespace. Vorher prüfen:

```bash
ssh <jetson> 'sudo modprobe iptable_raw && echo geht'
```

## Erreichbarkeit im Heimnetz

Am verlässlichsten ist eine **feste IP** für den Jetson (im Router als
DHCP-Reservierung), dann geht überall im Haus:

```
http://192.168.178.42:8080
```

Zusätzlich klappt meist der Name — `http://<hostname>.fritz.box:8080` oder
`http://<hostname>.local:8080`. Das versteht macOS, iPhone, iPad und neuere
Android-Geräte; ältere Android-Tablets brauchen die IP.

**Tipp:** Auf den Tablets der Kinder als Lesezeichen auf den Startbildschirm
legen — dann sieht es aus wie eine App.

Nach außen ist nichts freigegeben, und HTTPS braucht es nicht: alles bleibt im
Heimnetz, und keine benutzte Browser-Funktion verlangt eine verschlüsselte
Verbindung (Canvas, WebGL, Pointer Lock, Töne nach einem Klick und
`localStorage` gehen alle über `http://`).

## Nachschauen und Fehlersuche

```bash
ssh <jetson>
cd ~/spieleplattform

docker compose ps                       # läuft es?
docker compose logs --tail 50 spiele    # was sagt nginx?
docker compose restart spiele           # neu starten
docker compose down                     # anhalten (nur diese Anwendung)
curl -sf http://127.0.0.1:8080/gesund   # antwortet die Seite?
```

| Problem | Ursache und Abhilfe |
|---|---|
| `bind: address already in use` | Etwas anderes hat Port 8080. Nachsehen: `sudo ss -tlnp \| grep :8080` |
| Container startet und stirbt sofort | `docker compose logs spiele`. Bei read-only-Fehlern: das tmpfs auf `/tmp` fehlt. |
| Kinder sehen eine alte Fassung | Sollte nicht passieren — HTML/JS/CSS werden mit `no-cache` ausgeliefert. Sonst einmal hart neu laden (Strg+Umschalt+R). |
| NiceCraft bleibt schwarz | Das Gerät kann kein WebGL. Die Seite erklärt das inzwischen selbst. |
| `iptables table 'raw'` | Bridge-Modus auf dem Jetson-Kernel. Vorgabe `SPIELE_NETWORK=host` verwenden. |

## Wenn Port 8080 belegt ist

Der Port steht an vier Stellen. Alle vier ändern, dann neu ausrollen:

1. `nginx.conf` — `listen 8080;`
2. `Dockerfile` — `EXPOSE 8080`
3. `docker-compose.yml` und `docker-compose.bridge.yml` — Healthcheck und `ports:`
4. `deploy/deploy-jetson.sh` — `PORT=8080`

## Was nicht auf dem Jetson läuft

Die alten Python-Spiele in [`../legacy/`](../legacy/) brauchen einen Desktop mit
OpenGL (`pygame`, `ursina`). Sie sind nicht Teil des Images und laufen weiter
nur auf dem Rechner. Ihre Nachfolger im Browser gibt es dafür überall.
