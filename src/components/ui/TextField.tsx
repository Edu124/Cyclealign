import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { palette, radius, spacing } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={palette.muted}
        style={[
          styles.input,
          focused && styles.focused,
          !!error && styles.errored,
          style as any,
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.inkSoft,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 16,
    color: palette.ink,
  },
  focused: {
    borderColor: palette.lavender,
  },
  errored: {
    borderColor: palette.danger,
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
});
