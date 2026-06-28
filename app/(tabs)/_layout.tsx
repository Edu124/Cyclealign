import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { TabBarIcon } from '@/components/ui/TabBarIcon';
import { dash } from '@/theme';

export default function TabsLayout() {
  return (
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
          height: Platform.OS === 'ios' ? 90 : 74,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
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
          tabBarIcon: ({ color }) => <TabBarIcon name="community" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
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
  );
}
