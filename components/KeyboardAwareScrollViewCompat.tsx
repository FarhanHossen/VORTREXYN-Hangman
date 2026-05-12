/**
 * components/KeyboardAwareScrollViewCompat.tsx
 *
 * Cross-platform keyboard-aware scroll view compatibility shim.
 *
 * Problem:
 *   `react-native-keyboard-controller` ships a powerful `KeyboardAwareScrollView`
 *   that automatically adjusts the scroll position when the soft keyboard appears,
 *   keeping the focused input visible.  However, the library has limited web
 *   support and can cause rendering issues on web builds.
 *
 * Solution:
 *   This wrapper component checks `Platform.OS` at render time:
 *     - Native (iOS / Android): renders `KeyboardAwareScrollView` for the best UX.
 *     - Web: falls back to a plain `ScrollView` which is sufficient because the
 *       browser handles keyboard / viewport interactions natively.
 *
 * Usage:
 *   Replace `<ScrollView>` with `<KeyboardAwareScrollViewCompat>` in any screen
 *   that contains form inputs.  All ScrollView props pass through transparently.
 */

import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";
import { Platform, ScrollView, ScrollViewProps } from "react-native";

/**
 * Props merge both types so this component is a drop-in replacement for
 * either `KeyboardAwareScrollView` or `ScrollView` without requiring callers
 * to change their prop set.
 */
type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

/**
 * KeyboardAwareScrollViewCompat
 *
 * On web, renders a standard `ScrollView`.
 * On native platforms, renders `KeyboardAwareScrollView` so the content
 * automatically scrolls up when the on-screen keyboard appears over an input.
 *
 * `keyboardShouldPersistTaps` defaults to "handled" so tapping a button
 * while the keyboard is open dismisses the keyboard first — a standard
 * expected behaviour in mobile forms.
 */
export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  if (Platform.OS === "web") {
    // Web: plain ScrollView — the browser manages keyboard layout natively.
    return (
      <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
        {children}
      </ScrollView>
    );
  }

  // Native: keyboard-aware scroll view that shifts content above the keyboard.
  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
