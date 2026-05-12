/**
 * constants/colors.ts
 *
 * Central palette for the VORTREXYN Hangman app.
 *
 * Keeping all colours in one place means:
 *  - Design changes only need to happen here, not scattered across files.
 *  - Components that import `colors` automatically pick up theme updates.
 *
 * Note: The main game screens (game.tsx, home.tsx, leaderboard.tsx) use their
 * own inline difficulty-keyed accent palettes so each difficulty level has its
 * own distinct colour identity.  This `colors` object is used by the Result
 * Modal and other shared UI elements.
 */
const colors = {
  /** Soft lavender — used as the general screen background. */
  background: "#F0E6FF",

  /** Top colour of the gradient background on auth screens. */
  backgroundGradientStart: "#C084FC",

  /** Bottom colour of the gradient background on auth screens. */
  backgroundGradientEnd: "#818CF8",

  /** Pure white — card / panel backgrounds. */
  card: "#FFFFFF",

  /** Purple shadow cast beneath floating cards. */
  cardShadow: "#C084FC",

  /** Deep purple — primary body text colour. */
  text: "#3B1F6E",

  /** Muted purple — secondary / hint text. */
  textMuted: "#9B7EC8",

  /** White — text on dark or coloured backgrounds. */
  textLight: "#FFFFFF",

  /** Hot pink — primary interactive colour (buttons, highlights). */
  primary: "#FF6B9D",

  /** Darker shade of primary, used for pressed states. */
  primaryDark: "#E0457A",

  /** Sunny yellow — secondary accent (stars, highlights). */
  secondary: "#FFD93D",

  /** Darker shade of secondary. */
  secondaryDark: "#E6B800",

  /** Green — correct-guess accent and win-state indicators. */
  accent: "#6BCB77",

  /** Darker shade of accent, used for pressed states. */
  accentDark: "#4AAF56",

  /** Red — wrong-guess and error states. */
  danger: "#FF5757",

  /** Darker shade of danger, used for pressed states. */
  dangerDark: "#E03030",

  /** White — fill colour for an unused letter key. */
  keyDefault: "#FFFFFF",

  /** Purple border on unused letter keys. */
  keyDefaultBorder: "#C084FC",

  /** Red — fill colour for a guessed-wrong letter key. */
  keyUsed: "#FF5757",

  /** Green — fill colour for a correctly-guessed letter key. */
  keyCorrect: "#6BCB77",

  /** Light lavender — background tint behind the keyboard area. */
  keyBg: "#EDE0FF",

  /** Purple — gallows structure colour in the hangman drawing. */
  gallows: "#7C3AED",

  /** Pink — hangman body parts colour. */
  hangman: "#FF6B9D",

  /** Pale lavender — empty (un-guessed) letter tile background. */
  letterBlank: "#E9D8FF",

  /** Purple — border on empty letter tiles. */
  letterBorder: "#C084FC",

  /** Deep purple — filled (correctly-guessed) letter tile background. */
  letterFilled: "#7C3AED",

  /** Gold yellow — star / streak icon colour. */
  star: "#FFD93D",

  /** Start colour of the top header gradient. */
  headerGradientStart: "#7C3AED",

  /** End colour of the top header gradient. */
  headerGradientEnd: "#A855F7",

  /** Light green background behind a "correct" result card. */
  correctBg: "#D1FAD7",

  /** Light red background behind a "wrong" result card. */
  wrongBg: "#FFE4E4",
};

export default colors;
