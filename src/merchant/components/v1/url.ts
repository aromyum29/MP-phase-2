import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

// Iteration 1 view state lives in the address bar (?page=…&tab=…), so reload,
// Back/Forward and shared links land on the same view. Several updates made in
// one event are merged into a single navigation.
type Value = string | number | null;
type Navigate = (options: unknown) => unknown;

let pending: Record<string, Value> = {};
let pendingReplace = true;
let scheduled = false;
let navigateRef: Navigate | null = null;

function flush() {
  scheduled = false;
  const patch = pending;
  const replace = pendingReplace;
  pending = {};
  pendingReplace = true;
  navigateRef?.({
    to: "/",
    replace,
    resetScroll: false,
    search: (previous: Record<string, unknown>) => {
      const next: Record<string, unknown> = { ...previous };
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") delete next[key];
        // Numbers stay numbers so the router doesn't quote them (?step=2).
        else next[key] = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
      }
      return next;
    },
  });
}

export function useSearchValue(key: string): string | null {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const value = search[key];
  return value === undefined || value === null || value === "" ? null : String(value);
}

export function useSetSearch() {
  const navigate = useNavigate();
  navigateRef = navigate as unknown as Navigate;
  return useCallback((patch: Record<string, Value>, options?: { replace?: boolean }) => {
    Object.assign(pending, patch);
    if (!options?.replace) pendingReplace = false;
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
  }, []);
}

export function useViewParam<T extends string>(key: string, initial: T, options?: { replace?: boolean }) {
  const value = (useSearchValue(key) ?? initial) as T;
  const set = useSetSearch();
  const update = useCallback(
    (next: T, override?: { replace?: boolean }) => set({ [key]: next === initial ? null : next }, override ?? options),
    [set, key, initial, options?.replace],
  );
  return [value, update] as const;
}

export function useOptionalParam(key: string, options?: { replace?: boolean }) {
  const value = useSearchValue(key);
  const set = useSetSearch();
  const update = useCallback(
    (next: string | null, override?: { replace?: boolean }) => set({ [key]: next }, override ?? options),
    [set, key, options?.replace],
  );
  return [value, update] as const;
}

// Keys owned by the iteration 1 pages; cleared when the page changes.
export const VIEW_KEYS = ["tab", "status", "apply", "step", "request", "change", "category", "q", "asset"];
