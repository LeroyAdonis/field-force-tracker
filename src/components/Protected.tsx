import { Navigate } from "react-router-dom";
import { Role } from "@/lib/types";
import { useApp } from "@/lib/store";
import { AppShell } from "./AppShell";

export function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = useApp(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/worker"} replace />;
  return <AppShell>{children}</AppShell>;
}
