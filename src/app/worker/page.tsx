import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WorkerDashboard } from "@/components/worker/WorkerDashboard";

export default async function WorkerPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");
  return <WorkerDashboard user={session.user} />;
}
