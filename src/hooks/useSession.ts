import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";
import type { Session } from "better-auth/types";

export function useSession() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await auth.api.getSession({});
        // We don't need to store the session data here, just check if we're authenticated
        // The actual user data will be fetched by useAuth hook in components that need it
      } catch (error) {
        // Session check failed, user is not authenticated
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen to auth events for real-time updates
    const unsubscribe = auth.onUpdate((event) => {
      // When session changes, we just need to trigger a re-check
      // The actual user data will be refetched by components using useAuth
      checkSession();
    });

    return () => unsubscribe();
  }, []);

  return { loading };
}