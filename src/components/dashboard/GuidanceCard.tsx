import { StyleSheet, Text, View } from 'react-native';
import { dash, palette } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Guidance } from '@/lib/intelligence/capacity';

interface Props {
  guidance: Guidance;
}

interface RowProps {
  label: string;
  value: string;
  color: string;
  glyph: string;
}

function Row({ label, value, color, glyph }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.glyphWrap, { backgroundColor: `${color}1F` }]}>
        <Text style={[styles.glyph, { color }]}>{glyph}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

/** Component C — Today's Guidance (3 lines). */
export function GuidanceCard({ guidance }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today's Guidance</Text>
      <Row label="Best for" value={guidance.bestFor} color={dash.sage} glyph="✓" />
      <Row label="Use energy wisely" value={guidance.useWisely} color={palette.warning} glyph="!" />
      <Row label="Defer if possible" value={guidance.defer} color={dash.clay} glyph="⟳" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 22,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: dash.line,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyphWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 15, fontWeight: '800' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 12, color: dash.muted, fontWeight: '700' },
  rowValue: { fontSize: 15, color: dash.ink, marginTop: 1 },
});
