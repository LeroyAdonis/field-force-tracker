import { RiskStatus } from "@/lib/types";
import { statusLabel } from "@/lib/kpi";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

interface Props { status: RiskStatus; className?: string; }

export function StatusChip({ status, className }: Props) {
  const cls =
    status === "on-track" ? "chip-success" :
    status === "at-risk" ? "chip-warning" : "chip-danger";
  const Icon = status === "on-track" ? CheckCircle2 : status === "at-risk" ? AlertTriangle : AlertOctagon;
  return (
    <span className={cn("chip", cls, className)}>
      <Icon className="h-3.5 w-3.5" />
      {statusLabel(status)}
    </span>
  );
}

export function StatusPill({ status }: { status: RiskStatus }) {
  const bg =
    status === "on-track" ? "bg-success" :
    status === "at-risk" ? "bg-warning" : "bg-danger";
  return <span className={cn("inline-block h-2.5 w-12 rounded-full", bg)} />;
}
