import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import {
  SALE_CATALOG,
  STOREFRONT_META,
  formatPrice,
  type SaleItem,
} from '@/lib/retailTherapy/catalog';
import { saleIsLive, useRetailTherapy } from '@/lib/stores/useRetailTherapy';
import { dash, palette } from '@/theme';
import { fonts } from '@/theme/fonts';

function useCountdown(endsAt: string | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return '0:00:00';
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FlashSale() {
  const { saleEndsAt, saleStorefront, orders, placeOrder } = useRetailTherapy();
  const [bag, setBag] = useState<string[]>([]);
  const [placed, setPlaced] = useState(false);

  const live = saleIsLive(saleEndsAt);
  const meta = STOREFRONT_META[saleStorefront];
  const items = SALE_CATALOG[saleStorefront];
  const countdown = useCountdown(saleEndsAt);

  const bagItems = useMemo(
    () => items.filter((i) => bag.includes(i.id)),
    [bag, items],
  );
  const total = bagItems.reduce((s, i) => s + i.salePrice, 0);
  const saved = bagItems.reduce((s, i) => s + (i.price - i.salePrice), 0);

  const pastOrders = orders.slice(0, 5);

  function toggle(item: SaleItem) {
    setBag((b) => (b.includes(item.id) ? b.filter((x) => x !== item.id) : [...b, item.id]));
  }

  function handlePlaceOrder() {
    if (bagItems.length === 0) return;
    placeOrder({
      storefront: saleStorefront,
      itemNames: bagItems.map((i) => i.name),
      emojis: bagItems.map((i) => i.emoji),
      total,
    });
    setBag([]);
    setPlaced(true);
  }

  // ── Confirmation state ─────────────────────────────────────────────────────
  if (placed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.confirmWrap}>
          <Animated.Text entering={ZoomIn.delay(150).duration(500)} style={styles.confirmEmoji}>
            🎀
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).duration(500)} style={styles.confirmTitle}>
            Ordered. It's yours tonight.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(450).duration(500)} style={styles.confirmSub}>
            Enjoy the feeling — that was the whole point. No charge, no delivery, just the
            rush. It'll quietly float away in a few days.
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={{ width: '100%' }}>
            <Pressable style={styles.cta} onPress={() => router.back()}>
              <Text style={styles.ctaText}>Back to my day</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{meta.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sale banner */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.banner}>
          <Text style={styles.bannerEmoji}>{meta.emoji}</Text>
          <Text style={styles.bannerTitle}>70% OFF</Text>
          <Text style={styles.bannerSub}>{meta.tagline}</Text>
          {live ? (
            <View style={styles.countPill}>
              <Text style={styles.countText}>ends in {countdown}</Text>
            </View>
          ) : (
            <View style={[styles.countPill, { backgroundColor: palette.line }]}>
              <Text style={[styles.countText, { color: palette.inkSoft }]}>
                sale's resting — it returns when you need it
              </Text>
            </View>
          )}
        </Animated.View>

        <Text style={styles.privacyNote}>
          ✨ Feel-good shopping — zero charges, zero delivery, 100% dopamine
        </Text>

        {/* Product grid */}
        {live && (
          <View style={styles.grid}>
            {items.map((item, i) => {
              const inBag = bag.includes(item.id);
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(i * 60).duration(350)}
                  style={[styles.card, inBag && styles.cardActive]}
                >
                  {item.tag && (
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                  )}
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceWas}>{formatPrice(item.price)}</Text>
                    <Text style={styles.priceNow}>{formatPrice(item.salePrice)}</Text>
                  </View>
                  <Pressable
                    style={[styles.addBtn, inBag && styles.addBtnActive]}
                    onPress={() => toggle(item)}
                  >
                    <Text style={[styles.addBtnText, inBag && styles.addBtnTextActive]}>
                      {inBag ? '✓ In bag' : 'Add to bag'}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Past impulses */}
        {pastOrders.length > 0 && (
          <View style={styles.pastWrap}>
            <Text style={styles.pastTitle}>Past impulses</Text>
            {pastOrders.map((o) => (
              <View key={o.id} style={styles.pastRow}>
                <Text style={styles.pastEmojis}>{o.emojis.slice(0, 3).join(' ')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pastNames} numberOfLines={1}>
                    {o.itemNames.join(', ')}
                  </Text>
                  <Text style={styles.pastMeta}>
                    {formatPrice(o.total)} ·{' '}
                    {o.status === 'active' ? 'riding the rush 🎢' : 'served its purpose ✓'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky order bar */}
      {live && bagItems.length > 0 && (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.orderBar}>
          <View>
            <Text style={styles.orderTotal}>{formatPrice(total)}</Text>
            <Text style={styles.orderSaved}>you're "saving" {formatPrice(saved)} 💅</Text>
          </View>
          <Pressable style={styles.orderBtn} onPress={handlePlaceOrder}>
            <Text style={styles.orderBtnText}>Order {bagItems.length} · feel the rush</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backText: { fontSize: 18, color: palette.inkSoft, fontWeight: '600' },
  headerTitle: { fontFamily: fonts.headingBold, fontSize: 18, color: palette.ink },
  content: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },

  banner: {
    backgroundColor: '#2E2A26',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    gap: 6,
  },
  bannerEmoji: { fontSize: 34 },
  bannerTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 40,
    color: '#F6C6A8',
    letterSpacing: 1,
  },
  bannerSub: { fontSize: 14, color: '#D8CFC5' },
  countPill: {
    marginTop: 8,
    backgroundColor: '#C2683F',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countText: { fontSize: 13, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },

  privacyNote: {
    fontSize: 12,
    color: '#9A7B2E',
    textAlign: 'center',
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.line,
    padding: 14,
    gap: 5,
  },
  cardActive: { borderColor: dash.clay },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7E3D9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: { fontSize: 9, fontWeight: '800', color: dash.clay, letterSpacing: 0.4 },
  itemEmoji: { fontSize: 30 },
  itemName: { fontSize: 14, fontWeight: '700', color: palette.ink, lineHeight: 18 },
  itemBrand: { fontSize: 11, color: palette.muted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  priceWas: {
    fontSize: 12,
    color: palette.muted,
    textDecorationLine: 'line-through',
  },
  priceNow: { fontSize: 16, fontWeight: '800', color: dash.clay },
  addBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: dash.clay,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnActive: { backgroundColor: dash.clay },
  addBtnText: { fontSize: 12, fontWeight: '800', color: dash.clay },
  addBtnTextActive: { color: '#FFF' },

  pastWrap: { gap: 10, marginTop: 10 },
  pastTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.muted,
    textTransform: 'uppercase',
  },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 12,
  },
  pastEmojis: { fontSize: 18 },
  pastNames: { fontSize: 13, fontWeight: '600', color: palette.ink },
  pastMeta: { fontSize: 12, color: palette.muted, marginTop: 1 },

  orderBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#2E2A26',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  orderTotal: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  orderSaved: { fontSize: 11, color: '#D8CFC5', marginTop: 1 },
  orderBtn: {
    backgroundColor: '#C2683F',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  orderBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  confirmWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  confirmEmoji: { fontSize: 56 },
  confirmTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 26,
    color: palette.ink,
    textAlign: 'center',
  },
  confirmSub: {
    fontSize: 15,
    color: palette.inkSoft,
    textAlign: 'center',
    lineHeight: 23,
  },
  cta: {
    backgroundColor: palette.lavenderDeep,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
