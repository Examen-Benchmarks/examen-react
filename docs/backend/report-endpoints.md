# Backend spec: report / aggregation endpoints

> **Status:** proposed — blocks the frontend benchmark views.
> **Why:** the existing API exposes only raw, bare-array reads. The benchmark
> dashboards (matrix, grade, evolution, comparison) need aggregation. Per the
> eval-dashboard research, aggregation belongs **server-side** (centralizes the
> logic the static HTML renderer already has; lets the client cache small,
> pre-shaped payloads). This is essentially the renderer's aggregation exposed
> as JSON.
>
> Conventions: **snake_case** wire keys (matches the rest of the API); UUIDs as
> strings; timestamps ISO-8601; auth via the `examen_session` cookie / API key,
> same as every other endpoint. Lists stay bare arrays elsewhere — these report
> endpoints return objects.

## Aggregation semantics (shared)

- A **repeat** = one of the N runs of the same `(case, version)`. Cell values
  aggregate a metric **over the repeats** of a case at one version.
- A cell aggregates **only runs that emitted that metric** (errored runs emit
  none); `n` reflects the contributing run count, so it can be < `run_count`.
- A report is scoped to **one version** (the matrix is "as of" a version).
  Default = the **latest version (by `created_at`) that has runs** for the
  experiment.
- **Grade** = a single headline number per experiment. Default method:
  `mean_of_metric_means` (mean across the per-metric experiment-wide means).
  Treat the method as **configurable later**; return which method produced it.

---

## 1. Experiment report — `GET /experiments/{id}/report` ⭐ PRIORITY

Powers the **Experiment view** (case×metric heatmap matrix + headline grade).
This one endpoint unblocks the first build.

**Query params**
- `version_id` (optional) — which version's runs to aggregate. Default: latest
  with runs.

**Response**
```jsonc
{
  "experiment": { "id": "…", "key": "…", "name": "…", "description": null },
  "version":    { "id": "…", "components_hash": "…", "created_at": "…" },
  "run_summary": { "total": 15, "ok": 15, "errored": 0, "succeeded_pct": 100.0 },

  "metrics": [                                  // column defs, display order
    { "key": "time_awareness", "name": "Time Awareness", "kind": "ratio" },
    { "key": "desire_score",   "name": "Desire Score",   "kind": "ratio" }
  ],

  "cases": [
    {
      "case": { "id": "…", "key": "wrong_color_dress", "name": "…" },
      "run_count": 5, "ok_count": 5, "errored_count": 0,
      "cells": {                                // keyed by metric key
        "time_awareness": { "mean": 1.0, "n": 5, "stddev": 0.0, "min": 1.0, "max": 1.0 },
        "desire_score":   { "mean": 0.0, "n": 5, "stddev": 0.0, "min": 0.0, "max": 0.0 }
      }
    }
  ],

  "metric_aggregates": {                        // column footer: experiment-wide mean
    "time_awareness": { "mean": 0.93, "n": 75 },
    "desire_score":   { "mean": 0.10, "n": 75 }
  },

  "grade": { "value": 0.86, "scale": "ratio", "method": "mean_of_metric_means" }
}
```

**Frontend mapping:** `metrics` → table columns; `cases[].cells[metric]` →
heatmap cells (`mean` colored vs threshold, `n`/`stddev` as secondary line);
`metric_aggregates` → column footer; `grade` → headline chip; `run_summary` →
sub-header.

---

## 2. Experiment evolution — `GET /experiments/{id}/evolution`

Powers the **History/evolution** tab: grade (and per-metric means) across
versions over time.

```jsonc
{
  "experiment": { "id": "…", "key": "…", "name": "…" },
  "metrics": [ { "key": "…", "name": "…", "kind": "ratio" } ],
  "points": [                                   // ordered by version.created_at ASC
    {
      "version": { "id": "…", "components_hash": "…", "created_at": "…" },
      "run_summary": { "total": 15, "ok": 15, "errored": 0, "succeeded_pct": 100.0 },
      "grade": 0.82,
      "metric_means": { "time_awareness": 0.9, "desire_score": 0.1 }
    }
  ]
}
```

Frontend renders a line/area chart of `grade` (and optionally per-metric means);
version-over-version deltas / regression flags are computed client-side from
consecutive points.

---

## 3. Experiment comparison — `GET /experiments/{id}/compare`

Powers the **Comparison view** (baseline vs candidate).

**Query params:** `baseline_version_id`, `candidate_version_id` (both required).

```jsonc
{
  "experiment": { "id": "…", "key": "…", "name": "…" },
  "metrics": [ { "key": "…", "name": "…", "kind": "ratio" } ],
  "baseline":  { "id": "…", "components_hash": "…", "created_at": "…" },
  "candidate": { "id": "…", "components_hash": "…", "created_at": "…" },
  "cases": [
    {
      "case": { "id": "…", "key": "…", "name": "…" },
      "cells": {
        "time_awareness": {
          "baseline_mean": 0.8, "candidate_mean": 1.0,
          "delta": 0.2, "status": "improved"     // improved | regressed | unchanged
        }
      }
    }
  ],
  "grade": { "baseline": 0.80, "candidate": 0.86, "delta": 0.06, "status": "improved" }
}
```

Cases align by **stable `case.id`** across both versions (cases are immutable by
convention, so the key/id is stable).

---

## 4. Bench overview — `GET /benches/{id}/report`

Powers the **Bench overview**: per-experiment grade chips, run counts, sparkline.

```jsonc
{
  "bench": { "id": "…", "key": "…", "name": "…" },
  "experiments": [
    {
      "experiment": { "id": "…", "key": "…", "name": "…" },
      "grade": 0.86,
      "run_summary": { "total": 15, "ok": 15, "errored": 0, "succeeded_pct": 100.0 },
      "sparkline": [                             // recent versions, ASC
        { "created_at": "…", "grade": 0.82 },
        { "created_at": "…", "grade": 0.86 }
      ]
    }
  ]
}
```

---

## What does NOT need a new endpoint

The **per-run / sample drill-down** (side panel with case input, output,
expected, and per-metric `value` + judge `reply`/`reason`) is served by the
**existing** reads:
- `GET /runs?case_id={id}&version_id={id}` (or `?experiment_id=`) → the runs.
- `GET /runs/{id}/metrics` → each metric's `value`, `kind`, and `context` JSON.

No aggregation needed there — only the raw rows.

---

## Build order (frontend, once endpoints land)

1. **Experiment matrix + drill-down** — needs **§1** (drill-down uses existing reads). ← first
2. **Comparison** — needs **§3**.
3. **History/evolution** — needs **§2**.
4. **Bench overview** — needs **§4**.

§1 is the single unblocker for the first and highest-value build.
