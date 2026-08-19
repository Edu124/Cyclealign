import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radius, spacing } from '@/theme';
import {
  fetchAllExpertRequests,
  isCurrentUserAdmin,
  updateExpertRequestStatus,
  type ExpertRequest,
  type ExpertRequestStatus,
} from '@/lib/expertRequests';

const STATUS_META: Record<ExpertRequestStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#B07A2E', bg: '#F6E9D4' },
  read: { label: 'Reviewing', color: '#5C8B74', bg: '#E7EEE0' },
  resolved: { label: 'Resolved', color: palette.lavenderDeep, bg: '#E9EFE2' },
};

export default function AdminExpertRequests() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [requests, setRequests] = useState<ExpertRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isCurrentUserAdmin().then((ok) => {
      setAllowed(ok);
      setChecking(false);
      if (ok) load();
    });
  }, []);

  async function load() {
    setLoading(true);
    const data = await fetchAllExpertRequests();
    setRequests(data);
    setLoading(false);
  }

  async function setStatus(id: string, status: ExpertRequestStatus) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await updateExpertRequestStatus(id, status);
  }

  if (checking) return null;

  if (!allowed) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>This page isn't available.</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.emptyBack}>← Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Expert Requests</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        {!loading && requests.length === 0 && (
          <Text style={styles.emptyList}>No submissions yet.</Text>
        )}

        {requests.map((r, i) => {
          const meta = STATUS_META[r.status];
          return (
            <Animated.View
              key={r.id}
              entering={FadeInDown.delay(i * 40).duration(300)}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <Text style={styles.date}>
                  {new Date(r.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>

              <Text style={styles.concern}>{r.concern}</Text>

              {(r.name || r.email) && (
                <Text style={styles.contact}>
                  {[r.name, r.email].filter(Boolean).join(' · ')}
                </Text>
              )}

              <View style={styles.actionRow}>
                {(['new', 'read', 'resolved'] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(r.id, s)}
                    style={[
                      styles.actionBtn,
                      r.status === s && { backgroundColor: STATUS_META[s].bg, borderColor: STATUS_META[s].color },
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        r.status === s && { color: STATUS_META[s].color, fontWeight: '800' },
                      ]}
                    >
                      {STATUS_META[s].label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          );
        })}
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  emptyList: { textAlign: 'center', color: palette.muted, marginTop: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: palette.inkSoft },
  emptyBack: { fontSize: 14, fontWeight: '700', color: palette.lavenderDeep },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.md,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: palette.muted, fontWeight: '600' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  concern: { fontSize: 14, color: palette.ink, lineHeight: 20 },
  contact: { fontSize: 12, color: palette.muted },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: palette.inkSoft },
});
