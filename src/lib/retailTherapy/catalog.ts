/**
 * Retail Therapy catalogs — FICTIONAL brands only (no real trademarks).
 * Prices are theatre: `price` is the "was", `salePrice` is the 70%-off "now".
 */

export type Storefront = 'boutique' | 'food';

export interface SaleItem {
  id: string;
  emoji: string;
  name: string;
  brand: string;
  price: number;     // "was"
  salePrice: number; // "now" (~70% off)
  tag?: string;
  /** Product photo (Unsplash CDN). The emoji doubles as loading/failure fallback. */
  image: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

export const STOREFRONT_META: Record<Storefront, {
  title: string;
  brand: string;
  tagline: string;
  emoji: string;
}> = {
  boutique: {
    title: 'Velvet Hour',
    brand: 'Velvet Hour · Intimates & Loungewear',
    tagline: 'Tonight only — 70% off everything',
    emoji: '🛍️',
  },
  food: {
    title: 'Midnight Kitchen',
    brand: 'Midnight Kitchen · Comfort Course',
    tagline: 'Craving hours — 70% off the menu',
    emoji: '🍫',
  },
};

export const SALE_CATALOG: Record<Storefront, SaleItem[]> = {
  boutique: [
    { id: 'b1', emoji: '🩰', name: 'Silk Slip Set',          brand: 'Velvet Hour', price: 3999, salePrice: 1199, tag: 'Bestseller',  image: img('1582533561751-ef6f6ab93a2e') },
    { id: 'b2', emoji: '🧖‍♀️', name: 'Cloud Robe',           brand: 'Velvet Hour', price: 2999, salePrice: 899,                     image: img('1496747611176-843222e1e57c') },
    { id: 'b3', emoji: '✨', name: 'Lace Bralette Duo',      brand: 'Velvet Hour', price: 2299, salePrice: 699, tag: 'Almost gone', image: img('1490481651871-ab68de25d43d') },
    { id: 'b4', emoji: '🌙', name: 'Midnight Camisole',      brand: 'Velvet Hour', price: 1899, salePrice: 569,                     image: img('1445205170230-053b83016050') },
    { id: 'b5', emoji: '🕯️', name: 'Boudoir Candle Set',     brand: 'Velvet Hour', price: 1599, salePrice: 479,                     image: img('1602874801007-bd458bb1b8b6') },
    { id: 'b6', emoji: '💫', name: 'Satin Pillowcase Pair',  brand: 'Velvet Hour', price: 1399, salePrice: 419, tag: 'New',         image: img('1584100936595-c0654b55a2e2') },
  ],
  food: [
    { id: 'f1', emoji: '🍫', name: 'Midnight Chocolate Course', brand: 'Midnight Kitchen', price: 999,  salePrice: 299, tag: 'Most craved', image: img('1481391319762-47dff72954d9') },
    { id: 'f2', emoji: '🍜', name: 'The Cozy Ramen Set',        brand: 'Midnight Kitchen', price: 849,  salePrice: 259,                     image: img('1569718212165-3a8278d5f624') },
    { id: 'f3', emoji: '🧀', name: 'Molten Mac & Cheese',       brand: 'Midnight Kitchen', price: 749,  salePrice: 229,                     image: img('1543339494-b4cd4f7ba686') },
    { id: 'f4', emoji: '🍰', name: 'Salted Caramel Cheesecake', brand: 'Midnight Kitchen', price: 699,  salePrice: 209, tag: 'Almost gone', image: img('1524351199678-941a58a3df50') },
    { id: 'f5', emoji: '🍕', name: 'Truffle Comfort Pizza',     brand: 'Midnight Kitchen', price: 1099, salePrice: 329,                     image: img('1513104890138-7c749659a591') },
    { id: 'f6', emoji: '🧋', name: 'Brown Sugar Boba Flight',   brand: 'Midnight Kitchen', price: 549,  salePrice: 169, tag: 'New',         image: img('1558857563-b371033873b8') },
  ],
};

/**
 * Deterministic per-item rating theatre (Amazon-style stars + review count) —
 * stable across renders because it hashes the item id.
 */
export function ratingFor(id: string): { stars: number; count: string } {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const stars = (43 + (h % 7)) / 10; // 4.3 – 4.9
  const n = 214 + (h % 1900);
  return { stars, count: n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) };
}

export function formatPrice(p: number): string {
  return `₹${p.toLocaleString('en-IN')}`;
}
