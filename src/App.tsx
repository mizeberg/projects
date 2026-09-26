import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import {
  Home,
  Sun,
  Map,
  Route,
  Target,
  BookOpen,
  Leaf,
  Trophy,
  ChartNoAxesCombined,
  Settings,
  Sparkles,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Flame,
  Zap,
  Clock,
  Check,
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  Volume2,
  VolumeX,
  LogOut,
  Lock,
  User,
  GraduationCap,
  CalendarDays,
  CheckCheck,
  Bookmark,
  Upload,
  FileText,
  Send,
  Network,
  Layers,
  BrainCircuit,
  Timer,
  ShieldCheck,
  Flag,
  Menu,
  WifiOff,
  BookMarked,
  Compass,
  Activity,
  TrendingUp,
} from "lucide-react";
import { QuestDialog } from "./components/QuestDialog";
import { Nova, WorldArt, GardenArt } from "./components/Art";
import {
  Button,
  Panel,
  Progress,
  SectionTitle,
  Modal,
  Empty,
} from "./components/UI";
import { branches, getTopics, getTopic, type Topic } from "./lib/curriculum";
import {
  xpFor,
  accuracyFor,
  masteryFor,
  streakFor,
  reactions,
  localTutor,
  type PetEvent,
} from "./lib/engine";
import { isNativeApp, exportTextNote } from "./lib/platform";
import { useProgress } from "./lib/store";
import { branchLabel, type Branch } from "./lib/branches.js";
const SyllabusLibrary = lazy(() => import("./components/SyllabusLibrary"));
const navItems = [
  { id: "home", name: "Overview", icon: Home },
  { id: "today", name: "Today’s quests", icon: Sun },
  { id: "world", name: "Nova World", icon: Map },
  { id: "roadmap", name: "My roadmap", icon: Route },
];
const learningItems = [
  { id: "syllabus", name: "Syllabus & library", icon: BookMarked },
  { id: "practice", name: "Practice arena", icon: Target },
  { id: "materials", name: "My materials", icon: BookOpen },
  { id: "garden", name: "Knowledge Garden", icon: Leaf },
  { id: "achievements", name: "Achievements", icon: Trophy },
  { id: "analytics", name: "Analytics", icon: ChartNoAxesCombined },
];
const allViews = [
  ...navItems,
  ...learningItems,
  { id: "profile", name: "Your profile", icon: User },
  { id: "formulas", name: "Formula Vault", icon: BookMarked },
  { id: "mistakes", name: "Mistake Bank", icon: BrainCircuit },
  { id: "flashcards", name: "Flashcards", icon: Layers },
];
type ModalKind =
  | "quest"
  | "ai"
  | "focus"
  | "auth"
  | "onboarding"
  | "notifications"
  | "note"
  | null;
function initialView() {
  const v = location.hash.slice(1);
  return allViews.some((n) => n.id === v) ? v : "home";
}
export default function App() {
  const {
    state,
    setState,
    user,
    ready,
    syncError,
    retry,
    authenticate,
    logout,
  } = useProgress();
  const [view, setView] = useState(initialView);
  const [modal, setModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState("boolean");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => matchMedia("(max-width:760px)").matches,
  );
  const [toast, setToast] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const [pet, setPet] = useState({
    mood: "happy",
    text: "Big dreams start with small steps. Let’s make today a good one.",
  });
  useEffect(() => {
    const media = matchMedia("(max-width:760px)");
    const update = () => {
      setIsMobile(media.matches);
      if (!media.matches) setMobileMenu(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenu(false);
      if (
        event.key === "/" &&
        !modal &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>(
            '[aria-label="Search your universe"]',
          )
          ?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modal]);
  const reactionCount = useRef(0);
  const [questStep, setQuestStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questDone, setQuestDone] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusRemaining = useRef(25 * 60);
  const focusTick = useRef(0);
  const [focusFinished, setFocusFinished] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);
  const [chat, setChat] = useState<
    { role: "nova" | "you"; text: string; source?: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [aiMode, setAiMode] = useState("Explain");
  const chatEnd = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [draft, setDraft] = useState({
    name: state.name,
    branch: state.branch,
    target: state.target,
    dailyMinutes: state.dailyMinutes,
  });
  const [topicFilter, setTopicFilter] = useState("all");
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const topicList = getTopics(state.branch);
  const topic = getTopic(selected);
  const nextTopic =
    topicList.find((t) => !state.completed.includes(t.id)) || topicList[0];
  const xp = xpFor(state);
  const level = 1 + Math.floor(xp / 500);
  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekMinutes = state.sessions
    .filter((s) => new Date(s.at) >= weekStart)
    .reduce((sum, s) => sum + s.minutes, 0);
  const completed = topicList.filter((t) =>
    state.completed.includes(t.id),
  ).length;
  const today = new Date().toDateString();
  const todayAttempts = state.attempts.filter(
    (a) => new Date(a.at).toDateString() === today,
  );
  const todaySessions = state.sessions.filter(
    (a) => new Date(a.at).toDateString() === today,
  );
  const missionsDone = [
    state.completed.some((id) =>
      todayAttempts.some((a) => a.topicId === id && a.correct),
    ),
    todayAttempts.length >= 3,
    todaySessions.length > 0,
  ].filter(Boolean).length;
  const notify = useCallback((message: string) => setToast(message), []);
  const closeModal = useCallback(() => {
    setModal(null);
    void audioRef.current?.suspend();
    setMuted(true);
  }, []);
  const navigate = useCallback((id: string) => {
    location.hash = id;
    setView(id);
    setMobileMenu(false);
    setQuery("");
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    const cb = () => setView(initialView());
    window.addEventListener("hashchange", cb);
    return () => window.removeEventListener("hashchange", cb);
  }, []);
  useEffect(() => {
    const on = () => setOffline(false),
      off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatBusy]);
  useEffect(() => {
    if (!isNativeApp) return;
    window.__gatenovaBack = () => {
      if (modal) {
        closeModal();
        return true;
      }
      if (mobileMenu) {
        setMobileMenu(false);
        return true;
      }
      if (view !== "home") {
        navigate("home");
        return true;
      }
      return false;
    };
    return () => {
      delete window.__gatenovaBack;
    };
  }, [modal, mobileMenu, view, closeModal, navigate]);
  const react = (event: PetEvent) => {
    const r = reactions[event];
    setPet({
      mood: r.mood,
      text: r.lines[reactionCount.current++ % r.lines.length],
    });
  };
  const startQuest = (t: Topic) => {
    setSelected(t.id);
    setQuestStep(0);
    setAnswer(null);
    setRevealed(false);
    setQuestDone(false);
    setModal("quest");
    react("STUDY_STARTED");
  };
  const askNova = (t?: Topic) => {
    if (t && t.id !== selected) setChat([]);
    if (t) setSelected(t.id);
    else if (!topicList.some((t) => t.id === selected))
      setSelected(nextTopic.id);
    setModal("ai");
  };
  const openFocus = () => {
    setModal("focus");
  };
  const openOnboarding = () => {
    setDraft({
      name: state.name,
      branch: state.branch,
      target: state.target,
      dailyMinutes: state.dailyMinutes,
    });
    setOnboardStep(0);
    setModal("onboarding");
  };
  useEffect(() => {
    if (!focusRunning) return;
    focusTick.current = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      focusRemaining.current = Math.max(
        0,
        focusRemaining.current - (now - focusTick.current) / 1000,
      );
      focusTick.current = now;
      setSeconds(Math.ceil(focusRemaining.current));
      if (focusRemaining.current <= 0) {
        setFocusRunning(false);
        setFocusFinished(true);
        setState((s) => ({
          ...s,
          sessions: [
            ...s.sessions,
            {
              id: crypto.randomUUID(),
              minutes: focusMinutes,
              at: new Date().toISOString(),
            },
          ],
        }));
        notify(
          "Focus session complete. +100 XP — time for a well-earned break!",
        );
      }
    }, 250);
    return () => clearInterval(t);
  }, [focusRunning, focusMinutes, setState, notify]);
  useEffect(
    () => () => {
      void audioRef.current?.close();
    },
    [],
  );
  function submitAnswer() {
    if (answer === null) return;
    const q = topic.questions[questStep - 1];
    const correct = answer === q.correct;
    setState((s) => ({
      ...s,
      attempts: [
        ...s.attempts,
        {
          questionId: q.id,
          topicId: topic.id,
          answer,
          correct,
          at: new Date().toISOString(),
        },
      ],
    }));
    setRevealed(true);
    react(correct ? "QUESTION_CORRECT" : "QUESTION_WRONG");
    if (
      correct &&
      !state.attempts.some((a) => a.questionId === q.id && a.correct)
    )
      notify("+20 XP · One more connection made!");
  }
  function nextQuestion() {
    if (questStep === topic.questions.length) {
      const nowCorrect = new Set(
        state.attempts
          .filter((a) => a.topicId === topic.id && a.correct)
          .map((a) => a.questionId),
      );
      if (nowCorrect.size === topic.questions.length) {
        if (!state.completed.includes(topic.id)) {
          setState((s) => ({
            ...s,
            completed: [...new Set([...s.completed, topic.id])],
          }));
          notify(`Quest complete! +150 XP · ${topic.region} is growing.`);
        }
        react("CONCEPT_MASTERED");
        setQuestDone(true);
      } else {
        setQuestDone(true);
        react("QUESTION_WRONG");
      }
    } else {
      setQuestStep((s) => s + 1);
      setAnswer(null);
      setRevealed(false);
    }
  }
  async function sendChat(prompt: string) {
    if (!prompt.trim() || chatBusy) return;
    setChat((c) => [...c, { role: "you", text: prompt }]);
    setChatInput("");
    setChatBusy(true);
    react("QUESTION_ASKED");
    try {
      const result = await localTutor.answer(prompt, topic, aiMode);
      setChat((c) => [...c, { role: "nova", ...result }]);
      react("AI_ANSWER_COMPLETED");
    } catch {
      setChat((c) => [
        ...c,
        {
          role: "nova",
          text: "I’m having trouble reaching my study brain. Try your question again in a moment.",
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  }
  const bookmark = (id: string) => {
    const exists = state.bookmarks.includes(id);
    setState((s) => ({
      ...s,
      bookmarks: exists
        ? s.bookmarks.filter((x) => x !== id)
        : [...s.bookmarks, id],
    }));
    notify(
      exists
        ? "Removed from your saved topics."
        : "Saved to your Formula Vault.",
    );
  };
  const saveNote = (title: string, body: string) => {
    const note = {
      id: crypto.randomUUID(),
      title: title.slice(0, 200),
      body,
      at: new Date().toISOString(),
    };
    const next = { ...state, notes: [note, ...state.notes] };
    if (
      state.notes.length >= 100 ||
      new Blob([JSON.stringify(next)]).size > 900000
    ) {
      notify(
        "This workspace has reached its note capacity. Export your existing notes to keep a personal copy.",
      );
      return false;
    }
    setState((s) => ({ ...s, notes: [note, ...s.notes] }));
    return true;
  };
  const mistakes = state.attempts
    .filter((a) => !a.correct)
    .filter(
      (a, i, arr) => arr.findIndex((b) => b.questionId === a.questionId) === i,
    );
  const searchResults = [
    ...allViews
      .filter((v) => v.name.toLowerCase().includes(query.toLowerCase()))
      .map((v) => ({ id: v.id, title: v.name, kind: "Page" })),
    ...topicList
      .filter((t) =>
        (t.title + t.subject).toLowerCase().includes(query.toLowerCase()),
      )
      .map((t) => ({ id: t.id, title: t.title, kind: t.subject })),
  ].slice(0, 7);
  const pageHeader = (
    eyebrow: string,
    title: string,
    subtitle: string,
    action?: React.ReactNode,
  ) => (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
  const questRow = (t: Topic, i: number) => (
    <button className="quest-row" key={t.id} onClick={() => startQuest(t)}>
      <div className={`quest-icon ${t.color}`}>
        {state.completed.includes(t.id) ? (
          <Check size={21} />
        ) : i === 0 ? (
          <Network size={22} />
        ) : i === 1 ? (
          <BrainCircuit size={22} />
        ) : (
          <Zap size={22} />
        )}
      </div>
      <div className="quest-row-main">
        <h3>
          {t.title}
          {i === 0 && !state.completed.includes(t.id) && (
            <span className="tiny-tag">RECOMMENDED</span>
          )}
        </h3>
        <p>
          {t.subject}
          <span>·</span>
          <Clock size={12} />
          {t.minutes} min
        </p>
      </div>
      <span className="xp-reward">
        +{t.xp} <small>XP</small>
      </span>
      <ChevronRight size={17} />
    </button>
  );
  return (
    <>
      <div id="app-shell" className="app-shell">
        <aside
          inert={isMobile && !mobileMenu}
          className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}
        >
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="GATENOVA home"
          >
            <div className="brand-symbol">
              <Sparkles size={25} />
            </div>
            <span>
              GATE<span className="brand-nova">NOVA</span>
              <small>YOUR LEARNING UNIVERSE</small>
            </span>
          </button>
          <button className="workspace-switch" onClick={openOnboarding}>
            <div className="workspace-icon">
              <GraduationCap size={19} />
            </div>
            <span>
              GATE {state.target}
              <small>{state.branch} · Your journey</small>
            </span>
            <ChevronDown size={15} />
          </button>
          <div className="nav-label">YOUR UNIVERSE</div>
          <nav aria-label="Your universe">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? "active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
                {item.id === "today" && (
                  <span className="nav-count">
                    {
                      topicList.filter((t) => !state.completed.includes(t.id))
                        .length
                    }
                  </span>
                )}
                {view === item.id && <span className="active-dot" />}
              </button>
            ))}
          </nav>
          <div className="nav-label learning-label">LEARN & GROW</div>
          <nav aria-label="Learning tools">
            {learningItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? "active" : ""}`}
                onClick={() => navigate(item.id)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
                {item.id === "garden" && <span className="new-tag">NEW</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="journey-card">
              <span className="journey-spark">✦</span>
              <p>A little better, every day.</p>
              <small>Your future self will thank you.</small>
              <button onClick={openFocus}>
                Make time to grow <ArrowUpRight size={15} />
              </button>
            </div>
            <button
              className="settings-link"
              onClick={() => navigate("profile")}
            >
              <Settings size={18} />
              Settings & preferences
            </button>
            <button
              className="sidebar-profile"
              onClick={() => navigate("profile")}
            >
              <div className="user-avatar">
                {state.name.charAt(0).toUpperCase()}
              </div>
              <span>
                {state.name}
                <small>
                  {user
                    ? "Personal account"
                    : isNativeApp
                      ? "On-device profile"
                      : "Local explorer profile"}
                </small>
              </span>
              <ChevronDown size={15} />
            </button>
          </div>
        </aside>
        {mobileMenu && (
          <button
            className="sidebar-scrim"
            aria-label="Close navigation"
            onClick={() => setMobileMenu(false)}
          />
        )}
        <div className="app-content" inert={isMobile && mobileMenu}>
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                onClick={() => setMobileMenu(true)}
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              <span>Your workspace</span>
              <ChevronRight size={13} />
              <strong>
                {allViews.find((v) => v.id === view)?.name || "Overview"}
              </strong>
            </div>
            <div className="topbar-actions">
              <div className="search-wrap">
                <Search size={16} />
                <input
                  aria-label="Search your universe"
                  placeholder="Search your universe"
                  value={query}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchOpen(false);
                    if (e.key === "Enter" && searchResults.length) {
                      const r = searchResults[0];
                      if (r.kind === "Page") navigate(r.id);
                      else {
                        startQuest(getTopic(r.id));
                        setSearchOpen(false);
                      }
                    }
                  }}
                />
                <kbd>/</kbd>
                {searchOpen && query && (
                  <div className="search-results">
                    <div className="search-results-title">
                      YOUR UNIVERSE{" "}
                      <button
                        aria-label="Close search"
                        onClick={() => setSearchOpen(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {searchResults.length ? (
                      searchResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            if (r.kind === "Page") navigate(r.id);
                            else startQuest(getTopic(r.id));
                            setSearchOpen(false);
                          }}
                        >
                          <Search size={15} />
                          <span>
                            {r.title}
                            <small>{r.kind}</small>
                          </span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))
                    ) : (
                      <p>No matches. Try “probability” or “practice”.</p>
                    )}
                  </div>
                )}
              </div>
              <span className="topbar-divider" />
              <button
                className="streak-chip"
                onClick={() =>
                  notify(
                    streakFor(state)
                      ? `${streakFor(state)} days of learning. Breaks are welcome, too.`
                      : "Complete a learning activity to begin your momentum.",
                  )
                }
              >
                <Flame size={17} />
                <b>{streakFor(state)}</b>
                <span>day streak</span>
              </button>
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                onClick={() => setModal("notifications")}
              >
                <Bell size={19} />
                <i />
              </button>
              <button
                className="top-avatar"
                onClick={() => navigate("profile")}
                aria-label="Open profile"
              >
                {state.name.charAt(0)}
              </button>
            </div>
          </header>
          {((offline && !isNativeApp) || syncError) && (
            <div className="status-banner" role="status">
              <WifiOff size={16} />
              {offline
                ? "You’re offline. Your local lessons and guest progress are still available."
                : syncError}
              {syncError && !offline && (
                <button onClick={() => void retry()}>Retry sync</button>
              )}
            </div>
          )}
          <main className="main-content">
            {!ready ? (
              <div className="loading-page">
                <div className="skeleton" />
                <div className="skeleton" />
                <p>Opening your learning universe…</p>
              </div>
            ) : (
              <>
                {view === "home" && (
                  <>
                    {pageHeader(
                      "A LITTLE PROGRESS. A WORLD OF POSSIBILITY.",
                      `Let’s make today count, ${state.name}.`,
                      "Your next chapter starts with one small quest.",
                      <div className="date-chip">
                        <CalendarDays size={16} />
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>,
                    )}
                    <section className="hero">
                      <div className="hero-grid" />
                      <div className="hero-copy">
                        <div className="hero-label">
                          <span /> YOUR JOURNEY, GAMIFIED
                        </div>
                        <h2>
                          Big dreams.
                          <br />
                          Small quests.
                          <br />
                          <span>Limitless you.</span>
                        </h2>
                        <p>
                          Every concept you conquer brings your
                          <br className="desktop-break" /> GATE dream a little
                          closer. Ready to explore?
                        </p>
                        <Button onClick={() => startQuest(nextTopic)}>
                          Continue your journey <ArrowRight size={17} />
                        </Button>
                        <div className="hero-footnote">
                          <span className="mini-avatar">
                            <Nova size={25} />
                          </span>{" "}
                          A world of knowledge. A companion for every step.
                        </div>
                      </div>
                      <WorldArt />
                      <div className="world-floating-label">
                        <span className="map-point" />
                        <span>
                          {nextTopic.region}
                          <small>Your next destination</small>
                        </span>
                        <ChevronRight size={16} />
                      </div>
                      <div className="hero-coordinate">
                        NOVA WORLD <span>01 — THE BEGINNING</span>
                      </div>
                    </section>
                    <div className="stats-strip">
                      <div className="stat-item">
                        <div className="stat-icon green">
                          <Clock size={19} />
                        </div>
                        <div>
                          <p>
                            Study time <span>THIS WEEK</span>
                          </p>
                          <strong>
                            {Math.floor(weekMinutes / 60)}
                            <small>h</small> {weekMinutes % 60}
                            <small>m</small>
                          </strong>
                        </div>
                        <div className="mini-bars">
                          {[5, 8, 6, 12, 10, 17, 13].map((h, i) => (
                            <i
                              key={i}
                              style={{
                                height: h + 8,
                                opacity: totalMinutes ? 1 : 0.35,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon purple">
                          <BookOpen size={19} />
                        </div>
                        <div>
                          <p>Quests completed</p>
                          <strong>
                            {completed}
                            <small> / {topicList.length}</small>
                          </strong>
                        </div>
                        <span className="stat-hint">
                          Keep growing <TrendingUp size={13} />
                        </span>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon amber">
                          <Zap size={19} />
                        </div>
                        <div>
                          <p>Total experience</p>
                          <strong>
                            {xp.toLocaleString()}
                            <small> XP</small>
                          </strong>
                        </div>
                        <span className="level-pill">LEVEL {level}</span>
                      </div>
                    </div>
                    <div className="home-main-grid">
                      <div className="daily-quests">
                        <SectionTitle
                          title="A little closer, one quest at a time"
                          label="View all quests"
                          onClick={() => navigate("today")}
                        />
                        <Panel>
                          <div className="quest-panel-heading">
                            <div>
                              <span className="dot green-dot" /> TODAY’S QUESTS
                            </div>
                            <span>
                              {completed} of {topicList.length} completed
                            </span>
                          </div>
                          {topicList.map(questRow)}
                          <button className="quest-footer" onClick={openFocus}>
                            <span>
                              <Timer size={15} />
                              Find your flow. Start a focused study session.
                            </span>
                            <ArrowRight size={16} />
                          </button>
                        </Panel>
                      </div>
                      <div className="nova-section">
                        <SectionTitle
                          title="Your companion"
                          label="Meet Nova"
                          onClick={() => navigate("profile")}
                        />
                        <Panel className="nova-card">
                          <div className="nova-card-top">
                            <span className="nova-name">
                              Nova <i />
                            </span>
                            <span>EXPLORER · LVL {level}</span>
                          </div>
                          <div className="nova-scene">
                            <div className="nova-aura" />
                            <span className="pet-spark pet-spark-one">✦</span>
                            <Nova
                              size={132}
                              mood={pet.mood}
                              hat={state.cosmetic === "scholar"}
                            />
                            <span className="pet-spark pet-spark-two">✧</span>
                            <div className="pet-mood">
                              {pet.mood === "celebrating"
                                ? "A little victory!"
                                : pet.mood === "studying"
                                  ? "Learning with you"
                                  : pet.mood === "thinking"
                                    ? "Connecting the dots"
                                    : "Feeling curious"}
                            </div>
                          </div>
                          <p className="pet-dialogue">“{pet.text}”</p>
                          <div className="nova-energy">
                            <span>
                              <Leaf size={13} /> Ready to grow
                            </span>
                            <span>
                              With you, all the way{" "}
                              <span className="heart">♡</span>
                            </span>
                          </div>
                        </Panel>
                      </div>
                    </div>
                    <div className="home-bottom-grid">
                      <section>
                        <SectionTitle
                          title="Your learning universe"
                          label="Explore Nova World"
                          onClick={() => navigate("world")}
                        />
                        <div className="region-grid">
                          {topicList.slice(0, 2).map((t, i) => (
                            <button
                              key={t.id}
                              className={`region-card region-${i}`}
                              onClick={() => startQuest(t)}
                            >
                              <span className="region-number">
                                REGION 0{i + 1}
                              </span>
                              <div className="region-landscape">
                                {i === 0 ? (
                                  <>
                                    <Network size={58} />
                                    <span className="orb orb-one" />
                                    <span className="orb orb-two" />
                                  </>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 200 90">
                                      <path
                                        d="M20 90L75 12L130 90M83 90L137 25L190 90"
                                        fill="#384740"
                                      />
                                      <path
                                        d="M75 12L54 42L74 36L91 40Z"
                                        fill="#A9B6A1"
                                      />
                                      <path
                                        d="M137 25L118 48L136 44L152 48Z"
                                        fill="#859C8F"
                                      />
                                    </svg>
                                  </>
                                )}
                              </div>
                              <h3>{t.region}</h3>
                              <p>
                                {t.subject}
                                <ArrowUpRight size={15} />
                              </p>
                              <Progress value={masteryFor(state, t.id)} />
                              <div className="region-progress">
                                <span>
                                  {state.completed.includes(t.id)
                                    ? "Quest complete"
                                    : "Your next discovery"}
                                </span>
                                <span>{masteryFor(state, t.id)}%</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>
                      <section>
                        <SectionTitle title="Grow what you know" />
                        <Panel className="garden-preview">
                          <GardenArt />
                          <div>
                            <span className="eyebrow">
                              YOUR KNOWLEDGE GARDEN
                            </span>
                            <h3>
                              Plant a little knowledge.
                              <br />
                              Watch it become a world.
                            </h3>
                            <p>
                              Every mastered topic brings new life
                              <br />
                              to your very own garden.
                            </p>
                            <button
                              className="text-link"
                              onClick={() => navigate("garden")}
                            >
                              Visit your garden <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </Panel>
                      </section>
                    </div>
                    <div className="home-footer">
                      <span>
                        <span className="dot green-dot" /> A little progress is
                        still progress.
                      </span>
                      <span>Made for your journey. At your pace.</span>
                    </div>
                  </>
                )}
                {view === "today" && (
                  <>
                    {pageHeader(
                      "YOUR DAILY ADVENTURE",
                      "One good step at a time.",
                      "A realistic plan. A clear next step. Plenty of room to breathe.",
                      <Button variant="secondary" onClick={openFocus}>
                        <Timer size={17} /> Start focus
                      </Button>,
                    )}
                    <div className="today-summary">
                      <Nova size={98} />
                      <div>
                        <span className="eyebrow">TODAY’S INTENTION</span>
                        <h2>
                          Make room for {state.dailyMinutes} minutes of growth.
                        </h2>
                        <p>
                          You’ve practiced {todayAttempts.length} questions and
                          finished {todaySessions.length} focus sessions today.
                        </p>
                      </div>
                      <div className="today-ring">
                        {missionsDone}
                        <small>/ 3 missions</small>
                      </div>
                    </div>
                    <div className="two-column">
                      <section>
                        <SectionTitle title="Your Nova Quests" />
                        <Panel>{topicList.map(questRow)}</Panel>
                        <SectionTitle title="Build a little momentum" />
                        <Panel className="mission-list">
                          <button onClick={() => startQuest(nextTopic)}>
                            <span
                              className={`mission-check ${todayAttempts.length >= 3 ? "checked" : ""}`}
                            >
                              {todayAttempts.length >= 3 ? (
                                <Check size={16} />
                              ) : (
                                <Target size={16} />
                              )}
                            </span>
                            <div>
                              <h3>Solve 3 practice questions</h3>
                              <p>Turn a concept into something you can use.</p>
                            </div>
                            <span>{Math.min(3, todayAttempts.length)}/3</span>
                          </button>
                          <button onClick={openFocus}>
                            <span
                              className={`mission-check ${todaySessions.length ? "checked" : ""}`}
                            >
                              {todaySessions.length ? (
                                <Check size={16} />
                              ) : (
                                <Timer size={16} />
                              )}
                            </span>
                            <div>
                              <h3>Find your focus</h3>
                              <p>One quiet session, one meaningful step.</p>
                            </div>
                            <ArrowUpRight size={18} />
                          </button>
                          <button onClick={() => navigate("mistakes")}>
                            <span className="mission-check">
                              <BrainCircuit size={16} />
                            </span>
                            <div>
                              <h3>Learn from a tricky moment</h3>
                              <p>
                                {mistakes.length
                                  ? "Revisit a question and connect the dots."
                                  : "Your Mistake Bank will grow as you practice."}
                              </p>
                            </div>
                            <ArrowUpRight size={18} />
                          </button>
                        </Panel>
                      </section>
                      <section>
                        <Panel className="intention-card">
                          <span className="eyebrow">A NOTE FROM NOVA</span>
                          <Nova size={150} />
                          <h2>
                            Your pace is
                            <br />
                            the right pace.
                          </h2>
                          <p>
                            Missed a day? Your progress is still here. Start
                            with one small thing.
                          </p>
                          <Button onClick={() => startQuest(nextTopic)}>
                            Start Quest <ArrowRight size={16} />
                          </Button>
                        </Panel>
                        <Panel className="simple-panel">
                          <h3>Today’s learning reward</h3>
                          <p>
                            Finish a quest to earn 150 XP. Your garden grows
                            when all its questions click.
                          </p>
                          <Progress
                            value={Math.min(
                              100,
                              (todayAttempts.length / 3) * 100,
                            )}
                          />
                        </Panel>
                      </section>
                    </div>
                  </>
                )}
                {view === "world" && (
                  <>
                    {pageHeader(
                      "WELCOME TO NOVA WORLD",
                      "Knowledge opens new worlds.",
                      "Every region is a subject. Every path is a little more possibility.",
                    )}
                    <section className="world-map">
                      <div className="world-map-top">
                        <span className="pill">
                          <span className="dot green-dot" /> STAGE 01 · STUDY
                          CAMP
                        </span>
                        <span>
                          {completed}/{topicList.length} REGIONS EXPLORED
                        </span>
                      </div>
                      <WorldArt large />
                      <div className="map-caption">
                        <span className="eyebrow">
                          YOUR CURRENT DESTINATION
                        </span>
                        <h2>{nextTopic.region}</h2>
                        <p>{nextTopic.description}</p>
                        <Button onClick={() => startQuest(nextTopic)}>
                          Explore region <ArrowRight size={17} />
                        </Button>
                      </div>
                    </section>
                    <SectionTitle title="Choose your next discovery" />
                    <div className="three-column">
                      {topicList.map((t, i) => (
                        <Panel className="world-region" key={t.id}>
                          <span className={`quest-icon ${t.color}`}>
                            <Compass size={25} />
                          </span>
                          <span className="region-number">REGION 0{i + 1}</span>
                          <h2>{t.region}</h2>
                          <p>{t.subject}</p>
                          <Progress value={masteryFor(state, t.id)} />
                          <div className="region-progress">
                            <span>
                              {state.completed.includes(t.id)
                                ? "Mastered"
                                : "Available to explore"}
                            </span>
                            <span>{masteryFor(state, t.id)}%</span>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => startQuest(t)}
                          >
                            {state.completed.includes(t.id)
                              ? "Revisit region"
                              : "Start Quest"}
                            <ArrowUpRight size={16} />
                          </Button>
                        </Panel>
                      ))}
                    </div>
                  </>
                )}
                {view === "roadmap" && (
                  <>
                    {pageHeader(
                      "A PATH THAT GROWS WITH YOU",
                      "Your road to GATE.",
                      "A flexible starter route, tailored to your branch and your pace.",
                      <Button variant="secondary" onClick={openOnboarding}>
                        <Settings size={16} />
                        Adjust my plan
                      </Button>,
                    )}
                    <Panel className="roadmap-banner">
                      <div>
                        <Flag size={28} />
                        <h2>
                          GATE {state.target}
                          <span>
                            {state.branch} · {state.dailyMinutes} min / day
                          </span>
                        </h2>
                      </div>
                      <div>
                        <b>
                          {completed} / {topicList.length}
                        </b>
                        <span>starter quests completed</span>
                      </div>
                    </Panel>
                    <div className="roadmap-list">
                      {topicList.map((t, i) => (
                        <div className="roadmap-step" key={t.id}>
                          <div
                            className={`roadmap-node ${state.completed.includes(t.id) ? "complete" : ""}`}
                          >
                            {state.completed.includes(t.id) ? (
                              <Check size={22} />
                            ) : (
                              String(i + 1).padStart(2, "0")
                            )}
                          </div>
                          <Panel className="roadmap-content">
                            <div>
                              <span className="eyebrow">
                                {i === 0
                                  ? "BUILD YOUR FOUNDATION"
                                  : i === 1
                                    ? "CONNECT THE CONCEPTS"
                                    : "PUT KNOWLEDGE TO WORK"}
                              </span>
                              <h2>{t.title}</h2>
                              <p>{t.description}</p>
                              <span className="roadmap-meta">
                                <BookOpen size={14} />
                                {t.subject}
                                <Clock size={14} />
                                {t.minutes} min
                              </span>
                            </div>
                            <Button
                              variant={i === 0 ? "primary" : "secondary"}
                              onClick={() => startQuest(t)}
                            >
                              {state.completed.includes(t.id)
                                ? "Revisit"
                                : "Start Quest"}
                              <ArrowRight size={16} />
                            </Button>
                          </Panel>
                        </div>
                      ))}
                    </div>
                    <div className="info-note">
                      <ShieldCheck size={18} />
                      <p>
                        This is a starter learning route with authored practice
                        content. It is not the complete or officially approved
                        GATE syllabus. More reviewed curriculum can be added
                        through configuration.
                      </p>
                    </div>
                  </>
                )}
                {view === "practice" && (
                  <>
                    {pageHeader(
                      "THE PRACTICE ARENA",
                      "Make your knowledge stick.",
                      "Think it through. Try it out. Let every answer teach you something.",
                    )}
                    <div className="practice-tools">
                      <button onClick={() => navigate("mistakes")}>
                        <BrainCircuit size={23} />
                        <span>
                          Mistake Bank
                          <small>
                            {mistakes.length} learning opportunities
                          </small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                      <button onClick={() => navigate("formulas")}>
                        <BookMarked size={23} />
                        <span>
                          Formula Vault<small>Key ideas, close at hand</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                      <button onClick={() => navigate("flashcards")}>
                        <Layers size={23} />
                        <span>
                          Flashcards<small>A little knowledge, on repeat</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                    </div>
                    <div className="filter-row">
                      <div className="tabs">
                        {["all", "available", "completed"].map((f) => (
                          <button
                            className={topicFilter === f ? "selected" : ""}
                            key={f}
                            onClick={() => setTopicFilter(f)}
                          >
                            {f === "all"
                              ? "All topics"
                              : f === "available"
                                ? "To explore"
                                : "Completed"}
                          </button>
                        ))}
                      </div>
                      <span>
                        <Target size={15} />
                        Original practice · {state.branch}
                      </span>
                    </div>
                    <div className="three-column">
                      {topicList
                        .filter(
                          (t) =>
                            topicFilter === "all" ||
                            (topicFilter === "completed"
                              ? state.completed.includes(t.id)
                              : !state.completed.includes(t.id)),
                        )
                        .map((t) => (
                          <Panel className="practice-card" key={t.id}>
                            <div className="practice-card-top">
                              <span className={`quest-icon ${t.color}`}>
                                <Network size={23} />
                              </span>
                              <button
                                className={`icon-button ${state.bookmarks.includes(t.id) ? "bookmarked" : ""}`}
                                onClick={() => bookmark(t.id)}
                                aria-label={`Bookmark ${t.subject}`}
                              >
                                <Bookmark size={19} />
                              </button>
                            </div>
                            <span className="eyebrow">{t.subject}</span>
                            <h2>{t.title}</h2>
                            <p>{t.description}</p>
                            <div className="practice-meta">
                              <span>
                                <Target size={14} />
                                {t.questions.length} questions
                              </span>
                              <span>
                                <Zap size={14} />+{t.xp} XP
                              </span>
                            </div>
                            <Button onClick={() => startQuest(t)}>
                              Enter practice <ArrowRight size={16} />
                            </Button>
                          </Panel>
                        ))}
                    </div>
                    {topicList.filter(
                      (t) =>
                        topicFilter === "all" ||
                        (topicFilter === "completed"
                          ? state.completed.includes(t.id)
                          : !state.completed.includes(t.id)),
                    ).length === 0 && (
                      <Empty
                        icon={<Target size={30} />}
                        title="Your next achievement is waiting."
                        description="Complete a quest and it will appear here."
                        action={
                          <Button onClick={() => setTopicFilter("all")}>
                            Explore topics
                          </Button>
                        }
                      />
                    )}
                    <div className="info-note">
                      <BookOpen size={18} />
                      <p>
                        These are original learning questions, not previous-year
                        GATE questions. Official 2026 papers and answer keys are
                        available in Syllabus & library. Full mock scoring is
                        not yet included.
                      </p>
                    </div>
                  </>
                )}
                {view === "syllabus" && (
                  <Suspense
                    fallback={
                      <p role="status">
                        Nova is opening your syllabus library…
                      </p>
                    }
                  >
                    <SyllabusLibrary
                      branch={state.branch}
                      bookmarks={state.bookmarks}
                      onBookmark={(id) =>
                        setState((s) => ({
                          ...s,
                          bookmarks: s.bookmarks.includes(id)
                            ? s.bookmarks.filter((x) => x !== id)
                            : [...s.bookmarks, id],
                        }))
                      }
                      onBranch={(branch) => {
                        setState((s) => ({ ...s, branch }));
                        setSelected(getTopics(branch)[0].id);
                      }}
                    />
                  </Suspense>
                )}
                {view === "materials" && (
                  <>
                    {pageHeader(
                      "YOUR PERSONAL KNOWLEDGE SPACE",
                      "Keep the good ideas close.",
                      "Collect notes, keep your insights, and return to what matters.",
                      <Button onClick={() => setModal("note")}>
                        <Plus size={17} />
                        Create a note
                      </Button>,
                    )}
                    <Panel className="library-shortcut">
                      <div>
                        <h3>Your official GATE library</h3>
                        <p>
                          All 2027 syllabuses, official papers, answer keys and
                          course resources.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate("syllabus")}
                      >
                        Explore library <ArrowRight size={16} />
                      </Button>
                    </Panel>
                    <label className="upload-area">
                      <Upload size={28} />
                      <h3>Bring a little knowledge with you.</h3>
                      <p>Import a plain text note, or start one of your own.</p>
                      <span className="pill">
                        .txt files · up to 50 KB · stored in your workspace
                      </span>
                      <input
                        type="file"
                        accept=".txt,text/plain"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (
                            !file.name.toLowerCase().endsWith(".txt") ||
                            file.size > 50000
                          ) {
                            notify("Choose a .txt file smaller than 50 KB.");
                            e.target.value = "";
                            return;
                          }
                          try {
                            const body = await file.text();
                            if (!saveNote(file.name, body)) return;
                            notify("Note added to your materials.");
                            react("MATERIAL_UPLOADED");
                          } catch {
                            notify(
                              "This file could not be read. Please try again.",
                            );
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <SectionTitle
                      title={`Your notes (${state.notes.length})`}
                    />
                    {state.notes.length ? (
                      <div className="notes-grid">
                        {state.notes.map((n) => (
                          <Panel key={n.id} className="note-card">
                            <FileText size={23} />
                            <h3>{n.title}</h3>
                            <p>{n.body}</p>
                            <div>
                              <span>{new Date(n.at).toLocaleDateString()}</span>
                              <button
                                className="text-link"
                                onClick={() => {
                                  exportTextNote(n.title, n.body);
                                }}
                              >
                                Export
                                <ArrowUpRight size={14} />
                              </button>
                            </div>
                          </Panel>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        icon={<BookOpen size={30} />}
                        title="A home for your lightbulb moments."
                        description="Save your first note. Your collection grows with you."
                      />
                    )}
                  </>
                )}
                {view === "garden" && (
                  <>
                    {pageHeader(
                      "KNOWLEDGE, BROUGHT TO LIFE",
                      "Look at what you’re growing.",
                      "Every mastered topic plants something that stays with you.",
                    )}
                    <div className="garden-full">
                      <span className="pill">
                        YOUR GARDEN · {completed} TOPIC
                        {completed === 1 ? "" : "S"} MASTERED
                      </span>
                      <div className="garden-plants">
                        {completed ? (
                          topicList
                            .filter((t) => state.completed.includes(t.id))
                            .map((t) => (
                              <div key={t.id}>
                                <GardenArt />
                                <span>{t.subject}</span>
                              </div>
                            ))
                        ) : (
                          <GardenArt />
                        )}
                      </div>
                      <h2>
                        {completed
                          ? "Small steps. Deep roots."
                          : "Every great garden starts with a seed."}
                      </h2>
                      <p>
                        {completed
                          ? "These plants represent the concepts you’ve practiced and completed."
                          : "Complete your first quest to plant your first piece of knowledge."}
                      </p>
                      <Button onClick={() => startQuest(nextTopic)}>
                        {completed
                          ? "Keep growing"
                          : "Plant your first discovery"}
                        <Leaf size={17} />
                      </Button>
                    </div>
                  </>
                )}
                {view === "achievements" && (
                  <>
                    {pageHeader(
                      "MOMENTS THAT MATTER",
                      "Proof of your progress.",
                      "Celebrate what you learn. Every milestone tells a story.",
                    )}
                    <div className="achievement-grid">
                      {[
                        {
                          title: "First Quest",
                          desc: "Complete your first topic quest.",
                          done: completed > 0,
                          icon: Flag,
                        },
                        {
                          title: "In the Flow",
                          desc: "Complete a timed focus session.",
                          done: state.sessions.length > 0,
                          icon: Timer,
                        },
                        {
                          title: "Curious Mind",
                          desc: "Answer your first practice question.",
                          done: state.attempts.length > 0,
                          icon: BrainCircuit,
                        },
                        {
                          title: "Knowledge Keeper",
                          desc: "Save your first personal note.",
                          done: state.notes.length > 0,
                          icon: BookOpen,
                        },
                        {
                          title: "First Garden",
                          desc: "Master two starter topics.",
                          done: completed >= 2,
                          icon: Leaf,
                        },
                        {
                          title: "7-Day Momentum",
                          desc: "Learn on seven consecutive days.",
                          done: streakFor(state) >= 7,
                          icon: Flame,
                        },
                      ].map((a) => (
                        <Panel
                          key={a.title}
                          className={`achievement-card ${a.done ? "unlocked" : ""}`}
                        >
                          <div className="achievement-badge">
                            <a.icon size={34} />
                          </div>
                          <span className="eyebrow">
                            {a.done ? "UNLOCKED" : "YET TO DISCOVER"}
                          </span>
                          <h2>{a.title}</h2>
                          <p>{a.desc}</p>
                          <span className="achievement-status">
                            {a.done ? (
                              <>
                                <Check size={13} /> Earned through learning
                              </>
                            ) : (
                              <>
                                <Lock size={13} /> At your own pace
                              </>
                            )}
                          </span>
                        </Panel>
                      ))}
                    </div>
                  </>
                )}
                {view === "analytics" && (
                  <>
                    {pageHeader(
                      "THE BIGGER PICTURE",
                      "You’re building something good.",
                      "Your learning indicators. A little perspective on how far you’ve come.",
                    )}
                    <div className="analytics-stats">
                      {[
                        {
                          label: "Practice accuracy",
                          value: `${accuracyFor(state)}%`,
                          icon: Target,
                        },
                        {
                          label: "Questions attempted",
                          value: state.attempts.length,
                          icon: CheckCheck,
                        },
                        {
                          label: "Focus minutes",
                          value: totalMinutes,
                          icon: Clock,
                        },
                        { label: "Total experience", value: xp, icon: Zap },
                      ].map((s) => (
                        <Panel className="analytics-stat" key={s.label}>
                          <s.icon size={20} />
                          <p>{s.label}</p>
                          <strong>{s.value}</strong>
                        </Panel>
                      ))}
                    </div>
                    <div className="two-column">
                      <Panel className="chart-panel">
                        <SectionTitle title="Your learning rhythm" />
                        <p>Questions practiced in the last 7 days</p>
                        <div className="bar-chart">
                          {Array.from({ length: 7 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - 6 + i);
                            const count = state.attempts.filter(
                              (a) =>
                                new Date(a.at).toDateString() ===
                                d.toDateString(),
                            ).length;
                            const max = Math.max(
                              5,
                              ...Array.from({ length: 7 }, (_, j) => {
                                const day = new Date();
                                day.setDate(day.getDate() - 6 + j);
                                return state.attempts.filter(
                                  (a) =>
                                    new Date(a.at).toDateString() ===
                                    day.toDateString(),
                                ).length;
                              }),
                            );
                            return (
                              <div key={i}>
                                <span>{count}</span>
                                <div className="bar-space">
                                  <i
                                    style={{
                                      height: `${Math.max(2, (count / max) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <small>
                                  {d.toLocaleDateString("en-US", {
                                    weekday: "short",
                                  })}
                                </small>
                              </div>
                            );
                          })}
                        </div>
                      </Panel>
                      <Panel className="chart-panel">
                        <SectionTitle title="Concept confidence" />
                        <p>An approximate picture of your learning progress</p>
                        <div className="mastery-list">
                          {topicList.map((t) => (
                            <button key={t.id} onClick={() => startQuest(t)}>
                              <span>
                                {t.subject}
                                <b>{masteryFor(state, t.id)}%</b>
                              </span>
                              <Progress value={masteryFor(state, t.id)} />
                            </button>
                          ))}
                        </div>
                        <div className="analytics-insight">
                          <Sparkles size={18} />
                          <p>
                            {completed
                              ? `You've completed ${completed} starter quests. Revisit a tricky question to strengthen the connections.`
                              : "Every journey starts somewhere. Try a quest to begin seeing your learning patterns."}
                          </p>
                        </div>
                      </Panel>
                    </div>
                    <div className="info-note">
                      <Activity size={18} />
                      <p>
                        These are learning indicators based on your activity,
                        not exact measurements of mastery or predictions of your
                        GATE rank.
                      </p>
                    </div>
                  </>
                )}
                {view === "profile" && (
                  <>
                    {pageHeader(
                      "YOUR JOURNEY. YOUR WAY.",
                      "A space that feels like you.",
                      "Personalize your path, meet your companion, and manage your account.",
                    )}
                    <div className="two-column">
                      <Panel className="profile-panel">
                        <div className="profile-identity">
                          <div className="user-avatar large">
                            {state.name.charAt(0)}
                          </div>
                          <div>
                            <h2>{state.name}</h2>
                            <p>
                              {user?.email ||
                                (isNativeApp
                                  ? "Android edition · Saved on this phone"
                                  : "Local explorer · Progress saved on this device")}
                            </p>
                            <span className="level-pill">
                              LEVEL {level} · EXPLORER
                            </span>
                          </div>
                        </div>
                        <div className="profile-xp">
                          <span>
                            Your next level<b>{xp % 500} / 500 XP</b>
                          </span>
                          <Progress value={(xp % 500) / 5} />
                        </div>
                        <div className="profile-details">
                          <span>
                            Branch<b>{state.branch}</b>
                          </span>
                          <span>
                            Target exam<b>GATE {state.target}</b>
                          </span>
                          <span>
                            Daily intention<b>{state.dailyMinutes} minutes</b>
                          </span>
                        </div>
                        <Button variant="secondary" onClick={openOnboarding}>
                          Personalize your journey
                          <Settings size={16} />
                        </Button>
                        <div className="account-section">
                          <h3>
                            {isNativeApp
                              ? "Your learning, on your phone"
                              : user
                                ? "Your account"
                                : "Take your progress with you"}
                          </h3>
                          <p>
                            {isNativeApp
                              ? "Lessons, notes, quests and Nova’s lesson guide work offline. No account is needed. Export important notes before uninstalling or clearing app storage."
                              : user
                                ? "Your learning progress syncs to your personal account."
                                : "Create an account for a fresh, synced learning journey. Your local explorer workspace stays on this device."}
                          </p>
                          {isNativeApp ? (
                            <Button
                              variant="secondary"
                              onClick={openOnboarding}
                            >
                              Personalize my profile <Settings size={16} />
                            </Button>
                          ) : user ? (
                            <Button
                              variant="secondary"
                              onClick={async () => {
                                try {
                                  setFocusRunning(false);
                                  await logout();
                                  notify(
                                    "Signed out. Your local explorer workspace is ready.",
                                  );
                                } catch (e) {
                                  notify((e as Error).message);
                                }
                              }}
                            >
                              <LogOut size={16} />
                              Sign out
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                setAuthMode("signup");
                                setAuthError("");
                                setModal("auth");
                              }}
                            >
                              Create your account <ArrowRight size={16} />
                            </Button>
                          )}
                        </div>
                      </Panel>
                      <Panel className="companion-profile">
                        <span className="eyebrow">NOVA · YOUR COMPANION</span>
                        <Nova
                          size={220}
                          mood={pet.mood}
                          hat={state.cosmetic === "scholar"}
                        />
                        <h2>
                          Little companion.
                          <br />
                          Big believer in you.
                        </h2>
                        <p>
                          Nova grows with your learning. Taking a break never
                          takes away your progress.
                        </p>
                        <div className="cosmetic-options">
                          <button
                            className={
                              state.cosmetic === "classic" ? "selected" : ""
                            }
                            onClick={() => {
                              setState((s) => ({ ...s, cosmetic: "classic" }));
                              notify("Nova is keeping it classic.");
                            }}
                          >
                            <Leaf size={18} />
                            Explorer
                          </button>
                          <button
                            className={
                              state.cosmetic === "scholar" ? "selected" : ""
                            }
                            onClick={() => {
                              setState((s) => ({ ...s, cosmetic: "scholar" }));
                              notify("A scholarly new look for Nova.");
                            }}
                          >
                            <GraduationCap size={18} />
                            Scholar
                          </button>
                        </div>
                        <small>
                          Cosmetics are just for fun. Your learning comes first.
                        </small>
                      </Panel>
                    </div>
                  </>
                )}
                {view === "formulas" && (
                  <>
                    {pageHeader(
                      "THE FORMULA VAULT",
                      "Big ideas, beautifully simple.",
                      "Useful relationships from your current starter curriculum.",
                    )}
                    <div className="three-column">
                      {topicList.map((t) => (
                        <Panel className="formula-card" key={t.id}>
                          <div className="practice-card-top">
                            <span className="eyebrow">{t.subject}</span>
                            <button
                              aria-label={`Bookmark ${t.subject}`}
                              className={`icon-button ${state.bookmarks.includes(t.id) ? "bookmarked" : ""}`}
                              onClick={() => bookmark(t.id)}
                            >
                              <Bookmark size={19} />
                            </button>
                          </div>
                          <h2>{t.formula}</h2>
                          <p>{t.example}</p>
                          <Button
                            variant="secondary"
                            onClick={() => askNova(t)}
                          >
                            <Sparkles size={16} />
                            Ask Nova about this
                          </Button>
                        </Panel>
                      ))}
                    </div>
                  </>
                )}
                {view === "mistakes" && (
                  <>
                    {pageHeader(
                      "YOUR MISTAKE BANK",
                      "Every “not yet” is a new path.",
                      "A wrong answer is useful information. Let’s find the missing connection.",
                    )}
                    {mistakes.length ? (
                      <div className="mistake-list">
                        {mistakes.map((a) => {
                          const t = getTopic(a.topicId);
                          const q = t.questions.find(
                            (q) => q.id === a.questionId,
                          )!;
                          const resolved = state.attempts.some(
                            (b) =>
                              b.questionId === a.questionId &&
                              b.correct &&
                              b.at >= a.at,
                          );
                          return (
                            <Panel className="mistake-card" key={a.questionId}>
                              <span className="eyebrow">
                                {t.subject} ·{" "}
                                {resolved
                                  ? "REVISITED SUCCESSFULLY"
                                  : "READY TO REVIEW"}
                              </span>
                              <h2>{q.prompt}</h2>
                              <p>Your answer: {q.options[a.answer]}</p>
                              <div className="answer-explanation">
                                <b>Let’s understand this</b>
                                <p>{q.explanation}</p>
                              </div>
                              <Button
                                variant="secondary"
                                onClick={() => startQuest(t)}
                              >
                                Practice again <ArrowRight size={16} />
                              </Button>
                            </Panel>
                          );
                        })}
                      </div>
                    ) : (
                      <Empty
                        icon={<BrainCircuit size={34} />}
                        title="A clean slate. Plenty to discover."
                        description="Keep solving questions. Nova will collect anything that deserves another look."
                        action={
                          <Button onClick={() => startQuest(nextTopic)}>
                            Try a practice quest <ArrowRight size={16} />
                          </Button>
                        }
                      />
                    )}
                  </>
                )}
                {view === "flashcards" && (
                  <>
                    {pageHeader(
                      "SMALL CARDS. STRONG CONNECTIONS.",
                      "A little refresh goes a long way.",
                      "Tap a card to reveal the idea. Take all the time you need.",
                    )}
                    <div className="flashcard-wrap">
                      <span className="eyebrow">
                        CARD {(flashIndex % topicList.length) + 1} OF{" "}
                        {topicList.length} ·{" "}
                        {topicList[flashIndex % topicList.length].subject}
                      </span>
                      <button
                        className={`flashcard ${flashFlipped ? "flipped" : ""}`}
                        onClick={() => setFlashFlipped((v) => !v)}
                      >
                        <span>
                          {flashFlipped ? "THE CONNECTION" : "CAN YOU RECALL?"}
                        </span>
                        <h2>
                          {flashFlipped
                            ? topicList[flashIndex % topicList.length].formula
                            : `What is the key relationship in ${topicList[flashIndex % topicList.length].subject}?`}
                        </h2>
                        {flashFlipped && (
                          <p>
                            {topicList[flashIndex % topicList.length].example}
                          </p>
                        )}
                        <small>
                          <RotateCcw size={15} />
                          Tap to flip
                        </small>
                      </button>
                      <div className="flashcard-actions">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setFlashIndex(
                              (i) =>
                                (i + topicList.length - 1) % topicList.length,
                            );
                            setFlashFlipped(false);
                          }}
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={() => {
                            setFlashIndex((i) => i + 1);
                            setFlashFlipped(false);
                          }}
                        >
                          Next card <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </main>
          <button className="global-nova" onClick={() => askNova()}>
            <Sparkles size={19} />
            <span>Ask Nova</span>
            <span className="ai-pill">AI</span>
          </button>
          <nav className="bottom-nav" aria-label="Mobile navigation">
            {[
              { id: "home", name: "Home", icon: Home },
              { id: "today", name: "Today", icon: Sun },
              { id: "world", name: "World", icon: Map },
              { id: "practice", name: "Practice", icon: Target },
              { id: "profile", name: "Profile", icon: User },
            ].map((n) => (
              <button
                key={n.id}
                className={view === n.id ? "active" : ""}
                onClick={() => navigate(n.id)}
              >
                <n.icon size={20} />
                <span>{n.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      {modal === "quest" && (
        <QuestDialog
          topic={topic}
          state={state}
          questDone={questDone}
          questStep={questStep}
          answer={answer}
          revealed={revealed}
          closeModal={closeModal}
          navigate={navigate}
          startQuest={startQuest}
          askNova={askNova}
          setQuestStep={setQuestStep}
          setAnswer={setAnswer}
          nextQuestion={nextQuestion}
          submitAnswer={submitAnswer}
        />
      )}
      {modal === "ai" && (
        <Modal title="Nova AI" onClose={closeModal} wide>
          <div className="ai-identity">
            <Nova size={60} mood={chatBusy ? "thinking" : "happy"} />
            <div>
              <h3>Your study companion</h3>
              <p>
                <span className="dot green-dot" /> Local lesson guide ·{" "}
                {topic.subject}
              </p>
            </div>
            <select
              aria-label="Tutor topic"
              value={topic.id}
              onChange={(e) => {
                setSelected(e.target.value);
                setChat([]);
              }}
              disabled={chatBusy}
            >
              {topicList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subject}
                </option>
              ))}
            </select>
          </div>
          <div className="ai-tabs">
            {["Explain", "Teach me"].map((m) => (
              <button
                key={m}
                className={aiMode === m ? "selected" : ""}
                onClick={() => setAiMode(m)}
              >
                {m === "Explain" ? (
                  <Sparkles size={15} />
                ) : (
                  <GraduationCap size={15} />
                )}{" "}
                {m}
              </button>
            ))}
          </div>
          <div className="chat-messages" aria-live="polite">
            {chat.length === 0 ? (
              <div className="chat-welcome">
                <Sparkles size={27} />
                <h2>A little clarity changes everything.</h2>
                <p>
                  Let’s explore {topic.subject.toLowerCase()} together.
                  <br />
                  What would you like to understand?
                </p>
                <div className="chat-suggestions">
                  {["Explain this simply", "Show an example", "Quiz me"].map(
                    (p) => (
                      <button key={p} onClick={() => void sendChat(p)}>
                        {p}
                        <ArrowUpRight size={14} />
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : (
              chat.map((m, i) => (
                <div className={`chat-message ${m.role}`} key={i}>
                  <span>
                    {m.role === "nova" ? (
                      <Sparkles size={16} />
                    ) : (
                      <User size={16} />
                    )}
                  </span>
                  <div>
                    <p>{m.text}</p>
                    {m.source && (
                      <small>
                        <BookOpen size={12} />
                        {m.source}
                      </small>
                    )}
                    {m.role === "nova" && m.source && (
                      <button
                        className="text-link save-answer"
                        onClick={() => {
                          if (!saveNote(`Nova · ${topic.subject}`, m.text))
                            return;
                          notify("Explanation saved to My Materials.");
                        }}
                      >
                        <Bookmark size={13} />
                        Save to notes
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatBusy && (
              <div className="thinking">
                <span />
                <span />
                <span />
                Nova is connecting the ideas…
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              void sendChat(chatInput);
            }}
          >
            <Sparkles size={19} />
            <input
              aria-label="Your question for Nova"
              placeholder={`Ask about ${topic.subject.toLowerCase()}…`}
              value={chatInput}
              maxLength={2000}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              aria-label="Send question"
              disabled={chatBusy || !chatInput.trim()}
            >
              <Send size={19} />
            </button>
          </form>
          <p className="ai-disclosure">
            Grounded in the starter lesson. Open-ended AI and document analysis
            require a connected provider.
          </p>
        </Modal>
      )}
      {modal === "focus" && (
        <Modal title="A little space to focus." onClose={closeModal}>
          <div className="focus-content">
            <span className="eyebrow">
              {focusFinished ? "SESSION COMPLETED" : nextTopic.title}
            </span>
            <Nova
              size={130}
              mood={
                focusRunning
                  ? "studying"
                  : focusFinished
                    ? "celebrating"
                    : "sleeping"
              }
            />
            <div className="focus-timer" aria-live="off">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}
              <span>:</span>
              {String(seconds % 60).padStart(2, "0")}
            </div>
            <p>
              {focusFinished
                ? "You made time to grow. +100 XP earned."
                : focusRunning
                  ? "One thing at a time. You’re doing enough."
                  : "Find a comfortable spot. Let the rest wait."}
            </p>
            <div className="focus-presets">
              {[15, 25, 50].map((n) => (
                <button
                  key={n}
                  disabled={focusRunning}
                  className={focusMinutes === n ? "selected" : ""}
                  onClick={() => {
                    setFocusMinutes(n);
                    setSeconds(n * 60);
                    focusRemaining.current = n * 60;
                    setFocusFinished(false);
                  }}
                >
                  {n} min
                </button>
              ))}
            </div>
            <div className="focus-controls">
              <button
                aria-label="Reset timer"
                className="icon-button"
                onClick={() => {
                  setFocusRunning(false);
                  setSeconds(focusMinutes * 60);
                  focusRemaining.current = focusMinutes * 60;
                  setFocusFinished(false);
                }}
              >
                <RotateCcw size={20} />
              </button>
              <Button
                onClick={() => {
                  if (focusFinished) {
                    focusRemaining.current = focusMinutes * 60;
                    setSeconds(focusMinutes * 60);
                    setFocusFinished(false);
                  }
                  setFocusRunning((v) => !v);
                }}
              >
                {focusRunning ? <Pause size={19} /> : <Play size={19} />}{" "}
                {focusRunning
                  ? "Pause session"
                  : focusFinished
                    ? "Start another session"
                    : "Start focus"}
              </Button>
              <button
                aria-label={
                  muted ? "Enable ambient sound" : "Mute ambient sound"
                }
                className="icon-button"
                onClick={() => {
                  if (!muted) {
                    void audioRef.current?.suspend();
                    setMuted(true);
                  } else {
                    try {
                      if (!audioRef.current) {
                        const ctx = new AudioContext();
                        const buffer = ctx.createBuffer(
                          1,
                          ctx.sampleRate * 2,
                          ctx.sampleRate,
                        );
                        const data = buffer.getChannelData(0);
                        let last = 0;
                        for (let i = 0; i < data.length; i++) {
                          last = (last + Math.random() * 0.04 - 0.02) / 1.02;
                          data[i] = last * 2;
                        }
                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.loop = true;
                        const gain = ctx.createGain();
                        gain.gain.value = 0.2;
                        source.connect(gain);
                        gain.connect(ctx.destination);
                        source.start();
                        audioRef.current = ctx;
                      }
                      void audioRef.current.resume();
                      setMuted(false);
                    } catch {
                      notify("Ambient audio isn’t available in this browser.");
                    }
                  }
                }}
              >
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
            <small>You can pause any time. Breaks are part of progress.</small>
          </div>
        </Modal>
      )}
      {modal === "auth" && (
        <Modal
          title={
            authMode === "signup"
              ? "Your universe is waiting."
              : "Welcome back, explorer."
          }
          onClose={closeModal}
        >
          <form
            className="auth-form"
            onSubmit={async (e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setAuthBusy(true);
              setAuthError("");
              try {
                setFocusRunning(false);
                await authenticate(authMode, {
                  name: String(form.get("name") || ""),
                  email: String(form.get("email") || ""),
                  password: String(form.get("password") || ""),
                });
                closeModal();
                notify(
                  authMode === "signup"
                    ? "Your account is ready. Personalize your journey in your profile."
                    : "Welcome back. Your progress is ready.",
                );
              } catch (error) {
                setAuthError((error as Error).message);
              } finally {
                setAuthBusy(false);
              }
            }}
          >
            <Nova size={100} />
            <p>
              {authMode === "signup"
                ? "Start a fresh learning journey with progress that follows you."
                : "Sign in to pick up where you left off."}
            </p>
            {authMode === "signup" && (
              <label>
                Your name
                <input
                  name="name"
                  required
                  maxLength={60}
                  placeholder="What should Nova call you?"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                required
                minLength={authMode === "signup" ? 10 : 1}
                maxLength={128}
                placeholder={
                  authMode === "signup"
                    ? "At least 10 characters"
                    : "Your password"
                }
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
              />
            </label>
            {authError && (
              <p className="form-error" role="alert">
                {authError}
              </p>
            )}
            <Button disabled={authBusy}>
              {authBusy
                ? "Opening your universe…"
                : authMode === "signup"
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={16} />
            </Button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setAuthMode(authMode === "signup" ? "login" : "signup");
                setAuthError("");
              }}
            >
              {authMode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
            <p className="form-footnote">
              <Lock size={12} />
              Your password is securely hashed. Your progress stays private.
            </p>
          </form>
        </Modal>
      )}
      {modal === "onboarding" && (
        <Modal
          title={
            onboardStep === 0
              ? "Make this journey yours."
              : onboardStep === 1
                ? "Set a gentle direction."
                : "Meet your biggest little supporter."
          }
          onClose={closeModal}
        >
          <div className="onboarding">
            <Progress value={((onboardStep + 1) / 3) * 100} />
            {onboardStep === 0 ? (
              <>
                <span className="eyebrow">01 · YOUR STARTING POINT</span>
                <label>
                  What should Nova call you?
                  <input
                    value={draft.name === "Explorer" ? "" : draft.name}
                    placeholder="Your first name"
                    maxLength={60}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                  />
                </label>
                <h3>Choose your branch</h3>
                <label>
                  Branch / official paper
                  <select
                    value={draft.branch}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        branch: e.target.value as Branch,
                      }))
                    }
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {branchLabel(b)}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  2027 syllabus for all 30 papers. AIML maps to DA;
                  Cybersecurity maps to CS. TF is a 2026 archive; textile
                  learners can choose XE for 2027.
                </p>
                <Button onClick={() => setOnboardStep(1)}>
                  Find my direction <ArrowRight size={16} />
                </Button>
              </>
            ) : onboardStep === 1 ? (
              <>
                <span className="eyebrow">02 · YOUR PACE, YOUR PLAN</span>
                <label>
                  My target exam
                  <select
                    value={draft.target}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        target: Number(e.target.value),
                      }))
                    }
                  >
                    {[2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>
                        GATE {y}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Time I can comfortably make each day
                  <select
                    value={draft.dailyMinutes}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        dailyMinutes: Number(e.target.value),
                      }))
                    }
                  >
                    {[15, 30, 60, 90, 120, 180].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </label>
                <div className="info-note">
                  <Leaf size={20} />
                  <p>
                    A plan should fit your life. You can change it whenever you
                    need.
                  </p>
                </div>
                <Button onClick={() => setOnboardStep(2)}>
                  Meet Nova <ArrowRight size={16} />
                </Button>
                <button className="text-link" onClick={() => setOnboardStep(0)}>
                  Back
                </button>
              </>
            ) : (
              <div className="nova-introduction">
                <Nova size={180} />
                <h2>
                  “Ready to build your future,
                  <br />
                  one quest at a time?”
                </h2>
                <p>
                  I’m Nova, your companion through the concepts, the questions,
                  and the little victories.
                </p>
                <Button
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      ...draft,
                      name: draft.name.trim() || "Explorer",
                      onboarded: true,
                    }));
                    setSelected(getTopics(draft.branch)[0].id);
                    closeModal();
                    navigate("roadmap");
                    notify(
                      "Your personal starter roadmap is ready. Let’s explore.",
                    );
                  }}
                >
                  Enter my learning universe <Sparkles size={17} />
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
      {modal === "notifications" && (
        <Modal title="A few things from your universe." onClose={closeModal}>
          <div className="notification-list">
            <button
              onClick={() => {
                closeModal();
                startQuest(nextTopic);
              }}
            >
              <span className="quest-icon green">
                <Sun size={21} />
              </span>
              <div>
                <h3>Your next quest is ready</h3>
                <p>
                  {nextTopic.title} · {nextTopic.minutes} minutes of discovery.
                </p>
              </div>
              <ArrowUpRight size={18} />
            </button>
            {mistakes.length > 0 && (
              <button
                onClick={() => {
                  closeModal();
                  navigate("mistakes");
                }}
              >
                <span className="quest-icon purple">
                  <BrainCircuit size={21} />
                </span>
                <div>
                  <h3>A small review could help</h3>
                  <p>
                    {mistakes.length} tricky questions are waiting in your
                    Mistake Bank.
                  </p>
                </div>
                <ArrowUpRight size={18} />
              </button>
            )}
            <div className="notification-note">
              <Leaf size={17} />
              <p>
                No pressure. No endless reminders. Just a little guidance when
                you’re here.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {modal === "note" && (
        <Modal title="Keep a little clarity." onClose={closeModal}>
          <form
            className="note-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                !saveNote(
                  String(f.get("title")).trim(),
                  String(f.get("body")).trim(),
                )
              )
                return;
              closeModal();
              notify("Your note is safe in My Materials.");
            }}
          >
            <label>
              Give your thought a name
              <input
                name="title"
                placeholder="A concept that finally clicked…"
                required
                maxLength={200}
              />
            </label>
            <label>
              Your note
              <textarea
                name="body"
                rows={9}
                placeholder="Make a little room for your ideas."
                required
                maxLength={50000}
              />
            </label>
            <Button>
              Save to my materials <Bookmark size={16} />
            </Button>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={16} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
