import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ArrowRight, Gift, X } from "lucide-react";
import { cn } from "../ui/utils";
import { Btn, Drawer } from "./ui";
import { INTRO_RESET_EVENT, introState } from "./scenarios";
import { VIEW_KEYS, useSetSearch } from "./url";

// Ways to announce new features, shown side by side for the product team
// (Version switcher › New update ideas). Nothing here renders unless an idea
// is switched on (and turned off again from the same menu), so the Main UI is
// unchanged by default.
export type ShowcaseMode = "badges" | "intro" | "whats-new" | "success" | "strip";
export const SHOWCASES: Array<{ id: ShowcaseMode; label: string; description: string }> = [
  {
    id: "badges",
    label: "New badges in the sidebar",
    description: "Marks new pages until they're opened",
  },
  { id: "intro", label: "Explain on arrival", description: "A short intro on the new page itself" },
  {
    id: "whats-new",
    label: "What's new panel",
    description: "Merchants open it from the sidebar when they choose",
  },
  { id: "success", label: "After an order", description: "A one-line note on the success screen" },
  {
    id: "strip",
    label: "Thin banner (current proposal)",
    description: "A dismissible strip above every page",
  },
];

// Pages announced as new, and the sidebar categories that hold them.
const NEW_PAGES = ["bank-account", "merchant-loans", "koko-assets"];
const NEW_GROUPS: Record<string, string[]> = {
  finance: ["bank-account", "merchant-loans"],
  marketing: ["koko-assets"],
};
const UPDATES = [
  {
    page: "merchant-loans",
    image: "/announcements/merchant-credit.png",
    title: "Merchant credit",
    body: "Get funding for your business from a partner bank. Koko helps you apply.",
  },
  {
    page: "koko-assets",
    image: "/announcements/marketing.png",
    title: "Koko assets",
    body: "Download Koko logos, artwork and brand guidelines for your shop and social posts.",
  },
  {
    page: "bank-account",
    image: "/announcements/bank-account.png",
    title: "Bank account",
    body: "See where your payouts go and change the account in a few steps.",
  },
];

type ShowcaseValue = {
  mode: ShowcaseMode | null;
  start: (mode: ShowcaseMode) => void;
  exit: () => void;
  isNew: (page: string) => boolean;
  groupHasNew: (group: string) => boolean;
  markSeen: (page: string) => void;
  whatsNewOpen: boolean;
  whatsNewUnread: boolean;
  openWhatsNew: () => void;
  closeWhatsNew: () => void;
  stripVisible: boolean;
  dismissStrip: () => void;
  go: (page: string | null) => void;
};
const ShowcaseContext = createContext<ShowcaseValue | null>(null);

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const setSearch = useSetSearch();
  const [mode, setMode] = useState<ShowcaseMode | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [whatsNewUnread, setWhatsNewUnread] = useState(true);
  const [stripDismissed, setStripDismissed] = useState(false);
  const go = useCallback(
    (page: string | null) =>
      setSearch({ ...Object.fromEntries(VIEW_KEYS.map((key) => [key, null])), page }),
    [setSearch],
  );
  const start = useCallback(
    (next: ShowcaseMode) => {
      setMode(next);
      setSeen([]);
      setWhatsNewOpen(false);
      setWhatsNewUnread(true);
      setStripDismissed(false);
      if (next === "intro") {
        introState.dismissed = false;
        window.dispatchEvent(new Event(INTRO_RESET_EVENT));
        go("merchant-loans");
      } else go(null);
    },
    [go],
  );
  const value: ShowcaseValue = {
    mode,
    start,
    exit: () => {
      setMode(null);
      setWhatsNewOpen(false);
    },
    isNew: (page) => mode === "badges" && NEW_PAGES.includes(page) && !seen.includes(page),
    groupHasNew: (group) =>
      mode === "badges" && (NEW_GROUPS[group] ?? []).some((page) => !seen.includes(page)),
    markSeen: (page) =>
      setSeen((previous) => (previous.includes(page) ? previous : [...previous, page])),
    whatsNewOpen,
    whatsNewUnread,
    openWhatsNew: () => {
      setWhatsNewOpen(true);
      setWhatsNewUnread(false);
    },
    closeWhatsNew: () => setWhatsNewOpen(false),
    stripVisible: mode === "strip" && !stripDismissed,
    dismissStrip: () => setStripDismissed(true),
    go,
  };
  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

export function useShowcase() {
  const value = useContext(ShowcaseContext);
  if (!value) throw new Error("ShowcaseProvider is required");
  return value;
}

/* ---------- Idea 1: New badges ---------- */

export function NewTag() {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-[#e8edff] px-1.5 py-0.5 text-[12px] font-semibold leading-none text-[#021FA3]">
      New
    </span>
  );
}
export function NewDot() {
  return (
    <span className="h-2 w-2 shrink-0 rounded-full bg-[#021FA3]" role="img" aria-label="New" />
  );
}

/* ---------- Idea 3 (and 5): What's new panel ---------- */

export function WhatsNewButton({ collapsed = false }: { collapsed?: boolean }) {
  const { mode, whatsNewUnread, openWhatsNew } = useShowcase();
  if (mode !== "whats-new") return null;
  return (
    <button
      type="button"
      onClick={openWhatsNew}
      title={collapsed ? "What's new" : undefined}
      aria-label={whatsNewUnread ? "What's new, 3 updates" : "What's new"}
      className={cn(
        "relative mb-2 flex w-full items-center rounded-xl border border-[#BDDCEE] bg-[#f1f7fb] text-sm font-medium text-gray-900 transition-colors hover:bg-[#e6f0f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900",
        collapsed ? "min-h-11 justify-center" : "min-h-11 gap-2.5 px-3",
      )}
    >
      <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span>What's new</span>}
      {whatsNewUnread &&
        (collapsed ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#021FA3]" />
        ) : (
          <span className="ml-auto rounded-full bg-[#021FA3] px-1.5 py-0.5 text-[12px] font-semibold leading-none text-white">
            3
          </span>
        ))}
    </button>
  );
}

export function WhatsNewPanel() {
  const { mode, whatsNewOpen, closeWhatsNew, go } = useShowcase();
  if (mode !== "whats-new" && mode !== "strip") return null;
  return (
    <Drawer
      open={whatsNewOpen}
      onOpenChange={(open) => !open && closeWhatsNew()}
      title="What's new"
      description="Latest updates to your merchant portal · October 2026"
    >
      <ul className="divide-y divide-border">
        {UPDATES.map((update) => (
          <li key={update.page} className="flex gap-4 py-5 first:pt-0">
            <img src={update.image} alt="" width={56} height={56} className="h-14 w-14 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{update.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{update.body}</p>
              <Btn
                variant="tertiary"
                size="sm"
                className="-ml-3 mt-1"
                onClick={() => {
                  closeWhatsNew();
                  go(update.page);
                }}
              >
                Take a look
                <ArrowRight aria-hidden="true" />
              </Btn>
            </div>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}

/* ---------- Idea 4: After an order ---------- */

export function SuccessNote() {
  const { mode, go } = useShowcase();
  if (mode !== "success") return null;
  return (
    <div className="koko-v1 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[#BDDCEE] bg-[#f1f7fb] p-3 text-left">
      <img
        src="/announcements/merchant-credit.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0"
      />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-gray-900">New: Merchant credit</p>
        <p className="text-muted-foreground">Funding for your business, through Koko.</p>
      </div>
      <Btn variant="tertiary" size="sm" onClick={() => go("merchant-loans")}>
        Take a look
        <ArrowRight aria-hidden="true" />
      </Btn>
    </div>
  );
}

/* ---------- Idea 5: Thin banner (the current proposal) ---------- */

export function UpdateStrip() {
  const { stripVisible, dismissStrip, openWhatsNew } = useShowcase();
  if (!stripVisible) return null;
  return (
    <div
      role="region"
      aria-label="Announcement"
      className="relative flex min-h-10 shrink-0 items-center justify-center gap-2 bg-gray-900 px-12 py-2 text-center text-sm text-white"
    >
      <span>
        New: Merchant credit, Koko assets and an easier bank account change.{" "}
        <button
          type="button"
          onClick={openWhatsNew}
          className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          See what's new
        </button>
      </span>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={dismissStrip}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
