// Corrected TypeScript assignments for Date objects
// Using ISO string for type compatibility
import { eq } from 'drizzle-orm';

function addInvitation() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);

  const invitationRecord = {
    createdAt: new Date().toISOString(),
    expiresAt: expirationDate.toISOString()
  };

  return invitationRecord;
}