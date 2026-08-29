import { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { dash, phaseColors, spacing } from '@/theme';
import { ratingFor } from '@/lib/retailTherapy/catalog';
import { sendOrderNotification } from '@/lib/notifications';
import type { PhaseKey } from '@/types/models';

interface CartItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  qty: number;
}

interface Product {
  id: string;
  emoji: string;
  name: string;
  /** Fictional brand — no real trademarks in the dopamine shop. */
  brand: string;
  price: number;
  tag?: string;
  /** Product photo (Unsplash CDN); emoji doubles as loading/failure fallback. */
  image: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

const PHASE_PRODUCTS: Record<PhaseKey, Product[]> = {
  menstrual: [
    { id: 'm1', emoji: '🛁', name: 'Lavender Bath Soak',     brand: 'Bloom & Ember',    price: 1299, tag: 'Best Seller', image: img('1507652313519-d4e9174996dd') },
    { id: 'm2', emoji: '🕯️', name: 'Calming Candle Set',     brand: 'Bloom & Ember',    price: 1699,                    image: img('1602874801007-bd458bb1b8b6') },
    { id: 'm3', emoji: '🍫', name: 'Premium Chocolate Box',  brand: 'Cocoa Theory',     price: 899,  tag: 'Fan Fave',    image: img('1511381939415-e44015466834') },
    { id: 'm4', emoji: '🧸', name: 'Weighted Comfort Plush', brand: 'Cloud Nine Living', price: 2499,                    image: img('1559454403-b8fb88521f11') },
    { id: 'm5', emoji: '🍵', name: 'Herbal Tea Collection',  brand: 'Steep Story',      price: 1099,                    image: img('1544787219-7f47ccb76574') },
    { id: 'm6', emoji: '🌡️', name: 'Heating Pad Deluxe',     brand: 'Hearth & Haven',   price: 1999, tag: 'New',         image: img('1584100936595-c0654b55a2e2') },
  ],
  follicular: [
    { id: 'f1', emoji: '📓', name: 'Manifestation Journal', brand: 'Paper Petal', price: 1499, tag: 'Trending',    image: img('1517842645767-c639042777db') },
    { id: 'f2', emoji: '🎨', name: 'Art Supply Kit',        brand: 'Studio Muse', price: 2699,                    image: img('1513364776144-60967b0f800f') },
    { id: 'f3', emoji: '🌱', name: 'Indoor Plant Set',      brand: 'Leaf & Letter', price: 1999, tag: 'Best Seller', image: img('1485955900006-10f4d324d411') },
    { id: 'f4', emoji: '🎵', name: 'Wireless Earbuds',      brand: 'Auralite',    price: 5999,                    image: img('1590658268037-6bf12165a8df') },
    { id: 'f5', emoji: '💪', name: 'Home Workout Set',      brand: 'FormaFit',    price: 1299,                    image: img('1517836357463-d25dfeac3438') },
    { id: 'f6', emoji: '✏️', name: 'Stationery Bundle',     brand: 'Paper Petal', price: 1199, tag: 'New',         image: img('1456735190827-d1262f71b8a3') },
  ],
  ovulation: [
    { id: 'o1', emoji: '👗', name: 'Statement Set',        brand: 'Maison Rosette', price: 4999, tag: 'Hot Pick',    image: img('1515886657613-9f3515b0c78f') },
    { id: 'o2', emoji: '💄', name: 'Glow Makeup Kit',      brand: 'Lumi Beauty',    price: 3199, tag: 'Best Seller', image: img('1522335789203-aabd1fc54bc9') },
    { id: 'o3', emoji: '💐', name: 'Fresh Flower Bouquet', brand: 'Petal Post',     price: 2199,                    image: img('1490750967868-88aa4486c946') },
    { id: 'o4', emoji: '✨', name: 'Pearl Jewelry Set',    brand: 'Gilt & Grace',   price: 3499,                    image: img('1515562141207-7a88fb7ce338') },
    { id: 'o5', emoji: '🌟', name: 'Skincare Glow Set',    brand: 'Aster Skin',     price: 3999, tag: 'Trending',    image: img('1608571423902-eed4a5ad8108') },
    { id: 'o6', emoji: '👜', name: 'Mini Crossbody Bag',   brand: 'Maison Rosette', price: 4499,                    image: img('1591561954557-26941169b49e') },
  ],
  luteal: [
    { id: 'l1', emoji: '🌿', name: 'Face Mask Collection', brand: 'Aster Skin',       price: 1899, tag: 'Self-Care',  image: img('1608248543803-ba4f8c70ae0b') },
    { id: 'l2', emoji: '🛋️', name: 'Comfort Pillow Set',   brand: 'Cloud Nine Living', price: 2999,                   image: img('1522771739844-6a9f6d5f14af') },
    { id: 'l3', emoji: '📚', name: 'Novel Bundle',         brand: 'Fable & Fern',     price: 2499, tag: 'Cozy Pick',  image: img('1463320726281-696a485928c7') },
    { id: 'l4', emoji: '🧘', name: 'Yoga Mat & Blocks',    brand: 'FormaFit',         price: 3999,                   image: img('1544367567-0f2fcb009e0b') },
    { id: 'l5', emoji: '🫖', name: 'Comfort Tea Kit',      brand: 'Steep Story',      price: 1399, tag: 'Best Seller', image: img('1576092768241-dec231879fc3') },
    { id: 'l6', emoji: '🌸', name: 'Aromatherapy Set',     brand: 'Bloom & Ember',    price: 2299,                   image: img('1540555700478-4be289fbecef') },
  ],
};

// Food mode — pure craving-fulfilment, phase-tuned like everything else.
const PHASE_FOODS: Record<PhaseKey, Product[]> = {
  menstrual: [
    { id: 'fm1', emoji: '🍫', name: 'Dark Chocolate Ritual',   brand: 'Cocoa Theory',     price: 349, tag: 'Most craved', image: img('1511381939415-e44015466834') },
    { id: 'fm2', emoji: '🍜', name: 'Comfort Ramen Bowl',      brand: 'Midnight Kitchen', price: 429,                    image: img('1569718212165-3a8278d5f624') },
    { id: 'fm3', emoji: '🧀', name: 'Molten Mac & Cheese',     brand: 'Midnight Kitchen', price: 379,                    image: img('1543339494-b4cd4f7ba686') },
    { id: 'fm4', emoji: '🫖', name: 'Chamomile Calm Tea',      brand: 'Steep Story',      price: 199,                    image: img('1576092768241-dec231879fc3') },
    { id: 'fm5', emoji: '🍪', name: 'Warm Cookies & Chai',     brand: 'Steep Story',      price: 249, tag: 'Fan Fave',    image: img('1544787219-7f47ccb76574') },
    { id: 'fm6', emoji: '🎁', name: 'Midnight Chocolate Box',  brand: 'Cocoa Theory',     price: 549,                    image: img('1481391319762-47dff72954d9') },
  ],
  follicular: [
    { id: 'ff1', emoji: '☕', name: 'Oat Latte Boost',         brand: 'Steep Story',      price: 229, tag: 'Trending',    image: img('1512568400610-62da28bc8a13') },
    { id: 'ff2', emoji: '🧋', name: 'Brown Sugar Boba',        brand: 'Midnight Kitchen', price: 269,                    image: img('1558857563-b371033873b8') },
    { id: 'ff3', emoji: '🍕', name: 'Garden Veggie Pizza',     brand: 'Midnight Kitchen', price: 499,                    image: img('1513104890138-7c749659a591') },
    { id: 'ff4', emoji: '🍰', name: 'Berry Cheesecake Slice',  brand: 'Midnight Kitchen', price: 329,                    image: img('1524351199678-941a58a3df50') },
    { id: 'ff5', emoji: '🍵', name: 'Green Tea Ritual',        brand: 'Steep Story',      price: 189,                    image: img('1576092768241-dec231879fc3') },
    { id: 'ff6', emoji: '🍫', name: 'Energy Chocolate Chunks', brand: 'Cocoa Theory',     price: 299, tag: 'New',         image: img('1511381939415-e44015466834') },
  ],
  ovulation: [
    { id: 'fo1', emoji: '🍰', name: 'Celebration Cheesecake',  brand: 'Midnight Kitchen', price: 599, tag: 'Hot Pick',    image: img('1524351199678-941a58a3df50') },
    { id: 'fo2', emoji: '🧋', name: 'Boba Date Flight',        brand: 'Midnight Kitchen', price: 349,                    image: img('1558857563-b371033873b8') },
    { id: 'fo3', emoji: '🍕', name: 'Wood-fired Pizza Night',  brand: 'Midnight Kitchen', price: 649,                    image: img('1513104890138-7c749659a591') },
    { id: 'fo4', emoji: '☕', name: 'Latte Art Date',          brand: 'Steep Story',      price: 259,                    image: img('1512568400610-62da28bc8a13') },
    { id: 'fo5', emoji: '🎁', name: 'Chocolate Tasting Box',   brand: 'Cocoa Theory',     price: 699, tag: 'Fan Fave',    image: img('1481391319762-47dff72954d9') },
    { id: 'fo6', emoji: '🫖', name: 'High Tea Set',            brand: 'Steep Story',      price: 449,                    image: img('1544787219-7f47ccb76574') },
  ],
  luteal: [
    { id: 'fl1', emoji: '🧀', name: 'Extra-Cheese Mac',        brand: 'Midnight Kitchen', price: 399, tag: 'Most craved', image: img('1543339494-b4cd4f7ba686') },
    { id: 'fl2', emoji: '🍜', name: 'Cozy Ramen Supreme',      brand: 'Midnight Kitchen', price: 469,                    image: img('1569718212165-3a8278d5f624') },
    { id: 'fl3', emoji: '🍰', name: 'Salted Caramel Cheesecake', brand: 'Midnight Kitchen', price: 379,                  image: img('1524351199678-941a58a3df50') },
    { id: 'fl4', emoji: '🍫', name: 'Midnight Chocolate Chunks', brand: 'Cocoa Theory',   price: 329,                    image: img('1511381939415-e44015466834') },
    { id: 'fl5', emoji: '🍕', name: 'Comfort Pizza',           brand: 'Midnight Kitchen', price: 549,                    image: img('1513104890138-7c749659a591') },
    { id: 'fl6', emoji: '🍪', name: 'Masala Chai & Cookies',   brand: 'Steep Story',      price: 229, tag: 'Fan Fave',    image: img('1544787219-7f47ccb76574') },
  ],
};

// ── Filter & sort (Amazon-style) ──────────────────────────────────────────────

type SortKey = 'featured' | 'priceAsc' | 'priceDesc' | 'rating';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'featured',  label: 'Featured' },
  { key: 'priceAsc',  label: 'Price: Low to High' },
  { key: 'priceDesc', label: 'Price: High to Low' },
  { key: 'rating',    label: 'Top Rated' },
];

const PRICE_RANGES: { key: string; label: string; min: number; max: number }[] = [
  { key: 'p1', label: 'Under ₹500',      min: 0,    max: 499 },
  { key: 'p2', label: '₹500 – ₹1,000',   min: 500,  max: 1000 },
  { key: 'p3', label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
  { key: 'p4', label: 'Over ₹2,000',     min: 2000, max: Infinity },
];

const RATING_OPTIONS: { key: string; label: string; min: number }[] = [
  { key: 'r45', label: '4.5★ & up', min: 4.5 },
  { key: 'r40', label: '4.0★ & up', min: 4.0 },
];

const PHASE_LABELS: Record<PhaseKey, string> = {
  menstrual: 'Rest & Restore',
  follicular: 'Create & Explore',
  ovulation: 'Glow & Shine',
  luteal: 'Cozy & Comfort',
};

const PHASE_TAGLINES: Record<PhaseKey, string> = {
  menstrual: 'You deserve all of this today 🌙',
  follicular: 'New energy, new finds ✨',
  ovulation: 'Treat yourself, you\'re radiant 💫',
  luteal: 'Your cart, your comfort 🍂',
};

function formatPrice(p: number) {
  return `₹${p.toLocaleString('en-IN')}`;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirm' | 'track';

const TRACK_STAGES = [
  { key: 'placed',    label: 'Order Placed',       emoji: '📋', done: true  },
  { key: 'process',   label: 'Processing',          emoji: '⚙️', done: true  },
  { key: 'packed',    label: 'Packed & Ready',      emoji: '📦', done: true  },
  { key: 'shipped',   label: 'Shipped',             emoji: '🚚', done: false },
  { key: 'delivery',  label: 'Out for Delivery',    emoji: '🏠', done: false },
  { key: 'delivered', label: 'Delivered',           emoji: '🎉', done: false },
];

interface Props {
  phaseKey: PhaseKey;
}

export function DopamineMenuCard({ phaseKey }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  // Products whose photo failed to load fall back to the emoji tile.
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [address, setAddress] = useState({ name: '', street: '', city: '' });
  const [orderNumber] = useState(() => `CA${Math.floor(100000 + Math.random() * 900000)}`);

  // ── Mode, filter & sort ────────────────────────────────────────────────────
  const [mode, setMode] = useState<'shop' | 'food'>('shop');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('featured');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);

  const catalog = mode === 'shop' ? PHASE_PRODUCTS[phaseKey] : PHASE_FOODS[phaseKey];
  const allBrands = [...new Set(catalog.map((p) => p.brand))];

  function switchMode(m: 'shop' | 'food') {
    if (m === mode) return;
    setMode(m);
    // Brands differ between catalogs — stale filters would empty the grid.
    setBrandFilter([]);
    setPriceFilter(null);
    setRatingFilter(null);
  }

  const activeFilterCount =
    brandFilter.length + (priceFilter ? 1 : 0) + (ratingFilter ? 1 : 0);

  let products = catalog.filter((p) => {
    if (brandFilter.length > 0 && !brandFilter.includes(p.brand)) return false;
    if (priceFilter) {
      const range = PRICE_RANGES.find((r) => r.key === priceFilter)!;
      if (p.price < range.min || p.price > range.max) return false;
    }
    if (ratingFilter) {
      const opt = RATING_OPTIONS.find((r) => r.key === ratingFilter)!;
      if (ratingFor(p.id).stars < opt.min) return false;
    }
    return true;
  });
  if (sortKey === 'priceAsc') products = [...products].sort((a, b) => a.price - b.price);
  if (sortKey === 'priceDesc') products = [...products].sort((a, b) => b.price - a.price);
  if (sortKey === 'rating')
    products = [...products].sort((a, b) => ratingFor(b.id).stars - ratingFor(a.id).stars);

  const phaseColor = phaseColors[phaseKey].base;

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: product.id, emoji: product.emoji, name: product.name, price: product.price, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  }

  function openCheckout() {
    setStep('cart');
    setCheckoutOpen(true);
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setStep('cart');
  }

  function placeOrder() {
    setStep('confirm');
    setCart([]);
    sendOrderNotification();
  }

  return (
    <View style={styles.card}>
      {/* Header: title + the 4 controls (mode toggle · filter · sort · cart) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{mode === 'shop' ? 'Shop' : 'Food'}</Text>
          <Text style={[styles.subtitle, { color: phaseColor }]}>
            {mode === 'shop' ? PHASE_LABELS[phaseKey] : 'Cravings, phase-tuned'}
          </Text>
        </View>
        <View style={styles.controls}>
          <View style={styles.modeToggle}>
            {(['shop', 'food'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => switchMode(m)}
                style={[styles.modeBtn, mode === m && { backgroundColor: phaseColor }]}
              >
                <Text style={styles.modeBtnEmoji}>{m === 'shop' ? '🛍️' : '🍜'}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.iconBtn} onPress={() => setFilterOpen(true)}>
            <Text style={styles.iconBtnGlyph}>☰</Text>
            {activeFilterCount > 0 && (
              <View style={[styles.badge, { backgroundColor: phaseColor }]}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => setSortOpen(true)}>
            <Text style={styles.iconBtnGlyph}>⇅</Text>
            {sortKey !== 'featured' && (
              <View style={[styles.badge, { backgroundColor: phaseColor }]}>
                <Text style={styles.badgeText}>•</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={[styles.iconBtn, cartCount === 0 && styles.iconBtnDim]}
            onPress={() => cartCount > 0 && openCheckout()}
          >
            <Text style={styles.iconBtnGlyph}>🛒</Text>
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: phaseColor }]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <Text style={styles.tagline}>{PHASE_TAGLINES[phaseKey]}</Text>

      <View style={styles.noticePill}>
        <Text style={styles.noticeText}>
          ✨ Feel-good shopping — zero charges, zero delivery, 100% dopamine
        </Text>
      </View>

      {/* Product grid */}
      <View style={styles.grid}>
        {products.map((product, i) => {
          const inCart = cart.find((c) => c.id === product.id);
          return (
            <Animated.View
              key={product.id}
              entering={FadeInDown.delay(i * 50).duration(300)}
              style={styles.productCard}
            >
              <View style={styles.productImageWrap}>
                <Text style={styles.productEmoji}>{product.emoji}</Text>
                {!imgFailed[product.id] && (
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={() =>
                      setImgFailed((f) => ({ ...f, [product.id]: true }))
                    }
                  />
                )}
                {product.tag && (
                  <View style={[styles.tagPill, { backgroundColor: '#FFFFFFEE' }]}>
                    <Text style={[styles.tagText, { color: phaseColor }]}>{product.tag}</Text>
                  </View>
                )}
              </View>
              <View style={styles.productBody}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={[styles.productPrice, { color: phaseColor }]}>{formatPrice(product.price)}</Text>
              {inCart ? (
                <View style={styles.qtyRow}>
                  <Pressable style={[styles.qtyBtn, { borderColor: phaseColor }]} onPress={() => updateQty(product.id, -1)}>
                    <Text style={[styles.qtyBtnText, { color: phaseColor }]}>−</Text>
                  </Pressable>
                  <Text style={styles.qtyNum}>{inCart.qty}</Text>
                  <Pressable style={[styles.qtyBtn, { borderColor: phaseColor, backgroundColor: phaseColor }]} onPress={() => updateQty(product.id, 1)}>
                    <Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.addBtn, { backgroundColor: phaseColor + '18', borderColor: phaseColor, borderWidth: 1 }]}
                  onPress={() => addToCart(product)}
                >
                  <Text style={[styles.addBtnText, { color: phaseColor }]}>Add to Cart</Text>
                </Pressable>
              )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      {products.length === 0 && (
        <View style={styles.emptyFilter}>
          <Text style={styles.emptyFilterText}>Nothing matches these filters.</Text>
          <Pressable onPress={() => { setBrandFilter([]); setPriceFilter(null); setRatingFilter(null); }}>
            <Text style={[styles.emptyFilterClear, { color: phaseColor }]}>Clear filters</Text>
          </Pressable>
        </View>
      )}

      {cartCount > 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Pressable style={[styles.checkoutCta, { backgroundColor: phaseColor }]} onPress={openCheckout}>
            <Text style={styles.checkoutCtaText}>
              View Cart · {cartCount} item{cartCount > 1 ? 's' : ''} · {formatPrice(cartTotal)}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Filter sheet (Amazon-style) */}
      <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <Pressable
                onPress={() => { setBrandFilter([]); setPriceFilter(null); setRatingFilter(null); }}
                hitSlop={8}
              >
                <Text style={[styles.sheetClear, { color: phaseColor }]}>Clear all</Text>
              </Pressable>
            </View>

            <Text style={styles.sheetSection}>Brand</Text>
            <View style={styles.chipWrap}>
              {allBrands.map((b) => {
                const on = brandFilter.includes(b);
                return (
                  <Pressable
                    key={b}
                    onPress={() =>
                      setBrandFilter((f) => (on ? f.filter((x) => x !== b) : [...f, b]))
                    }
                    style={[styles.filterChip, on && { backgroundColor: phaseColor + '22', borderColor: phaseColor }]}
                  >
                    <Text style={[styles.filterChipText, on && { color: phaseColor, fontWeight: '800' }]}>
                      {on ? '✓ ' : ''}{b}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetSection}>Price</Text>
            <View style={styles.chipWrap}>
              {PRICE_RANGES.map((r) => {
                const on = priceFilter === r.key;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => setPriceFilter(on ? null : r.key)}
                    style={[styles.filterChip, on && { backgroundColor: phaseColor + '22', borderColor: phaseColor }]}
                  >
                    <Text style={[styles.filterChipText, on && { color: phaseColor, fontWeight: '800' }]}>
                      {on ? '✓ ' : ''}{r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sheetSection}>Customer rating</Text>
            <View style={styles.chipWrap}>
              {RATING_OPTIONS.map((r) => {
                const on = ratingFilter === r.key;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => setRatingFilter(on ? null : r.key)}
                    style={[styles.filterChip, on && { backgroundColor: phaseColor + '22', borderColor: phaseColor }]}
                  >
                    <Text style={[styles.filterChipText, on && { color: phaseColor, fontWeight: '800' }]}>
                      {on ? '✓ ' : ''}{r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.stepBtn, { backgroundColor: phaseColor }]}
              onPress={() => setFilterOpen(false)}
            >
              <Text style={styles.stepBtnText}>
                Show {products.length} item{products.length === 1 ? '' : 's'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sort sheet */}
      <Modal visible={sortOpen} animationType="slide" transparent onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort by</Text>
            </View>
            {SORT_OPTIONS.map((o) => {
              const on = sortKey === o.key;
              return (
                <Pressable
                  key={o.key}
                  style={styles.sortRow}
                  onPress={() => { setSortKey(o.key); setSortOpen(false); }}
                >
                  <Text style={[styles.sortLabel, on && { color: phaseColor, fontWeight: '800' }]}>
                    {o.label}
                  </Text>
                  <View style={[styles.radio, on && { borderColor: phaseColor }]}>
                    {on && <View style={[styles.radioDot, { backgroundColor: phaseColor }]} />}
                  </View>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={checkoutOpen} animationType="slide" transparent onRequestClose={closeCheckout}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalSheet, step === 'track' && styles.modalSheetTall]}>
            {step === 'cart' && (
              <CartStep
                cart={cart}
                total={cartTotal}
                phaseColor={phaseColor}
                onRemove={removeFromCart}
                onUpdateQty={updateQty}
                onContinue={() => setStep('address')}
                onClose={closeCheckout}
              />
            )}
            {step === 'address' && (
              <AddressStep
                address={address}
                onChange={setAddress}
                phaseColor={phaseColor}
                onContinue={() => setStep('payment')}
                onBack={() => setStep('cart')}
              />
            )}
            {step === 'payment' && (
              <PaymentStep
                total={cartTotal}
                phaseColor={phaseColor}
                onPlace={placeOrder}
                onBack={() => setStep('address')}
              />
            )}
            {step === 'confirm' && (
              <ConfirmStep
                orderNumber={orderNumber}
                phaseColor={phaseColor}
                onTrack={() => setStep('track')}
                onClose={closeCheckout}
              />
            )}
            {step === 'track' && (
              <TrackStep
                orderNumber={orderNumber}
                phaseColor={phaseColor}
                onClose={closeCheckout}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ── Step components ── */

function CartStep({ cart, total, phaseColor, onRemove, onUpdateQty, onContinue, onClose }: {
  cart: CartItem[];
  total: number;
  phaseColor: string;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Your Cart 🛒</Text>
        <Pressable onPress={onClose} hitSlop={10}><Text style={styles.stepClose}>✕</Text></Pressable>
      </View>
      <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
        {cart.map((item) => (
          <View key={item.id} style={styles.cartRow}>
            <Text style={styles.cartEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cartName}>{item.name}</Text>
              <Text style={styles.cartQtyPrice}>{formatPrice(item.price * item.qty)}</Text>
            </View>
            <View style={styles.cartQtyControl}>
              <Pressable onPress={() => onUpdateQty(item.id, -1)} hitSlop={8} style={styles.cartQtyBtn}>
                <Text style={styles.cartQtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.cartQtyNum}>{item.qty}</Text>
              <Pressable onPress={() => onUpdateQty(item.id, 1)} hitSlop={8} style={styles.cartQtyBtn}>
                <Text style={styles.cartQtyBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={[styles.totalValue, { color: phaseColor }]}>{formatPrice(total)}</Text>
      </View>
      <View style={styles.noChargeNotice}>
        <Text style={styles.noChargeText}>🔒 No real charge — just good vibes</Text>
      </View>
      <Pressable style={[styles.stepBtn, { backgroundColor: phaseColor }]} onPress={onContinue}>
        <Text style={styles.stepBtnText}>Continue to Delivery →</Text>
      </Pressable>
    </View>
  );
}

function AddressStep({ address, onChange, phaseColor, onContinue, onBack }: {
  address: { name: string; street: string; city: string };
  onChange: (a: { name: string; street: string; city: string }) => void;
  phaseColor: string;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Delivery Address 📦</Text>
        <Pressable onPress={onBack} hitSlop={10}><Text style={styles.stepBack}>← Back</Text></Pressable>
      </View>
      <Text style={styles.stepHint}>Where should your good vibes arrive?</Text>
      <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={dash.muted} value={address.name} onChangeText={(v) => onChange({ ...address, name: v })} />
      <TextInput style={styles.input} placeholder="Street address" placeholderTextColor={dash.muted} value={address.street} onChangeText={(v) => onChange({ ...address, street: v })} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor={dash.muted} value={address.city} onChangeText={(v) => onChange({ ...address, city: v })} />
      <Pressable style={[styles.stepBtn, { backgroundColor: phaseColor }]} onPress={onContinue}>
        <Text style={styles.stepBtnText}>Continue to Payment →</Text>
      </Pressable>
    </View>
  );
}

function PaymentStep({ total, phaseColor, onPlace, onBack }: {
  total: number;
  phaseColor: string;
  onPlace: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Payment 💳</Text>
        <Pressable onPress={onBack} hitSlop={10}><Text style={styles.stepBack}>← Back</Text></Pressable>
      </View>
      <Text style={styles.stepHint}>Your feel-good card is ready</Text>
      <View style={styles.fakeCard}>
        <Text style={styles.fakeCardNum}>•••• •••• •••• 8888</Text>
        <Text style={styles.fakeCardLabel}>Dopamine Card ✨</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Order Total</Text>
        <Text style={[styles.totalValue, { color: phaseColor }]}>{formatPrice(total)}</Text>
      </View>
      <View style={styles.noChargeNotice}>
        <Text style={styles.noChargeText}>✨ No real money involved — this is your moment</Text>
      </View>
      <Pressable style={[styles.stepBtn, { backgroundColor: phaseColor }]} onPress={onPlace}>
        <Text style={styles.stepBtnText}>Place Order 🎉</Text>
      </Pressable>
    </View>
  );
}

function ConfirmStep({ orderNumber, phaseColor, onTrack, onClose }: {
  orderNumber: string;
  phaseColor: string;
  onTrack: () => void;
  onClose: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.stepWrap}>
      <Animated.Text entering={ZoomIn.delay(200).duration(500)} style={styles.confirmEmoji}>🎊</Animated.Text>
      <Text style={styles.confirmTitle}>Order Confirmed!</Text>
      <Text style={styles.confirmSub}>
        Order <Text style={{ color: phaseColor, fontWeight: '700' }}>#{orderNumber}</Text> is being processed 💫
      </Text>
      <View style={[styles.confirmPill, { backgroundColor: phaseColor + '18' }]}>
        <Text style={[styles.confirmPillText, { color: phaseColor }]}>Dopamine delivered ✓</Text>
      </View>
      <Pressable style={[styles.stepBtn, { backgroundColor: phaseColor }]} onPress={onTrack}>
        <Text style={styles.stepBtnText}>Track My Order →</Text>
      </Pressable>
      <Pressable onPress={onClose} style={styles.ghostBtn}>
        <Text style={styles.ghostBtnText}>Continue Shopping</Text>
      </Pressable>
    </Animated.View>
  );
}

function TrackStep({ orderNumber, phaseColor, onClose }: {
  orderNumber: string;
  phaseColor: string;
  onClose: () => void;
}) {
  const [activeStage, setActiveStage] = useState(2);
  const progressAnim = useRef(new RNAnimated.Value(2)).current;

  useEffect(() => {
    let stage = 2;
    const advance = () => {
      if (stage >= TRACK_STAGES.length - 1) return;
      stage += 1;
      setActiveStage(stage);
      RNAnimated.timing(progressAnim, {
        toValue: stage,
        duration: 800,
        useNativeDriver: false,
      }).start();
      if (stage < TRACK_STAGES.length - 1) {
        setTimeout(advance, 2200);
      }
    };
    const timer = setTimeout(advance, 1400);
    return () => clearTimeout(timer);
  }, []);

  const estimatedDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Track Order 📍</Text>
        <Pressable onPress={onClose} hitSlop={10}><Text style={styles.stepClose}>✕</Text></Pressable>
      </View>

      <View style={[styles.orderBadge, { backgroundColor: phaseColor + '18' }]}>
        <Text style={[styles.orderBadgeNum, { color: phaseColor }]}>#{orderNumber}</Text>
        <Text style={styles.orderBadgeEst}>Est. delivery: {estimatedDate}</Text>
      </View>

      <View style={styles.timeline}>
        {TRACK_STAGES.map((stage, i) => {
          const isCompleted = i < activeStage;
          const isActive = i === activeStage;
          const isPending = i > activeStage;
          return (
            <View key={stage.key} style={styles.timelineRow}>
              {/* Connector line above (skip first) */}
              {i > 0 && (
                <View style={[
                  styles.timelineConnector,
                  (isCompleted || isActive) ? { backgroundColor: phaseColor } : { backgroundColor: '#E0D8D0' },
                ]} />
              )}
              <View style={styles.timelineContent}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && { backgroundColor: phaseColor, borderColor: phaseColor },
                  isActive && { backgroundColor: '#fff', borderColor: phaseColor, borderWidth: 3 },
                  isPending && { backgroundColor: '#F5F0EB', borderColor: '#D0C8C0' },
                ]}>
                  <Text style={styles.timelineDotText}>
                    {isCompleted ? '✓' : stage.emoji}
                  </Text>
                </View>
                <View style={styles.timelineText}>
                  <Text style={[
                    styles.timelineLabel,
                    isActive && { color: phaseColor, fontWeight: '800' },
                    isCompleted && { color: dash.inkSoft },
                    isPending && { color: dash.muted },
                  ]}>
                    {stage.label}
                  </Text>
                  {isActive && (
                    <Animated.Text style={[styles.timelineActive, { color: phaseColor }]}>
                      In progress...
                    </Animated.Text>
                  )}
                  {isCompleted && i === 0 && (
                    <Text style={styles.timelineSub}>Just placed ✓</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.noChargeNotice}>
        <Text style={styles.noChargeText}>💫 Your dopamine delivery is purely magical — no real courier needed</Text>
      </View>

      <Pressable style={[styles.stepBtn, { backgroundColor: phaseColor }]} onPress={onClose}>
        <Text style={styles.stepBtnText}>Back to Shopping 🛍️</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: spacing.xl,
    gap: 14,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', color: dash.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tagline: { fontSize: 13, color: dash.inkSoft, marginTop: -6 },
  cartBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // 4-control header row
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0EBE5',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  modeBtn: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 },
  modeBtnEmoji: { fontSize: 15 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDim: { opacity: 0.45 },
  iconBtnGlyph: { fontSize: 16, color: dash.ink },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Filter / sort sheets
  sheet: {
    backgroundColor: dash.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 10,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: dash.ink },
  sheetClear: { fontSize: 13, fontWeight: '700' },
  sheetSection: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: dash.muted,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderWidth: 1.5,
    borderColor: dash.line,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: dash.bg,
  },
  filterChipText: { fontSize: 13, color: dash.inkSoft, fontWeight: '600' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: dash.line,
  },
  sortLabel: { fontSize: 15, color: dash.ink, fontWeight: '600' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: dash.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  emptyFilter: { alignItems: 'center', gap: 6, paddingVertical: 18 },
  emptyFilterText: { fontSize: 14, color: dash.muted },
  emptyFilterClear: { fontSize: 14, fontWeight: '800' },
  noticePill: { backgroundColor: '#FFF8E7', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  noticeText: { fontSize: 12, color: '#9A7B2E', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  productCard: { width: '47%', backgroundColor: '#F9F6F1', borderRadius: 14, overflow: 'hidden' },
  productImageWrap: {
    height: 110,
    backgroundColor: '#F0EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  productBody: { padding: 12, gap: 4 },
  tagPill: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  productEmoji: { fontSize: 30 },
  productName: { fontSize: 13, fontWeight: '600', color: dash.ink, lineHeight: 17 },
  productBrand: { fontSize: 11, color: dash.muted },
  productPrice: { fontSize: 14, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  qtyNum: { fontSize: 15, fontWeight: '700', color: dash.ink, minWidth: 20, textAlign: 'center' },
  addBtn: { borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginTop: 2 },
  addBtnText: { fontSize: 12, fontWeight: '700' },
  checkoutCta: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  checkoutCtaText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: dash.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  modalSheetTall: { maxHeight: '92%' },
  stepWrap: { padding: 24, gap: 14 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '800', color: dash.ink },
  stepClose: { fontSize: 16, color: dash.muted },
  stepBack: { fontSize: 14, color: dash.inkSoft, fontWeight: '600' },
  stepHint: { fontSize: 13, color: dash.muted, marginTop: -6 },

  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: dash.line },
  cartEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  cartName: { fontSize: 14, fontWeight: '600', color: dash.ink },
  cartQtyPrice: { fontSize: 12, color: dash.muted, marginTop: 2 },
  cartQtyControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartQtyBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#F0EBE5', alignItems: 'center', justifyContent: 'center' },
  cartQtyBtnText: { fontSize: 14, fontWeight: '700', color: dash.ink, lineHeight: 18 },
  cartQtyNum: { fontSize: 14, fontWeight: '700', color: dash.ink, minWidth: 18, textAlign: 'center' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: dash.line },
  totalLabel: { fontSize: 15, fontWeight: '700', color: dash.ink },
  totalValue: { fontSize: 18, fontWeight: '800' },
  noChargeNotice: { backgroundColor: '#EEF6E8', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  noChargeText: { fontSize: 12, color: '#4A7A35', fontWeight: '500', textAlign: 'center' },
  stepBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  stepBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  ghostBtn: { paddingVertical: 10, alignItems: 'center' },
  ghostBtnText: { fontSize: 14, color: dash.muted, fontWeight: '600' },

  input: { backgroundColor: '#F9F6F1', borderRadius: 12, padding: 12, fontSize: 15, color: dash.ink },
  fakeCard: { backgroundColor: '#2E2A26', borderRadius: 16, padding: 20, gap: 6 },
  fakeCardNum: { fontSize: 20, color: '#fff', letterSpacing: 3, fontWeight: '300' },
  fakeCardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  confirmEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 4 },
  confirmTitle: { fontSize: 24, fontWeight: '800', color: dash.ink, textAlign: 'center' },
  confirmSub: { fontSize: 14, color: dash.inkSoft, textAlign: 'center', lineHeight: 20 },
  confirmPill: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  confirmPillText: { fontSize: 14, fontWeight: '700' },

  // Order tracking
  orderBadge: { borderRadius: 12, padding: 14, gap: 4 },
  orderBadgeNum: { fontSize: 17, fontWeight: '800' },
  orderBadgeEst: { fontSize: 13, color: dash.inkSoft },
  timeline: { gap: 0, paddingVertical: 8 },
  timelineRow: { position: 'relative' },
  timelineConnector: { position: 'absolute', left: 17, top: 0, width: 2, height: 16, zIndex: 0 },
  timelineContent: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotText: { fontSize: 14 },
  timelineText: { flex: 1, gap: 2 },
  timelineLabel: { fontSize: 15, fontWeight: '600', color: dash.ink },
  timelineActive: { fontSize: 12, fontWeight: '600' },
  timelineSub: { fontSize: 12, color: dash.muted },
});
