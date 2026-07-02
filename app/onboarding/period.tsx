import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { DateField } from '@/components/ui';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { predict } from '@/lib/prediction/engine';
import { getPhases } from '@/lib/prediction/phases';
import { addDaysISO, daysBetween, fromISODate, todayISO } from '@/lib/dates';
import { phaseBanner, phaseColors, palette } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { PhaseKey } from '@/types/models';

// ── Phase metadata ────────────────────────────────────────────────────────────

const PHASE_META: Record<PhaseKey, { emoji: string; body: string }> = {
  menstrual: {
    emoji: '🌙',
    body: 'Your body is renewing. Rest is productive right now — honour the need for stillness and gentle movement.',
  },
  follicular: {
    emoji: '🌿',
    body: 'Oestrogen is rising and your mind is sharpest. The best time for bold ideas, new projects, and fresh starts.',
  },
  ovulation: {
    emoji: '☀️',
    body: "You're at peak energy and magnetism. High-stakes conversations, leadership, and collaboration come naturally.",
  },
  luteal: {
    emoji: '🍂',
    body: 'Progesterone is rising and intuition is strong. Ideal for deep work, finishing projects, and honest reflection.',
  },
};

// ── Segmented cycle bar ───────────────────────────────────────────────────────

function CycleBar({
  phases,
  cycleLength,
  dayOfCycle,
}: {
  phases: ReturnType<typeof getPhases>;
  cycleLength: number;
  dayOfCycle: number;
}) {
  const dotPct = ((dayOfCycle - 1) / Math.max(cycleLength - 1, 1)) * 100;

  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.track}>
        {phases.map((p, i) => {
          const [from, to] = p.range;
          const width = `${((to - from + 1) / cycleLength) * 100}%` as `${number}%`;
          const isFirst = i === 0;
          const isLast = i === phases.length - 1;
          return (
            <View
              key={p.key}
              style={[
                barStyles.segment,
                { width, backgroundColor: phaseColors[p.key].base },
                isFirst  && barStyles.segmentFirst,
                isLast   && barStyles.segmentLast,
              ]}
            />
          );
        })}
        {/* current day dot */}
        <View style={[barStyles.dot, { left: `${dotPct}%` as `${number}%` }]} />
      </View>

      {/* phase labels */}
      <View style={barStyles.labels}>
        {phases.map((p) => (
          <Text
            key={p.key}
            style={[barStyles.label, { color: phaseColors[p.key].deep }]}
          >
            {p.title}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Phase reveal card ─────────────────────────────────────────────────────────

function PhaseCard({
  phase,
  dayOfCycle,
  cycleLength,
  avgPeriodLength,
}: {
  phase: PhaseKey;
  dayOfCycle: number;
  cycleLength: number;
  avgPeriodLength: number;
}) {
  const banner = phaseBanner[phase];
  const meta   = PHASE_META[phase];
  const phases = getPhases(cycleLength, avgPeriodLength);
  const current = phases.find((p) => p.key === phase);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[card.wrap, { backgroundColor: banner.bg }]}>
      {/* anchor: this card describes TODAY, not the picked date */}
      <Text style={[card.todayEyebrow, { color: banner.accent }]}>
        WHERE YOU ARE TODAY · {todayLabel.toUpperCase()}
      </Text>

      {/* top row: emoji + phase name */}
      <View style={card.topRow}>
        <View style={[card.emojiCircle, { backgroundColor: banner.accent + '22' }]}>
          <Text style={card.emoji}>{meta.emoji}</Text>
        </View>
        <View style={card.nameCol}>
          <Text style={[card.phaseName, { color: banner.accent }]}>
            {current?.title.toUpperCase() ?? phase.toUpperCase()} PHASE
          </Text>
          <Text style={card.phaseSubtitle}>{current?.subtitle}</Text>
        </View>
      </View>

      {/* day badge */}
      <View style={card.dayRow}>
        <View style={[card.dayBadge, { backgroundColor: banner.accent }]}>
          <Text style={card.dayNum}>{dayOfCycle}</Text>
          <Text style={card.dayLabel}>of {cycleLength}</Text>
        </View>
        <Text style={card.dayCaption}>day of your cycle — today</Text>
      </View>

      {/* body copy */}
      <Text style={card.body}>{meta.body}</Text>

      {/* cycle bar */}
      <CycleBar phases={phases} cycleLength={cycleLength} dayOfCycle={dayOfCycle} />
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PeriodStep() {
  const { lastPeriodStart, avgCycleLength, avgPeriodLength, set } = useOnboarding();

  const prediction = lastPeriodStart
    ? predict({
        lastPeriodStart,
        avgCycleLength,
        avgPeriodLength,
      })
    : null;

  // True when the entered date is older than one cycle — the engine rolled forward.
  const wasRolledForward = lastPeriodStart && prediction
    ? daysBetween(fromISODate(lastPeriodStart), fromISODate(todayISO())) > prediction.cycleLength
    : false;

  // Derive the estimated current cycle start from the prediction.
  const estimatedCycleStart = prediction
    ? addDaysISO(prediction.nextPeriodStart, -prediction.cycleLength)
    : null;

  return (
    <StepScaffold
      step={3}
      total={4}
      title="When did your last period start?"
      subtitle="We'll use this to pinpoint exactly where you are in your cycle right now."
      nextDisabled={!lastPeriodStart}
      onNext={() => router.push('/onboarding/notifications')}
    >
      <DateField
        label="First day of your last period"
        placeholder="Tap to choose the date"
        value={lastPeriodStart}
        onChange={(iso) => set({ lastPeriodStart: iso })}
        disableFuture
        minYear={new Date().getFullYear() - 2}
      />

      {prediction && (
        <Animated.View entering={FadeInDown.duration(450)}>
          <PhaseCard
            phase={prediction.currentPhase}
            dayOfCycle={prediction.dayOfCycle}
            cycleLength={prediction.cycleLength}
            avgPeriodLength={avgPeriodLength}
          />
        </Animated.View>
      )}

      {wasRolledForward && estimatedCycleStart && (
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={card.rollNote}>
          <Text style={card.rollNoteText}>
            📅 How we worked this out: the date you picked is more than one cycle ago, so we
            counted forward in {prediction!.cycleLength}-day cycles. Your current cycle likely
            began{' '}
            <Text style={card.rollNoteBold}>
              {fromISODate(estimatedCycleStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            {' '}— logging your next period will fine-tune this.
          </Text>
        </Animated.View>
      )}
    </StepScaffold>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  wrap: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#00000010',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28 },
  nameCol: { flex: 1, gap: 2 },
  phaseName: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  phaseSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
    lineHeight: 20,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  dayNum: {
    fontFamily: fonts.headingBold,
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffffCC',
  },
  dayCaption: {
    fontSize: 14,
    color: palette.inkSoft,
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.inkSoft,
  },
  rollNote: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  rollNoteText: {
    fontSize: 13,
    color: palette.inkSoft,
    lineHeight: 19,
  },
  rollNoteBold: {
    fontWeight: '700',
    color: palette.ink,
  },
  todayEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});

const barStyles = StyleSheet.create({
  wrap: { gap: 6 },
  track: {
    height: 10,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'visible',
    position: 'relative',
  },
  segment: { height: '100%' },
  segmentFirst: { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
  segmentLast:  { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
  dot: {
    position: 'absolute',
    top: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: palette.ink,
    marginLeft: -8,
    zIndex: 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
