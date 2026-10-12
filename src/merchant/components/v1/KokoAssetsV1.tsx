import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, Eye, ImageOff, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useDemo, useFirstLoad } from "./demo";
import { ASSETS, CATEGORIES, KIT, type AssetV1, type Variant } from "./assets-data";
import { BRAND_COLOURS, BRAND_FONT } from "./placeholders";
import { Btn, Card, FilterChips, PageHeader, SkeletonBlock, StatusBadge, V1Page, fileSize, fmtDate, notify, notifyError } from "./ui";
import { useOptionalParam, useViewParam } from "./url";

const today = () => new Date().toISOString().slice(0, 10);
const isExpired = (asset: AssetV1) => Boolean(asset.validUntil && asset.validUntil < today());
const validity = (asset: AssetV1) => {
  if (!asset.validFrom || !asset.validUntil) return null;
  const from = new Date(asset.validFrom);
  const until = new Date(asset.validUntil);
  const sameMonth = from.getMonth() === until.getMonth() && from.getFullYear() === until.getFullYear();
  return sameMonth
    ? `${from.getDate()}–${fmtDate(asset.validUntil)}`
    : `${fmtDate(asset.validFrom)} – ${fmtDate(asset.validUntil)}`;
};
const describe = (variant: Variant) => `${variant.format} · ${variant.width} × ${variant.height} px · ${fileSize(variant.bytes)}`;

function useDownload() {
  const { consumeFailure } = useDemo();
  return (event: MouseEvent, title: string, detail: string) => {
    if (consumeFailure()) {
      event.preventDefault();
      notifyError("The download didn't start", "Check your connection and try again.");
      return;
    }
    notify(`Downloading ${title}`, detail);
  };
}

export function KokoAssetsV1() {
  const loading = useFirstLoad("koko-assets");
  const [category, setCategory] = useViewParam<string>("category", "All");
  const [queryParam, setQueryParam] = useViewParam<string>("q", "", { replace: true });
  const [query, setQueryState] = useState(queryParam);
  const setQuery = (value: string) => {
    setQueryState(value);
    setQueryParam(value.trim());
  };
  const [previewId, setPreviewId] = useOptionalParam("asset");
  const [guideOpen, setGuideOpen] = useState(false);
  const download = useDownload();
  const searchRef = useRef<HTMLInputElement>(null);

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(
    () =>
      ASSETS.filter((asset) => {
        if (category !== "All" && asset.category !== category) return false;
        const haystack = [asset.title, asset.category, asset.description, ...asset.keywords].join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }).sort((a, b) => Number(isExpired(a)) - Number(isExpired(b))),
    [category, terms.join(" ")],
  );
  const counts = Object.fromEntries(CATEGORIES.map((item) => [item, item === "All" ? ASSETS.length : ASSETS.filter((asset) => asset.category === item).length]));
  const previewIndex = results.findIndex((asset) => asset.id === previewId);
  const preview = previewIndex >= 0 ? results[previewIndex] : ASSETS.find((asset) => asset.id === previewId);

  if (loading) {
    return (
      <V1Page>
        <PageHeader title="Koko assets" description="Logos, artwork and campaign files for your website, social posts and shop." />
        <div className="space-y-4" aria-busy="true" aria-label="Loading assets">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-11 w-full max-w-md" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <SkeletonBlock key={item} className="h-72" />
            ))}
          </div>
        </div>
      </V1Page>
    );
  }

  const status = `${results.length} ${results.length === 1 ? "asset" : "assets"}${category !== "All" ? ` in ${category.toLowerCase()}` : ""}${query.trim() ? ` for “${query.trim()}”` : ""}`;

  return (
    <V1Page>
      <PageHeader
        title="Koko assets"
        description="Logos, artwork and campaign files for your website, social posts and shop."
        actions={
          <Btn variant="secondary" onClick={() => setGuideOpen(true)}>
            <BookOpen aria-hidden="true" />
            Brand guidelines
          </Btn>
        }
      />

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-4 bg-[#eef6fa] p-4 sm:p-5" aria-labelledby="kit-heading">
        <div className="flex -space-x-3" aria-hidden="true">
          {KIT.previews.map((asset) => (
            <span key={asset.id} className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm">
              <img src={asset.url} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="kit-heading" className="text-[16px] font-semibold">
            Starter kit
          </h2>
          <p className="text-[14px] text-muted-foreground">The logo, Koko's Picks, the astronaut and the retail illustration. 4 PNG files · ZIP · {fileSize(KIT.bytes)}</p>
        </div>
        <Btn asChild>
          <a href={KIT.url} download={KIT.filename} onClick={(event) => download(event, "the starter kit", `ZIP · ${fileSize(KIT.bytes)}`)}>
            <Download aria-hidden="true" />
            Download starter kit
          </a>
        </Btn>
      </Card>

      <section aria-labelledby="colours-heading" className="-mx-4 flex items-center gap-x-3 gap-y-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <h2 id="colours-heading" className="shrink-0 text-[14px] font-semibold">
          Brand colours
        </h2>
        {BRAND_COLOURS.map((colour) => (
          <button
            key={colour.hex}
            type="button"
            aria-label={`Copy ${colour.name}, ${colour.hex}`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(colour.hex);
                notify(`Copied ${colour.hex}`, colour.name);
              } catch {
                notifyError("Couldn't copy", `Select and copy ${colour.hex} instead.`);
              }
            }}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-[#6B7280] bg-white py-1 pl-1.5 pr-3 text-[14px] transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 sm:min-h-[34px]"
          >
            <span className="h-6 w-6 rounded-full border border-black/15" style={{ backgroundColor: colour.hex }} aria-hidden="true" />
            <span className="font-medium">{colour.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{colour.hex}</span>
            <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
        ))}
        <span className="shrink-0 text-[14px] text-muted-foreground">Typeface: {BRAND_FONT}</span>
      </section>

      <section aria-labelledby="library-heading" className="space-y-4">
        <h2 id="library-heading" className="sr-only">
          Asset library
        </h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="w-max sm:w-auto">
              <FilterChips label="Asset categories" value={category} onChange={setCategory} items={CATEGORIES.map((item) => ({ value: item, label: item === "All" ? "All assets" : item, count: counts[item] }))} />
            </div>
          </div>
          <div className="relative w-full lg:w-[340px] lg:shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              aria-label="Search assets"
              placeholder="Search logos, banners, posts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-[#6B7280] bg-white pl-10 pr-11 text-[16px] placeholder:text-muted-foreground focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/15 sm:h-10 sm:text-[14px] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <p role="status" className="text-[14px] text-muted-foreground">
          {status}
        </p>

        {results.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((asset) => (
              <li key={asset.id}>
                <AssetCard asset={asset} onPreview={() => setPreviewId(asset.id)} download={download} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#9a9aa6] px-6 py-12 text-center">
            <ImageOff className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-[15px] font-semibold">{query.trim() ? `No assets match “${query.trim()}”` : "No assets in this category yet"}</p>
            <p className="mx-auto mt-1 max-w-md text-[14px] text-muted-foreground">Try a broader word like “logo” or “banner”, or browse another category.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Btn
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
              >
                Show all assets
              </Btn>
            </div>
          </div>
        )}
      </section>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent
          className="koko-v1 max-h-[92dvh] overflow-y-auto sm:max-w-3xl"
          onKeyDown={(event) => {
            if (previewIndex < 0 || results.length < 2) return;
            if (event.key === "ArrowRight") setPreviewId(results[(previewIndex + 1) % results.length].id);
            if (event.key === "ArrowLeft") setPreviewId(results[(previewIndex - 1 + results.length) % results.length].id);
          }}
        >
          {preview && <AssetPreview asset={preview} index={previewIndex} total={results.length} onMove={(step) => setPreviewId(results[(previewIndex + step + results.length) % results.length].id)} download={download} />}
        </DialogContent>
      </Dialog>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="koko-v1 max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Brand guidelines</DialogTitle>
            <DialogDescription>How to use Koko's name, logo and artwork in your marketing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-[14px] leading-relaxed">
            {[
              ["Logo", "Use the logo on white or light backgrounds. Leave clear space around it at least as wide as the letter O. Don't recolour, stretch, rotate or add effects."],
              ["Artwork", "Keep the original colours and proportions. Don't add text over the artwork. Crop from the edges, not the centre."],
              ["Choosing a file", "Each asset lists what its versions are best for. Use the web versions online, they load faster. Use the full-resolution files for print."],
              ["Campaign assets", "Campaign artwork shows specific dates and offers. Share it only while the campaign runs. Downloads turn off when a campaign ends."],
              ["Payments", "Artwork with a QR code is decorative. If customers need to pay, add your own Static QR from the Static QR page."],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </div>
            ))}
            <p className="rounded-xl bg-[#f6f6f8] p-3">Need co-branded material or a size that isn't here? Ask your Koko account manager.</p>
          </div>
        </DialogContent>
      </Dialog>
    </V1Page>
  );
}

function DownloadMenu({ asset, download, align = "end" }: { asset: AssetV1; download: ReturnType<typeof useDownload>; align?: "start" | "end" }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Btn variant="secondary" aria-label={`Download, ${asset.title}`}>
          <Download aria-hidden="true" />
          Download
          <ChevronDown aria-hidden="true" />
        </Btn>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="koko-v1 w-72 p-1.5">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Choose a version</DropdownMenuLabel>
        {asset.variants.map((variant) => (
          <DropdownMenuItem key={variant.url} asChild className="cursor-pointer rounded-lg px-2.5 py-2">
            <a href={variant.url} download={variant.filename} onClick={(event) => download(event, asset.title, `${variant.bestFor} · ${variant.format} · ${fileSize(variant.bytes)}`)}>
              <span className="flex flex-col">
                <span className="text-[14px] font-medium">{variant.bestFor}</span>
                <span className="text-xs text-muted-foreground">
                  {describe(variant)}
                  {variant.note ? ` · ${variant.note}` : ""}
                </span>
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssetCard({ asset, onPreview, download }: { asset: AssetV1; onPreview: () => void; download: ReturnType<typeof useDownload> }) {
  const expired = isExpired(asset);
  const range = validity(asset);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby={`asset-${asset.id}`}>
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${asset.title}`}
        className="group relative flex h-48 w-full items-center justify-center border-b border-border bg-[#f5f7f8] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
      >
        <img src={asset.url} alt="" loading="lazy" className={`h-full w-full object-contain transition-transform duration-200 motion-safe:group-hover:scale-[1.03] ${expired ? "opacity-60 grayscale" : ""}`} />
        <span className="absolute inset-x-0 bottom-3 mx-auto flex w-max items-center gap-1.5 rounded-full bg-gray-900/85 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{asset.category}</span>
          {range && <StatusBadge status={expired ? "Expired" : "Active"} label={expired ? `Ended ${fmtDate(asset.validUntil!)}` : `Valid ${range}`} />}
        </div>
        <div>
          <h3 id={`asset-${asset.id}`} className="text-[16px] font-semibold">
            {asset.title}
          </h3>
          <p className="mt-1 text-[14px] text-muted-foreground">{asset.usage}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {asset.variants.length} {asset.variants.length === 1 ? "version" : "versions"} · from {fileSize(Math.min(...asset.variants.map((variant) => variant.bytes)))}
          </span>
          {expired ? <span className="text-[14px] text-muted-foreground">Downloads off</span> : <DownloadMenu asset={asset} download={download} />}
        </div>
      </div>
    </article>
  );
}

function AssetPreview({
  asset,
  index,
  total,
  onMove,
  download,
}: {
  asset: AssetV1;
  index: number;
  total: number;
  onMove: (step: number) => void;
  download: ReturnType<typeof useDownload>;
}) {
  const expired = isExpired(asset);
  const range = validity(asset);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), [asset.id]);
  return (
    <div className="space-y-5">
      <DialogHeader className="pr-8">
        <DialogTitle ref={heading} tabIndex={-1} className="outline-none">
          {asset.title}
        </DialogTitle>
        <DialogDescription>{asset.description}</DialogDescription>
      </DialogHeader>
      <div className="relative flex h-64 items-center justify-center rounded-xl bg-[#f5f7f8] p-5 sm:h-80">
        <img src={asset.url} alt={asset.title} className={`h-full w-full object-contain ${expired ? "opacity-60 grayscale" : ""}`} />
      </div>
      {index >= 0 && total > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Btn variant="tertiary" size="sm" className="-ml-3" onClick={() => onMove(-1)} aria-label="Previous asset">
            <ChevronLeft aria-hidden="true" />
            Previous
          </Btn>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {index + 1} of {total}
          </span>
          <Btn variant="tertiary" size="sm" className="-mr-3" onClick={() => onMove(1)} aria-label="Next asset">
            Next
            <ChevronRight aria-hidden="true" />
          </Btn>
        </div>
      )}
      <p className="rounded-xl bg-[#f6f6f8] p-3 text-[14px]">{asset.usage}</p>
      {range && (
        <p className="text-[14px]">
          <StatusBadge status={expired ? "Expired" : "Active"} label={expired ? "Campaign ended" : "Campaign running"} />{" "}
          <span className="ml-1 text-muted-foreground">
            {expired ? `This campaign ran ${range}. Downloads are off so ended offers aren't published.` : `Share it between ${range}.`}
          </span>
        </p>
      )}
      {!expired && (
        <section aria-labelledby="versions-heading">
          <h3 id="versions-heading" className="mb-2 text-[15px] font-semibold">
            Versions
          </h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {asset.variants.map((variant) => (
              <li key={variant.url} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block text-[14px] font-medium">{variant.bestFor}</span>
                  <span className="block text-xs text-muted-foreground">
                    {describe(variant)}
                    {variant.note ? ` · ${variant.note}` : ""}
                  </span>
                </span>
                <Btn asChild variant="secondary" size="sm">
                  <a href={variant.url} download={variant.filename} aria-label={`Download, ${variant.bestFor}`} onClick={(event) => download(event, asset.title, `${variant.bestFor} · ${variant.format} · ${fileSize(variant.bytes)}`)}>
                    <Download aria-hidden="true" />
                    Download
                  </a>
                </Btn>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
