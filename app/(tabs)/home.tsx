/**
 * app/(tabs)/home.tsx
 *
 * Home / difficulty-selection screen for VORTREXYN Hangman.
 *
 * ── Purpose ──────────────────────────────────────────────────────────────
 * The first screen signed-in (or guest) players see after authentication.
 * It shows:
 *   1. LogoBadge + AppTitle side-by-side header.
 *   2. Stats banner — wins, current streak, and win rate derived from
 *      GameContext (updated in real-time as the player plays).
 *   3. 2×2 difficulty card grid — Easy, Medium, Hard, Extreme.
 *      Tapping a card calls `startDifficulty(label)` from GameContext then
 *      navigates to /game.
 *
 * ── DifficultyCard component ─────────────────────────────────────────────
 * Each card is a fully self-contained animated component with:
 *
 *   Entry animation:
 *     `slideY` springs from 50 → 0 and `fadeIn` fades from 0 → 1.
 *     Cards are staggered by `240 + index × 120 ms` so they cascade in
 *     rather than all appearing at once.
 *
 *   Press animation:
 *     `pressScale` springs between 1 and 0.93 on press-in/press-out.
 *     This creates a satisfying "click-in" tactile feel.
 *
 *   Orbit system (three concentric rotating dots):
 *     orbit1 — largest ring, 80 px, clockwise,        2.6 s / rev.
 *     orbit2 — medium ring, 60 px, counter-clockwise, 4.2 s / rev.
 *     orbit3 — smallest ring, 40 px, clockwise,       3.4 s / rev.
 *     Each has a different size dot (`orbitDot`, `orbitDotSm`, `orbitDotXs`)
 *     with decreasing opacity so the inner orbits feel further away.
 *
 *   Glow blob:
 *     An absolutely positioned circle behind the emoji that pulses
 *     from 1× to 1.45× scale (1.7 s / cycle).
 *
 *   Emoji bounce:
 *     The difficulty emoji scales between 1 and 1.16 (0.95 s / cycle)
 *     so it breathes gently in the centre of the orbit system.
 *
 *   Difficulty pips:
 *     Four small dots below the tagline — filled with the accent colour
 *     for difficulty levels 1-N (1 pip for Easy, 4 for Extreme).
 *
 * ── Star field ───────────────────────────────────────────────────────────
 * 24 white dot stars randomly placed, each with its own twinkling opacity
 * loop (random duration 900–2300 ms, random start delay up to 2200 ms).
 *
 * ── DIFF_THEMES ──────────────────────────────────────────────────────────
 * Each difficulty has a unique dark two-colour gradient background (`bg`),
 * an accent colour, a glow colour, a border colour, and a pip fill count.
 * These are indexed in the same order as `DIFFICULTIES` from constants/words.ts.
 */
import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGame } from "@/context/GameContext";
import { LogoBadge } from "@/components/LogoBadge";
import { AppTitle } from "@/components/AppTitle";
import { DIFFICULTIES, getDifficultyWordCount } from "@/constants/words";

const { width: SW } = Dimensions.get("window");
const CARD_W = (SW - 48) / 2;
const NUM_STARS = 24;

const DIFF_THEMES = [
  {
    bg:     ["#071810", "#0C2218"] as [string, string],
    accent: "#22C55E",
    glow:   "rgba(34,197,94,0.22)",
    border: "rgba(34,197,94,0.35)",
    filled: 1,
  },
  {
    bg:     ["#050F24", "#0B1C42"] as [string, string],
    accent: "#60A5FA",
    glow:   "rgba(96,165,250,0.22)",
    border: "rgba(96,165,250,0.35)",
    filled: 2,
  },
  {
    bg:     ["#1A0700", "#2C1000"] as [string, string],
    accent: "#FB923C",
    glow:   "rgba(251,146,60,0.22)",
    border: "rgba(251,146,60,0.35)",
    filled: 3,
  },
  {
    bg:     ["#130018", "#1E0028"] as [string, string],
    accent: "#D946EF",
    glow:   "rgba(217,70,239,0.22)",
    border: "rgba(217,70,239,0.35)",
    filled: 4,
  },
];

const STARS = Array.from({ length: NUM_STARS }, (_, i) => ({
  id: i,
  x: Math.random() * SW,
  y: Math.random() * 900,
  size: 1 + Math.random() * 2.5,
  delay: Math.random() * 2200,
}));

function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(Math.random() * 0.6 + 0.2)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.1, duration: 900 + Math.random() * 1400, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 1,   duration: 900 + Math.random() * 1400, useNativeDriver: false }),
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

function DifficultyCard({
  diff, theme, index, wordCount, onPress,
}: {
  diff: typeof DIFFICULTIES[0];
  theme: typeof DIFF_THEMES[0];
  index: number;
  wordCount: number;
  onPress: () => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const slideY     = useRef(new Animated.Value(50)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;
  const glowScale  = useRef(new Animated.Value(1)).current;
  const orbit1     = useRef(new Animated.Value(0)).current;
  const orbit2     = useRef(new Animated.Value(0)).current;
  const orbit3     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry slide-in
    Animated.sequence([
      Animated.delay(240 + index * 120),
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: false, tension: 52, friction: 8 }),
        Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]),
    ]).start();

    // Emoji gentle bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScale, { toValue: 1.16, duration: 950, useNativeDriver: false }),
        Animated.timing(emojiScale, { toValue: 1,    duration: 950, useNativeDriver: false }),
      ])
    ).start();

    // Background glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.45, duration: 1700, useNativeDriver: false }),
        Animated.timing(glowScale, { toValue: 1,    duration: 1700, useNativeDriver: false }),
      ])
    ).start();

    // Orbit 1 — clockwise fast
    Animated.loop(
      Animated.timing(orbit1, { toValue: 1, duration: 2600, useNativeDriver: false })
    ).start();
    // Orbit 2 — counter-clockwise medium
    Animated.loop(
      Animated.timing(orbit2, { toValue: 1, duration: 4200, useNativeDriver: false })
    ).start();
    // Orbit 3 — clockwise slow
    Animated.loop(
      Animated.timing(orbit3, { toValue: 1, duration: 3400, useNativeDriver: false })
    ).start();
  }, []);

  const rot1 = orbit1.interpolate({ inputRange: [0, 1], outputRange: ["0deg",   "360deg"]  });
  const rot2 = orbit2.interpolate({ inputRange: [0, 1], outputRange: ["0deg",  "-360deg"]  });
  const rot3 = orbit3.interpolate({ inputRange: [0, 1], outputRange: ["0deg",   "360deg"]  });

  return (
    <Animated.View style={[
      styles.cardWrap,
      { opacity: fadeIn, transform: [{ translateY: slideY }, { scale: pressScale }] },
    ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.93, useNativeDriver: false }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1,    useNativeDriver: false }).start()}
        style={[styles.card, { borderColor: theme.border }]}
      >
        <LinearGradient
          colors={theme.bg}
          style={styles.cardGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* ── Animated center area ── */}
          <View style={styles.emojiArea}>
            {/* Pulsing glow blob */}
            <Animated.View style={[
              styles.glowBlob,
              { backgroundColor: theme.glow, transform: [{ scale: glowScale }] },
            ]} />

            {/* Orbit 1 — large, clockwise */}
            <Animated.View style={[styles.orbit, { width: 78, height: 78, top: 1, left: 1, transform: [{ rotate: rot1 }] }]}>
              <View style={[styles.orbitDot, { backgroundColor: theme.accent }]} />
            </Animated.View>

            {/* Orbit 2 — medium, counter-clockwise */}
            <Animated.View style={[styles.orbit, { width: 58, height: 58, top: 11, left: 11, transform: [{ rotate: rot2 }] }]}>
              <View style={[styles.orbitDotSm, { backgroundColor: theme.accent }]} />
            </Animated.View>

            {/* Orbit 3 — tiny, clockwise */}
            <Animated.View style={[styles.orbit, { width: 40, height: 40, top: 20, left: 20, transform: [{ rotate: rot3 }] }]}>
              <View style={[styles.orbitDotXs, { backgroundColor: theme.accent }]} />
            </Animated.View>

            {/* Emoji — in normal flow, centered by parent */}
            <Animated.Text style={[styles.cardEmoji, { transform: [{ scale: emojiScale }] }]}>
              {diff.emoji}
            </Animated.Text>
          </View>

          {/* ── Text content ── */}
          <Text style={styles.cardLabel}>{diff.label.toUpperCase()}</Text>
          <Text style={[styles.cardTagline, { color: theme.accent }]}>{diff.tagline}</Text>

          {/* Difficulty pips */}
          <View style={styles.pips}>
            {[1, 2, 3, 4].map(n => (
              <View
                key={n}
                style={[
                  styles.pip,
                  { backgroundColor: n <= theme.filled ? theme.accent : "rgba(255,255,255,0.14)" },
                ]}
              />
            ))}
          </View>

          <Text style={styles.wordCount}>{wordCount} words</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { wins, losses, streak, startDifficulty } = useGame();

  const total   = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A0A1E", "#150B30", "#0D0D2B"]} style={StyleSheet.absoluteFill} />
      {STARS.map(s => <Star key={s.id} {...s} />)}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo header — side by side */}
        <View style={styles.logoArea}>
          <LogoBadge size="small" />
          <View style={styles.titleSide}>
            <AppTitle />
          </View>
        </View>

        {/* Stats banner */}
        <View style={styles.banner}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statNum}>{wins}</Text>
            <Text style={styles.statLbl}>Wins</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLbl}>Streak</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNum}>{winRate}%</Text>
            <Text style={styles.statLbl}>Win Rate</Text>
          </View>
        </View>

        {/* Section heading */}
        <Text style={styles.sectionTitle}>SELECT DIFFICULTY</Text>

        {/* 2×2 grid */}
        <View style={styles.grid}>
          {DIFFICULTIES.map((diff, i) => (
            <DifficultyCard
              key={diff.label}
              diff={diff}
              theme={DIFF_THEMES[i]}
              index={i}
              wordCount={getDifficultyWordCount(diff.label)}
              onPress={() => { startDifficulty(diff.label); router.push("/game"); }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { alignItems: "center" },

  logoArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  titleSide: { alignItems: "flex-start" },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(76,201,240,0.2)",
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: SW - 32,
    marginBottom: 24,
  },
  statItem:     { alignItems: "center", flex: 1 },
  statEmoji:    { fontSize: 20 },
  statNum:      { fontSize: 20, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  statLbl:      { fontSize: 10, color: "#7777AA", marginTop: 1, fontWeight: "600", letterSpacing: 0.4 },
  bannerDivider:{ width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#4CC9F0",
    letterSpacing: 3,
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  /* Card */
  cardWrap: { width: CARD_W },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardGrad: {
    width: CARD_W,
    height: CARD_W,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    gap: 3,
  },

  /* Animated center area */
  emojiArea: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  glowBlob: {
    position: "absolute",
    top: 15, left: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  orbit: {
    position: "absolute",
    alignItems: "center",
  },
  orbitDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  orbitDotSm: {
    width: 6, height: 6, borderRadius: 3,
    opacity: 0.65,
  },
  orbitDotXs: {
    width: 5, height: 5, borderRadius: 3,
    opacity: 0.4,
  },
  cardEmoji: { fontSize: 34 },

  /* Text */
  cardLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardTagline: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  /* Difficulty pips */
  pips: { flexDirection: "row", gap: 5, marginTop: 5 },
  pip:  { width: 7, height: 7, borderRadius: 4 },

  wordCount: { fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: "600", marginTop: 2 },
});
