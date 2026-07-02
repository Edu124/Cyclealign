import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AI_DAILY_LIMIT,
  askCoach,
  fetchHistory,
  getUsedToday,
  type CoachMessage,
} from '@/lib/aiCoach';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { recentLogSummary } from '@/lib/intelligence/logInsights';
import { palette, radius, spacing } from '@/theme';

const PHASE_GREETING: Record<string, string> = {
  menstrual: "Hi, I'm Align 🌙 You're in your menstrual phase — a good day for gentle questions. What's on your mind?",
  follicular: "Hi, I'm Align 🌿 Your follicular energy is building — great time to plan ahead. What can I help with?",
  ovulation: "Hi, I'm Align ☀️ You're around ovulation — peak energy days. What would you like to know?",
  luteal: "Hi, I'm Align 🍂 You're in your luteal phase — let's keep things steady. Ask me anything about your cycle.",
};

function Bubble({ msg }: { msg: CoachMessage }) {
  const isUser = msg.role === 'user';
  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}
    >
      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{msg.content}</Text>
    </Animated.View>
  );
}

export default function AICoachScreen() {
  const insets = useSafeAreaInsets();
  const prediction = usePrediction();
  const dailyLogs = useDailyLog((s) => s.logs);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchHistory(), getUsedToday()]).then(([history, used]) => {
      setMessages(history);
      setRemaining(Math.max(0, AI_DAILY_LIMIT - used));
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, sending]);

  const atLimit = remaining === 0;
  const phase = prediction?.currentPhase;

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || atLimit) return;
    setError(null);
    setInput('');
    setSending(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    try {
      const res = await askCoach(text, {
        phase,
        dayOfCycle: prediction?.dayOfCycle,
        cycleLength: prediction?.cycleLength,
        logSummary: recentLogSummary(dailyLogs),
      });
      if (res.limitReached) {
        setRemaining(0);
      } else {
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'assistant', content: res.reply }]);
        setRemaining(res.remaining);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🌿</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Align</Text>
            <Text style={styles.headerRole}>Your cycle coach</Text>
          </View>
        </View>
        {remaining !== null && (
          <View style={styles.remainingPill}>
            <Text style={styles.remainingText}>{remaining} left</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome bubble */}
          <Animated.View entering={FadeIn.duration(400)} style={[styles.bubble, styles.bubbleCoach]}>
            <Text style={styles.bubbleText}>
              {PHASE_GREETING[phase ?? 'follicular']}
            </Text>
          </Animated.View>

          {messages.map((msg) => (
            <Bubble key={msg.id} msg={msg} />
          ))}

          {sending && (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.bubble, styles.bubbleCoach]}>
              <Text style={styles.typing}>Align is thinking…</Text>
            </Animated.View>
          )}

          {error && (
            <Animated.View entering={FadeIn.duration(200)} style={styles.errorPill}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {atLimit && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.limitCard}>
              <Text style={styles.limitEmoji}>🌙</Text>
              <Text style={styles.limitTitle}>Align is recharging</Text>
              <Text style={styles.limitBody}>
                Five thoughtful answers a day is what keeps them thoughtful. Your questions
                reset with the sunrise — save tonight's thought and come back tomorrow.
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* Input bar */}
        {!atLimit && (
          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your cycle, energy, mood…"
              placeholderTextColor={palette.muted}
              style={styles.input}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || sending}
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <Text style={[styles.disclaimer, { paddingBottom: Math.max(insets.bottom - 6, 6) }]}>
        Align shares wellness guidance, not medical advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    gap: spacing.md,
  },
  backText: { fontSize: 14, fontWeight: '600', color: palette.inkSoft },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.lavender + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  headerName: { fontSize: 16, fontWeight: '800', color: palette.ink },
  headerRole: { fontSize: 11, color: palette.muted, fontWeight: '500' },
  remainingPill: {
    backgroundColor: palette.blush,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  remainingText: { fontSize: 11, fontWeight: '700', color: palette.roseDeep },

  messages: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleCoach: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderBottomLeftRadius: 6,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: palette.lavenderDeep,
    borderBottomRightRadius: 6,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, color: palette.ink },
  bubbleTextUser: { color: '#FFFFFF' },
  typing: { fontSize: 14, color: palette.muted, fontStyle: 'italic' },

  errorPill: {
    alignSelf: 'center',
    backgroundColor: '#FBEDEB',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: { fontSize: 13, color: palette.danger },

  limitCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  limitEmoji: { fontSize: 32 },
  limitTitle: { fontSize: 17, fontWeight: '800', color: palette.ink },
  limitBody: { fontSize: 14, color: palette.inkSoft, textAlign: 'center', lineHeight: 21 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    backgroundColor: palette.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    color: palette.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.lavenderDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },

  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: palette.muted,
    paddingTop: 4,
    backgroundColor: palette.bg,
  },
});
