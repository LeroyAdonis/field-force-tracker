import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkers } from "@/hooks/useWorkers";
import { useVisits } from "@/hooks/useVisits";
import { useSites } from "@/hooks/useSites";
import { toWorker, toVisit, toSite } from "@/lib/adapters";
import { DEFAULT_DAILY_VISITS } from "@/lib/mock-data";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Period = "7d" | "30d" | "90d";

const todayISO = new Date().toISOString().slice(0, 10);

export default function Reports() {
  const navigate = useNavigate();
  const { data: workersData = [] } = useWorkers();
  const { data: visitsData = [] } = useVisits();
  const { data: sitesData = [] } = useSites();

  const workers = workersData.map(toWorker);
  const visits = visitsData.map(toVisit);
  const sites = sitesData.map(toSite);
  const dailyVisitsTarget = DEFAULT_DAILY_VISITS;

  const [period, setPeriod] = useState<Period>("30d");
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const dateRange = useMemo(() => {
    const end = new Date(todayISO + "T00:00:00");
    const start = new Date(todayISO + "T00:00:00");
    start.setDate(start.getDate() - (days - 1));
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${fmt(start)} — ${fmt(end)}`;
  }, [days]);

  const series = useMemo(() => {
    const arr: { date: string; label: string; visits: number; km: number; target: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayVisits = visits.filter((v) => v.date === key);
      arr.push({
        date: key,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        visits: dayVisits.length,
        km: +dayVisits.reduce((s, v) => s + v.km, 0).toFixed(1),
        target: dailyVisitsTarget * Math.max(1, workers.length),
      });
    }
    return arr;
  }, [visits, days, dailyVisitsTarget, workers.length]);

  const byWorker = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return workers.map((w) => {
      const f = visits.filter((v) => v.workerId === w.id && new Date(v.timestamp) >= cutoff);
      return {
        name: w.name.split(" ")[0],
        visits: f.length,
        km: +f.reduce((s, v) => s + v.km, 0).toFixed(0),
      };
    });
  }, [workers, visits, days]);

  const bySite = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sites
      .map((s) => ({
        name: s.name.split(" ")[0],
        value: visits.filter((v) => v.siteId === s.id && new Date(v.timestamp) >= cutoff).length,
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [sites, visits, days]);

  const totalVisits = series.reduce((s, x) => s + x.visits, 0);
  const totalKm = series.reduce((s, x) => s + x.km, 0);
  const totalTarget = dailyVisitsTarget * Math.max(1, workers.length) * days;
  const completion = Math.round((totalVisits / Math.max(1, totalTarget)) * 100);

  const PIE_COLORS = ["hsl(226 100% 64%)", "hsl(158 84% 39%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(265 80% 65%)", "hsl(190 80% 50%)"];

  const [dayDetail, setDayDetail] = useState<{ date: string; visits: number; km: number } | null>(null);

  const handleExportCSV = () => {
    const areaRows = series.map((r) => `${r.date},${r.visits},${r.km}`);
    const areaCsv = ["Date,Visits,KM", ...areaRows].join("\n");
    const workerRows = byWorker.map((r) => `${r.name},${r.visits},${r.km}`);
    const workerCsv = ["Worker,Visits,KM", ...workerRows].join("\n");
    const csv = `Trend Data\n${areaCsv}\n\nWorker Data\n${workerCsv}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${period}-${todayISO}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="label-eyebrow">Insights</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">Reports & Analytics</h1>
          <p className="text-foreground-muted text-sm mt-1">Visualize KPI performance and field operations trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="surface-recessed p-1 flex">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  period === p ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <p className="text-sm text-foreground-muted -mt-3">{dateRange}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Visits" value={totalVisits.toLocaleString()} />
        <Stat label="Total KM" value={totalKm.toFixed(0)} />
        <Stat label="Target" value={totalTarget.toLocaleString()} />
        <div className="surface-dark p-5">
          <div className="label-eyebrow text-primary-foreground/60">Completion</div>
          <div className="display-num text-4xl mt-1">{completion}%</div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="label-eyebrow">Trend</div>
            <h2 className="text-lg font-bold mt-0.5">Visits & Mileage Over Time</h2>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart
              data={series}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              onClick={(payload) => {
                if (payload?.activePayload?.[0]?.payload) {
                  const d = payload.activePayload[0].payload;
                  setDayDetail({ date: d.date, visits: d.visits, km: d.km });
                }
              }}
            >
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(226 100% 64%)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(226 100% 64%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(158 84% 39%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(158 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--surface-high))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface-lowest))", border: "none", borderRadius: 12 }} />
              <Area type="monotone" dataKey="visits" stroke="hsl(226 100% 64%)" strokeWidth={2.5} fill="url(#g1)" name="Visits" />
              <Area type="monotone" dataKey="km" stroke="hsl(158 84% 39%)" strokeWidth={2.5} fill="url(#g2)" name="KM" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Dialog open={!!dayDetail} onOpenChange={(open) => { if (!open) setDayDetail(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Day Detail</DialogTitle>
            <DialogDescription>
              {dayDetail ? new Date(dayDetail.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}
            </DialogDescription>
          </DialogHeader>
          {dayDetail && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="surface-card p-4 text-center">
                <div className="label-eyebrow">Visits</div>
                <div className="display-num text-2xl mt-1">{dayDetail.visits}</div>
              </div>
              <div className="surface-card p-4 text-center">
                <div className="label-eyebrow">KM</div>
                <div className="display-num text-2xl mt-1">{dayDetail.km}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="surface-card p-6 xl:col-span-2">
          <div className="label-eyebrow mb-1">By Worker</div>
          <h2 className="text-lg font-bold">Visits & Distance per Operative</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer>
              <BarChart data={byWorker} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} onClick={() => navigate("/admin/workforce")} style={{ cursor: "pointer" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--surface-high))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground-muted))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface-lowest))", border: "none", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="visits" fill="hsl(226 100% 64%)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="km" fill="hsl(0 0% 12%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="label-eyebrow mb-1">Distribution</div>
          <h2 className="text-lg font-bold">Top Sites Visited</h2>
          {bySite.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-foreground-muted">No site data for this period.</div>
          ) : (
            <>
              <div className="h-64 mt-4">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={bySite} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84} paddingAngle={3} onClick={() => navigate("/admin/sites")} style={{ cursor: "pointer" }}>
                      {bySite.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-lowest))", border: "none", borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {bySite.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    <span className="font-bold tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <div className="label-eyebrow">{label}</div>
      <div className="display-num text-3xl mt-2">{value}</div>
    </div>
  );
}
