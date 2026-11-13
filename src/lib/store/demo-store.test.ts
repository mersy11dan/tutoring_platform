import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { DEMO_PASSWORD } from "./seed";
import { DemoStore } from "./demo-store";

function store() {
  const dir = mkdtempSync(path.join(tmpdir(), "studio-"));
  return DemoStore.open(path.join(dir, "store.json"));
}

describe("demo store", () => {
  it("seeds a grade 9 student, an approved teacher, and grade-scoped lessons", async () => {
    const demo = store();
    const student = await demo.authenticate("student@example.com", DEMO_PASSWORD);
    assert.ok(student);
    assert.equal((await demo.getActiveEnrollment(student.id))?.grade, 9);
    assert.equal((await demo.listSessions({ grade: 9 })).length, 1);
    assert.equal((await demo.listSessions({ grade: 10 })).length, 0);
    assert.equal((await demo.listAssignments(10)).length, 0);
    const teacher = await demo.authenticate("teacher@example.com", DEMO_PASSWORD);
    assert.equal((await demo.getApplicationByUserId(teacher!.id))?.hiringStatus, "approved");
  });

  it("keeps one active grade when a student switches", async () => {
    const demo = store();
    const student = await demo.authenticate("student@example.com", DEMO_PASSWORD);
    await demo.enrollStudent(student!.id, 11);
    const active = (await demo.listEnrollments()).filter((item) => item.studentId === student!.id && item.active);
    assert.equal(active.length, 1);
    assert.equal(active[0]?.grade, 11);
  });

  it("refuses a teaching grade that was not approved", async () => {
    const demo = store();
    const teacher = await demo.authenticate("teacher@example.com", DEMO_PASSWORD);
    await assert.rejects(() => demo.setOptIn(teacher!.id, [9, 11]), /Not approved/);
    const opted = await demo.setOptIn(teacher!.id, [9, 10]);
    assert.deepEqual(opted.filter((item) => item.optedIn).map((item) => item.grade), [9, 10]);
  });
});
