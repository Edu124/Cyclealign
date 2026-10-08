import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { dash, phaseColors, spacing } from '@/theme';
import type { PhaseKey, WeeklyTopic } from '@/types/models';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, isAnonymous: boolean, replyToTopic: boolean, sharePhase: boolean) => Promise<void>;
  /** Her cycle phase, offered as an opt-in. null = nothing to share (irregular / perimenopause / no cycle). */
  sharablePhase: PhaseKey | null;
  activeTopic: WeeklyTopic | null;
  defaultReplyToTopic?: boolean;
}

const MAX = 500;

export function PostComposer({
  visible,
  onClose,
  onSubmit,
  sharablePhase,
  activeTopic,
  defaultReplyToTopic = false,
}: Props) {
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [replyToTopic, setReplyToTopic] = useState(defaultReplyToTopic);
  // Off by default and reset after every post: she chooses each time.
  const [sharePhase, setSharePhase] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const phaseColor = sharablePhase ? phaseColors[sharablePhase].base : dash.muted;
  const remaining = MAX - text.length;
  const canPost = text.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canPost) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim(), anonymous, replyToTopic, sharablePhase !== null && sharePhase);
      setText('');
      setAnonymous(false);
      setSharePhase(false);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContent}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share a thought</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Optional: she can choose to show her cycle phase on this post. Never automatic. */}
          {sharablePhase && (
            <View style={[styles.phaseBadge, { backgroundColor: phaseColor + '22' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.phaseBadgeText, { color: phaseColor }]}>
                  Show my cycle phase on this post
                </Text>
                <Text style={styles.phaseBadgeNote}>
                  {sharePhase
                    ? `Others will see "${sharablePhase.charAt(0).toUpperCase() + sharablePhase.slice(1)} phase". Off by default.`
                    : 'Your phase stays private unless you turn this on.'}
                </Text>
              </View>
              <Switch
                testID="share-phase-toggle"
                value={sharePhase}
                onValueChange={setSharePhase}
                trackColor={{ false: dash.line, true: phaseColor + '88' }}
                thumbColor={sharePhase ? phaseColor : '#ccc'}
              />
            </View>
          )}

          {/* Reply to topic toggle */}
          {activeTopic && (
            <TouchableOpacity
              style={[styles.topicToggle, replyToTopic && styles.topicToggleActive]}
              onPress={() => setReplyToTopic((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.topicToggleEmoji}>✦</Text>
              <Text style={[styles.topicToggleText, replyToTopic && styles.topicToggleTextActive]}>
                Replying to this week's topic
              </Text>
              {replyToTopic && <Text style={styles.topicCheck}>✓</Text>}
            </TouchableOpacity>
          )}

          {/* Text input */}
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={dash.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX}
            autoFocus
            textAlignVertical="top"
          />

          {/* Footer: char count + anonymous + post */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={[styles.charCount, remaining < 50 && styles.charCountWarn]}>
                {remaining}
              </Text>
              <View style={styles.anonRow}>
                <Text style={styles.anonLabel}>Anonymous</Text>
                <Switch
                  value={anonymous}
                  onValueChange={setAnonymous}
                  trackColor={{ false: dash.line, true: dash.sage + '88' }}
                  thumbColor={anonymous ? dash.sage : '#ccc'}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canPost}
              activeOpacity={0.85}
            >
              <Text style={styles.postBtnText}>
                {submitting ? 'Posting…' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: dash.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: spacing.xl,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.xl,
    gap: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: dash.line,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: dash.ink },
  close: { fontSize: 16, color: dash.muted },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  phaseBadgeText: { fontSize: 12, fontWeight: '700' },
  phaseBadgeNote: { fontSize: 11, color: dash.muted },
  topicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dash.line,
    backgroundColor: '#F9F6F1',
  },
  topicToggleActive: {
    borderColor: '#A8C293',
    backgroundColor: '#EFF5E9',
  },
  topicToggleEmoji: { fontSize: 12, color: dash.sage },
  topicToggleText: { flex: 1, fontSize: 13, color: dash.inkSoft },
  topicToggleTextActive: { color: dash.sage, fontWeight: '600' },
  topicCheck: { color: dash.sage, fontWeight: '700', fontSize: 13 },
  input: {
    fontSize: 15,
    color: dash.ink,
    lineHeight: 23,
    minHeight: 100,
    maxHeight: 180,
    backgroundColor: '#F9F6F1',
    borderRadius: 12,
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerLeft: { flex: 1, gap: 8 },
  charCount: { fontSize: 12, color: dash.muted },
  charCountWarn: { color: '#C9695A' },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anonLabel: { fontSize: 13, color: dash.inkSoft },
  postBtn: {
    backgroundColor: dash.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  postBtnDisabled: { backgroundColor: dash.line },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
