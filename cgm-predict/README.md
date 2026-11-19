# CGM Predict 0.2 — WOW dashboard

Independent read-only Nightscout analytics PWA.

## What's new in 0.2
- Responsive dark intelligence dashboard.
- Interactive glucose history chart with 6h / 12h / 24h / 3d / 7d selectors.
- Short-horizon forecast chart with uncertainty bounds.
- Time-of-day (24-hour) glucose profile.
- TIR / low / high distribution, mean, median, min, max, standard deviation.
- Data freshness and continuity indicators.
- Recent Nightscout treatments/event timeline.
- Correct null handling in historical episode analysis.
- Forecast no longer extrapolates low-threshold crossing beyond a 120-minute display horizon.
- Additional `/api/analytics` endpoint.

## Install / update

In the existing checkout on Debian:

```bash
cd ~/cgmMax
git pull --ff-only origin main
cd cgm-predict
npm install
```

For this feature branch, use `git fetch origin v0.2-wow` and `git checkout v0.2-wow` (or pull request merge after review).

The app defaults to local MongoDB `127.0.0.1:27018`, database `nightscout`. Existing local `.env` is preserved. Never publish database credentials or expose MongoDB publicly.

## Start

```bash
npm start
```

Open `http://127.0.0.1:3060`.

## API
- `GET /api/health`
- `GET /api/data?hours=24`
- `GET /api/analytics?days=30`
- `GET /api/predict`
- `GET /api/metrics?days=30`

## Model limitations
The forecast remains a short-window linear trend baseline with an uncertainty interval. Similar-episode matching is a heuristic, not trained ML. IOB/COB, profile-aware pharmacodynamics, walk-forward backtesting, push notifications and clinical validation are not implemented.

This is experimental analytics, not a medical device or a dosing tool. Do not use predictions to calculate insulin doses or delay the established CGM response plan.
