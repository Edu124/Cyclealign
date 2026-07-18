import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Avatar } from './Avatar';
import { dash, palette } from '@/theme';
import { ROLE_OPTIONS } from '@/lib/roles';
import { signOut } from '@/lib/auth';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { useCalendar } from '@/lib/stores/useCalendar';
import { useSettings } from '@/lib/stores/useSettings';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useSubscription } from '@/lib/stores/useSubscription';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/models';

interface Props {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
}

function webConfirm(msg: string) {
  return Platform.OS === 'web' ? window.confirm(msg) : false;
}

export function UserProfileModal({ visible, profile, onClose }: Props) {
  const reset           = useAppStore((s) => s.reset);
  const resetOnboarding = useOnboarding((s) => s.reset);
  const disconnect      = useCalendar((s) => s.disconnect);

  const roleLabel = ROLE_OPTIONS.find((r) => r.value === profile.role)?.label ?? 'Not set';

  async function doSignOut() {
    onClose();
    reset();
    resetOnboarding();
    disconnect();
    // Device-local stores must not leak into the next account on this device:
    // settings (v2 flag), health logs, and premium status all reset to defaults.
    useSettings.getState().reset();
    useDailyLog.getState().reset();
    useSubscription.getState().downgrade();
    await signOut();
    router.replace('/');
  }

  const handleLogout = async () => {
    if (webConfirm('Log out of CycleAlign? You will return to the Welcome screen.')) {
      await doSignOut();
    }
  };

  const handleDelete = async () => {
    if (webConfirm('Delete all data? This permanently removes your profile and cycle history. This cannot be undone.')) {
      await doSignOut();
    }
  };

  const handleChangePassword = async () => {
    if (!profile.email) {
      window.alert('No email address on file. Please re-create your account with an email.');
      return;
    }
    if (!isSupabaseConfigured) {
      window.alert(`A password reset link would be sent to ${profile.email} once the backend is connected.`);
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
    if (error) {
      window.alert('Could not send reset email: ' + error.message);
    } else {
      window.alert(`Password reset link sent to ${profile.email}. Check your inbox.`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop — tap closes modal */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet — plain View, no event bubbling */}
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Avatar + name + role */}
          <Animated.View entering={FadeInDown.duration(320)} style={styles.hero}>
            <Avatar name={profile.name} size={72} />
            <Text style={styles.name}>{profile.name}</Text>
            {profile.email ? (
              <Text style={styles.email}>{profile.email}</Text>
            ) : null}
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.stats}>
            <StatCell label="Cycle"  value={`${profile.avgCycleLength} days`} />
            <View style={styles.statDivider} />
            <StatCell label="Period" value={`${profile.avgPeriodLength} days`} />
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(160).duration(320)} style={styles.actions}>
            <TouchableOpacity
              style={styles.changePassBtn}
              onPress={handleChangePassword}
              activeOpacity={0.8}
            >
              <Text style={styles.changePassText}>🔑  Change password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteText}>Delete account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: '#FAF8F4',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingHorizontal: 24,
    gap: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: dash.line,
    alignSelf: 'center',
    marginBottom: 8,
  },
  hero:  { alignItems: 'center', gap: 8 },
  name:  { fontSize: 24, fontWeight: '800', color: palette.ink, letterSpacing: -0.3 },
  email: { fontSize: 13, color: palette.muted, fontWeight: '500' },
  rolePill: {
    backgroundColor: '#EFF3E9',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: '700', color: palette.lavenderDeep },
  stats: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1, borderColor: palette.line,
    padding: 18,
  },
  statCell:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 22, fontWeight: '800', color: palette.ink },
  statLabel:   { fontSize: 12, fontWeight: '600', color: palette.muted },
  statDivider: { width: 1, backgroundColor: palette.line, marginVertical: 4 },
  actions: { gap: 10 },
  changePassBtn: {
    backgroundColor: palette.surface,
    borderWidth: 1.5, borderColor: palette.line,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  changePassText: { fontSize: 15, fontWeight: '600', color: palette.inkSoft },
  logoutBtn: {
    backgroundColor: palette.surface,
    borderWidth: 1.5, borderColor: palette.line,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText:  { fontSize: 16, fontWeight: '700', color: palette.ink },
  deleteBtn:   { paddingVertical: 14, alignItems: 'center' },
  deleteText:  { fontSize: 14, fontWeight: '700', color: '#C2683F' },
});
