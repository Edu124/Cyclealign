import { useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { dash, phaseColors, spacing } from '@/theme';
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

  const products = PHASE_PRODUCTS[phaseKey];
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
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shop</Text>
          <Text style={[styles.subtitle, { color: phaseColor }]}>
            {PHASE_LABELS[phaseKey]}
          </Text>
        </View>
        {cartCount > 0 && (
          <Pressable style={[styles.cartBtn, { backgroundColor: phaseColor }]} onPress={openCheckout}>
            <Text style={styles.cartBtnText}>🛒 {cartCount}</Text>
          </Pressable>
        )}
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

      {cartCount > 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Pressable style={[styles.checkoutCta, { backgroundColor: phaseColor }]} onPress={openCheckout}>
            <Text style={styles.checkoutCtaText}>
              View Cart · {cartCount} item{cartCount > 1 ? 's' : ''} · {formatPrice(cartTotal)}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Checkout Modal */}
      <Modal visible={checkoutOpen} animationType="slide" transparent onRequestClose={closeCheckout}>
        <View style={styles.modalOverlay}>
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
        </View>
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
