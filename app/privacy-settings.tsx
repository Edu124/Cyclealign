import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { usePrivacySettings, SensitivityFilter } from '@/lib/stores/usePrivacySettings';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { useCalendar } from '@/lib/stores/useCalendar';
import { signOut } from '@/lib/auth';
import { dash, palette, spacing } from '@/theme';

type RadioOption = { value: SensitivityFilter; label: string; desc: string };

const SENSITIVITY_OPTIONS: RadioOption[] = [
  {
    value: 'skip',
    label: 'Skip them entirely',
    desc: "Don't analyse or show personal events",
  },
  {
    value: 'acknowledge',
    label: 'Acknowledge only',
    desc: 'Add buffer time, no scoring',
  },
  {
    value: 'analyse',
    label: 'Analyse everything',
    desc: "I'm comfortable with full analysis",
  },
];

export default function PrivacySettings() {
  const { sensitivityFilter, storeLabelsOnDevice, set } = usePrivacySettings();
  const reset = useAppStore((s) => s.reset);
  const resetOnboarding = useOnboarding((s) => s.reset);
  const disconnect = useCalendar((s) => s.disconnect);

  async function handleDeleteData() {
    const msg =
      'Delete ALL data? This permanently removes your profile, cycle history and tasks. This cannot be undone.';
    const confirmed =
      Platform.OS === 'web' ? window.confirm(msg) : false;
    if (!confirmed) return;
    reset();
    resetOnboarding();
    disconnect();
    await signOut();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & Data</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Setting 1 — Calendar Sync (V2) */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <SectionLabel>Calendar</SectionLabel>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Sync my work calendar</Text>
                <Text style={styles.settingDesc}>
                  Score scheduled events against your cycle phase
                </Text>
              </View>
              <View style={styles.v2Row}>
                <View style={styles.comingSoonPill}>
                  <Text style={styles.comingSoonText}>V2</Text>
                </View>
                <Switch
                  value={false}
                  disabled
                  trackColor={{ false: palette.line, true: dash.sage }}
                  style={{ opacity: 0.4 }}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Setting 2 — Sensitive Event Handling */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <SectionLabel>Sensitive Events</SectionLabel>
          <View style={styles.card}>
            <Text style={styles.radioQuestion}>
              How should CycleALIGN handle personal events?
            </Text>
            <View style={styles.radioGroup}>
              {SENSITIVITY_OPTIONS.map((opt, i) => {
                const active = sensitivityFilter === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.radioRow, i < 2 && styles.radioRowBorder]}
                    onPress={() => set({ sensitivityFilter: opt.value })}
                  >
                    <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                      {active && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.radioText}>
                      <Text style={[styles.radioLabel, active && styles.radioLabelActive]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.radioDesc}>{opt.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Setting 3 — Device-only task labels */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <SectionLabel>Task Labels</SectionLabel>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Store labels on this device only</Text>
                <Text style={styles.settingDesc}>
                  Task labels stay local and are not synced to the cloud
                </Text>
              </View>
              <Switch
                value={storeLabelsOnDevice}
                onValueChange={(v) => set({ storeLabelsOnDevice: v })}
                trackColor={{ false: palette.line, true: dash.sage }}
                thumbColor="#FFFFFF"
              />
            </View>
            {!storeLabelsOnDevice && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ Labels will sync to the cloud. Only disable this if you're comfortable
                  with cloud storage.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* GDPR — Your rights */}
        <Animated.View entering={FadeInDown.delay(210).duration(400)}>
          <SectionLabel>Your Rights (GDPR)</SectionLabel>
          <View style={styles.card}>
            <Text style={styles.gdprIntro}>
              CycleALIGN processes health data only with your explicit consent, and cycle
              predictions are computed on your device. Under the EU General Data Protection
              Regulation (and equivalent laws), you have the right to:
            </Text>
            {GDPR_RIGHTS.map((r) => (
              <View key={r.title} style={styles.gdprRow}>
                <Text style={styles.gdprBullet}>{r.icon}</Text>
                <View style={styles.gdprText}>
                  <Text style={styles.gdprTitle}>{r.title}</Text>
                  <Text style={styles.gdprDesc}>{r.desc}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.gdprFootnote}>
              To exercise any of these rights, email hello@cyclealign.app — we respond
              within 30 days. Deleting your data below fulfils erasure immediately.
            </Text>
          </View>
        </Animated.View>

        {/* Setting 4 — Delete data */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)}>
          <SectionLabel>Danger Zone</SectionLabel>
          <View style={styles.card}>
            <Text style={styles.dangerDesc}>
              Permanently deletes your profile, all cycle logs, tasks and account. This
              action cannot be reversed.
            </Text>
            <Pressable style={styles.deleteBtn} onPress={handleDeleteData}>
              <Text style={styles.deleteBtnText}>Delete all my data</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footer}>
          <Text style={styles.footerText}>
            Your data is computed on-device and never sold. We only sync what is necessary
            for your account.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const GDPR_RIGHTS = [
  {
    icon: '📄',
    title: 'Access',
    desc: 'Request a copy of all personal data we hold about you.',
  },
  {
    icon: '✏️',
    title: 'Rectification',
    desc: 'Correct anything inaccurate — your profile and cycle details are editable in-app.',
  },
  {
    icon: '🗑️',
    title: 'Erasure ("right to be forgotten")',
    desc: 'Delete your account and every trace of your data, permanently.',
  },
  {
    icon: '📦',
    title: 'Portability',
    desc: 'Receive your data in a machine-readable format to take elsewhere.',
  },
  {
    icon: '✋',
    title: 'Withdraw consent',
    desc: 'Stop any processing at any time — including notifications and cloud sync.',
  },
  {
    icon: '⚖️',
    title: 'Lodge a complaint',
    desc: 'Contact your local data-protection authority if you believe we fell short.',
  },
];

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
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48, gap: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.muted,
    marginTop: 20,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
  settingDesc: { fontSize: 13, color: palette.muted, marginTop: 3, lineHeight: 18 },
  v2Row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  comingSoonPill: {
    backgroundColor: '#EEE8F4',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.lavenderDeep,
    letterSpacing: 0.5,
  },
  warningBanner: {
    backgroundColor: '#FEF3CD',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  warningText: { fontSize: 12, color: '#856404', lineHeight: 17 },
  radioQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink,
    lineHeight: 20,
  },
  radioGroup: { gap: 0 },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 14,
  },
  radioRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioOuterActive: { borderColor: dash.sage },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: dash.sage },
  radioText: { flex: 1 },
  radioLabel: { fontSize: 14, fontWeight: '600', color: palette.inkSoft },
  radioLabelActive: { color: palette.ink },
  radioDesc: { fontSize: 12, color: palette.muted, marginTop: 2, lineHeight: 17 },
  gdprIntro: { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },
  gdprRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  gdprBullet: { fontSize: 16, marginTop: 1 },
  gdprText: { flex: 1 },
  gdprTitle: { fontSize: 14, fontWeight: '700', color: palette.ink },
  gdprDesc: { fontSize: 12, color: palette.muted, marginTop: 2, lineHeight: 17 },
  gdprFootnote: {
    fontSize: 12,
    color: palette.muted,
    lineHeight: 17,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  dangerDesc: { fontSize: 14, color: palette.inkSoft, lineHeight: 20 },
  deleteBtn: {
    backgroundColor: '#FFF0ED',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F4C4B8',
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: '#C2683F' },
  footer: { marginTop: spacing.lg },
  footerText: {
    fontSize: 12,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
