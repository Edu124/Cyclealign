import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  acceptInvite,
  fetchUnseenPings,
  getMyPartnerConnection,
  getOrCreateMyInvite,
  markPingsSeen,
  PHASE_LABEL,
  revokeLink,
  sendSupportPing,
  updateSharingSettings,
  type PartnerLink,
} from '@/lib/partnerSync';
import { dash, phaseBanner } from '@/theme';
import type { PhaseKey } from '@/types/models';

const SUGGESTED_MESSAGES = [
  "Thinking of you today 💛",
  "No need to explain anything — I've got you.",
  "Take it easy today, I'll handle dinner.",
  "Sending you a hug from here 🤍",
];

const QUICK_REACTIONS: { emoji: string; message: string }[] = [
  { emoji: '💛', message: "Thinking of you 💛" },
  { emoji: '🤗', message: "Sending a hug 🤗" },
  { emoji: '🌸', message: "Take it easy today 🌸" },
  { emoji: '✨', message: "You've got this ✨" },
];

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export function PartnerSyncCard() {
  const [myInvite, setMyInvite] = useState<PartnerLink | null | undefined>(undefined);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [partnerLink, setPartnerLink] = useState<PartnerLink | null | undefined>(undefined);
  const [pings, setPings] = useState<{ id: string; message: string }[]>([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);
  const [justSent, setJustSent] = useState(false);

  async function refresh() {
    const [inviteResult, partner, unseen] = await Promise.all([
      getOrCreateMyInvite(),
      getMyPartnerConnection(),
      fetchUnseenPings(),
    ]);
    setMyInvite(inviteResult.link);
    setInviteError(inviteResult.link ? null : inviteResult.error ?? 'Could not load your invite.');
    setPartnerLink(partner);
    setPings(unseen);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleShareCode() {
    if (!myInvite) return;
    haptic();
    try {
      await Share.share({
        message: `Join me on CycleAlign so I can share how I'm doing and you can support me on tougher days. Use invite code: ${myInvite.inviteCode}`,
      });
    } catch {}
  }

  async function handleToggle(field: 'sharePhase' | 'shareToughDay' | 'shareEnergyMood', value: boolean) {
    if (!myInvite) return;
    haptic();
    setMyInvite({ ...myInvite, [field]: value });
    await updateSharingSettings(myInvite.id, { [field]: value });
  }

  async function handleRevoke() {
    if (!myInvite) return;
    haptic();
    setInviteBusy(true);
    await revokeLink(myInvite.id);
    setInviteBusy(false);
    refresh();
  }

  async function handleAcceptInvite() {
    if (!codeInput.trim()) return;
    haptic();
    setConnectBusy(true);
    setConnectError(null);
    const res = await acceptInvite(codeInput.trim());
    setConnectBusy(false);
    if (!res.ok) {
      setConnectError(res.error ?? 'Something went wrong.');
      return;
    }
    setCodeInput('');
    refresh();
  }

  async function handleSendSupport(message: string) {
    if (!partnerLink) return;
    setSupportBusy(true);
    await sendSupportPing(partnerLink.id, partnerLink.userId, message);
    setSupportBusy(false);
    setSupportOpen(false);
    setSupportMessage('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2200);
  }

  async function dismissPings() {
    haptic();
    if (pings.length === 0) return;
    await markPingsSeen(pings.map((p) => p.id));
    setPings([]);
  }

  if (myInvite === undefined) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={dash.sage} />
      </View>
    );
  }

  const phaseKey = partnerLink?.sharedPhase as PhaseKey | null | undefined;
  const banner = phaseKey && phaseBanner[phaseKey] ? phaseBanner[phaseKey] : null;

  return (
    <View style={{ gap: 16 }}>
      {pings.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350)} style={styles.pingBanner}>
          <Text style={styles.pingEmoji}>💌</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pingTitle}>Support from your partner</Text>
            {pings.map((p) => (
              <Text key={p.id} style={styles.pingMessage}>"{p.message}"</Text>
            ))}
          </View>
          <TouchableOpacity onPress={dismissPings}>
            <Text style={styles.pingDismiss}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Invite your partner (you are the sharer) ── */}
      <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.card}>
        <Text style={styles.cardTitle}>Invite your partner</Text>
        <Text style={styles.cardSub}>
          They'll see a simple, digested status — never raw logs — so they know when to lean in, no explanation needed.
        </Text>

        {myInvite && (
          <>
            <View style={styles.codeRow}>
              <View style={styles.codeChip}>
                <Text style={styles.codeText}>{myInvite.inviteCode}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode} activeOpacity={0.85}>
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, myInvite.status === 'active' && styles.statusDotActive]} />
              <Text style={styles.statusLine}>
                {myInvite.status === 'active' ? 'Connected with your partner' : 'Waiting for your partner to enter this code…'}
              </Text>
            </View>

            <View style={styles.toggleList}>
              <ToggleRow
                label="Cycle phase"
                value={myInvite.sharePhase}
                onChange={(v) => handleToggle('sharePhase', v)}
              />
              <ToggleRow
                label="Tougher-day heads-up"
                value={myInvite.shareToughDay}
                onChange={(v) => handleToggle('shareToughDay', v)}
              />
              <ToggleRow
                label="Energy & mood detail"
                value={myInvite.shareEnergyMood}
                onChange={(v) => handleToggle('shareEnergyMood', v)}
              />
            </View>

            <TouchableOpacity onPress={handleRevoke} disabled={inviteBusy} style={styles.revokeBtn}>
              <Text style={styles.revokeBtnText}>{inviteBusy ? 'Removing…' : 'Disconnect'}</Text>
            </TouchableOpacity>
          </>
        )}

        {!myInvite && (
          <>
            {inviteError && <Text style={styles.errorText}>{inviteError}</Text>}
            <TouchableOpacity style={styles.supportBtn} onPress={refresh} activeOpacity={0.85}>
              <Text style={styles.supportBtnText}>Generate invite code</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* ── Connect to someone else's invite (you are the partner) ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.card}>
        <Text style={styles.cardTitle}>Support someone</Text>

        {partnerLink ? (
          <>
            <View style={styles.digestHeader}>
              {banner && (
                <View style={[styles.phaseBadge, { backgroundColor: banner.bg }]}>
                  <Text style={[styles.phaseBadgeText, { color: banner.accent }]}>
                    {PHASE_LABEL[phaseKey as string] ?? phaseKey}
                  </Text>
                </View>
              )}
              {partnerLink.sharedUpdatedAt && (
                <Text style={styles.updatedText}>Updated {relativeTime(partnerLink.sharedUpdatedAt)}</Text>
              )}
            </View>

            {partnerLink.sharedMessage && (
              <View style={[styles.digestBubble, partnerLink.sharedToughDay && styles.digestBubbleTough]}>
                {partnerLink.sharedToughDay && (
                  <Animated.View entering={FadeIn.duration(500)} style={styles.pulseDot} />
                )}
                <Text style={styles.digestBubbleText}>{partnerLink.sharedMessage}</Text>
              </View>
            )}
            {!partnerLink.sharedMessage && !banner && (
              <Text style={styles.emptyDigest}>No update shared yet — check back soon.</Text>
            )}

            <Text style={styles.quickLabel}>Quick support</Text>
            <View style={styles.quickRow}>
              {QUICK_REACTIONS.map((r) => (
                <TouchableOpacity
                  key={r.emoji}
                  style={styles.quickBtn}
                  activeOpacity={0.7}
                  disabled={supportBusy}
                  onPress={() => {
                    haptic();
                    handleSendSupport(r.message);
                  }}
                >
                  <Text style={styles.quickBtnEmoji}>{r.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {justSent ? (
              <Animated.View entering={FadeIn.duration(250)} style={styles.sentBanner}>
                <Text style={styles.sentBannerText}>💛 Sent — she'll see it soon</Text>
              </Animated.View>
            ) : (
              <TouchableOpacity style={styles.supportBtn} onPress={() => setSupportOpen(true)} activeOpacity={0.85}>
                <Text style={styles.supportBtnText}>Write your own message</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.cardSub}>Got an invite code from a partner? Enter it here to connect.</Text>
            <View style={styles.codeInputRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter code"
                placeholderTextColor={dash.muted}
                value={codeInput}
                onChangeText={(t) => setCodeInput(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.connectBtn, (!codeInput.trim() || connectBusy) && styles.connectBtnDisabled]}
                onPress={handleAcceptInvite}
                disabled={!codeInput.trim() || connectBusy}
                activeOpacity={0.85}
              >
                <Text style={styles.connectBtnText}>{connectBusy ? '…' : 'Connect'}</Text>
              </TouchableOpacity>
            </View>
            {connectError && <Text style={styles.errorText}>{connectError}</Text>}
          </>
        )}
      </Animated.View>

      <Modal visible={supportOpen} animationType="slide" transparent onRequestClose={() => setSupportOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Send support</Text>
            <View style={{ gap: 8 }}>
              {SUGGESTED_MESSAGES.map((m) => (
                <TouchableOpacity key={m} style={styles.suggestionChip} onPress={() => handleSendSupport(m)} disabled={supportBusy}>
                  <Text style={styles.suggestionChipText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Or write your own…"
              placeholderTextColor={dash.muted}
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              maxLength={200}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setSupportOpen(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSendBtn, (!supportMessage.trim() || supportBusy) && styles.connectBtnDisabled]}
                onPress={() => handleSendSupport(supportMessage.trim())}
                disabled={!supportMessage.trim() || supportBusy}
              >
                <Text style={styles.modalSendBtnText}>{supportBusy ? 'Sending…' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: dash.sage }} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  card: {
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: dash.ink },
  cardSub: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },

  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeChip: {
    backgroundColor: '#F9F6F1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: dash.line,
    borderStyle: 'dashed',
  },
  codeText: { fontSize: 22, fontWeight: '800', letterSpacing: 4, color: dash.ink },
  shareBtn: { backgroundColor: dash.sage, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: dash.muted },
  statusDotActive: { backgroundColor: dash.sage },
  statusLine: { fontSize: 12, color: dash.muted },

  toggleList: { gap: 4, marginTop: 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel: { fontSize: 14, color: dash.ink },

  revokeBtn: { alignSelf: 'flex-start', marginTop: 4 },
  revokeBtnText: { fontSize: 13, color: '#B5493B', fontWeight: '600' },

  digestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phaseBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  phaseBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  updatedText: { fontSize: 11, color: dash.muted, fontWeight: '600' },

  digestBubble: { backgroundColor: '#F9F6F1', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  digestBubbleTough: { backgroundColor: '#FBEFE9' },
  digestBubbleText: { fontSize: 14, color: dash.ink, lineHeight: 20, flex: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C2683F', marginTop: 6 },
  emptyDigest: { fontSize: 13, color: dash.muted, fontStyle: 'italic' },

  quickLabel: { fontSize: 11, fontWeight: '700', color: dash.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F9F6F1', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: dash.line,
  },
  quickBtnEmoji: { fontSize: 20 },

  sentBanner: { backgroundColor: dash.sageTint, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  sentBannerText: { color: dash.sageDeep, fontWeight: '700', fontSize: 14 },

  supportBtn: { backgroundColor: dash.sage, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  supportBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  codeInputRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1, fontSize: 16, letterSpacing: 2, color: dash.ink,
    backgroundColor: '#F9F6F1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  connectBtn: { backgroundColor: dash.sage, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  connectBtnDisabled: { backgroundColor: dash.line },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  errorText: { fontSize: 12, color: '#B5493B' },

  pingBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FBEFE9', borderRadius: 16, padding: 14,
  },
  pingEmoji: { fontSize: 20 },
  pingTitle: { fontSize: 13, fontWeight: '700', color: dash.ink, marginBottom: 2 },
  pingMessage: { fontSize: 13, color: dash.inkSoft, fontStyle: 'italic' },
  pingDismiss: { fontSize: 14, color: dash.muted, padding: 4 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: { backgroundColor: dash.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: dash.ink },
  suggestionChip: { backgroundColor: '#F9F6F1', borderRadius: 12, padding: 12 },
  suggestionChipText: { fontSize: 14, color: dash.ink },
  modalInput: { fontSize: 15, color: dash.ink, backgroundColor: '#F9F6F1', borderRadius: 12, padding: 12, minHeight: 60, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  modalCancel: { fontSize: 15, color: dash.muted },
  modalSendBtn: { backgroundColor: dash.sage, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  modalSendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
