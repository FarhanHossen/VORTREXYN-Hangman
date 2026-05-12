/**
 * components/AppTitle.tsx
 *
 * Animated two-line title component used on the login, signup, and
 * forgot-password screens.
 *
 * Line 1 — "VORTREXYN"
 *   Each letter is a `DropLetter`: it starts 44 px above its resting position
 *   (off-screen for small viewports) and springs down into place, fading in
 *   simultaneously.  A staggered `delay` makes each letter arrive slightly after
 *   the previous one (60 ms apart) for a cascading effect.
 *
 * Line 2 — "HANGMAN"
 *   Each letter is a `BounceLetter`: it pops in from scale 0, while rotating
 *   from -14° to 0°, creating a playful "bounce" feel.  Stagger delay is 70 ms.
 *
 * Both animations use `useNativeDriver: false` because they animate layout
 * properties (translateY, scale) on Animated.Text — native driver only supports
 * opacity and transforms on View nodes in some Expo SDK versions.
 *
 * Color palettes:
 *   TITLE_COLORS   — 9 colours (one per character of "VORTREXYN")
 *   HANGMAN_COLORS — 7 colours (one per character of "HANGMAN")
 * Each letter gets its own colour for a rainbow effect.
 */

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

/** The two words rendered as animated letter rows. */
const TITLE        = "VORTREXYN";
const HANGMAN_WORD = "HANGMAN";

/**
 * One colour per letter of "VORTREXYN" — cycles through the app's brand palette.
 * The array length must match the character count of TITLE (9).
 */
const TITLE_COLORS: string[] = [
  "#FF3CAC", "#FF6B35", "#FFD93D", "#6BCB77",
  "#4CC9F0", "#C77DFF", "#FF3CAC", "#FF6B35", "#FFD93D",
];

/**
 * One colour per letter of "HANGMAN" (7).
 */
const HANGMAN_COLORS: string[] = [
  "#4CC9F0", "#C77DFF", "#FF3CAC", "#FFD93D", "#6BCB77", "#FF6B35", "#4CC9F0",
];

/**
 * DropLetter
 * Renders a single character that drops in from above on mount.
 *
 * Animation:
 *  - Starts with translateY = -44 (above its final position) and opacity = 0.
 *  - After `delay` ms: fades to full opacity (40 ms) and springs into place.
 *  - `tension: 70, friction: 7` gives a satisfying but not excessive bounce.
 */
function DropLetter({ letter, color, delay }: { letter: string; color: string; delay: number }) {
  const y       = useRef(new Animated.Value(-44)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Quick fade-in so the letter appears to "arrive" rather than slide from invisible.
        Animated.timing(opacity, { toValue: 1, duration: 40, useNativeDriver: false }),
        // Spring to y=0 (resting position) with a light bounce.
        Animated.spring(y, { toValue: 0, useNativeDriver: false, tension: 70, friction: 7 }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text style={[styles.titleLetter, { color, opacity, transform: [{ translateY: y }] }]}>
      {letter}
    </Animated.Text>
  );
}

/**
 * BounceLetter
 * Renders a single character that bounces and rotates in on mount.
 *
 * Animation:
 *  - Starts at scale 0 (invisible) and rotateVal = 0 (-14° tilt).
 *  - After `delay` ms: springs to scale=1 and rotates to 0°.
 *  - `tension: 130, friction: 5` creates an energetic pop effect.
 */
function BounceLetter({ letter, color, delay }: { letter: string; color: string; delay: number }) {
  const scale     = useRef(new Animated.Value(0)).current;
  const rotateVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Scale from 0 → 1 with a snappy spring bounce.
        Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 130, friction: 5 }),
        // Rotate from -14° → 0° as the letter settles.
        Animated.timing(rotateVal, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);

  // Map the 0→1 animation value to a CSS-style rotation string.
  const rotate = rotateVal.interpolate({ inputRange: [0, 1], outputRange: ["-14deg", "0deg"] });

  return (
    <Animated.Text style={[styles.subLetter, { color, transform: [{ scale }, { rotate }] }]}>
      {letter}
    </Animated.Text>
  );
}

/**
 * AppTitle
 *
 * Exports the composed two-line animated title.
 * Used on: login.tsx, signup.tsx, forgot-password.tsx.
 *
 * Each character in both words gets its own animated component with a
 * staggered delay so the letters animate in sequentially rather than all
 * at once.
 */
export function AppTitle() {
  return (
    <View style={styles.wrapper}>
      {/* "VORTREXYN" — letters drop in from the top, 80 ms base + 60 ms stagger */}
      <View style={styles.row}>
        {TITLE.split("").map((l, i) => (
          <DropLetter key={i} letter={l} color={TITLE_COLORS[i]} delay={80 + i * 60} />
        ))}
      </View>

      {/* "HANGMAN" — letters bounce in, 650 ms base + 70 ms stagger */}
      <View style={[styles.row, { marginTop: 4 }]}>
        {HANGMAN_WORD.split("").map((l, i) => (
          <BounceLetter key={i} letter={l} color={HANGMAN_COLORS[i]} delay={650 + i * 70} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", marginTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  titleLetter: {
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  subLetter: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});
