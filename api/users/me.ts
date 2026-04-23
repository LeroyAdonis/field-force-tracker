import { fromNodeHeaders } from "better-auth/node";
import { db, userRole, worker } from "../../src/lib/db/index.js";
import { auth } from "../../src/lib/auth.js";
import { eq } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const send = (status: number, body: unknown) => {
    const json = JSON.stringify(body);
    res.statusCode = status;
    res.setHeader("content-type", "application/json");
    res.end(json);
  };

  if (req.method !== "GET") {
    return send(405, { error: "Method not allowed" });
  }

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return send(401, { error: "Unauthorized" });
    }

    const userWithWorker = await db.query.userRole.findFirst({
      where: eq(userRole.userId, session.user.id),
      with: {
        user: true,
        workers: true,
      },
    });

    if (!userWithWorker) {
      return send(404, { error: "User profile not found" });
    }

    const workerRecord = userWithWorker.workers?.[0];

    const response = {
      id: userWithWorker.user?.id ?? null,
      email: userWithWorker.user?.email ?? null,
      name: userWithWorker.user?.name ?? null,
      avatar: userWithWorker.avatar,
      role: userWithWorker.role,
      displayName: userWithWorker.displayName ?? null,
      active: userWithWorker.active,
      ...(workerRecord && {
        workerId: workerRecord.id ?? null,
        jobTitle: workerRecord.jobTitle ?? null,
        dailyKmTarget: workerRecord.dailyKmTarget ?? null,
        isDemo: workerRecord.isDemo ?? null,
      }),
    };

    return send(200, response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Unauthorized" || message === "User role not found") {
      return send(401, { error: "Unauthorized" });
    }

    return send(500, { error: message });
  }
}
