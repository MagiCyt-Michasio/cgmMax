# CGM Predict 0.5.0 — prediction capability and coverage

## Active, data-derived signals
- Current SGV and timestamp; freshness.
- Glucose velocity over 10, 20 and 45 minute windows, when sufficient points exist.
- Approximate acceleration from the change in short- versus longer-window velocity.
- Trend-direction agreement across windows.
- Recent glucose volatility and measurement-gap statistics.
- Robust median pairwise slope as an experimental candidate.
- Retrospective walk-forward comparison across linear, damped, short-window, acceleration-aware, robust, adaptive and persistence candidates.

## Nightscout event context
- The feature audit counts recent treatment records and reports whether insulin and carbohydrate events are present.
- Event counts are context/coverage indicators only. The current prediction candidates do not infer insulin pharmacodynamics or meal absorption from these raw event values.

## Explicitly unavailable / not implemented
- IOB (insulin on board): not calculated. A verified insulin type/profile, action duration, delivery semantics and safety validation are required.
- COB (carbs on board): not calculated. A verified absorption model and reliable meal/carbohydrate event semantics are required.
- Physical activity and heart rate: unavailable unless a real source is connected and mapped.
- Exercise intensity, sleep, stress, illness, hydration, menstrual-cycle context: not measured by the current Nightscout-only connection.
- Insulin sensitivity changes, basal profile, correction factor, carbohydrate ratio and pump delivery state: not consumed by the current predictor.
- Automatic insulin dosing, bolus advice, treatment recommendations or autonomous control: explicitly out of scope.

## Validation rules
- Candidate models are compared on the same historical cutoffs and target windows.
- Features for a cutoff use only measurements at or before that cutoff.
- Persistence is retained as a baseline.
- No experimental candidate is automatically promoted to live forecasting based on retrospective MAE alone.
- Results are research metrics, not clinical validation or a guarantee of future prediction quality.

## Next staged work
1. Confirm Nightscout treatment schema and settings available in this installation.
2. Add verified, auditable event-time alignment for insulin and carbohydrate records.
3. Only after profile semantics are confirmed, research optional IOB/COB context as separate non-dosing features.
4. Add external activity/heart-rate connectors only when the user configures an actual source.
5. Run rolling-origin validation with a final untouched chronological holdout and compare by time-of-day, glucose range, missingness and trend state.
6. Consider live champion/challenger only after repeated out-of-sample gains and explicit user review.

