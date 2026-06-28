import Svg, { Rect } from 'react-native-svg';

interface Props {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

/** Tiny vertical bar chart (e.g. the sleep card). */
export function MiniBars({ data, color, width = 100, height = 40 }: Props) {
  const max = Math.max(...data, 1);
  const gap = 4;
  const barW = (width - gap * (data.length - 1)) / data.length;
  return (
    <Svg width={width} height={height}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        return (
          <Rect
            key={i}
            x={i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h}
            rx={barW / 2}
            fill={color}
            opacity={0.35 + 0.55 * (v / max)}
          />
        );
      })}
    </Svg>
  );
}
