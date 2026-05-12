/**
 * app/(tabs)/_layout.tsx
 *
 * Tab navigator layout for the three main app screens:
 *   HOME       → difficulty selection / stats banner
 *   RANKS      → leaderboard
 *   PROFILE    → account info, stats, sign-out
 *
 * Auth guard:
 * A `useEffect` watches `user`, `isGuest`, and `loading` from `AuthContext`.
 * If the auth check has finished and there is no signed-in user AND no guest
 * session, the user is redirected to `/login`.  This prevents unauthenticated
 * access to the tab group even via deep-link or hot-reload.
 *
 * Styling:
 * The tab bar uses the app's dark cosmic palette:
 *   - Background: #0A0A1E (near-black blue)
 *   - Active icon / label: #4CC9F0 (cyan)
 *   - Inactive: #3D3D6A (muted purple)
 * Platform-specific heights account for the iOS home indicator bar.
 */

import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

/**
 * TabIcon
 * Thin wrapper around Feather so we have consistent icon sizing (22px)
 * across all tab bar items without repeating the `size` prop everywhere.
 */
function TabIcon({ name, color }: { name: React.ComponentProps<typeof Feather>["name"]; color: string }) {
  return <Feather name={name} size={22} color={color} />;
}

/**
 * TabsLayout
 *
 * Renders the bottom tab bar and registers the three tab screens.
 * Expo Router automatically maps each `<Tabs.Screen name="…">` to the
 * corresponding file inside the `(tabs)/` directory.
 */
export default function TabsLayout() {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  /**
   * Auth guard — runs whenever auth state changes.
   * We wait until `loading` is false (initial Firebase auth check is done)
   * before redirecting, so we don't send users to login during app boot.
   */
  useEffect(() => {
    if (!loading && !user && !isGuest) {
      router.replace("/login");
    }
  }, [user, isGuest, loading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A0A1E",
          borderTopColor: "rgba(76,201,240,0.18)",
          borderTopWidth: 1,
          // iOS needs extra bottom padding to clear the home indicator bar.
          height: Platform.OS === "ios" ? 82 : 64,
          paddingBottom: Platform.OS === "ios" ? 22 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#4CC9F0",   // cyan for active tab
        tabBarInactiveTintColor: "#3D3D6A", // muted purple for inactive
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.8,
        },
      }}
    >
      {/* HOME — difficulty selection screen */}
      <Tabs.Screen
        name="home"
        options={{
          title: "HOME",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />

      {/* LEADERBOARD — global rankings per difficulty */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "RANKS",
          tabBarIcon: ({ color }) => <TabIcon name="award" color={color} />,
        }}
      />

      {/* PROFILE — account info, stats, sign-out / delete account */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
