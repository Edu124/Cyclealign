import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TabScreen } from '@/components/ui';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EnergyHeroCard } from '@/components/dashboard/EnergyHeroCard';
import { CycleOverviewCard } from '@/components/dashboard/CycleOverviewCard';
import { TodayFocusCard } from '@/components/dashboard/TodayFocusCard';
import { TodayTasksCard } from '@/components/dashboard/TodayTasksCard';
import { QuickLogCard } from '@/components/dashboard/QuickLogCard';
import { LogInsightCard } from '@/components/dashboard/LogInsightCard';
import { LifeStageCard } from '@/components/dashboard/LifeStageCard';
import { PeriodCheckInModal } from '@/components/dashboard/PeriodCheckInModal';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { analyzeLogs } from '@/lib/intelligence/logInsights';
import { useRetailTherapyTrigger } from '@/lib/retailTherapy/useRetailTherapyTrigger';
import { saleIsLive, useRetailTherapy } from '@/lib/stores/useRetailTherapy';
import { STOREFRONT_META } from '@/lib/retailTherapy/catalog';
import { useIsV2 } from '@/lib/hooks/useIsV2';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { syncScheduledNotifications } from '@/lib/notifications';
import { getMyInviteIfExists, publishDigestedStatus } from '@/lib/partnerSync';
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
  const dailyLogs = useDailyLog((s) => s.logs);
  const [overdueDismissed, setOverdueDismissed] = useState(false);

  const logInsight = prediction ? analyzeLogs(dailyLogs, prediction) : null;

  // V2-gated features (AI coach entry point).
  const isV2 = useIsV2();

  // Keep the on-device notification schedule in sync with her cycle: daily
  // briefing / dishes / log reminder + the period heads-up, recomputed
  // whenever the prediction moves. Opt-out clears everything.
  const notificationsEnabled = useOnboarding((s) => s.notificationEnabled);
  useEffect(() => {
    syncScheduledNotifications(prediction, notificationsEnabled);
  }, [prediction?.dayOfCycle, prediction?.daysUntilNextPeriod, notificationsEnabled]);

  // Partner Sync: whenever her prediction or today's log changes, republish the
  // digested status onto her own link row (only if she's already connected to
  // a partner — this never creates a link on its own).
  useEffect(() => {
    if (!prediction) return;
    getMyInviteIfExists().then((link) => {
      if (link && link.status === 'active') publishDigestedStatus(link, prediction);
    });
  }, [prediction?.currentPhase, prediction?.isOverdue, dailyLogs[todayISO()]]);

  // Retail Therapy: reacts to today's Quick Log (trigger sale / dissolve orders).
  useRetailTherapyTrigger(prediction);
  const saleEndsAt = useRetailTherapy((s) => s.saleEndsAt);
  const saleStorefront = useRetailTherapy((s) => s.saleStorefront);
  const saleLive = saleIsLive(saleEndsAt);

  function handleLogPeriodToday() {
    if (!profile) return;
    const today = todayISO();
    addCycleLog({ id: String(Date.now()), userId: profile.id, startDate: today });
    setOverdueDismissed(true);
  }

  if (!profile || !prediction) {
    return (
      <>
        <TabScreen gradient={[dash.bg, dash.bg]} contentStyle={styles.empty}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={styles.emptyText}>
            Tell us about your cycle and your dashboard comes to life.
          </Text>
          <Pressable
            style={styles.emptyCta}
            onPress={() => router.push('/onboarding/cycle')}
          >
            <Text style={styles.emptyCtaText}>Set up my cycle</Text>
          </Pressable>
        </TabScreen>
      </>
    );
  }

  const capPhase = capacityPhaseFor(prediction);
  const capacity = CAPACITY[capPhase];
  const dateISO = todayISO();

  return (
    <>
      <TabScreen gradient={[dash.bg, dash.bg]} contentStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(450)}>
          <DashboardHeader
            name={profile.name}
            onAvatarPress={() => router.push('/(tabs)/profile')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <EnergyHeroCard
            phase={prediction.currentPhase}
            dayOfCycle={prediction.dayOfCycle}
            capacity={capacity}
            hero={HERO_GUIDANCE[capPhase]}
          />
        </Animated.View>

        {saleLive && (
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <Pressable
              style={({ pressed }) => [styles.saleBanner, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/flash-sale')}
            >
              <Text style={styles.saleEmoji}>{STOREFRONT_META[saleStorefront].emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.saleTitle}>
                  Tonight only: 70% off at {STOREFRONT_META[saleStorefront].title}
                </Text>
                <Text style={styles.saleSub}>A little treat while the storm passes →</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(115).duration(450)}>
          <QuickLogCard dateISO={dateISO} />
        </Animated.View>

        {logInsight && (
          <Animated.View entering={FadeInDown.delay(130).duration(450)}>
            <LogInsightCard insight={logInsight} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(140).duration(450)}>
          <LifeStageCard />
        </Animated.View>

        {isV2 && (
          <Animated.View entering={FadeInDown.delay(150).duration(450)}>
            <Pressable
              style={({ pressed }) => [styles.coachCard, pressed && styles.coachCardPressed]}
              onPress={() => router.push('/ai-coach')}
            >
              <View style={styles.coachIcon}>
                <Text style={styles.coachIconEmoji}>🌿</Text>
              </View>
              <View style={styles.coachTextWrap}>
                <Text style={styles.coachTitle}>Ask Align ✨</Text>
                <Text style={styles.coachSub}>Your cycle coach — 5 questions a day</Text>
              </View>
              <Text style={styles.coachChevron}>›</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(220).duration(450)}>
          <CycleOverviewCard
            dayOfCycle={prediction.dayOfCycle}
            cycleLength={prediction.cycleLength}
            phase={prediction.currentPhase}
            onPress={() => router.push('/(tabs)/plan')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(290).duration(450)}>
          <TodayFocusCard tiles={FOCUS_TILES[capPhase]} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(450)}>
          <TodayTasksCard dateISO={dateISO} />
        </Animated.View>
      </TabScreen>

      <PeriodCheckInModal
        visible={prediction.isOverdue && !overdueDismissed}
        onYes={handleLogPeriodToday}
        onNotYet={() => setOverdueDismissed(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, gap: 16 },
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: dash.inkSoft, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  emptyCta: {
    backgroundColor: dash.sage,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 6,
  },
  emptyCtaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dash.insight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dash.sageTint,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  coachCardPressed: { opacity: 0.75 },
  coachIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: dash.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachIconEmoji: { fontSize: 20 },
  coachTextWrap: { flex: 1 },
  coachTitle: { fontSize: 15, fontWeight: '800', color: dash.ink },
  coachSub: { fontSize: 12, color: dash.inkSoft, marginTop: 1 },
  coachChevron: { fontSize: 24, color: dash.sage, fontWeight: '300' },

  saleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2E2A26',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  saleEmoji: { fontSize: 24 },
  saleTitle: { fontSize: 14, fontWeight: '800', color: '#F6C6A8' },
  saleSub: { fontSize: 12, color: '#D8CFC5', marginTop: 1 },
});
