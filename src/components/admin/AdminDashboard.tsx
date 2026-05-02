"use client";
import { useState, useEffect, useCallback } from "react";
import { NavBar } from "@/components/shared/NavBar";
import { FlagBadge } from "@/components/shared/FlagBadge";
import { StatCard } from "@/components/shared/StatCard";
import { AdminReports } from "@/components/admin/AdminReports";
import { SiteManager } from "@/components/admin/SiteManager";
import { WorkerManager } from "@/components/admin/WorkerManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, MapPin, BarChart3, Settings2, AlertTriangle,
  CheckCircle2, Loader2, TrendingUp, Navigation
} from "lucide-react";

interface Props { user: any }

export function AdminDashboard({ user }: Props) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKPI = useCallback(async () => {
    try {
      const res = await fetch("/api/kpi?scope=all");
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch { setWorkers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchKPI(); }, [fetchKPI]);

  const flagged   = workers.filter(w => w.overallFlag === "red");
  const atRisk    = workers.filter(w => w.overallFlag === "amber");
  const onTrack   = workers.filter(w => w.overallFlag === "green");

  const avgVisitPct = workers.length
    ? workers.reduce((s, w) => s + w.today.visitPct, 0) / workers.length : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar role="admin" />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-white text-xl font-bold">Admin Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time KPI monitoring across all field workers</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Workers"    value={workers.length}      icon={Users}         accent="blue" />
          <StatCard label="On Track"         value={onTrack.length}      icon={CheckCircle2}  accent="emerald"
            sub={`${workers.length ? Math.round(onTrack.length/workers.length*100) : 0}% of team`} />
          <StatCard label="At Risk"          value={atRisk.length}       icon={AlertTriangle} accent="amber" />
          <StatCard label="Missing Target"   value={flagged.length}      icon={AlertTriangle} accent="red" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700 p-1">
            {[
              { value: "overview", label: "Overview", icon: TrendingUp },
              { value: "workers",  label: "Workers",  icon: Users      },
              { value: "sites",    label: "Sites",    icon: MapPin     },
              { value: "reports",  label: "Reports",  icon: BarChart3  },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}
                className="text-slate-400 data-[state=active]:bg-slate-700 data-[state=active]:text-white gap-1.5 text-sm px-3">
                <Icon className="h-3.5 w-3.5" />{label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview" className="space-y-4">

            {/* Flagged workers — prominent */}
            {(flagged.length > 0 || atRisk.length > 0) && (
              <Card className="bg-red-950/30 border-red-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Needs Attention ({flagged.length + atRisk.length} workers)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[...flagged, ...atRisk].map(w => (
                    <WorkerRow key={w.workerId} worker={w} highlight />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All workers table */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" />All Workers — Today</span>
                  <span className="text-slate-400 text-xs font-normal">
                    Avg completion: {Math.round(avgVisitPct * 100)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                  </div>
                ) : workers.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No workers found. Add workers in the Workers tab.</p>
                ) : (
                  <div className="space-y-2">
                    {workers.map(w => <WorkerRow key={w.workerId} worker={w} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── WORKERS TAB ── */}
          <TabsContent value="workers">
            <WorkerManager />
          </TabsContent>

          {/* ── SITES TAB ── */}
          <TabsContent value="sites">
            <SiteManager />
          </TabsContent>

          {/* ── REPORTS TAB ── */}
          <TabsContent value="reports">
            <AdminReports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function WorkerRow({ worker: w, highlight = false }: { worker: any; highlight?: boolean }) {
  const vPct = Math.round(w.today.visitPct * 100);
  const kPct = Math.round(w.today.kmPct   * 100);
  return (
    <div className={`rounded-lg p-3 border ${highlight
      ? "bg-slate-900/60 border-slate-700/80"
      : "bg-slate-900/40 border-slate-800/60"}`}>
      <div className="flex items-center gap-3 flex-wrap">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
          <span className="text-slate-300 text-xs font-bold">{w.workerName.charAt(0)}</span>
        </div>
        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{w.workerName}</p>
          <p className="text-slate-500 text-xs truncate">{w.email}</p>
        </div>
        {/* Flag */}
        <FlagBadge flag={w.overallFlag} />
        {/* KPIs */}
        <div className="w-full sm:w-auto flex gap-4 mt-2 sm:mt-0">
          <MiniProgress label="Sites" value={w.today.visits} target={w.today.visitTarget} pct={vPct} flag={w.today.visitFlag} />
          <MiniProgress label="Km"    value={parseFloat(w.today.km.toFixed(1))} target={w.today.kmTarget} pct={kPct} flag={w.today.kmFlag} unit="km" />
        </div>
      </div>
    </div>
  );
}

function MiniProgress({ label, value, target, pct, flag, unit="" }: any) {
  const bar = flag === "green" ? "bg-emerald-500" : flag === "amber" ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{label}</span><span>{value}{unit}/{target}{unit}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full w-full">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
