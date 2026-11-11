import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuickLogCard } from '@/components/dashboard/QuickLogCard';
import { useAppStore } from '@/lib/stores/useAppStore';
import { todayISO } from '@/lib/dates';
import { dash, palette } from '@/theme';

/** Mood / symptom check-in — where the "check in" notifications land. */
export default function CheckIn() {
  const profile = useAppStore((s) => s.profile);

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/today');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={back} style={styles.backBtn} hitSlop={10} accessibilityLabel="Back">
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Quick check-in</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          How are you feeling today? Log your energy and mood, and add symptoms under "More detail" if you like.
          Everything is optional.
        </Text>
        {profile ? (
          <QuickLogCard dateISO={todayISO()} />
        ) : (
          <Text style={styles.intro}>Sign in to log a check-in.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dash.bg },
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
  content: { padding: 18, gap: 14, paddingBottom: 48 },
  intro: { fontSize: 14, lineHeight: 20, color: dash.inkSoft },
});
