/**
 * components/LogoBadge.tsx
 *
 * Animated "cosmic vortex" logo badge used on every authenticated screen.
 *
 * Visual structure (front to back):
 *   1. Outer glow ring  — pulses in scale and cycles through cyan → purple → pink.
 *   2. Arc 1 (outermost) — large cyan dashed arc, rotates clockwise slowly (3.6 s/rev).
 *   3. Arc 2 (middle)   — purple + orange dashed arcs, counter-clockwise (2.6 s/rev).
 *   4. Arc 3 (innermost)— pink dashed arc, clockwise fast (1.8 s/rev).
 *   5. Dark inner disc  — hides the arc centres to create the "ring" illusion.
 *   6. V letter         — gradient V shape (gold → orange → pink) that breathes in scale.
 *
 * Animations:
 *   popAnim   — spring pop-in on mount (scale 0 → 1).
 *   pulseAnim — continuous outer ring scale pulse (0.9 ↔ 1.14).
 *   arc1Spin  — continuous CW rotation for Arc 1.
 *   arc2Spin  — continuous CCW rotation for Arc 2.
 *   arc3Spin  — continuous CW rotation for Arc 3.
 *   vPulse    — gentle breathe for the V letter (0.94 ↔ 1.08).
 *   glowColor — colour-cycles the outer ring through cyan → purple → pink.
 *
 * Size prop:
 *   "large" (default) → full 140×140 px.
 *   "small"           → scaled to 72% (≈ 100×100 px) for use beside the AppTitle.
 *
 * SVG gradient IDs:
 *   React Native SVG requires every gradient `id` to be unique per component
 *   instance.  `useId()` generates a React-unique ID and we sanitise the colons
 *   it may contain (`:r0:` → `r0`) because SVG IDs cannot contain colons.
 */

import React, { useEffect, useId, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
} from "react-native-svg";

interface LogoBadgeProps {
  /** Controls the rendered size.  "small" scales to 72% of the base 140 px. */
  size?: "large" | "small";
}

/**
 * LogoBadge
 *
 * Fully self-contained animated logo.  All animations are started in a single
 * `useEffect` on mount and run indefinitely until the component unmounts.
 */
export function LogoBadge({ size = "large" }: LogoBadgeProps) {
  /**
   * Generate a unique ID for the SVG gradient so multiple LogoBadge instances
   * on the same screen don't share the same gradient reference and paint incorrectly.
   */
  const uid     = useId().replace(/:/g, "");
  const gradId  = `vg_${uid}`;

  /** Scale factor applied to the whole badge wrapper. */
  const scale   = size === "large" ? 1 : 0.72;
  const SVG     = 140; // SVG viewBox size (px)
  const CX      = 70;  // Centre point of all circles

  // ── Animated values ──────────────────────────────────────────────────────
  const popAnim   = useRef(new Animated.Value(0)).current; // mount pop: 0 → 1
  const pulseAnim = useRef(new Animated.Value(1)).current; // outer ring scale
  const arc1Spin  = useRef(new Animated.Value(0)).current; // CW rotation (0→1 maps to 0→360°)
  const arc2Spin  = useRef(new Animated.Value(0)).current; // CCW rotation (0→-1 maps to 0→-360°)
  const arc3Spin  = useRef(new Animated.Value(0)).current; // CW rotation fast
  const vPulse    = useRef(new Animated.Value(1)).current; // V letter breathe
  const glowColor = useRef(new Animated.Value(0)).current; // ring colour cycle (0→1)

  useEffect(() => {
    // Pop in on mount — spring gives it a satisfying elastic feel.
    Animated.spring(popAnim, {
      toValue: 1, useNativeDriver: false, tension: 60, friction: 6, delay: 80,
    }).start();

    // Outer ring pulses continuously between 0.9× and 1.14× scale.
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.14, duration: 800, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 0.9,  duration: 800, useNativeDriver: false }),
    ])).start();

    // Arc 1 — outermost, cyan, rotates clockwise once every 3.6 s.
    Animated.loop(Animated.timing(arc1Spin, { toValue: 1,  duration: 3600, useNativeDriver: false })).start();
    // Arc 2 — middle, purple/orange, counter-clockwise once every 2.6 s.
    Animated.loop(Animated.timing(arc2Spin, { toValue: -1, duration: 2600, useNativeDriver: false })).start();
    // Arc 3 — innermost, pink, clockwise once every 1.8 s (fastest).
    Animated.loop(Animated.timing(arc3Spin, { toValue: 1,  duration: 1800, useNativeDriver: false })).start();

    // V letter breathes between 0.94× and 1.08× scale continuously.
    Animated.loop(Animated.sequence([
      Animated.timing(vPulse, { toValue: 1.08, duration: 900, useNativeDriver: false }),
      Animated.timing(vPulse, { toValue: 0.94, duration: 900, useNativeDriver: false }),
    ])).start();

    // Colour cycle: drives `ringColor` interpolation (cyan → purple → pink → cyan).
    Animated.loop(Animated.timing(glowColor, { toValue: 1, duration: 3000, useNativeDriver: false })).start();
  }, []);

  // Map rotation Animated values to CSS-degree strings for `transform: rotate`.
  const spin1 = arc1Spin.interpolate({ inputRange: [0, 1],  outputRange: ["0deg",    "360deg"] });
  const spin2 = arc2Spin.interpolate({ inputRange: [-1, 0], outputRange: ["-360deg", "0deg"]   });
  const spin3 = arc3Spin.interpolate({ inputRange: [0, 1],  outputRange: ["0deg",    "360deg"] });

  /** Interpolated colour that cycles: cyan → purple → pink → cyan */
  const ringColor = glowColor.interpolate({
    inputRange:  [0, 0.33, 0.66, 1],
    outputRange: ["#4CC9F0", "#C77DFF", "#FF3CAC", "#4CC9F0"],
  });

  return (
    // Outer wrapper: apply the mount pop-in scale and the "small" size factor.
    <Animated.View style={[styles.wrapper, { transform: [{ scale: popAnim }, { scale }] }]}>

      {/* Outer glow ring — colour-cycles and pulses in scale */}
      <Animated.View style={[styles.glowRing, {
        borderColor: ringColor,
        shadowColor: ringColor,
        transform: [{ scale: pulseAnim }],
      }]} />

      {/* Arc 1 — outermost cyan dashed circle, rotates clockwise */}
      <Animated.View style={[styles.arcLayer, { transform: [{ rotate: spin1 }] }]}>
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          {/* strokeDasharray creates the "broken arc" look — 274 on, 91 off */}
          <Circle cx={CX} cy={CX} r={58}
            fill="none" stroke="#4CC9F0" strokeWidth={5}
            strokeDasharray="274 91" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Arc 2 — middle purple arc (counter-clockwise) + small orange accent */}
      <Animated.View style={[styles.arcLayer, { transform: [{ rotate: spin2 }] }]}>
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          <Circle cx={CX} cy={CX} r={44}
            fill="none" stroke="#C77DFF" strokeWidth={5}
            strokeDasharray="184 92" strokeLinecap="round" />
          {/* Small orange accent arc on the same circle, offset 150° */}
          <Circle cx={CX} cy={CX} r={44}
            fill="none" stroke="#FF6B35" strokeWidth={3}
            strokeDasharray="69 207" strokeDashoffset="150" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Arc 3 — innermost pink arc, fastest clockwise */}
      <Animated.View style={[styles.arcLayer, { transform: [{ rotate: spin3 }] }]}>
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          <Circle cx={CX} cy={CX} r={30}
            fill="none" stroke="#FF3CAC" strokeWidth={5}
            strokeDasharray="94 94" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* Dark inner disc — covers the arc endpoints to create clean ring shapes */}
      <View style={styles.innerDisc} />

      {/* V letter — gradient fill, breathes in and out */}
      <Animated.View style={[styles.vContainer, { transform: [{ scale: vPulse }] }]}>
        <Svg width={82} height={72} viewBox="0 0 82 72">
          <Defs>
            {/* Vertical gradient: gold top → orange mid → pink bottom */}
            <SvgGrad id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor="#FFD93D" />
              <Stop offset="0.5" stopColor="#FF6B35" />
              <Stop offset="1"   stopColor="#FF3CAC" />
            </SvgGrad>
          </Defs>
          {/* Shadow / depth layer — dark offset behind the main V */}
          <Path d="M 6 6 L 41 66 L 76 6"
            stroke="#1A0040" strokeWidth={18}
            strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
          {/* Main V path with gradient stroke */}
          <Path d="M 6 6 L 41 66 L 76 6"
            stroke={`url(#${gradId})`} strokeWidth={14}
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Shine / highlight layer — white with low opacity */}
          <Path d="M 6 6 L 41 66 L 76 6"
            stroke="#FFFFFF" strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.45} />
          {/* Gold star tips at the two upper ends of the V */}
          <Circle cx={6}  cy={6}  r={5} fill="#FFD93D" />
          <Circle cx={76} cy={6}  r={5} fill="#FFD93D" />
          {/* Small pink diamond gem at the bottom tip of the V */}
          <Path d="M 37 66 L 41 74 L 45 66 Z" fill="#FF3CAC" />
        </Svg>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#0A001C", // matches the dark app background
  },
  vContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
