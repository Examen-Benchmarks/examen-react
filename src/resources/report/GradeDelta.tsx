import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "./format";

/**
 * The grade's change at the latest version relative to the previous one, as a
 * signed percentage with direction + colour. "—" when there's no prior graded
 * version to compare against (or the previous grade was 0). One number reads
 * far better in a dense row than an inline trend line.
 */
export default function GradeDelta({ values }: { values: (number | null)[] }) {
    const defined = values.filter((v): v is number => v != null);
    if (defined.length < 2)
        return <span className="text-muted-foreground">—</span>;

    const latest = defined[defined.length - 1];
    const prev = defined[defined.length - 2];
    const absDelta = latest - prev;

    if (prev === 0) return <span className="text-muted-foreground">—</span>;

    const pct = (absDelta / prev) * 100;
    const dir = absDelta > 0 ? "up" : absDelta < 0 ? "down" : "flat";
    const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 tabular-nums",
                dir === "up" && "text-green-600 dark:text-green-500",
                dir === "down" && "text-red-600 dark:text-red-500",
                dir === "flat" && "text-muted-foreground",
            )}
            title={`${fmt(prev)} → ${fmt(latest)} (vs previous version)`}
        >
            <Icon className="size-3.5" />
            {pct > 0 ? "+" : ""}
            {pct.toFixed(1)}%
        </span>
    );
}
