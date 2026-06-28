import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  name: 'home' | 'insights' | 'calendar' | 'community' | 'profile' | 'ai';
  color: string;
  size?: number;
}

/** Minimal line icons for the tab bar (no icon-font dependency). */
export function TabBarIcon({ name, color, size = 24 }: Props) {
  const sw = 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'home' && (
        <Path
          d="M4 11l8-7 8 7M6.5 9.5V19a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9.5"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === 'insights' && (
        <Path
          d="M5 20V11M10 20V5M15 20V13M20 20V8"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
      {name === 'calendar' && (
        <>
          <Path
            d="M5 5.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"
            stroke={color}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
      {name === 'community' && (
        <>
          <Circle cx={9} cy={9} r={4} stroke={color} strokeWidth={sw} />
          <Circle cx={15} cy={9} r={4} stroke={color} strokeWidth={sw} />
          <Path
            d="M3 20c0-3 2.7-5 6-5M12 15c3.3 0 6 2 6 5"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <Path
            d="M9 15c1.5-.3 3-.3 4.5 0"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'ai' && (
        <>
          {/* Sparkle / AI icon — 4-pointed star with a small circle */}
          <Path
            d="M12 3 L13.2 8.8 L19 10 L13.2 11.2 L12 17 L10.8 11.2 L5 10 L10.8 8.8 Z"
            stroke={color}
            strokeWidth={sw}
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={19} cy={5} r={1.5} fill={color} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={sw} />
          <Path
            d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
