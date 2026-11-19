# CGM Predict — Nightscout Intelligence

Version 0.1.0. Independent read-only Nightscout analytics PWA.

## Scope
- Separate module; does not modify the existing CGM monitor.
- Node.js + Express API and responsive installable PWA.
- MongoDB Nightscout collections: `entries`, `treatments`, and optional `profile`.
- Hybrid forecast: short-horizon trend model + similarity to historical episodes.
- Explicit stale-data detection, confidence intervals, and model limitations.

## Configuration
Copy `.env.example` to `.env` and set `MONGODB_URI` and `MONGODB_DB=nightscout`. Use a read-only MongoDB account. Do not expose MongoDB publicly.

## Run
```bash
npm install
cp .env.example .env
npm start
```
Open `/` or install the PWA from the browser. API health: `/api/health`.

## API
- `GET /api/health`
- `GET /api/data?hours=72`
- `GET /api/predict`
- `GET /api/metrics?days=30`

## Prediction semantics
Forecasts are experimental estimates, not guaranteed predictions and not instructions for insulin dosing or treatment. The UI reports stale data, data coverage, uncertainty, and model confidence. It does not autonomously recommend insulin or carbohydrate doses.

## Validation
Use chronological holdout validation (train on earlier data, evaluate later periods). Report event sensitivity, precision, false alerts per day, lead time, and glucose forecast error separately. Never evaluate using randomly mixed future/past samples.


## Current implementation status (v0.1.0)

Implemented now: live SGV read API, read-only treatment retrieval, a simple short-window linear trend forecast with residual-based uncertainty band, nearest-pattern historical episode comparison, basic 30-day TIR summary, installable PWA shell, and unit tests.

Not implemented yet: trained machine-learning model, insulin-on-board / carbs-on-board computation, profile-aware pharmacodynamic model, automated walk-forward backtest, push notifications, and clinical-grade validation. The historical comparison is a heuristic similarity baseline, not an ML-trained personalized model. Do not interpret the returned historical rate as an individual clinical probability.
