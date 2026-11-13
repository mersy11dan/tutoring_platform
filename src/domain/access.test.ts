import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorize, safeNext, type Actor } from "./access";

function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "user",
    email: "person@example.com",
    fullName: "Person",
    accountType: "student",
    hiringStatus: null,
    isAdmin: false,
    ...overrides,
  };
}

const student = actor();
const applicant = actor({ accountType: "teacher", hiringStatus: "submitted" });
const teacher = actor({ accountType: "teacher", hiringStatus: "approved" });
const admin = actor({ accountType: "admin", isAdmin: true });
const teacherAdmin = actor({ accountType: "teacher", hiringStatus: "approved", isAdmin: true });

describe("authorization", () => {
  it("keeps public entry points open", () => {
    for (const path of ["/", "/students/sign-in", "/students/sign-up", "/teachers/sign-in", "/teachers/apply"]) {
      assert.equal(authorize(path, null).ok, true);
    }
  });

  it("sends anonymous visitors to the matching sign-in", () => {
    const studentPage = authorize("/students/dashboard", null);
    const teacherPage = authorize("/teachers/sessions/new", null);
    const adminPage = authorize("/admin/settings", null);
    assert.equal(studentPage.ok, false);
    assert.equal(teacherPage.ok, false);
    assert.equal(adminPage.ok, false);
    if (!studentPage.ok) assert.match(studentPage.redirectTo, /^\/students\/sign-in/);
    if (!teacherPage.ok) assert.match(teacherPage.redirectTo, /^\/teachers\/sign-in/);
    if (!adminPage.ok) assert.equal(adminPage.redirectTo, "/teachers/sign-in?next=/admin");
  });

  it("keeps students out of teacher and admin areas", () => {
    assert.equal(authorize("/teachers/dashboard", student).ok, false);
    assert.equal(authorize("/teachers/apply/status", student).ok, false);
    assert.equal(authorize("/admin/applications", student).ok, false);
    assert.equal(authorize("/students/sessions/lesson-1", student).ok, true);
  });

  it("keeps applicants on application status until they are approved", () => {
    assert.equal(authorize("/teachers/apply/status", applicant).ok, true);
    assert.equal(authorize("/teachers/dashboard", applicant).ok, false);
    assert.equal(authorize("/teachers/grades", applicant).ok, false);
    assert.equal(authorize("/teachers/sessions", applicant).ok, false);
    assert.equal(authorize("/teachers/assignments", applicant).ok, false);
    assert.equal(authorize("/admin", applicant).ok, false);
    const held = actor({ accountType: "teacher", hiringStatus: "on_hold" });
    assert.equal(authorize("/teachers/dashboard", held).ok, false);
  });

  it("lets an approved teacher into teaching tools and not admin tools", () => {
    assert.equal(authorize("/teachers/dashboard", teacher).ok, true);
    assert.equal(authorize("/teachers/sessions/new", teacher).ok, true);
    assert.equal(authorize("/admin/teachers", teacher).ok, false);
    assert.equal(authorize("/students/enroll", teacher).ok, false);
  });

  it("lets allowlisted admins into admin and keeps a non-teaching admin out of the teacher dashboard", () => {
    assert.equal(authorize("/admin", admin).ok, true);
    assert.equal(authorize("/admin/assessments/one", admin).ok, true);
    assert.equal(authorize("/teachers/dashboard", admin).ok, false);
    assert.equal(authorize("/admin/sessions", teacherAdmin).ok, true);
    assert.equal(authorize("/teachers/assignments", teacherAdmin).ok, true);
  });

  it("rejects open redirects", () => {
    assert.equal(safeNext("https://evil.example", "/students/dashboard"), "/students/dashboard");
    assert.equal(safeNext("//evil.example", "/students/dashboard"), "/students/dashboard");
    assert.equal(safeNext("/students/enroll", "/students/dashboard"), "/students/enroll");
    assert.equal(safeNext(null, "/admin"), "/admin");
  });
});
