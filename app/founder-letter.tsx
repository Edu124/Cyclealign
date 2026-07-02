import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Screen } from '@/components/ui';
import { getTodayLetterCount, sendFounderLetter, MAX_LETTERS_PER_DAY } from '@/lib/founderLetters';
import { palette, radius, spacing } from '@/theme';

const MAX_CHARS = 800;

export default function FounderLetterScreen() {
  const [loadingCount, setLoadingCount] = useState(true);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getTodayLetterCount().then((c) => {
      setCount(c);
      setLoadingCount(false);
    });
  }, []);

  const remaining = Math.max(0, MAX_LETTERS_PER_DAY - count);
  const atCap = remaining === 0;

  async function handleSend() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await sendFounderLetter(message);
      setCount((c) => c + 1);
      setMessage('');
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (loadingCount) {
    return (
      <Screen contentStyle={styles.center}>
        <View />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen contentStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <Image
            source={require('../assets/founder.jpg')}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>A LETTER TO</Text>
            <Text style={styles.name}>Vinita</Text>
            <Text style={styles.role}>Founder, CycleAlign</Text>
          </View>
        </Animated.View>

        {atCap && !sent ? (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.capCard}>
            <Text style={styles.capEmoji}>💌</Text>
            <Text style={styles.capTitle}>Vinita's reading tonight's letters</Text>
            <Text style={styles.capBody}>
              She reads every single one, start to finish — that's why there's a quiet limit
              on how many arrive each day. Save today's thought, and come find her again
              tomorrow morning.
            </Text>
          </Animated.View>
        ) : sent ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.capCard}>
            <Text style={styles.capEmoji}>✅</Text>
            <Text style={styles.capTitle}>Your letter is on its way</Text>
            <Text style={styles.capBody}>
              Vinita will read it personally. Thank you for taking the time to write.
            </Text>
            {remaining > 0 && (
              <Pressable onPress={() => setSent(false)} hitSlop={12} style={{ marginTop: 4 }}>
                <Text style={styles.writeAnother}>Write another letter →</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.composer}>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingText}>
                {remaining} of {MAX_LETTERS_PER_DAY} letters left today
              </Text>
            </View>

            <TextInput
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, MAX_CHARS))}
              placeholder="What's on your mind? She reads every word."
              placeholderTextColor={palette.muted}
              multiline
              style={styles.input}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{message.length}/{MAX_CHARS}</Text>

            <Button
              label={sending ? 'Sealing…' : 'Seal & send 💌'}
              onPress={handleSend}
              disabled={!message.trim() || sending}
              loading={sending}
            />
          </Animated.View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xl },
  back: { alignSelf: 'flex-start' },
  backText: { fontSize: 14, fontWeight: '600', color: palette.inkSoft },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: palette.lavender },
  headerText: { gap: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: palette.lavenderDeep },
  name: { fontSize: 26, fontWeight: '800', color: palette.ink },
  role: { fontSize: 13, color: palette.inkSoft, fontWeight: '500' },

  composer: { gap: spacing.sm },
  remainingPill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.blush,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: 4,
  },
  remainingText: { fontSize: 12, fontWeight: '700', color: palette.roseDeep },
  input: {
    minHeight: 180,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    color: palette.ink,
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: palette.muted, marginBottom: 4 },

  capCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  capEmoji: { fontSize: 34 },
  capTitle: { fontSize: 17, fontWeight: '800', color: palette.ink, textAlign: 'center' },
  capBody: { fontSize: 14, color: palette.inkSoft, textAlign: 'center', lineHeight: 21 },
  writeAnother: { fontSize: 13, fontWeight: '700', color: palette.lavenderDeep },
});
