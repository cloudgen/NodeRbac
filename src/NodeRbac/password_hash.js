// =============================================================================
// Password hashes for NodeRbac accounts.
// requirement-rbac — stored passwords are PBKDF2, never plaintext.
// requirement-nodejs-oop — class PasswordHash.
// =============================================================================
import crypto from "node:crypto";

export class PasswordHash {
  // PBKDF2-HMAC-SHA256 passwords.
  // A stored value that is not this scheme never matches.

  static ITERATIONS = 260000;
  static PREFIX = "pbkdf2_sha256";

  constructor(logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "PasswordHash" });
    }
  }

  hash(password) {
    // A new stored password. Each call uses a new salt.
    const salt = crypto.randomBytes(16);
    const digest = crypto.pbkdf2Sync(
      Buffer.from(String(password), "utf8"),
      salt,
      this.constructor.ITERATIONS,
      32,
      "sha256",
    );
    return [
      this.constructor.PREFIX,
      String(this.constructor.ITERATIONS),
      salt.toString("base64"),
      digest.toString("base64"),
    ].join("$");
  }

  verify(password, stored) {
    // True when password matches one stored value from hash().
    try {
      const parts = String(stored).split("$");
      if (parts.length !== 4) return false;
      const [prefix, rounds, saltB64, digestB64] = parts;
      if (prefix !== this.constructor.PREFIX) return false;
      const salt = Buffer.from(saltB64, "base64");
      const expected = Buffer.from(digestB64, "base64");
      const got = crypto.pbkdf2Sync(
        Buffer.from(String(password), "utf8"),
        salt,
        Number(rounds),
        expected.length,
        "sha256",
      );
      return crypto.timingSafeEqual(got, expected);
    } catch {
      return false;
    }
  }
}
