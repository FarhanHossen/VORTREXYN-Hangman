/**
 * app/signup.tsx
 *
 * Account creation screen for VORTREXYN Hangman.
 *
 * Form fields:
 *   Username   — must be at least 3 characters.
 *   Email      — must match a basic email regex.
 *   Password   — must be at least 6 characters (Firebase minimum).
 *   Confirm    — must match the password field.
 *
 * All four fields are validated client-side before the Firebase call so users
 * get instant inline feedback without waiting for a network round-trip.
 *
 * On success:
 *   Calls AuthContext.signup() which:
 *     1. Creates the Firebase Auth user.
 *     2. Sets the display name.
 *     3. Writes the Firestore user document with zeroed stats.
 *   Then navigates to /(tabs)/home.
 *
 * Firebase error mapping:
 *   "email-already-in-use" → "This email is already registered."
 *   "invalid-email"        → "Please enter a valid email address."
 *   "weak-password"        → "Password is too weak. Use at least 6 characters."
 *   Other errors           → generic retry message.
 *
 * UI:
 *   Same cosmic dark-purple gradient + twinkle star background as login.
 *   Card slides in from below on mount (same animation as login card).
 *   Password and confirm fields each have a show/hide eye toggle.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { LogoBadge } from "@/components/LogoBadge";
import { AppTitle } from "@/components/AppTitle";

const { width: SW, height: SH } = Dimensions.get("window");

/** 18 stars with slightly different spacing maths from login to vary the pattern. */
const NUM_STARS = 18;
const STAR_DATA = Array.from({ length: NUM_STARS }, (_, i) => ({
  left:  10 + (i * 53 + i * i * 7) % (SW - 20),
  top:   30 + (i * 79 + i * 11) % (SH - 60),
  size:  6 + (i * 3) % 10,
  delay: i * 230,
  color: ["#4CC9F0", "#FF3CAC", "#FFD93D", "#C77DFF", "#6BCB77", "#FFFFFF"][i % 6],
}));

/**
 * TwinkleStar
 * Same pulsing star as other auth screens.
 */
function TwinkleStar({ left, top, size, delay, color }: typeof STAR_DATA[0]) {
  const opacity = useRef(new Animated.Value(0.06)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0.06, duration: 750, useNativeDriver: false }),
    ])).start();
  }, []);
  return (
    <Animated.Text style={{ position: "absolute", left, top, fontSize: size, color, opacity }}>✦</Animated.Text>
  );
}

/**
 * SignupScreen
 *
 * Four-field registration form with validation and Firebase error handling.
 */
export default function SignupScreen() {
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const { signup }   = useAuth();

  // ── Form state ──────────────────────────────────────────────────────────
  const [username, setUsername]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPass, setShowPass]         = useState(false);    // password field visibility
  const [showConfirm, setShowConfirm]   = useState(false);    // confirm field visibility
  const [loading, setLoading]           = useState(false);
  const [serverError, setServerError]   = useState("");
  const [fieldErrors, setFieldErrors]   = useState({ username: "", email: "", password: "", confirm: "" });

  // ── Card entrance animation ──────────────────────────────────────────────
  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardOp   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 550, delay: 200, useNativeDriver: false }),
      Animated.timing(cardOp,   { toValue: 1, duration: 550, delay: 200, useNativeDriver: false }),
    ]).start();
  }, []);

  /** Basic email format check. */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * handleSignup
   * Validates all four fields, then calls AuthContext.signup().
   * Any field with an error causes early return so the user can correct it.
   */
  async function handleSignup() {
    const errs = { username: "", email: "", password: "", confirm: "" };

    // Username: must exist and be at least 3 characters.
    if (!username.trim()) {
      errs.username = "Username is required.";
    } else if (username.trim().length < 3) {
      errs.username = "Must be more than 3 characters.";
    }

    // Email: must exist and pass the regex.
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Enter a valid email address.";
    }

    // Password: must exist and meet Firebase minimum of 6 characters.
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Must be more than 6 characters.";
    }

    // Confirm: must match the password field.
    if (!confirm) {
      errs.confirm = "Please confirm your password.";
    } else if (password !== confirm) {
      errs.confirm = "Passwords don't match.";
    }

    setFieldErrors(errs);
    if (errs.username || errs.email || errs.password || errs.confirm) return;

    setServerError("");
    setLoading(true);
    try {
      await signup(username.trim(), email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      // Map Firebase error codes to user-friendly messages.
      const msg = e?.code ?? "";
      if (msg.includes("email-already-in-use")) {
        setServerError("This email is already registered.");
      } else if (msg.includes("invalid-email")) {
        setServerError("Please enter a valid email address.");
      } else if (msg.includes("weak-password")) {
        setServerError("Password is too weak. Use at least 6 characters.");
      } else {
        setServerError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#08001C", "#160038", "#2E0060", "#5B0EAC"]}
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {STAR_DATA.map((s, i) => <TwinkleStar key={i} {...s} />)}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + title */}
          <View style={styles.logoArea}>
            <LogoBadge size="small" />
            <AppTitle />
          </View>

          {/* Animated form card */}
          <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOp }]}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join and start guessing!</Text>

            {/* Server-level error banner */}
            {!!serverError && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#FF3CAC" />
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            )}

            {/* ── Username field ── */}
            <View style={styles.fieldLabel}>
              <Feather name="user" size={14} color={fieldErrors.username ? "#FF3CAC" : "#C77DFF"} />
              <Text style={[styles.labelText, fieldErrors.username && { color: "#FF3CAC" }]}>Username</Text>
            </View>
            <View style={[styles.inputWrap, fieldErrors.username && styles.inputWrapError]}>
              <TextInput
                style={styles.input}
                placeholder="your_username"
                placeholderTextColor="#5A4080"
                value={username}
                onChangeText={(t) => { setUsername(t); setFieldErrors(e => ({ ...e, username: "" })); }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {!!fieldErrors.username && (
              <View style={styles.fieldErrorRow}>
                <Feather name="alert-circle" size={11} color="#FF3CAC" />
                <Text style={styles.fieldError}>{fieldErrors.username}</Text>
              </View>
            )}

            {/* ── Email field ── */}
            <View style={styles.fieldLabel}>
              <Feather name="mail" size={14} color={fieldErrors.email ? "#FF3CAC" : "#C77DFF"} />
              <Text style={[styles.labelText, fieldErrors.email && { color: "#FF3CAC" }]}>Email</Text>
            </View>
            <View style={[styles.inputWrap, fieldErrors.email && styles.inputWrapError]}>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#5A4080"
                value={email}
                onChangeText={(t) => { setEmail(t); setFieldErrors(e => ({ ...e, email: "" })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {!!fieldErrors.email && (
              <View style={styles.fieldErrorRow}>
                <Feather name="alert-circle" size={11} color="#FF3CAC" />
                <Text style={styles.fieldError}>{fieldErrors.email}</Text>
              </View>
            )}

            {/* ── Password field ── */}
            <View style={styles.fieldLabel}>
              <Feather name="lock" size={14} color={fieldErrors.password ? "#FF3CAC" : "#C77DFF"} />
              <Text style={[styles.labelText, fieldErrors.password && { color: "#FF3CAC" }]}>Password</Text>
            </View>
            <View style={[styles.inputWrap, fieldErrors.password && styles.inputWrapError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor="#5A4080"
                value={password}
                onChangeText={(t) => { setPassword(t); setFieldErrors(e => ({ ...e, password: "" })); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Feather name={showPass ? "eye" : "eye-off"} size={18} color="#C77DFF" />
              </TouchableOpacity>
            </View>
            {!!fieldErrors.password && (
              <View style={styles.fieldErrorRow}>
                <Feather name="alert-circle" size={11} color="#FF3CAC" />
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              </View>
            )}

            {/* ── Confirm password field ── */}
            <View style={styles.fieldLabel}>
              <Feather name="check-circle" size={14} color={fieldErrors.confirm ? "#FF3CAC" : "#C77DFF"} />
              <Text style={[styles.labelText, fieldErrors.confirm && { color: "#FF3CAC" }]}>Confirm Password</Text>
            </View>
            <View style={[styles.inputWrap, fieldErrors.confirm && styles.inputWrapError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Repeat password"
                placeholderTextColor="#5A4080"
                value={confirm}
                onChangeText={(t) => { setConfirm(t); setFieldErrors(e => ({ ...e, confirm: "" })); }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color="#C77DFF" />
              </TouchableOpacity>
            </View>
            {!!fieldErrors.confirm && (
              <View style={styles.fieldErrorRow}>
                <Feather name="alert-circle" size={11} color="#FF3CAC" />
                <Text style={styles.fieldError}>{fieldErrors.confirm}</Text>
              </View>
            )}

            {/* ── Create account button ── */}
            <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={["#4CC9F0", "#7B2FBE"]}
                style={styles.btn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Create Account</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Sign in link for existing users ── */}
            <View style={styles.linkRow}>
              <Text style={styles.linkLabel}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkAction}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { alignItems: "center", flexGrow: 1 },

  logoArea: { alignItems: "center", marginBottom: 20 },
  appName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
    marginTop: 10,
    textShadowColor: "#C77DFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  appSub: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4CC9F0",
    letterSpacing: 8,
    marginTop: 2,
  },

  card: {
    width: Math.min(SW - 40, 380),
    backgroundColor: "rgba(18, 4, 50, 0.92)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(76, 201, 240, 0.3)",
    padding: 28,
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },

  title:    { fontSize: 24, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#8A6AAA", marginBottom: 20 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,60,172,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,60,172,0.35)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: { color: "#FF3CAC", fontSize: 13, flex: 1 },

  inputWrapError: {
    borderColor: "rgba(255,60,172,0.6)",
    backgroundColor: "rgba(255,60,172,0.06)",
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
    paddingLeft: 2,
  },
  fieldError: { color: "#FF3CAC", fontSize: 11.5, fontWeight: "600" },

  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 12 },
  labelText:  { fontSize: 12, fontWeight: "700", color: "#C77DFF", textTransform: "uppercase", letterSpacing: 1 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(76,201,240,0.2)",
    paddingHorizontal: 14,
    height: 50,
  },
  input:  { flex: 1, color: "#FFFFFF", fontSize: 15 },
  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },

  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 },

  linkRow:    { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
  linkLabel:  { fontSize: 13, color: "#8A6AAA" },
  linkAction: { fontSize: 13, color: "#C77DFF", fontWeight: "700" },
});
