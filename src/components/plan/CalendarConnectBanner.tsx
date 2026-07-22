import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dash } from '@/theme';

const ALL_PROVIDERS = [
  { id: 'google',  label: 'Google Calendar',         icon: '📅', desc: 'Sync real events from your Google account' },
  { id: 'apple',   label: 'Apple Calendar',           icon: '🍎', desc: 'Real events from your iPhone’s Calendar app' },
  { id: 'outlook', label: 'Outlook / Microsoft 365',  icon: '📧', desc: 'Work or personal Microsoft account (sample data in preview)' },
  { id: 'demo',    label: 'Try with sample events',   icon: '✨', desc: 'Preview how cycle scoring looks — no sign-in needed' },
];

// iPhones get exactly one, native option — Apple Calendar. Everything the
// other rows offered on iOS was either a browser detour or sample data.
const CALENDAR_PROVIDERS =
  Platform.OS === 'ios'
    ? ALL_PROVIDERS.filter((p) => p.id === 'apple')
    : ALL_PROVIDERS.filter((p) => p.id !== 'apple');

interface Props {
  connected: boolean;
  providerLabel?: string | null;
  loading?: boolean;
  onConnect: (providerId: string) => void | Promise<void>;
  onDisconnect: () => void;
}

export function CalendarConnectBanner({ connected, providerLabel, loading, onConnect, onDisconnect }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function handleSelectProvider(id: string) {
    setShowPicker(false);
    setConnecting(true);
    try {
      await onConnect(id);
    } finally {
      setConnecting(false);
    }
  }

  const isLoading = loading || connecting;

  if (connected) {
    return (
      <View style={styles.connectedRow}>
        <View style={styles.dot} />
        <Text style={styles.connectedText}>{providerLabel ?? 'Calendar'} connected</Text>
        <TouchableOpacity onPress={onDisconnect} hitSlop={8}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerEmoji}>📅</Text>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Connect your calendar</Text>
            <Text style={styles.bannerSub}>Get cycle-phase scores on your events</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.connectBtn, isLoading && styles.connectBtnDisabled]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.connectBtnText}>Connect</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Calendar provider bottom sheet */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Choose your calendar</Text>
            <Text style={styles.sheetSub}>
              CycleAlign reads event titles to score phase alignment — it never writes or shares your data.
            </Text>
            {CALENDAR_PROVIDERS.map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.providerRow, i < CALENDAR_PROVIDERS.length - 1 && styles.providerDivider]}
                onPress={() => handleSelectProvider(p.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.providerIcon}>{p.icon}</Text>
                <View style={styles.providerText}>
                  <Text style={styles.providerLabel}>{p.label}</Text>
                  <Text style={styles.providerDesc}>{p.desc}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    minWidth: 80,
    alignItems: 'center',
  },
  connectBtnDisabled: { opacity: 0.6 },
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

  // Bottom sheet modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: dash.ink, marginBottom: 4 },
  sheetSub: { fontSize: 13, color: dash.muted, lineHeight: 18, marginBottom: 12 },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  providerDivider: { borderBottomWidth: 1, borderBottomColor: '#F0ECE8' },
  providerIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  providerText: { flex: 1 },
  providerLabel: { fontSize: 15, fontWeight: '700', color: dash.ink },
  providerDesc: { fontSize: 13, color: dash.muted, marginTop: 2 },
  chevron: { fontSize: 22, color: dash.muted },
});
