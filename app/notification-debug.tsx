import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationLedger } from '@/lib/stores/useNotificationLedger';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';
import { currentLibrary } from '@/lib/notify/service';
import { resyncNotifications } from '@/lib/notify/useNotifications';
import { palette } from '@/theme';
import { Platform } from 'react-native';
import { useRatingPrompt, ratingBlockReason } from '@/lib/rating';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { isQuietNow } from '@/lib/notify/decide';

function stamp(ms: number | null | undefined): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
}

/**
 * QA / debug view: estimated phase, confidence, the selected content, the
 * next scheduled time, delivery statuses and skip reasons. Ids only — no
 * message text or logged health details beyond the phase category.
 */
export default function NotificationDebug() {
  const ledger = useNotificationLedger();
  const prefs = useNotificationPrefs();
  const sync = ledger.lastSync;
  const items = Object.values(ledger.items).sort((a, b) => a.at - b.at);
  const lib = currentLibrary();
  const rating = useRatingPrompt();
  const flags = useFeatureFlags();
  const checkIns = Object.keys(useDailyLog((s) => s.logs)).length;
  const ratingReason = ratingBlockReason(rating, {
    now: Date.now(),
    platform: Platform.OS,
    enabled: flags.ratingPrompt,
    signedInAndOnboarded: true,
    checkIns,
    otherPromptRecently: false,
    quietHours: isQuietNow(new Date(), lib.config),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10} accessibilityLabel="Back">
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notification diagnostics</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.btn} onPress={resyncNotifications}>
          <Text style={styles.btnText}>Re-plan now</Text>
        </Pressable>

        <Section title="Last plan">
          <Line k="Planned at" v={stamp(sync?.at)} />
          <Line k="Time zone" v={sync?.timeZone ?? '—'} />
          <Line k="OS permission" v={sync?.permission ?? '—'} />
          <Line k="Phase estimate" v={sync?.phase ?? 'none'} />
          <Line k="Confidence" v={sync?.confidence ?? '—'} />
          <Line k="Cycle day" v={sync?.dayOfCycle != null ? String(sync.dayOfCycle) : '—'} />
          <Line k="Next push" v={`${stamp(sync?.nextAt)}  ${sync?.nextContentId ?? ''}`} />
          <Line k="Pushes queued" v={String(sync?.scheduledCount ?? 0)} />
          <Line k="Library" v={`v${lib.version} · ${lib.messages.length} messages · cap ${lib.config.dailyCap}`} />
          <Line
            k="Prefs"
            v={`on=${prefs.enabled} ${prefs.dailyHour}:${String(prefs.dailyMinute).padStart(2, '0')} inApp=${prefs.inApp} evening=${prefs.eveningCheckin} periodConfirm=${prefs.periodConfirm} preview=${prefs.descriptivePreviews}`}
          />
        </Section>

        <Section title="Rating prompt">
          <Line k="Status" v={ratingReason ?? 'eligible now'} />
          <Line k="Asked" v={`${rating.shownCount}× · last ${stamp(rating.lastShownAt)}`} />
          <Line k="Active days / check-ins" v={`${rating.activeDays.length} / ${checkIns}`} />
          <Line k="Rated / opted out" v={`${rating.rated} / ${rating.optedOut}`} />
          <Line k="Flags" v={`rhythmOnboarding=${flags.rhythmOnboarding} ratingPrompt=${flags.ratingPrompt}`} />
        </Section>

        <Section title="Skip reasons">
          {(sync?.skips ?? []).length === 0 ? (
            <Text style={styles.mono}>none</Text>
          ) : (
            sync!.skips.map((s, i) => (
              <Text key={i} style={styles.mono}>{`${s.localDate}  ${s.type}  ${s.reason}`}</Text>
            ))
          )}
        </Section>

        <Section title="Events (planned + delivered)">
          {items.map((i) => (
            <Text key={i.eventId} style={styles.mono}>
              {`${stamp(i.at)}  ${i.type}\n  ${i.contentId} v${i.contentVersion}  ${i.channel}${i.pushScheduled ? '+os' : ''}  ${i.status}  ${i.phase ?? '-'}/${i.confidence}`}
            </Text>
          ))}
        </Section>

        <Section title="Log (latest 40)">
          {ledger.events.slice(-40).reverse().map((e, i) => (
            <Text key={i} style={styles.mono}>
              {`${stamp(e.at)}  ${e.status}  ${e.type ?? ''} ${e.contentId ?? ''} ${e.channel ?? ''} ${e.detail ?? ''}`}
            </Text>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <Text style={styles.mono}>
      <Text style={{ fontWeight: '700' }}>{k}: </Text>
      {v}
    </Text>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: palette.ink },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 12, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: palette.ink, marginBottom: 4 },
  mono: { fontSize: 11.5, color: palette.ink, lineHeight: 16 },
  btn: { alignSelf: 'flex-start', backgroundColor: palette.ink, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
