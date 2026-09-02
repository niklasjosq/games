# Kinder-Plattform als eigenes, abgeschottetes Image.
#
# Im Container liegt NUR die fertige Webseite und ein nginx. Kein Python,
# kein node, kein Quellcode, keine Tests, kein Zugriff auf irgendwelche
# Daten des Jetson. Damit kann dieser Container dem ein anderer Dienst, das auf dem
# gleichen Gerät läuft, auch im Fehlerfall nichts anhaben.
#
# Gebaut wird auf dem Mac für linux/arm64 (siehe deploy/deploy-jetson.sh) —
# auf Apple Silicon ist das die eigene Architektur und dauert Sekunden.

FROM nginx:1.27-alpine

# Unsere Konfiguration ersetzt die mitgelieferte komplett.
COPY nginx.conf /etc/nginx/nginx.conf

# Nur die Webseite. Was nicht hineingehört (Tests, legacy/, .git) steht
# in .dockerignore.
COPY web/ /usr/share/nginx/html/

# Das Standard-Entrypoint von nginx:alpine schreibt beim Start in
# /etc/nginx und /var/cache — das geht bei einem read-only Dateisystem
# nicht. Wir brauchen davon nichts, also starten wir nginx direkt.
ENTRYPOINT ["nginx", "-g", "daemon off;"]

EXPOSE 8080

# Der Container läuft als nginx-Benutzer (UID 101), nicht als root.
# Port 8080 ist unprivilegiert, das geht also ohne Sonderrechte.
USER 101:101
