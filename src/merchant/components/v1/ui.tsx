import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  Info,
  Loader2,
  Lock,
  PencilLine,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

// Shared building blocks for the iteration 1 Bank account, Merchant credit and
// Koko assets pages. Sizes are in px because the portal's root font is 14px,
// which shrinks every rem-based Tailwind size.

export const lkr = (value: string | number) =>
  `LKR ${Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Colombo",
  });
export const addBusinessDays = (iso: string, days: number) => {
  const date = new Date(iso);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added += 1;
  }
  return date.toISOString();
};
export const fileSize = (bytes: number) =>
  bytes >= 1000000
    ? `${(bytes / 1000000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;

export const notify = (title: string, description?: string) =>
  toast.success(title, { description, className: "koko-v1-toast" });
export const notifyError = (title: string, description?: string) =>
  toast.error(title, { description, className: "koko-v1-toast koko-v1-toast-error" });

/* ---------- Page structure ---------- */

// Soft fields follow the Create Order form: filled inputs, labels above,
// hints below. Opt in by wrapping a form in <SoftFields>; text, buttons and
// timelines inside it also use the portal's smaller type scale.
const SoftContext = createContext(false);
export function SoftFields({ children }: { children: ReactNode }) {
  return <SoftContext.Provider value={true}>{children}</SoftContext.Provider>;
}
const useSoft = () => useContext(SoftContext);

export function V1Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SoftFields>
      <div className={cn("koko-v1 w-full max-w-[1120px] space-y-6", className)}>{children}</div>
    </SoftFields>
  );
}

// Card surfaces from the Create Order form: a prominent one for main cards
// and flows, a lighter one for lists and grids.
export const SURFACE = "rounded-2xl border border-[#BDDCEE]/50 bg-white shadow-xl";
export const SURFACE_LIGHT =
  "rounded-2xl border border-[#BDDCEE]/50 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.05)]";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className, ...props }: ComponentProps<"section">) {
  const soft = useSoft();
  return (
    <section
      className={cn(
        soft ? SURFACE : "rounded-2xl border border-border bg-card",
        "p-5 sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

/* ---------- Buttons ---------- */

type BtnProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "md" | "sm" | "lg";
  loading?: boolean;
  asChild?: boolean;
  block?: boolean;
};
const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";
const btnVariants = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950",
  secondary: "border border-gray-900 bg-white text-gray-900 hover:bg-gray-50",
  tertiary: "text-gray-900 hover:bg-gray-100",
  danger: "text-[#b4232f] hover:bg-red-50",
};
const btnSizes = {
  md: "min-h-[44px] px-4 text-sm sm:min-h-[38px]",
  sm: "min-h-[44px] px-3 text-sm sm:min-h-[32px]",
  // Matches the Create Order submit button.
  lg: "min-h-[44px] px-6 text-sm font-semibold tracking-wide sm:h-12 sm:min-h-0",
};
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  {
    variant = "primary",
    size = "md",
    loading = false,
    asChild = false,
    block = false,
    className,
    children,
    disabled,
    type,
    ...props
  },
  ref,
) {
  const soft = useSoft();
  const classes = cn(
    btnBase,
    btnVariants[variant],
    btnSizes[size],
    soft && size !== "lg" && "text-sm",
    soft &&
      variant === "secondary" &&
      "border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50",
    block && "w-full sm:w-auto",
    className,
  );
  if (asChild) {
    return (
      <Slot ref={ref} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

// Outlined pill action, used for the stacked actions on summary cards.
// A chevron marks actions that open another view.
type PillActionProps = ComponentProps<"button"> & {
  chevron?: boolean;
  tone?: "default" | "danger";
};
export const PillAction = forwardRef<HTMLButtonElement, PillActionProps>(function PillAction(
  { chevron = false, tone = "default", className, children, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-full border bg-white px-5 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        tone === "danger"
          ? "border-[#c25b67] text-[#b4232f] hover:bg-red-50"
          : "border-[#8e8e9a] text-foreground hover:border-gray-900 hover:bg-gray-50",
        className,
      )}
      {...props}
    >
      <span className="min-w-0">{children}</span>
      {chevron && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </button>
  );
});

const STATUS_BAR = {
  active: "bg-[#eef5ea] text-[#2f6a2a]",
  pending: "bg-amber-50 text-amber-900",
  info: "bg-sky-50 text-sky-900",
};
// Full-width tinted strip at the top of a summary card.
export function StatusBar({
  tone,
  children,
  className,
}: {
  tone: keyof typeof STATUS_BAR;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-xl px-4 py-2.5 text-center text-sm font-medium",
        STATUS_BAR[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

export function BackLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Btn variant="tertiary" size="sm" className="-ml-3" onClick={onClick}>
      <ChevronLeft aria-hidden="true" />
      {children}
    </Btn>
  );
}

// Mobile: pinned to the bottom with the primary action full width.
// Desktop: buttons stay inline after the content.
export function StickyActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky -bottom-4 z-20 -mx-4 -mb-4 flex flex-col gap-1 border-t border-border bg-background px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.04)]",
        "sm:static sm:m-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CopyButton({
  text,
  label = "Copy",
  ariaLabel,
}: {
  text: string;
  label?: string;
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Btn
      variant="tertiary"
      size="sm"
      aria-label={ariaLabel ? `${copied ? "Copied" : label}, ${ariaLabel}` : undefined}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* Clipboard unavailable: the text stays selectable. */
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </Btn>
  );
}

/* ---------- Status and feedback ---------- */

const STATUS: Record<string, { className: string; icon: typeof Clock3; label?: string }> = {
  Pending: {
    className: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: Clock3,
    label: "In review",
  },
  Accepted: { className: "bg-emerald-50 text-emerald-900 ring-emerald-200", icon: CheckCircle2 },
  Approved: { className: "bg-emerald-50 text-emerald-900 ring-emerald-200", icon: CheckCircle2 },
  Active: { className: "bg-emerald-50 text-emerald-900 ring-emerald-200", icon: CheckCircle2 },
  Verified: { className: "bg-emerald-50 text-emerald-900 ring-emerald-200", icon: CheckCircle2 },
  Rejected: {
    className: "bg-rose-50 text-rose-900 ring-rose-200",
    icon: XCircle,
    label: "Declined",
  },
  Cancelled: { className: "bg-slate-100 text-slate-800 ring-slate-200", icon: Ban },
  Draft: { className: "bg-slate-100 text-slate-800 ring-slate-200", icon: PencilLine },
  Expired: { className: "bg-slate-100 text-slate-800 ring-slate-200", icon: Clock3 },
  "Coming soon": { className: "bg-sky-50 text-sky-900 ring-sky-200", icon: Sparkles },
  "Changes requested": { className: "bg-amber-50 text-amber-900 ring-amber-200", icon: PencilLine },
};
export const statusLabel = (status: string) => STATUS[status]?.label ?? status;
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const config = STATUS[status] ?? STATUS.Draft;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label ?? statusLabel(status)}
    </span>
  );
}

const ALERT = {
  info: { className: "border-sky-200 bg-sky-50 text-sky-950", icon: Info },
  warning: { className: "border-amber-200 bg-amber-50 text-amber-950", icon: AlertTriangle },
  error: { className: "border-red-200 bg-red-50 text-red-950", icon: AlertCircle },
  success: { className: "border-emerald-200 bg-emerald-50 text-emerald-950", icon: CheckCircle2 },
  neutral: { className: "border-border bg-[#f6f6f8] text-foreground", icon: Info },
};
export function InlineAlert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof ALERT;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const config = ALERT[tone];
  const Icon = config.icon;
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-wrap gap-3 rounded-xl border p-4 sm:flex-nowrap",
        config.className,
        className,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="mt-1 text-sm leading-relaxed">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

export function ErrorSummary({
  errors,
  focusKey,
}: {
  errors: Record<string, string>;
  focusKey: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(errors);
  useEffect(() => {
    if (focusKey && entries.length) ref.current?.focus();
    // Focus only when a submit produced errors, never while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  if (!entries.length) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-[#b4232f]/40 bg-red-50 p-4 text-red-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b4232f]"
    >
      <p className="text-sm font-semibold">
        {entries.length === 1
          ? "Fix this to continue"
          : `Fix these ${entries.length} things to continue`}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {entries.map(([id, message]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="underline underline-offset-2"
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(id);
                target?.focus();
                target?.scrollIntoView({ block: "center" });
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type TimelineItem = {
  label: string;
  date?: string;
  note?: ReactNode;
  state: "done" | "current" | "upcoming" | "failed";
};
const TIMELINE_STATE = {
  done: "completed",
  current: "in progress",
  upcoming: "not started",
  failed: "not completed",
};
export function Timeline({ items }: { items: TimelineItem[] }) {
  const soft = useSoft();
  const size = soft ? "text-sm" : "text-sm";
  return (
    <ol>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && (
            <span
              className="absolute left-[11px] top-7 bottom-1 w-px bg-border"
              aria-hidden="true"
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-background [&_svg]:h-3.5 [&_svg]:w-3.5",
              item.state === "done" && "border-gray-900 bg-gray-900 text-white",
              item.state === "current" && "border-gray-900",
              item.state === "upcoming" && "border-gray-300",
              item.state === "failed" && "border-[#b4232f] bg-[#b4232f] text-white",
            )}
          >
            {item.state === "done" && <Check />}
            {item.state === "failed" && <X />}
            {item.state === "current" && <span className="h-2 w-2 rounded-full bg-gray-900" />}
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                size,
                "font-medium",
                soft && "text-gray-900",
                item.state === "upcoming" && "text-muted-foreground",
              )}
            >
              {item.label}
              <span className="sr-only">, {TIMELINE_STATE[item.state]}</span>
            </p>
            {item.date && <p className="text-xs text-muted-foreground">{item.date}</p>}
            {item.note && <div className={cn("mt-1 text-muted-foreground", size)}>{item.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DefinitionList({
  items,
  columns = 2,
}: {
  items: Array<[string, ReactNode]>;
  columns?: 1 | 2;
}) {
  const soft = useSoft();
  return (
    <dl className={cn("grid gap-x-8 gap-y-4", columns === 2 && "sm:grid-cols-2")}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt
            className={cn(
              "text-xs text-muted-foreground",
              soft && "font-medium uppercase tracking-wider",
            )}
          >
            {label}
          </dt>
          <dd
            className={cn(
              "break-words",
              soft ? "mt-1 text-base font-semibold text-gray-900" : "mt-0.5 text-base font-medium",
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Tabs and filters ---------- */

// Segmented control: tabs inside a grey track, the selected one raised.
// Arrow keys move between tabs. `controls` names the panel they filter.
export function SegmentedTabs({
  value,
  onChange,
  items,
  label,
  controls,
}: {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string; count?: number }>;
  label: string;
  controls?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (to: number) => {
    const index = (to + items.length) % items.length;
    onChange(items[index].value);
    refs.current[index]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#f3f3f5] p-1"
    >
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={controls}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => {
              const keys: Record<string, number> = {
                ArrowRight: index + 1,
                ArrowLeft: index - 1,
                Home: 0,
                End: items.length - 1,
              };
              if (event.key in keys) {
                event.preventDefault();
                move(keys[event.key]);
              }
            }}
            className={cn(
              "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900",
              active
                ? "bg-white text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="text-xs tabular-nums text-muted-foreground">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Underline tabs with count pills, matching the Orders status tabs.
export function UnderlineTabs({
  value,
  onChange,
  items,
  label,
  controls,
}: {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string; count?: number }>;
  label: string;
  controls?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (to: number) => {
    const index = (to + items.length) % items.length;
    onChange(items[index].value);
    refs.current[index]?.focus();
  };
  return (
    <div className="w-full border-b border-border">
      <div role="tablist" aria-label={label} className="flex gap-4 overflow-x-auto sm:gap-6">
        {items.map((item, index) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={controls}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => {
                const keys: Record<string, number> = {
                  ArrowRight: index + 1,
                  ArrowLeft: index - 1,
                  Home: 0,
                  End: items.length - 1,
                };
                if (event.key in keys) {
                  event.preventDefault();
                  move(keys[event.key]);
                }
              }}
              className={cn(
                "-mb-px flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900",
                active
                  ? "border-gray-900 font-semibold text-gray-900"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs leading-none tabular-nums",
                    active ? "bg-gray-900 text-white" : "bg-[#ececf0] text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterChips({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string; count?: number }>;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex min-h-[44px] items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 sm:min-h-[34px]",
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "text-xs tabular-nums",
                  active ? "text-white/80" : "text-muted-foreground",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Form fields ---------- */

export const describedBy = (
  id: string,
  { hint, error, attention }: { hint?: ReactNode; error?: string; attention?: string },
) =>
  [error && `${id}-error`, !error && attention && `${id}-attention`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ") || undefined;

// Soft fields are grey while empty and turn white once filled or focused.
// Attention marks a field someone (e.g. the bank) asked the merchant to change.
export const fieldClass = (error?: string, soft = false, filled = false, attention = false) =>
  soft
    ? cn(
        "h-[44px] w-full rounded-lg border px-4 text-[16px] text-gray-800 transition-colors placeholder:text-gray-600 focus:bg-white focus:outline-none focus:ring-2 sm:h-12 sm:text-base",
        error || filled ? "bg-white" : "bg-[#f3f3f5]",
        error
          ? "border-[#b4232f] focus:ring-[#b4232f]/20"
          : attention
            ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-200 focus:border-amber-600 focus:ring-amber-300"
            : "border-[#8e8e9a] hover:border-gray-600 focus:border-gray-900 focus:ring-gray-900/20",
      )
    : cn(
        "h-11 w-full rounded-lg border bg-white px-3 text-[16px] text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 sm:h-10 sm:text-sm",
        error
          ? "border-[#b4232f] focus:ring-[#b4232f]/25"
          : "border-[#6B7280] hover:border-gray-700 focus:border-gray-900 focus:ring-gray-900/15",
      );

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="flex items-start gap-1.5 text-xs font-medium text-[#b4232f]">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {error}
    </p>
  );
}

export function FieldAttention({ id, note }: { id: string; note?: string }) {
  if (!note) return null;
  return (
    <p
      id={`${id}-attention`}
      className="flex items-start gap-1.5 text-xs font-medium text-amber-800"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {note}
    </p>
  );
}

// Red star on mandatory fields (Main UI). Screen readers get aria-required instead.
export function RequiredMark() {
  return (
    <span className="ml-0.5 text-[#b4232f]" aria-hidden="true">
      *
    </span>
  );
}
export function RequiredNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Fields marked <span className="text-[#b4232f]">*</span> are required.
    </p>
  );
}

export function FieldShell({
  id,
  label,
  hint,
  error,
  attention,
  optional,
  required,
  aside,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  attention?: string;
  optional?: boolean;
  required?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const soft = useSoft();
  if (soft) {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-sm font-medium text-gray-800">
            {label}
            {required && <RequiredMark />}
            {optional && <span className="font-normal text-gray-500"> (Optional)</span>}
          </label>
          {aside}
        </div>
        {children}
        <FieldError id={id} error={error} />
        {!error && <FieldAttention id={id} note={attention} />}
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && <RequiredMark />}
          {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
        </label>
        {aside}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}

type TextInputProps = Omit<ComponentProps<"input">, "prefix"> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  aside?: ReactNode;
  prefix?: string;
  locked?: boolean;
  attention?: string;
};
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    id,
    label,
    hint,
    error,
    attention,
    optional,
    required,
    aside,
    prefix,
    locked,
    className,
    ...input
  },
  ref,
) {
  const soft = useSoft();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      attention={attention}
      optional={optional}
      required={required}
      aside={aside}
    >
      <div className="relative">
        {prefix && (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 flex items-center text-sm font-medium",
              soft ? "left-4 text-gray-500" : "left-3 text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          readOnly={locked || input.readOnly}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { hint, error, attention })}
          className={cn(
            fieldClass(
              error,
              soft,
              input.value !== undefined && input.value !== null && String(input.value) !== "",
              Boolean(attention),
            ),
            prefix && (soft ? "pl-14" : "pl-12"),
            locked && "cursor-default border-dashed bg-[#f6f6f8] pr-10",
            locked && soft && "text-gray-700 focus:bg-[#f6f6f8]",
            className,
          )}
          {...input}
        />
        {locked && (
          <Lock
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-label="Locked"
          />
        )}
      </div>
    </FieldShell>
  );
});

export function TextArea({
  id,
  label,
  hint,
  error,
  optional,
  required,
  aside,
  className,
  ...input
}: ComponentProps<"textarea"> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  aside?: ReactNode;
}) {
  const soft = useSoft();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      required={required}
      aside={aside}
    >
      <textarea
        id={id}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, { hint, error })}
        className={cn(
          fieldClass(error, soft, Boolean(input.value && String(input.value).trim())),
          "h-auto min-h-[104px] resize-y py-3 leading-relaxed sm:h-auto",
          className,
        )}
        {...input}
      />
    </FieldShell>
  );
}

export function CurrencyInput({
  value,
  onChange,
  ...props
}: Omit<TextInputProps, "value" | "onChange" | "prefix"> & {
  value: string;
  onChange: (digits: string) => void;
}) {
  const display = value ? Number(value).toLocaleString("en-LK") : "";
  return (
    <TextInput
      {...props}
      prefix="LKR"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={(event) =>
        onChange(
          event.target.value
            .replace(/\D/g, "")
            .replace(/^0+(?=\d)/, "")
            .slice(0, 12),
        )
      }
    />
  );
}

export function SelectInput({
  id,
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  options,
  placeholder = "Choose an option",
  attention,
  required,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  attention?: string;
  optional?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const soft = useSoft();
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      attention={attention}
      optional={optional}
      required={required}
    >
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { hint, error, attention })}
          className={cn(
            fieldClass(error, soft, Boolean(value), Boolean(attention)),
            "appearance-none pr-10",
            !value && "text-muted-foreground",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}

export function RadioCards({
  name,
  legend,
  hint,
  error,
  options,
  value,
  onChange,
  columns = 2,
  required,
}: {
  name: string;
  legend: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4 | 5;
}) {
  const grid = {
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[columns];
  const soft = useSoft();
  const hintText = hint && (
    <p id={`${name}-hint`} className="text-xs text-muted-foreground">
      {hint}
    </p>
  );
  return (
    <fieldset className="min-w-0 space-y-1.5">
      <legend
        className={cn("text-sm font-medium", soft ? "mb-2 text-gray-800" : "text-foreground")}
      >
        {legend}
        {required && <RequiredMark />}
      </legend>
      {!soft && hintText}
      <div className={cn("grid gap-2 pt-0.5", grid)}>
        {options.map((option, index) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-900 has-[:focus-visible]:ring-offset-1",
                soft && "px-4 sm:min-h-12",
                checked
                  ? cn(
                      "border-gray-900 font-medium shadow-[inset_0_0_0_1px_rgb(17,24,39)]",
                      soft ? "bg-white text-gray-900" : "bg-gray-50",
                    )
                  : error
                    ? "border-[#b4232f] bg-white"
                    : soft
                      ? "border-[#8e8e9a] bg-[#f3f3f5] text-gray-800 hover:border-gray-600"
                      : "border-[#6B7280] bg-white hover:border-gray-700",
              )}
            >
              <input
                id={index === 0 ? name : undefined}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(name, { hint, error })}
                className="h-4 w-4 shrink-0 accent-gray-900"
              />
              <span className="min-w-0">
                {option.label}
                {option.description && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={name} error={error} />
      {soft && hintText}
    </fieldset>
  );
}

export function Combobox({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  required,
}: {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const soft = useSoft();
  const selected = options.find((option) => option.value === value);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, { hint, error })}
            disabled={disabled}
            className={cn(
              fieldClass(error, soft, Boolean(selected)),
              "flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-[#f6f6f8]",
              !selected && (soft ? "text-gray-600" : "text-muted-foreground"),
            )}
          >
            <span className="truncate">
              {selected ? selected.label : placeholder}
              {selected?.meta && (
                <span className="ml-2 text-xs text-muted-foreground">{selected.meta}</span>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="koko-v1 w-(--radix-popover-trigger-width) min-w-[260px] p-0"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="text-[16px] sm:text-sm" />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.meta ?? ""}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="min-h-[44px] text-sm sm:min-h-[40px]"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        option.value === value ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{option.label}</span>
                    {option.meta && (
                      <span className="text-xs text-muted-foreground">{option.meta}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

const FILE_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};
export function FileDrop({
  id,
  label,
  hint,
  file,
  error,
  onFile,
  onRemove,
  onReject,
  maxBytes = 5 * 1024 * 1024,
  attention,
  required,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  file: File | null;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
  onReject: (message: string) => void;
  maxBytes?: number;
  attention?: string;
}) {
  const [over, setOver] = useState(false);
  const soft = useSoft();
  const input = useRef<HTMLInputElement>(null);
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const take = (candidate?: File) => {
    if (!candidate) return;
    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = FILE_TYPES[candidate.type] || ["pdf", "jpg", "jpeg", "png"].includes(extension);
    if (!allowed) return onReject("Choose a PDF, JPG or PNG file.");
    if (!candidate.size)
      return onReject("That file is empty. Choose another copy of the statement.");
    if (candidate.size > maxBytes)
      return onReject(
        `That file is ${fileSize(candidate.size)}. Choose a file under ${fileSize(maxBytes)}.`,
      );
    if (soft) startUpload(candidate);
    else onFile(candidate);
  };
  // Soft style: a short simulated upload with progress before the file attaches.
  const [uploading, setUploading] = useState<{ file: File; progress: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);
  const startUpload = (candidate: File) => {
    clearInterval(timer.current);
    let progress = 0;
    setUploading({ file: candidate, progress });
    timer.current = setInterval(() => {
      progress = Math.min(100, progress + 10 + Math.random() * 15);
      if (progress >= 100) {
        clearInterval(timer.current);
        setUploading(null);
        onFile(candidate);
      } else setUploading({ file: candidate, progress: Math.round(progress) });
    }, 150);
  };
  const cancelUpload = () => {
    clearInterval(timer.current);
    setUploading(null);
  };
  const typeLabel = (item: File) =>
    FILE_TYPES[item.type] ?? item.name.split(".").pop()?.toUpperCase();
  const hintText = hint && (
    <p id={`${id}-hint`} className="text-xs text-muted-foreground">
      {hint}
    </p>
  );
  return (
    <div className={soft ? "flex min-w-0 flex-col gap-2" : "min-w-0 space-y-1.5"}>
      <p
        id={`${id}-label`}
        className={soft ? "text-sm font-medium text-gray-800" : "text-sm font-medium"}
      >
        {label}
        {required && <RequiredMark />}
      </p>
      {!soft && hintText}
      <input
        ref={input}
        id={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="peer sr-only"
        aria-labelledby={`${id}-label`}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, { hint, error, attention })}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {soft && (
        <span className="sr-only" role="status">
          {uploading ? `Uploading ${uploading.file.name}` : file ? `${file.name} uploaded` : ""}
        </span>
      )}
      {uploading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f3f5] text-gray-600"
              aria-hidden="true"
            >
              <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{uploading.file.name}</p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                Uploading… {uploading.progress}% · {fileSize(uploading.file.size)}
              </p>
            </div>
            <Btn
              variant="tertiary"
              size="sm"
              onClick={cancelUpload}
              aria-label={`Cancel upload, ${uploading.file.name}`}
            >
              Cancel
            </Btn>
          </div>
          <div
            role="progressbar"
            aria-label={`Uploading ${uploading.file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploading.progress}
            className="mt-3 h-1 overflow-hidden rounded-full bg-[#e4e4ea]"
          >
            <div
              className="h-full rounded-full bg-gray-900 transition-[width] duration-150"
              style={{ width: `${uploading.progress}%` }}
            />
          </div>
        </div>
      ) : soft && file ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f3f5] text-gray-700"
            aria-hidden="true"
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate rounded text-sm font-medium text-gray-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                {file.name}
                <span className="sr-only"> (opens a preview in a new tab)</span>
              </a>
            ) : (
              <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            )}
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
              Uploaded · {typeLabel(file)} · {fileSize(file.size)}
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <Btn
              variant="tertiary"
              size="sm"
              className="w-11 px-0 text-gray-600 sm:w-8"
              title="Replace file"
              aria-label={`Replace ${file.name}`}
              onClick={() => input.current?.click()}
            >
              <RefreshCw aria-hidden="true" />
            </Btn>
            <Btn
              variant="tertiary"
              size="sm"
              className="w-11 px-0 text-gray-600 hover:bg-red-50 hover:text-[#b4232f] sm:w-8"
              title="Remove file"
              aria-label={`Remove ${file.name}`}
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
            </Btn>
          </div>
        </div>
      ) : file ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 border bg-white p-3",
            soft ? "rounded-lg border-[#8e8e9a]" : "rounded-xl border-[#6B7280]",
          )}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f1f4]"
            aria-hidden="true"
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {FILE_TYPES[file.type] ?? file.name.split(".").pop()?.toUpperCase()} ·{" "}
              {fileSize(file.size)} · Attached
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {url && (
              <Btn asChild variant="tertiary" size="sm">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Preview
                </a>
              </Btn>
            )}
            <Btn variant="tertiary" size="sm" onClick={() => input.current?.click()}>
              Replace
            </Btn>
            <Btn variant="danger" size="sm" onClick={onRemove}>
              Remove
            </Btn>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragEnter={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            take(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 border-dashed px-4 py-7 text-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2",
            soft ? "rounded-lg border" : "rounded-xl border-2",
            over
              ? "border-gray-900 bg-gray-50"
              : error
                ? "border-[#b4232f] bg-red-50/40"
                : attention
                  ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-200"
                  : soft
                    ? "border-[#8e8e9a] bg-[#f3f3f5] hover:bg-[#ececf0]"
                    : "border-[#6B7280] bg-[#fafafb] hover:bg-gray-50",
          )}
        >
          <UploadCloud className="mb-1 h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <span className={soft ? "text-sm text-gray-800" : "text-sm"}>
            <span className="hidden sm:inline">
              {over ? "Drop the file to attach it" : "Drag a file here or "}
            </span>
            {!over && (
              <span className="font-semibold underline underline-offset-2">Choose a file</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, JPG or PNG · up to {fileSize(maxBytes)}
          </span>
        </label>
      )}
      <FieldError id={id} error={error} />
      {!error && <FieldAttention id={id} note={attention} />}
      {soft && hintText}
    </div>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  children,
  error,
  required,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
  required?: boolean;
}) {
  const soft = useSoft();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-3 border leading-relaxed has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-900",
          soft
            ? cn("rounded-xl p-4 text-sm text-gray-800", checked ? "bg-white" : "bg-[#f3f3f5]")
            : "rounded-lg bg-white p-3 text-sm",
          error && !checked
            ? "border-[#b4232f]"
            : checked
              ? "border-gray-900"
              : soft
                ? "border-[#8e8e9a]"
                : "border-[#6B7280]",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-gray-900"
        />
        <span>
          {children}
          {required && <RequiredMark />}
        </span>
      </label>
      <FieldError id={id} error={error} />
    </div>
  );
}

/* ---------- Drawer ---------- */

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "koko-v1 w-full gap-0 p-0 sm:max-w-[560px] [&>button:last-child]:hidden",
          className,
        )}
      >
        <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-sm text-muted-foreground">
                {description}
              </SheetDescription>
            )}
          </div>
          <SheetClose asChild>
            <Btn variant="tertiary" size="sm" className="-mr-2 -mt-1 w-11 px-0" aria-label="Close">
              <X aria-hidden="true" />
            </Btn>
          </SheetClose>
        </SheetHeader>
        <div
          role="region"
          aria-label="Details"
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900 sm:px-6"
        >
          {children}
        </div>
        {footer && (
          <div className="border-t border-border px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-lg bg-[#ececf0] motion-safe:animate-pulse", className)}
      aria-hidden="true"
    />
  );
}

/* ---------- Flows (Create Order layout) ---------- */

// A task in one centred card: back link, title and subtitle, a slim progress
// bar with the step name, the step's content, then the actions.
export function FlowLayout({
  back,
  logo,
  title,
  subtitle,
  steps,
  current,
  stepTitle,
  headingRef,
  children,
  actions,
}: {
  back?: { label: string; onClick: () => void };
  logo?: ReactNode;
  title: string;
  subtitle: ReactNode;
  steps: string[];
  current: number;
  stepTitle: string;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      {back && <BackLink onClick={back.onClick}>{back.label}</BackLink>}
      <div className={cn(SURFACE, "px-5 py-8 sm:px-12 sm:py-10")}>
        <div className="mb-8 flex flex-col items-center space-y-2 text-center">
          {logo && <div className="mb-2">{logo}</div>}
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mb-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-sm font-semibold text-gray-900 outline-none"
            >
              {stepTitle}
            </h2>
            <p className="shrink-0 text-xs text-muted-foreground">
              Step {current + 1} of {steps.length}
            </p>
          </div>
          <nav aria-label="Progress">
            <ol className="mt-2.5 flex gap-1.5">
              {steps.map((step, index) => (
                <li
                  key={step}
                  aria-current={index === current ? "step" : undefined}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    index <= current ? "bg-gray-900" : "bg-[#e4e4ea]",
                  )}
                >
                  <span className="sr-only">
                    {step}
                    {index < current ? " (completed)" : ""}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        {children}
        <div className="flex flex-col gap-2 pt-8">{actions}</div>
      </div>
    </div>
  );
}

const flowPrimary =
  "w-full shadow-md hover:shadow-lg motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0";
export const FlowPrimary = forwardRef<HTMLButtonElement, BtnProps>(function FlowPrimary(
  { className, ...props },
  ref,
) {
  return <Btn ref={ref} size="lg" className={cn(flowPrimary, className)} {...props} />;
});
export const FlowSecondary = forwardRef<HTMLButtonElement, BtnProps>(function FlowSecondary(
  { className, ...props },
  ref,
) {
  return (
    <Btn
      ref={ref}
      variant="tertiary"
      className={cn("w-full text-gray-700", className)}
      {...props}
    />
  );
});

// Confirmation after a flow: success mark, title, message, reference and timeline.
export function DoneCard({
  title,
  headingRef,
  children,
  reference,
  timeline,
  actions,
}: {
  title: string;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
  reference?: string;
  timeline?: TimelineItem[];
  actions: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className={cn(SURFACE, "px-5 py-8 sm:px-12 sm:py-10")}>
        <div className="mb-8 flex flex-col items-center space-y-2 text-center">
          <span
            className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"
            aria-hidden="true"
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </span>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold tracking-tight text-gray-900 outline-none"
          >
            {title}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">{children}</p>
        </div>
        {reference && (
          <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-[#f3f3f5] px-4 py-2">
            <span className="text-sm text-muted-foreground">Reference</span>
            <span className="font-mono text-sm font-semibold text-gray-900">{reference}</span>
            <CopyButton text={reference} ariaLabel={`reference ${reference}`} />
          </div>
        )}
        {timeline && (
          <div className="mt-7 rounded-xl border border-gray-200 p-5">
            <Timeline items={timeline} />
          </div>
        )}
        <div className="flex flex-col gap-2 pt-8">{actions}</div>
      </div>
    </div>
  );
}

/* ---------- Steps ---------- */

export function StepIndicator({
  steps,
  current,
  onStep,
}: {
  steps: string[];
  current: number;
  onStep?: (index: number) => void;
}) {
  return (
    <nav aria-label="Progress">
      <p className="text-sm text-muted-foreground sm:hidden">
        <span className="font-medium text-foreground">
          Step {current + 1} of {steps.length}
        </span>
        {current < steps.length - 1 && <> · Next: {steps[current + 1]}</>}
      </p>
      <div className="mt-2 flex gap-1.5 sm:hidden" aria-hidden="true">
        {steps.map((step, index) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full",
              index <= current ? "bg-gray-900" : "bg-[#d9d9e0]",
            )}
          />
        ))}
      </div>
      <ol className="hidden gap-2 sm:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const body = (
            <>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done
                    ? "bg-gray-900 text-white"
                    : index === current
                      ? "border-2 border-gray-900 text-gray-900"
                      : "border border-[#9a9aa6] text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  index === current
                    ? "font-semibold text-foreground"
                    : done
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {step}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </>
          );
          return (
            <li
              key={step}
              className="flex min-w-0 flex-1 items-center gap-2 border-t-2 pt-2.5"
              style={{ borderColor: index <= current ? "#111827" : "#d9d9e0" }}
            >
              {done && onStep ? (
                <button
                  type="button"
                  onClick={() => onStep(index)}
                  className="flex items-center gap-2 rounded-md text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                  {body}
                </button>
              ) : (
                <span
                  className="flex items-center gap-2"
                  aria-current={index === current ? "step" : undefined}
                >
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
