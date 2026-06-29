import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { palette } from '@/theme';

const PHOTO_H = 340;
const TRAVELS = ['🇮🇳 India', '🌍 Europe', '🌍 Africa', '🌏 Asia'];

export default function FounderScreen() {
  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── PHOTO ── */}
        <Animated.View entering={FadeIn.duration(900)} style={styles.photoWrap}>
          <Image
            source={require('../../assets/founder.jpg')}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Warm terracotta tint */}
          <View style={styles.warmCast} />

          {/* Bottom gradient — fades photo into cream */}
          <LinearGradient
            colors={['transparent', 'rgba(247,244,239,0.7)', '#F7F4EF']}
            locations={[0.5, 0.82, 1]}
            style={styles.photoGradient}
          />
        </Animated.View>

        {/* ── NAME — sits below photo on cream bg ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.nameSection}>
          <Text style={styles.founderLabel}>CYCLEALIGN · FOUNDER</Text>
          <Text style={styles.nameText}>Vinita</Text>
          <Text style={styles.nameSubText}>Delhi, India · Founder & Investor</Text>
        </Animated.View>

        {/* ── ARTICLE ── */}
        <View style={styles.article}>

          {/* Sage rule */}
          <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.rule} />

          {/* Pull quote */}
          <Animated.View entering={FadeInLeft.delay(700).duration(700)} style={styles.quoteBlock}>
            <View style={styles.quoteBorder} />
            <Text style={styles.quoteText}>
              "The most commercially powerful businesses are the ones that also solve something real."
            </Text>
          </Animated.View>

          {/* Travel chips */}
          <Animated.View entering={FadeInDown.delay(850).duration(600)} style={styles.chips}>
            {TRAVELS.map((t) => (
              <View key={t} style={styles.chip}>
                <Text style={styles.chipText}>{t}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Bio */}
          <Animated.Text entering={FadeInDown.delay(1000).duration(600)} style={styles.bio}>
            Vinita is a founder, investor, and traveller with 6+ years of marketing experience across India, Europe, Africa, and Asia. She builds at the intersection of{' '}
            <Text style={styles.bioHighlight}>women's health, climate tech, and entrepreneurship.</Text>
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(1100).duration(600)} style={styles.bio}>
            Through Aurang India, she launched CycleAlign — a decision intelligence brand for women in leadership. When she's not building, she's investing in early-stage founders and{' '}
            <Text style={styles.bioHighlight}>travelling the world.</Text>
          </Animated.Text>

          {/* Signature divider */}
          <Animated.View entering={FadeIn.delay(1200).duration(600)} style={styles.sigRow}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>— Vinita</Text>
            <View style={styles.sigLine} />
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(1300).duration(600)} style={styles.ctaWrap}>
            <View style={styles.ctaBtn}>
              <Text
                style={styles.ctaText}
                onPress={() => router.replace('/(tabs)/today')}
              >
                Begin your journey  →
              </Text>
            </View>
            <Text style={styles.ctaHint}>Your CycleAlign is ready</Text>
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F4EF' },

  // Photo
  photoWrap: {
    width: '100%',
    height: PHOTO_H,
    overflow: 'hidden',
  },
  warmCast: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C06A45',
    opacity: 0.07,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PHOTO_H * 0.5,
  },
  labelPill: {
    position: 'absolute',
    bottom: 72,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  // Name — below photo, on cream
  nameSection: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 4,
  },
  founderLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: palette.lavenderDeep,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 48,
    fontWeight: '800',
    color: palette.ink,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  nameSubText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.inkSoft,
    letterSpacing: 0.3,
  },

  // Article
  article: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 20,
  },
  rule: {
    height: 1.5,
    backgroundColor: palette.lavender,
    width: 48,
    borderRadius: 2,
  },
  quoteBlock: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  quoteBorder: {
    width: 3,
    borderRadius: 2,
    backgroundColor: palette.roseDeep,
    alignSelf: 'stretch',
  },
  quoteText: {
    flex: 1,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 25,
    color: palette.ink,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#EEE9E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.inkSoft,
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    color: palette.inkSoft,
  },
  bioHighlight: {
    color: palette.ink,
    fontWeight: '600',
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
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

  // CTA
  ctaWrap: { alignItems: 'center', gap: 10, marginTop: 8 },
  ctaBtn: {
    width: '100%',
    backgroundColor: palette.lavenderDeep,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ctaHint: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: '500',
  },
});
