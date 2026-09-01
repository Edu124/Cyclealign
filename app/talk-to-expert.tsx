import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, TextField } from '@/components/ui';
import { palette, radius, spacing } from '@/theme';
import {
  fetchMyExpertRequests,
  submitExpertRequest,
  type ExpertRequest,
} from '@/lib/expertRequests';

const STATUS_LABEL: Record<ExpertRequest['status'], string> = {
  new: 'Received',
  read: 'Being reviewed',
  resolved: 'Answered',
};

export default function TalkToExpert() {
  const [concern, setConcern] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<ExpertRequest[]>([]);

  useEffect(() => {
    fetchMyExpertRequests().then(setHistory);
  }, []);

  async function handleSubmit() {
    if (!concern.trim()) {
      setError('Tell us a little about your concern first.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await submitExpertRequest(concern);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Something went wrong — please try again.');
      return;
    }
    setConcern('');
    setSent(true);
    fetchMyExpertRequests().then(setHistory);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Talk with an Expert</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.intro}>
            Have a question or concern about your cycle, symptoms, or how to use
            CycleAlign? Send it here — a member of our team reviews every submission.
          </Text>
        </Animated.View>

        {sent && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.sentBanner}>
            <Text style={styles.sentText}>
              ✓ Sent — thank you for reaching out. Our team reviews every message and will follow up with you soon.
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.form}>
          <TextField
            label="Your concern"
            placeholder="What's on your mind?"
            value={concern}
            onChangeText={(t) => { setConcern(t); setError(''); }}
            multiline
            numberOfLines={6}
          />
          {error ? <Text style={styles.fieldError}>{error}</Text> : null}
          <Button label="Send" onPress={handleSubmit} loading={loading} />
        </Animated.View>

        {history.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.historyWrap}>
            <Text style={styles.historyTitle}>Your past submissions</Text>
            {history.map((h) => (
              <View key={h.id} style={styles.historyCard}>
                <Text style={styles.historyConcern} numberOfLines={3}>{h.concern}</Text>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyDate}>
                    {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={[styles.historyStatus, h.status === 'resolved' && styles.historyStatusResolved]}>
                    {STATUS_LABEL[h.status]}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  intro: { fontSize: 15, color: palette.inkSoft, lineHeight: 22 },
  sentBanner: {
    backgroundColor: '#EEF6E8',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sentText: { fontSize: 14, color: '#4A7A35', fontWeight: '600', textAlign: 'center' },
  form: { gap: spacing.md },
  fieldError: { fontSize: 12, color: '#C2683F', fontWeight: '600', marginTop: -8 },
  historyWrap: { gap: spacing.sm, marginTop: spacing.md },
  historyTitle: { fontSize: 13, fontWeight: '800', color: palette.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  historyCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    gap: 6,
  },
  historyConcern: { fontSize: 14, color: palette.ink, lineHeight: 20 },
  historyMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyDate: { fontSize: 12, color: palette.muted },
  historyStatus: { fontSize: 12, fontWeight: '700', color: palette.roseDeep },
  historyStatusResolved: { color: palette.lavenderDeep },
});
