# Eval-dashboard UX patterns — research synthesis

> Deep-research pass (102 agents, 20 primary sources, 24 verified claims) on how
> leading LLM-evaluation dashboards present results, to inform Examen's
> benchmark views. Sources are first-party vendor docs/changelogs (authoritative
> for each tool's own UI, but self-descriptive).

## TL;DR

The field converges on a small, reusable set of patterns that map cleanly onto
Examen:

1. **Matrix table is the spine.** Rows = cases, columns = scorers/metrics, cells
   = mean score, **red→green heatmap** against configurable thresholds, per-column
   sort/filter. (LangSmith, Braintrust; W&B Weave uses the transposed model×metric
   form.) Our `benchKimi` matrix is already in this lineage.
2. **Headline grade = a formula over scorers**, not one metric standing in for
   overall quality (Braintrust "aggregate scores"). → our per-experiment grade.
3. **Per-sample drill-down = row-click → detail/side panel** with input, output,
   expected/target, and **the judge's reasoning as a first-class artifact**
   ("why did it get this score"). → our `Metric.context` (`reply` + `reason`)
   belongs front-and-center here.
4. **Comparison = select-two → Compare**, pin a **baseline**, align rows by
   **stable case ID**, show green/red deltas and improved/regressed/unchanged
   flags. (Braintrust, LangSmith pairwise, Langfuse.)
5. **Regression/evolution** uses green/red deltas + "order by regressions" and
   version-over-version trends.
6. **Tables are the dense primary surface; charts are reserved for evolution.**
   (shadcn/ui table + a chart lib such as Recharts.)

## Verified findings

| # | Finding | Confidence |
|---|---------|------------|
| 1 | Aggregate surface is a sortable/filterable color-coded **matrix table** with per-scorer columns | high |
| 2 | Score cells are **red→green heatmap** vs **configurable thresholds**; per-column sort/filter standard | high |
| 3 | Single headline **grade = aggregate-score formula** combining multiple scorers | high |
| 4 | Drill-down = **row-click → detail/trace panel** (input/output/expected + scorer reasoning) | high |
| 5 | **Judge reasoning is a primary artifact** — chain-of-thought explaining each score | high |
| 6 | Comparison = **baseline vs candidate**, aligned row-by-row on stable IDs | high |
| 7 | Regressions surfaced via **green/red deltas** + regression sort/flag | high |
| 8 | Pairwise/win-lose is a **distinct mode** (LangSmith Comparison View) | high |

## Caveats & gaps

- Evidence skews to **Braintrust + LangSmith** (plus 1 Langfuse, 2 W&B Weave).
- **No claims survived verification for OpenAI Evals, UK AISI Inspect, promptfoo,
  or Arize Phoenix** — treat as a coverage gap, not evidence they differ.
- **Repeat variance/CI display is undocumented** — how tools visualize variance
  when a case runs n times wasn't found. Relevant to our first-class repeats.
- The **client-vs-server aggregation** recommendation is an engineering inference
  from Examen's constraints, not a sourced finding.

## Key sources

- LangSmith — Analyze an experiment: https://docs.langchain.com/langsmith/analyze-an-experiment
- LangSmith — new experiment view: https://changelog.langchain.com/announcements/new-langsmith-experiment-view-for
- LangSmith — pairwise: https://docs.langchain.com/langsmith/evaluate-pairwise
- Braintrust — analyze results: https://www.braintrust.dev/foundations/how-to-analyze-your-eval-results
- Braintrust — interpret results: https://www.braintrust.dev/docs/evaluate/interpret-results
- Braintrust — comparing experiments: https://www.braintrust.dev/foundations/comparing-experiments
- Langfuse — compare view / baseline: https://langfuse.com/changelog/2025-11-06-compare-view-baseline-support
- W&B Weave — leaderboards: https://docs.wandb.ai/weave/guides/core-types/leaderboards
