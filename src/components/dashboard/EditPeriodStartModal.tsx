import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Stepper } from '@/components/ui';
import { getPhases, phaseForDay } from '@/lib/prediction/phases';
import { addDaysISO, todayISO } from '@/lib/dates';
import { palette, phaseColors, radius, shadow, spacing } from '@/theme';
import type { PhaseKey } from '@/types/models';

const PHASE_TITLE: Record<PhaseKey, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulatory',
  luteal: 'Luteal',
};

interface Props {
  visible: boolean;
  cycleLength: number;
  avgPeriodLength: number;
  /** Her actual current day-of-cycle, from the live prediction. */
  currentDayOfCycle: number;
  onClose: () => void;
  /** Called with the equivalent period-start ISO date once she saves. */
  onSave: (iso: string) => void;
}

/** Lets her correct which stage of her cycle she's actually in today. */
export function EditPeriodStartModal({
  visible,
  cycleLength,
  avgPeriodLength,
  currentDayOfCycle,
  onClose,
  onSave,
}: Props) {
  const phases = useMemo(() => getPhases(cycleLength, avgPeriodLength), [cycleLength, avgPeriodLength]);
  const [phase, setPhase] = useState<PhaseKey>('menstrual');
  const [day, setDay] = useState(1);

  // Re-seed the draft from the live value each time the modal opens.
  useEffect(() => {
    if (!visible) return;
    setPhase(phaseForDay(currentDayOfCycle, cycleLength, avgPeriodLength));
    setDay(currentDayOfCycle);
  }, [visible, currentDayOfCycle, cycleLength, avgPeriodLength]);

  const activeRange = phases.find((p) => p.key === phase)?.range ?? [1, cycleLength];
  const [rangeMin, rangeMax] = activeRange;

  function handlePhasePress(next: PhaseKey) {
    setPhase(next);
    const [from, to] = phases.find((p) => p.key === next)!.range;
    setDay((d) => Math.min(Math.max(d, from), to));
  }

  function handleSave() {
    const newStartDate = addDaysISO(todayISO(), -(day - 1));
    onSave(newStartDate);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Edit your cycle stage</Text>
          <Text style={styles.subtitle}>
            Tell us which phase and day you're actually on — your predictions update right away.
          </Text>

          <View style={styles.phaseRow}>
            {(Object.keys(PHASE_TITLE) as PhaseKey[]).map((key) => {
              const selected = key === phase;
              const accent = phaseColors[key].deep;
              return (
                <Pressable
                  key={key}
                  onPress={() => handlePhasePress(key)}
                  style={[
                    styles.phaseChip,
                    { borderColor: accent },
                    selected && { backgroundColor: accent },
                  ]}
                >
                  <Text style={[styles.phaseChipText, { color: selected ? '#fff' : accent }]}>
                    {PHASE_TITLE[key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Stepper
            label={`Day of your cycle (${rangeMin}–${rangeMax} for ${PHASE_TITLE[phase]})`}
            value={day}
            min={rangeMin}
            max={rangeMax}
            onChange={setDay}
          />

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Button label="Save" onPress={handleSave} style={styles.saveBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47,42,37,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.soft,
  },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },
  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  phaseChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  phaseChipText: { fontSize: 13, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  cancelText: { fontSize: 14, fontWeight: '700', color: palette.muted },
  saveBtn: { minWidth: 110 },
});
