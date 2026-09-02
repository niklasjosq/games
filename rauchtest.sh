#!/bin/bash
# Rauchtest: jede Seite in einem echten Browser laden und prüfen, ob das
# JavaScript wirklich durchgelaufen ist. Wir suchen dazu nach Inhalten,
# die es ERST ZUR LAUFZEIT erzeugt — steht der Text da, hat es geklappt.
#
#   ./rauchtest.sh
#
# Braucht Google Chrome. Andere Stelle? CHROME=... ./rauchtest.sh
set -u
cd "$(dirname "$0")"

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT="${PORT:-8765}"
BASIS="http://127.0.0.1:$PORT"
ARBEIT="$(mktemp -d)"
FEHLER=0

if [ ! -x "$CHROME" ]; then
  echo "⏭  Chrome nicht gefunden ($CHROME) — Rauchtest übersprungen."
  echo "   Die normalen Tests laufen ohne Browser: ./tests.sh"
  exit 0
fi

# Eigenen Webserver starten und am Ende wieder abräumen
# (cd statt --directory, das kennen ältere Python-Versionen noch nicht)
( cd web && exec python3 -m http.server "$PORT" --bind 127.0.0.1 ) >/dev/null 2>&1 &
SERVER=$!
aufraeumen() {
  kill "$SERVER" 2>/dev/null
  wait "$SERVER" 2>/dev/null      # sonst meldet die Shell "Terminated"
  rm -rf "$ARBEIT"
}
trap aufraeumen EXIT
sleep 1.5

lade() {   # lade <url> <ausgabedatei>
  local profil="$ARBEIT/p$RANDOM"
  ( "$CHROME" --headless=new --disable-gpu --enable-unsafe-swiftshader \
      --no-first-run --no-default-browser-check \
      --dump-dom --virtual-time-budget=6000 --user-data-dir="$profil" \
      "$1" > "$2" 2> "$2.err" &
    local pid=$!
    for _ in $(seq 1 30); do kill -0 $pid 2>/dev/null || break; sleep 1; done
    kill -9 $pid 2>/dev/null )
}

pruefe() {  # pruefe <datei> <suchtext> <beschreibung>
  if grep -q -- "$2" "$1"; then
    echo "  ✅ $3"
  else
    echo "  ❌ $3   (nicht gefunden: $2)"
    FEHLER=$((FEHLER + 1))
  fi
}

fehlerfrei() {  # fehlerfrei <datei>
  local treffer
  treffer=$(grep -iE "uncaught|SyntaxError|ReferenceError|TypeError|Failed to load resource|net::ERR" \
            "$1.err" 2>/dev/null | head -3)
  if [ -z "$treffer" ]; then
    echo "  ✅ keine JavaScript-Fehler"
  else
    echo "  ❌ JavaScript-Fehler:"
    echo "$treffer" | sed 's/^/       /'
    FEHLER=$((FEHLER + 1))
  fi
}

echo "▶ Startseite (Profilwahl)"
lade "$BASIS/" "$ARBEIT/d1.html"
pruefe "$ARBEIT/d1.html" 'id="profilwahl" class="bildschirm aktiv"' 'die Profilwahl ist der erste Bildschirm'
pruefe "$ARBEIT/d1.html" 'Noch keine Profile' 'JavaScript hat die Profilliste gebaut'
fehlerfrei "$ARBEIT/d1.html"

echo "▶ Nikolaus vs. Mutanten-Minions"
lade "$BASIS/spiele/nikolaus/index.html" "$ARBEIT/d2.html"
pruefe "$ARBEIT/d2.html" 'sei die oder der Erste' 'JavaScript hat die Bestenliste gebaut'
pruefe "$ARBEIT/d2.html" 'Als Gast unterwegs' 'der Gast-Hinweis steht da'
pruefe "$ARBEIT/d2.html" 'id="start" class="bildschirm aktiv"' 'die Landing-Page ist offen'
fehlerfrei "$ARBEIT/d2.html"

echo "▶ NiceCraft (3D mit three.js)"
lade "$BASIS/spiele/nicecraft/index.html" "$ARBEIT/d3.html"
pruefe "$ARBEIT/d3.html" 'klotzknopf' 'three.js geladen und Klotz-Auswahl gebaut'
pruefe "$ARBEIT/d3.html" 'Klötze:' 'die Schleife läuft'
pruefe "$ARBEIT/d3.html" '<canvas' 'die 3D-Leinwand wurde erzeugt'
fehlerfrei "$ARBEIT/d3.html"

echo "▶ NiceCraft ohne WebGL (altes Tablet)"
( "$CHROME" --headless=new --blink-settings=webGLEnabled=false \
    --disable-webgl --disable-webgl2 \
    --no-first-run --no-default-browser-check --dump-dom --virtual-time-budget=6000 \
    --user-data-dir="$ARBEIT/pnogl" "$BASIS/spiele/nicecraft/index.html" \
    > "$ARBEIT/d3b.html" 2>/dev/null &
  pid=$!; for _ in $(seq 1 30); do kill -0 $pid 2>/dev/null || break; sleep 1; done
  kill -9 $pid 2>/dev/null )
pruefe "$ARBEIT/d3b.html" 'Kein 3D möglich' 'es kommt eine freundliche Erklärung'

echo "▶ Mathe (3. Klasse)"
lade "$BASIS/schule/mathe/index.html" "$ARBEIT/d4.html"
pruefe "$ARBEIT/d4.html" 'Das kleine Einmaleins' 'die Lektionen der 3. Klasse sind da'
pruefe "$ARBEIT/d4.html" 'klassentab' 'die Klassenwahl wurde gebaut'
fehlerfrei "$ARBEIT/d4.html"

echo "▶ Mathe (5. Klasse über #klasse5)"
lade "$BASIS/schule/mathe/index.html#klasse5" "$ARBEIT/d5.html"
pruefe "$ARBEIT/d5.html" 'Umfang und Fläche' 'der Link öffnet direkt die 5. Klasse'
fehlerfrei "$ARBEIT/d5.html"

echo "▶ Quiz: Rettet die ISS"
lade "$BASIS/quiz/rettet-die-iss/index.html" "$ARBEIT/d6.html"
pruefe "$ARBEIT/d6.html" 'Rettet die ISS' 'das Quiz lädt'
pruefe "$ARBEIT/d6.html" 'id="start" class="bildschirm aktiv"' 'der Startbildschirm ist offen'
fehlerfrei "$ARBEIT/d6.html"

echo ""
if [ $FEHLER -eq 0 ]; then
  echo "════════════════════════════════════════"
  echo "  🎉 RAUCHTEST BESTANDEN"
  echo "════════════════════════════════════════"
else
  echo "  💥 $FEHLER PROBLEM(E) IM RAUCHTEST"
  exit 1
fi
