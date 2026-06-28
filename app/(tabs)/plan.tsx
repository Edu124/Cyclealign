import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/ui';
import { MonthOutlook } from '@/components/plan/MonthOutlook';
import { RecommendedWindows } from '@/components/plan/RecommendedWindows';
import { PhaseTasksModal } from '@/components/plan/PhaseTasksModal';
import { CalendarConnectBanner } from '@/components/plan/CalendarConnectBanner';
import { DayEventsModal } from '@/components/plan/DayEventsModal';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useCalendar } from '@/lib/stores/useCalendar';
import { monthPlan } from '@/lib/intelligence/schedule';
import type { RecommendedWindow } from '@/lib/intelligence/schedule';
import { palette } from '@/theme';

export default function Plan() {
  const profile    = useAppStore((s) => s.profile);
  const prediction = usePrediction();
  const { connected, events, connect, disconnect, eventsForDate } = useCalendar();

  const [selectedWindow, setSelectedWindow] = useState<RecommendedWindow | null>(null);
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);

  if (!profile || !prediction) {
    return (
      <Screen contentStyle={styles.empty}>
        <Text style={styles.emptyText}>Set up your cycle to plan your month.</Text>
      </Screen>
    );
  }

  const { recommendedWindows } = monthPlan(prediction);

  function handleDayPress(dateISO: string) {
    if (!connected) return;
    setSelectedDate(dateISO);
  }

  return (
    <>
      <Screen>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>Your plan</Text>
          <Text style={styles.subtitle}>
            Schedule your work with your hormones, not against them.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <CalendarConnectBanner
            connected={connected}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <RecommendedWindows
            windows={recommendedWindows}
            onSelectWindow={setSelectedWindow}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <MonthOutlook
            prediction={prediction}
            events={connected ? events : []}
            onDayPress={handleDayPress}
          />
        </Animated.View>
      </Screen>

      <PhaseTasksModal
        window={selectedWindow}
        role={profile.role}
        onClose={() => setSelectedWindow(null)}
      />

      <DayEventsModal
        dateISO={selectedDate}
        events={selectedDate ? eventsForDate(selectedDate) : []}
        prediction={prediction}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: palette.inkSoft, fontSize: 16, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 15, color: palette.inkSoft, marginTop: 4 },
});
