import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/auth";
import type { Session } from "better-auth/types";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  displayName: string | null;
  avatar: string | null;
  active: boolean;
  userId: string;
  userRoleId: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const session = await auth.api.getSession({});
        if (session?.user) {
          // Fetch user role data to get complete user info
          const userRoleData = await auth.api.getUserRole({
            userId: session.user.id,
          });
          
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.name,
            image: session.user.image,
            role: userRoleData?.role || "user",
            displayName: userRoleData?.displayName,
            avatar: userRoleData?.avatar,
            active: userRoleData?.active ?? true,
            userId: session.user.id,
            userRoleId: userRoleData?.id || "",
          };
          
          setUser(authUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen to auth events
    const unsubscribe = auth.onUpdate((event) => {
      if (event.session) {
        // User logged in or session updated
        checkSession();
      } else {
        // User logged out
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const result = await auth.api.signInWithCredentials({
        credentials: {
          email: credentials.email,
          password: credentials.password,
        },
      });
      
      if (result.success && result.session) {
        // Refresh user data
        const session = await auth.api.getSession({});
        if (session?.user) {
          const userRoleData = await auth.api.getUserRole({
            userId: session.user.id,
          });
          
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.name,
            image: session.user.image,
            role: userRoleData?.role || "user",
            displayName: userRoleData?.displayName,
            avatar: userRoleData?.avatar,
            active: userRoleData?.active ?? true,
            userId: session.user.id,
            userRoleId: userRoleData?.id || "",
          };
          
          setUser(authUser);
          setIsAuthenticated(true);
        }
      }
      
      return result;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.api.signOut({});
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}