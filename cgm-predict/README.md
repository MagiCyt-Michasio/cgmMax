# CGM Predict — Nightscout Intelligence

Independent, read-only Nightscout analytics PWA. Current release: 0.1.0.

## Install on Debian / Termux

Requires Node.js 20+, npm, git, and access to the Nightscout MongoDB listener.

```bash
git clone https://github.com/MagiCyt-Michasio/cgmMax.git
cd cgmMax/cgm-predict
bash install-debian.sh
```

The installer preserves an existing local `.env`. Default local configuration targets MongoDB at `127.0.0.1:27018`, database `nightscout`. It does not change Nightscout, MongoDB, xdrip-monitor-ns, firewall rules, or public tunnel configuration.

Use a MongoDB account restricted to read-only access to `nightscout`. The initial URI assumes MongoDB accepts local connections without authentication. If authentication is enabled, set the read-only user's URI locally in `.env`; never commit `.env` or paste credentials into chat. Do not expose MongoDB publicly.

## Verify and start

```bash
node check-mongodb.js
npm start
```

Open `http://127.0.0.1:3060`. API health: `/api/health`.

## API
- `GET /api/health`
- `GET /api/data?hours=72`
- `GET /api/predict`
- `GET /api/metrics?days=30`

## Prediction semantics
The current forecast is a short-window linear trend estimate with a residual-based uncertainty interval. Historical episode comparison is a heuristic similarity baseline, not trained machine learning. IOB/COB, profile-aware pharmacodynamics, walk-forward backtesting, push notifications, and clinical-grade validation are not implemented.

Forecasts are experimental, can be wrong, and are not instructions for insulin dosing or treatment. Do not use them to calculate doses or delay the established CGM response plan.
