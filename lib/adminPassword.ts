import { createHash, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

let warnedPlaintext = false;

/**
 * Checks a login attempt against the configured admin credential.
 *
 * Preferred: ADMIN_PASSWORD_HASH, a bcrypt hash (generate with
 * `npm run admin:hash`). Fallback: plaintext ADMIN_PASSWORD, compared in
 * constant time; kept for one release so existing deployments keep working.
 */
export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    return bcrypt.compare(candidate, hash);
  }

  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;

  if (!warnedPlaintext && process.env.NODE_ENV === "production") {
    warnedPlaintext = true;
    console.warn(
      "ADMIN_PASSWORD is deprecated; set ADMIN_PASSWORD_HASH (npm run admin:hash)",
    );
  }

  // Hash both sides so the comparison is constant time and length-blind.
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(plain).digest();
  return timingSafeEqual(a, b);
}
