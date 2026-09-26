import { useState, useEffect, useRef, useCallback } from "react";
import { emptyProgress, type ProgressState } from "./engine";
import { isNativeApp } from "./platform";
import { validProgress } from "./progress-schema.js";
export type User = { id: string; name: string; email: string };
const guestKey = "gatenova:guest:v1";
function readGuest() {
  try {
    const s = JSON.parse(localStorage.getItem(guestKey) || "null");
    return validProgress(s) ? s : emptyProgress();
  } catch {
    return emptyProgress();
  }
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api(path: string, options: RequestInit = {}) {
  if (isNativeApp)
    throw new ApiError(
      "This Android edition saves your learning on your phone. Cloud accounts are available in the hosted web edition.",
      503,
    );
  const r = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (r.status === 204) return {};
  const json = await r.json();
  if (!r.ok) throw new ApiError(json.error || "Please try again.", r.status);
  return json;
}
// Merge append-only learning records by stable identity. A retry keeps this tab's
// preferences and preserves notes/attempts created by another tab.
function mergeProgress(
  remote: ProgressState,
  local: ProgressState,
): ProgressState {
  const unique = <T,>(list: T[], key: (item: T) => string) => [
    ...new Map(list.map((x) => [key(x), x])).values(),
  ];
  return {
    ...remote,
    ...local,
    completed: [...new Set([...remote.completed, ...local.completed])],
    attempts: unique(
      [...remote.attempts, ...local.attempts],
      (a) => `${a.questionId}:${a.at}`,
    ),
    sessions: unique([...remote.sessions, ...local.sessions], (s) => s.id),
    notes: unique([...remote.notes, ...local.notes], (n) => n.id),
  };
}
export function useProgress() {
  const [state, setState] = useState<ProgressState>(readGuest);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(isNativeApp);
  const [syncError, setSyncError] = useState("");
  const saving = useRef(false),
    pending = useRef<ProgressState | null>(null),
    currentUser = useRef<User | null>(null),
    revision = useRef(0);
  useEffect(() => {
    if (isNativeApp) {
      setReady(true);
      return;
    }
    let live = true;
    api("/auth/me")
      .then(async ({ user }) => {
        const { state: s, revision: r } = await api("/progress");
        if (live) {
          revision.current = r;
          currentUser.current = user;
          setUser(user);
          setState(s || { ...emptyProgress(), name: user.name });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const save = useCallback(async () => {
    if (saving.current || !currentUser.current) return;
    saving.current = true;
    while (pending.current) {
      const next = pending.current;
      pending.current = null;
      try {
        const result = await api("/progress", {
          method: "PUT",
          body: JSON.stringify({ state: next, revision: revision.current }),
        });
        revision.current = result.revision;
        setSyncError("");
      } catch (error) {
        if (!pending.current) pending.current = next;
        setSyncError(
          error instanceof ApiError && error.status === 409
            ? "Another tab has new progress. Retry sync to merge your learning activity."
            : "Your latest changes haven’t synced. Keep this tab open and retry.",
        );
        break;
      }
    }
    saving.current = false;
  }, []);
  const retry = useCallback(async () => {
    if (!currentUser.current || saving.current) return;
    try {
      const { state: remote, revision: r } = await api("/progress");
      revision.current = r;
      if (remote && pending.current) {
        const merged = mergeProgress(remote, pending.current);
        pending.current = merged;
        setState(merged);
      }
      await save();
    } catch {
      setSyncError("Nova couldn’t sync yet. Keep this tab open and try again.");
    }
  }, [save]);
  useEffect(() => {
    if (!ready) return;
    if (user) {
      pending.current = state;
      const timer = setTimeout(() => void save(), 400);
      return () => clearTimeout(timer);
    }
    try {
      localStorage.setItem(guestKey, JSON.stringify(state));
      setSyncError("");
    } catch {
      setSyncError(
        "Device storage is full. Your latest changes are only in this tab.",
      );
    }
  }, [state, user, ready, save]);
  useEffect(() => {
    const preventLoss = (e: BeforeUnloadEvent) => {
      if (pending.current || saving.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, []);
  async function authenticate(
    mode: "login" | "signup",
    fields: { name: string; email: string; password: string },
  ) {
    const { user: u } = await api(`/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(fields),
    });
    const { state: s, revision: r } = await api("/progress");
    pending.current = null;
    revision.current = r;
    currentUser.current = u;
    setState(s || { ...emptyProgress(), name: u.name });
    setUser(u);
    setSyncError("");
  }
  async function logout() {
    if (saving.current || pending.current)
      throw new Error("Wait for progress to sync before signing out.");
    await api("/auth/logout", { method: "POST" });
    currentUser.current = null;
    setUser(null);
    setState(readGuest());
    setSyncError("");
  }
  return {
    state,
    setState,
    user,
    ready,
    syncError,
    retry,
    authenticate,
    logout,
  };
}
