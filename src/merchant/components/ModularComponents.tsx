import { useState } from "react";
import { ArrowRight, Layers, Square, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { AnnouncementBody, defaultAnnouncement, defaultSingleAnnouncement, type AnnouncementContent } from "./FeatureAnnouncement";

export function ModularComponents({ onSimulateEntry, onContinue }: {
  onSimulateEntry: (content: AnnouncementContent) => void; onContinue: () => void;
}) {
  const [variant, setVariant] = useState<AnnouncementContent["variant"]>("multiple");
  const [drafts, setDrafts] = useState({ multiple: defaultAnnouncement, single: defaultSingleAnnouncement });
  const content = drafts[variant];
  const ready = Boolean(content.title.trim() && content.description.trim());
  const update = (key: "title" | "description", value: string) => setDrafts(previous => ({ ...previous, [variant]: { ...previous[variant], [key]: value } }));
  return <div className="mx-auto max-w-6xl space-y-7">
    <header><h1 className="text-2xl font-bold tracking-tight">Modular components</h1><p className="mt-2 text-sm text-muted-foreground">Reusable patterns for introducing what’s new in the merchant portal.</p></header>
    <Tabs value={variant} onValueChange={value => setVariant(value as AnnouncementContent["variant"])}>
      <TabsList aria-label="Announcement type" className="h-auto w-full sm:w-fit"><TabsTrigger value="multiple" className="min-h-11 gap-2"><Layers className="h-4 w-4" />Multiple updates</TabsTrigger><TabsTrigger value="single" className="min-h-11 gap-2"><Square className="h-4 w-4" />Single update</TabsTrigger></TabsList>
    </Tabs>
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(240px,0.65fr)_minmax(0,1.35fr)]">
      <section className="space-y-5" aria-label="Feature announcement settings">
        <div><h2 className="text-xl font-semibold tracking-tight">{variant === "multiple" ? "A quick look at what’s new." : "One feature. Room to explore."}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{variant === "multiple" ? "Introduce several updates at once, right after merchants sign in. One action takes them on to creating an order." : "Give a major update more attention with a larger visual and a short explanation, then continue to creating an order."}</p></div>
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="announcement-title">Headline</Label><Input id="announcement-title" value={content.title} maxLength={90} onChange={event => update("title", event.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="announcement-description">Introduction</Label><Textarea id="announcement-description" value={content.description} maxLength={240} rows={3} onChange={event => update("description", event.target.value)} className="resize-none" /></div>
          {!ready && <p role="status" className="text-sm text-muted-foreground">Add a headline and introduction to preview the announcement.</p>}
        </div>
        <Button disabled={!ready} className="h-11 w-full gap-2" onClick={() => onSimulateEntry(content)}>Preview after login<ArrowRight className="h-4 w-4" /></Button>
        <p className="text-xs leading-relaxed text-muted-foreground">The preview shows the announcement on the login background, where merchants see it right after signing in. Create new order continues to the portal.</p>
        <Button variant="ghost" className="h-10 px-0 text-muted-foreground" onClick={() => setDrafts(previous => ({ ...previous, [variant]: variant === "multiple" ? defaultAnnouncement : defaultSingleAnnouncement }))}><RotateCcw className="h-4 w-4" />Reset this template</Button>
      </section>
      <section aria-label="Announcement preview" className="min-w-0">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Merchant view</span><span>{variant === "multiple" ? "Multiple updates" : "Single update"}</span></div>
        <div className="flex flex-col overflow-hidden rounded-2xl border bg-background shadow-sm"><AnnouncementBody content={content} onContinue={onContinue} /></div>
      </section>
    </div>
  </div>;
}
