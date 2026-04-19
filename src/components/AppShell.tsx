import { NavLink } from "@/components/NavLink";
import { useApp } from "@/lib/store";
import { Compass, LayoutDashboard, BarChart3, Building2, Users, LogOut, Settings, Bell, AlertTriangle, MapPin, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const adminNav = [
  { to: "/admin", label: "Operational Pulse", icon: LayoutDashboard, end: true },
  { to: "/admin/workforce", label: "Workforce", icon: Users },
  { to: "/admin/at-risk", label: "At-Risk Workers", icon: AlertTriangle },
  { to: "/admin/sites", label: "Site Management", icon: Building2 },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
];

const workerNav = [
  { to: "/worker", label: "Field Performance", icon: LayoutDashboard, end: true },
  { to: "/worker/log", label: "Log Site Visit", icon: FilePlus2 },
  { to: "/worker/history", label: "Visit History", icon: MapPin },
];

interface Props { children: React.ReactNode; }

export function AppShell({ children }: Props) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;
  const items = user.role === "admin" ? adminNav : workerNav;

  const onLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col px-5 py-6 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 mb-10">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Architect</div>
            <div className="text-[11px] text-foreground-muted tracking-wider uppercase">Intelligence</div>
          </div>
        </div>

        <div className="label-eyebrow px-3 mb-2">{user.role === "admin" ? "Admin View" : "Field Operative"}</div>

        <nav className="flex flex-col gap-1">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted hover:bg-surface-low hover:text-foreground transition-colors"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-soft"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <div className="surface-recessed p-3 flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-foreground-muted truncate">{user.title}</div>
            </div>
            <button onClick={onLogout} aria-label="Sign out" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-high transition-colors">
              <LogOut className="h-4 w-4 text-foreground-muted" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar (mobile-aware) */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/60 px-4 lg:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center">
              <Compass className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Architect Intelligence</span>
          </div>
          <div className="hidden lg:block label-eyebrow">
            {user.role === "admin" ? "Command Center · Admin" : "Field Operations Console"}
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 grid place-items-center rounded-lg hover:bg-surface-low transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-danger animate-pulse-soft" />
            </button>
            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover lg:hidden" />
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 px-4 lg:px-10 py-6 lg:py-10 pb-24 lg:pb-10 animate-fade-in">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-lowest/95 backdrop-blur-xl border-t border-border">
          <div className="grid grid-cols-4 px-2 py-2">
            {items.slice(0, 3).map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center gap-1 py-1.5 rounded-xl text-foreground-muted"
                activeClassName="bg-primary text-primary-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span className="text-[10px] font-semibold">{item.label.split(" ")[0]}</span>
              </NavLink>
            ))}
            <button onClick={onLogout} className="flex flex-col items-center gap-1 py-1.5 rounded-xl text-foreground-muted">
              <LogOut className="h-4 w-4" />
              <span className="text-[10px] font-semibold">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
