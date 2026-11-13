import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GRADES } from "./grades";
import {
  canTransition,
  decideApprovals,
  eligibleGrades,
  missingRequestedScores,
  outcomeToStatus,
  planStudentEnrollment,
  qualifiesForAllFour,
  selectTeachingGrades,
  transitionError,
} from "./hiring";

describe("hiring transitions", () => {
  it("follows the hiring path", () => {
    assert.equal(canTransition("submitted", "interview_scheduled"), true);
    assert.equal(canTransition("interview_scheduled", "interviewed"), true);
    assert.equal(canTransition("interviewed", "assessment_in_progress"), true);
    assert.equal(canTransition("assessment_in_progress", "assessed"), true);
    assert.equal(canTransition("assessed", "approved"), true);
    assert.equal(canTransition("assessed", "rejected"), true);
  });

  it("allows hold or reject after the interview is scheduled or completed", () => {
    assert.equal(outcomeToStatus("advance"), "interviewed");
    assert.equal(outcomeToStatus("hold"), "on_hold");
    assert.equal(outcomeToStatus("reject"), "rejected");
    assert.equal(canTransition("interview_scheduled", "on_hold"), true);
    assert.equal(canTransition("interview_scheduled", "rejected"), true);
    assert.equal(canTransition("interviewed", "on_hold"), true);
    assert.equal(canTransition("interviewed", "rejected"), true);
    assert.equal(canTransition("on_hold", "interview_scheduled"), true);
    assert.equal(canTransition("on_hold", "rejected"), true);
  });

  it("refuses skips and changes after a final decision", () => {
    assert.match(transitionError("submitted", "approved") ?? "", /Cannot move/);
    assert.equal(canTransition("approved", "rejected"), false);
    assert.equal(canTransition("rejected", "approved"), false);
    assert.equal(canTransition("submitted", "interviewed"), false);
    assert.equal(canTransition("assessed", "assessment_in_progress"), false);
  });
});

describe("grade eligibility", () => {
  it("treats 70 as eligible and 69 as not", () => {
    assert.deepEqual(eligibleGrades({ 9: 70, 10: 69, 11: 100, 12: 0 }), [9, 11]);
  });

  it("requires every grade at 70 and at least three at 85 for all four", () => {
    assert.equal(qualifiesForAllFour({ 9: 70, 10: 85, 11: 85, 12: 85 }), true);
    assert.equal(qualifiesForAllFour({ 9: 70, 10: 70, 11: 85, 12: 85 }), false);
    assert.equal(qualifiesForAllFour({ 9: 69, 10: 90, 11: 90, 12: 90 }), false);
    assert.equal(qualifiesForAllFour({ 9: 90, 10: 90, 11: 90 }), false);
  });

  it("approves the eligible set only after admin confirmation", () => {
    const refused = decideApprovals({ scores: { 9: 80, 10: 75 }, confirmEligible: false, confirmAllFour: false });
    assert.equal(refused.ok, false);

    const confirmed = decideApprovals({ scores: { 9: 80, 10: 75, 11: 40 }, confirmEligible: true, confirmAllFour: false });
    assert.equal(confirmed.ok, true);
    if (confirmed.ok) {
      assert.deepEqual(confirmed.decision.grades, [9, 10]);
      assert.equal(confirmed.decision.allFour, false);
      assert.equal(confirmed.decision.source, "rule");
    }
  });

  it("grants all four only when the strong rule passes and an admin confirms", () => {
    const weak = decideApprovals({
      scores: { 9: 70, 10: 70, 11: 90, 12: 90 },
      confirmEligible: true,
      confirmAllFour: true,
    });
    assert.equal(weak.ok, false);

    const strong = decideApprovals({
      scores: { 9: 92, 10: 88, 11: 86, 12: 74 },
      confirmEligible: false,
      confirmAllFour: true,
    });
    assert.equal(strong.ok, true);
    if (strong.ok) {
      assert.deepEqual(strong.decision.grades, [...GRADES]);
      assert.equal(strong.decision.allFour, true);
    }
  });

  it("lets an admin override only with a written reason", () => {
    const missing = decideApprovals({
      scores: { 9: 50 },
      confirmEligible: false,
      confirmAllFour: false,
      overrideGrades: [9, 12],
      overrideReason: "   ",
    });
    assert.equal(missing.ok, false);

    const override = decideApprovals({
      scores: { 9: 50, 10: 95 },
      confirmEligible: false,
      confirmAllFour: false,
      overrideGrades: [9],
      overrideReason: "Sample lesson was strong enough to teach grade 9.",
    });
    assert.equal(override.ok, true);
    if (override.ok) {
      assert.deepEqual(override.decision.grades, [9]);
      assert.equal(override.decision.source, "override");
      assert.match(override.decision.reason ?? "", /Sample lesson/);
    }
  });

  it("blocks teaching a grade that was not approved", () => {
    const denied = selectTeachingGrades([9, 10], [9, 11]);
    assert.equal(denied.ok, false);
    const allowed = selectTeachingGrades([9, 10, 11, 12], [9, 12]);
    assert.deepEqual(allowed.ok ? allowed.grades : [], [9, 12]);
    assert.equal(selectTeachingGrades([9], []).ok, false);
  });

  it("keeps one active student grade", () => {
    assert.deepEqual(planStudentEnrollment(null, 9), { endGrade: null, startGrade: 9, unchanged: false });
    assert.equal(planStudentEnrollment(9, 9).unchanged, true);
    assert.deepEqual(planStudentEnrollment(9, 10), { endGrade: 9, startGrade: 10, unchanged: false });
  });

  it("requires a score for every requested grade before assessment is complete", () => {
    assert.deepEqual(missingRequestedScores([9, 10], { 9: 80 }), [10]);
    assert.deepEqual(missingRequestedScores([9], { 9: 80 }), []);
    assert.deepEqual(missingRequestedScores([9], { 9: 101 }), [9]);
  });
});
