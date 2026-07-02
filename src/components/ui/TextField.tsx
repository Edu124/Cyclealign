import { useState } from 'react';
import {
  Pressable,
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

export function TextField({ label, error, style, secureTextEntry, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View>
        <TextInput
          placeholderTextColor={palette.muted}
          secureTextEntry={isPassword && hidden}
          style={[
            styles.input,
            isPassword && styles.inputWithToggle,
            focused && styles.focused,
            !!error && styles.errored,
            style as any,
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            style={styles.eyeBtn}
          >
            <Text style={styles.eyeText}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
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
  inputWithToggle: {
    paddingRight: 64,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.lavenderDeep,
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
