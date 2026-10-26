/**
 * Session cookie name.
 *
 * Kept in its own module (without `server-only`) so `src/proxy.ts` — which Next
 * runs as a separate entry point, before your app code — can share the name
 * without pulling in `next/headers` or any database code.
 */
export const SESSION_COOKIE = "fitx_session";
