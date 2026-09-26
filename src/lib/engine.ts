import { getTopic, type Branch, type Topic } from "./curriculum.ts";
export type Attempt = {
  questionId: string;
  topicId: string;
  answer: number;
  correct: boolean;
  at: string;
};
export type StudySession = { id: string; minutes: number; at: string };
export type ProgressState = {
  version: 1;
  name: string;
  branch: Branch;
  target: number;
  dailyMinutes: number;
  onboarded: boolean;
  completed: string[];
  attempts: Attempt[];
  sessions: StudySession[];
  bookmarks: string[];
  notes: { id: string; title: string; body: string; at: string }[];
  cosmetic: string;
};
export const emptyProgress = (): ProgressState => ({
  version: 1,
  name: "Explorer",
  branch: "ECE",
  target: 2027,
  dailyMinutes: 60,
  onboarded: false,
  completed: [],
  attempts: [],
  sessions: [],
  bookmarks: [],
  notes: [],
  cosmetic: "classic",
});
export function xpFor(s: ProgressState) {
  return (
    s.completed.length * 150 +
    new Set(s.attempts.filter((a) => a.correct).map((a) => a.questionId)).size *
      20 +
    s.sessions.length * 100
  );
}
export function accuracyFor(s: ProgressState) {
  return s.attempts.length
    ? Math.round(
        (s.attempts.filter((a) => a.correct).length / s.attempts.length) * 100,
      )
    : 0;
}
export function masteryFor(s: ProgressState, id: string) {
  const t = getTopic(id);
  return Math.min(
    100,
    (s.completed.includes(id) ? 40 : 0) +
      Math.round(
        (new Set(
          s.attempts
            .filter((a) => a.topicId === id && a.correct)
            .map((a) => a.questionId),
        ).size /
          t.questions.length) *
          60,
      ),
  );
}
export function streakFor(s: ProgressState) {
  const days = new Set(
    [...s.attempts, ...s.sessions].map((a) => new Date(a.at).toDateString()),
  );
  let count = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
export type PetEvent =
  | "QUESTION_ASKED"
  | "QUESTION_CORRECT"
  | "QUESTION_WRONG"
  | "CONCEPT_MASTERED"
  | "STUDY_STARTED"
  | "STUDY_COMPLETED"
  | "BADGE_UNLOCKED"
  | "LEVEL_UP"
  | "MATERIAL_UPLOADED"
  | "AI_ANSWER_COMPLETED"
  | "REVISION_DUE";
export const reactions: Record<PetEvent, { mood: string; lines: string[] }> = {
  QUESTION_ASKED: {
    mood: "thinking",
    lines: [
      "Let’s untangle this together.",
      "A good question is a great beginning.",
    ],
  },
  QUESTION_CORRECT: {
    mood: "happy",
    lines: [
      "You’ve got it! Another connection made.",
      "That’s the idea. Nicely reasoned!",
    ],
  },
  QUESTION_WRONG: {
    mood: "curious",
    lines: [
      "Let’s understand this, one step at a time.",
      "This is a useful clue about what to practice.",
    ],
  },
  CONCEPT_MASTERED: {
    mood: "celebrating",
    lines: ["Your world just grew a little brighter!"],
  },
  STUDY_STARTED: {
    mood: "studying",
    lines: ["One concept at a time. I’m with you."],
  },
  STUDY_COMPLETED: {
    mood: "celebrating",
    lines: ["A little effort, a little stronger. Well done!"],
  },
  BADGE_UNLOCKED: {
    mood: "celebrating",
    lines: ["A milestone worth remembering!"],
  },
  LEVEL_UP: { mood: "celebrating", lines: ["A new level of possibility!"] },
  MATERIAL_UPLOADED: {
    mood: "curious",
    lines: ["A new addition to your knowledge collection."],
  },
  AI_ANSWER_COMPLETED: {
    mood: "happy",
    lines: ["Want to try putting that into practice?"],
  },
  REVISION_DUE: {
    mood: "curious",
    lines: ["A quick review can make this click."],
  },
};
export interface TutorService {
  answer(
    prompt: string,
    topic: Topic,
    mode: string,
  ): Promise<{ text: string; source: string }>;
}
export const localTutor: TutorService = {
  async answer(prompt, topic, mode) {
    await new Promise((r) => setTimeout(r, 650));
    const p = prompt.toLowerCase();
    let text: string;
    if (mode === "Teach me" || p.includes("quiz"))
      text = `Let’s think about ${topic.subject.toLowerCase()} together.\n\n${topic.questions[0].prompt}\n\nWhat would your first step be? You can test your answer in the quest’s practice section.`;
    else if (p.includes("example") || p.includes("steps"))
      text = `Let’s work through an example.\n\n${topic.example}\n\nKey relationship\n${topic.formula}`;
    else if (
      p.includes("explain") ||
      p.includes("simpl") ||
      p.includes("concept") ||
      p.includes(topic.subject.toLowerCase()) ||
      p.includes("formula")
    )
      text = `${topic.concept}\n\nRemember\n${topic.formula}\n\n${topic.example}`;
    else
      text = `I can help you explore the reviewed lesson on ${topic.subject}. Try “Explain this simply”, “Show an example”, or “Quiz me”.\n\nThis workspace uses a local lesson guide. Open-ended AI, image solving, and document analysis need a connected AI provider, so I won’t invent an answer.`;
    return { text, source: `GATENOVA starter lesson · ${topic.subject}` };
  },
};
