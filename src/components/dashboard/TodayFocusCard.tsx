import { StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { FocusTile } from '@/lib/intelligence/capacity';
import { Icon } from './Icon';

const TONE: Record<FocusTile['tone'], { bg: string; icon: string; iconBg: string }> = {
  green: { bg: '#EAF0E3', icon: dash.sage, iconBg: '#FFFFFF' },
  cream: { bg: '#F5EFE3', icon: '#B07A2E', iconBg: '#FFFFFF' },
  peach: { bg: '#F7E7DC', icon: dash.clay, iconBg: '#FFFFFF' },
};

interface Props {
  tiles: FocusTile[];
}

export function TodayFocusCard({ tiles }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today's Focus</Text>
      <View style={styles.row}>
        {tiles.map((t) => {
          const tone = TONE[t.tone];
          return (
            <View key={t.title} style={[styles.tile, { backgroundColor: tone.bg }]}>
              <View style={[styles.iconCircle, { backgroundColor: tone.iconBg }]}>
                <Icon name={t.icon} color={tone.icon} size={18} />
              </View>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={styles.tileSub}>{t.subtitle}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 22,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: dash.line,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  row: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 16, padding: 12, gap: 6 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { fontSize: 14, fontWeight: '700', color: dash.ink },
  tileSub: { fontSize: 11, lineHeight: 15, color: dash.inkSoft },
});
