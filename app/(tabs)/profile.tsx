import { useState } from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, TabScreen } from '@/components/ui';
import { palette, phaseColors, spacing } from '@/theme';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useSettings } from '@/lib/stores/useSettings';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { signOut } from '@/lib/auth';

const PHASE_LABELS: Record<string, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulatory',
  luteal: 'Luteal',
};

const PHASE_EMOJI: Record<string, string> = {
  menstrual: '🌙',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🍂',
};

export default function Profile() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const profile = useAppStore((s) => s.profile);
  const prediction = usePrediction();
  const phase = prediction?.currentPhase ?? null;
  const phaseColor = phase ? phaseColors[phase].base : palette.lavenderDeep;

  const retailTherapy = useSettings((s) => s.retailTherapy);
  const appVersion = useSettings((s) => s.appVersion);
  const setSettings = useSettings((s) => s.set);

  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  async function handleSignOut() {
    await signOut();
    useAppStore.getState().reset();
    router.replace('/onboarding/welcome');
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete My Account',
      'This will permanently erase all your cycle data and preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            useAppStore.getState().reset();
            router.replace('/onboarding/welcome');
          },
        },
      ],
    );
  }

  function handleChangePassword() {
    setPwError('');
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSuccess(true);
    setTimeout(() => {
      setPwModal(false);
      setPwSuccess(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    }, 1400);
  }

  return (
    <TabScreen>
      {/* Avatar + name */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: phaseColor + '28', borderColor: phaseColor }]}>
          <Text style={[styles.avatarText, { color: phaseColor }]}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? 'Your Profile'}</Text>
        {profile?.role && <Text style={styles.role}>{profile.role}</Text>}
      </Animated.View>

      {/* Cycle snapshot */}
      {prediction && phase && (
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Card>
            <Text style={styles.cardLabel}>CURRENT CYCLE</Text>
            <View style={styles.phaseRow}>
              <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
              <Text style={styles.phaseText}>
                {PHASE_EMOJI[phase]} {PHASE_LABELS[phase]} phase — Day {prediction.dayOfCycle} of {prediction.cycleLength}
              </Text>
            </View>
            <Text style={styles.nextPeriod}>
              Next period in {prediction.daysUntilNextPeriod > 0
                ? `${prediction.daysUntilNextPeriod} days`
                : 'approx. today'}
            </Text>
          </Card>
        </Animated.View>
      )}

      {/* Settings */}
      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        <Card padded={false}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Retail Therapy mode</Text>
              <Text style={styles.settingDesc}>
                When we sense a rough patch, we'll surprise you with a little feel-good
                shopping. No real charges, ever.
              </Text>
            </View>
            <Switch
              value={retailTherapy}
              onValueChange={(v) => setSettings({ retailTherapy: v })}
              trackColor={{ false: palette.line, true: palette.lavenderDeep }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>App experience</Text>
              <Text style={styles.settingDesc}>
                {appVersion === 'v1'
                  ? 'V1 — the current experience'
                  : 'V2 — early access (features arriving soon)'}
              </Text>
            </View>
            <View style={styles.versionToggle}>
              {(['v1', 'v2'] as const).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setSettings({ appVersion: v })}
                  style={[styles.versionBtn, appVersion === v && styles.versionBtnActive]}
                >
                  <Text
                    style={[
                      styles.versionBtnText,
                      appVersion === v && styles.versionBtnTextActive,
                    ]}
                  >
                    {v.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Account links */}
      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
        <Card padded={false}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.divider} />
          <LinkRow label="Change Password"    onPress={() => setPwModal(true)} />
          <View style={styles.divider} />
          <LinkRow label="Privacy Settings"   onPress={() => router.push('/privacy-settings')} />
          <View style={styles.divider} />
          <LinkRow label="Terms & Conditions" onPress={() => router.push('/terms')} />
          <View style={styles.divider} />
          <LinkRow label="Go Premium 🌿"      onPress={() => router.push('/paywall')} />
          <View style={styles.divider} />
          <LinkRow label="Contact Us"         onPress={() => Linking.openURL('mailto:hello@cyclealign.app')} />
        </Card>
      </Animated.View>

      {/* Danger zone */}
      <Animated.View entering={FadeInDown.delay(210).duration(400)}>
        <Card padded={false}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.divider} />
          <Pressable onPress={handleDeleteAccount} style={styles.linkRow}>
            <Text style={[styles.linkLabel, { color: palette.danger }]}>Delete My Account</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>
      </Animated.View>

      {/* Sign out */}
      <Animated.View entering={FadeInDown.delay(270).duration(400)}>
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </Animated.View>

      {/* Change password modal */}
      <Modal visible={pwModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => { setPwModal(false); setPwError(''); }}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Change Password</Text>
            {pwSuccess ? (
              <View style={styles.successRow}>
                <Text style={styles.successText}>✓ Password updated successfully</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.pwInput}
                  placeholder="Current password"
                  secureTextEntry
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  placeholderTextColor={palette.muted}
                />
                <TextInput
                  style={styles.pwInput}
                  placeholder="New password (min 8 chars)"
                  secureTextEntry
                  value={newPw}
                  onChangeText={setNewPw}
                  placeholderTextColor={palette.muted}
                />
                <TextInput
                  style={styles.pwInput}
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  placeholderTextColor={palette.muted}
                />
                {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}
                <TouchableOpacity style={styles.pwSaveBtn} onPress={handleChangePassword} activeOpacity={0.85}>
                  <Text style={styles.pwSaveBtnText}>Update Password</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Footer */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.footer}>
        <Text style={styles.version}>CycleAlign v{version}</Text>
        <Text style={styles.copyright}>© 2026 CycleAlign · made with 💛 for the women, by the women</Text>
      </Animated.View>
    </TabScreen>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkRow}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: palette.ink },
  role: { fontSize: 14, color: palette.inkSoft, fontStyle: 'italic' },

  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.roseDeep,
    marginBottom: spacing.sm,
  },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseText: { fontSize: 15, fontWeight: '600', color: palette.ink, flex: 1 },
  nextPeriod: { fontSize: 13, color: palette.inkSoft, marginTop: 6 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: palette.muted,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  linkLabel: { fontSize: 15, fontWeight: '600', color: palette.ink },
  chevron: { fontSize: 22, color: palette.muted },
  divider: { height: 1, backgroundColor: palette.line, marginHorizontal: spacing.xl },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
  settingDesc: { fontSize: 12, color: palette.muted, marginTop: 3, lineHeight: 17 },
  versionToggle: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceAlt,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  versionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  versionBtnActive: { backgroundColor: palette.lavenderDeep },
  versionBtnText: { fontSize: 12, fontWeight: '800', color: palette.muted },
  versionBtnTextActive: { color: '#FFFFFF' },

  signOutBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: palette.danger },

  footer: { alignItems: 'center', gap: 4, paddingTop: spacing.sm },
  version: { fontSize: 13, color: palette.muted },
  copyright: { fontSize: 12, color: palette.muted },

  // Change password modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, gap: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 4 },
  pwInput: {
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.ink,
    backgroundColor: palette.surface,
  },
  pwError: { fontSize: 13, color: palette.danger, fontWeight: '600' },
  pwSaveBtn: { backgroundColor: palette.lavenderDeep, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  pwSaveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  successRow: { alignItems: 'center', paddingVertical: 16 },
  successText: { fontSize: 16, fontWeight: '700', color: '#56723F' },
});
