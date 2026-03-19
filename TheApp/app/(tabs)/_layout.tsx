import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/ui';

// Avoid relying on React type namespaces; Expo already handles JSX runtime.
type IconName = any;

function tabIcon(name: IconName, focused: boolean) {
  return <Ionicons name={name} size={22} color={focused ? Colors.gold : Colors.textMuted} />;
}

export default function TabsLayout() {
  const { session, profile, loading } = useAuth();
  const allowed = ['admin', 'representative'];

  if (loading) return <LoadingState />;
  const role = profile?.role?.toString().toLowerCase().trim();
  if (!session || !profile || !allowed.includes(role || '')) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => tabIcon('grid-outline', focused) }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: ({ focused }) => tabIcon('receipt-outline', focused) }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', tabBarIcon: ({ focused }) => tabIcon('cube-outline', focused) }}
      />
      <Tabs.Screen
        name="support"
        options={{ title: 'Support', tabBarIcon: ({ focused }) => tabIcon('chatbubbles-outline', focused) }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ focused }) => tabIcon('ellipsis-horizontal-outline', focused) }}
      />

      {/* Hidden routes - still part of the navigator so `router.push('/(tabs)/users')` works */}
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarButton: () => null }} />
      <Tabs.Screen name="discounts" options={{ title: 'Discounts', tabBarButton: () => null }} />
      <Tabs.Screen name="content" options={{ title: 'Content Blocks', tabBarButton: () => null }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarButton: () => null }} />
      <Tabs.Screen name="loyalty" options={{ title: 'Loyalty', tabBarButton: () => null }} />
      <Tabs.Screen name="roles" options={{ title: 'Roles', tabBarButton: () => null }} />
      <Tabs.Screen name="security" options={{ title: 'Security', tabBarButton: () => null }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarButton: () => null }} />
      <Tabs.Screen name="database" options={{ title: 'Database Tools', tabBarButton: () => null }} />
    </Tabs>
  );
}
