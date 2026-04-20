import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  workerName: string;
  description: string;
  time: string;
  read: boolean;
}

/**
 * Notification bell popover showing at-risk worker alerts.
 * Displays a red badge when there are flagged workers,
 * and allows marking individual alerts as read.
 */
export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const { workers, visits, dailyVisitsTarget, user } = useApp();

  // Compute at-risk workers (those with low KPI completion today)
  const notifications = useMemo<NotificationItem[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const result: NotificationItem[] = [];

    for (const worker of workers) {
      if (!worker.active) continue;
      const todayVisits = visits.filter(
        (v) => v.workerId === worker.id && v.date === today
      );
      const visitCount = todayVisits.length;
      const completionPct = dailyVisitsTarget > 0
        ? Math.round((visitCount / dailyVisitsTarget) * 100)
        : 0;

      if (completionPct < 50) {
        result.push({
          id: worker.id,
          workerName: worker.name,
          description: `Only ${visitCount}/${dailyVisitsTarget} visits completed (${completionPct}%)`,
          time: "Today",
          read: readIds.has(worker.id),
        });
      }
    }

    return result;
  }, [workers, visits, dailyVisitsTarget, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const isAdmin = user?.role === "admin";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No alerts at this time
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                  !notification.read && "bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    !notification.read ? "bg-destructive" : "bg-muted-foreground/30"
                  )}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{notification.workerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{notification.time}</p>
                </div>
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="shrink-0 text-xs text-accent hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="border-t px-4 py-2">
            <a
              href="/admin/at-risk"
              className="text-xs font-medium text-accent hover:underline"
            >
              View All →
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
