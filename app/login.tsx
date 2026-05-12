/**
 * app/login.tsx
 *
 * Email / password sign-in screen for VORTREXYN Hangman.
 *
 * Features:
 *   - Animated card slide-in on mount (translateY 60 → 0, opacity 0 → 1).
 *   - Background twinkle star field (18 stars, same pattern as other auth screens).
 *   - "Remember me" toggle backed by AsyncStorage (handled in AuthContext).
 *     When turned on, the email is saved and pre-filled next app launch.
 *   - Per-field validation (email format, password min-length) before the
 *     Firebase call is made, so users get instant feedback without a round-trip.
 *   - Firebase error mapping: translates Firebase error codes into friendly
 *     messages (e.g. "invalid-credential" → "Incorrect email or password.").
 *   - Password visibility toggle (eye / eye-off icon).
 *   - "Forgot password?" link → navigates to /forgot-password.
 *   - "Play as Guest" button → calls loginAsGuest() and navigates to home.
 *     Guest mode lets users play without creating an account.
 *
 * Auth redirect:
 *   A `useEffect` watches `user` and `authLoading`.  Once the initial Firebase
 *   auth check completes (authLoading → false) and a user is already signed in,
 *   the screen replaces itself with /(tabs)/home so returning users skip login.
 *
 * Keyboard handling:
 *   KeyboardAvoidingView with `behavior="padding"` on iOS shifts the form up
 *   when the keyboard appears.  `keyboardShouldPersistTaps="handled"` on the
 *   ScrollView prevents the keyboard from dismissing on button taps.
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

/**
 * Deterministic star positions so the background is consistent across renders.
 * 18 stars with staggered delays (210 ms apart) so they don't all pulse together.
 */
const NUM_STARS = 18;
const STAR_DATA = Array.from({ length: NUM_STARS }, (_, i) => ({
  left:  10 + (i * 47 + i * i * 9) % (SW - 20),
  top:   30 + (i * 71 + i * 13) % (SH - 60),
  size:  6 + (i * 4) % 10,
  delay: i * 210,
  color: ["#FF3CAC", "#FFD93D", "#4CC9F0", "#6BCB77", "#C77DFF", "#FFFFFF"][i % 6],
}));

/**
 * TwinkleStar
 * An absolutely positioned "✦" that loops: wait → fade in → fade out.
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
 * LoginScreen
 *
 * Main export — the full sign-in UI.
 * State is kept local (form fields, loading, errors) because this data does
 * not need to survive navigation or be shared with other screens.
 */
export default function LoginScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { login, user, loading: authLoading, rememberedEmail, loginAsGuest } = useAuth();

  // ── Form state ──────────────────────────────────────────────────────────
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPass, setShowPass]       = useState(false);   // password visibility toggle
  const [remember, setRemember]       = useState(false);   // "Remember me" checkbox
  const [loading, setLoading]         = useState(false);   // in-flight Firebase request
  const [serverError, setServerError] = useState("");      // Firebase error message
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  // ── Card entrance animation ──────────────────────────────────────────────
  const cardAnim = useRef(new Animated.Value(60)).current; // starts 60 px below
  const cardOp   = useRef(new Animated.Value(0)).current;  // starts invisible

  useEffect(() => {
    // Slide the card up into position with a fade-in after 200 ms.
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 550, delay: 200, useNativeDriver: false }),
      Animated.timing(cardOp,   { toValue: 1, duration: 550, delay: 200, useNativeDriver: false }),
    ]).start();
  }, []);

  // Pre-fill remembered email when the screen loads.
  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, [rememberedEmail]);

  // Redirect to home if the user is already signed in.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)/home");
    }
  }, [user, authLoading]);

  /** Simple email format validator. */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * handleLogin
   * 1. Validates both fields client-side.
   * 2. Calls AuthContext.login() which calls Firebase.
   * 3. On success, navigates to home.
   * 4. On failure, maps the Firebase error code to a human-readable message.
   */
  async function handleLogin() {
    const errs = { email: "", password: "" };
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errs);
    if (errs.email || errs.password) return; // abort if validation fails

    setServerError("");
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      // Map Firebase error codes to friendly messages.
      const msg = e?.code ?? "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setServerError("Incorrect email or password.");
      } else if (msg.includes("too-many-requests")) {
        setServerError("Too many attempts. Try again later.");
      } else {
        setServerError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Show a full-screen loading spinner while Firebase checks the auth state on boot.
  if (authLoading) {
    return (
      <LinearGradient colors={["#08001C", "#160038", "#2E0060", "#5B0EAC"]} style={styles.center}>
        <ActivityIndicator size="large" color="#4CC9F0" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#08001C", "#160038", "#2E0060", "#5B0EAC"]}
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {/* Background star field */}
      {STAR_DATA.map((s, i) => <TwinkleStar key={i} {...s} />)}

      {/* KeyboardAvoidingView shifts the form up on iOS when the keyboard appears */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + title area */}
          <View style={styles.logoArea}>
            <LogoBadge size="small" />
            <AppTitle />
          </View>

          {/* Animated sign-in card */}
          <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOp }]}>

            {/* Server-level error banner (Firebase errors) */}
            {!!serverError && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#FF3CAC" />
                <Text style={styles.errorText}>{serverError}</Text>
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
            {/* Inline field error below the input */}
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
                placeholder="••••••••"
                placeholderTextColor="#5A4080"
                value={password}
                onChangeText={(t) => { setPassword(t); setFieldErrors(e => ({ ...e, password: "" })); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              {/* Eye icon toggles password visibility */}
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

            {/* ── Remember me toggle + Forgot password link ── */}
            <View style={styles.rowBetween}>
              <TouchableOpacity onPress={() => setRemember(!remember)} style={styles.rememberRow}>
                {/* Custom toggle switch UI */}
                <View style={[styles.toggle, remember && styles.toggleOn]}>
                  {remember && <View style={styles.toggleDot} />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* ── Sign in button ── */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={["#7B2FBE", "#FF3CAC"]}
                style={styles.btn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Sign up link ── */}
            <View style={styles.linkRow}>
              <Text style={styles.linkLabel}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={styles.linkAction}> Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* ── Divider "or" ── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Guest mode button ── */}
            <TouchableOpacity
              style={styles.guestBtn}
              onPress={() => { loginAsGuest(); router.replace("/(tabs)/home"); }}
              activeOpacity={0.75}
            >
              <Feather name="user" size={16} color="#7777AA" />
              <Text style={styles.guestText}>Play as Guest</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll:    { alignItems: "center", flexGrow: 1 },

  logoArea:  { alignItems: "center", marginBottom: 24 },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
    marginTop: 10,
    textShadowColor: "#C77DFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  appSub: {
    fontSize: 13,
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
    borderColor: "rgba(196, 119, 255, 0.3)",
    padding: 28,
    shadowColor: "#7B2FBE",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
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
    borderColor: "rgba(196,119,255,0.25)",
    paddingHorizontal: 14,
    height: 50,
  },
  input:  { flex: 1, color: "#FFFFFF", fontSize: 15 },
  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 22,
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(196,119,255,0.3)",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: "rgba(123,47,190,0.6)",
    borderColor: "#C77DFF",
    alignItems: "flex-end",
  },
  toggleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#C77DFF",
  },
  rememberText: { fontSize: 13, color: "#B09AC0" },
  forgotText:   { fontSize: 13, color: "#4CC9F0", fontWeight: "600" },

  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF3CAC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 },

  linkRow:    { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
  linkLabel:  { fontSize: 13, color: "#8A6AAA" },
  linkAction: { fontSize: 13, color: "#C77DFF", fontWeight: "700" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: 20, gap: 10 },
  dividerLine:{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  dividerText:{ fontSize: 12, color: "#5A5A8A", fontWeight: "600" },

  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(119,119,170,0.3)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  guestText: { fontSize: 14, fontWeight: "700", color: "#7777AA", letterSpacing: 0.5 },
});
