// A tiny fixed-size grade trend (0..1 domain, oldest→newest). Rendered at exact
// pixel size — no viewBox scaling — so it stays crisp inline in a table row.

interface SparklineProps {
    /** Grades per version, oldest→newest; null leaves a gap. */
    values: (number | null)[];
    width?: number;
    height?: number;
    color?: string;
}

function clamp(n: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, n));
}

const PAD = 3;

export default function Sparkline({
    values,
    width = 96,
    height = 26,
    color = "var(--primary)",
}: SparklineProps) {
    const n = values.length;
    const defined = values
        .map((v, i) => ({ v, i }))
        .filter((d): d is { v: number; i: number } => d.v != null);

    if (defined.length === 0)
        return <span className="text-muted-foreground">—</span>;

    const x = (i: number) =>
        n <= 1 ? width / 2 : PAD + (i / (n - 1)) * (width - 2 * PAD);
    const y = (v: number) => PAD + (1 - clamp(v, 0, 1)) * (height - 2 * PAD);

    const pts = defined.map((d) => `${x(d.i)},${y(d.v)}`).join(" ");
    const last = defined[defined.length - 1];

    return (
        <svg width={width} height={height} role="img" aria-label="Grade trend">
            {defined.length > 1 && (
                <polyline
                    points={pts}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            )}
            <circle cx={x(last.i)} cy={y(last.v)} r={2} fill={color} />
        </svg>
    );
}
