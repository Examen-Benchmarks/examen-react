import { useEffect, useRef, useState } from "react";

// A small dependency-free multi-line chart on a fixed 0..1 y-axis. Values are
// already normalised to [0,1] by the caller. It renders at the container's
// actual pixel width (measured) rather than a scaled viewBox, so text and
// strokes stay their intended size regardless of how wide the page is.

export interface ChartSeries {
    key: string;
    label: string;
    /** Any CSS colour (hex or a `var(--token)`). */
    color: string;
    /** One value per x label; null leaves a gap (no point drawn). */
    values: (number | null)[];
    emphasis?: boolean;
}

interface EvolutionChartProps {
    labels: string[];
    subLabels?: (string | undefined)[];
    series: ChartSeries[];
    selectedIndex?: number;
    onPointClick?: (index: number) => void;
    formatValue?: (v: number) => string;
}

const H = 200;
const PAD = { l: 32, r: 14, t: 10, b: 26 };
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

function clamp(n: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, n));
}

export default function EvolutionChart({
    labels,
    subLabels,
    series,
    selectedIndex,
    onPointClick,
    formatValue = (v) => Number(v.toFixed(2)).toString(),
}: EvolutionChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [hover, setHover] = useState<number | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width;
            if (w) setWidth(w);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const W = Math.max(width, 240);
    const plotW = W - PAD.l - PAD.r;
    const plotH = H - PAD.t - PAD.b;

    const n = labels.length;
    const xFor = (i: number) =>
        n <= 1 ? PAD.l + plotW / 2 : PAD.l + (i / (n - 1)) * plotW;
    const yFor = (v: number) => PAD.t + (1 - clamp(v, 0, 1)) * plotH;

    const indexFromClientX = (clientX: number): number => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || n <= 1) return 0;
        const px = clientX - rect.left;
        return clamp(Math.round(((px - PAD.l) / plotW) * (n - 1)), 0, n - 1);
    };

    const active = hover ?? selectedIndex ?? null;
    const muted = "var(--muted-foreground)";

    return (
        <div ref={containerRef} className="relative w-full">
            <svg
                width={W}
                height={H}
                className="select-none"
                role="img"
                aria-label="Grade across versions"
                onMouseMove={(e) => setHover(indexFromClientX(e.clientX))}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => onPointClick?.(indexFromClientX(e.clientX))}
            >
                {Y_TICKS.map((t) => (
                    <g key={t}>
                        <line
                            x1={PAD.l}
                            x2={W - PAD.r}
                            y1={yFor(t)}
                            y2={yFor(t)}
                            style={{ stroke: "var(--border)" }}
                            strokeWidth={1}
                        />
                        <text
                            x={PAD.l - 6}
                            y={yFor(t)}
                            textAnchor="end"
                            dominantBaseline="middle"
                            style={{ fill: muted }}
                            fontSize={10}
                        >
                            {t}
                        </text>
                    </g>
                ))}

                {active != null && n > 0 && (
                    <line
                        x1={xFor(active)}
                        x2={xFor(active)}
                        y1={PAD.t}
                        y2={PAD.t + plotH}
                        style={{ stroke: muted, opacity: 0.4 }}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />
                )}

                {labels.map((lab, i) => (
                    <text
                        key={i}
                        x={xFor(i)}
                        y={H - 8}
                        textAnchor="middle"
                        style={{ fill: muted }}
                        fontSize={10}
                        fontFamily="ui-monospace, monospace"
                    >
                        {lab}
                    </text>
                ))}

                {series.map((s) => {
                    const pts = s.values
                        .map((v, i) =>
                            v == null ? null : `${xFor(i)},${yFor(v)}`,
                        )
                        .filter(Boolean)
                        .join(" ");
                    return (
                        <g key={s.key}>
                            {pts && (
                                <polyline
                                    points={pts}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth={s.emphasis ? 2 : 1.25}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                />
                            )}
                            {s.values.map((v, i) =>
                                v == null ? null : (
                                    <circle
                                        key={i}
                                        cx={xFor(i)}
                                        cy={yFor(v)}
                                        r={
                                            active === i
                                                ? s.emphasis
                                                    ? 3.5
                                                    : 2.5
                                                : s.emphasis
                                                  ? 2.5
                                                  : 1.75
                                        }
                                        fill={s.color}
                                    />
                                ),
                            )}
                        </g>
                    );
                })}
            </svg>

            {active != null && (
                <div
                    className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
                    style={{ left: `${(xFor(active) / W) * 100}%` }}
                >
                    <div className="font-mono text-[11px]">{labels[active]}</div>
                    {subLabels?.[active] && (
                        <div className="text-muted-foreground">
                            {subLabels[active]}
                        </div>
                    )}
                    <div className="mt-1 flex flex-col gap-0.5">
                        {series.map((s) => {
                            const v = s.values[active];
                            return (
                                <div
                                    key={s.key}
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="inline-block size-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: s.color }}
                                    />
                                    <span
                                        className={s.emphasis ? "font-medium" : ""}
                                    >
                                        {s.label}
                                    </span>
                                    <span className="ml-auto pl-3 tabular-nums">
                                        {v == null ? "—" : formatValue(v)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
