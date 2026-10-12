import { useState } from "react"
import { Download, Search, ArrowDownToLine, ImageIcon, BookOpen } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import catalogue from "./koko-assets-data.json"

const categories = ["All assets", "Logos", "Social media", "Illustrations", "Campaigns"]
type Asset = (typeof catalogue.assets)[number]
const fileSize = (bytes: number) => bytes >= 1000000 ? `${(bytes / 1000000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`

function DownloadAsset({ asset }: { asset: Asset }) {
  return <Button asChild variant="outline" className="h-11"><a href={asset.url} download={asset.filename} aria-label={`Download ${asset.title}`}><Download className="h-4 w-4" />Download</a></Button>
}

export function KokoAssets() {
  const [category, setCategory] = useState("All assets")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Asset | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const filtered = catalogue.assets.filter(asset => (category === "All assets" || asset.category === category) && `${asset.title} ${asset.category} ${asset.description}`.toLowerCase().includes(query.trim().toLowerCase()))

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight">Koko assets</h1><p className="mt-1 text-muted-foreground">Everything you need to bring Koko into your marketing.</p></div>
      <Button variant="outline" className="h-11 self-start" onClick={() => setGuideOpen(true)}><BookOpen className="h-4 w-4" />Using these assets</Button>
    </div>

    <section className="relative overflow-hidden rounded-2xl border border-[#bdddee] bg-[#eaf5fa] p-6 text-[#243746] sm:p-8">
      <div className="relative z-10 max-w-lg space-y-3 sm:pr-24">
        <p className="text-xs font-semibold uppercase tracking-widest">The essentials, together</p>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Start with the Koko kit</h2>
        <p className="text-sm leading-6">Our logo, astronaut and two illustrations. Ready for your next website update or social post.</p>
        <Button asChild className="mt-2 h-11 bg-[#243746] text-white hover:bg-[#344b5e]"><a href="/koko-assets/koko-starter-kit.zip" download="koko-starter-kit.zip"><ArrowDownToLine className="h-4 w-4" />Download starter kit</a></Button>
        <p className="text-xs text-[#4d6474]">4 PNG files · ZIP · {fileSize(catalogue.kitBytes)}</p>
      </div>
      <img src="/koko-assets/koko-logo.png" alt="" className="absolute right-8 top-1/2 hidden w-52 -translate-y-1/2 object-contain xl:block" />
    </section>

    <section aria-label="Asset library" className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Asset categories">
          {categories.map(item => <Button key={item} variant={category === item ? "default" : "outline"} aria-pressed={category === item} onClick={() => setCategory(item)} className={`h-11 rounded-full px-4 ${category === item ? "bg-[#BDDDEE] text-[#243746] hover:bg-[#a9d2e7]" : ""}`}>{item}<span className="text-xs opacity-70">{item === "All assets" ? catalogue.assets.length : catalogue.assets.filter(a => a.category === item).length}</span></Button>)}
        </div>
        <div className="relative w-full xl:w-64 xl:shrink-0"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Search assets" placeholder="Search assets" value={query} onChange={event => setQuery(event.target.value)} className="h-11 pl-10" /></div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "asset" : "assets"}{category !== "All assets" ? ` in ${category.toLowerCase()}` : " available"}</p>
      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
        {filtered.map(asset => <article key={asset.id} className="overflow-hidden rounded-xl border bg-card">
          <button onClick={() => setSelected(asset)} aria-label={`Preview ${asset.title}`} className="group relative flex h-52 w-full items-center justify-center border-b bg-[#f5f7f8] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            <img src={asset.url} alt={asset.title} loading="lazy" className="h-full w-full object-contain transition-transform duration-200 motion-safe:group-hover:scale-[1.03]" />
            <span className="absolute right-3 top-3 rounded-md border bg-white px-2 py-1 text-xs font-medium text-[#243746]">{asset.format}</span>
          </button>
          <div className="space-y-4 p-5"><div><p className="mb-1 text-xs text-muted-foreground">{asset.category}{asset.id === "avurudu" ? " · Sample" : ""}</p><h3 className="font-semibold">{asset.title}</h3><p className="mt-1 text-xs text-muted-foreground">{asset.width} × {asset.height} px · {fileSize(asset.bytes)}</p></div><div className="flex items-center justify-between gap-2"><Button variant="ghost" className="h-11 px-2" onClick={() => setSelected(asset)}>Preview</Button><DownloadAsset asset={asset} /></div></div>
        </article>)}
      </div>
      {!filtered.length && <div className="rounded-xl border border-dashed px-6 py-16 text-center"><ImageIcon className="mx-auto mb-4 h-8 w-8 text-muted-foreground" /><h3 className="font-semibold">No assets found</h3><p className="mt-2 text-sm text-muted-foreground">Try a different search or browse all assets.</p><Button variant="outline" className="mt-5 h-11" onClick={() => { setQuery(""); setCategory("All assets") }}>Clear filters</Button></div>}
    </section>

    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">{selected && <><DialogHeader><DialogTitle>{selected.title}</DialogTitle><DialogDescription>{selected.description}</DialogDescription></DialogHeader><div className="flex h-64 items-center justify-center rounded-lg bg-[#f5f7f8] p-5 sm:h-80"><img src={selected.url} alt={selected.title} className="h-full w-full object-contain" /></div><div className="flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-muted-foreground">{selected.format} · {selected.width} × {selected.height} px · {fileSize(selected.bytes)}</p><DownloadAsset asset={selected} /></div></>}</DialogContent></Dialog>
    <Dialog open={guideOpen} onOpenChange={setGuideOpen}><DialogContent><DialogHeader><DialogTitle>Using Koko assets</DialogTitle><DialogDescription>A few practical tips for your marketing.</DialogDescription></DialogHeader><div className="space-y-5 text-sm leading-6"><div><h3 className="font-semibold">Keep the artwork clear</h3><p className="text-muted-foreground">Keep the original colours and proportions. Leave space around the logo and choose a background that makes it easy to see.</p></div><div><h3 className="font-semibold">Choose a file for your channel</h3><p className="text-muted-foreground">Use square artwork for social posts and landscape artwork for wider placements. Check the pixel dimensions before enlarging an image.</p></div><div><h3 className="font-semibold">Check campaign details</h3><p className="text-muted-foreground">Campaign samples include specific dates and offers. Confirm that these apply to your promotion before sharing.</p></div></div></DialogContent></Dialog>
  </div>
}
