import { cn } from "@/lib/utils";

type Flag = "green" | "amber" | "red";

const config: Record<Flag, { label: string; className: string; dot: string }> = {
  green:  { label: "On Track",       className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  amber:  { label: "At Risk",        className: "bg-amber-500/15   text-amber-400   border border-amber-500/30",   dot: "bg-amber-400"   },
  red:    { label: "Missing Target", className: "bg-red-500/15     text-red-400     border border-red-500/30",     dot: "bg-red-400"     },
};

export function FlagBadge({ flag, size = "sm" }: { flag: Flag; size?: "sm" | "lg" }) {
  const c = config[flag];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-medium", c.className,
      size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs")}>
      <span className={cn("rounded-full flex-shrink-0", c.dot, size === "lg" ? "h-2 w-2" : "h-1.5 w-1.5")} />
      {c.label}
    </span>
  );
}
