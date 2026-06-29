import { useState } from 'react';
import {
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
  price: number;
  tag?: string;
}

const PHASE_PRODUCTS: Record<PhaseKey, Product[]> = {
  menstrual: [
    { id: 'm1', emoji: '🛁', name: 'Lavender Bath Soak', price: 18000, tag: 'Best Seller' },
    { id: 'm2', emoji: '🕯️', name: 'Calming Candle Set', price: 24000 },
    { id: 'm3', emoji: '🍫', name: 'Premium Chocolate Box', price: 12000, tag: 'Fan Fave' },
    { id: 'm4', emoji: '🧸', name: 'Weighted Comfort Plush', price: 35000 },
    { id: 'm5', emoji: '🍵', name: 'Herbal Tea Collection', price: 15000 },
    { id: 'm6', emoji: '🌡️', name: 'Heating Pad Deluxe', price: 29000, tag: 'New' },
  ],
  follicular: [
    { id: 'f1', emoji: '📓', name: 'Manifestation Journal', price: 22000, tag: 'Trending' },
    { id: 'f2', emoji: '🎨', name: 'Art Supply Kit', price: 38000 },
    { id: 'f3', emoji: '🌱', name: 'Indoor Plant Set', price: 29000, tag: 'Best Seller' },
    { id: 'f4', emoji: '🎵', name: 'Wireless Earbuds', price: 89000 },
    { id: 'f5', emoji: '💪', name: 'Resistance Bands Set', price: 19000 },
    { id: 'f6', emoji: '✏️', name: 'Stationery Bundle', price: 16000, tag: 'New' },
  ],
  ovulation: [
    { id: 'o1', emoji: '👗', name: 'Statement Dress', price: 75000, tag: 'Hot Pick' },
    { id: 'o2', emoji: '💄', name: 'Glow Makeup Kit', price: 45000, tag: 'Best Seller' },
    { id: 'o3', emoji: '💐', name: 'Fresh Flower Bouquet', price: 32000 },
    { id: 'o4', emoji: '✨', name: 'Jewelry Set', price: 48000 },
    { id: 'o5', emoji: '🌟', name: 'Skincare Glow Set', price: 55000, tag: 'Trending' },
    { id: 'o6', emoji: '👜', name: 'Mini Crossbody Bag', price: 62000 },
  ],
  luteal: [
    { id: 'l1', emoji: '🌿', name: 'Face Mask Collection', price: 28000, tag: 'Self-Care' },
    { id: 'l2', emoji: '🛋️', name: 'Comfort Pillow Set', price: 42000 },
    { id: 'l3', emoji: '📚', name: 'Novel Bundle', price: 35000, tag: 'Cozy Pick' },
    { id: 'l4', emoji: '🧘', name: 'Yoga Mat & Blocks', price: 55000 },
    { id: 'l5', emoji: '🫖', name: 'Comfort Tea Kit', price: 20000, tag: 'Best Seller' },
    { id: 'l6', emoji: '🌸', name: 'Aromatherapy Set', price: 33000 },
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
  return `₩${p.toLocaleString()}`;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirm';

interface Props {
  phaseKey: PhaseKey;
}

export function DopamineMenuCard({ phaseKey }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
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
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { id: product.id, emoji: product.emoji, name: product.name, price: product.price, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
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
          <Text style={styles.title}>Dopamine Shop</Text>
          <Text style={[styles.subtitle, { color: phaseColor }]}>
            {PHASE_LABELS[phaseKey]}
          </Text>
        </View>
        {cartCount > 0 && (
          <Pressable
            style={[styles.cartBtn, { backgroundColor: phaseColor }]}
            onPress={openCheckout}
          >
            <Text style={styles.cartBtnText}>🛒 {cartCount}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.tagline}>{PHASE_TAGLINES[phaseKey]}</Text>

      {/* Notice pill */}
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
              {product.tag && (
                <View style={[styles.tagPill, { backgroundColor: phaseColor + '22' }]}>
                  <Text style={[styles.tagText, { color: phaseColor }]}>{product.tag}</Text>
                </View>
              )}
              <Text style={styles.productEmoji}>{product.emoji}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={[styles.productPrice, { color: phaseColor }]}>
                {formatPrice(product.price)}
              </Text>
              <Pressable
                style={[
                  styles.addBtn,
                  inCart
                    ? { backgroundColor: phaseColor }
                    : { backgroundColor: phaseColor + '18', borderColor: phaseColor, borderWidth: 1 },
                ]}
                onPress={() => addToCart(product)}
              >
                <Text style={[styles.addBtnText, { color: inCart ? '#fff' : phaseColor }]}>
                  {inCart ? `In cart (${inCart.qty})` : 'Add to Cart'}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Cart CTA */}
      {cartCount > 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Pressable
            style={[styles.checkoutCta, { backgroundColor: phaseColor }]}
            onPress={openCheckout}
          >
            <Text style={styles.checkoutCtaText}>
              View Cart · {formatPrice(cartTotal)}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={checkoutOpen}
        animationType="slide"
        transparent
        onRequestClose={closeCheckout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {step === 'cart' && (
              <CartStep
                cart={cart}
                total={cartTotal}
                phaseColor={phaseColor}
                onRemove={removeFromCart}
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

function CartStep({ cart, total, phaseColor, onRemove, onContinue, onClose }: {
  cart: CartItem[];
  total: number;
  phaseColor: string;
  onRemove: (id: string) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Your Cart 🛒</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Text style={styles.stepClose}>✕</Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
        {cart.map((item) => (
          <View key={item.id} style={styles.cartRow}>
            <Text style={styles.cartEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cartName}>{item.name}</Text>
              <Text style={styles.cartQtyPrice}>
                x{item.qty} · {formatPrice(item.price * item.qty)}
              </Text>
            </View>
            <Pressable onPress={() => onRemove(item.id)} hitSlop={10}>
              <Text style={styles.cartRemove}>✕</Text>
            </Pressable>
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
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.stepBack}>← Back</Text>
        </Pressable>
      </View>
      <Text style={styles.stepHint}>Where should your good vibes arrive?</Text>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor={dash.muted}
        value={address.name}
        onChangeText={(v) => onChange({ ...address, name: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Street address"
        placeholderTextColor={dash.muted}
        value={address.street}
        onChangeText={(v) => onChange({ ...address, street: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor={dash.muted}
        value={address.city}
        onChangeText={(v) => onChange({ ...address, city: v })}
      />
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
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.stepBack}>← Back</Text>
        </Pressable>
      </View>
      <Text style={styles.stepHint}>Enter your feel-good card details</Text>
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

function ConfirmStep({ orderNumber, phaseColor, onClose }: {
  orderNumber: string;
  phaseColor: string;
  onClose: () => void;
}) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.stepWrap}>
      <Animated.Text entering={ZoomIn.delay(200).duration(500)} style={styles.confirmEmoji}>
        🎊
      </Animated.Text>
      <Text style={styles.confirmTitle}>Order Confirmed!</Text>
      <Text style={styles.confirmSub}>
        Your order <Text style={{ color: phaseColor, fontWeight: '700' }}>#{orderNumber}</Text> is on its way — in your imagination 💫
      </Text>
      <View style={[styles.confirmPill, { backgroundColor: phaseColor + '18' }]}>
        <Text style={[styles.confirmPillText, { color: phaseColor }]}>
          Dopamine delivered ✓
        </Text>
      </View>
      <Text style={styles.confirmNote}>
        No charges were made. This was your moment of joy — and you deserved every bit of it.
      </Text>
      <Pressable style={[styles.stepBtn, { backgroundColor: phaseColor }]} onPress={onClose}>
        <Text style={styles.stepBtnText}>Back to Shopping 🛍️</Text>
      </Pressable>
    </Animated.View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 18, fontWeight: '800', color: dash.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tagline: { fontSize: 13, color: dash.inkSoft, marginTop: -6 },
  cartBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  cartBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  noticePill: {
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  noticeText: { fontSize: 12, color: '#9A7B2E', textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#F9F6F1',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    position: 'relative',
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  productEmoji: { fontSize: 28 },
  productName: { fontSize: 13, fontWeight: '600', color: dash.ink, lineHeight: 17 },
  productPrice: { fontSize: 14, fontWeight: '700' },
  addBtn: {
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 2,
  },
  addBtnText: { fontSize: 12, fontWeight: '700' },
  checkoutCta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  checkoutCtaText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: dash.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  stepWrap: { padding: 24, gap: 14 },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: { fontSize: 18, fontWeight: '800', color: dash.ink },
  stepClose: { fontSize: 16, color: dash.muted },
  stepBack: { fontSize: 14, color: dash.inkSoft, fontWeight: '600' },
  stepHint: { fontSize: 13, color: dash.muted, marginTop: -6 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: dash.line,
  },
  cartEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  cartName: { fontSize: 14, fontWeight: '600', color: dash.ink },
  cartQtyPrice: { fontSize: 12, color: dash.muted, marginTop: 2 },
  cartRemove: { fontSize: 14, color: dash.muted, paddingHorizontal: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: dash.line,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: dash.ink },
  totalValue: { fontSize: 18, fontWeight: '800' },
  noChargeNotice: {
    backgroundColor: '#EEF6E8',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  noChargeText: { fontSize: 12, color: '#4A7A35', fontWeight: '500' },
  stepBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  stepBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  input: {
    backgroundColor: '#F9F6F1',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: dash.ink,
  },
  fakeCard: {
    backgroundColor: '#2E2A26',
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  fakeCardNum: { fontSize: 20, color: '#fff', letterSpacing: 3, fontWeight: '300' },
  fakeCardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  confirmEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 4 },
  confirmTitle: { fontSize: 24, fontWeight: '800', color: dash.ink, textAlign: 'center' },
  confirmSub: { fontSize: 14, color: dash.inkSoft, textAlign: 'center', lineHeight: 20 },
  confirmPill: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmPillText: { fontSize: 14, fontWeight: '700' },
  confirmNote: {
    fontSize: 12,
    color: dash.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
