#!/usr/bin/env bash
#
# Kinder-Plattform auf den Jetson Nano bringen.
#
# Gebaut wird auf dem Mac für linux/arm64 — auf Apple Silicon ist das die
# eigene Architektur, das Image entsteht in Sekunden und läuft unverändert
# auf dem Jetson. Übertragen wird das fertige Image als Stream über SSH;
# eine Registry wird nicht gebraucht, und nichts verlässt das Heimnetz.
#
#   ./deploy/deploy-jetson.sh benutzer@jetson.local -i ~/.ssh/jetson
#   SPIELE_SSH_KEY=~/.ssh/jetson ./deploy/deploy-jetson.sh benutzer@jetson.local
#
# ═══════════════════════════════════════════════════════════════════════
# GUTER NACHBAR
#
# Auf dem Jetson können weitere Dienste laufen. Dieses Skript fasst
# ausschließlich sein eigenes Verzeichnis und sein eigenes
# Compose-Projekt an:
#
#   Image      spieleplattform:latest
#   Container  spiele
#   Projekt    spieleplattform
#   Verzeichnis ~/spieleplattform
#   Port       8080
#
# Zusätzlich:
#   * Es räumt nie Images auf (kein `docker prune` — das würde anderen
#     Anwendungen auf dem Gerät ihre Images wegnehmen).
#   * Es weigert sich, in ein Verzeichnis zu schreiben, in dem schon ein
#     fremdes Compose-Projekt liegt.
#   * Es merkt sich vor dem Deploy, welche Container laufen, und meldet
#     hinterher, falls einer davon verschwunden ist.
# ═══════════════════════════════════════════════════════════════════════
#
set -euo pipefail

IMAGE="spieleplattform:latest"
CONTAINER="spiele"
PROJEKT="spieleplattform"
PORT=8080

# Vorgabe ist das Home des Zielbenutzers: dort braucht das Deploy kein root.
# Einfache Anführungszeichen sind Absicht — sonst würde die lokale Shell das ~
# expandieren und auf das Home des Macs zeigen.
DEFAULT_REMOTE_DIR='~/spieleplattform'
REMOTE_DIR="${SPIELE_REMOTE_DIR:-$DEFAULT_REMOTE_DIR}"
# host (Vorgabe) oder bridge. Host-Netzwerk braucht keine iptables-Regeln und
# damit auch nicht die Tabelle "raw", die dem Jetson-Kernel fehlt.
NETWORK="${SPIELE_NETWORK:-host}"
PLATFORM="linux/arm64"
SSH_KEY="${SPIELE_SSH_KEY:-}"
TARGET=""

usage() {
  cat >&2 <<'USAGE'
Aufruf: deploy-jetson.sh <benutzer@host> [-i <schlüsseldatei>]

  -i <datei>   SSH-Schlüssel für die Anmeldung (wie bei `ssh -i`).
               Alternativ über die Umgebungsvariable SPIELE_SSH_KEY.

Umgebungsvariablen:
  SPIELE_SSH_KEY     wie -i
  SPIELE_REMOTE_DIR  Zielverzeichnis auf dem Jetson, Vorgabe ~/spieleplattform
                     (im Home des Zielbenutzers, deshalb ohne root).
                     Bei ~ unbedingt quoten: SPIELE_REMOTE_DIR='~/x'
  SPIELE_NETWORK     host (Vorgabe) oder bridge. Host-Netzwerk kommt ohne
                     iptables aus; die Bridge braucht die Tabelle "raw",
                     die dem Jetson-Kernel (JetPack 4.x) meist fehlt.

Die Plattform läuft danach auf Port 8080. Andere Dienste auf dem Gerät
werden nicht angetastet.

Beispiel:
  ./deploy/deploy-jetson.sh benutzer@jetson.local -i ~/.ssh/jetson
USAGE
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--identity)
      [[ $# -ge 2 ]] || usage
      SSH_KEY="$2"
      shift 2
      ;;
    -h|--help) usage ;;
    -*) echo "Unbekannte Option: $1" >&2; usage ;;
    *)
      [[ -z "$TARGET" ]] || { echo "Mehr als ein Ziel angegeben." >&2; usage; }
      TARGET="$1"
      shift
      ;;
  esac
done

[[ -n "$TARGET" ]] || usage

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

info() { printf '\033[1;34m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

case "$NETWORK" in
  host)   COMPOSE_FILE="" ;;   # docker-compose.yml ist die host-Variante
  bridge) COMPOSE_FILE="-f docker-compose.bridge.yml"
          info "Netzwerkmodus: bridge (braucht iptables-Tabelle \"raw\" im Kernel)" ;;
  *)      die "SPIELE_NETWORK muss 'host' oder 'bridge' sein, nicht '$NETWORK'." ;;
esac

# --- SSH-Aufruf zusammenstellen -------------------------------------------
# Das Array ist nie leer, damit "${SSH_OPTS[@]}" auch unter `set -u` mit
# älteren bash-Versionen (macOS liefert 3.2 aus) funktioniert.
SSH_OPTS=(-o ConnectTimeout=8)

if [[ -n "$SSH_KEY" ]]; then
  # ~ expandiert die Shell nicht in Variablen — hier von Hand nachholen.
  SSH_KEY="${SSH_KEY/#\~/$HOME}"
  [[ -f "$SSH_KEY" ]] || die "Schlüsseldatei nicht gefunden: $SSH_KEY"
  PERMS="$(stat -f '%Lp' "$SSH_KEY" 2>/dev/null || stat -c '%a' "$SSH_KEY" 2>/dev/null || echo '')"
  if [[ -n "$PERMS" && "$PERMS" != "400" && "$PERMS" != "600" ]]; then
    warn "Rechte auf $SSH_KEY sind $PERMS — SSH verlangt 600. Korrigiere: chmod 600 $SSH_KEY"
  fi
  # IdentitiesOnly: sonst bietet der ssh-agent zuerst alle anderen Schlüssel an
  # und der Server bricht ggf. mit "too many authentication failures" ab.
  SSH_OPTS+=(-i "$SSH_KEY" -o IdentitiesOnly=yes)
fi

ssh_() { ssh "${SSH_OPTS[@]}" "$@"; }
scp_() { scp "${SSH_OPTS[@]}" "$@"; }

SSH_HINT="ssh${SSH_KEY:+ -i $SSH_KEY} $TARGET"

# --- Vorbedingungen -------------------------------------------------------
docker info >/dev/null 2>&1 || die "Docker läuft nicht. Docker Desktop starten und erneut versuchen."

if ! ssh_ -o BatchMode=yes "$TARGET" true 2>/dev/null; then
  if [[ -z "$SSH_KEY" ]]; then
    die "SSH zu $TARGET nicht möglich.
Braucht der Jetson einen bestimmten Schlüssel? Dann mit -i angeben:
  $0 $TARGET -i ~/.ssh/<schlüssel>"
  fi
  die "SSH zu $TARGET mit Schlüssel $SSH_KEY nicht möglich.
Prüfen mit:  ssh -i $SSH_KEY $TARGET"
fi

REMOTE_ARCH="$(ssh_ "$TARGET" 'uname -m')"
[[ "$REMOTE_ARCH" == "aarch64" || "$REMOTE_ARCH" == "arm64" ]] \
  || die "Zielsystem meldet Architektur '$REMOTE_ARCH' — erwartet wird aarch64."
ssh_ "$TARGET" 'command -v docker >/dev/null' \
  || die "Auf $TARGET ist kein Docker installiert."

# docker compose (v2) oder docker-compose (v1)?
if ssh_ "$TARGET" 'docker compose version >/dev/null 2>&1'; then
  COMPOSE="docker compose"
elif ssh_ "$TARGET" 'command -v docker-compose >/dev/null'; then
  COMPOSE="docker-compose"
else
  die "Auf $TARGET fehlt docker compose."
fi

# --- Zielverzeichnis auflösen ---------------------------------------------
# "~" und relative Pfade beziehen sich auf das Home des *Ziel*benutzers.
# Heikel dabei: die lokale Shell expandiert ~ bereits bei der Zuweisung, aus
# SPIELE_REMOTE_DIR=~/spieleplattform wird also /Users/<mac-nutzer>/... noch
# bevor das Skript startet. Dieser Fall wird hier erkannt und korrigiert.
REMOTE_HOME="$(ssh_ "$TARGET" 'printf %s "$HOME"')"
[[ -n "$REMOTE_HOME" ]] || die "Home-Verzeichnis von $TARGET nicht ermittelbar."

case "$REMOTE_DIR" in
  '~')   REMOTE_DIR="$REMOTE_HOME" ;;
  '~/'*) REMOTE_DIR="$REMOTE_HOME/${REMOTE_DIR#\~/}" ;;
  /*)
    if [[ -n "${HOME:-}" && "$REMOTE_DIR" == "$HOME"/* && "$REMOTE_HOME" != "$HOME" ]]; then
      REMOTE_DIR="$REMOTE_HOME/${REMOTE_DIR#"$HOME"/}"
      warn "Das ~ wurde von der lokalen Shell expandiert — gemeint war offenbar das"
      warn "Home auf dem Jetson. Verwende $REMOTE_DIR."
      warn "Zum Vermeiden in Anführungszeichen setzen: SPIELE_REMOTE_DIR='~/spieleplattform'"
    fi
    ;;
  *) REMOTE_DIR="$REMOTE_HOME/$REMOTE_DIR" ;;  # relativ -> Home des Ziels
esac
info "Zielverzeichnis auf $TARGET: $REMOTE_DIR"

# --- Guter Nachbar: fremdes Compose-Projekt schützen ----------------------
# Liegt im Zielverzeichnis schon eine docker-compose.yml, die zu einem
# ANDEREN Projekt gehört? Dann würde das Deploy sie überschreiben — und
# damit womöglich die Konfiguration eines fremden Dienstes zerstören.
FREMDES_PROJEKT="$(ssh_ "$TARGET" "
  f='$REMOTE_DIR/docker-compose.yml'
  if [ -f \"\$f\" ] && ! grep -q '^name: $PROJEKT' \"\$f\"; then
    grep -m1 '^name:' \"\$f\" 2>/dev/null || echo 'unbekannt'
  fi" 2>/dev/null | tr -d '\r')"

if [[ -n "$FREMDES_PROJEKT" ]]; then
  die "In $REMOTE_DIR liegt schon ein fremdes Compose-Projekt ($FREMDES_PROJEKT).

Ein Deploy dorthin würde dessen Konfiguration überschreiben. Bitte ein
eigenes Verzeichnis wählen, zum Beispiel die Vorgabe:
  SPIELE_REMOTE_DIR='$DEFAULT_REMOTE_DIR'"
fi

# --- Rechte auf dem Zielsystem --------------------------------------------
# Zwei voneinander unabhängige Fragen: darf der Nutzer Docker steuern, und darf
# er in $REMOTE_DIR schreiben?

# sudo ohne Passwort? Ein Prompt würde den Image-Stream sprengen: die Pipe
# hängt an stdin, es gibt kein TTY für die Eingabe.
passwordless_sudo() { ssh_ "$TARGET" 'sudo -n true >/dev/null 2>&1'; }

if ssh_ "$TARGET" 'docker ps >/dev/null 2>&1'; then
  SUDO=""
  # (Der Schnappschuss der laufenden Container folgt weiter unten,
  #  sobald klar ist, ob Docker sudo braucht.)
else
  passwordless_sudo || die "Docker auf $TARGET erfordert sudo, und sudo verlangt ein Passwort.
Nutzer dauerhaft berechtigen (einmalig, danach ab- und wieder anmelden):
  $SSH_HINT
  sudo usermod -aG docker \$USER"
  info "Docker auf $TARGET benötigt sudo."
  SUDO="sudo"
fi
COMPOSE_CMD="${SUDO:+$SUDO }$COMPOSE"
DOCKER_CMD="${SUDO:+$SUDO }docker"
COMPOSE_RUN="$COMPOSE_CMD${COMPOSE_FILE:+ $COMPOSE_FILE}"

# Welche Container laufen JETZT (außer unserem eigenen)? Nach dem Deploy
# vergleichen wir und melden, falls einer verschwunden ist.
NACHBARN_VORHER="$(ssh_ "$TARGET" "$DOCKER_CMD ps --format '{{.Names}}' 2>/dev/null | grep -vx '$CONTAINER' | sort" 2>/dev/null | tr -d '\r')"
if [[ -n "$NACHBARN_VORHER" ]]; then
  info "Läuft daneben und bleibt unangetastet: $(echo "$NACHBARN_VORHER" | tr '\n' ' ')"
fi

if ssh_ "$TARGET" "mkdir -p '$REMOTE_DIR' >/dev/null 2>&1 && [ -w '$REMOTE_DIR' ]" 2>/dev/null; then
  SUDO_FS=""
elif passwordless_sudo; then
  info "$REMOTE_DIR gehört root — wird einmalig mit sudo angelegt und übereignet."
  SUDO_FS="sudo"
else
  die "Kein Schreibrecht auf $REMOTE_DIR, und sudo verlangt auf $TARGET ein Passwort.

Zwei Wege:

  a) Verzeichnis einmalig von Hand anlegen — danach braucht das Deploy kein sudo:
       $SSH_HINT
       sudo mkdir -p $REMOTE_DIR && sudo chown -R \$(id -u):\$(id -g) $REMOTE_DIR

  b) Die Vorgabe verwenden — ein Verzeichnis im Home, ganz ohne root:
       $0 $TARGET${SSH_KEY:+ -i $SSH_KEY}
     (also SPIELE_REMOTE_DIR nicht setzen)"
fi

# --- Ist Port 8080 frei? --------------------------------------------------
# Im host-Netzwerk belegt der Container den Port direkt. Hat sich dort etwas
# anderes eingenistet (nicht unser eigener Container), soll das Deploy es
# sagen, statt mit einer unklaren Fehlermeldung zu scheitern.
PORT_BELEGT="$(ssh_ "$TARGET" "(command -v ss >/dev/null && sudo -n ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || true) | grep -c ':$PORT ' || true" 2>/dev/null | tr -d '\r')"
UNSER_LAEUFT="$(ssh_ "$TARGET" "$DOCKER_CMD inspect -f '{{.State.Status}}' $CONTAINER 2>/dev/null || echo nein" 2>/dev/null | tr -d '\r')"
if [[ "${PORT_BELEGT:-0}" != "0" && "$UNSER_LAEUFT" != "running" ]]; then
  warn "Auf $TARGET lauscht schon etwas auf Port $PORT, das nicht unser Container ist."
  warn "Nachsehen mit:  $SSH_HINT 'sudo ss -tlnp | grep :$PORT'"
fi

# --- Bauen ----------------------------------------------------------------
info "Baue $IMAGE für $PLATFORM …"
docker build --platform "$PLATFORM" -t "$IMAGE" .
ok "Image gebaut"

SIZE="$(docker image inspect "$IMAGE" --format '{{.Size}}' | awk '{printf "%.0f MB", $1/1024/1024}')"
info "Unkomprimierte Imagegröße: $SIZE"

# --- Übertragen -----------------------------------------------------------
info "Lege $REMOTE_DIR an und übertrage die Compose-Dateien …"
ssh_ "$TARGET" "$SUDO_FS mkdir -p '$REMOTE_DIR' && $SUDO_FS chown -R \$(id -u):\$(id -g) '$REMOTE_DIR'"
scp_ -q docker-compose.yml docker-compose.bridge.yml "$TARGET:$REMOTE_DIR/"

# Keine .env und keine Volumes: die Plattform speichert nichts auf dem
# Server. Alle Punkte und Noten liegen im Browser der Kinder. Deshalb gibt
# es hier auch nichts zu sichern — ein Deploy ist immer folgenlos.

info "Übertrage Image über SSH (komprimiert, ohne Registry) …"
docker save "$IMAGE" | gzip -1 | ssh_ "$TARGET" "gunzip | $DOCKER_CMD load"
ok "Image auf dem Jetson geladen"

# --- Starten --------------------------------------------------------------
info "Starte Container neu …"
# Nur unser eigenes Compose-Projekt (name: spieleplattform in der yml).
# shellcheck disable=SC2029
ssh_ "$TARGET" "cd '$REMOTE_DIR' && $COMPOSE_RUN up -d --no-build" || die \
"Der Container ließ sich nicht starten.

Logs ansehen mit:
  $SSH_HINT '$DOCKER_CMD logs --tail 50 $CONTAINER'

Belegt etwas anderes Port $PORT auf dem Jetson?
  $SSH_HINT 'sudo ss -tlnp | grep :$PORT'"

info "Warte darauf, dass die Seite antwortet …"
GESUND=0
for _ in $(seq 1 30); do
  if ssh_ "$TARGET" "curl -sf http://127.0.0.1:$PORT/gesund >/dev/null 2>&1"; then
    GESUND=1
    break
  fi
  sleep 2
done

# --- Nachkontrolle: laufen die Nachbarn noch? -----------------------------
NACHBARN_NACHHER="$(ssh_ "$TARGET" "$DOCKER_CMD ps --format '{{.Names}}' 2>/dev/null | grep -vx '$CONTAINER' | sort" 2>/dev/null | tr -d '\r')"
VERSCHWUNDEN="$(comm -23 <(echo "$NACHBARN_VORHER") <(echo "$NACHBARN_NACHHER") 2>/dev/null | tr '\n' ' ' | xargs || true)"
if [[ -n "$VERSCHWUNDEN" ]]; then
  warn "ACHTUNG: Diese Container liefen vorher und laufen jetzt nicht mehr: $VERSCHWUNDEN"
  warn "Das sollte nicht passieren — dieses Deploy fasst nur '$CONTAINER' an."
  warn "Nachsehen mit:  $SSH_HINT '$DOCKER_CMD ps -a'"
elif [[ -n "$NACHBARN_VORHER" ]]; then
  ok "Alle anderen Container laufen unverändert weiter"
fi

if [[ "$GESUND" != "1" ]]; then
  die "Container wurde gestartet, die Seite antwortet aber nicht.
Logs ansehen mit:  $SSH_HINT '$DOCKER_CMD logs --tail 50 $CONTAINER'"
fi

ok "Die Kinder-Plattform läuft"

TARGET_HOST="${TARGET#*@}"
HOSTNAME_SHORT="$(ssh_ "$TARGET" 'hostname' 2>/dev/null || true)"
echo
echo "  Erreichbar unter:  http://${TARGET_HOST}:$PORT"
if [[ -n "$HOSTNAME_SHORT" && "$HOSTNAME_SHORT" != "$TARGET_HOST" ]]; then
  echo "                     http://${HOSTNAME_SHORT}.fritz.box:$PORT"
  echo "                     http://${HOSTNAME_SHORT}.local:$PORT"
fi
echo
echo "  Auf den Tablets der Kinder als Lesezeichen auf den Startbildschirm"
echo "  legen — dann sieht es aus wie eine App."
echo
echo "  Es gibt nichts einzurichten und nichts zu sichern: die Kinder legen"
echo "  ihre Profile selbst an, und alle Punkte und Noten liegen in ihrem"
echo "  eigenen Browser."
exit 0
