/**
 * Shared connection-string normalization.
 *
 * Single source of truth for how Envichips builds its PostgreSQL connection
 * string. The app, the seeds and the CLI scripts MUST import from here instead
 * of re-implementing their own logic.
 *
 * Rule:
 *  - Local/private hosts (localhost, 127.0.0.1, 10.x, 172.16-31.x, 192.168.x,
 *    *.local) do NOT get SSL. Local PostgreSQL typically has SSL disabled and
 *    forcing `sslmode=verify-full` silently kills the connection (Prisma P1011).
 *  - Non-local hosts (cloud / Vercel) get `sslmode=require` + `uselibpqcompat=true`.
 */

export function isPrivateHost(hostname: string): boolean {
  // Loopback / local machine
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  // Private IPv4 ranges:
  //   10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  const parts = hostname.split(".");
  if (parts.length === 4) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
  }

  return false;
}

export function normalizeConnectionString(url: string): string {
  try {
    // pg v8 treats sslmode=require as an alias for verify-full.
    // uselibpqcompat=true opts into true libpq-compatible behavior:
    // encryption without CA certificate verification, needed in
    // serverless environments (Vercel) where system CA certs may be absent.
    const u = new URL(url);

    // Only enforce SSL for non-local connections.
    // Local PostgreSQL typically doesn't have SSL enabled,
    // and forcing sslmode=require would silently kill the connection.
    if (!isPrivateHost(u.hostname)) {
      u.searchParams.set("sslmode", "require");
      u.searchParams.set("uselibpqcompat", "true");
    } else {
      // Explicitly opt local connections out of SSL, overriding any
      // sslmode that may have been present in the raw URL.
      u.searchParams.delete("sslmode");
      u.searchParams.delete("uselibpqcompat");
    }

    return u.toString();
  } catch {
    // Malformed URL — append params as fallback
    const priv = isHostPrivateFromUrl(url);
    const sep = url.includes("?") ? "&" : "?";
    if (priv) return url;
    return `${url}${sep}sslmode=require&uselibpqcompat=true`;
  }
}

function isHostPrivateFromUrl(url: string): boolean {
  try {
    return isPrivateHost(new URL(url).hostname);
  } catch {
    return false;
  }
}