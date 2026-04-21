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
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const userData: SessionUser = await response.json();
          // Convert API response to SessionUser format
          setUser({
            id: userData.id,
            name: userData.name || userData.displayName || "",
            email: userData.email,
            avatar: userData.avatar || "",
            role: userData.role as "admin" | "worker",
            title: userData.jobTitle || userData.role,
          });
        }
      } catch (error) {
        // Session not available, user stays null
        console.debug("Session restoration failed:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [setUser]);

  return { loading };
}
