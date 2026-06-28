import Svg, { Rect } from 'react-native-svg';
import { Capacity } from '@/lib/intelligence/capacity';

interface Props {
  level: Capacity;
  color: string;
  size?: number;
}

/** Vertical battery whose fill reflects today's energy/capacity. */
export function BatteryIcon({ level, color, size = 48 }: Props) {
  const w = size * 0.62;
  const h = size;
  const sw = 2.4;
  const bodyY = h * 0.12;
  const bodyH = h * 0.88 - sw;
  const innerPad = 5;
  const fillFrac = level === 'HIGH' ? 0.85 : level === 'MEDIUM' ? 0.5 : 0.22;
  const maxFillH = bodyH - innerPad * 2;
  const fillH = maxFillH * fillFrac;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* terminal */}
      <Rect x={w / 2 - w * 0.16} y={0} width={w * 0.32} height={h * 0.08} rx={2} fill={color} />
      {/* body */}
      <Rect
        x={sw / 2}
        y={bodyY}
        width={w - sw}
        height={bodyH}
        rx={size * 0.16}
        stroke={color}
        strokeWidth={sw}
        fill="none"
      />
      {/* fill (anchored to bottom) */}
      <Rect
        x={sw / 2 + innerPad}
        y={bodyY + bodyH - innerPad - fillH}
        width={w - sw - innerPad * 2}
        height={fillH}
        rx={size * 0.08}
        fill={color}
      />
    </Svg>
  );
}
