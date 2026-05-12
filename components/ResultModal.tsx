/**
 * components/ResultModal.tsx
 *
 * Win/loss result modal for VORTREXYN Hangman.
 *
 * Shown 600 ms after the game ends (delay set in game.tsx) so the hangman
 * figure has time to complete its final animation before the overlay appears.
 *
 * Visual design:
 *   - White rounded card springs in from scale 0 using an Animated.spring.
 *   - On win: floating star emojis (⭐ 🌟 ✨ 💫) rise upward in a loop.
 *   - Result emoji (🎉 or 😢), randomised message, word reveal, hint, stats.
 *   - CTA button: "Play Next" (won) or "Play Again" (lost).
 *
 * Message randomisation:
 *   WON_MESSAGES  — 6 positive messages, cycled by `wins % length`.
 *   LOST_MESSAGES — 5 encouraging messages, cycled by `losses % length`.
 *   Using modulo keeps the message varied without repeating too soon.
 *
 * FloatingStar animation:
 *   Each star starts at `y = 0` (bottom 40% of screen), rises 120 px, fades in
 *   then out, then resets instantly and loops — creating a continuous upward
 *   particle stream.  Stars are only rendered when `won` is true.
 *
 * Haptic feedback:
 *   Success notification when won, error notification when lost.
 *   This adds a physical dimension to the result and is a strong game-feel
 *   cue on real devices.
 */

import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, TouchableWithoutFeedback,
} from "react-native";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";

interface Props {
  /** Whether the modal is currently visible. */
  visible: boolean;
  /** Called when the player dismisses the modal manually. */
  onClose: () => void;
}

/** Emoji pool for the floating particle animation on win. */
const STARS = ["⭐", "🌟", "✨", "💫", "⭐", "🌟", "✨"];

/** Positive win messages — cycled by wins count so they vary. */
const WON_MESSAGES = [
  "AMAZING! 🎉", "BRILLIANT! 🧠", "YOU ROCK! 🤘", "FANTASTIC! 🚀", "GENIUS! 🦄", "SUPER STAR! ⭐"
];

/** Encouraging loss messages — cycled by losses count. */
const LOST_MESSAGES = [
  "SO CLOSE! 😅", "TRY AGAIN! 💪", "KEEP GOING! 🌈", "DON'T GIVE UP! 🦁", "NEXT TIME! 🌟"
];

/**
 * FloatingStar
 *
 * A single animated star particle that floats upward and fades out, then loops.
 *
 * Animation sequence (looped):
 *   1. Wait `delay` ms.
 *   2. In parallel: rise 120 px (translateY 0 → -120) and fade in then out.
 *   3. Instantly reset position and opacity to starting values.
 *   4. Repeat.
 *
 * `x` (horizontal offset) is randomised at creation time and stays constant
 * so the star always rises along the same vertical path — looks intentional
 * rather than chaotic.
 */
function FloatingStar({ emoji, delay }: { emoji: string; delay: number }) {
  const y       = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  // Random horizontal offset so stars spread across the screen.
  const x       = useRef(Math.random() * 280 - 140).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Rise 120 px over 2 seconds.
          Animated.timing(y, { toValue: -120, duration: 2000, useNativeDriver: true }),
          // Fade in (300 ms) then fade out (600 ms) after a 1000 ms hold.
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 600, delay: 1000, useNativeDriver: true }),
          ]),
        ]),
        // Instant reset — invisible so user doesn't see the snap back.
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={[styles.floatStar, { transform: [{ translateX: x }, { translateY: y }], opacity }]}
    >
      {emoji}
    </Animated.Text>
  );
}

/**
 * ResultModal
 *
 * Reads game state from `useGame()` so it always reflects the latest round.
 * The `scaleAnim` spring gives the card a satisfying pop-in feel.
 *
 * On visibility change:
 *   1. Resets `scaleAnim` to 0 (card is invisible).
 *   2. Springs it to 1 (card pops in).
 *   3. Fires the appropriate haptic notification.
 */
export function ResultModal({ visible, onClose }: Props) {
  const { status, word, emoji, hint, wins, losses, streak, newGame } = useGame();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const won = status === "won";

  useEffect(() => {
    if (visible) {
      // Reset then spring-in so the animation always plays fresh.
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }).start();
      // Haptic feedback — tactile cue matching the win/loss outcome.
      if (won) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [visible]);

  /**
   * Pick the result message from the appropriate pool.
   * Using modulo means the messages cycle (never run out) and aren't random
   * (consistent with the player's cumulative wins/losses count).
   */
  const message = won
    ? WON_MESSAGES[wins % WON_MESSAGES.length]
    : LOST_MESSAGES[losses % LOST_MESSAGES.length];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>

        {/* Floating star particles — only shown on win */}
        {won && STARS.map((s, i) => <FloatingStar key={i} emoji={s} delay={i * 250} />)}

        {/* Main result card — springs in from scale 0 */}
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Large result emoji */}
          <Text style={styles.resultEmoji}>{won ? "🎉" : "😢"}</Text>

          {/* Randomised result message — coloured by outcome */}
          <Text style={[styles.title, { color: won ? colors.accent : colors.danger }]}>
            {message}
          </Text>

          {/* Word emoji and the revealed secret word */}
          <Text style={styles.wordEmoji}>{emoji}</Text>
          <Text style={styles.wordLabel}>{won ? "You got it!" : "The word was:"}</Text>
          <Text style={styles.word}>{word}</Text>

          {/* Word hint to inform or confirm the player's guess */}
          <Text style={styles.hint}>💡 {hint}</Text>

          {/* Session stats — wins, streak, losses */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{wins}</Text>
              <Text style={styles.statLabel}>Wins 🏆</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{streak}</Text>
              <Text style={styles.statLabel}>Streak 🔥</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{losses}</Text>
              <Text style={styles.statLabel}>Oops 😬</Text>
            </View>
          </View>

          {/* CTA button — starts the next game and dismisses the modal */}
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: won ? colors.accent : colors.primary }]}
            onPress={() => { newGame(); onClose(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.playBtnText}>{won ? "▶  Play Next" : "↺  Play Again"}</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(60,0,120,0.75)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  floatStar: {
    position: "absolute",
    bottom: "40%",
    fontSize: 26,
  },
  card: {
    width: "82%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  resultEmoji: {
    fontSize: 52,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: "Inter_700Bold",
  },
  wordEmoji: {
    fontSize: 44,
    marginBottom: 4,
  },
  wordLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
    fontFamily: "Inter_400Regular",
  },
  word: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 6,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 20,
  },
  stat: {
    alignItems: "center",
  },
  statNum: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  playBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  playBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
});
