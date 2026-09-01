import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';

const LOAD_MSGS = [
  'Personalizing your experience...',
  'Analyzing your cycle data...',
  'Building your insights...',
  'Ready ✓',
];

export default function FounderScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const loadBar = useSharedValue(0);

  useEffect(() => {
    loadBar.value = withTiming(1, { duration: 2800 });
    const t1 = setTimeout(() => setMsgIdx(1), 900);
    const t2 = setTimeout(() => setMsgIdx(2), 1800);
    const t3 = setTimeout(() => setMsgIdx(3), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Auto-advance — no button to tap, the letter just holds for a beat then continues.
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)/today'), 3000);
    return () => clearTimeout(t);
  }, []);

  const loadBarStyle = useAnimatedStyle(() => ({
    width: `${loadBar.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={styles.root}>
      {/* Thin loading bar — gives a sense that the app is personalising in the background */}
      <View style={styles.loadTrack}>
        <Animated.View style={[styles.loadFill, loadBarStyle]} />
      </View>
      <Animated.Text entering={FadeIn.duration(400)} style={styles.loadText}>
        {LOAD_MSGS[msgIdx]}
      </Animated.Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Compact header: photo + name side by side ── */}
        <Animated.View entering={FadeIn.duration(700)} style={styles.headerRow}>
          <Image
            source={require('../../assets/founder.jpg')}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.headerText}>
            <Text style={styles.founderLabel}>CYCLEALIGN · FOUNDER</Text>
            <Text style={styles.nameText}>Vinita</Text>
            <Text style={styles.nameSubText}>Delhi, India · Founder & Investor</Text>
          </View>
        </Animated.View>

        {/* ── Letter ── */}
        <Animated.Text entering={FadeInDown.delay(250).duration(600)} style={styles.title}>
          A Message From Our Founder
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.rule} />

        <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={styles.hook}>
          Does this happen to you — you snap at someone you love over something so small,
          and the guilt hits before you've even finished the sentence?
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(650).duration(600)} style={styles.body}>
          It happened to me too. And three days later, when my period arrived, I finally
          understood why. I'd spent my entire adult life apologising for hormones nobody
          ever explained to me — not in school, not in my MBA, not in any boardroom.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(800).duration(600)} style={styles.body}>
          That's why I built CycleALIGN. Not as another tracking app, but as something that
          actually helps you <Text style={styles.bodyHighlight}>understand yourself</Text>.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(950).duration(600)} style={styles.body}>
          If this sounds familiar — this is for you.
        </Animated.Text>

        {/* Closing line */}
        <Animated.Text entering={FadeInDown.delay(1100).duration(600)} style={styles.closing}>
          For the women, by the woman.
        </Animated.Text>

        {/* Signature divider */}
        <Animated.View entering={FadeIn.delay(1200).duration(600)} style={styles.sigRow}>
          <View style={styles.sigLine} />
          <Text style={styles.sigText}>— Vinita</Text>
          <View style={styles.sigLine} />
        </Animated.View>

        {/* Ready hint — page auto-advances, no tap needed */}
        <Animated.View entering={FadeInDown.delay(1300).duration(600)} style={styles.ctaWrap}>
          <Text style={styles.ctaHint}>Your CycleAlign is ready</Text>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F4EF' },

  // Loading indicator
  loadTrack: { height: 3, backgroundColor: '#EEE9E1', width: '100%' },
  loadFill: { height: '100%', backgroundColor: palette.lavenderDeep, borderRadius: 2 },
  loadText: {
    textAlign: 'center',
    fontSize: 12,
    color: palette.muted,
    fontWeight: '500',
    paddingVertical: 8,
    letterSpacing: 0.3,
  },

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 18,
  },

  // Compact header — small round photo, name beside it
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2.5,
    borderColor: palette.lavender,
  },
  headerText: { flex: 1, gap: 2 },
  founderLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: palette.lavenderDeep,
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  nameSubText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.inkSoft,
    letterSpacing: 0.3,
  },

  // Letter
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -0.4,
    lineHeight: 31,
    marginTop: 6,
  },
  rule: {
    height: 2,
    backgroundColor: palette.lavender,
    width: 52,
    borderRadius: 2,
  },
  hook: {
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 29,
    color: palette.ink,
  },
  body: {
    fontSize: 16.5,
    lineHeight: 27,
    color: palette.inkSoft,
  },
  bodyHighlight: {
    color: palette.ink,
    fontWeight: '700',
  },
  closing: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.lavenderDeep,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 6,
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sigLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.line,
  },
  sigText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: palette.muted,
    fontWeight: '500',
  },

  // Ready hint
  ctaWrap: { alignItems: 'center', gap: 10, marginTop: 4 },
  ctaHint: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: '500',
  },
});
