"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { BarChart3, Navigation, MapPin, TrendingUp, Loader2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#f97316","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#84cc16"];
type Range = "week" | "month" | "custom";

export function AdminReports() {
  const [range, setRange]       = useState<Range>("week");
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date(),{weekStartsOn:1}),"yyyy-MM-dd"));
  const [endDate, setEndDate]   = useState(format(endOfWeek(new Date(),{weekStartsOn:1}),"yyyy-MM-dd"));
  const [workerId, setWorkerId] = useState("all");
  const [workers, setWorkers]   = useState<any[]>([]);
  const [data, setData]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/workers").then(r=>r.json()).then(d=>setWorkers(Array.isArray(d)?d:[]));
  }, []);

  const applyRange = (r: Range) => {
    const now = new Date();
    if (r === "week") {
      setStartDate(format(startOfWeek(now,{weekStartsOn:1}),"yyyy-MM-dd"));
      setEndDate(format(endOfWeek(now,{weekStartsOn:1}),"yyyy-MM-dd"));
    } else if (r === "month") {
      setStartDate(format(startOfMonth(now),"yyyy-MM-dd"));
      setEndDate(format(endOfMonth(now),"yyyy-MM-dd"));
    }
    setRange(r);
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ startDate, endDate });
    if (workerId !== "all") params.set("workerId", workerId);
    const res = await fetch(`/api/admin/reports?${params}`);
    const raw = await res.json();
    setData(Array.isArray(raw) ? raw : []);
    setLoading(false);
  }, [startDate, endDate, workerId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const byDay = Object.entries(
    data.reduce((acc:any, {visit:v}:any) => { acc[v.visitDate]=(acc[v.visitDate]||0)+1; return acc; }, {})
  ).map(([date,count])=>({ date: format(new Date(date+"T00:00:00"),"dd/MM"), visits: count }))
   .sort((a,b)=>a.date.localeCompare(b.date));

  const kmByDay = Object.entries(
    data.reduce((acc:any,{visit:v}:any)=>{ acc[v.visitDate]=(acc[v.visitDate]||0)+(v.kmCovered??0); return acc; },{})
  ).map(([date,km])=>({ date: format(new Date(date+"T00:00:00"),"dd/MM"), km: parseFloat((km as number).toFixed(1)) }))
   .sort((a,b)=>a.date.localeCompare(b.date));

  const byWorker = Object.entries(
    data.reduce((acc:any,{worker:w,visit:v}:any)=>{
      const n=w?.name??"Unknown";
      if(!acc[n]) acc[n]={visits:0,km:0};
      acc[n].visits++; acc[n].km+=v.kmCovered??0; return acc;
    },{})
  ).map(([name,d]:any)=>({ name:name.split(" ")[0], visits:d.visits, km:parseFloat(d.km.toFixed(1)) }));

  const bySite = Object.entries(
    data.reduce((acc:any,{site:s}:any)=>{ const n=s?.name??"Unknown"; acc[n]=(acc[n]||0)+1; return acc; },{})
  ).map(([name,count])=>({ name:name.length>18?name.slice(0,16)+"…":name, value:count as number }))
   .sort((a,b)=>b.value-a.value).slice(0,8);

  const totalVisits  = data.length;
  const totalKm      = data.reduce((s:number,{visit:v}:any)=>s+(v.kmCovered??0),0);
  const uniqueSites  = new Set(data.map(({visit:v}:any)=>v.siteId)).size;
  const uniqueWorkers= new Set(data.map(({visit:v}:any)=>v.workerId)).size;

  const tt = { backgroundColor:"#1e293b", border:"1px solid #334155", borderRadius:"8px" };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex gap-2">
              {(["week","month","custom"] as Range[]).map(r=>(
                <Button key={r} size="sm" onClick={()=>applyRange(r)}
                  className={range===r?"bg-orange-500 text-white h-8 text-xs":"border border-slate-600 text-slate-400 hover:bg-slate-700 h-8 text-xs bg-transparent"}>
                  {r.charAt(0).toUpperCase()+r.slice(1)}
                </Button>
              ))}
            </div>
            {range==="custom"&&(
              <div className="flex gap-2 items-center">
                <Input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-xs h-8 w-36"/>
                <span className="text-slate-500 text-xs">to</span>
                <Input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-xs h-8 w-36"/>
              </div>
            )}
            <Select value={workerId} onValueChange={(v) => setWorkerId(v ?? "all")}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs w-44">
                <SelectValue placeholder="All workers"/>
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-white">
                <SelectItem value="all" className="focus:bg-slate-600 text-xs">All Workers</SelectItem>
                {workers.map(({user:u})=>(
                  <SelectItem key={u.id} value={u.id} className="focus:bg-slate-600 text-xs">{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 text-orange-400 animate-spin"/></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:"Total Visits",   value:totalVisits},
              {label:"Total Km",       value:`${totalKm.toFixed(0)} km`},
              {label:"Unique Sites",   value:uniqueSites},
              {label:"Active Workers", value:uniqueWorkers},
            ].map(s=>(
              <Card key={s.label} className="bg-slate-800/50 border-slate-700 p-4">
                <p className="text-slate-400 text-xs">{s.label}</p>
                <p className="text-white text-2xl font-bold mt-1">{s.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-400"/>Daily Site Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byDay.length===0?<NoData/>:(
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byDay} margin={{top:0,right:8,bottom:0,left:-20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:11}}/>
                      <YAxis tick={{fill:"#64748b",fontSize:11}}/>
                      <Tooltip contentStyle={tt}/>
                      <Bar dataKey="visits" fill="#f97316" radius={[3,3,0,0]} name="Visits"/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-400"/>Daily Km Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kmByDay.length===0?<NoData/>:(
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={kmByDay} margin={{top:0,right:8,bottom:0,left:-20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:11}}/>
                      <YAxis tick={{fill:"#64748b",fontSize:11}}/>
                      <Tooltip contentStyle={tt}/>
                      <Line type="monotone" dataKey="km" stroke="#3b82f6" strokeWidth={2} dot={{fill:"#3b82f6",r:3}} name="Km"/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Visits per Worker</CardTitle>
              </CardHeader>
              <CardContent>
                {byWorker.length===0?<NoData/>:(
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byWorker} margin={{top:0,right:8,bottom:0,left:-20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                      <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:11}}/>
                      <YAxis tick={{fill:"#64748b",fontSize:11}}/>
                      <Tooltip contentStyle={tt}/>
                      <Bar dataKey="visits" radius={[3,3,0,0]} name="Visits">
                        {byWorker.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Top Sites by Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {bySite.length===0?<NoData/>:(
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={bySite} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                        {bySite.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={tt}/>
                      <Legend iconSize={8} wrapperStyle={{fontSize:"10px",color:"#94a3b8"}}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {data.length>0&&(
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Visit Log ({data.length} entries)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {["Date","Worker","Site","Km","Notes"].map(h=>(
                          <th key={h} className="text-left text-slate-400 py-2 pr-4 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0,50).map(({visit:v,worker:w,site:s}:any,i:number)=>(
                        <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                          <td className="py-2 pr-4 text-slate-300">{v.visitDate}</td>
                          <td className="py-2 pr-4 text-slate-300 truncate max-w-[120px]">{w?.name??"-"}</td>
                          <td className="py-2 pr-4 text-slate-300 truncate max-w-[140px]">{s?.name??"-"}</td>
                          <td className="py-2 pr-4 text-slate-400">{v.kmCovered!=null?`${v.kmCovered} km`:"-"}</td>
                          <td className="py-2 text-slate-500 truncate max-w-[160px]">{v.notes||"-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length>50&&<p className="text-slate-500 text-xs mt-2 text-center">Showing 50 of {data.length}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
function NoData() {
  return <div className="flex items-center justify-center h-[200px]"><p className="text-slate-600 text-sm">No data for this period</p></div>;
}
