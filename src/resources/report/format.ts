/** Metric kinds whose value is a 0..1-style score we can grade / heatmap. */
const SCORE_KINDS = new Set(["ratio", "pct"]);

/** Normalize a metric value to [0,1] for coloring, or null if not scoreable. */
export function normalizeScore(value: number, kind: string): number | null {
    if (!SCORE_KINDS.has(kind)) return null;
    if (kind === "pct") return value / 100;
    return value; // ratio
}

/** Compact number: 2 decimals, trailing zeros trimmed. */
export function fmt(n: number): string {
    return Number(n.toFixed(2)).toString();
}

/** Red→green tint for a score-like cell, or undefined for non-score kinds. */
export function scoreTint(value: number, kind: string): string | undefined {
    const t = normalizeScore(value, kind);
    if (t == null) return undefined;
    const c = Math.max(0, Math.min(1, t));
    return `hsl(${c * 120} 65% 45% / 0.18)`;
}

/** Stronger red→green tint for a 0..1 grade chip. */
export function gradeTint(grade: number): string {
    const c = Math.max(0, Math.min(1, grade));
    return `hsl(${c * 120} 65% 45% / 0.22)`;
}
