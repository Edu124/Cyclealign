import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { TabScreen } from '@/components/ui';
import { palette } from '@/theme';
import { fonts } from '@/theme/fonts';

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconDecision({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path d="M27 17a10 10 0 1 1-3-7.1" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M27 6v6h-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 17l3 3 6-6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPostpartum({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path
        d="M17 27C9 21 5 16 5 11.5 5 7.9 7.9 5 11.5 5c2.1 0 4 .9 5.5 2.6C18.5 5.9 20.4 5 22.5 5 26.1 5 29 7.9 29 11.5 29 16 25 21 17 27Z"
        stroke={color} strokeWidth={2.2} strokeLinejoin="round"
      />
      <Path d="M9 16h4l2-4 3 7 2-3h5" stroke={color} strokeWidth={1.7}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </Svg>
  );
}

function IconWearable({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path d="M12 9h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3Z"
        stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M13 9V4.5h8V9M13 25v4.5h8V25" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M12.5 17h2.5l1.5-3 2.5 6 1.5-3h1" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconMentalHealth({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path d="M17 15c-2.5-4.5-1.5-8.5 0-10.5C18.5 6.5 19.5 10.5 17 15Z"
        stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M17 16c-3-3-7-3.5-9.5-2C9 17.5 12.5 19.5 17 18.5M17 16c3-3 7-3.5 9.5-2C25 17.5 21.5 19.5 17 18.5"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 24c2.5 2.5 13.5 2.5 16 0M12 28.5c2 1.3 8 1.3 10 0"
        stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function IconMoods({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Circle cx={17} cy={17} r={11} stroke={color} strokeWidth={2.2} />
      <Path d="M12.5 14.5v1.5M21.5 14.5v1.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M12 21c1.5 1.8 3.3 2.6 5 2.6s3.5-.8 5-2.6" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M26.5 6.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9.9-2Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

function IconSleep({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path d="M24 21.5A10 10 0 1 1 12.5 8a8 8 0 0 0 11.5 13.5Z"
        stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M21 6h5l-5 5h5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconExpert({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path d="M27 8a3 3 0 0 0-3-3H10a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2v5l6-5h6a3 3 0 0 0 3-3V8Z"
        stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M12 11.5h10M12 15.5h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function IconDiet({ color }: { color: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 34 34" fill="none">
      <Path
        d="M21 12c3 0 6 2.7 6 7.5C27 25 23 29 19 29c-1.3 0-2-.6-2-.6s-.7.6-2 .6c-4 0-8-4-8-9.5C7 14.7 10 12 13 12c1.6 0 2.8.6 4 1.6 1.2-1 2.4-1.6 4-1.6Z"
        stroke={color} strokeWidth={2.2} strokeLinejoin="round"
      />
      <Path d="M17 12c0-2.5 1-4.5 3-5.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

// ── feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: 'decision',
    label: 'Cycle-Based\nDecision Making',
    intro: "Know the best days to plan, decide, and act — mapped to your cycle's natural rhythm.",
    circleBg: '#F5ECD0',
    iconColor: '#B07820',
    Icon: IconDecision,
    directHref: '/(tabs)/plan' as const,
  },
  {
    id: 'wearable',
    label: 'Sync My\nWearable Data',
    intro: 'Connect your watch or band — sleep, heart rate and readiness, read through the lens of your cycle.',
    circleBg: '#D9E6F2',
    iconColor: '#4A7BA6',
    Icon: IconWearable,
  },
  {
    id: 'mental',
    label: 'Support My\nMental Health',
    intro: 'Phase-aware check-ins, grounding exercises and gentle support on the heavier days.',
    circleBg: '#E6DFF2',
    iconColor: palette.lavenderDeep,
    Icon: IconMentalHealth,
  },
  {
    id: 'postpartum',
    label: 'Recovering\nPostpartum Stress',
    intro: 'Gentle, phase-aware guidance to support your body and mind after childbirth.',
    circleBg: '#D4E2C5',
    iconColor: '#56723F',
    Icon: IconPostpartum,
  },
  {
    id: 'moods',
    label: 'Understand\nMy Moods',
    intro: 'See why you feel the way you do — your mood patterns, decoded against your hormones.',
    circleBg: '#F9E3D3',
    iconColor: '#C2683F',
    Icon: IconMoods,
    directHref: '/(tabs)/phases' as const,
  },
  {
    id: 'sleep',
    label: 'Improve\nMy Sleep',
    intro: 'Wind-down routines and rest insights tuned to each phase of your cycle.',
    circleBg: '#DAD8EE',
    iconColor: '#6B64B8',
    Icon: IconSleep,
  },
  {
    id: 'nutrition',
    label: 'Nutrition Guidance\nas per Cycle',
    intro: 'Simple food suggestions tailored to what your body craves in each phase.',
    circleBg: '#D0EDE4',
    iconColor: palette.tealDeep,
    Icon: IconDiet,
  },
  {
    id: 'expert',
    label: 'Talk with\nan Expert',
    intro: 'Send us your question or concern — our team reviews every submission.',
    circleBg: palette.blush,
    iconColor: palette.roseDeep,
    Icon: IconExpert,
    href: '/talk-to-expert' as const,
  },
];

type Feature = (typeof FEATURES)[number];

// ── flip card ─────────────────────────────────────────────────────────────────

function FlipCard({ feature }: { feature: Feature }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flip = useSharedValue(0);

  function toggle() {
    // These two go straight to the real feature — no flip, no peek.
    if (feature.directHref) {
      Haptics.selectionAsync().catch(() => {});
      router.push(feature.directHref as never);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    const next = !isFlipped;
    setIsFlipped(next);
    flip.value = withTiming(next ? 180 : 0, { duration: 380 });
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${flip.value}deg` }],
    opacity: flip.value > 90 ? 0 : 1,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${flip.value - 180}deg` }],
    opacity: flip.value > 90 ? 1 : 0,
  }));

  return (
    <Pressable onPress={toggle} style={styles.card}>
      <Animated.View style={[styles.face, frontStyle]}>
        <View style={[styles.iconCircle, { backgroundColor: feature.circleBg }]}>
          <feature.Icon color={feature.iconColor} />
        </View>
        <Text style={styles.cardLabel}>{feature.label}</Text>
      </Animated.View>

      <Animated.View style={[styles.face, styles.faceBack, backStyle, { backgroundColor: feature.circleBg + '40' }]}>
        <Text style={[styles.backLabel, { color: feature.iconColor }]}>
          {feature.label.replace('\n', ' ')}
        </Text>
        <Text style={styles.backIntro}>{feature.intro}</Text>
        {feature.href ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              router.push(feature.href as never);
            }}
            style={[styles.ctaBtn, { backgroundColor: feature.iconColor }]}
          >
            <Text style={styles.ctaBtnText}>Ask now →</Text>
          </Pressable>
        ) : (
          <Text style={styles.backHint}>Tap to flip back</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function DiscoverTab() {
  const rows: Feature[][] = [];
  for (let i = 0; i < FEATURES.length; i += 2) rows.push(FEATURES.slice(i, i + 2));

  return (
    <TabScreen>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>COMING SOON</Text>
          </View>
        </View>
        <Text style={styles.title}>What can we{'\n'}help you with?</Text>
        <Text style={styles.subtitle}>Tap a card for a quick peek at what's coming</Text>
      </Animated.View>

      {/* Feature grid */}
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <Animated.View
            key={ri}
            entering={FadeInDown.delay(120 + ri * 80).duration(400)}
            style={styles.row}
          >
            {row.map((f) => (
              <FlipCard key={f.id} feature={f} />
            ))}
            {row.length < 2 && <View style={[styles.card, { opacity: 0 }]} />}
          </Animated.View>
        ))}
      </View>

      {/* Footer note */}
      <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.footer}>
        <Text style={styles.footerText}>
          We're building these features based on what matters most to our community.
          Stay tuned for updates.
        </Text>
      </Animated.View>
    </TabScreen>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badgeRow: { marginBottom: 10 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.lavenderDeep + '18',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: palette.lavenderDeep + '40',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.lavenderDeep,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fonts.headingBold,
    fontSize: 26,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.3,
    lineHeight: 33,
  },
  subtitle: {
    fontSize: 15,
    color: palette.inkSoft,
    marginTop: 4,
  },

  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    minHeight: 190,
    backgroundColor: palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 12,
    borderRadius: 20,
  },
  faceBack: {
    gap: 6,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.ink,
    textAlign: 'center',
    lineHeight: 18,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  backIntro: {
    fontSize: 12.5,
    color: palette.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
  backHint: {
    fontSize: 10,
    color: palette.muted,
    fontWeight: '600',
    marginTop: 4,
  },
  ctaBtn: {
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  ctaBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  footer: {
    padding: 18,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
  },
  footerText: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 20,
    textAlign: 'center',
  },
});
