export type ClothingPrices = {
  Default?: number;
  Texture?: number;
  Color?: number;
  Overlay?: number;
  FaceFeature?: number;
  HeadBlend?: number;
  Hair?: number;
  EyeColor?: number;
  Tattoo?: number;
  Components?: Record<string, number>;
  Props?: Record<string, number>;
  Items?: {
    Components?: Record<string, Record<string, number | Record<string, number>>>;
    Props?: Record<string, Record<string, number | Record<string, number>>>;
  };
};

export type ClothingImages = {
  BaseUrl?: string;
  Components?: Record<string, string | Record<string, string | Record<string, string>>>;
  Props?: Record<string, string | Record<string, string | Record<string, string>>>;
  Hair?: Record<string, string>;
};

const COMPONENT_PRICE_KEYS: Record<number, string> = {
  1: 'Masks',
  3: 'UpperBody',
  4: 'LowerBody',
  5: 'Bags',
  6: 'Shoes',
  7: 'ScarfAndChains',
  8: 'Shirts',
  9: 'BodyArmor',
  10: 'Decals',
  11: 'Jackets',
};

const PROP_PRICE_KEYS: Record<number, string> = {
  0: 'Hats',
  1: 'Glasses',
  2: 'Ear',
  6: 'Watches',
  7: 'Bracelets',
};

const lookupNested = (table: any, ...keys: Array<string | number>): any => {
  let current = table;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key] ?? current[String(key)];
  }
  return current;
};

export const getItemPrice = (
  prices: ClothingPrices | undefined,
  isFree: boolean,
  kind: 'component' | 'prop' | 'hair' | 'eye_color' | 'tattoo' | 'texture' | 'color' | 'overlay' | 'faceFeature' | 'headBlend',
  id = 0,
  drawable = 0,
  texture = 0,
): number => {
  if (isFree) return 0;
  const fallback: Record<string, number> = {
    component: prices?.Default ?? 100,
    prop: prices?.Default ?? 100,
    hair: prices?.Hair ?? prices?.Default ?? 100,
    eye_color: prices?.EyeColor ?? 50,
    tattoo: prices?.Tattoo ?? 100,
    texture: prices?.Texture ?? 10,
    color: prices?.Color ?? 10,
    overlay: prices?.Overlay ?? 50,
    faceFeature: prices?.FaceFeature ?? 10,
    headBlend: prices?.HeadBlend ?? 10,
  };
  if (kind === 'component') {
    const item = lookupNested(prices?.Items?.Components, id, drawable);
    if (typeof item === 'number') return item;
    const texPrice = lookupNested(item, texture);
    if (typeof texPrice === 'number') return texPrice;
    if (item && typeof item.default === 'number') return item.default;
    const category = prices?.Components?.[COMPONENT_PRICE_KEYS[id]] ?? lookupNested(prices?.Components, id);
    if (typeof category === 'number') return category;
  }
  if (kind === 'prop') {
    const item = lookupNested(prices?.Items?.Props, id, drawable);
    if (typeof item === 'number') return item;
    const texPrice = lookupNested(item, texture);
    if (typeof texPrice === 'number') return texPrice;
    if (item && typeof item.default === 'number') return item.default;
    const category = prices?.Props?.[PROP_PRICE_KEYS[id]] ?? lookupNested(prices?.Props, id);
    if (typeof category === 'number') return category;
  }
  return fallback[kind] ?? prices?.Default ?? 100;
};

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/gh/ShortByte/GTA5-Cloth-Assets/assets';

const lookupImage = (table: any, ...keys: Array<string | number>): string | undefined => {
  let current = table;
  for (const key of keys) {
    if (current == null) return undefined;
    if (typeof current === 'string' && current !== '') return current;
    current = current[key] ?? current[String(key)];
  }
  return typeof current === 'string' && current !== '' ? current : undefined;
};

export const getCdnUrl = (type: 'component' | 'prop', id: number, drawable: number, texture: number, gender: 'male' | 'female' = 'male') => {
  const componentMap: Record<number, { name: string, hasGender: boolean }> = {
    0: { name: 'head', hasGender: true },
    1: { name: 'masks', hasGender: false },
    2: { name: 'hair', hasGender: true },
    3: { name: 'torsos', hasGender: true },
    4: { name: 'legs', hasGender: true },
    5: { name: 'bags', hasGender: false },
    6: { name: 'shoes', hasGender: true },
    7: { name: 'accessories', hasGender: true },
    8: { name: 'undershirts', hasGender: true },
    9: { name: 'bodyarmors', hasGender: true },
    10: { name: 'decals', hasGender: true },
    11: { name: 'tops', hasGender: true }
  };

  const propMap: Record<number, { name: string, hasGender: boolean }> = {
    0: { name: 'hats', hasGender: true },
    1: { name: 'glasses', hasGender: true },
    2: { name: 'ears', hasGender: true },
    6: { name: 'watches', hasGender: true },
    7: { name: 'bracelets', hasGender: true }
  };

  const map = type === 'component' ? componentMap : propMap;
  const category = map[id];

  if (!category) {
    return './files/faces/SKEL_ROOT.000.webp';
  }

  const genderPath = category.hasGender ? `/${gender}` : '';
  return `${DEFAULT_CDN}/${category.name}${genderPath}/${drawable}/${texture}.webp`;
};

export const getClothingImage = (
  images: ClothingImages | undefined,
  type: 'component' | 'prop' | 'hair',
  id: number,
  drawable: number,
  texture: number,
  gender: 'male' | 'female' = 'male',
): string => {
  if (type === 'hair') {
    const hairUrl = lookupImage(images?.Hair, drawable);
    if (hairUrl) return hairUrl;
    return getClothingImage(images, 'component', 2, drawable, texture, gender);
  }
  const map = type === 'prop' ? images?.Props : images?.Components;
  const override = lookupImage(map, id, drawable, texture) || lookupImage(map, id, drawable) || lookupImage(map, id);
  if (override) return override;
  const cdnUrl = getCdnUrl(type, id, drawable, texture, gender);
  if (images?.BaseUrl) {
    return cdnUrl.replace(DEFAULT_CDN, images.BaseUrl.replace(/\/$/, ''));
  }
  return cdnUrl;
};

const DOCS = "https://docs.fivem.net";
const GTAHASH_PED_THUMB = "https://gtahash.com/models/peds/thumbs";

const resolvedImageCache = new Map<string, string>();

export function getCachedAssetImage(model: string, kind: "prop" | "ped" = "ped"): string | null {
  return resolvedImageCache.get(`${kind}:${model.toLowerCase()}`) || null;
}

export function setCachedAssetImage(model: string, kind: "prop" | "ped", url: string) {
  if (!model || !url || url.startsWith("data:")) return;
  resolvedImageCache.set(`${kind}:${model.toLowerCase()}`, url);
}

export function getPedImageCandidates(model: string): string[] {
  const name = model.toLowerCase().trim();
  const cached = getCachedAssetImage(name, "ped");
  const urls = [
    `${GTAHASH_PED_THUMB}/${name}.webp`,
    `${GTAHASH_PED_THUMB}/${name}.png`,
    `${DOCS}/peds/${name}.webp`,
    `${DOCS}/peds/${name}.png`,
  ];
  if (cached) return [cached, ...urls.filter((u) => u !== cached)];
  return urls;
}

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function modelInitials(model: string): string {
  const parts = model
    .toLowerCase()
    .replace(/^a_[c|f|m]_[m|y|s]_/, "")
    .replace(/^mp_[m|f]_/, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[parts.length - 2][0] || "";
    const b = parts[parts.length - 1][0] || "";
    return `${a}${b}`.toUpperCase() || "PD";
  }
  const clean = (parts[0] || "pd").replace(/[^a-z0-9]/g, "");
  return (clean.slice(0, 2) || "PD").toUpperCase();
}

export function getModelThumbDataUri(model: string, kind: "prop" | "ped" = "ped"): string {
  const initials = modelInitials(model);
  const hue = hashHue(model.toLowerCase());
  const accent = kind === "ped" ? "#00f0ff" : `hsl(${hue} 70% 55%)`;
  const label = initials.replace(/&/g, "").slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e1218"/>
      <stop offset="100%" stop-color="#141a22"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#g)"/>
  <rect x="18" y="18" width="220" height="220" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="3"/>
  <text x="128" y="148" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="700" fill="${accent}">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
