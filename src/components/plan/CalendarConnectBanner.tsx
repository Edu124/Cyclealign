import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dash } from '@/theme';

interface Props {
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function CalendarConnectBanner({ connected, onConnect, onDisconnect }: Props) {
  if (connected) {
    return (
      <View style={styles.connectedRow}>
        <View style={styles.dot} />
        <Text style={styles.connectedText}>Calendar connected</Text>
        <TouchableOpacity onPress={onDisconnect} hitSlop={8}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <View style={styles.bannerLeft}>
        <Text style={styles.bannerEmoji}>📅</Text>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>Connect your calendar</Text>
          <Text style={styles.bannerSub}>Get phase scores on your scheduled events</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.connectBtn} onPress={onConnect} activeOpacity={0.85}>
        <Text style={styles.connectBtnText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dash.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dash.line,
    padding: 14,
    gap: 12,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  bannerEmoji: { fontSize: 24 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: dash.ink },
  bannerTextCol: { flex: 1 },
  bannerSub: { fontSize: 12, color: dash.muted, marginTop: 2 },
  connectBtn: {
    backgroundColor: dash.sage,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#56723F' },
  connectedText: { flex: 1, fontSize: 13, fontWeight: '600', color: dash.inkSoft },
  disconnectText: { fontSize: 12, color: dash.muted },
});
