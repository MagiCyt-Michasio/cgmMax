# CGM Predict 0.3 — 90-day analytics

- 7 / 30 / 90 day selectors control summary statistics, hourly profile, glucose ranges and data-quality metrics.
- Period comparison chart displays mean glucose and TIR over 7 / 30 / 90 days on separate axes.
- Long gaps are counted only inside the selected analysis period.
- Doughnut chart has no misleading numeric axes.
- Existing detailed history selectors (6h / 12h / 24h / 3d / 7d) remain available.
- Dashboard guide: [CO JA WIDZĘ?](docs/CO_JA_WIDZE.md).

## Debian update

```bash
cd ~/cgmMax
git pull --ff-only origin main
cd cgm-predict
npm install
```

Restart the CGM Predict process and reload the browser page. Existing local `.env` is preserved.

## API
- `GET /api/health`
- `GET /api/data?hours=24`
- `GET /api/analytics?days=90`
- `GET /api/predict`
- `GET /api/metrics?days=90`

The TIR value is based on the share of readings, not a time-weighted reconstruction. The short-term forecast remains a linear trend baseline, not trained ML. Similar-episode matching remains heuristic. IOB/COB, profile-aware pharmacodynamics, walk-forward and clinical validation are not implemented.

CGM Predict is experimental analytics, not a medical device or dosing tool. Do not use predictions to calculate insulin doses or delay established CGM alarms and care plans.
