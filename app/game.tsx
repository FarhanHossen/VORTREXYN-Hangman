/**
 * app/game.tsx
 *
 * Main game screen for VORTREXYN Hangman.
 *
 * ── Layout (top → bottom) ────────────────────────────────────────────────
 *
 *  1. Header bar
 *       Left:  difficulty badge (emoji + label + level pill) + tier label + hearts row.
 *       Right: home button → navigates back to home tab.
 *
 *  2. Stats row
 *       Three chips showing cumulative wins 🏆, streak 🔥, losses 😬.
 *
 *  3. Hint card (glass card)
 *       Always shows the category label.
 *       TIER 1 hint (text): unlocked after 2 wrong guesses — player taps a button
 *         to reveal it, preventing accidental reveals.
 *       TIER 2 hint (emoji popup): unlocked on the last life (wrongCount ≥ MAX_WRONG−1).
 *         Tapping "🆘 Last Hint" opens a full-screen overlay with the word emoji,
 *         category, and hint text — a lifeline for kids who are truly stuck.
 *
 *  4. Hangman SVG figure card
 *       key={word} forces a full animation reset on each new word.
 *       A small "X/6" badge in the top-right corner of the card.
 *
 *  5. Word display card
 *       One tile per letter, unknown letters shown as "_".
 *
 *  6. Wrong-letters row
 *       Only rendered when wrongLetters.length > 0.
 *       Shows each incorrectly guessed letter in a red bubble so the player
 *       can see at a glance which letters they've already tried.
 *
 *  7. Keyboard card
 *       Full A–Z grid disabled once the game status is no longer "playing".
 *
 *  8. Next Level / Play Again button
 *       Rendered below the keyboard when status !== "playing".
 *       Bypasses the ResultModal for players who want to keep going immediately.
 *
 *  9. ResultModal (floating overlay, shown 600 ms after game ends)
 *
 * 10. Emoji popup overlay
 *       Rendered on top of everything when emojiPopup === true.
 *
 * ── Difficulty themes (DIFF_ACCENT) ─────────────────────────────────────
 *   Each difficulty gets its own `accent`, `border`, and `glow` triple:
 *     Easy    → green  (#22C55E)
 *     Medium  → blue   (#60A5FA)
 *     Hard    → orange (#FB923C)
 *     Extreme → purple (#D946EF)
 *     default → purple (#7C3AED)   ← used for free-play / category mode
 *
 * ── Star field ───────────────────────────────────────────────────────────
 *   30 white dot stars are randomly placed behind the content.
 *   Each star animates its own opacity independently (random duration, delay)
 *   so the background twinkles without any two stars being in sync.
 *   Stars are positioned using Math.random() at module load — they are the
 *   same for the lifetime of the module but change on a full app reload.
 *
 * ── Auth guard ───────────────────────────────────────────────────────────
 *   A useEffect redirects to /login if the auth check completes and there
 *   is no signed-in user and no guest session.
 *
 * ── State ────────────────────────────────────────────────────────────────
 *   showResult   — controls ResultModal visibility (set 600 ms after game ends).
 *   hintRevealed — true when the player has tapped "Tap for hint" (prevents auto-reveal).
 *   emojiPopup   — true when the last-life emoji overlay is open.
 *
 *   Both `hintRevealed` and `emojiPopup` reset whenever `word` changes
 *   (i.e. on every new game) so hints never carry over between rounds.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, Dimensions, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { HangmanFigure } from "@/components/HangmanFigure";
import { WordDisplay } from "@/components/WordDisplay";
import { LetterKeyboard } from "@/components/LetterKeyboard";
import { ResultModal } from "@/components/ResultModal";
import { MAX_WRONG, tierLabel } from "@/constants/words";

const { width: SW } = Dimensions.get("window");
const NUM_STARS = 30;

/* Accent palette keyed by difficulty — mirrors home screen DIFF_THEMES */
const DIFF_ACCENT: Record<string, { accent: string; border: string; glow: string }> = {
  Easy:    { accent: "#22C55E", border: "rgba(34,197,94,0.40)",   glow: "rgba(34,197,94,0.12)"   },
  Medium:  { accent: "#60A5FA", border: "rgba(96,165,250,0.40)",  glow: "rgba(96,165,250,0.12)"  },
  Hard:    { accent: "#FB923C", border: "rgba(251,146,60,0.40)",  glow: "rgba(251,146,60,0.12)"  },
  Extreme: { accent: "#D946EF", border: "rgba(217,70,239,0.40)",  glow: "rgba(217,70,239,0.12)"  },
  default: { accent: "#7C3AED", border: "rgba(124,58,237,0.40)",  glow: "rgba(124,58,237,0.12)"  },
};

const DIFF_EMOJI: Record<string, string> = {
  Easy: "🌟", Medium: "⚡", Hard: "🔥", Extreme: "💀",
};

const STARS = Array.from({ length: NUM_STARS }, (_, i) => ({
  id: i,
  x: Math.random() * SW,
  y: Math.random() * 900,
  size: 1 + Math.random() * 2.5,
  delay: Math.random() * 2200,
}));

function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(Math.random() * 0.5 + 0.15)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.05, duration: 1000 + Math.random() * 1400, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.85, duration: 1000 + Math.random() * 1400, useNativeDriver: false }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);
  return (
    <Animated.View style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: "#FFF", opacity,
    }} />
  );
}

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { word, hint, emoji, category, difficulty, level, guessed, wrongCount, status, wins, losses, streak, guessLetter, newGame } = useGame();
  const { user, loading: authLoading, isGuest } = useAuth();
  const [showResult, setShowResult] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [emojiPopup, setEmojiPopup] = useState(false);

  const theme = DIFF_ACCENT[difficulty] ?? DIFF_ACCENT.default;
  const diffEmoji = DIFF_EMOJI[difficulty] ?? "🎮";

  const currentTierLabel = difficulty ? tierLabel(level) : null;

  useEffect(() => {
    if (!authLoading && !user && !isGuest) router.replace("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (status !== "playing") {
      const t = setTimeout(() => setShowResult(true), 600);
      return () => clearTimeout(t);
    } else {
      setShowResult(false);
    }
  }, [status, word]);

  // Reset hints every new word
  useEffect(() => { setHintRevealed(false); setEmojiPopup(false); }, [word]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 60) : insets.top;
  const botPad = Math.max(insets.bottom, 8);
  const heartsLeft = MAX_WRONG - wrongCount;
  const wrongLetters = Array.from(guessed).filter(l => !word.includes(l));

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Cosmic background */}
      <LinearGradient
        colors={["#0A0A1E", "#150B30", "#0D0D2B"]}
        style={StyleSheet.absoluteFill}
      />
      {STARS.map(s => <Star key={s.id} {...s} />)}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {/* Difficulty + level badge */}
          <View style={[styles.diffBadge, { backgroundColor: theme.glow, borderColor: theme.border }]}>
            <Text style={styles.diffBadgeEmoji}>{diffEmoji}</Text>
            <Text style={[styles.diffBadgeLabel, { color: theme.accent }]}>
              {difficulty || "HANGMAN"}
            </Text>
            {difficulty ? (
              <Text style={[styles.levelPill, { color: theme.accent, borderColor: theme.border }]}>
                LVL {level}
              </Text>
            ) : null}
          </View>
          {/* Tier label beneath the badge */}
          {currentTierLabel ? (
            <Text style={[styles.tierLabel, { color: theme.accent }]}>{currentTierLabel}</Text>
          ) : null}
          {/* Hearts */}
          <View style={styles.hearts}>
            {Array(MAX_WRONG).fill(null).map((_, i) => (
              <Text key={i} style={[styles.heart, i >= heartsLeft && styles.heartLost]}>
                {i < heartsLeft ? "❤️" : "🖤"}
              </Text>
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/home")}
          style={[styles.homeBtn, { borderColor: theme.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="home" size={18} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { borderColor: "rgba(34,197,94,0.3)" }]}>
            <Text style={styles.statChipNum}>{wins}</Text>
            <Text style={styles.statChipEmoji}>🏆</Text>
          </View>
          <View style={[styles.statChip, { borderColor: "rgba(251,146,60,0.3)" }]}>
            <Text style={styles.statChipNum}>{streak}</Text>
            <Text style={styles.statChipEmoji}>🔥</Text>
          </View>
          <View style={[styles.statChip, { borderColor: "rgba(239,68,68,0.3)" }]}>
            <Text style={styles.statChipNum}>{losses}</Text>
            <Text style={styles.statChipEmoji}>😬</Text>
          </View>
        </View>

        {/* Hint card */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            style={styles.hintCard}
          >
            {/* Category — always visible */}
            <Text style={[styles.categoryLabel, { color: theme.accent }]}>{category}</Text>

            {/* TIER 1: text hint — unlocks after 2 wrong guesses */}
            {wrongCount >= 2 && (
              hintRevealed ? (
                <Text style={styles.hintText}>{hint}</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => setHintRevealed(true)}
                  style={[styles.hintBtn, { borderColor: theme.border, backgroundColor: theme.glow }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.hintBtnText, { color: theme.accent }]}>💡 Tap for hint</Text>
                </TouchableOpacity>
              )
            )}

            {/* TIER 2: emoji popup — unlocks on last life (5 wrongs) */}
            {wrongCount >= MAX_WRONG - 1 && status === "playing" && (
              <TouchableOpacity
                onPress={() => setEmojiPopup(true)}
                style={[styles.hintBtn, styles.lastHintBtn, { borderColor: "#EF4444", backgroundColor: "rgba(239,68,68,0.12)" }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.hintBtnText, { color: "#EF4444" }]}>🆘 Last Hint</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Hangman figure */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            style={[styles.cardInner, styles.figureInner]}
          >
            <HangmanFigure key={word} wrongCount={wrongCount} accentColor={theme.accent} />
            <View style={[styles.wrongBadge, { backgroundColor: theme.glow, borderColor: theme.border }]}>
              <Text style={[styles.wrongBadgeText, { color: theme.accent }]}>{wrongCount}/{MAX_WRONG}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Word display */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            style={[styles.cardInner, { alignItems: "center" }]}
          >
            <WordDisplay word={word} guessed={guessed} status={status} accentColor={theme.accent} />
          </LinearGradient>
        </View>

        {/* Wrong letters */}
        {wrongLetters.length > 0 && (
          <View style={styles.wrongRow}>
            <Text style={styles.wrongLabel}>Wrong:</Text>
            {wrongLetters.map(l => (
              <View key={l} style={[styles.wrongBubble, { borderColor: "rgba(239,68,68,0.5)" }]}>
                <Text style={styles.wrongBubbleText}>{l}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Keyboard */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
            style={[styles.cardInner, { paddingHorizontal: 8 }]}
          >
            <LetterKeyboard
              guessed={guessed}
              word={word}
              onLetter={guessLetter}
              disabled={status !== "playing"}
              won={status === "won"}
            />
          </LinearGradient>
        </View>

        {/* Next Level / Play Again button */}
        {status !== "playing" && (
          <TouchableOpacity
            style={[styles.playAgainBtn, { borderColor: theme.border }]}
            onPress={newGame}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.glow, "rgba(255,255,255,0.04)"]}
              style={styles.playAgainGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.playAgainText, { color: theme.accent }]}>
                {status === "won" ? `▶  Level ${level + 1}` : "↺  Play Again  (Level 1)"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ResultModal visible={showResult} onClose={() => setShowResult(false)} />

      {/* ── Emoji popup (last hint) ── */}
      {emojiPopup && (
        <View style={styles.popupBackdrop}>
          <View style={[styles.popupBox, { borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.popupClose}
              onPress={() => setEmojiPopup(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.popupCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.popupEmoji}>{emoji}</Text>
            <Text style={[styles.categoryLabel, { color: theme.accent, marginTop: 8 }]}>{category}</Text>
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  diffBadgeEmoji: { fontSize: 14 },
  diffBadgeLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  levelPill: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  tierLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    opacity: 0.75,
  },
  hearts: { flexDirection: "row", gap: 2 },
  heart: { fontSize: 15 },
  heartLost: { opacity: 0.35 },
  homeBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  /* Scroll */
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statChipNum:   { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  statChipEmoji: { fontSize: 15 },

  /* Dark glass card */
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  /* Hint */
  hintCard: {
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  hintEmoji:     { fontSize: 48 },
  categoryLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  hintText:      { fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 18, textAlign: "center" },
  hintBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  hintBtnText:   { fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  lastHintBtn:   { marginTop: 4 },

  /* Emoji popup overlay */
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  popupBox: {
    width: SW * 0.78,
    backgroundColor: "#0F0F2A",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  popupClose: {
    position: "absolute",
    top: 14,
    right: 16,
  },
  popupCloseText: {
    fontSize: 20,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
  },
  popupEmoji: { fontSize: 110 },

  /* Figure */
  figureInner: {
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center",
    padding: 10,
    position: "relative",
  },
  wrongBadge: {
    position: "absolute",
    top: 10, right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  wrongBadgeText: { fontWeight: "800", fontSize: 12 },

  /* Wrong letters */
  wrongRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 2,
  },
  wrongLabel: { fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: "600" },
  wrongBubble: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  wrongBubbleText: { color: "#F87171", fontWeight: "800", fontSize: 12 },

  /* Play Again */
  playAgainBtn: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginTop: 4,
  },
  playAgainGrad: {
    paddingVertical: 16,
    alignItems: "center",
  },
  playAgainText: { fontSize: 17, fontWeight: "900", letterSpacing: 1 },
});
