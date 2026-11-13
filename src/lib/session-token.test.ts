import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openSession, sealSession, type SessionClaims } from "./session-token";

const claims: SessionClaims = {
  sub: "user-1",
  email: "student@example.com",
  fullName: "Demo Student",
  accountType: "student",
  hiringStatus: null,
  exp: Date.now() + 60_000,
};

describe("session token", () => {
  it("round-trips a signed session and rejects tampering", async () => {
    const token = await sealSession(claims, "test-secret");
    const opened = await openSession(token, "test-secret");
    assert.equal(opened?.email, claims.email);
    assert.equal(await openSession(token, "other-secret"), null);
    const [payload, signature] = token.split(".");
    assert.equal(await openSession(`${payload}.${signature?.slice(0, -1)}x`, "test-secret"), null);
    assert.equal(await openSession("not-a-token", "test-secret"), null);
  });

  it("rejects an expired session", async () => {
    const token = await sealSession({ ...claims, exp: Date.now() - 1_000 }, "test-secret");
    assert.equal(await openSession(token, "test-secret"), null);
  });
});
