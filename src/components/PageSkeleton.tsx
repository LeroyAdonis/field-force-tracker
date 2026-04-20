import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  variant?: "dashboard" | "list" | "form";
  className?: string;
}

/**
 * Page-level loading skeleton that renders a realistic placeholder layout.
 * Supports three variants: dashboard (cards + table), list (rows), form (fields).
 */
export function PageSkeleton({ variant = "dashboard", className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      {variant === "dashboard" && <DashboardSkeleton />}
      {variant === "list" && <ListSkeleton />}
      {variant === "form" && <FormSkeleton />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* KPI card skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border">
        <div className="border-b p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-xl border">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-xl border p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Hook that simulates a minimum loading time.
 * Starts as `true` and auto-sets to `false` after `minLoadMs` milliseconds.
 * Can also be manually controlled via `setIsLoading`.
 */
export function useLoadingState(minLoadMs = 500) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadMs);

    return () => {
      clearTimeout(timer);
    };
  }, [minLoadMs]);

  return { isLoading, setIsLoading };
}
