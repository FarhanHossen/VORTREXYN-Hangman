/**
 * context/GameContext.tsx
 *
 * Core game-state management for VORTREXYN Hangman.
 *
 * All game logic lives here so it is completely decoupled from the UI.
 * Any screen or component can read game state and dispatch actions via the
 * `useGame()` hook without prop-drilling.
 *
 * State structure (`GameState`):
 *   word        — the secret word the player must guess (uppercase).
 *   hint        — a short clue displayed after 2 wrong guesses.
 *   emoji       — a single emoji representing the word, shown in the result modal.
 *   category    — the word's category label (e.g. "Animals", "Food").
 *   difficulty  — current difficulty tier ("Easy" | "Medium" | "Hard" | "Extreme" | "").
 *   level       — level within the current difficulty (advances on win, resets on loss).
 *   guessed     — Set of letters the player has already pressed.
 *   wrongCount  — number of incorrect guesses so far (max = MAX_WRONG = 6).
 *   status      — current game phase: "playing" | "won" | "lost".
 *   wins        — total wins this session (persisted to Firestore for signed-in users).
 *   losses      — total losses this session.
 *   streak      — current consecutive-win streak.
 *   bestStreak  — all-time best streak (used by the leaderboard).
 *
 * Firestore sync:
 *   Two fire-and-forget helpers (`syncStats` and `syncDifficultyResult`) write
 *   updated stats to Firestore whenever a game ends.  The writes are best-effort
 *   (errors are silently swallowed with `.catch(() => {})`) so a network blip
 *   never blocks the UI.  Guest users (no `auth.currentUser`) are silently skipped.
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  getRandomWord, getWordFromCategory,
  getWordByDifficultyAndLevel, MAX_WRONG, WordEntry,
} from "@/constants/words";

/** Complete snapshot of the current game. */
interface GameState {
  word: string;
  hint: string;
  emoji: string;
  category: string;
  difficulty: string;
  level: number;
  guessed: Set<string>;
  wrongCount: number;
  status: "playing" | "won" | "lost";
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
}

/** Everything exposed to consumers via `useGame()`. */
interface GameContextValue extends GameState {
  /** Record the player tapping a letter key. */
  guessLetter: (letter: string) => void;
  /** Start a fresh game, preserving stats and advancing/resetting the level. */
  newGame: () => void;
  /** Start a free-play game from a specific word category. */
  startCategory: (categoryLabel: string) => void;
  /** Start a difficulty-mode game from level 1 of the given tier. */
  startDifficulty: (difficultyLabel: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/**
 * pickWord
 * Selects the next word to guess.
 *   - Difficulty mode: picks a word appropriate for the given difficulty + level.
 *   - Free-play (difficulty = ""): picks a completely random word.
 */
function pickWord(difficulty: string, level: number): WordEntry & { category: string } {
  if (difficulty) return getWordByDifficultyAndLevel(difficulty, level);
  return getRandomWord();
}

/**
 * initState
 * Builds a fresh `GameState` snapshot, picking a new word and resetting all
 * per-round fields (guessed, wrongCount, status) while preserving the running
 * stats (wins, losses, streak, bestStreak) from the previous round.
 */
function initState(
  wins = 0, losses = 0, streak = 0, bestStreak = 0,
  difficulty = "", level = 1,
): GameState {
  const entry = pickWord(difficulty, level);
  return {
    word: entry.word,
    hint: entry.hint,
    emoji: entry.emoji,
    category: entry.category,
    difficulty,
    level,
    guessed: new Set(),
    wrongCount: 0,
    status: "playing",
    wins,
    losses,
    streak,
    bestStreak,
  };
}

/**
 * syncStats
 * Writes aggregate stats (wins, losses, streak, bestStreak) to the top-level
 * `stats` map on the user's Firestore document.
 * Called at the end of every game for signed-in users.
 * Silently no-ops for guests (uid is undefined).
 */
function syncStats(wins: number, losses: number, streak: number, bestStreak: number) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  updateDoc(doc(db, "users", uid), {
    "stats.wins":       wins,
    "stats.losses":     losses,
    "stats.streak":     streak,
    "stats.bestStreak": bestStreak,
  }).catch(() => {}); // fire-and-forget — never block the UI on a network error
}

/**
 * syncDifficultyResult
 * Writes per-difficulty stats (wins/losses/bestStreak) to the nested
 * `stats.<difficulty>` map on the user's Firestore document.
 *
 * Uses Firestore `increment(1)` for wins/losses so concurrent updates from
 * other devices don't overwrite each other.  bestStreak is set to the current
 * value (not incremented) because it's a high-water mark, not a counter.
 *
 * Called only when playing in difficulty mode (difficulty !== "").
 */
function syncDifficultyResult(difficulty: string, won: boolean, newBestStreak: number) {
  const uid = auth.currentUser?.uid;
  if (!uid || !difficulty) return;
  // Firestore path uses lowercase difficulty key (e.g. "easy", "extreme").
  const key = difficulty.toLowerCase();
  const updates: Record<string, unknown> = won
    ? {
        [`stats.${key}.wins`]:       increment(1),
        [`stats.${key}.bestStreak`]: newBestStreak,
      }
    : { [`stats.${key}.losses`]: increment(1) };
  updateDoc(doc(db, "users", uid), updates).catch(() => {});
}

/**
 * GameProvider
 * Wraps the app (inside `_layout.tsx`) and keeps the authoritative game state.
 * All state transitions happen inside `setState` updater functions so they are
 * always based on the latest state snapshot, avoiding stale-closure bugs.
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => initState());

  /**
   * guessLetter
   * Core game action — called when the player taps a letter key.
   *
   * Logic:
   *  1. Bail out early if the game is not in progress or the letter was
   *     already guessed (prevents double-processing).
   *  2. Add the letter to the `guessed` Set.
   *  3. Count the wrong guess if the letter is not in the word.
   *  4. Check win condition: all unique letters in the word have been guessed.
   *  5. Check loss condition: wrongCount has reached MAX_WRONG (6).
   *  6. If the game just ended, update wins/losses/streak in local state
   *     immediately (so the Result Modal shows the right numbers right away)
   *     and fire the Firestore sync helpers in the background.
   */
  const guessLetter = useCallback((letter: string) => {
    setState((prev) => {
      // Ignore taps when the game is already over.
      if (prev.status !== "playing") return prev;
      // Ignore if this letter was already pressed.
      if (prev.guessed.has(letter)) return prev;

      const newGuessed = new Set(prev.guessed);
      newGuessed.add(letter);

      const isWrong    = !prev.word.includes(letter);
      const newWrong   = isWrong ? prev.wrongCount + 1 : prev.wrongCount;
      // Win if every character of the secret word is now in `guessed`.
      const allGuessed = prev.word.split("").every(l => newGuessed.has(l));

      let status: GameState["status"] = "playing";
      if (allGuessed)                  status = "won";
      else if (newWrong >= MAX_WRONG)  status = "lost";

      // Copy mutable counters so we can update them before returning new state.
      let { wins, losses, streak, bestStreak } = prev;

      if (status === "won") {
        wins       = prev.wins + 1;
        streak     = prev.streak + 1;
        bestStreak = Math.max(prev.bestStreak, streak);
        // Sync aggregate stats and per-difficulty win to Firestore.
        syncStats(wins, losses, streak, bestStreak);
        syncDifficultyResult(prev.difficulty, true, bestStreak);
      } else if (status === "lost") {
        losses = prev.losses + 1;
        streak = 0; // break the streak on a loss
        syncStats(wins, losses, streak, bestStreak);
        syncDifficultyResult(prev.difficulty, false, bestStreak);
      }

      return { ...prev, guessed: newGuessed, wrongCount: newWrong, status, wins, losses, streak, bestStreak };
    });
  }, []);

  /**
   * newGame
   * Starts the next round, keeping all accumulated stats.
   *
   * Level progression rules:
   *  - WIN  → advance to the next level within the same difficulty.
   *  - LOSS → reset back to level 1 so the player retries the difficulty from scratch.
   */
  const newGame = useCallback(() => {
    setState((prev) => {
      const nextLevel = prev.status === "won" ? prev.level + 1 : 1;
      return initState(prev.wins, prev.losses, prev.streak, prev.bestStreak, prev.difficulty, nextLevel);
    });
  }, []);

  /**
   * startCategory
   * Begins a free-play round using a random word from the specified category
   * (e.g. "Animals", "Food", "Space").  Difficulty is cleared so the game
   * does not apply difficulty-tier restrictions.
   */
  const startCategory = useCallback((categoryLabel: string) => {
    setState((prev) => {
      const entry = getWordFromCategory(categoryLabel);
      return {
        word: entry.word, hint: entry.hint, emoji: entry.emoji,
        category: entry.category, difficulty: "", level: 1,
        guessed: new Set(), wrongCount: 0, status: "playing",
        wins: prev.wins, losses: prev.losses,
        streak: prev.streak, bestStreak: prev.bestStreak,
      };
    });
  }, []);

  /**
   * startDifficulty
   * Begins a difficulty-mode game from level 1 of the given tier
   * (e.g. "Easy", "Medium", "Hard", "Extreme").
   * Stats are carried over from the previous session so the counters are
   * continuous across difficulty switches.
   */
  const startDifficulty = useCallback((difficultyLabel: string) => {
    setState((prev) => {
      const entry = getWordByDifficultyAndLevel(difficultyLabel, 1);
      return {
        word: entry.word, hint: entry.hint, emoji: entry.emoji,
        category: entry.category, difficulty: difficultyLabel, level: 1,
        guessed: new Set(), wrongCount: 0, status: "playing",
        wins: prev.wins, losses: prev.losses,
        streak: prev.streak, bestStreak: prev.bestStreak,
      };
    });
  }, []);

  return (
    <GameContext.Provider value={{ ...state, guessLetter, newGame, startCategory, startDifficulty }}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * useGame
 * Hook that returns the full `GameContextValue`.
 * Throws a descriptive error if called outside a `<GameProvider>` tree,
 * making accidental misuse immediately obvious during development.
 */
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
}
