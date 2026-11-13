import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 32).toString("hex") };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
