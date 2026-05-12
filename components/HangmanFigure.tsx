/**
 * components/HangmanFigure.tsx
 *
 * Animated SVG hangman drawing for VORTREXYN Hangman.
 *
 * Architecture — layered SVG approach:
 * ─────────────────────────────────────
 * Each body part lives in its own SVG layer (220×230 px), positioned
 * absolutely on top of a single static gallows SVG.  The layers are wrapped
 * in `Animated.View` (not AnimatedG) because `AnimatedG` does not reliably
 * support the `opacity` prop on all Expo/RN versions.  Using `Animated.View`
 * with an animated `opacity` style is 100% reliable across platforms.
 *
 * `FadePart` component:
 *   Wraps one body-part SVG layer.  When `visible` changes from false → true,
 *   it spring-animates opacity from 0 → 1 (part appears).
 *   When visible changes true → false (newGame / reset), it animates back to 0.
 *
 * Drawing order (6 wrong guesses = full hangman):
 *   Layer 0 — Gallows     (always visible, no FadePart)
 *   Layer 1 — Rope + Head (wrongCount >= 1)
 *   Layer 2 — Body        (wrongCount >= 2)
 *   Layer 3 — Left Arm    (wrongCount >= 3)
 *   Layer 4 — Right Arm   (wrongCount >= 4)
 *   Layer 5 — Left Leg    (wrongCount >= 5)
 *   Layer 6 — Right Leg   (wrongCount >= 6)  ← game over
 *
 * Expressive face system:
 *   The face expression changes based on how many wrong guesses have been made:
 *     0–2 wrongs (normal)  → straight eyebrows, small dot eyes, gentle smile
 *     3   wrongs (worried) → angled eyebrows, dot eyes, slight frown
 *     4–5 wrongs (scared)  → wide eyes with highlights, open-mouth grimace, sweat drops
 *     6   wrongs (dead)    → X eyes, turned-down mouth
 *
 * Body colour also changes with danger level:
 *   Low  (< 4 wrong) → #A78BFA (purple)
 *   High (≥ 4 wrong) → #FB923C (orange)
 *   Dead (= 6 wrong) → #EF4444 (red)
 *
 * The `key={word}` prop on HangmanFigure in game.tsx forces a full re-mount
 * (and thus animation reset) whenever a new word starts.
 */

import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Svg, { Line, Circle, Path, G, Ellipse, Rect } from "react-native-svg";

interface Props {
  /** Number of incorrect letter guesses so far (0–6). */
  wrongCount: number;
  /** Accent colour for the gallows glow — matches the current difficulty theme. */
  accentColor?: string;
}

/**
 * FadePart
 *
 * Wraps a body-part SVG layer and animates its opacity when `visible` changes.
 * `pointerEvents="none"` ensures invisible layers never intercept touches.
 *
 * Why spring?  A spring (tension=70, friction=8) gives the part a satisfying
 * "pop in" feel rather than a mechanical linear fade.
 */
function FadePart({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  // Initialise to the correct opacity so there's no flash on mount.
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(opacity, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 8,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      {children}
    </Animated.View>
  );
}

/**
 * HangmanFigure
 *
 * Renders a 220×230 stacked SVG drawing that progressively reveals body parts
 * as `wrongCount` increases from 0 to 6.
 *
 * Props:
 *   wrongCount   — drives which layers are visible and the face expression.
 *   accentColor  — currently unused in the figure body but kept for future use.
 */
export function HangmanFigure({ wrongCount, accentColor = "#7C3AED" }: Props) {
  // Colour constants derived from wrongCount.
  const gallows = "#9333EA";       // gallows structure — always the same purple
  const rope    = "#C4B5FD";       // rope — light lavender
  // Body colour escalates from purple → orange → red as danger increases.
  const body    = wrongCount >= 6 ? "#EF4444" : wrongCount >= 4 ? "#FB923C" : "#A78BFA";
  const face    = "#FEFCE8";       // face fill — warm near-white
  const swBody  = 5;               // strokeWidth for limbs

  // Convenience booleans for the face-expression conditions.
  const dead    = wrongCount >= 6;
  const scared  = wrongCount >= 4;
  const worried = wrongCount >= 3;

  const W = 220; // total canvas width
  const H = 230; // total canvas height

  return (
    <View style={{ width: W, height: H }}>

      {/* ── Layer 0: Gallows — always rendered, no animation ── */}
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
        {/* Base platform */}
        <Rect x="15" y="205" width="160" height="10" rx="5" fill={gallows} />
        {/* Vertical post */}
        <Rect x="56" y="18" width="10" height="192" rx="5" fill={gallows} />
        {/* Horizontal beam */}
        <Rect x="56" y="18" width="70" height="8" rx="4" fill={gallows} />
        {/* Diagonal brace for structural detail */}
        <Line x1="66" y1="40" x2="100" y2="18" stroke={gallows} strokeWidth={5} strokeLinecap="round" />
      </Svg>

      {/* ── Layer 1: Rope + Head — appears on wrongCount >= 1 ── */}
      <FadePart visible={wrongCount >= 1}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Short rope connecting beam to head */}
          <Line x1="116" y1="26" x2="116" y2="45" stroke={rope} strokeWidth={3} strokeLinecap="round" />

          {/* Head circle — colour shifts with danger level */}
          <Circle cx={116} cy={58} r={14} fill={body} stroke={face} strokeWidth={2} />

          {/* ── Eyebrows ── */}
          {!dead && worried ? (
            // Worried: angled inward to show distress
            <G>
              <Line x1="108" y1="53" x2="113" y2="55" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
              <Line x1="119" y1="55" x2="124" y2="53" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
            </G>
          ) : !dead ? (
            // Normal: flat horizontal brows
            <G>
              <Line x1="108" y1="53" x2="113" y2="53" stroke="#1C1917" strokeWidth={2} strokeLinecap="round" />
              <Line x1="119" y1="53" x2="124" y2="53" stroke="#1C1917" strokeWidth={2} strokeLinecap="round" />
            </G>
          ) : null /* Dead: no brows */ }

          {/* ── Eyes ── */}
          {dead ? (
            // X eyes (deceased)
            <G>
              <Line x1="109" y1="56" x2="114" y2="61" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
              <Line x1="114" y1="56" x2="109" y2="61" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
              <Line x1="118" y1="56" x2="123" y2="61" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
              <Line x1="123" y1="56" x2="118" y2="61" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
            </G>
          ) : scared ? (
            // Wide open eyes with light reflection dots — showing terror
            <G>
              <Circle cx={111} cy={58} r={3.5} fill="#1C1917" />
              <Circle cx={121} cy={58} r={3.5} fill="#1C1917" />
              <Circle cx={112} cy={57} r={1} fill={face} /> {/* left eye highlight */}
              <Circle cx={122} cy={57} r={1} fill={face} /> {/* right eye highlight */}
            </G>
          ) : (
            // Normal: small dot eyes
            <G>
              <Circle cx={111} cy={58} r={2.5} fill="#1C1917" />
              <Circle cx={121} cy={58} r={2.5} fill="#1C1917" />
            </G>
          )}

          {/* ── Mouth ── */}
          {dead ? (
            // Upward arc = sad inverted smile for dead state
            <Path d="M 110 68 Q 116 63 122 68" stroke="#1C1917" strokeWidth={2} fill="none" strokeLinecap="round" />
          ) : scared ? (
            // Wide open grimace (downward arc, filled) — extremely scared
            <Path d="M 110 66 Q 116 72 122 66" stroke="#1C1917" strokeWidth={2} fill="#1C1917" strokeLinecap="round" />
          ) : worried ? (
            // Slight downward arc — worried expression
            <Path d="M 110 65 Q 116 69 122 65" stroke="#1C1917" strokeWidth={2} fill="none" strokeLinecap="round" />
          ) : (
            // Normal: gentle upward smile
            <Path d="M 110 64 Q 116 68 122 64" stroke="#1C1917" strokeWidth={2} fill="none" strokeLinecap="round" />
          )}

          {/* ── Sweat drops — only when scared but not yet dead ── */}
          {scared && !dead && (
            <G>
              {/* Right sweat drop */}
              <Path d="M 128 49 Q 132 53 128 58 Q 124 53 128 49" fill="#60A5FA" opacity={0.9} />
              {/* Left sweat drop */}
              <Path d="M 104 51 Q 108 55 104 60 Q 100 55 104 51" fill="#60A5FA" opacity={0.9} />
            </G>
          )}
        </Svg>
      </FadePart>

      {/* ── Layer 2: Body (torso) — wrongCount >= 2 ── */}
      <FadePart visible={wrongCount >= 2}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Rounded rectangle torso connecting head to hips */}
          <Rect x="110" y="72" width="12" height="58" rx="6" fill={body} />
        </Svg>
      </FadePart>

      {/* ── Layer 3: Left Arm — wrongCount >= 3 ── */}
      <FadePart visible={wrongCount >= 3}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Arm line from shoulder to hand position */}
          <Line x1="116" y1="88" x2="88" y2="116" stroke={body} strokeWidth={swBody} strokeLinecap="round" />
          {/* Round hand */}
          <Circle cx={85} cy={119} r={6} fill={body} stroke={face} strokeWidth={1.5} />
        </Svg>
      </FadePart>

      {/* ── Layer 4: Right Arm — wrongCount >= 4 ── */}
      <FadePart visible={wrongCount >= 4}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Line x1="116" y1="88" x2="144" y2="116" stroke={body} strokeWidth={swBody} strokeLinecap="round" />
          <Circle cx={147} cy={119} r={6} fill={body} stroke={face} strokeWidth={1.5} />
        </Svg>
      </FadePart>

      {/* ── Layer 5: Left Leg — wrongCount >= 5 ── */}
      <FadePart visible={wrongCount >= 5}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Leg line from hip to foot */}
          <Line x1="116" y1="130" x2="90" y2="170" stroke={body} strokeWidth={swBody} strokeLinecap="round" />
          {/* Oval foot */}
          <Ellipse cx={86} cy={174} rx={9} ry={6} fill={body} stroke={face} strokeWidth={1.5} />
        </Svg>
      </FadePart>

      {/* ── Layer 6: Right Leg — wrongCount >= 6 (GAME OVER) ── */}
      <FadePart visible={wrongCount >= 6}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Line x1="116" y1="130" x2="142" y2="170" stroke={body} strokeWidth={swBody} strokeLinecap="round" />
          <Ellipse cx={146} cy={174} rx={9} ry={6} fill={body} stroke={face} strokeWidth={1.5} />
        </Svg>
      </FadePart>

    </View>
  );
}
