import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type PortalIteration = "1" | "2"

const STORAGE_KEY = "koko-portal-iteration"
const IterationContext = createContext<{
  iteration: PortalIteration
  setIteration: (iteration: PortalIteration) => void
} | null>(null)

export function IterationProvider({ children }: { children: ReactNode }) {
  const [iteration, updateIteration] = useState<PortalIteration>("1")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "1" || saved === "2") updateIteration(saved)
    } catch {
      // The switcher still works when browser storage is unavailable.
    }
  }, [])

  const setIteration = (next: PortalIteration) => {
    updateIteration(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Keep the selection for this session when persistence is unavailable.
    }
  }

  return (
    <IterationContext.Provider value={{ iteration, setIteration }}>
      {children}
    </IterationContext.Provider>
  )
}

export function usePortalIteration() {
  const context = useContext(IterationContext)
  if (!context) throw new Error("usePortalIteration requires IterationProvider")
  return context
}
