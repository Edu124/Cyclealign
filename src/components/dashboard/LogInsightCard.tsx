import { StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import type { LogInsight } from '@/lib/intelligence/logInsights';

interface Props {
  insight: LogInsight;
}

/** "Align noticed" — surfaces a logged-energy pattern that differs from the
 *  textbook phase expectation. Only rendered when analyzeLogs finds one. */
export function LogInsightCard({ insight }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>💡</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Align noticed</Text>
        <Text style={styles.body}>{insight.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: dash.insight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: dash.sageTint,
    padding: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: dash.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 17 },
  textWrap: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: '800', color: dash.sageDeep, letterSpacing: 0.3 },
  body: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },
});
