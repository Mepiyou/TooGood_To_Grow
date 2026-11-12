#!/usr/bin/env bash
# Capture d'écran de l'app servie (port 8081 par défaut), via Chrome Windows en headless (WSL).
# Usage : tools/capture.sh '#/' 375   (HOTE=<ip>, PORT=<n> pour une autre adresse ou un autre port)
set -euo pipefail

hash="${1:-#/}"
largeur="${2:-375}"
hote="${HOTE:-localhost}"
port="${PORT:-8081}"
chrome="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

racine="$(cd "$(dirname "$0")/.." && pwd)"
dossier="$racine/captures"
mkdir -p "$dossier"

nom="$(printf '%s' "$hash" | tr -c 'A-Za-z0-9' '_' | sed 's/^_*//; s/_*$//')"
sortie="$dossier/${nom:-accueil}-${largeur}.png"
rm -f "$sortie"

# Profil dédié : évite de se greffer sur un Chrome déjà ouvert par l'utilisateur.
"$chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
  --user-data-dir="$(wslpath -w "$dossier/.profil-chrome")" \
  --window-size="${largeur},900" --virtual-time-budget=3000 \
  --screenshot="$(wslpath -w "$sortie")" \
  "http://${hote}:${port}/${hash}" >/dev/null 2>&1 || true

if [ ! -s "$sortie" ]; then
  echo "Échec : aucune capture produite pour http://${hote}:${port}/${hash}" >&2
  exit 1
fi
echo "$sortie"
