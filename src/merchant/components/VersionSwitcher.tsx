import { ChevronUp, Layers, Component } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { usePortalIteration } from "./IterationProvider"
import { cn } from "./ui/utils"

export function VersionSwitcher({ collapsed = false, onOpenComponents }: { collapsed?: boolean; onOpenComponents?: () => void }) {
  const { iteration, setIteration } = usePortalIteration()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Version switcher, Iteration ${iteration}`}
          title={collapsed ? `Version switcher · Iteration ${iteration}` : undefined}
          className={cn(
            "flex w-full items-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            collapsed ? "min-h-11 flex-col justify-center gap-1 py-2" : "gap-3 px-3 py-3 text-left",
          )}
        >
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {collapsed ? (
            <span className="text-xs font-semibold">{iteration}</span>
          ) : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Version switcher</span>
                <span className="mt-1 block text-xs text-muted-foreground">Iteration {iteration}</span>
              </span>
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="z-[60] w-60 rounded-xl p-2 shadow-xl"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Version switcher</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={iteration}
          onValueChange={(value) => {
            if (value === "1" || value === "2") setIteration(value)
          }}
        >
          <DropdownMenuRadioItem value="1" className="min-h-11 cursor-pointer rounded-lg">
            Iteration 1
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="2" className="min-h-11 cursor-pointer rounded-lg">
            Iteration 2
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {iteration === "1" && onOpenComponents && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onOpenComponents} className="min-h-11 cursor-pointer gap-2 rounded-lg">
            <Component className="h-4 w-4" />Modular components
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
