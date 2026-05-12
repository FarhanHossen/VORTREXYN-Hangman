/**
 * app/_layout.tsx
 *
 * Root layout for the VORTREXYN Hangman Expo Router app.
 *
 * This file is the entry point that Expo Router renders first.  It does four
 * important things before any screen is shown:
 *
 *  1. Font loading — Inter (400, 500, 600, 700) is loaded via `useFonts`.
 *     The splash screen is kept visible until the fonts resolve so users
 *     never see a flash of unstyled text.
 *
 *  2. Provider tree — all React contexts and third-party wrappers are mounted
 *     here so they are available to every screen in the app:
 *       SafeAreaProvider   → inset-aware layout (notch / home-bar spacing)
 *       ErrorBoundary      → catches render errors and shows a recovery UI
 *       QueryClientProvider → React Query for any data-fetching hooks
 *       GestureHandlerRootView → enables pan/swipe gestures app-wide
 *       KeyboardProvider   → drives the keyboard-aware scroll behaviour
 *       AuthProvider       → Firebase auth state (user, login, logout, …)
 *       GameProvider       → hangman game state (word, guesses, stats, …)
 *
 *  3. Navigation stack — declares every top-level screen with `headerShown: false`
 *     and a "fade" transition animation.  The `(tabs)` group is registered here
 *     even though its own _layout.tsx defines the tab bar.
 *
 *  4. Splash screen control — `SplashScreen.preventAutoHideAsync()` is called
 *     at module load time (outside the component) so the splash never auto-hides
 *     before fonts are ready.  `SplashScreen.hideAsync()` is called inside a
 *     `useEffect` that watches `fontsLoaded` and `fontError`.
 */

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameProvider } from "@/context/GameContext";
import { AuthProvider } from "@/context/AuthContext";

/**
 * Prevent the native splash screen from auto-hiding.
 * This must be called synchronously at module load so it takes effect before
 * React renders anything.  `SplashScreen.hideAsync()` is called later once
 * the fonts have finished loading.
 */
SplashScreen.preventAutoHideAsync();

/**
 * A single QueryClient instance shared across the whole app.
 * Created outside the component so it is not re-created on every render.
 * This client manages caching and background refetching for any React Query hooks.
 */
const queryClient = new QueryClient();

/**
 * RootLayout
 *
 * The root component rendered by Expo Router.  It:
 *  - Loads custom Inter fonts and blocks rendering until they are ready.
 *  - Hides the splash screen once fonts resolve (or fail, to avoid infinite hang).
 *  - Wraps the navigation stack in all required providers.
 */
export default function RootLayout() {
  /**
   * `useFonts` returns [loaded, error].
   * We load all four Inter weights we use throughout the app.
   * Until `fontsLoaded` is true (or `fontError` is non-null), we return null
   * so the splash screen stays visible and there is nothing to render.
   */
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  /**
   * Hide the splash screen as soon as fonts are ready.
   * We also hide on `fontError` so a font-load failure doesn't leave the
   * user staring at the splash forever — the app falls back to system fonts.
   */
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return null while fonts are still loading (splash screen stays visible).
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      {/* Catches any unhandled render error and shows ErrorFallback */}
      <ErrorBoundary>
        {/* React Query cache — shared across all screens */}
        <QueryClientProvider client={queryClient}>
          {/* Required root wrapper for react-native-gesture-handler */}
          <GestureHandlerRootView style={{ flex: 1 }}>
            {/* Enables keyboard-aware scrolling via react-native-keyboard-controller */}
            <KeyboardProvider>
              {/* Firebase auth state: user, login, signup, guest mode, etc. */}
              <AuthProvider>
                {/* Hangman game state: word, guesses, stats, level progression */}
                <GameProvider>
                  {/* Top-level navigation stack — all headers hidden app-wide */}
                  <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                    {/* Animated splash / intro screen */}
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    {/* Auth screens */}
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="signup" options={{ headerShown: false }} />
                    <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                    {/* Main game screen */}
                    <Stack.Screen name="game" options={{ headerShown: false }} />
                    {/* Tab group: home, leaderboard, profile */}
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack>
                </GameProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
