import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UserProfileModal } from '@/components/dashboard/UserProfileModal';
import { EnergyHeroCard } from '@/components/dashboard/EnergyHeroCard';
import { CycleOverviewCard } from '@/components/dashboard/CycleOverviewCard';
import { TodayFocusCard } from '@/components/dashboard/TodayFocusCard';
import { TodayTasksCard } from '@/components/dashboard/TodayTasksCard';
import { QuickLogCard } from '@/components/dashboard/QuickLogCard';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import {
  CAPACITY,
  FOCUS_TILES,
  HERO_GUIDANCE,
  capacityPhaseFor,
} from '@/lib/intelligence/capacity';
import { todayISO } from '@/lib/dates';
import { dash } from '@/theme';

export default function Today() {
  const profile = useAppStore((s) => s.profile);
  const addCycleLog = useAppStore((s) => s.addCycleLog);
  const prediction = usePrediction();
  const [profileOpen, setProfileOpen] = useState(false);
  const [overdueDismissed, setOverdueDismissed] = useState(false);

  function handleLogPeriodToday() {
    if (!profile) return;
    const today = todayISO();
    addCycleLog({ id: String(Date.now()), userId: profile.id, startDate: today });
    setOverdueDismissed(true);
  }

  if (!profile || !prediction) {
    return (
      <Screen gradient={[dash.bg, dash.bg]} contentStyle={styles.empty}>
        <Text style={styles.emptyText}>Set up your cycle to see your dashboard.</Text>
      </Screen>
    );
  }

  const capPhase = capacityPhaseFor(prediction);
  const capacity = CAPACITY[capPhase];
  const dateISO = todayISO();

  return (
    <>
      <Screen gradient={[dash.bg, dash.bg]} contentStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(450)}>
          <DashboardHeader
            name={profile.name}
            onAvatarPress={() => setProfileOpen(true)}
          />
        </Animated.View>

        {prediction.isOverdue && !overdueDismissed && (
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.overdueBanner}>
            <Text style={styles.overdueEmoji}>🌙</Text>
            <View style={styles.overdueText}>
              <Text style={styles.overdueTitle}>Has your period started?</Text>
              <Text style={styles.overdueSub}>Your expected date has passed — let us know so we can recalibrate.</Text>
            </View>
            <View style={styles.overdueActions}>
              <Pressable style={styles.overdueYes} onPress={handleLogPeriodToday}>
                <Text style={styles.overdueYesLabel}>Yes, log it</Text>
              </Pressable>
              <Pressable onPress={() => setOverdueDismissed(true)}>
                <Text style={styles.overdueNo}>Not yet</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <EnergyHeroCard
            phase={prediction.currentPhase}
            dayOfCycle={prediction.dayOfCycle}
            capacity={capacity}
            hero={HERO_GUIDANCE[capPhase]}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(450)}>
          <CycleOverviewCard
            dayOfCycle={prediction.dayOfCycle}
            cycleLength={prediction.cycleLength}
            phase={prediction.currentPhase}
            onPress={() => router.push('/(tabs)/plan')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(450)}>
          <TodayFocusCard tiles={FOCUS_TILES[capPhase]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(290).duration(450)}>
          <TodayTasksCard dateISO={dateISO} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(450)}>
          <QuickLogCard dateISO={dateISO} />
        </Animated.View>
      </Screen>

      <UserProfileModal
        visible={profileOpen}
        profile={profile}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, gap: 16 },
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: dash.inkSoft, fontSize: 16, textAlign: 'center' },

  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FDF4EE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDD9C8',
    padding: 14,
  },
  overdueEmoji: { fontSize: 22, marginTop: 1 },
  overdueText: { flex: 1 },
  overdueTitle: { fontSize: 14, fontWeight: '700', color: dash.ink, marginBottom: 2 },
  overdueSub: { fontSize: 12, color: dash.inkSoft, lineHeight: 17 },
  overdueActions: { flexDirection: 'column', gap: 6, alignItems: 'flex-end', marginTop: 2 },
  overdueYes: {
    backgroundColor: '#B06070',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  overdueYesLabel: { fontSize: 12, fontWeight: '700', color: '#fff' },
  overdueNo: { fontSize: 12, color: dash.inkSoft },
});
