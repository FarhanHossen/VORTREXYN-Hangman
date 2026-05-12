/**
 * app/+not-found.tsx
 *
 * Catch-all "404" screen for the VORTREXYN Hangman app.
 *
 * Expo Router automatically renders this file whenever the user (or a deep
 * link) navigates to a route that does not match any known screen.  It shows
 * a simple message and a link back to the root index screen so the user is
 * never stranded on a blank page.
 *
 * Why useColors?
 * `useColors` returns the current theme palette (light / dark) so the screen
 * adapts automatically to system appearance without hard-coding colour values.
 */

import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

/**
 * NotFoundScreen
 * Displayed whenever Expo Router cannot match the current path to a screen.
 * The `<Stack.Screen>` component overrides the navigation title to "Oops!"
 * without needing to navigate away from this component.
 */
export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <>
      {/* Override the stack header title for this particular screen */}
      <Stack.Screen options={{ title: "Oops!" }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          This screen doesn&apos;t exist.
        </Text>

        {/* Link back to the root — `href="/"` goes to app/index.tsx */}
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
});
