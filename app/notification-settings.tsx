import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';
import { useAppStore } from '@/lib/stores/useAppStore';
import { resolveMode } from '@/lib/adaptive/mode';
import { isCurrentUserAdmin } from '@/lib/expertRequests';
import {
  cancelAllNotifications,
  currentLibrary,
  hasPushPermission,
  isSupported,
  recordEvents,
  requestPushPermission,
} from '@/lib/notify/service';
import { dash, palette } from '@/theme';

const DAILY_TIMES: [number, number][] = [[8, 0], [9, 0], [10, 0], [12, 0], [18, 0], [20, 0]];
const EVENING_TIMES: [number, number][] = [[18, 0], [19, 0], [20, 0]];

function formatTime(h: number, m: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

/** Notification preferences: the daily message, optional reminders, privacy. */
export default function NotificationSettings() {
  const prefs = useNotificationPrefs();
  const profile = useAppStore((s) => s.profile);
  const regular = resolveMode(profile) === 'regular';
  const [permission, setPermission] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const cfg = currentLibrary().config;

  useEffect(() => {
    hasPushPermission().then(setPermission);
    isCurrentUserAdmin().then(setIsAdmin, () => {});
  }, []);

  async function toggleEnabled(v: boolean) {
    prefs.set({ enabled: v });
    recordEvents([{ at: Date.now(), status: v ? 'opt_in' : 'opt_out', type: 'daily_guidance' }]);
    if (v) setPermission(await requestPushPermission());
    else cancelAllNotifications();
  }

  function toggleReminder(key: 'eveningCheckin' | 'periodConfirm', v: boolean) {
    prefs.set({ [key]: v });
    recordEvents([{
      at: Date.now(),
      status: v ? 'opt_in' : 'opt_out',
      type: key === 'eveningCheckin' ? 'symptom_checkin' : 'period_confirmation',
    }]);
  }

  const on = prefs.enabled === true;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10} accessibilityLabel="Back">
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DAILY GUIDANCE</Text>
        <View style={styles.card}>
          <Row
            title="One daily message"
            desc="A short, optional tip based on your estimated cycle and your check-ins, with one thing you can do."
            value={on}
            onChange={toggleEnabled}
          />
          {on && isSupported && permission === false && (
            <View style={styles.warn}>
              <Text style={styles.warnText}>
                Notifications are turned off for CycleAlign in your phone settings, so you will only see your
                message inside the app.
              </Text>
              <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
                <Text style={styles.link}>Open phone settings</Text>
              </Pressable>
            </View>
          )}
          {on && (
            <>
              <View style={styles.divider} />
              <Text style={styles.subTitle}>Time</Text>
              <Chips
                options={DAILY_TIMES}
                selected={[prefs.dailyHour, prefs.dailyMinute]}
                onSelect={([h, m]) => prefs.set({ dailyHour: h, dailyMinute: m })}
              />
              <View style={styles.divider} />
              <Row
                title="Show it in the app too"
                desc="If you open CycleAlign after your message time, see it once as a pop-up. It never shows again after you close it."
                value={prefs.inApp}
                onChange={(v) => prefs.set({ inApp: v })}
              />
            </>
          )}
        </View>

        {on && (
          <>
            <Text style={styles.sectionLabel}>OPTIONAL REMINDERS</Text>
            <View style={styles.card}>
              <Row
                title="Evening check-in"
                desc="A reminder to log your mood or symptoms. Skipped on days you have already logged."
                value={prefs.eveningCheckin}
                onChange={(v) => toggleReminder('eveningCheckin', v)}
              />
              {prefs.eveningCheckin && (
                <Chips
                  options={EVENING_TIMES}
                  selected={[prefs.eveningHour, prefs.eveningMinute]}
                  onSelect={([h, m]) => prefs.set({ eveningHour: h, eveningMinute: m })}
                />
              )}
              {regular && (
                <>
                  <View style={styles.divider} />
                  <Row
                    title="Period date confirmation"
                    desc="The day after your estimated period start, a reminder to confirm the date if it has started."
                    value={prefs.periodConfirm}
                    onChange={(v) => toggleReminder('periodConfirm', v)}
                  />
                </>
              )}
            </View>

            <Text style={styles.sectionLabel}>PRIVACY</Text>
            <View style={styles.card}>
              <Row
                title="Show details on the lock screen"
                desc="Off: your lock screen shows a neutral line like “Tap to open today's guidance”. On: it shows the full message, which may mention your cycle or what you logged."
                value={prefs.descriptivePreviews}
                onChange={(v) => prefs.set({ descriptivePreviews: v })}
              />
            </View>
          </>
        )}

        <Text style={styles.footnote}>
          Quiet hours are {formatTime(cfg.quietStartHour, 0)} to {formatTime(cfg.quietEndHour, 0)}, and you will get no
          more than {cfg.dailyCap} notifications a day. Cycle phases and period dates are estimates. Messages are general
          wellness tips, not medical advice.
        </Text>

        {(isAdmin || __DEV__) && (
          <Pressable onPress={() => router.push('/notification-debug')} style={styles.debugLink}>
            <Text style={styles.link}>Notification diagnostics (QA)</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ title, desc, value, onChange }: { title: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ false: palette.line, true: dash.sage }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function Chips({
  options,
  selected,
  onSelect,
}: {
  options: [number, number][];
  selected: [number, number];
  onSelect: (v: [number, number]) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map(([h, m]) => {
        const active = h === selected[0] && m === selected[1];
        return (
          <Pressable
            key={`${h}:${m}`}
            onPress={() => onSelect([h, m])}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatTime(h, m)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
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
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48, gap: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.inkSoft,
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: palette.ink },
  rowDesc: { fontSize: 13, color: palette.inkSoft, marginTop: 3, lineHeight: 18 },
  subTitle: { fontSize: 13, fontWeight: '700', color: palette.ink },
  divider: { height: 1, backgroundColor: palette.line },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: dash.sageDeep, borderColor: dash.sageDeep },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.ink },
  chipTextActive: { color: '#FFFFFF' },
  warn: { backgroundColor: '#FEF3CD', borderRadius: 10, padding: 10, gap: 6 },
  warnText: { fontSize: 12.5, color: '#6B5104', lineHeight: 18 },
  link: { fontSize: 13, fontWeight: '700', color: dash.sageDeep },
  footnote: { fontSize: 12, color: palette.inkSoft, lineHeight: 18, marginTop: 18, paddingHorizontal: 4 },
  debugLink: { marginTop: 16, alignSelf: 'center', padding: 8 },
});
