/**
 * Guest Session Management
 *
 * For MVP testing without auth. Stores a guest UUID in localStorage.
 * Later, when auth is added, we can migrate guest data by replacing
 * guest_id with auth.uid().
 */

const GUEST_ID_KEY = 'life_review_guest_id';

/**
 * Get or create a guest user ID
 */
export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return guestId;
}

/**
 * Clear guest session (useful for testing)
 */
export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_ID_KEY);
}

/**
 * Get current guest ID without creating a new one
 */
export function getGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY);
}

/**
 * Check if user has an existing guest session
 */
export function hasGuestSession(): boolean {
  return !!localStorage.getItem(GUEST_ID_KEY);
}

/**
 * Migration helper: when auth is added, call this to migrate guest data
 * @param authUserId - The authenticated user's ID from Supabase Auth
 * @param guestId - The guest ID to migrate from
 */
export async function migrateGuestDataToAuth(authUserId: string, guestId: string) {
  // This will be implemented when we add auth
  // Will update all tables to replace guest_id with auth user_id
  console.log('TODO: Migrate guest data', { authUserId, guestId });
  // Example:
  // await supabase.from('sessions').update({ user_id: authUserId }).eq('user_id', guestId);
  // await supabase.from('answers').update({ user_id: authUserId }).eq('user_id', guestId);
  // etc.
}
