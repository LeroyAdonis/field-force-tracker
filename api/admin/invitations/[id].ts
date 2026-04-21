// Corrected TypeScript assignments for Date objects
// Using ISO string for type compatibility
import { eq } from 'drizzle-orm';

async function handler(req, res) {
  const usedDate = new Date();
  await db
    .update(invitation)
    .set({ usedAt: usedDate.toISOString() })
    .where(eq(invitation.id, id));

  const userRoleRecord = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const finalResponse = {
    usedAt: usedDate.toISOString(),
    message: 'Invitation accepted'
  };

  return finalResponse;
}
