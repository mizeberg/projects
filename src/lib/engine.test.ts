import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyProgress,
  xpFor,
  masteryFor,
  streakFor,
  localTutor,
} from "./engine.ts";
import { getTopics, getTopic, branches } from "./curriculum.ts";
test("every branch receives relevant authored content and no unrelated circuits", () => {
  for (const b of branches) assert.ok(getTopics(b).length >= 2);
  assert.ok(!getTopics("Civil").some((t) => t.id === "boolean"));
  assert.ok(!getTopics("Mechanical").some((t) => t.id === "circuits"));
});
test("XP only rewards unique correct questions; misses and repeat answers add no XP", () => {
  const s = emptyProgress();
  const a = {
    questionId: "b1",
    topicId: "boolean",
    answer: 0,
    correct: true,
    at: new Date().toISOString(),
  };
  s.attempts = [a, { ...a }, { ...a, questionId: "b2", correct: false }];
  assert.equal(xpFor(s), 20);
  assert.equal(masteryFor(s, "boolean"), 20);
  s.completed = ["boolean"];
  assert.equal(xpFor(s), 170);
  assert.equal(masteryFor(s, "boolean"), 60);
});
test("new learners have no fabricated streak, XP or mastery", () => {
  const s = emptyProgress();
  assert.equal(streakFor(s), 0);
  assert.equal(xpFor(s), 0);
  assert.equal(masteryFor(s, "boolean"), 0);
});
test("local tutor attributes actual lesson content and declines unsupported requests", async () => {
  const topic = getTopic("boolean");
  const explanation = await localTutor.answer(
    "Explain this simply",
    topic,
    "Explain",
  );
  assert.ok(explanation.text.includes(topic.concept));
  assert.match(explanation.source, /starter lesson/);
  const unsupported = await localTutor.answer(
    "Analyze my photograph",
    topic,
    "Explain",
  );
  assert.match(unsupported.text, /need a connected AI provider/);
});
