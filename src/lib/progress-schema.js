import { branches } from "./branches.js";
const isString = (v, max) => typeof v === "string" && v.length <= max;
export function validProgress(s) {
  if (
    !s ||
    s.version !== 1 ||
    !isString(s.name, 60) ||
    !branches.includes(s.branch) ||
    !Number.isInteger(s.target) ||
    s.target < 2026 ||
    s.target > 2040 ||
    !Number.isInteger(s.dailyMinutes) ||
    s.dailyMinutes < 10 ||
    s.dailyMinutes > 480 ||
    typeof s.onboarded !== "boolean" ||
    !isString(s.cosmetic, 30)
  )
    return false;
  if (
    !["completed", "bookmarks"].every(
      (k) =>
        Array.isArray(s[k]) &&
        s[k].length <= 500 &&
        s[k].every((x) => isString(x, 100)),
    )
  )
    return false;
  const date = (v) => isString(v, 40) && Number.isFinite(Date.parse(v));
  return (
    Array.isArray(s.attempts) &&
    s.attempts.length <= 10000 &&
    s.attempts.every(
      (a) =>
        a &&
        isString(a.questionId, 100) &&
        isString(a.topicId, 100) &&
        Number.isInteger(a.answer) &&
        a.answer >= 0 &&
        a.answer <= 3 &&
        typeof a.correct === "boolean" &&
        date(a.at),
    ) &&
    Array.isArray(s.sessions) &&
    s.sessions.length <= 2000 &&
    s.sessions.every(
      (a) =>
        a &&
        isString(a.id, 100) &&
        Number.isInteger(a.minutes) &&
        a.minutes >= 1 &&
        a.minutes <= 120 &&
        date(a.at),
    ) &&
    Array.isArray(s.notes) &&
    s.notes.length <= 100 &&
    s.notes.every(
      (n) =>
        n &&
        isString(n.id, 100) &&
        isString(n.title, 200) &&
        isString(n.body, 50000) &&
        date(n.at),
    )
  );
}
