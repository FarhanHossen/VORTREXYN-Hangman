/**
 * app/(tabs)/leaderboard.tsx
 *
 * Global leaderboard screen for VORTREXYN Hangman.
 *
 * ── Data source ──────────────────────────────────────────────────────────
 * All player stats are read from Firestore's `users` collection.
 * Each document has a nested `stats` map with per-difficulty sub-maps:
 *   stats.easy.wins, stats.easy.losses, stats.easy.bestStreak
 *   stats.medium.*, stats.hard.*, stats.extreme.*
 *
 * `fetchLeaderboard` reads ALL user documents in one `getDocs` call and
 * maps them to the `Entry` type.  Missing fields default to 0 via
 * `s[k]?.wins ?? 0` so new users who have never played a difficulty don't
 * cause errors.
 *
 * ── Ranking logic ────────────────────────────────────────────────────────
 * Players are ranked by `bestStreak` for the active difficulty (primary),
 * with `wins` as the tiebreaker.  The top 50 entries are displayed.
 * bestStreak is used (not total wins) because streaks require consistent
 * skill — they're harder to inflate and more meaningful for competitive play.
 *
 * ── Difficulty tabs ──────────────────────────────────────────────────────
 * Four tabs (Easy, Medium, Hard, Extreme) each with their own accent colour.
 * Switching tabs re-sorts and re-renders the same `allEntries` array without
 * a new Firestore call — the data is fully cached after the first fetch.
 * `useFocusEffect` re-fetches the leaderboard every time the tab becomes
 * visible, keeping rankings fresh after the player finishes a game.
 *
 * ── Podium component ─────────────────────────────────────────────────────
 * If there are at least 3 entries, a podium is rendered above the list:
 *   Gold  (centre, raised 14 px) — 1st place
 *   Silver (left)                — 2nd place
 *   Bronze (right)               — 3rd place
 * Each podium card shows the medal emoji, the user's first-letter avatar,
 * their username, and their best streak.
 *
 * ── Guest gate ───────────────────────────────────────────────────────────
 * If `isGuest === true`, the leaderboard is replaced by `GuestGate` — a
 * friendly prompt with a "Sign In to Access" button.  Guest users don't
 * have UIDs or Firestore documents, so showing the leaderboard would be
 * confusing ("You" couldn't be highlighted).
 *
 * ── Pull-to-refresh ──────────────────────────────────────────────────────
 * `RefreshControl` on the FlatList triggers `fetchLeaderboard(true)` which
 * sets `refreshing` (spinner inside the header) rather than the full `loading`
 * overlay, so the existing list remains visible during the refresh.
 *
 * ── "You" highlighting ───────────────────────────────────────────────────
 * The signed-in user's row is highlighted with the active difficulty's glow
 * background and their avatar is filled with the accent colour.
 * The username is shown as "username (You)" for clarity.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, Dimensions, TouchableOpacity, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const { width: SW } = Dimensions.get("window");

/* ─── Difficulty config ─────────────────────────────────────────────── */
const DIFFS = [
  { label: "Easy",    key: "easy",    emoji: "🌟", accent: "#22C55E", border: "rgba(34,197,94,0.40)",  glow: "rgba(34,197,94,0.12)"  },
  { label: "Medium",  key: "medium",  emoji: "⚡", accent: "#60A5FA", border: "rgba(96,165,250,0.40)", glow: "rgba(96,165,250,0.12)" },
  { label: "Hard",    key: "hard",    emoji: "🔥", accent: "#FB923C", border: "rgba(251,146,60,0.40)", glow: "rgba(251,146,60,0.12)" },
  { label: "Extreme", key: "extreme", emoji: "💀", accent: "#D946EF", border: "rgba(217,70,239,0.40)", glow: "rgba(217,70,239,0.12)" },
] as const;

type DiffKey = "easy" | "medium" | "hard" | "extreme";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface DiffStat { wins: number; losses: number; bestStreak: number; }

interface Entry {
  uid:      string;
  username: string;
  easy:     DiffStat;
  medium:   DiffStat;
  hard:     DiffStat;
  extreme:  DiffStat;
}

const EMPTY_DIFF: DiffStat = { wins: 0, losses: 0, bestStreak: 0 };
const MEDALS = ["🥇", "🥈", "🥉"];
const GOLD   = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;
const POD_BG = [
  "rgba(255,215,0,0.12)",
  "rgba(192,192,192,0.08)",
  "rgba(205,127,50,0.10)",
] as const;

/* ─── Guest Gate ─────────────────────────────────────────────────────── */
function GuestGate({ onSignIn }: { onSignIn: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#0A0A1E", "#150B30", "#0D0D2B"]} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: insets.top }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🏆</Text>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginBottom: 8 }}>
          Leaderboard
        </Text>
        <Text style={{ fontSize: 14, color: "#7777AA", textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          Sign in to see how you rank against other players and track your best streaks.
        </Text>
        <TouchableOpacity
          onPress={onSignIn}
          activeOpacity={0.85}
          style={{
            width: "100%", paddingVertical: 16, borderRadius: 16,
            backgroundColor: "#22C55E", alignItems: "center",
            shadowColor: "#22C55E", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 }}>Sign In to Access</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────── */
export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, isGuest } = useAuth();
  const router = useRouter();

  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [activeDiff, setActiveDiff] = useState<DiffKey>("easy");

  const fetchLeaderboard = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, "users"));
      const rows: Entry[] = snap.docs.map(d => {
        const data = d.data();
        const s    = data.stats ?? {};
        const makeDiff = (k: string): DiffStat => ({
          wins:       s[k]?.wins       ?? 0,
          losses:     s[k]?.losses     ?? 0,
          bestStreak: s[k]?.bestStreak ?? 0,
        });
        return {
          uid:      data.uid      ?? d.id,
          username: data.username ?? data.email?.split("@")[0] ?? "Player",
          easy:     makeDiff("easy"),
          medium:   makeDiff("medium"),
          hard:     makeDiff("hard"),
          extreme:  makeDiff("extreme"),
        };
      });
      setAllEntries(rows);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load leaderboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchLeaderboard(); }, [fetchLeaderboard]));

  const theme   = DIFFS.find(d => d.key === activeDiff)!;
  // Rank by best streak (max score) — wins is secondary tiebreaker
  const entries = [...allEntries]
    .sort((a, b) => b[activeDiff].bestStreak - a[activeDiff].bestStreak || b[activeDiff].wins - a[activeDiff].wins)
    .slice(0, 50);

  if (isGuest) return <GuestGate onSignIn={() => router.replace("/login")} />;

  function initial(name: string) { return (name[0] ?? "?").toUpperCase(); }

  function winRate(e: Entry) {
    const s = e[activeDiff];
    return s.wins + s.losses > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0;
  }

  /* ── Podium ───────────────────────────────────────────────────────── */
  function Podium() {
    if (entries.length < 3) return null;
    return (
      <View style={styles.podium}>
        {/* Silver left */}
        <View style={[styles.podCard, { backgroundColor: POD_BG[1], alignSelf: "flex-end" }]}>
          <Text style={styles.podMedal}>{MEDALS[1]}</Text>
          <View style={[styles.podAvatar, { borderColor: GOLD[1] }]}>
            <Text style={styles.podAvatarLetter}>{initial(entries[1].username)}</Text>
          </View>
          <Text style={[styles.podName, { color: GOLD[1] }]} numberOfLines={1}>{entries[1].username}</Text>
          <Text style={styles.podWins}>🔥 {entries[1][activeDiff].bestStreak}</Text>
        </View>

        {/* Gold center — raised */}
        <View style={[styles.podCard, styles.podFirst, { backgroundColor: POD_BG[0], borderColor: theme.accent + "55", borderWidth: 1 }]}>
          <Text style={styles.podMedal}>{MEDALS[0]}</Text>
          <View style={[styles.podAvatar, styles.podAvatarFirst, { borderColor: GOLD[0] }]}>
            <Text style={styles.podAvatarLetter}>{initial(entries[0].username)}</Text>
          </View>
          <Text style={[styles.podName, { color: GOLD[0] }]} numberOfLines={1}>{entries[0].username}</Text>
          <Text style={styles.podWins}>🔥 {entries[0][activeDiff].bestStreak}</Text>
        </View>

        {/* Bronze right */}
        <View style={[styles.podCard, { backgroundColor: POD_BG[2], alignSelf: "flex-end" }]}>
          <Text style={styles.podMedal}>{MEDALS[2]}</Text>
          <View style={[styles.podAvatar, { borderColor: GOLD[2] }]}>
            <Text style={styles.podAvatarLetter}>{initial(entries[2].username)}</Text>
          </View>
          <Text style={[styles.podName, { color: GOLD[2] }]} numberOfLines={1}>{entries[2].username}</Text>
          <Text style={styles.podWins}>🔥 {entries[2][activeDiff].bestStreak}</Text>
        </View>
      </View>
    );
  }

  /* ── Row ──────────────────────────────────────────────────────────── */
  function renderRow({ item, index }: { item: Entry; index: number }) {
    const isMe   = item.uid === user?.uid;
    const isTop3 = index < 3;
    const stat   = item[activeDiff];
    return (
      <View style={[styles.row, isMe && { backgroundColor: theme.glow, borderColor: theme.border }]}>
        <View style={styles.rankWrap}>
          {isTop3
            ? <Text style={styles.medal}>{MEDALS[index]}</Text>
            : <Text style={styles.rankNum}>#{index + 1}</Text>
          }
        </View>
        <View style={[styles.avatar, { backgroundColor: isMe ? theme.accent : "#2A2A4A" }]}>
          <Text style={styles.avatarLetter}>{initial(item.username)}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={[styles.username, isMe && { color: theme.accent }]} numberOfLines={1}>
            {item.username}{isMe ? " (You)" : ""}
          </Text>
          <Text style={styles.subRow}>
            <Text style={styles.statInline}>{stat.wins} wins · </Text>
            <Text style={styles.statInline}>{winRate(item)}% win rate</Text>
          </Text>
        </View>
        <View style={styles.winsCol}>
          <Text style={[styles.winsNum, isTop3 && { color: GOLD[index] }]}>🔥{stat.bestStreak}</Text>
          <Text style={styles.winsLbl}>best streak</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A0A1E", "#150B30", "#0D0D2B"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 20 }]}>
        <Text style={styles.title}>🏆 LEADERBOARD</Text>
        <Text style={styles.subtitle}>Top players by difficulty</Text>
      </View>

      {/* Difficulty tabs */}
      <View style={styles.tabRow}>
        {DIFFS.map(d => {
          const active = d.key === activeDiff;
          return (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.tab,
                active && { backgroundColor: d.glow, borderColor: d.accent },
              ]}
              onPress={() => setActiveDiff(d.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.tabEmoji}>{d.emoji}</Text>
              <Text style={[styles.tabLabel, active && { color: d.accent }]}>{d.label}</Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: d.accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={[styles.loadingTxt, { color: theme.accent }]}>Loading rankings…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't load rankings</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: theme.accent + "66", backgroundColor: theme.glow }]}
            onPress={() => fetchLeaderboard()}
          >
            <Text style={[styles.retryTxt, { color: theme.accent }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.uid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          ListHeaderComponent={<Podium />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>{theme.emoji}</Text>
              <Text style={styles.emptyTitle}>No players yet!</Text>
              <Text style={styles.emptySub}>Be the first to win a {theme.label} game</Text>
            </View>
          }
          renderItem={renderRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLeaderboard(true)}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  title:    { fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: 2 },
  subtitle: { fontSize: 12, color: "#7777AA", marginTop: 3 },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    position: "relative",
  },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 10, fontWeight: "800", color: "#7777AA", marginTop: 2, letterSpacing: 0.5 },
  tabUnderline: {
    position: "absolute",
    bottom: 0, left: "20%", right: "20%",
    height: 2.5,
    borderRadius: 2,
  },

  center:     { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  loadingTxt: { marginTop: 14, fontSize: 13 },

  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#FFF", textAlign: "center" },
  errorSub:   { fontSize: 12, color: "#7777AA", marginTop: 6, textAlign: "center" },
  retryBtn:   {
    marginTop: 18, borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10,
  },
  retryTxt: { fontWeight: "800", fontSize: 14 },

  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  emptySub:   { fontSize: 13, color: "#7777AA", marginTop: 6, textAlign: "center" },

  list: { paddingHorizontal: 16, paddingTop: 8 },

  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  podCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 0,
  },
  podFirst:        { paddingTop: 18, paddingBottom: 18, transform: [{ translateY: -14 }] },
  podMedal:        { fontSize: 26 },
  podAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#1A1A3E", borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginVertical: 8,
  },
  podAvatarFirst:  { width: 60, height: 60, borderRadius: 30 },
  podAvatarLetter: { fontSize: 22, fontWeight: "900", color: "#FFF" },
  podName:         { fontSize: 11, fontWeight: "800", textAlign: "center" },
  podWins:         { fontSize: 10, color: "#7777AA", marginTop: 2 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  rankWrap: { width: 38, alignItems: "center" },
  medal:    { fontSize: 22 },
  rankNum:  { fontSize: 14, fontWeight: "700", color: "#6666AA" },

  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  avatarLetter: { fontSize: 18, fontWeight: "900", color: "#FFF" },

  nameCol:    { flex: 1 },
  username:   { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  subRow:     { marginTop: 2 },
  statInline: { fontSize: 11, color: "#7777AA" },

  winsCol: { alignItems: "center" },
  winsNum: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  winsLbl: { fontSize: 10, color: "#7777AA" },
});
