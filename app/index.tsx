/**
 * app/index.tsx
 *
 * Animated splash / intro screen for VORTREXYN Hangman.
 *
 * This is the first screen users see after the native splash hides.
 * After 4.6 seconds it automatically navigates to `/login`.
 *
 * Visual layers (bottom to top):
 *   1. LinearGradient background — deep indigo → purple.
 *   2. 20 twinkling star "✦" characters scattered across the screen.
 *   3. Two decorative semi-transparent circles (top-right and bottom-left corners).
 *   4. Centred content:
 *        a. LogoBadge — the animated cosmic vortex "V" logo.
 *        b. "VORTREXYN" — each letter drops in from the top (DropLetter).
 *        c. "HANGMAN"   — each letter bounces in with a spin (BounceLetter).
 *
 * ── Component breakdown ──────────────────────────────────────────────────
 *
 * TwinkleStar
 *   A single "✦" character positioned absolutely.  Animates its opacity
 *   in a loop (0.08 → 0.85 → 0.08) with a staggered `delay` per star.
 *   STAR_DATA is generated once at module load using deterministic maths so
 *   stars are always in the same positions (no hydration mismatch on web).
 *
 * LogoBadge (inline version, re-used from components/LogoBadge.tsx pattern)
 *   Three spinning SVG arcs, a pulsing outer glow ring, and a breathing
 *   gradient "V" letter.  Defined inline in this file for the splash screen
 *   because the splash has a larger 140 px version with a pop-in animation.
 *
 * DropLetter ("VORTREXYN")
 *   Each character starts off-screen (translateY = -65% screen height) and
 *   springs down to y=0 with a fade-in.  Staggered delay: 500 ms base + 95 ms
 *   per letter index.
 *
 * BounceLetter ("HANGMAN")
 *   Each character springs in from scale=0 while simultaneously rotating
 *   from -18° to 0°.  Staggered delay: 1450 ms base + 100 ms per letter.
 *
 * Auto-navigation:
 *   A `setTimeout` is set for 4600 ms after mount, then calls
 *   `router.replace("/login")`.  The timeout is cleared in the useEffect
 *   cleanup function so it doesn't fire if the component unmounts early
 *   (e.g. during hot reload or back navigation).
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line, Path, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";

/** Screen dimensions — used to position stars and animate DropLetters. */
const { width: SW, height: SH } = Dimensions.get("window");

/** Full text strings for the two animated word rows. */
const TITLE   = "VORTREXYN";
const HANGMAN = "HANGMAN";

/**
 * Per-character accent colours for "VORTREXYN" (9 chars).
 * Each letter gets its own colour for a rainbow effect.
 */
const TITLE_COLORS = [
  "#FF3CAC", "#FF6B35", "#FFD93D", "#6BCB77", "#4CC9F0",
  "#C77DFF", "#FF3CAC", "#FF6B35", "#FFD93D",
];

/**
 * Per-character accent colours for "HANGMAN" (7 chars).
 */
const HANGMAN_COLORS = [
  "#4CC9F0", "#C77DFF", "#FF3CAC", "#FFD93D", "#6BCB77", "#FF6B35", "#4CC9F0",
];

// ── Twinkle stars ──────────────────────────────────────────────────────────

/** Total number of background star particles. */
const NUM_STARS = 20;

/**
 * STAR_DATA
 * Pre-computed star properties using deterministic arithmetic so stars always
 * appear in the same positions (important for server-side rendering on web).
 *
 * Each star gets:
 *   left  — horizontal position (px), spread across screen width.
 *   top   — vertical position (px), spread across screen height.
 *   size  — font size (7–17 px).
 *   delay — animation start offset (ms) so stars don't all pulse together.
 *   color — one of 6 brand colours.
 */
const STAR_DATA = Array.from({ length: NUM_STARS }, (_, i) => ({
  left:  15 + (i * 43 + i * i * 7) % (SW - 30),
  top:   40 + (i * 67 + i * 11) % (SH - 100),
  size:  7 + (i * 3) % 10,
  delay: i * 190,
  color: ["#FF3CAC", "#FFD93D", "#4CC9F0", "#6BCB77", "#FF6B35", "#FFFFFF"][i % 6],
}));

/**
 * TwinkleStar
 * A single animated "✦" character.
 * Loops: wait `delay` ms → fade in (700 ms) → fade out (700 ms) → repeat.
 * `useNativeDriver: false` is required because `opacity` on Animated.Text
 * is not supported by the native driver on all RN versions.
 */
function TwinkleStar({ left, top, size, delay, color }: typeof STAR_DATA[0]) {
  const opacity = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.08, duration: 700, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text style={{ position: "absolute", left, top, fontSize: size, color, opacity }}>
      ✦
    </Animated.Text>
  );
}

// ── Logo badge ─────────────────────────────────────────────────────────────

/**
 * LogoBadge (splash-screen inline version)
 *
 * A self-contained animated cosmic vortex logo.
 * Three concentric rotating SVG arcs surround a dark disc containing a
 * gradient "V" letter.  A colour-cycling outer glow ring pulses in scale.
 *
 * Animations started on mount (all looping):
 *   popAnim   — spring pop-in (scale 0 → 1).
 *   pulseAnim — outer ring scale oscillation (0.9 ↔ 1.14, 800 ms per cycle).
 *   arc1Spin  — Arc 1 rotates CW, one full revolution every 3.6 s.
 *   arc2Spin  — Arc 2 rotates CCW, one full revolution every 2.6 s.
 *   arc3Spin  — Arc 3 rotates CW, one full revolution every 1.8 s.
 *   vPulse    — V letter breathes (0.94 ↔ 1.08, 900 ms per cycle).
 *   glowColor — ring colour cycles: cyan → purple → pink → cyan, 3 s period.
 */
function LogoBadge() {
  const popAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arc1Spin  = useRef(new Animated.Value(0)).current;
  const arc2Spin  = useRef(new Animated.Value(0)).current;
  const arc3Spin  = useRef(new Animated.Value(0)).current;
  const vPulse    = useRef(new Animated.Value(1)).current;
  const glowColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pop in on mount with spring physics.
    Animated.spring(popAnim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 6, delay: 80 }).start();

    // Outer ring continuous pulse.
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.14, duration: 800, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0.9,  duration: 800, useNativeDriver: false }),
    ])).start();

    // Arc rotations — each arc has a different speed and direction.
    Animated.loop(Animated.timing(arc1Spin, { toValue: 1,  duration: 3600, useNativeDriver: false })).start();
    Animated.loop(Animated.timing(arc2Spin, { toValue: -1, duration: 2600, useNativeDriver: false })).start();
    Animated.loop(Animated.timing(arc3Spin, { toValue: 1,  duration: 1800, useNativeDriver: false })).start();

    // V letter breathe.
    Animated.loop(Animated.sequence([
      Animated.timing(vPulse, { toValue: 1.08, duration: 900, useNativeDriver: false }),
      Animated.timing(vPulse, { toValue: 0.94, duration: 900, useNativeDriver: false }),
    ])).start();

    // Glow colour cycle.
    Animated.loop(Animated.timing(glowColor, { toValue: 1, duration: 3000, useNativeDriver: false })).start();
  }, []);

  // Convert raw animation values to CSS-style degree strings for `rotate`.
  const spin1 = arc1Spin.interpolate({ inputRange: [0, 1],   outputRange: ["0deg",   "360deg"] });
  const spin2 = arc2Spin.interpolate({ inputRange: [-1, 0],  outputRange: ["-360deg","0deg"]   });
  const spin3 = arc3Spin.interpolate({ inputRange: [0, 1],   outputRange: ["0deg",   "360deg"] });
  // Colour-cycling ring border and glow shadow.
  const ringColor = glowColor.interpolate({
    inputRange:  [0, 0.33, 0.66, 1],
    outputRange: ["#4CC9F0", "#C77DFF", "#FF3CAC", "#4CC9F0"],
  });

  const SVG = 140;
  const CX  = 70;

  return (
    <Animated.View style={[styles.badgeWrapper, { transform: [{ scale: popAnim }] }]}>

      {/* Colour-cycling pulsing outer glow ring */}
      <Animated.View style={[styles.glowRing, {
        borderColor: ringColor,
        shadowColor: ringColor,
        transform: [{ scale: pulseAnim }],
      }]} />

      {/* Arc 1 — outermost, cyan, clockwise */}
      <Animated.View style={[styles.arcLayer, { transform: [{ rotate: spin1 }] }]}>
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          <Circle cx={CX} cy={CX} r={58}
            fill="none" stroke="#4CC9F0" strokeWidth={5}
            strokeDasharray="274 91" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Arc 2 — middle, purple + orange accent, counter-clockwise */}
      <Animated.View style={[styles.arcLayer, { transform: [{ rotate: spin2 }] }]}>
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          <Circle cx={CX} cy={CX} r={44}
            fill="none" stroke="#C77DFF" strokeWidth={5}
            strokeDasharray="184 92" strokeLinecap="round" />
          <Circle cx={CX} cy={CX} r={44}
            fill="none" stroke="#FF6B35" strokeWidth={3}
            strokeDasharray="69 207" strokeDashoffset="150" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Arc 3 — innermost, pink, clockwise fast */}
      <Animated.View style={[styles.arcLayer, { transform: [{ rotate: spin3 }] }]}>
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          <Circle cx={CX} cy={CX} r={30}
            fill="none" stroke="#FF3CAC" strokeWidth={5}
            strokeDasharray="94 94" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Dark inner disc — masks arc centres for a clean ring look */}
      <View style={styles.innerDisc} />

      {/* Breathing gradient "V" letter at the centre */}
      <Animated.View style={[styles.vContainer, { transform: [{ scale: vPulse }] }]}>
        <Svg width={82} height={72} viewBox="0 0 82 72">
          <Defs>
            {/* Vertical gradient: gold → orange → pink */}
            <SvgGrad id="vg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor="#FFD93D" />
              <Stop offset="0.5" stopColor="#FF6B35" />
              <Stop offset="1"   stopColor="#FF3CAC" />
            </SvgGrad>
          </Defs>
          {/* Shadow depth layer behind the V */}
          <Path d="M 6 6 L 41 66 L 76 6"
            stroke="#1A0040" strokeWidth={18}
            strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
          {/* Main V with gradient stroke */}
          <Path d="M 6 6 L 41 66 L 76 6"
            stroke="url(#vg)" strokeWidth={14}
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* White shine overlay */}
          <Path d="M 6 6 L 41 66 L 76 6"
            stroke="#FFFFFF" strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.45} />
          {/* Gold star tips at the top of each V arm */}
          <Circle cx={6}  cy={6}  r={5} fill="#FFD93D" />
          <Circle cx={76} cy={6}  r={5} fill="#FFD93D" />
          {/* Pink diamond gem at the bottom tip */}
          <Path d="M 37 66 L 41 74 L 45 66 Z" fill="#FF3CAC" />
        </Svg>
      </Animated.View>

    </Animated.View>
  );
}

// ── Animated letter components ─────────────────────────────────────────────

/**
 * DropLetter
 * A single character of "VORTREXYN".
 * Springs down from -65% of screen height, fading in simultaneously.
 * High tension (60) with low friction (7) gives a satisfying spring bounce.
 */
function DropLetter({ letter, color, delay }: { letter: string; color: string; delay: number }) {
  const y       = useRef(new Animated.Value(-SH * 0.65)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Quick opacity flash so the letter appears to "arrive".
        Animated.timing(opacity, { toValue: 1, duration: 50, useNativeDriver: false }),
        // Spring down to resting position.
        Animated.spring(y, { toValue: 0, useNativeDriver: false, tension: 60, friction: 7 }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text style={[styles.dropLetter, { color, opacity, transform: [{ translateY: y }] }]}>
      {letter}
    </Animated.Text>
  );
}

/**
 * BounceLetter
 * A single character of "HANGMAN".
 * Pops in from scale=0 while rotating from -18° to 0°.
 * High tension (130) gives an energetic snap; low friction (5) adds overshoot bounce.
 */
function BounceLetter({ letter, color, delay }: { letter: string; color: string; delay: number }) {
  const scale     = useRef(new Animated.Value(0)).current;
  const rotateVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: false, tension: 130, friction: 5 }),
        Animated.timing(rotateVal, { toValue: 1, duration: 350, useNativeDriver: false }),
      ]),
    ]).start();
  }, []);

  // Map 0→1 to the rotation string range.
  const rotate = rotateVal.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "0deg"] });

  return (
    <Animated.Text style={[styles.bounceLetter, { color, transform: [{ scale }, { rotate }] }]}>
      {letter}
    </Animated.Text>
  );
}

// ── Root screen ────────────────────────────────────────────────────────────

/**
 * SplashScreen (default export — maps to the root "/" route)
 *
 * Renders the full animated intro and auto-navigates to /login after 4.6 s.
 * The 4.6 s delay is calibrated so the "HANGMAN" letters have fully bounced
 * in and the user has a moment to enjoy the animation before being redirected.
 */
export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // Auto-navigate to login after the intro animation completes.
    const t = setTimeout(() => router.replace("/login"), 4600);
    // Clear the timeout if the component unmounts before it fires.
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient
      colors={["#08001C", "#160038", "#2E0060", "#5B0EAC"]}
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {/* Background twinkle stars */}
      {STAR_DATA.map((s, i) => <TwinkleStar key={i} {...s} />)}

      <View style={styles.content}>
        {/* Animated cosmic vortex logo */}
        <LogoBadge />

        {/* "VORTREXYN" — letters drop in from the top */}
        <View style={styles.wordRow}>
          {TITLE.split("").map((l, i) => (
            <DropLetter key={i} letter={l} color={TITLE_COLORS[i]} delay={500 + i * 95} />
          ))}
        </View>

        {/* "HANGMAN" — letters bounce in */}
        <View style={[styles.wordRow, { marginTop: 8 }]}>
          {HANGMAN.split("").map((l, i) => (
            <BounceLetter key={i} letter={l} color={HANGMAN_COLORS[i]} delay={1450 + i * 100} />
          ))}
        </View>
      </View>

      {/* Decorative translucent circles in the corners */}
      <View style={[styles.deco, { width: 280, height: 280, top: -80, right: -70 }]} />
      <View style={[styles.deco, { width: 200, height: 200, bottom: -50, left: -60 }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  content:   { alignItems: "center", zIndex: 10 },

  // Badge wrapper
  badgeWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  glowRing: {
    position: "absolute",
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2.5,
    borderColor: "#4CC9F0",
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  arcLayer: {
    position: "absolute",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  innerDisc: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0A001C",
  },
  vContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  // Letter rows
  wordRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap", paddingHorizontal: 10 },
  dropLetter: {
    fontSize: 40,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  bounceLetter: {
    fontSize: 30,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 5,
  },

  // Corner decoration circles
  deco: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
