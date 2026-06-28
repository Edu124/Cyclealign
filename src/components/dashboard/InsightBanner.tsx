import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Icon } from './Icon';

interface Props {
  title?: string;
  headline: string;
  body: string;
  onPress?: () => void;
}

/** Sage insight banner with a little decorative sun + plant on the right. */
export function InsightBanner({ title = 'Your Insight', headline, body, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Icon name="leaf" color={dash.sage} size={24} />
      </View>

      <View style={styles.text}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.art} pointerEvents="none">
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle cx={46} cy={20} r={10} fill={dash.clay} opacity={0.5} />
          <Path d="M10 60 Q26 30 64 38 L64 64 Z" fill={dash.sage} opacity={0.35} />
          <Path
            d="M30 60c0-10 6-16 6-16M36 50c0-5 5-8 5-8M36 52c-5-2-9-1-9-1"
            stroke={dash.sage}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      <Icon name="chevronRight" color={dash.inkSoft} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: dash.insight,
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 1 },
  label: { fontSize: 12, color: dash.sageDeep, fontWeight: '700' },
  headline: { fontFamily: fonts.heading, fontSize: 19, color: dash.ink },
  body: { fontSize: 13, lineHeight: 18, color: dash.inkSoft },
  art: { position: 'absolute', right: 28, bottom: 0, opacity: 0.9 },
});
