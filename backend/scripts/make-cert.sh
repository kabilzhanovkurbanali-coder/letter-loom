#!/bin/bash
# Creates a self-signed certificate so tablets on the kindergarten Wi-Fi can open the game over https
# (needed for the microphone and for offline mode). Run once on the laptop that hosts the game:
#   bash backend/scripts/make-cert.sh
# then restart the backend and open https://<laptop-ip>:5443 on each tablet.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$DIR"

SAN="DNS:localhost,IP:127.0.0.1"
for ip in $( (ipconfig getifaddr en0; ipconfig getifaddr en1; hostname -I 2>/dev/null) 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9.]+$' | sort -u); do
  SAN="$SAN,IP:$ip"
done

openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
  -keyout "$DIR/key.pem" -out "$DIR/cert.pem" \
  -subj "/CN=Letter Loom" -addext "subjectAltName=$SAN" 2>/dev/null

echo "Сертификат создан в $DIR для: $SAN"
echo "Перезапустите сервер и откройте на планшете https://<IP ноутбука>:5443"
