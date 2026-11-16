#!/bin/bash
# Alle Selbsttests der Plattform. Braucht nur node — keine Pakete.
#
#   ./tests.sh
#
# Für einen Test im echten Browser gibt es zusätzlich ./rauchtest.sh
set -u
cd "$(dirname "$0")"

FEHLER=0

# lauf <Überschrift> <Testdatei>
#
# Im guten Fall zeigen wir nur die letzten Zeilen — sonst scrollt die
# Erfolgsmeldung weg. Geht etwas schief, kommt die GANZE Ausgabe, denn
# dann will man ja sehen, welche Prüfung gestolpert ist.
lauf() {
  local ueberschrift="$1"
  local datei="$2"
  local ausgabe
  echo "▶ $ueberschrift"
  if ausgabe="$(node "$datei" 2>&1)"; then
    echo "$ausgabe" | tail -3
  else
    echo "$ausgabe"
    echo "  ⚠️  $datei ist fehlgeschlagen."
    FEHLER=$((FEHLER + 1))
  fi
}

lauf "Geteilte Bausteine (Profile, Punkte, Speicher)" web/shared/test/test-speicher.js
lauf "Startseite: Profile, PIN, Reiter und Kacheln"   web/test/test-shell.js
lauf "Nikolaus vs. Mutanten-Minions"                  web/spiele/nikolaus/test/test-spiel.js
lauf "Mathe: Aufgaben nachrechnen"                    web/schule/mathe/test/test-aufgaben.js
lauf "Mathe: Üben und Test durchspielen"              web/schule/mathe/test/test-ablauf.js
lauf "Englisch: Vokabeln und Lernbox prüfen"          web/schule/englisch/test/test-vokabeln.js
lauf "Englisch: Üben, Test und Lernbox durchspielen"  web/schule/englisch/test/test-ablauf.js
lauf "Konzentration: Formen, Stufen und Regeln"      web/konzentration/test/test-kern.js
lauf "Konzentration: Aufgaben würfeln und nachprüfen" web/konzentration/test/test-aufgaben.js
lauf "Konzentration: Übungsrunden durchspielen"       web/konzentration/test/test-ablauf.js
lauf "Quiz: Rettet die ISS"                           web/quiz/rettet-die-iss/test/test-spiel.js

echo ""
if [ $FEHLER -eq 0 ]; then
  echo "════════════════════════════════════════"
  echo "  🎉 ALLE TESTS BESTANDEN"
  echo "════════════════════════════════════════"
else
  echo "  💥 $FEHLER TESTDATEI(EN) FEHLGESCHLAGEN"
  exit 1
fi
