import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'bell'
  | 'leaf'
  | 'calendar'
  | 'pill'
  | 'drop'
  | 'smile'
  | 'heart'
  | 'weight'
  | 'moon'
  | 'plus'
  | 'chevronRight'
  | 'chevronLeft'
  | 'bloom'
  | 'chat'
  | 'bolt'
  | 'pencil'
  | 'phone'
  | 'document'
  | 'lock'
  | 'grid'
  | 'clock'
  | 'briefcase'
  | 'star'
  | 'starFill'
  | 'check'
  | 'house'
  | 'barChart';

interface Props {
  name: IconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

/** Minimal, rounded line icons matching the reference dashboard. */
export function Icon({ name, color = '#2E2A26', size = 22, strokeWidth = 1.8 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'bell' && (
        <Path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6ZM10 20a2 2 0 0 0 4 0" {...p} />
      )}
      {name === 'leaf' && (
        <Path d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14-1.5 0-2-2-2-2ZM7 17c3-4 6-6 9-7" {...p} />
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3.5} y={5} width={17} height={15} rx={3} {...p} />
          <Path d="M3.5 9.5h17M8 3v4M16 3v4" {...p} />
        </>
      )}
      {name === 'pill' && (
        <>
          <Rect x={3.5} y={8.5} width={17} height={7} rx={3.5} transform="rotate(-45 12 12)" {...p} />
          <Path d="M9 9l6 6" {...p} />
        </>
      )}
      {name === 'drop' && (
        <Path d="M12 3.5c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0c0-3 2-5.5 5-9.5Z" {...p} />
      )}
      {name === 'smile' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M8.5 14a4 4 0 0 0 7 0" {...p} />
          <Circle cx={9} cy={10} r={0.6} fill={color} />
          <Circle cx={15} cy={10} r={0.6} fill={color} />
        </>
      )}
      {name === 'heart' && (
        <Path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.5 12 20 12 20Z" {...p} />
      )}
      {name === 'weight' && (
        <>
          <Path d="M5 8h14l1.5 11a1 1 0 0 1-1 1.2H4.5a1 1 0 0 1-1-1.2L5 8Z" {...p} />
          <Circle cx={12} cy={6.5} r={2} {...p} />
        </>
      )}
      {name === 'moon' && (
        <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" {...p} />
      )}
      {name === 'plus' && <Path d="M12 6v12M6 12h12" {...p} />}
      {name === 'chevronRight' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'chevronLeft' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'chat' && (
        <Path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" {...p} />
      )}
      {name === 'bolt' && <Path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...p} />}
      {name === 'pencil' && (
        <Path d="M4 20l1.2-4.2L16 5l3 3L8.2 18.8 4 20ZM14 7l3 3" {...p} />
      )}
      {name === 'phone' && (
        <Path d="M6 3l3 .8 1 4-2 1.6a12 12 0 0 0 5.6 5.6L15 14l4 1 .8 3a2 2 0 0 1-2 1.7A16 16 0 0 1 4.3 5 2 2 0 0 1 6 3Z" {...p} />
      )}
      {name === 'document' && (
        <Path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM14 3v4h4M9 12h6M9 16h5" {...p} />
      )}
      {name === 'lock' && (
        <>
          <Path d="M7 10V8a5 5 0 0 1 10 0v2" {...p} />
          <Rect x={5} y={10} width={14} height={10} rx={2.5} {...p} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={1.5} {...p} />
          <Rect x={13} y={4} width={7} height={7} rx={1.5} {...p} />
          <Rect x={4} y={13} width={7} height={7} rx={1.5} {...p} />
          <Rect x={13} y={13} width={7} height={7} rx={1.5} {...p} />
        </>
      )}
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7.5v5l3.2 2" {...p} />
        </>
      )}
      {name === 'briefcase' && (
        <>
          <Rect x={3} y={7.5} width={18} height={12.5} rx={2.5} {...p} />
          <Path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 13h18" {...p} />
        </>
      )}
      {name === 'star' && (
        <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" {...p} />
      )}
      {name === 'starFill' && (
        <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      )}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7" {...p} />}
      {name === 'house' && (
        <Path d="M4 11l8-7 8 7M6.5 9.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5" {...p} />
      )}
      {name === 'barChart' && (
        <Path d="M5 20V11M10 20V5M15 20V13M20 20V8" stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      )}
      {name === 'bloom' && (
        <>
          <Path d="M12 12c0-3-2-5-2-5s-2 2-2 5 2 4 2 4M12 12c0-3 2-5 2-5s2 2 2 5-2 4-2 4" {...p} />
          <Path d="M12 12c-2-1-4-1-4-1s1 2 3 2.5M12 12c2-1 4-1 4-1s-1 2-3 2.5" {...p} />
          <Path d="M12 16v3" {...p} />
        </>
      )}
    </Svg>
  );
}
