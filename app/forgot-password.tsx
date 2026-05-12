/**
 * app/forgot-password.tsx
 *
 * Password-reset screen for VORTREXYN Hangman.
 *
 * Flow:
 *   1. User enters their email address.
 *   2. Taps "Send Reset Link".
 *   3. If the email field is empty → inline error, no Firebase call.
 *   4. Calls AuthContext.forgotPassword(email) → Firebase sends the email.
 *   5. On success: switches from the form view to a success view.
 *      The success view spring-animates a green ✓ checkmark in.
 *   6. "Try again" button on the success view resets `sent` back to false,
 *      returning to the form so the user can re-enter a different email.
 *   7. "Back to Sign In" link calls `router.back()` from either view.
 *
 * Firebase error mapping:
 *   "user-not-found" / "invalid-email" → "No account found with that email."
 *   "too-many-requests"                → "Too many requests. Please wait and try again."
 *   Other                              → "Failed to send reset email. Try again."
 *
 * Note: Firebase intentionally does NOT distinguish between "user not found"
 * and "wrong email format" in some SDK versions for privacy reasons.
 * Both map to the same friendly message.
 *
 * UI details:
 *   - Same cosmic gradient + star background as other auth screens.
 *   - Card with golden (#FFD93D) accent colour (distinct from login/signup
 *     which use pink/cyan) so users immediately know this is a different action.
 *   - Success state: spring-animated green circle with a Feather check icon.
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

/** 16 background stars — fewer than login/signup to keep the screen lighter. */
const NUM_STARS = 16;
const STAR_DATA = Array.from({ length: NUM_STARS }, (_, i) => ({
  left:  10 + (i * 61 + i * i * 11) % (SW - 20),
  top:   30 + (i * 83 + i * 17) % (SH - 60),
  size:  6 + (i * 4) % 10,
  delay: i * 250,
  color: ["#FFD93D", "#4CC9F0", "#FF3CAC", "#C77DFF", "#6BCB77", "#FFFFFF"][i % 6],
}));

/**
 * TwinkleStar — same pulsing star component as other auth screens.
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
 * ForgotPasswordScreen
 *
 * Two-state UI:
 *   `sent === false` → email input form.
 *   `sent === true`  → success confirmation view.
 */
export default function ForgotPasswordScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { forgotPassword } = useAuth();

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  /** Switches the card content to the success view when true. */
  const [sent, setSent]       = useState(false);

  // ── Animations ──────────────────────────────────────────────────────────
  const cardAnim  = useRef(new Animated.Value(60)).current; // card slide-up
  const cardOp    = useRef(new Animated.Value(0)).current;  // card fade-in
  const checkAnim = useRef(new Animated.Value(0)).current;  // success ✓ spring pop

  // Card entrance animation on mount.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 550, delay: 200, useNativeDriver: false }),
      Animated.timing(cardOp,   { toValue: 1, duration: 550, delay: 200, useNativeDriver: false }),
    ]).start();
  }, []);

  // Spring-animate the success checkmark when `sent` becomes true.
  useEffect(() => {
    if (sent) {
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 5 }).start();
    }
  }, [sent]);

  /**
   * handleReset
   * Validates the email field, then calls forgotPassword().
   * On success, sets `sent = true` to show the confirmation view.
   */
  async function handleReset() {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true); // switch to success state
    } catch (e: any) {
      const msg = e?.code ?? "";
      if (msg.includes("user-not-found") || msg.includes("invalid-email")) {
        setError("No account found with that email.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many requests. Please wait and try again.");
      } else {
        setError("Failed to send reset email. Try again.");
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

          <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOp }]}>

            {sent ? (
              /* ── Success state — shown after the email is sent ── */
              <View style={styles.successArea}>
                {/* Spring-animated green checkmark circle */}
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkAnim }] }]}>
                  <Feather name="check" size={36} color="#6BCB77" />
                </Animated.View>
                <Text style={styles.successTitle}>Check your inbox!</Text>
                <Text style={styles.successBody}>
                  We sent a password reset link to{"\n"}
                  {/* Show the email in cyan so it's clearly visible */}
                  <Text style={styles.successEmail}>{email}</Text>
                </Text>
                <Text style={styles.successHint}>
                  Didn't receive it? Check your spam folder or try again.
                </Text>
                {/* Reset the form so the user can try a different email */}
                <TouchableOpacity style={styles.retryBtn} onPress={() => setSent(false)}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ── Form state — email input + send button ── */
              <>
                {/* Key icon header */}
                <View style={styles.iconHeader}>
                  <LinearGradient colors={["#2E0060", "#7B2FBE"]} style={styles.iconBg}>
                    <Feather name="key" size={24} color="#FFD93D" />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a link to reset your password.
                </Text>

                {/* Error message from validation or Firebase */}
                {!!error && (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={14} color="#FF3CAC" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Email input */}
                <View style={styles.fieldLabel}>
                  <Feather name="mail" size={14} color="#C77DFF" />
                  <Text style={styles.labelText}>Email Address</Text>
                </View>
                <View style={[styles.inputWrap, { marginBottom: 24 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#5A4080"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Send reset link button — golden gradient to match the key icon */}
                <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient
                    colors={["#FFD93D", "#FF6B35"]}
                    style={styles.btn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <View style={styles.btnInner}>
                          <Feather name="send" size={16} color="#fff" />
                          <Text style={styles.btnText}>Send Reset Link</Text>
                        </View>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Back to sign-in link — visible in both form and success states */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
              <Feather name="arrow-left" size={14} color="#4CC9F0" />
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { alignItems: "center", flexGrow: 1 },

  logoArea: { alignItems: "center", marginBottom: 24 },
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
    borderColor: "rgba(255, 217, 61, 0.25)", // golden accent for this screen
    padding: 28,
    shadowColor: "#FFD93D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },

  iconHeader: { alignItems: "center", marginBottom: 16 },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title:    { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 13, color: "#8A6AAA", marginBottom: 20, textAlign: "center", lineHeight: 20 },

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

  fieldLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  labelText:  { fontSize: 12, fontWeight: "700", color: "#C77DFF", textTransform: "uppercase", letterSpacing: 1 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,217,61,0.2)",
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },

  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFD93D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText:  { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },

  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 22,
  },
  backText: { fontSize: 13, color: "#4CC9F0", fontWeight: "600" },

  /* ── Success state ── */
  successArea: { alignItems: "center", paddingVertical: 8 },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(107,203,119,0.15)",
    borderWidth: 2,
    borderColor: "#6BCB77",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 10, textAlign: "center" },
  successBody:  { fontSize: 14, color: "#B09AC0", textAlign: "center", lineHeight: 22, marginBottom: 12 },
  successEmail: { color: "#4CC9F0", fontWeight: "700" },
  successHint:  { fontSize: 12, color: "#6A5A80", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(196,119,255,0.4)",
  },
  retryText: { fontSize: 13, color: "#C77DFF", fontWeight: "600" },
});
