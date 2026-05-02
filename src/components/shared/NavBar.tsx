"use client";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { MapPin, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavBar({ role }: { role: "admin" | "worker" }) {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 rounded-lg p-1.5">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Field Force</span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
            ${role === "admin" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"}`}>
            {role === "admin" ? "Admin" : "Worker"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
            <User className="h-3.5 w-3.5" />
            <span>{session?.user?.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
