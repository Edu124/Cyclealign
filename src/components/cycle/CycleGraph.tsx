import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { phaseColors, palette, spacing } from '@/theme';
import { PhaseInfo, PhaseKey } from '@/types/models';

interface Props {
  phases: PhaseInfo[];
  cycleLength: number;
  dayOfCycle: number;
  ovulationDay: number;
}

/**
 * Graph-style cycle visualisation: phase-coloured bands across the days of the
 * cycle, a smooth energy curve rising to ovulation, and a "today" marker — a
 * more informative, less clinical alternative to a plain progress ring.
 */
export function CycleGraph({ phases, cycleLength, dayOfCycle, ovulationDay }: Props) {
  const [width, setWidth] = useState(320);
  const height = 196;
  const padX = 14;
  const topPad = 16;
  const axisY = height - 34; // baseline for the curve / bands bottom

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - width) > 1) setWidth(w);
  };

  const innerW = width - padX * 2;
  const xFor = (day: number) =>
    padX + (innerW * (day - 1)) / Math.max(1, cycleLength - 1);

  // Energy curve sampled per day: low during menses, peak at ovulation, taper.
  const periodEnd = phases.find((p) => p.key === 'menstrual')!.range[1];
  const key = [
    { d: 1, e: 0.18 },
    { d: periodEnd, e: 0.24 },
    { d: ovulationDay, e: 0.96 },
    { d: cycleLength, e: 0.32 },
  ];
  const energy = (day: number) => {
    for (let i = 1; i < key.length; i++) {
      if (day <= key[i].d) {
        const a = key[i - 1];
        const b = key[i];
        const t = (day - a.d) / Math.max(1, b.d - a.d);
        return a.e + (b.e - a.e) * t;
      }
    }
    return key[key.length - 1].e;
  };
  const yFor = (e: number) => topPad + (axisY - topPad) * (1 - e);

  let curve = '';
  for (let d = 1; d <= cycleLength; d++) {
    curve += `${d === 1 ? 'M' : 'L'} ${xFor(d).toFixed(1)} ${yFor(energy(d)).toFixed(1)} `;
  }
  const area = `${curve} L ${xFor(cycleLength).toFixed(1)} ${axisY} L ${xFor(1).toFixed(1)} ${axisY} Z`;

  const todayX = xFor(dayOfCycle);
  const todayY = yFor(energy(dayOfCycle));

  return (
    <View onLayout={onLayout} style={styles.wrap}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.roseDeep} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={palette.roseDeep} stopOpacity={0.02} />
          </SvgLinearGradient>
          <SvgLinearGradient id="curveLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={palette.lavenderDeep} />
            <Stop offset="50%" stopColor={palette.roseDeep} />
            <Stop offset="100%" stopColor={palette.tealDeep} />
          </SvgLinearGradient>
        </Defs>

        {/* Phase bands */}
        {phases.map((p) => {
          const x0 = xFor(p.range[0]);
          const x1 = xFor(Math.min(p.range[1] + 1, cycleLength));
          return (
            <Rect
              key={p.key}
              x={x0}
              y={topPad}
              width={Math.max(0, x1 - x0)}
              height={axisY - topPad}
              fill={phaseColors[p.key as PhaseKey].base}
              opacity={0.16}
              rx={6}
            />
          );
        })}

        {/* Energy area + curve */}
        <Path d={area} fill="url(#curveFill)" />
        <Path d={curve} stroke="url(#curveLine)" strokeWidth={3} fill="none" strokeLinecap="round" />

        {/* Today marker */}
        <Line x1={todayX} y1={topPad} x2={todayX} y2={axisY} stroke={palette.ink} strokeWidth={1.5} strokeDasharray="3 4" opacity={0.4} />
        <Circle cx={todayX} cy={todayY} r={7} fill={palette.white} stroke={palette.roseDeep} strokeWidth={3} />

        {/* Day axis labels */}
        {[1, periodEnd, ovulationDay, cycleLength].map((d, i) => (
          <SvgText
            key={`${d}-${i}`}
            x={xFor(d)}
            y={height - 14}
            fontSize={11}
            fill={palette.muted}
            textAnchor="middle"
          >
            {d}
          </SvgText>
        ))}
      </Svg>

      {/* Phase legend */}
      <View style={styles.legend}>
        {phases.map((p) => (
          <View key={p.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: phaseColors[p.key as PhaseKey].base }]} />
            <Text style={styles.legendText}>{p.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12, color: palette.inkSoft, fontWeight: '600' },
});
