"use client";
import { useState, useEffect, useCallback } from "react";
import { NavBar } from "@/components/shared/NavBar";
import { KPIRing } from "@/components/shared/KPIRing";
import { FlagBadge } from "@/components/shared/FlagBadge";
import { StatCard } from "@/components/shared/StatCard";
import { LogVisitModal } from "@/components/worker/LogVisitModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Calendar, TrendingUp, Navigation, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props { user: any }

export function WorkerDashboard({ user }: Props) {
  const [kpi, setKpi] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, visitsRes] = await Promise.all([
        fetch("/api/kpi"),
        fetch(`/api/visits?date=${today}`),
      ]);
      const [kpiData, visitsData] = await Promise.all([kpiRes.json(), visitsRes.json()]);
      setKpi(kpiData);
      setVisits(visitsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVisitLogged = () => { setShowLogModal(false); fetchData(); };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
    </div>
  );

  const day = kpi?.today;
  const week = kpi?.week;
  const month = kpi?.month;

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar role="worker" />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">Good {getGreeting()}, {user.name.split(" ")[0]} 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
          </div>
          <Button onClick={() => setShowLogModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 font-semibold shadow-lg shadow-orange-500/20">
            <Plus className="h-4 w-4" />
            Log Visit
          </Button>
        </div>

        {/* Today's KPI rings */}
        {day && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white text-base">Today's Progress</CardTitle>
                <p className="text-slate-400 text-xs mt-0.5">
                  {day.visits} of {day.visitTarget} sites visited · {day.km.toFixed(1)} km covered
                </p>
              </div>
              <FlagBadge flag={day.visitFlag === "red" || day.kmFlag === "red" ? "red"
                : day.visitFlag === "amber" || day.kmFlag === "amber" ? "amber" : "green"} />
            </CardHeader>
            <CardContent>
              <div className="flex justify-around py-2">
                <KPIRing label="Sites" value={day.visits} target={day.visitTarget} flag={day.visitFlag} size="lg" />
                <KPIRing label="Kilometres" value={parseFloat(day.km.toFixed(1))} target={day.kmTarget} unit="km" flag={day.kmFlag} size="lg" />
              </div>
              {/* Expected pace bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Expected pace</span>
                  <span>{Math.round(day.expectedVisitPct * 100)}% of day elapsed</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full">
                  <div className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{ width: `${day.expectedVisitPct * 100}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week / Month rollup */}
        <div className="grid grid-cols-2 gap-3">
          {week && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">This Week</CardTitle>
                  <FlagBadge flag={week.flag} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Sites</span><span>{week.visits}/{week.visitTarget}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full transition-all ${progressColor(week.flag)}`}
                      style={{ width: `${week.visitPct * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Km</span><span>{week.km.toFixed(0)}/{week.kmTarget}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full transition-all ${progressColor(week.flag)}`}
                      style={{ width: `${week.kmPct * 100}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {month && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">This Month</CardTitle>
                  <FlagBadge flag={month.flag} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Sites</span><span>{month.visits}/{month.visitTarget}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full transition-all ${progressColor(month.flag)}`}
                      style={{ width: `${month.visitPct * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Km</span><span>{month.km.toFixed(0)}/{month.kmTarget}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full transition-all ${progressColor(month.flag)}`}
                      style={{ width: `${month.kmPct * 100}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Today's visits log */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-400" />
              Today's Site Visits
              <span className="ml-auto text-xs text-slate-400 font-normal">{visits.length} logged</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No visits logged today</p>
                <p className="text-slate-600 text-xs mt-1">Tap "Log Visit" to record your first site</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visits.map(({ visit, site }: any) => (
                  <div key={visit.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700/50">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{site?.name ?? "Unknown Site"}</p>
                      <div className="flex items-center gap-3 text-slate-500 text-xs mt-0.5">
                        {visit.arrivalTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(visit.arrivalTime), "HH:mm")}
                          </span>
                        )}
                        {visit.kmCovered != null && (
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {visit.kmCovered} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      {showLogModal && (
        <LogVisitModal onClose={() => setShowLogModal(false)} onSuccess={handleVisitLogged} />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function progressColor(flag: string) {
  if (flag === "green") return "bg-emerald-500";
  if (flag === "amber") return "bg-amber-500";
  return "bg-red-500";
}
