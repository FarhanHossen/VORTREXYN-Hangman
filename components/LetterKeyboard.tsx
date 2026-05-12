/**
 * components/LetterKeyboard.tsx
 *
 * A-Z on-screen keyboard for the VORTREXYN Hangman game.
 *
 * Visual design — "cartoon 3D" key style:
 * ─────────────────────────────────────────
 * Each key is made of two Animated.View layers:
 *   1. `shadowBlock` — the bottom "base" layer, coloured like a shadow/depth.
 *   2. `keyFace`     — the top "raised" surface, animated up/down on press.
 *
 * When the player presses a key, `liftAnim` springs from LIFT (5 px) → 0,
 * making the key face appear to press down, then springs back to LIFT — giving
 * the satisfying "click" feel of a physical keyboard without any platform APIs.
 *
 * Key states:
 *   "unused"  → warm cream white face (#FEFCE8), amber shadow, dark border.
 *   "correct" → green face (#4ADE80), dark green shadow.  Shows ✓ instead of letter.
 *   "wrong"   → grey face (#94A3B8, 45% opacity), slate shadow.  Letter is struck through.
 *
 * Keyboard layout (4 rows):
 *   Row 0: A B C D E F G
 *   Row 1: H I J K L M N
 *   Row 2: O P Q R S T U
 *   Row 3: V W X Y Z       (centred, shorter row)
 *
 * Key sizing:
 *   KEY_W is calculated from the screen width so all 7 keys fit in a row with
 *   a 5 px gap between them and 28 px total horizontal padding.
 *   KEY_H is slightly taller than KEY_W for better tap targets (min 50 px).
 *
 * Haptic feedback:
 *   On native platforms (not web), a "Medium" impact haptic fires when a key
 *   is pressed.  This is skipped on web where Haptics is unavailable.
 *
 * Loss / win display:
 *   - On loss (`disabled && !won`): all unguessed letters are shown as "wrong"
 *     (greyed out, struck through) to highlight which letters were never tried.
 *   - On win (`disabled && won`): unguessed letters stay "unused" (no strikethrough)
 *     because they were never wrong — the player solved it before needing them.
 */

import React, { useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";

const { width: SW } = Dimensions.get("window");

/** 26-letter keyboard split into 4 rows of 7, 7, 7, 5. */
const ROWS = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z"],
];

const GAP   = 5;                                      // px gap between keys
const KEY_W = Math.floor((SW - 28 - GAP * 6) / 7);  // width: fits 7 keys + 6 gaps + padding
const KEY_H = Math.min(KEY_W + 6, 50);               // height: slightly taller, capped at 50 px
const LIFT  = 5;                                      // 3D depth in px — how much keys are "raised"

interface Props {
  /** Set of letters the player has already pressed this round. */
  guessed: Set<string>;
  /** The secret word — used to determine if a guessed letter is "correct" or "wrong". */
  word: string;
  /** Called with the pressed letter when a key is tapped. */
  onLetter: (letter: string) => void;
  /** Disables the entire keyboard (game is won or lost). */
  disabled: boolean;
  /** True when the game ended in a win (affects how unguessed keys are displayed). */
  won?: boolean;
}

/**
 * Key
 *
 * A single letter key with a cartoon 3D press animation.
 *
 * State → visual mapping:
 *   "unused"  → cream white, enabled, shows the letter.
 *   "correct" → green, disabled, shows ✓.
 *   "wrong"   → grey, disabled, shows the letter with strikethrough, 45% opacity.
 */
function Key({
  letter, state, onPress,
}: {
  letter: string;
  state: "unused" | "correct" | "wrong";
  onPress: () => void;
}) {
  /**
   * liftAnim drives the "press" animation.
   * Value represents the amount of Y translation applied to the `keyFace`.
   * At rest: liftAnim = LIFT → keyFace.translateY = 0  (key is at the top).
   * Pressed: liftAnim = 0   → keyFace.translateY = LIFT (key sinks down).
   */
  const liftAnim = useRef(new Animated.Value(LIFT)).current;

  /**
   * handlePress
   * Fired when the key is tapped.
   * 1. Returns early if key is already used (double-tap guard).
   * 2. Fires haptic feedback on native.
   * 3. Animates the press-down then spring-back.
   * 4. Calls the `onPress` callback to register the guess.
   */
  function handlePress() {
    if (state !== "unused") return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      // Press down quickly.
      Animated.timing(liftAnim, { toValue: 0, duration: 70, useNativeDriver: false }),
      // Spring back with a slight bounce.
      Animated.spring(liftAnim, { toValue: LIFT, useNativeDriver: false, tension: 240, friction: 8 }),
    ]).start();
    onPress();
  }

  // ── Colour scheme per state ─────────────────────────────────────────────

  /** Key face (top surface) background colour. */
  const faceColor =
    state === "correct" ? "#4ADE80" :
    state === "wrong"   ? "#94A3B8" :
    "#FEFCE8";                         // warm cream — all unused keys

  /** Shadow / depth layer colour. */
  const shadowColor =
    state === "correct" ? "#15803D" :
    state === "wrong"   ? "#475569" :
    "#D97706";                         // amber — gives unused keys cartoon warmth

  /** Thick cartoon border colour. */
  const borderColor =
    state === "correct" ? "#14532D" :
    state === "wrong"   ? "#334155" :
    "#1C1917";                         // near-black outline

  /** Letter text colour. */
  const textColor =
    state === "correct" ? "#14532D" :
    state === "wrong"   ? "#1E293B" :
    "#1C1917";

  return (
    /* Outer block = shadow/base layer (stays stationary) */
    <Animated.View
      style={[
        styles.shadowBlock,
        {
          width: KEY_W,
          height: KEY_H + LIFT,
          backgroundColor: shadowColor,
          borderColor,
          opacity: state === "wrong" ? 0.45 : 1, // grey out wrong keys
        },
      ]}
    >
      {/* Raised face of the key — translates down on press */}
      <Animated.View
        style={[
          styles.keyFace,
          {
            width: KEY_W,
            height: KEY_H,
            backgroundColor: faceColor,
            borderColor,
            transform: [{
              translateY: liftAnim.interpolate({
                inputRange:  [0, LIFT],
                outputRange: [LIFT, 0], // when liftAnim is LIFT the face sits at top (translateY=0)
              }),
            }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchArea}
          onPress={handlePress}
          disabled={state !== "unused"} // only unused keys are tappable
          activeOpacity={1}             // visual feedback handled by liftAnim, not opacity
        >
          {state === "correct" ? (
            // Correct: show ✓ checkmark instead of the letter
            <Text style={[styles.label, { color: textColor, fontSize: 16 }]}>✓</Text>
          ) : state === "wrong" ? (
            // Wrong: show letter with strikethrough
            <Text style={[styles.label, { color: textColor, textDecorationLine: "line-through" }]}>{letter}</Text>
          ) : (
            // Unused: show the plain letter
            <Text style={[styles.label, { color: textColor }]}>{letter}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * LetterKeyboard
 *
 * Renders the full A–Z grid.
 * Determines each key's visual state from `guessed` + `word` and applies
 * special "all grey" logic when the game is lost (disabled && !won).
 */
export function LetterKeyboard({ guessed, word, onLetter, disabled, won }: Props) {
  /**
   * getState
   * Returns the display state for a letter:
   *   - Not yet guessed → "unused"
   *   - Guessed and in word → "correct"
   *   - Guessed and not in word → "wrong"
   */
  function getState(letter: string): "unused" | "correct" | "wrong" {
    if (!guessed.has(letter)) return "unused";
    return word.includes(letter) ? "correct" : "wrong";
  }

  return (
    <View style={styles.keyboard}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(letter => {
            /**
             * On loss (disabled && !won): show all unguessed keys as "wrong"
             * to visually grey out every unused letter — it highlights the missed
             * opportunities and makes the loss obvious.
             *
             * On win (disabled && won): keep unguessed keys as "unused" (no strikethrough)
             * because those letters were never tried — they weren't wrong, just unnecessary.
             */
            const state = (disabled && !won)
              ? (guessed.has(letter) ? getState(letter) : "wrong")
              : getState(letter);
            return (
              <Key
                key={letter}
                letter={letter}
                state={state}
                onPress={() => !disabled && onLetter(letter)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    paddingVertical: 8,
    gap: GAP,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: GAP,
  },

  /** The stationary depth/shadow behind each key. */
  shadowBlock: {
    borderRadius: 12,
    borderWidth: 2.5,
    justifyContent: "flex-start",
    overflow: "hidden",
  },

  /** The raised top surface that animates on press. */
  keyFace: {
    borderRadius: 10,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  /** Full-size tap area inside the face layer. */
  touchArea: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
