import catalogue from "../tools/koko-assets-data.json";

// Iteration 1 asset catalogue: search keywords, a usage note and downloads
// labelled by use. Variant files live in public/koko-assets/variants and are
// generated from the originals. Vector masters (SVG/EPS) are still needed
// from the brand team.
export type Variant = {
  bestFor: string;
  url: string;
  filename: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  note?: string;
};
export type AssetV1 = (typeof catalogue.assets)[number] & {
  keywords: string[];
  usage: string;
  variants: Variant[];
  validFrom?: string;
  validUntil?: string;
};

const base = Object.fromEntries(catalogue.assets.map((asset) => [asset.id, asset]));
const original = (id: string, bestFor: string, note?: string): Variant => {
  const asset = base[id];
  return {
    bestFor,
    url: asset.url,
    filename: asset.filename,
    format: asset.format,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes,
    note,
  };
};
const variant = (
  file: string,
  bestFor: string,
  format: string,
  width: number,
  height: number,
  bytes: number,
  note?: string,
): Variant => ({
  bestFor,
  url: `/koko-assets/variants/${file}`,
  filename: file,
  format,
  width,
  height,
  bytes,
  note,
});

const extra: Record<string, Omit<AssetV1, keyof (typeof catalogue.assets)[number]>> = {
  logo: {
    keywords: ["logo", "wordmark", "brand", "transparent", "website", "email", "print"],
    usage:
      "Use on white or light backgrounds. Leave space around it at least as wide as the letter O.",
    variants: [
      variant(
        "koko-logo-web.png",
        "Websites and email",
        "PNG",
        600,
        300,
        79289,
        "Transparent background",
      ),
      original("logo", "Print and large displays", "Transparent background"),
      variant(
        "koko-logo-on-white.jpg",
        "Documents and slides",
        "JPG",
        2000,
        1000,
        198755,
        "White background",
      ),
    ],
  },
  social: {
    keywords: ["social", "instagram", "facebook", "post", "story", "whatsapp", "square", "picks"],
    usage: "Post as it is. Don't add text over the artwork.",
    variants: [
      variant("koko-picks-post.jpg", "Instagram and Facebook posts", "JPG", 1080, 1080, 238433),
      variant("koko-picks-story.jpg", "Stories and WhatsApp status", "JPG", 1080, 1920, 250530),
      original("social", "Original artwork"),
    ],
  },
  mascot: {
    keywords: ["astronaut", "mascot", "character", "sticker", "illustration", "transparent"],
    usage: "Keep the character's colours and proportions. Don't crop the helmet.",
    variants: [
      original("mascot", "Websites and layouts", "Transparent background"),
      variant(
        "koko-astronaut-512.png",
        "Stickers and small spaces",
        "PNG",
        512,
        512,
        53800,
        "Transparent background",
      ),
    ],
  },
  pattern: {
    keywords: ["illustration", "retail", "shop", "store", "poster", "background", "print"],
    usage: "Works as a background or poster. Crop from the edges, not the centre.",
    variants: [
      variant("koko-retail-web.jpg", "Websites and social posts", "JPG", 1200, 1200, 236969),
      original("pattern", "Print", "Transparent background"),
    ],
  },
  shopping: {
    keywords: [
      "banner",
      "landscape",
      "website",
      "cover",
      "facebook",
      "linkedin",
      "link",
      "astronaut",
    ],
    usage: "The QR in the artwork is decorative. Add your own Static QR if customers need to pay.",
    variants: [
      variant("shopping-with-koko-web.jpg", "Website banners", "JPG", 1536, 1024, 179192),
      variant(
        "shopping-with-koko-link.jpg",
        "Link previews on Facebook and LinkedIn",
        "JPG",
        1200,
        628,
        107222,
      ),
      original("shopping", "Full quality"),
    ],
  },
  avurudu: {
    keywords: ["campaign", "avurudu", "new year", "banner", "offer", "sale", "april"],
    usage: "Shows specific dates and discounts. Only share it while the campaign is running.",
    variants: [original("avurudu", "Web banner")],
    validFrom: "2026-04-04",
    validUntil: "2026-04-12",
  },
};

export const ASSETS: AssetV1[] = catalogue.assets.map((asset) => ({
  ...asset,
  ...extra[asset.id],
}));
export const KIT = {
  url: "/koko-assets/koko-starter-kit.zip",
  filename: "koko-starter-kit.zip",
  bytes: catalogue.kitBytes,
  previews: ["logo", "social", "mascot", "pattern"].map((id) => base[id]),
};
// Placeholder guidelines PDF generated for the prototype. Replace with the
// brand team's file before launch.
export const GUIDELINES = {
  url: "/koko-assets/koko-brand-guidelines.pdf",
  filename: "koko-brand-guidelines.pdf",
  bytes: 132772,
};
export const CATEGORIES = ["All", "Logos", "Social media", "Illustrations", "Campaigns"];
