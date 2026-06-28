import Svg, { Path } from 'react-native-svg';

interface Props {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

/** Tiny smooth area sparkline for the metric cards. */
export function Sparkline({ data, color, width = 90, height = 34 }: Props) {
  if (data.length < 2) return <Svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const stepX = (width - pad * 2) / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });

  const line = pts
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`)
    .join(' ');
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${height} L ${pts[0][0].toFixed(1)} ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Path d={area} fill={color} fillOpacity={0.12} />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
