"use client";
import { cn } from "@/lib/utils";

interface KPIRingProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  flag?: "green" | "amber" | "red";
  size?: "sm" | "md" | "lg";
}

const flagColor: Record<string, string> = {
  green: "#10b981",
  amber: "#f59e0b",
  red:   "#ef4444",
};

export function KPIRing({ label, value, target, unit = "", flag = "green", size = "md" }: KPIRingProps) {
  const pct    = Math.min(target > 0 ? value / target : 0, 1);
  const dims   = size === "lg" ? 120 : size === "md" ? 96 : 72;
  const stroke = size === "lg" ? 10  : size === "md" ? 8  : 6;
  const r      = (dims - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color  = flagColor[flag] ?? flagColor.green;
  const textSz = size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base";
  const subSz  = size === "lg" ? "text-xs"  : "text-[10px]";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle cx={dims/2} cy={dims/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
          <circle cx={dims/2} cy={dims/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold text-white", textSz)}>
            {pct >= 1 ? "✓" : `${Math.round(pct * 100)}%`}
          </span>
          {unit && <span className={cn("text-slate-400", subSz)}>{unit}</span>}
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-300 text-xs font-medium">{label}</p>
        <p className="text-slate-500 text-[10px]">{value}{unit} / {target}{unit}</p>
      </div>
    </div>
  );
}
