import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { phaseBanner, dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { PhaseKey } from '@/types/models';
import { Capacity, HeroGuidance, ENERGY_NOTE } from '@/lib/intelligence/capacity';
import { Icon } from './Icon';
import { BatteryIcon } from './BatteryIcon';

const PHASE_TITLE: Record<PhaseKey, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulation: 'Ovulatory',
  luteal: 'Luteal',
};

interface Props {
  phase: PhaseKey;
  dayOfCycle: number;
  capacity: Capacity;
  hero: HeroGuidance;
}

export function EnergyHeroCard({ phase, dayOfCycle, capacity, hero }: Props) {
  const accent = phaseBanner[phase].accent;
  const bg = phaseBanner[phase].bg;

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      {/* decorative leaf branch */}
      <View style={styles.leaf} pointerEvents="none">
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Path
            d="M100 10C70 20 50 45 40 80M70 25c8 2 14 0 18-6M62 42c9 3 16 1 21-5M54 60c9 3 16 1 21-5M47 78c8 3 15 1 20-4"
            stroke={accent}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.18}
          />
        </Svg>
      </View>

      <View style={styles.top}>
        <View style={styles.dayRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.dayText, { color: accent }]}>Day {dayOfCycle}</Text>
        </View>
        <Text style={[styles.phase, { color: accent }]}>{PHASE_TITLE[phase]} Phase</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.energyRow}>
        <View style={styles.energyText}>
          <Text style={styles.energyLabel}>Today's Energy</Text>
          <Text style={[styles.energyValue, { color: accent }]} numberOfLines={1}>
            {capacity}
          </Text>
          <Text style={styles.energyNote}>{ENERGY_NOTE[capacity]}</Text>
        </View>
        <View style={[styles.ring, { borderColor: `${accent}33` }]}>
          <BatteryIcon level={capacity} color={accent} size={58} />
        </View>
      </View>

      <View style={[styles.guideRow, { borderColor: `${accent}22` }]}>
        <GuideItem icon="moon" label="Focus on" value={hero.focus} accent={accent} />
        <View style={styles.guideDivider} />
        <GuideItem icon="document" label="Good for" value={hero.goodFor} accent={accent} />
        <View style={styles.guideDivider} />
        <GuideItem icon="clock" label="Save for later" value={hero.avoid} accent={accent} />
      </View>
    </View>
  );
}

function GuideItem({
  icon,
  label,
  value,
  accent,
}: {
  icon: 'moon' | 'document' | 'clock';
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.guideItem}>
      <View style={[styles.guideIcon, { backgroundColor: `${accent}1A` }]}>
        <Icon name={icon} color={accent} size={16} />
      </View>
      <Text style={styles.guideLabel}>{label}</Text>
      <Text style={styles.guideValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 26, padding: 22, overflow: 'hidden' },
  leaf: { position: 'absolute', top: -6, right: -6 },
  top: { gap: 6 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dayText: { fontSize: 14, fontWeight: '600' },
  phase: { fontFamily: fonts.headingBold, fontSize: 26 },
  divider: { height: 1, backgroundColor: 'rgba(46,42,37,0.08)', marginVertical: 16 },
  energyRow: { flexDirection: 'row', alignItems: 'center' },
  energyText: { flex: 1 },
  energyLabel: { fontSize: 15, color: dash.inkSoft },
  energyValue: { fontFamily: fonts.headingBold, fontSize: 46, lineHeight: 54 },
  energyNote: { fontSize: 15, color: dash.ink },
  ring: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  guideItem: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  guideIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  guideLabel: { fontSize: 11, color: dash.muted, fontWeight: '600' },
  guideValue: { fontSize: 13, color: dash.ink, fontWeight: '600', textAlign: 'center' },
  guideDivider: { width: 1, backgroundColor: 'rgba(46,42,37,0.08)', marginVertical: 2 },
});
