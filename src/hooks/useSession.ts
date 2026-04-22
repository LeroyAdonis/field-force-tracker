import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  displayName: string | null;
  active: boolean;
  workerId?: string;
  jobTitle?: string;
  dailyKmTarget?: number;
  isDemo?: boolean;
}

export function useSession() {
  const [loading, setLoading] = useState(true);
  const setUser = useApp((s) => s.setUser);

  useEffect(() => {
    const restoreSession = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await fetch("/api/users/me", { signal: controller.signal });
        clearTimeout(timer);
        if (response.ok) {
          const userData: SessionUser = await response.json();
          setUser({
            id: userData.id,
            name: userData.name || userData.displayName || "",
            email: userData.email,
            avatar: userData.avatar || "",
            role: userData.role as "admin" | "worker",
            title: userData.jobTitle || userData.role,
            workerId: userData.workerId,
            dailyKmTarget: userData.dailyKmTarget ?? undefined,
          });
        }
      } catch {
        clearTimeout(timer);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [setUser]);

  return { loading };
}
