import { StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { Icon, IconName } from './Icon';

export interface QuickStat {
  icon: IconName;
  tint: string;
  iconColor: string;
  title: string;
  primary?: string;
  accent?: string;
  accentColor?: string;
  progress?: number; // 0..1
  dots?: { filled: number; total: number; color: string };
}

export function QuickStatCard(stat: QuickStat) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: stat.tint }]}>
        <Icon name={stat.icon} color={stat.iconColor} size={20} />
      </View>
      <Text style={styles.title}>{stat.title}</Text>

      {stat.primary && <Text style={styles.primary}>{stat.primary}</Text>}
      {stat.accent && (
        <Text style={[styles.accent, { color: stat.accentColor ?? dash.sage }]}>
          {stat.accent}
        </Text>
      )}

      {stat.progress != null && (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.round(stat.progress * 100)}%`, backgroundColor: stat.iconColor },
            ]}
          />
        </View>
      )}

      {stat.dots && (
        <View style={styles.dotsRow}>
          {Array.from({ length: stat.dots.total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < stat.dots!.filled ? stat.dots!.color : `${stat.dots!.color}33`,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: dash.line,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: '700', color: dash.ink },
  primary: { fontSize: 13, color: dash.inkSoft },
  accent: { fontSize: 14, fontWeight: '600' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: dash.line,
    marginTop: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  dotsRow: { flexDirection: 'row', gap: 5, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
