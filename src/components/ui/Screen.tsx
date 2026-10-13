import type { ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControlProps, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';
import { GradientBackground } from './GradientBackground';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  gradient?: readonly [string, string, ...string[]];
  /** Pull-to-refresh, for scrolling screens. */
  refreshControl?: ReactElement<RefreshControlProps>;
}

/** Standard screen wrapper: pastel gradient + safe-area + optional scroll. */
export function Screen({ children, scroll = true, contentStyle, gradient, refreshControl }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <GradientBackground colors={gradient} />
      {/* The top inset lives OUTSIDE the scroll area: with it inside the
          content padding, anything at the top of the page (back buttons)
          scrolled up underneath the status bar / Dynamic Island. */}
      <KeyboardAvoidingView
        style={[styles.root, { paddingTop: insets.top + spacing.md }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        {scroll ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + spacing.xxl },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.root,
              styles.content,
              { paddingBottom: insets.bottom + spacing.xxl },
              contentStyle,
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
});
