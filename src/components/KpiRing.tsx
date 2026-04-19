import { cn } from "@/lib/utils";

interface KpiRingProps {
  value: number;        // 0..1+
  label?: string;
  size?: number;
  stroke?: number;
  status?: "success" | "warning" | "danger";
  centerTop?: string;
  centerBottom?: string;
  className?: string;
}

const colorMap = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
} as const;

export function KpiRing({
  value,
  size = 160,
  stroke = 14,
  status = "success",
  centerTop,
  centerBottom,
  className,
}: KpiRingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const color = colorMap[status];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={`glow-${status}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="hsl(var(--surface-high))" strokeWidth={stroke} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#glow-${status})`}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerTop && <div className="text-2xl font-extrabold tabular-nums tracking-tight">{centerTop}</div>}
        {centerBottom && <div className="label-eyebrow mt-1">{centerBottom}</div>}
      </div>
    </div>
  );
}
