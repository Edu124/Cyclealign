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
}

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
    { id: 'b1', emoji: '🩰', name: 'Silk Slip Set',          brand: 'Velvet Hour', price: 3999, salePrice: 1199, tag: 'Bestseller' },
    { id: 'b2', emoji: '🧖‍♀️', name: 'Cloud Robe',           brand: 'Velvet Hour', price: 2999, salePrice: 899 },
    { id: 'b3', emoji: '✨', name: 'Lace Bralette Duo',      brand: 'Velvet Hour', price: 2299, salePrice: 699, tag: 'Almost gone' },
    { id: 'b4', emoji: '🌙', name: 'Midnight Camisole',      brand: 'Velvet Hour', price: 1899, salePrice: 569 },
    { id: 'b5', emoji: '🕯️', name: 'Boudoir Candle Set',     brand: 'Velvet Hour', price: 1599, salePrice: 479 },
    { id: 'b6', emoji: '💫', name: 'Satin Pillowcase Pair',  brand: 'Velvet Hour', price: 1399, salePrice: 419, tag: 'New' },
  ],
  food: [
    { id: 'f1', emoji: '🍫', name: 'Midnight Chocolate Course', brand: 'Midnight Kitchen', price: 999, salePrice: 299, tag: 'Most craved' },
    { id: 'f2', emoji: '🍜', name: 'The Cozy Ramen Set',        brand: 'Midnight Kitchen', price: 849, salePrice: 259 },
    { id: 'f3', emoji: '🧀', name: 'Molten Mac & Cheese',       brand: 'Midnight Kitchen', price: 749, salePrice: 229 },
    { id: 'f4', emoji: '🍰', name: 'Salted Caramel Cheesecake', brand: 'Midnight Kitchen', price: 699, salePrice: 209, tag: 'Almost gone' },
    { id: 'f5', emoji: '🍕', name: 'Truffle Comfort Pizza',     brand: 'Midnight Kitchen', price: 1099, salePrice: 329 },
    { id: 'f6', emoji: '🧋', name: 'Brown Sugar Boba Flight',   brand: 'Midnight Kitchen', price: 549, salePrice: 169, tag: 'New' },
  ],
};

export function formatPrice(p: number): string {
  return `₹${p.toLocaleString('en-IN')}`;
}
