import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Activity } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const loginAs = useApp(s => s.loginAs);
  const workers = useApp(s => s.workers);
  const [email, setEmail] = useState("admin@kinetic.enterprise");
  const [pass, setPass] = useState("demo");
  const [showPass, setShowPass] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = email.toLowerCase().startsWith("admin");
    if (isAdmin) { loginAs("admin"); navigate("/admin"); return; }
    const w = workers.find(w => w.email.toLowerCase() === email.toLowerCase());
    loginAs("worker", w?.id);
    navigate("/worker");
  };

  const quick = (mail: string) => {
    setEmail(mail);
    const isAdmin = mail.toLowerCase().startsWith("admin");
    if (isAdmin) { loginAs("admin"); navigate("/admin"); return; }
    const w = workers.find(w => w.email.toLowerCase() === mail.toLowerCase());
    loginAs("worker", w?.id);
    navigate("/worker");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: form */}
      <div className="flex flex-col px-6 sm:px-12 lg:px-20 py-10 lg:py-16">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-base font-bold leading-tight">Architect Intelligence</div>
            <div className="label-eyebrow mt-0.5">Command Center · v2.4</div>
          </div>
        </div>

        <div className="mt-16 lg:mt-24 max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Welcome Back.</h1>
          <p className="mt-3 text-foreground-muted leading-relaxed">
            Access your precision orchestrator dashboard and manage global field operations with intent.
          </p>

          <form onSubmit={submit} className="mt-10 space-y-5">
            <div>
              <label className="label-eyebrow mb-2 block">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface-low text-foreground placeholder:text-foreground-muted/70 focus:bg-surface-lowest focus:shadow-glow outline-none transition-all"
                  placeholder="name@kinetic.enterprise"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-eyebrow">Security Key</label>
                <button type="button" className="text-xs font-semibold text-accent hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                  type={showPass ? "text" : "password"} required value={pass}
                  onChange={e => setPass(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 rounded-xl bg-surface-low text-foreground focus:bg-surface-lowest focus:shadow-glow outline-none transition-all"
                  placeholder="••••••••••••"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Sign In to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t border-border/60">
            <div className="label-eyebrow mb-3">Demo Access</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button onClick={() => quick("admin@kinetic.enterprise")} className="surface-recessed text-left p-3 hover:bg-surface-high transition-colors">
                <div className="text-xs font-bold">Admin</div>
                <div className="text-[11px] text-foreground-muted truncate">Eleanor Vance</div>
              </button>
              <button onClick={() => quick("marcus@kinetic.enterprise")} className="surface-recessed text-left p-3 hover:bg-surface-high transition-colors">
                <div className="text-xs font-bold">Worker</div>
                <div className="text-[11px] text-foreground-muted truncate">Marcus Kane</div>
              </button>
              <button onClick={() => quick("sarah@kinetic.enterprise")} className="surface-recessed text-left p-3 hover:bg-surface-high transition-colors">
                <div className="text-xs font-bold">Worker · Risk</div>
                <div className="text-[11px] text-foreground-muted truncate">Sarah Miller</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-10 text-xs text-foreground-muted">
          © 2026 Architect Intelligence. Unauthorized access is prohibited and subject to monitoring.
        </div>
      </div>

      {/* Right: editorial pane */}
      <div className="hidden lg:block relative bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative h-full flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/70">Live System Status: Optimal</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
              The Future of <br /> Workforce <br /> Orchestration.
            </h2>
            <p className="mt-6 text-primary-foreground/70 leading-relaxed">
              "Architect has transformed our field operations from reactive to predictive. The precision is unmatched."
            </p>
            <div className="mt-10 grid grid-cols-2 gap-8 pt-6 border-t border-primary-foreground/15">
              <div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/50 font-bold">Active Sites</div>
                <div className="text-3xl font-extrabold mt-2">124 Hubs</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/50 font-bold">Efficiency Gain</div>
                <div className="text-3xl font-extrabold mt-2 flex items-center gap-1">+42%<Activity className="h-5 w-5 text-success" /></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-primary-foreground/60">
            <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" />SOC 2 · ISO 27001</div>
            <div className="font-mono uppercase">Node · South-West Hub A9</div>
          </div>
        </div>
      </div>
    </div>
  );
}
