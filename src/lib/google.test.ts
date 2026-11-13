import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GOOGLE_NOT_CONNECTED,
  buildGoogleAuthUrl,
  createClassroomAdapter,
  createMeetAdapter,
  exchangeGoogleCode,
  googleConnection,
} from "./google";

const missing = {};
const clientOnly = { clientId: "id", clientSecret: "secret", redirectUri: "http://localhost:3000/admin/google/callback" };
const connected = { ...clientOnly, refreshToken: "refresh" };

function jsonResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), { status: ok ? 200 : 400, headers: { "content-type": "application/json" } });
}

describe("Google adapters", () => {
  it("stays disconnected until a client, secret, redirect, and refresh token exist", () => {
    assert.equal(googleConnection(missing).message, GOOGLE_NOT_CONNECTED);
    assert.equal(googleConnection(clientOnly).connected, false);
    assert.equal(googleConnection(clientOnly).message, GOOGLE_NOT_CONNECTED);
    assert.equal(googleConnection(connected).connected, true);
  });

  it("does not put the client secret on the consent URL", () => {
    assert.equal(buildGoogleAuthUrl(missing, "state"), null);
    const url = new URL(buildGoogleAuthUrl(clientOnly, "state-1")!);
    assert.equal(url.searchParams.get("client_id"), "id");
    assert.equal(url.searchParams.get("state"), "state-1");
    assert.equal(url.searchParams.has("client_secret"), false);
    assert.match(url.searchParams.get("scope") ?? "", /calendar\.events/);
    assert.match(url.searchParams.get("scope") ?? "", /classroom\.coursework/);
  });

  it("returns the not-connected message instead of calling Google", async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      return jsonResponse({});
    };
    const meet = await createMeetAdapter(clientOnly, fetchImpl).createMeetLink({
      title: "Lesson",
      startsAt: "2026-11-16T15:00:00.000Z",
      endsAt: "2026-11-16T16:00:00.000Z",
    });
    assert.deepEqual(meet, { ok: false, message: GOOGLE_NOT_CONNECTED });
    const course = await createClassroomAdapter(missing, fetchImpl).createCourse("Grade 9");
    assert.equal(course.ok, false);
    assert.equal(called, false);
  });

  it("creates a Meet link from a mocked Calendar response", async () => {
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com/token")) return jsonResponse({ access_token: "token" });
      assert.match(url, /calendar\/v3\/calendars\/primary\/events/);
      assert.match(init?.body?.toString() ?? "", /hangoutsMeet/);
      return jsonResponse({ hangoutLink: "https://meet.google.com/abc-defg-hij" });
    };
    const meet = await createMeetAdapter(connected, fetchImpl).createMeetLink({
      title: "Grade 9",
      startsAt: "2026-11-16T15:00:00.000Z",
      endsAt: "2026-11-16T16:00:00.000Z",
    });
    assert.deepEqual(meet, { ok: true, link: "https://meet.google.com/abc-defg-hij" });
  });

  it("creates local-ready Classroom ids from mocked responses", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("oauth2.googleapis.com/token")) return jsonResponse({ access_token: "token" });
      if (url.endsWith("/courses")) return jsonResponse({ id: "course-9" });
      assert.match(url, /courses\/course-9\/courseWork/);
      return jsonResponse({ id: "work-1" });
    };
    const adapter = createClassroomAdapter(connected, fetchImpl);
    const course = await adapter.createCourse("Grade 9 mathematics");
    assert.equal(course.ok && course.value.courseId, "course-9");
    const work = await adapter.createCourseWork({
      courseId: "course-9",
      title: "Practice set",
      description: "Complete questions 1 to 8.",
      dueAt: "2026-11-20T12:00:00.000Z",
    });
    assert.equal(work.ok && work.value.courseworkId, "work-1");
  });

  it("exchanges an auth code only when the client is configured", async () => {
    const missingResult = await exchangeGoogleCode(missing, "code", async () => jsonResponse({}));
    assert.equal(missingResult.ok, false);
    if (!missingResult.ok) assert.equal(missingResult.message, GOOGLE_NOT_CONNECTED);
    const ok = await exchangeGoogleCode(clientOnly, "code", async () => jsonResponse({ refresh_token: "new-refresh" }));
    assert.deepEqual(ok, { ok: true, refreshToken: "new-refresh" });
  });
});
