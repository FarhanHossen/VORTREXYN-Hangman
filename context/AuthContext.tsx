/**
 * context/AuthContext.tsx
 *
 * Firebase Authentication context for VORTREXYN Hangman.
 *
 * Provides a single React context that any component can consume via the
 * `useAuth()` hook.  The context encapsulates:
 *   - The currently signed-in Firebase `User` (or null when signed out).
 *   - A guest-mode flag so players can try the game without an account.
 *   - Async helpers for sign-in, sign-up, sign-out, password reset, and
 *     account deletion.
 *   - "Remember me" behaviour backed by AsyncStorage so the last email
 *     address is pre-filled on the login screen after the app restarts.
 *
 * Firestore interaction:
 *   On sign-up a document is written to `users/{uid}` containing the
 *   username, email, creation timestamp, and zeroed-out stats object.
 *   On account deletion the Firestore document is removed first, then
 *   the Firebase Auth record, to avoid orphaned data.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  User,
} from "firebase/auth";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "@/lib/firebase";

/** AsyncStorage key used to persist the "remember me" email across restarts. */
const REMEMBER_KEY = "@vortrexyn_remembered_email";

/** Shape of the value provided by AuthContext to all consumers. */
interface AuthContextType {
  /** Currently authenticated Firebase user, or null if signed out. */
  user: User | null;
  /** True when the user chose "Play as Guest" — no Firebase account involved. */
  isGuest: boolean;
  /** True while the initial auth-state check is still in progress. */
  loading: boolean;
  /** Sign in with email and password.  Persists the email if `remember` is true. */
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  /** Create a new Firebase account and matching Firestore user document. */
  signup: (username: string, email: string, password: string) => Promise<void>;
  /** Sign out the current user (or clear guest mode if playing as guest). */
  logout: () => Promise<void>;
  /** Enter guest mode without creating an account. */
  loginAsGuest: () => void;
  /** Permanently delete the Firebase Auth record and Firestore user document. */
  deleteAccount: () => Promise<void>;
  /** Send a password-reset email via Firebase Auth. */
  forgotPassword: (email: string) => Promise<void>;
  /** The email address saved by the last "remember me" sign-in (may be empty). */
  rememberedEmail: string;
}

/** The context object — seeded with an empty object cast so TypeScript is happy. */
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/**
 * AuthProvider
 *
 * Wrap the entire app with this provider (in `_layout.tsx`) so every screen
 * can access auth state via `useAuth()`.
 *
 * On mount it:
 *  1. Reads any previously saved email from AsyncStorage (for "remember me").
 *  2. Subscribes to Firebase's `onAuthStateChanged` listener which fires
 *     immediately with the current auth state and then again on every
 *     sign-in / sign-out event.  The unsubscribe function is returned from
 *     useEffect so the listener is cleaned up when the provider unmounts.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [isGuest, setIsGuest]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState("");

  useEffect(() => {
    // Restore the remembered email so the login field can be pre-filled.
    AsyncStorage.getItem(REMEMBER_KEY).then((email) => {
      if (email) setRememberedEmail(email);
    });

    // Listen for Firebase auth state changes (sign in / sign out / token refresh).
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // A real Firebase sign-in always clears guest mode.
      if (u) setIsGuest(false);
      // Mark the initial auth check as complete so screens can render.
      setLoading(false);
    });

    // Return the unsubscribe function so the listener is removed on unmount.
    return unsub;
  }, []);

  /**
   * login
   * Signs in with Firebase email/password.
   * If `remember` is true, the email is saved to AsyncStorage so it
   * appears pre-filled next time the login screen opens.
   */
  async function login(email: string, password: string, remember: boolean) {
    await signInWithEmailAndPassword(auth, email, password);
    setIsGuest(false);
    if (remember) {
      await AsyncStorage.setItem(REMEMBER_KEY, email);
    } else {
      // User un-ticked "remember me" — remove any previously saved email.
      await AsyncStorage.removeItem(REMEMBER_KEY);
    }
    setRememberedEmail(remember ? email : "");
  }

  /**
   * signup
   * Creates a new Firebase Auth user, sets their display name, then writes
   * an initial Firestore document at `users/{uid}` with zeroed stats.
   * The stats object tracks wins/losses/streak/bestStreak for Firestore sync.
   */
  async function signup(username: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Set the display name so it's available on the User object immediately.
    await updateProfile(cred.user, { displayName: username });
    // Create the Firestore user record.  Stats start at zero.
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      username,
      email,
      createdAt: serverTimestamp(),
      stats: { wins: 0, losses: 0, streak: 0, bestStreak: 0 },
    });
    setIsGuest(false);
  }

  /**
   * logout
   * If the user is in guest mode, simply clear the guest flag.
   * If they have a real account, call Firebase signOut.
   */
  async function logout() {
    if (isGuest) {
      setIsGuest(false);
      return;
    }
    await signOut(auth);
  }

  /**
   * deleteAccount
   * Permanently removes the player's data.
   * Order matters: delete the Firestore document first, then the Auth account.
   * If we deleted Auth first and Firestore failed, the user would be signed
   * out with no way to retry the Firestore deletion.
   */
  async function deleteAccount() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    // 1. Remove Firestore user document (game stats, username, etc.).
    await deleteDoc(doc(db, "users", currentUser.uid));
    // 2. Clear the stored "remember me" email so it doesn't reappear.
    await AsyncStorage.removeItem(REMEMBER_KEY);
    // 3. Delete the Firebase Authentication record.
    await deleteUser(currentUser);
  }

  /**
   * loginAsGuest
   * Sets the guest flag so the app lets the user play without an account.
   * Guest sessions are in-memory only — no Firestore writes, no leaderboard.
   */
  function loginAsGuest() {
    setIsGuest(true);
  }

  /**
   * forgotPassword
   * Triggers Firebase to send a password-reset email to the given address.
   * Firebase handles the email delivery and reset link generation.
   */
  async function forgotPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider
      value={{ user, isGuest, loading, login, signup, logout, loginAsGuest, deleteAccount, forgotPassword, rememberedEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth
 * Convenience hook — call this in any component to access the full auth API
 * and current user state without importing the context directly.
 */
export const useAuth = () => useContext(AuthContext);
