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
  const [loading, setLoading] = useState(false);
  
  return { loading };
}
