#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-$HOME/cgmMax/cgm-predict}"
REPO_URL="https://github.com/MagiCyt-Michasio/cgmMax.git"
echo "== CGM Predict installer =="
echo "Target: $APP_DIR"
if ! command -v node >/dev/null 2>&1; then echo "ERROR: Node.js is missing"; exit 1; fi
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 20 ]; then echo "ERROR: Node.js 20+ required; found $(node --version)"; exit 1; fi
command -v git >/dev/null 2>&1 || { echo "ERROR: git is missing"; exit 1; }
mkdir -p "$(dirname "$APP_DIR")"
if [ ! -d "$APP_DIR/.git" ]; then git clone --branch main "$REPO_URL" "$APP_DIR"; else git -C "$APP_DIR" fetch origin; git -C "$APP_DIR" pull --ff-only origin main; fi
cd "$APP_DIR"
npm install --omit=dev
if [ ! -f .env ]; then
cat > .env <<'ENV'
PORT=3060
MONGODB_URI=mongodb://127.0.0.1:27018/?directConnection=true
MONGODB_DB=nightscout
DATA_STALE_MINUTES=15
ENV
chmod 600 .env
echo "Created local .env (no password stored)."
else echo "Existing .env preserved."; fi
echo "Install files ready. Next run: node check-mongodb.js"
