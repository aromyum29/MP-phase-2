import { Building2 } from "lucide-react";
import { usePortalIteration } from "./IterationProvider";

const originalLogos: Record<string, string> = {
  "Commercial Bank": "/bank-logos/commercial-bank.svg",
  "Sampath Bank": "/bank-logos/sampath-bank.jpg",
};

// Preserve the 40px component frames and image placement from the Figma set.
const figmaLogos: Record<
  string,
  {
    src: string;
    width: number;
    height: number;
    placement: string;
    background?: string;
    clip?: string;
  }
> = {
  "Commercial Bank": {
    src: "/bank-logos/commercial-bank-figma.jpg",
    width: 40,
    height: 40,
    placement: "-left-px -top-px",
  },
  "Sampath Bank": {
    src: "/bank-logos/sampath-bank-figma.png",
    width: 40,
    height: 40,
    placement: "left-1/2 -top-px -translate-x-1/2",
  },
  "Hatton National Bank": {
    src: "/bank-logos/hnb-figma.png",
    width: 32,
    height: 15.57,
    placement: "left-1/2 top-[calc(50%-0.21px)] -translate-x-1/2 -translate-y-1/2",
  },
  "Bank of Ceylon": {
    src: "/bank-logos/bank-of-ceylon-figma.svg",
    width: 32,
    height: 20,
    placement: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    background: "#f0b310",
  },
  "Nations Trust Bank": {
    src: "/bank-logos/nations-trust-figma.png",
    width: 40,
    height: 39.61,
    placement: "-left-px -top-px h-[39.61px] w-[40px]",
    clip: "absolute left-0 top-0 h-[38px] w-[38px] overflow-hidden rounded-[8px]",
  },
  "DFCC Bank": {
    src: "/bank-logos/dfcc-figma.jpg",
    width: 38,
    height: 38,
    placement: "left-0 top-px h-[38px] w-[38px]",
  },
};

export function BankLogo({ bank }: { bank: string }) {
  const { iteration } = usePortalIteration();
  const logo = iteration === "1" ? figmaLogos[bank] : undefined;

  if (logo) {
    return (
      <div
        className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[6px] border border-black/12 bg-white"
        style={logo.background ? { backgroundColor: logo.background } : undefined}
      >
        {logo.clip ? (
          <div className={logo.clip}>
            <img
              src={logo.src}
              alt={`${bank} logo`}
              width={logo.width}
              height={logo.height}
              className={`pointer-events-none absolute block max-w-none object-cover ${logo.placement}`}
            />
          </div>
        ) : (
          <img
            src={logo.src}
            alt={`${bank} logo`}
            width={logo.width}
            height={logo.height}
            className={`pointer-events-none absolute block max-w-none object-cover ${logo.placement}`}
          />
        )}
      </div>
    );
  }

  const src = originalLogos[bank];
  return src ? (
    <div className="flex h-14 w-28 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-white p-2">
      <img src={src} alt={`${bank} logo`} className="max-h-full w-full object-contain" />
    </div>
  ) : (
    <div className="rounded-xl bg-muted p-3" aria-hidden="true">
      <Building2 className="h-5 w-5" />
    </div>
  );
}
