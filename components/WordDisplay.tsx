/**
 * components/WordDisplay.tsx
 *
 * Animated letter-tile word display for VORTREXYN Hangman.
 *
 * Each letter in the secret word is rendered as a `LetterTile` — a cartoon
 * 3D key identical in style to `LetterKeyboard`.  Unrevealed tiles show an
 * underscore "_" and glow subtly to invite interaction.  Revealed tiles show
 * the letter with a press-down animation.
 *
 * Layout strategy:
 *   All tiles try to fit in a single row.  `tileW` is calculated from the
 *   available screen width, then clamped between MIN_W (22 px) and MAX_W (52 px).
 *   If the word is so long that `rawW` would fall below MIN_W (very rare in
 *   practice — only extreme-length words), `doWrap = true` and tiles wrap to
 *   a second row.
 *
 * LetterTile animations (three independent effects):
 *
 *   1. Press animation (liftAnim) — fires each time `revealed` becomes true.
 *      The tile briefly sinks down (liftAnim → 0) then springs back up,
 *      simulating a key press.  The index-based delay (60 ms × index) staggers
 *      the animation when all letters reveal at once (e.g. on loss).
 *
 *   2. Win bounce (bounceAnim) — fires when `won` becomes true.
 *      Each tile bounces up 10 px and back 3 times with a staggered delay
 *      (70 ms × index) for a ripple effect across the word.
 *
 *   3. Glow pulse (glowAnim) — runs continuously while the tile is unrevealed.
 *      The border opacity pulses between 35% and 100%, making the blank tiles
 *      feel alive and slightly "calling" to the player.
 *      Stopped (and reset to 0) when the tile is revealed.
 *
 * Tile colours per state:
 *   Unrevealed         → near-transparent face, accent-coloured pulsing border
 *   Revealed (playing) → warm cream face (#FEFCE8), amber shadow, dark border
 *   Revealed (won)     → golden yellow face (#FFD93D)
 *   Revealed (lost)    → red face (#FF6B6B) — shows the letters the player missed
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SW } = Dimensions.get("window");
const PADDING  = 44;   // total horizontal padding on the game screen
const GAP      = 5;    // px gap between tiles
const MAX_W    = 52;   // maximum tile width (px)
const MAX_H    = 58;   // maximum tile height (px)
const MIN_W    = 22;   // below this width, allow tiles to wrap to a second row
const DEPTH    = 4;    // 3D shadow depth (px)

/** Props for a single letter tile. */
interface TileProps {
  letter: string;
  /** True when the letter has been guessed (or the game is lost and all letters reveal). */
  revealed: boolean;
  /** True when the game is lost AND this specific letter was never guessed. */
  lost: boolean;
  /** Index of this tile in the word — used to stagger animations. */
  index: number;
  /** True when the game is won — triggers the win bounce animation. */
  won: boolean;
  /** Difficulty accent colour used for the unrevealed tile border glow. */
  accentColor: string;
  /** Calculated tile width (px). */
  tileW: number;
  /** Calculated tile height (px). */
  tileH: number;
}

/**
 * LetterTile
 *
 * Renders a single letter tile with three independent animations:
 *   - Press-down on reveal
 *   - Bounce on win
 *   - Glow pulse while unrevealed
 */
function LetterTile({ letter, revealed, lost, index, won, accentColor, tileW, tileH }: TileProps) {
  /**
   * liftAnim — 3D depth simulation.
   * Value represents how many px the key face is "lifted" above the shadow.
   * At rest: liftAnim = DEPTH → face sits at the top (translateY = 0).
   * Pressed: liftAnim = 0    → face sinks to the bottom (translateY = DEPTH).
   */
  const liftAnim   = useRef(new Animated.Value(DEPTH)).current;
  /**
   * bounceAnim — vertical bounce on win.
   * Negative translateY moves the tile upward.
   */
  const bounceAnim = useRef(new Animated.Value(0)).current;
  /**
   * glowAnim — border opacity pulse while unrevealed.
   * Drives the `borderOpacity` interpolation below.
   */
  const glowAnim   = useRef(new Animated.Value(0)).current;

  /**
   * Press-down animation on reveal.
   * Fires when `revealed` transitions false → true.
   * The `index * 60 ms` delay staggers reveals when multiple tiles appear at once.
   */
  useEffect(() => {
    if (revealed) {
      Animated.sequence([
        Animated.delay(index * 60),
        // Sink the face down.
        Animated.timing(liftAnim, { toValue: 0, duration: 80, useNativeDriver: false }),
        // Spring back up with a small bounce.
        Animated.spring(liftAnim, { toValue: DEPTH, useNativeDriver: false, tension: 220, friction: 7 }),
      ]).start();
    } else {
      // Reset the lift when a new game starts.
      liftAnim.setValue(DEPTH);
    }
  }, [revealed]);

  /**
   * Win-bounce animation.
   * Fires once when `won` becomes true.
   * Runs 3 iterations of a bounceup/down sequence with staggered start times.
   */
  useEffect(() => {
    if (won) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 70),         // stagger start per letter
          Animated.timing(bounceAnim, { toValue: -10, duration: 200, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0,   duration: 200, useNativeDriver: true }),
        ]),
        { iterations: 3 }                      // bounce 3 times then stop
      ).start();
    }
  }, [won]);

  /**
   * Glow pulse while the tile is unrevealed.
   * Starts a looping opacity animation.  Stops and resets to 0 when revealed,
   * so the glow doesn't show after the letter is guessed.
   */
  useEffect(() => {
    if (!revealed) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1100, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1100, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop(); // clean up on reveal or unmount
    }
    glowAnim.setValue(0); // reset glow immediately on reveal
  }, [revealed]);

  // ── Derived style values ────────────────────────────────────────────────

  /** Font size scales with tile width, minimum 11 px. */
  const fontSize = Math.max(11, Math.round(tileW * 0.48));

  /** Key face colour: transparent when unrevealed, colour-coded on reveal. */
  const faceColor    = revealed ? (lost ? "#FF6B6B" : won ? "#FFD93D" : "#FEFCE8") : "rgba(255,255,255,0.06)";

  /** Shadow / depth layer colour. */
  const shadowColor  = revealed ? (lost ? "#991B1B" : won ? "#B45309" : "#92400E") : "rgba(0,0,0,0.5)";

  /** Border colour: accent-coloured when unrevealed (matches difficulty theme). */
  const borderColor  = revealed ? (lost ? "#7F1D1D" : "#1C1917") : accentColor;

  /** Animated border opacity — pulsed by glowAnim while unrevealed. */
  const borderOpacity = revealed ? 1 : glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  /** Letter text colour. */
  const letterColor  = lost ? "#7F1D1D" : won ? "#78350F" : "#1C1917";

  return (
    // Outer bounce wrapper — driven by bounceAnim on win.
    <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
      {/* Shadow/depth layer — stays fixed in place */}
      <Animated.View
        style={[
          styles.shadowBlock,
          { width: tileW, height: tileH + DEPTH, backgroundColor: shadowColor, borderColor, opacity: borderOpacity },
        ]}
      >
        {/* Raised face — animates translateY on press */}
        <Animated.View
          style={[
            styles.face,
            {
              width: tileW, height: tileH, backgroundColor: faceColor, borderColor,
              transform: [{ translateY: liftAnim.interpolate({ inputRange: [0, DEPTH], outputRange: [DEPTH, 0] }) }],
            },
          ]}
        >
          {revealed ? (
            // Show the actual letter once guessed (or on loss/win reveal).
            <Text style={[styles.letter, { color: letterColor, fontSize }]}>{letter}</Text>
          ) : (
            // Show a placeholder underscore for unguessed letters.
            <Text style={[styles.placeholder, { fontSize: fontSize - 2 }]}>_</Text>
          )}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

/** Props for the WordDisplay container. */
interface Props {
  /** The secret word (uppercase string). */
  word: string;
  /** Set of letters the player has guessed so far. */
  guessed: Set<string>;
  /** Current game status — drives which tiles reveal and their colours. */
  status: "playing" | "won" | "lost";
  /** Difficulty-theme accent colour for unrevealed tile border glow. */
  accentColor?: string;
}

/**
 * WordDisplay
 *
 * Calculates tile dimensions to fit the word on screen, then renders one
 * `LetterTile` per character.
 *
 * Tile sizing maths:
 *   availW = screenWidth − padding
 *   rawW   = (availW − gaps) / letterCount
 *   tileW  = clamp(rawW, MIN_W, MAX_W)
 *   tileH  = proportional to tileW (maintains aspect ratio)
 *   doWrap = rawW < MIN_W (only for very long words)
 */
export function WordDisplay({ word, guessed, status, accentColor = "#7C3AED" }: Props) {
  const lost = status === "lost";
  const won  = status === "won";
  const len  = word.length;

  const availW  = SW - PADDING;
  const rawW    = Math.floor((availW - (len - 1) * GAP) / len);
  const tileW   = Math.min(MAX_W, Math.max(MIN_W, rawW));
  const tileH   = Math.round(tileW * (MAX_H / MAX_W)); // preserve aspect ratio
  const doWrap  = rawW < MIN_W; // enable wrap only for extreme-length words

  return (
    <View style={[styles.container, doWrap && styles.containerWrap]}>
      {word.split("").map((letter, idx) => (
        <LetterTile
          key={idx}
          letter={letter}
          index={idx}
          // Reveal the tile if: the letter was guessed, OR the game was lost (show all).
          revealed={guessed.has(letter) || lost}
          // Mark as "lost" only for letters that were never guessed when the game ended.
          lost={lost && !guessed.has(letter)}
          won={won}
          accentColor={accentColor}
          tileW={tileW}
          tileH={tileH}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",    // single row by default
    justifyContent: "center",
    alignItems: "flex-end",
    paddingVertical: 6,
    gap: GAP,
  },
  containerWrap: {
    flexWrap: "wrap",      // allow wrapping for very long words
  },
  shadowBlock: {
    borderRadius: 10,
    borderWidth: 2.5,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  face: {
    borderRadius: 8,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  letter: {
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  placeholder: {
    fontWeight: "900",
    color: "rgba(255,255,255,0.20)",
  },
});
