import { ChevronUp, Layers, Component, FlaskConical, PlayCircle, XCircle } from "lucide-react"
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
import { useDemo } from "./v1/demo"
import { SCENARIOS, useRunScenario } from "./v1/scenarios"
import { SHOWCASES, useShowcase } from "./v1/showcase"
import { cn } from "./ui/utils"

export function VersionSwitcher({ collapsed = false, onOpenComponents, onNavigate }: { collapsed?: boolean; onOpenComponents?: () => void; onNavigate?: () => void }) {
  const { iteration, setIteration } = usePortalIteration()
  const uiName = iteration === "1" ? "Main UI" : "Alternate UI"
  const { setPanelOpen } = useDemo()
  const runScenario = useRunScenario()
  const showcase = useShowcase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Version switcher, ${uiName}`}
          title={collapsed ? `Version switcher · ${uiName}` : undefined}
          className={cn(
            "flex w-full items-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            collapsed ? "min-h-11 flex-col justify-center gap-1 py-2" : "gap-3 px-3 py-3 text-left",
          )}
        >
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {collapsed ? (
            <span className="text-xs font-semibold">{iteration === "1" ? "M" : "A"}</span>
          ) : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">Version switcher</span>
                <span className="mt-1 block text-xs text-muted-foreground">{uiName}</span>
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
        className="z-[60] max-h-[calc(100dvh-120px)] w-72 overflow-y-auto rounded-xl p-2 shadow-xl"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">Version switcher</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={iteration}
          onValueChange={(value) => {
            if (value === "1" || value === "2") setIteration(value)
            if (value === "1") showcase.exit()
          }}
        >
          <DropdownMenuRadioItem value="1" className="min-h-11 cursor-pointer rounded-lg">
            Main UI
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="2" className="min-h-11 cursor-pointer rounded-lg">
            Alternate UI
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {iteration === "1" && onOpenComponents && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onOpenComponents} className="min-h-11 cursor-pointer gap-2 rounded-lg">
            <Component className="h-4 w-4" />Modular components
          </DropdownMenuItem>
        </>}
        {iteration === "1" && <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Scenarios</DropdownMenuLabel>
          {SCENARIOS.map((scenario) => (
            <DropdownMenuItem
              key={scenario.id}
              onSelect={() => { runScenario(scenario.id); onNavigate?.() }}
              className="min-h-11 cursor-pointer items-start gap-2 rounded-lg"
            >
              <PlayCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span>{scenario.label}</span>
                <span className="text-xs text-muted-foreground">{scenario.description}</span>
              </span>
            </DropdownMenuItem>
          ))}
          {showcase.mode && (
            <DropdownMenuItem onSelect={() => showcase.exit()} className="min-h-11 cursor-pointer gap-2 rounded-lg">
              <XCircle className="h-4 w-4" />Turn off update idea
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">New update ideas</DropdownMenuLabel>
          {SHOWCASES.map((item, index) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => { showcase.start(item.id); onNavigate?.() }}
              className="min-h-11 cursor-pointer items-start gap-2 rounded-lg"
            >
              <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold", showcase.mode === item.id ? "bg-gray-900 text-white" : "bg-muted text-foreground")} aria-hidden="true">{index + 1}</span>
              <span className="flex flex-col">
                <span>{item.label}{showcase.mode === item.id && <span className="sr-only"> (showing)</span>}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </>}
        {iteration === "1" && (
          <DropdownMenuItem onSelect={() => setPanelOpen(true)} className="min-h-11 cursor-pointer gap-2 rounded-lg">
            <FlaskConical className="h-4 w-4" />Demo panel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
