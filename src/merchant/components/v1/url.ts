import { useState } from "react";

// View state for iteration 1 pages. Kept behind one hook so it can be
// synced to the address bar without touching the pages.
export function useViewParam<T extends string>(key: string, initial: T) {
  void key;
  return useState<T>(initial);
}
export function useOptionalParam(key: string) {
  void key;
  return useState<string | null>(null);
}
