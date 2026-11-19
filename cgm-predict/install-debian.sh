#!/usr/bin/env bash
set -Eeuo pipefail

# Run this script from the cloned repository's cgm-predict directory.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_DIR}"

echo "== CGM Predict installer =="
echo "Target: $APP_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is missing."
  exit 1
fi
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node.js 20+ is required; found $(node --version)"
  exit 1
fi
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is missing."; exit 1; }

if [ ! -f "$APP_DIR/package.json" ] || [ ! -f "$APP_DIR/server.js" ]; then
  echo "ERROR: CGM Predict project files were not found in $APP_DIR"
  echo "Clone cgmMax, then run this script from cgmMax/cgm-predict."
  exit 1
fi

cd "$APP_DIR"
npm install

if [ ! -f .env ]; then
  cat > .env <<'ENV'
PORT=3060
MONGODB_URI=mongodb://127.0.0.1:27018/?directConnection=true
MONGODB_DB=nightscout
DATA_STALE_MINUTES=15
ENV
  chmod 600 .env
  echo "Created local .env (no password stored)."
else
  chmod 600 .env
  echo "Existing .env preserved."
fi

echo
echo "Dependencies installed."
echo "Next: node check-mongodb.js"
