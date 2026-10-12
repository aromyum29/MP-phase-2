import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight } from "lucide-react";
import { DialogTitle, DialogDescription } from "./ui/dialog";
import { Container3 as LoginBackground } from "./Login";
import imgKokoLogo from "figma:asset/2fb784bf4eb111e438185f3f72d368e7963516ad.png";

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
const highlights: { destination: AnnouncementDestination; image: string; title: string; description: string }[] = [
  { destination: "koko-assets", image: "marketing", title: "Your next campaign starts here", description: "Download Koko logos and artwork from the new Koko assets library." },
  { destination: "bank-account", image: "bank-account", title: "Your bank account, in one place", description: "View your payout account and request a change from Finance." },
  { destination: "merchant-loans", image: "merchant-credit", title: "Explore Merchant credit", description: "Request business funding and track the bank’s response." },
];

// Both templates end in a single action: Create new order. Feature rows are
// informational, so there are no Explore or Dismiss buttons.
export function AnnouncementBody({ content, onContinue, inDialog = false }: {
  content: AnnouncementContent; onContinue: () => void; inDialog?: boolean;
}) {
  const Title = inDialog ? DialogTitle : "h3";
  const Description = inDialog ? DialogDescription : "p";
  const multiple = content.variant === "multiple";
  return <>
    <div className={`min-h-0 flex-1 overflow-y-auto ${multiple ? "" : "flex flex-col"}`}>
      {multiple ? <>
        <header className="px-6 pb-3 pt-7 sm:px-10 sm:pt-9">
          <p className="mb-2 text-xs font-medium text-muted-foreground">What’s new at Koko · October 2026</p>
          <Title className="max-w-xl text-2xl font-bold leading-tight tracking-tight text-gray-900">{content.title}</Title>
          <Description className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{content.description}</Description>
        </header>
        <ul className="divide-y divide-border/60 px-6 pb-2 sm:px-10">
          {highlights.map(({ destination, image, title, description }) => <li key={destination} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 py-3.5">
            <img src={`/announcements/${image}.png`} alt="" width={56} height={56} className="h-[56px] w-[56px] object-contain" />
            <div className="min-w-0"><h4 className="text-sm font-semibold leading-5 text-gray-900">{title}</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
          </li>)}
        </ul>
      </> : <div className="my-auto flex shrink-0 flex-col items-center px-7 pb-4 pt-8 text-center sm:px-10 sm:pt-10">
        <img src="/announcements/marketing-hero.png" alt="" width={144} height={144} className="mb-4 h-[128px] w-[128px] object-contain sm:h-[144px] sm:w-[144px]" />
        <p className="mb-2 text-xs font-medium text-muted-foreground">New in Koko assets</p>
        <Title className="max-w-[440px] text-2xl font-bold leading-tight tracking-tight text-gray-900">{content.title}</Title>
        <Description className="mt-3 max-w-[440px] text-sm leading-relaxed text-muted-foreground">{content.description}</Description>
      </div>}
    </div>
    <footer className="shrink-0 px-6 pb-7 pt-5 sm:px-10 sm:pb-9">
      <button type="button" onClick={onContinue} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 text-sm font-semibold tracking-wide text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0">
        Create new order<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </footer>
  </>;
}

// Shown right after sign-in, on the login page's background, in place of the
// login card. Create new order (or Escape) continues to the portal.
export function FeatureAnnouncement({ open, onContinue, content = defaultAnnouncement }: {
  open: boolean; onContinue: () => void; content?: AnnouncementContent;
}) {
  return <DialogPrimitive.Root open={open} onOpenChange={next => { if (!next) onContinue(); }}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 overflow-hidden bg-[#F3E8FF]" style={{ backgroundImage: "linear-gradient(149.739deg, rgb(189, 220, 238) 0%, rgb(224, 231, 255) 35%, rgb(243, 232, 255) 70%, rgb(252, 231, 243) 100%)" }}>
        <LoginBackground />
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content onPointerDownOutside={event => event.preventDefault()} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-y-auto px-4 py-6 outline-none">
        <img alt="Koko" src={imgKokoLogo} className="h-10 w-auto shrink-0 object-contain" />
        <div className={`flex max-h-[calc(100dvh-120px)] w-full flex-col overflow-hidden rounded-2xl border border-[#BDDCEE]/50 bg-white/80 shadow-xl backdrop-blur-md ${content.variant === "multiple" ? "max-w-xl" : "max-w-md"}`}>
          <AnnouncementBody content={content} onContinue={onContinue} inDialog />
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
