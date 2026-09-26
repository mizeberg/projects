import { Sparkles, Clock, Zap, ArrowRight, Check } from "lucide-react";
import { Nova } from "./Art";
import { Button, Modal, Progress } from "./UI";
import type { Topic } from "../lib/curriculum";
import type { ProgressState } from "../lib/engine";

type QuestDialogProps = {
  topic: Topic;
  state: ProgressState;
  questDone: boolean;
  questStep: number;
  answer: number | null;
  revealed: boolean;
  closeModal: () => void;
  navigate: (view: string) => void;
  startQuest: (topic: Topic) => void;
  askNova: (topic: Topic) => void;
  setQuestStep: (step: number) => void;
  setAnswer: (answer: number | null) => void;
  nextQuestion: () => void;
  submitAnswer: () => void;
};
export function QuestDialog({
  topic,
  state,
  questDone,
  questStep,
  answer,
  revealed,
  closeModal,
  navigate,
  startQuest,
  askNova,
  setQuestStep,
  setAnswer,
  nextQuestion,
  submitAnswer,
}: QuestDialogProps) {
  return (
    <Modal
      title={questDone ? "A little stronger than before." : topic.title}
      onClose={closeModal}
      wide
    >
      <div className="quest-modal-meta">
        <span className="pill">{topic.subject}</span>
        <span>
          <Clock size={14} />
          {topic.minutes} min <Zap size={14} />+{topic.xp} XP
        </span>
      </div>
      <Progress
        value={
          questDone ? 100 : (questStep / (topic.questions.length + 1)) * 100
        }
      />
      {questDone ? (
        <div className="quest-result">
          <Nova size={165} mood="celebrating" />
          <span className="eyebrow">
            {state.completed.includes(topic.id)
              ? "QUEST COMPLETED"
              : "PRACTICE COMPLETED"}
          </span>
          <h2>
            {state.completed.includes(topic.id)
              ? "Your world just got a little bigger."
              : "You’ve found your next connections."}
          </h2>
          <p>
            {state.completed.includes(topic.id)
              ? `You’ve completed ${topic.title}. Your progress is saved, and your Knowledge Garden has grown.`
              : "Review the explanations and try again. Complete every question correctly to finish this quest and grow your garden."}
          </p>
          <div className="result-actions">
            <Button
              onClick={() => {
                closeModal();
                navigate(
                  state.completed.includes(topic.id) ? "garden" : "mistakes",
                );
              }}
            >
              {state.completed.includes(topic.id)
                ? "Visit your garden"
                : "Review my mistakes"}
              <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" onClick={() => startQuest(topic)}>
              Practice again
            </Button>
          </div>
        </div>
      ) : questStep === 0 ? (
        <div className="lesson-content">
          <span className="eyebrow">01 · DISCOVER THE CONCEPT</span>
          <h2>{topic.description}</h2>
          <p>{topic.concept}</p>
          <div className="formula-highlight">
            <span>THE KEY IDEA</span>
            <strong>{topic.formula}</strong>
          </div>
          <h3>Let’s make it click</h3>
          <p>{topic.example}</p>
          <div className="lesson-footer">
            <button className="text-link" onClick={() => askNova(topic)}>
              <Sparkles size={16} />
              Explain with Nova
            </button>
            <Button
              onClick={() => {
                setQuestStep(1);
                setAnswer(null);
              }}
            >
              Let’s practice <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="question-content">
          <span className="eyebrow">
            QUESTION {questStep} OF {topic.questions.length} · ORIGINAL PRACTICE
          </span>
          <h2>{topic.questions[questStep - 1].prompt}</h2>
          <div className="answer-options">
            {topic.questions[questStep - 1].options.map((o, i) => (
              <button
                key={o}
                disabled={revealed}
                className={`${answer === i ? "chosen" : ""} ${revealed && i === topic.questions[questStep - 1].correct ? "correct" : ""}`}
                onClick={() => setAnswer(i)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {o}
                {revealed && i === topic.questions[questStep - 1].correct && (
                  <Check size={19} />
                )}
              </button>
            ))}
          </div>
          {revealed && (
            <div className="answer-explanation">
              <b>
                {answer === topic.questions[questStep - 1].correct
                  ? "That’s the connection!"
                  : "Let’s understand this."}
              </b>
              <p>{topic.questions[questStep - 1].explanation}</p>
            </div>
          )}
          <div className="lesson-footer">
            <span className="muted-text">
              Take your time. Think it through.
            </span>
            {revealed ? (
              <Button onClick={nextQuestion}>
                {questStep === topic.questions.length
                  ? "Finish practice"
                  : "Next question"}
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button disabled={answer === null} onClick={submitAnswer}>
                Check answer <Check size={16} />
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
