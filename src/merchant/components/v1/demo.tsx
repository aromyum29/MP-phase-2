import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { FINANCE_ROLES, type DemoRole } from "./placeholders";

// Iteration 1 demo controls. Stand-ins for what a real backend would decide:
// request failures, the signed-in user's role and the eligibility outcome.
type Eligibility = "eligible" | "not-eligible";
type Settings = { failNext: boolean; role: DemoRole; eligibility: Eligibility };
const DEFAULTS: Settings = { failNext: false, role: "Super Admin", eligibility: "eligible" };
const KEY = "koko-demo-v1";

type DemoContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  consumeFailure: () => boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
};
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const failNext = useRef(false);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setSettings((previous) => ({ ...previous, ...JSON.parse(saved) }));
    } catch {
      /* Defaults apply when storage is unavailable. */
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    failNext.current = settings.failNext;
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* Settings stay in memory. */
    }
  }, [settings]);
  const update = useCallback((patch: Partial<Settings>) => setSettings((previous) => ({ ...previous, ...patch })), []);
  const consumeFailure = useCallback(() => {
    if (!failNext.current) return false;
    failNext.current = false;
    setSettings((previous) => ({ ...previous, failNext: false }));
    return true;
  }, []);
  return (
    <DemoContext.Provider value={{ settings, update, consumeFailure, panelOpen, setPanelOpen }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider is required");
  return value;
}

export function useCanManageFinance() {
  const { settings } = useDemo();
  return (FINANCE_ROLES as readonly string[]).includes(settings.role);
}

export const NETWORK_ERROR = "We couldn't reach Koko, so nothing was sent. Check your connection and try again. Your details are still here.";

// Simulated request: a short delay, then success or a recoverable failure.
export function useAction() {
  const { consumeFailure } = useDemo();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(
    async (perform: () => void, delay = 700) => {
      setPending(true);
      setError(null);
      await new Promise((resolve) => setTimeout(resolve, delay));
      if (consumeFailure()) {
        setPending(false);
        setError(NETWORK_ERROR);
        return false;
      }
      perform();
      setPending(false);
      return true;
    },
    [consumeFailure],
  );
  return { run, pending, error, clearError: () => setError(null) };
}

// First visit to a view in this session shows its loading skeleton briefly.
const seen = new Set<string>();
export function useFirstLoad(key: string, ms = 450) {
  const [loading, setLoading] = useState(() => !seen.has(key));
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      seen.add(key);
      setLoading(false);
    }, ms);
    return () => clearTimeout(timer);
  }, [key, loading, ms]);
  return loading;
}
