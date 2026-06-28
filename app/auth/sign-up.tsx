import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Screen, TextField } from '@/components/ui';
import { Wordmark } from '@/components/logo/Wordmark';
import { palette, spacing } from '@/theme';
import { signUpWithEmail } from '@/lib/auth';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    const res = await signUpWithEmail(email.trim(), password, name.trim());
    setLoading(false);
    if (!res.ok) {
      Alert.alert('Could not sign up', res.error);
    } else {
      Alert.alert(
        'Check your email',
        'Confirm your address, then sign in to continue.',
      );
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Wordmark size={28} />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start aligning with your cycle</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.form}>
        <TextField
          label="Name"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Password"
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button label="Create account" onPress={handleSignUp} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/auth/sign-in" style={styles.link}>
            Sign in
          </Link>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: palette.ink, marginTop: spacing.md },
  subtitle: { fontSize: 15, color: palette.inkSoft },
  form: { gap: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  footerText: { color: palette.inkSoft },
  link: { color: palette.roseDeep, fontWeight: '700' },
});
