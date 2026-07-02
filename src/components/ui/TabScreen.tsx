import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Screen } from './Screen';
import { spacing } from '@/theme';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  gradient?: readonly [string, string, ...string[]];
}

/**
 * Screen wrapper for bottom-tab screens only. Reserves enough bottom space
 * for the floating tab bar (whose real height varies per device — gesture
 * nav, 3-button nav, notch, etc.) so scrollable content never ends up hidden
 * or unreachable underneath it.
 */
export function TabScreen({ contentStyle, ...rest }: Props) {
  const tabBarHeight = useBottomTabBarHeight();
  return (
    <Screen {...rest} contentStyle={{ ...contentStyle, paddingBottom: tabBarHeight + spacing.lg }} />
  );
}
