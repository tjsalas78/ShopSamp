/**
 * Resolves the current user id for API routes and server components.
 *
 * Auth is currently bypassed for testing (per CLAUDE.md), so today this
 * always returns the hardcoded test user. When auth is re-enabled, this
 * is the SINGLE place to swap in `getServerSession(authOptions)` —
 * touching one file instead of grepping for DEFAULT_USER_ID across the
 * codebase.
 *
 * Designed to be `await`-able from day one so the eventual switch to
 * NextAuth's async session lookup is a no-op for callers.
 */

const DEFAULT_USER_ID = "cmndgrf3o0000jp043z65a4wz";

/**
 * Returns the current user id, or throws if no user is authenticated.
 * Use this in routes that absolutely require a user.
 */
export async function getCurrentUserId(): Promise<string> {
  // TODO(auth): replace with `getServerSession(authOptions)?.user.id` when
  // we re-enable middleware. Until then, every route resolves to the same
  // test user — but at least it's centralized.
  return DEFAULT_USER_ID;
}

/**
 * Returns the current user id, or null if no user is authenticated.
 * Use this in routes that have an unauthenticated fallback path.
 */
export async function getCurrentUserIdOrNull(): Promise<string | null> {
  return DEFAULT_USER_ID;
}
