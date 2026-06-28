import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash, palette, spacing } from '@/theme';
import { fonts } from '@/theme/fonts';

// Razorpay Payment Link — confirm with Vinnie if still active
const RAZORPAY_MONTHLY_LINK = 'https://rzp.io/l/cyclealign-monthly';
const RAZORPAY_ANNUAL_LINK  = 'https://rzp.io/l/cyclealign-annual';

type Gate = {
  emoji: string;
  label: string;
};

const FEATURE_GATES: Record<string, Gate> = {
  taskScore:     { emoji: '📊', label: 'Task Score & Reschedule' },
  weeklyForecast:{ emoji: '📅', label: 'Weekly Phase Forecast' },
  patternHistory:{ emoji: '🔍', label: 'Pattern History' },
  roleTasks:     { emoji: '🎯', label: 'Role-Specific Daily Tasks' },
};

type FeatureRow = {
  label: string;
  free: string | boolean;
  premium: string | boolean;
};

const FEATURE_TABLE: FeatureRow[] = [
  { label: 'Current phase + day',     free: true,          premium: true },
  { label: 'Daily insight notification', free: '3×/week',  premium: 'Daily' },
  { label: 'Quick log',               free: true,          premium: true },
  { label: "Today's guidance",        free: 'Basic',       premium: 'Full' },
  { label: 'Task Sync',               free: '3/month',     premium: 'Unlimited' },
  { label: 'Task score + reschedule', free: false,         premium: true },
  { label: 'Weekly phase forecast',   free: false,         premium: true },
  { label: 'Pattern history',         free: false,         premium: true },
  { label: 'Role-specific tasks',     free: false,         premium: true },
];

export default function Paywall() {
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const gate = feature ? FEATURE_GATES[feature] : null;

  function subscribe(plan: 'monthly' | 'annual') {
    const url = plan === 'monthly' ? RAZORPAY_MONTHLY_LINK : RAZORPAY_ANNUAL_LINK;
    Linking.openURL(url);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Go Premium</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Gate message */}
        {gate && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.gateBanner}>
            <Text style={styles.gateEmoji}>{gate.emoji}</Text>
            <Text style={styles.gateText}>
              <Text style={styles.gateBold}>{gate.label}</Text> is a Premium feature.
              Upgrade to unlock it.
            </Text>
          </Animated.View>
        )}

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.hero}>
          <Text style={styles.heroTitle}>Work with your hormones,{'\n'}not against them.</Text>
          <Text style={styles.heroSub}>
            Premium gives you the full intelligence layer — forecasts, pattern history,
            role-specific tasks and unlimited task scoring.
          </Text>
        </Animated.View>

        {/* Feature table */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.tableCard}>
          {/* Column headers */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.tableCellFeature, styles.tableHeaderText]}>
              Feature
            </Text>
            <Text style={[styles.tableCell, styles.tableCellTier, styles.tableHeaderText]}>
              Free
            </Text>
            <Text style={[styles.tableCell, styles.tableCellTier, styles.tableHeaderPremium]}>
              Premium
            </Text>
          </View>
          {FEATURE_TABLE.map((row, i) => (
            <View
              key={row.label}
              style={[styles.tableRow, i < FEATURE_TABLE.length - 1 && styles.tableRowBorder]}
            >
              <Text style={[styles.tableCell, styles.tableCellFeature]}>{row.label}</Text>
              <Text style={[styles.tableCell, styles.tableCellTier, styles.tableFree]}>
                {renderCell(row.free)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellTier, styles.tablePremium]}>
                {renderCell(row.premium)}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Pricing cards */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.pricingRow}>
          {/* Annual (highlighted) */}
          <Pressable
            style={[styles.pricingCard, styles.pricingCardHighlight]}
            onPress={() => subscribe('annual')}
          >
            <View style={styles.bestValuePill}>
              <Text style={styles.bestValueText}>Best value</Text>
            </View>
            <Text style={styles.planLabel}>Annual</Text>
            <Text style={styles.planPrice}>₹2,999</Text>
            <Text style={styles.planPer}>/year</Text>
            <Text style={styles.planNote}>≈ ₹250/mo — 2 months free</Text>
            <View style={styles.subscribeBtn}>
              <Text style={styles.subscribeBtnText}>Subscribe</Text>
            </View>
          </Pressable>

          {/* Monthly */}
          <Pressable
            style={styles.pricingCard}
            onPress={() => subscribe('monthly')}
          >
            <Text style={styles.planLabel}>Monthly</Text>
            <Text style={styles.planPrice}>₹299</Text>
            <Text style={styles.planPer}>/month</Text>
            <Text style={styles.planNote}>Billed monthly</Text>
            <View style={[styles.subscribeBtn, styles.subscribeBtnGhost]}>
              <Text style={[styles.subscribeBtnText, styles.subscribeBtnGhostText]}>
                Subscribe
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Trust signals */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.trust}>
          {[
            '🔒 Payments secured by Razorpay',
            '↩️ Refund within 7 days, no questions',
            '🔇 Cancel anytime — no lock-in',
          ].map((t) => (
            <Text key={t} style={styles.trustText}>{t}</Text>
          ))}
        </Animated.View>

        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.skipLink}>
          <Text style={styles.skipText}>Continue with free →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function renderCell(value: string | boolean): string {
  if (value === true)  return '✓';
  if (value === false) return '—';
  return value;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 28, color: palette.ink, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: palette.ink },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 16 },

  gateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FBF0E4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8C99A',
    padding: 14,
  },
  gateEmoji: { fontSize: 24 },
  gateText: { flex: 1, fontSize: 14, color: '#7A5022', lineHeight: 20 },
  gateBold: { fontWeight: '700' },

  hero: { gap: 8, paddingVertical: 4 },
  heroTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 26,
    color: palette.ink,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  heroSub: { fontSize: 14, lineHeight: 22, color: palette.inkSoft },

  tableCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
  },
  tableRow: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 14 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: palette.line },
  tableHeader: { backgroundColor: '#F3EDE6' },
  tableCell: { fontSize: 13 },
  tableCellFeature: { flex: 1, color: palette.inkSoft, fontWeight: '500' },
  tableCellTier: { width: 70, textAlign: 'center' },
  tableHeaderText: { fontWeight: '800', color: palette.ink, fontSize: 12 },
  tableHeaderPremium: { fontWeight: '800', color: dash.sage, fontSize: 12 },
  tableFree: { color: palette.muted, fontWeight: '600' },
  tablePremium: { color: dash.sage, fontWeight: '700' },

  pricingRow: { flexDirection: 'row', gap: 12 },
  pricingCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.line,
    padding: 16,
    gap: 2,
    alignItems: 'center',
  },
  pricingCardHighlight: {
    borderColor: dash.sage,
    backgroundColor: '#EFF5E8',
  },
  bestValuePill: {
    backgroundColor: dash.sage,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  bestValueText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  planLabel: { fontSize: 13, fontWeight: '700', color: palette.inkSoft },
  planPrice: { fontFamily: fonts.headingBold, fontSize: 30, color: palette.ink },
  planPer: { fontSize: 13, color: palette.muted },
  planNote: { fontSize: 11, color: palette.muted, marginTop: 4, textAlign: 'center' },
  subscribeBtn: {
    backgroundColor: dash.sage,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  subscribeBtnGhost: { backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.line },
  subscribeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  subscribeBtnGhostText: { color: palette.ink },

  trust: { gap: 8, alignItems: 'center' },
  trustText: { fontSize: 13, color: palette.muted },

  skipLink: { alignItems: 'center', marginTop: spacing.sm },
  skipText: { fontSize: 13, fontWeight: '600', color: palette.lavenderDeep },
});
