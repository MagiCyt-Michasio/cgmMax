# CGM Predict 0.4 — Walk-forward validation

Independent read-only Nightscout analytics PWA.

## What's new in 0.4
- Historical walk-forward evaluation of the current short-term trend estimator.
- Forecast error metrics (MAE, RMSE, bias) at 15 / 30 / 60 minutes.
- Comparison with a simple persistence baseline (assume glucose remains at the latest value).
- Coverage of the current simple residual interval.
- A dedicated dashboard panel to launch the backtest over the last 90 days.
- Existing 7 / 30 / 90-day statistics, timeline and plots remain.

## Debian update
```bash
cd ~/cgmMax
git pull --ff-only origin main
cd cgm-predict
npm install
```
Restart the CGM Predict process and reload the PWA. Existing local `.env` is preserved.

## Walk-forward endpoint
`GET /api/backtest?days=90&step=15`

The endpoint tests historical forecast cutoffs. At each cutoff it forms the forecast from the current and preceding readings only; subsequent readings are used only as evaluation targets. It reports:
- **MAE** — mean absolute error in mg/dL; smaller is better.
- **RMSE** — root mean square error; more sensitive to large misses.
- **Bias** — signed average error; positive means forecasts tended to be above observed values.
- **Within-band %** — share of target measurements inside the simple forecast interval.
- **Baseline MAE** — error from a naive persistence estimate (hold the cutoff glucose constant).

Targets use the first available point between the requested horizon and seven minutes after it. The evaluation is retrospective and can be affected by missing sensor points and irregular time intervals.

## Important limitations
This does not train a new ML model. It evaluates the existing linear-trend baseline. Results are retrospective engineering metrics, not clinical validation or a guarantee of future performance. It does not yet model insulin-on-board, carbs-on-board, exercise or individualized insulin pharmacodynamics.

CGM Predict is experimental analytics, not a medical device or dosing tool. Never use predictions to calculate insulin doses or delay CGM alarms and established care plans.
