import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accent?: string;
}

export function StatCard({ label, value, sub, icon: Icon, accent = "orange" }: StatCardProps) {
  const accentMap: Record<string, string> = {
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    emerald:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red:    "text-red-400 bg-red-500/10 border-red-500/20",
  };
  const cls = accentMap[accent] ?? accentMap.orange;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
      {Icon && (
        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", cls)}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
