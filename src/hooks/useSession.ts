import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

export function useSession() {
  const [loading, setLoading] = useState(true);
  const setUser = useApp(s => s.setUser);

  useEffect(() => {
    fetch("/api/users/me")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.id) {
          setUser({
            id: data.id,
            name: data.displayName || data.name || "User",
            email: data.email || "",
            avatar: data.avatar || "",
            role: data.role as Role,
            title: data.jobTitle || data.role,
            workerId: data.workerId ?? undefined,
            dailyKmTarget: data.dailyKmTarget ?? undefined,
          });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { loading };
}
