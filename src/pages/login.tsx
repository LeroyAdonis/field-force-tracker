import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@kinetic.enterprise", password: "Admin1234!" },
  { label: "Worker — Marcus", email: "marcus@kinetic.enterprise", password: "Worker1234!" },
  { label: "Worker — Sarah", email: "sarah@kinetic.enterprise", password: "Worker1234!" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-warm: ping the session endpoint on mount so Neon wakes up before the user submits
  useEffect(() => {
    fetch("/api/auth/get-session").catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || data?.error || "Invalid email or password.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary grid place-items-center mb-4">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Field Force Tracker</h1>
          <p className="text-sm text-foreground-muted mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="surface-card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 surface-recessed rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground-muted mb-3 uppercase tracking-wider">Demo accounts</p>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => { setEmail(demo.email); setPassword(demo.password); setError(""); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-high transition-colors"
              >
                <span className="text-xs font-bold block">{demo.label}</span>
                <span className="text-[11px] text-foreground-muted">{demo.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
