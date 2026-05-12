/**
 * app/(tabs)/profile.tsx
 *
 * User profile screen for VORTREXYN Hangman.
 *
 * ── Two render paths ─────────────────────────────────────────────────────
 *
 * Guest mode (isGuest === true):
 *   Shows a simple "Your Profile" prompt with a "Sign In to Access" button.
 *   Guests have no Firestore document so there are no stats to display.
 *
 * Authenticated mode (user !== null):
 *   1. Avatar — a gradient circle with the user's first initial.
 *              A cyan glow ring sits behind the circle.
 *   2. Username + email.
 *   3. Stats grid — four cards (Wins, Losses, Win Rate, Streak) read from
 *      GameContext.  The grid is 2-column, each card half the screen width.
 *   4. Account info row — username and email with Feather icons.
 *   5. Sign Out button — calls `confirmLogout()` before signing out.
 *   6. Delete Account button — calls `confirmDelete()` which shows an
 *      Alert with a destructive confirmation before calling `deleteAccount()`.
 *
 * ── Stats derivation ─────────────────────────────────────────────────────
 * Stats are read from `useGame()` (GameContext) rather than Firestore to
 * keep the UI responsive.  GameContext syncs to Firestore in the background
 * via `syncStats` in GameContext.tsx after each game ends.
 *
 * Win rate = wins / (wins + losses) × 100.
 * Shows 0% when no games have been played yet (avoids division-by-zero).
 *
 * ── Destructive actions ──────────────────────────────────────────────────
 *
 * Sign Out:
 *   On web: `doLogout()` is called directly — `Alert.alert` is a no-op on web.
 *   On native: a confirmation Alert appears first.
 *
 * Delete Account:
 *   On web: uses `window.confirm(...)` since Alert.alert doesn't work on web.
 *   On native: Alert with "Cancel" (cancel) and "Delete Forever" (destructive).
 *   Calls `AuthContext.deleteAccount()` which:
 *     1. Deletes the Firestore user document.
 *     2. Clears the remembered email from AsyncStorage.
 *     3. Deletes the Firebase Auth account.
 *   Then redirects to /login.
 *
 * ── Username derivation ──────────────────────────────────────────────────
 * Checks `user.displayName` first (set during signup via `updateProfile`).
 * Falls back to the part before @ in the email address.
 * Falls back to "Player" if neither is available.
 */
import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useGame } from "@/context/GameContext";

const { width: SW } = Dimensions.get("window");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { user, logout, isGuest, deleteAccount } = useAuth();
  const { wins, losses, streak } = useGame();

  if (isGuest) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#0A0A1E", "#150B30", "#0D0D2B"]} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: insets.top }}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>👤</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginBottom: 8 }}>
            Your Profile
          </Text>
          <Text style={{ fontSize: 14, color: "#7777AA", textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
            Sign in to save your progress, track your stats, and see your best streaks.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            activeOpacity={0.85}
            style={{
              width: "100%", paddingVertical: 16, borderRadius: 16,
              backgroundColor: "#C77DFF", alignItems: "center",
              shadowColor: "#C77DFF", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.5 }}>Sign In to Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const username = user?.displayName || user?.email?.split("@")[0] || "Player";
  const email    = user?.email || "";
  const initial  = (username[0] ?? "?").toUpperCase();
  const total    = wins + losses;
  const winRate  = total > 0 ? Math.round((wins / total) * 100) : 0;

  const STATS = [
    { label: "Wins",     value: String(wins),       emoji: "🏆", color: "#6BCB77" },
    { label: "Losses",   value: String(losses),      emoji: "💀", color: "#FF6B6B" },
    { label: "Win Rate", value: `${winRate}%`,        emoji: "⭐", color: "#FFD93D" },
    { label: "Streak",   value: String(streak),       emoji: "🔥", color: "#FF6B35" },
  ];

  async function doLogout() {
    try { await logout(); router.replace("/login"); } catch {}
  }

  async function doDelete() {
    try { await deleteAccount(); router.replace("/login"); } catch {}
  }

  function confirmDelete() {
    if (Platform.OS === "web") {
      if (window.confirm("Delete your account? This will permanently remove all your data and cannot be undone.")) {
        doDelete();
      }
      return;
    }
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all game data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Forever", style: "destructive", onPress: doDelete },
      ]
    );
  }

  function confirmLogout() {
    if (Platform.OS === "web") {
      // Alert.alert is a no-op on web — sign out directly
      doLogout();
      return;
    }
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A0A1E", "#150B30", "#0D0D2B"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarOuter}>
          <View style={styles.glowRing} />
          <LinearGradient
            colors={["#7C3AED", "#4CC9F0"]}
            style={styles.avatarCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarLetter}>{initial}</Text>
          </LinearGradient>
        </View>

        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{email}</Text>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>YOUR STATS</Text>
        <View style={styles.statsGrid}>
          {STATS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Account info */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>

        <View style={styles.infoRow}>
          <Feather name="user" size={16} color="#5555AA" />
          <Text style={styles.infoText}>{username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="mail" size={16} color="#5555AA" />
          <Text style={styles.infoText}>{email}</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color="#FF6B6B" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} activeOpacity={0.8}>
          <Feather name="trash-2" size={16} color="#FF3CAC" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { alignItems: "center", paddingHorizontal: 20 },

  avatarOuter: {
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  glowRing: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: "rgba(76,201,240,0.4)",
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 44, fontWeight: "900", color: "#FFFFFF" },

  username: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", marginBottom: 4 },
  email:    { fontSize: 13, color: "#6666AA", marginBottom: 30 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#4CC9F0",
    letterSpacing: 3,
    alignSelf: "flex-start",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
    marginBottom: 28,
    justifyContent: "center",
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 18,
    alignItems: "center",
    width: (SW - 52) / 2,
  },
  statEmoji: { fontSize: 26 },
  statValue: { fontSize: 28, fontWeight: "900", marginTop: 5 },
  statLabel: { fontSize: 11, color: "#6666AA", marginTop: 3, fontWeight: "600", letterSpacing: 0.4 },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 26,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 13,
    padding: 15,
    width: "100%",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  infoText: { fontSize: 14, color: "#AAAACC", fontWeight: "500", flex: 1 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,107,107,0.1)",
    borderRadius: 16,
    padding: 17,
    width: "100%",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: "#FF6B6B" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,60,172,0.07)",
    borderRadius: 16,
    padding: 14,
    width: "100%",
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,60,172,0.2)",
  },
  deleteText: { fontSize: 14, fontWeight: "700", color: "#FF3CAC" },
});
