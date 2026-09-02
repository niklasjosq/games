#!/bin/bash
# Alle Selbsttests der Plattform. Braucht nur node — keine Pakete.
#
#   ./tests.sh
#
# Für einen Test im echten Browser gibt es zusätzlich ./rauchtest.sh
set -e
cd "$(dirname "$0")"

echo "▶ Geteilte Bausteine (Profile, Punkte, Speicher)"
node web/shared/test/test-speicher.js | tail -3

echo "▶ Nikolaus vs. Mutanten-Minions"
node web/spiele/nikolaus/test/test-spiel.js | tail -3

echo "▶ Mathe: Aufgaben nachrechnen"
node web/schule/mathe/test/test-aufgaben.js | tail -3

echo "▶ Mathe: Üben und Test durchspielen"
node web/schule/mathe/test/test-ablauf.js | tail -3

echo "▶ Quiz: Rettet die ISS"
node web/quiz/rettet-die-iss/test/test-spiel.js | tail -3

echo ""
echo "════════════════════════════════════════"
echo "  🎉 ALLE TESTS BESTANDEN"
echo "════════════════════════════════════════"
