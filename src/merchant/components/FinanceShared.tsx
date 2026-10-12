import { useEffect, useRef, type ReactNode } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";

export const panelClass = "rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm";
export function Status({ status }: { status: string }) {
  const Icon = status === "Pending" ? Clock3 : status === "Accepted" ? CheckCircle2 : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        status === "Pending"
          ? "bg-amber-50 text-amber-800"
          : status === "Accepted"
            ? "bg-emerald-50 text-emerald-800"
            : "bg-rose-50 text-rose-800",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}
export function SectionIntro({
  title,
  children,
  page = false,
}: {
  title: string;
  children: ReactNode;
  page?: boolean;
}) {
  const Heading = page ? "h1" : "h2";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Heading
          className={
            page ? "text-2xl font-bold tracking-tight" : "text-xl font-semibold tracking-tight"
          }
        >
          {title}
        </Heading>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
export function Field({
  id,
  label,
  value,
  onChange,
  error,
  options,
  type = "text",
  hint,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options?: Array<string | { value: string; label: string }>;
  type?: string;
  hint?: string;
  inputMode?: "decimal" | "numeric" | "tel";
}) {
  const shared = {
    id,
    value,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(event.target.value),
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {options ? (
        <select
          {...shared}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select an option</option>
          {options.map((item) => {
            const option = typeof item === "string" ? { value: item, label: item } : item;
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>
      ) : (
        <Input {...shared} type={type} inputMode={inputMode} className="h-11" />
      )}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
export function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (Object.keys(errors).length) ref.current?.focus();
  }, [errors]);
  if (!Object.keys(errors).length) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm focus:outline-none"
    >
      <p className="font-semibold">Check the following details</p>
      <ul className="mt-2 space-y-1">
        {Object.entries(errors).map(([id, message]) => (
          <li key={id}>
            <a className="underline underline-offset-2" href={`#${id}`}>
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
export function Summary({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
