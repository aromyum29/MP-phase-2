import { useEffect, useState, type RefObject } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { DialogTitle, DialogDescription } from "./ui/dialog";

export type AnnouncementDestination = "koko-assets" | "bank-account" | "merchant-loans";
export type AnnouncementContent = { variant: "multiple" | "single"; title: string; description: string };
export const defaultAnnouncement: AnnouncementContent = {
  variant: "multiple",
  title: "A few new things, just for you.",
  description: "Meet the latest additions to your merchant portal. Here’s what you can do with them.",
};
export const defaultSingleAnnouncement: AnnouncementContent = {
  variant: "single",
  title: "Meet your new marketing toolkit.",
  description: "Find Koko logos, social artwork and illustrations in one place. Preview a file or download the starter kit for your next campaign.",
};
const highlights: { destination: AnnouncementDestination; image: string; label: string; title: string; description: string }[] = [
  { destination: "koko-assets", image: "marketing", label: "Koko assets", title: "Your next campaign starts here", description: "Download Koko logos and artwork from the new Koko assets library." },
  { destination: "bank-account", image: "bank-account", label: "Bank account", title: "Your bank account, in one place", description: "View your payout account and request a change from Finance." },
  { destination: "merchant-loans", image: "merchant-credit", label: "Merchant credit", title: "Explore Merchant credit", description: "Request business funding and track the bank’s response." },
];

export function AnnouncementBody({ content, onExplore, onContinue, inDialog = false }: {
  content: AnnouncementContent; onExplore: (destination: AnnouncementDestination) => void; onContinue: () => void; inDialog?: boolean;
}) {
  const Title = inDialog ? DialogTitle : "h3";
  const Description = inDialog ? DialogDescription : "p";
  const multiple = content.variant === "multiple";
  return <>
    <div className={`min-h-0 flex-1 overflow-y-auto ${multiple ? "" : "flex flex-col"}`}>
      {multiple ? <>
        <header className="px-6 pb-3 pt-7 sm:px-8">
          <p className="mb-2 pr-8 text-xs font-medium text-muted-foreground">What’s new at Koko · October 2026</p>
          <Title className="max-w-xl pr-3 text-2xl font-semibold leading-tight tracking-tight sm:text-[26px]">{content.title}</Title>
          <Description className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{content.description}</Description>
        </header>
        <ul className="divide-y divide-border/60 px-6 pb-2 sm:px-8">
          {highlights.map(({ destination, image, label, title, description }) => <li key={destination} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[56px_minmax(0,1fr)_auto]">
            <img src={`/announcements/${image}.png`} alt="" width={56} height={56} className="h-[56px] w-[56px] object-contain" />
            <div className="min-w-0"><h4 className="text-sm font-semibold leading-5">{title}</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
            <Button variant="ghost" className="col-start-2 h-11 w-fit gap-2 px-2 text-sm sm:col-start-auto" aria-label={`Explore ${label}`} onClick={() => onExplore(destination)}>Explore<ArrowRight className="h-3.5 w-3.5" /></Button>
          </li>)}
        </ul>
      </> : <div className="my-auto flex shrink-0 flex-col items-center px-7 py-6 text-center sm:px-10">
        <img src="/announcements/marketing-hero.png" alt="" width={144} height={144} className="mb-4 h-[128px] w-[128px] object-contain sm:h-[144px] sm:w-[144px]" />
        <p className="mb-2 text-xs font-medium text-muted-foreground">New in Koko assets</p>
        <Title className="max-w-[440px] text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">{content.title}</Title>
        <Description className="mt-3 max-w-[440px] text-sm leading-relaxed text-muted-foreground">{content.description}</Description>
      </div>}
    </div>
    <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Button variant="ghost" className="h-11" onClick={onContinue}>Dismiss</Button>
      <Button className="h-11 gap-2" onClick={multiple ? onContinue : () => onExplore("koko-assets")}>{multiple ? "Create new order" : "Explore Koko assets"}<ArrowRight className="h-4 w-4" /></Button>
    </footer>
  </>;
}

// Use the real Create Order card bounds, so the announcement replaces it visually
// instead of floating halfway across the sidebar and form.
export function FeatureAnnouncement({ open, onContinue, content = defaultAnnouncement, onExplore, anchorRef }: {
  open: boolean; onContinue: () => void; content?: AnnouncementContent;
  onExplore: (destination: AnnouncementDestination) => void; anchorRef: RefObject<HTMLDivElement | null>;
}) {
  const [bounds, setBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const element = anchorRef.current;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const height = Math.min(rect.height, window.innerHeight - 32);
      setBounds({ left: rect.left, width: rect.width, height, top: Math.max(16, Math.min(rect.top, window.innerHeight - height - 16)) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [open, anchorRef]);
  return <DialogPrimitive.Root open={open} onOpenChange={next => { if (!next) onContinue(); }}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[2px]" />
      <DialogPrimitive.Content style={bounds ?? { visibility: "hidden" }} className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl outline-none">
        <AnnouncementBody content={content} onExplore={onExplore} onContinue={onContinue} inDialog />
        <DialogPrimitive.Close aria-label="Dismiss announcement" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#4c6270] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4" /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
