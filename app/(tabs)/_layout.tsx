import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/ui/TabBarIcon';
import { ExitFlowOverlay } from '@/components/exit/ExitFlowOverlay';
import { ReferralCloseNudge } from '@/components/exit/ReferralCloseNudge';
import { ReferralInAppCard } from '@/components/exit/ReferralInAppCard';
import { useIsV2 } from '@/lib/hooks/useIsV2';
import { dash } from '@/theme';

const CONTENT_HEIGHT = 52; // icon + label, excludes safe-area padding
const TOP_PADDING = 12;
// Standard Android 3-button nav bar height. Some OEM skins under-report this
// in safe-area insets, so we floor to it instead of trusting insets.bottom alone.
const ANDROID_NAV_BAR_FLOOR = 48;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Circle (community) is a V2 feature — the tab is hidden entirely in V1.
  const isV2 = useIsV2();
  // Grow the bottom padding with the device's real safe-area inset so the tab
  // bar never sits under (or overlaps) the phone's own nav buttons/gesture bar.
  const bottomPadding =
    Platform.OS === 'ios'
      ? insets.bottom + 8
      : Math.max(insets.bottom, ANDROID_NAV_BAR_FLOOR) + 4;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: dash.sage,
          tabBarInactiveTintColor: dash.muted,
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: dash.card,
            borderTopWidth: 0,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            height: CONTENT_HEIGHT + TOP_PADDING + bottomPadding,
            paddingTop: TOP_PADDING,
            paddingBottom: bottomPadding,
            shadowColor: '#2E2A26',
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="phases"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color }) => <TabBarIcon name="insights" color={color} />,
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="circle"
          options={{
            title: 'Circle',
            href: isV2 ? undefined : null,
            tabBarIcon: ({ color }) => <TabBarIcon name="community" color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <TabBarIcon name="ai" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'About',
            tabBarIcon: ({ color }) => <TabBarIcon name="profile" color={color} />,
          }}
        />
      </Tabs>

      {/* Android: referral pitch on hardware back press. Any tab, not just Home. */}
      <ExitFlowOverlay />
      {/* iOS has no way to intercept the close gesture, so the referral pitch shows
          in-app shortly after opening instead — guaranteed to be seen, no notification
          permission required. The backgrounding notification stays as a backup for
          anyone who closes before this has a chance to show. */}
      <ReferralInAppCard />
      <ReferralCloseNudge />
    </>
  );
}
