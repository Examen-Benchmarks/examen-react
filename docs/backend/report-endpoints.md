# Backend spec: bulk read endpoints for client-side aggregation

> **Decision:** aggregation is done **client-side**. The backend adds two
> read-only endpoints so the client can fetch everything for a report in a
> couple of calls and aggregate itself — no server-side stats, grades, or
> time-series. (Supersedes the earlier server-side `/report` proposal.)
>
> Conventions: **snake_case** wire keys; UUID strings; ISO-8601 timestamps;
> auth via the `examen_session` cookie / API key like every other endpoint.
> Both return **bare arrays**, consistent with the rest of the API.

## 1. `GET /metrics` — bulk metrics by run coordinates

Returns metric rows in bulk so the client doesn't N+1 over `/runs/{id}/metrics`.

- **Query (≥1 required):** `run_id` | `bench_id` | `experiment_id` | `case_id` |
  `version_id`. The run-based filters resolve via a join to `runs` (metrics
  don't carry those columns).
- **Returns:** `[]MetricResponse` — identical shape to `GET /runs/{id}/metrics`
  (`id, run_id, key, name, description?, kind, value, context?, created_at, updated_at`).
- **Common call:** `GET /metrics?experiment_id={id}&version_id={ver}` → every
  metric for one report in a single request.

## 2. `GET /versions` — list versions

- **Query (exactly one):** `project_id` (all versions in the project) |
  `experiment_id` (only versions that **have runs** for that experiment).
- **Order:** newest-first → `[0]` is the **latest version with runs**, which the
  matrix defaults to. Also unblocks the evolution view.
- **Returns:** `[]VersionResponse` (`id, project_id, components, components_hash,
  created_at, updated_at`).

---

## Client-side report flow (Experiment matrix)

For experiment `E`, default to the latest version:

1. `GET /versions?experiment_id=E` → `versions`; default `version = versions[0]`.
2. `GET /experiments/E/cases` → `cases` (row labels; shows cases even with 0 runs).
3. `GET /runs?experiment_id=E&version_id=V` → `runs` (repeats for this version).
4. `GET /metrics?experiment_id=E&version_id=V` → `metrics` (bulk).

Then the client (`src/resources/report/aggregate.ts`):
- joins `metrics → runs` by `run_id`, groups runs by `case_id`;
- per `(case, metric_key)` cell: `mean, n, stddev, min, max` over the case's repeats;
- per-metric experiment-wide aggregate (column footer);
- **grade** = mean of per-metric means over score-like kinds (`ratio`, `pct`);
- **run summary** from `run.status` (`succeeded` = ok; `failed`/`errored` = not).

### Reference values (from the Go enums)
- `RunStatus`: `succeeded | failed | errored`.
- `MetricKind`: `pct | duration | currency | ratio | count | raw`
  (heatmap coloring applies to the `[0,1]`-style kinds `ratio`/`pct`).

## What needs no endpoint

The **per-sample drill-down** (case input/output + each metric's `value` and
judge `reply`/`reason`) reuses the **already-fetched** runs + metrics from the
report (filtered by `case_id` in memory) — no extra request.

## Downstream views (same two endpoints)

- **Evolution:** `GET /versions?experiment_id=E` for the version axis, then a
  report aggregation per version (or one bulk `GET /metrics?experiment_id=E`
  across all versions, grouped client-side by `version_id`).
- **Comparison:** two versions → two reports → diff client-side.
