/**
 * pages/Privacy.tsx
 *
 * Privacy Policy page for VORTREXYN Hangman.
 *
 * ── Structure ────────────────────────────────────────────────────────────
 * A sticky nav bar links back to the Home page.
 * The body is a list of policy sections rendered from an inline array —
 * each section has a `title` and a `body` (multi-line plain text).
 * The `whiteSpace: "pre-line"` style preserves line breaks and bullet
 * characters (•) without needing HTML list elements.
 *
 * ── Sections covered ─────────────────────────────────────────────────────
 *  1. Overview
 *  2. Information We Collect (account, game data, usage, guest mode)
 *  3. Children's Privacy (COPPA compliance)
 *  4. How We Use Your Information
 *  5. Firebase & Third-Party Services
 *  6. Data Retention & Deletion
 *  7. Security
 *  8. Your Rights (GDPR-aligned)
 *  9. Changes to This Policy
 * 10. Contact Us
 *
 * ── Live URL ─────────────────────────────────────────────────────────────
 * https://vortrexynhangman.app/privacy
 * This URL is used as the privacyPolicyUrl in app.json for the App Store.
 */
import { Link } from "wouter";

export default function Privacy() {
  const updated = "May 8, 2026";
  return (
    <div style={{ background: "#08001C", minHeight: "100vh", color: "#fff" }}>
      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,0,28,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(192,132,252,0.15)",
        padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #FFD700, #FF6B6B, #C084FC)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#08001C",
          }}>V</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>VORTREXYN Hangman</span>
        </Link>
        <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>← Back to Home</Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "100px 24px 80px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8, background: "linear-gradient(135deg, #C084FC, #22D3EE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 48, fontSize: 14 }}>
          Last updated: {updated}
        </p>

        {[
          {
            title: "Overview",
            body: `VORTREXYN Hangman ("we", "us", or "our") is committed to protecting the privacy of all users, especially children. This Privacy Policy explains what information we collect, how we use it, and what rights you have regarding your data. By using VORTREXYN Hangman, you agree to this policy.`,
          },
          {
            title: "Information We Collect",
            body: `We collect only the information necessary to provide our service:

• Account Information: If you create an account, we collect your email address and a display name of your choosing.
• Game Data: We store your game progress, difficulty preferences, win streaks, and high scores to power the leaderboard and profile features.
• Usage Data: Anonymous analytics such as which word categories are played most often, to improve the game experience.

Guest Mode: If you play as a guest, no account is created and no personally identifiable information is collected or stored on our servers. Game data is stored locally on your device only.`,
          },
          {
            title: "Children's Privacy (COPPA)",
            body: `VORTREXYN Hangman is designed for children and families. We take children's privacy very seriously.

• We do not knowingly collect personal information from children under 13 without verifiable parental consent.
• We do not display third-party advertising.
• We do not sell, rent, or share children's personal information with third parties for marketing purposes.
• Guest Mode is provided specifically so younger users can play without creating an account.

If you believe we have inadvertently collected information from a child under 13 without appropriate consent, please contact us immediately at privacy@vortrexynhangman.app and we will delete it promptly.`,
          },
          {
            title: "How We Use Your Information",
            body: `We use collected information to:
• Operate and improve the game
• Maintain the global leaderboard
• Store and sync your game progress across devices
• Respond to support requests
• Comply with legal obligations

We do not use your information for advertising or sell it to third parties.`,
          },
          {
            title: "Firebase & Third-Party Services",
            body: `We use Firebase (Google LLC) for authentication and data storage. Firebase may collect certain technical information as described in Google's Privacy Policy (policies.google.com/privacy). All data stored in Firebase is protected by Google's security infrastructure.`,
          },
          {
            title: "Data Retention & Deletion",
            body: `You may delete your account at any time from the Profile screen within the app. Deleting your account permanently removes all associated data from our servers within 30 days. Local device data (guest mode progress) can be cleared by uninstalling the app.

To request data deletion without accessing the app, email us at privacy@vortrexynhangman.app.`,
          },
          {
            title: "Security",
            body: `We implement industry-standard security measures to protect your information, including encrypted data transmission (HTTPS/TLS), secure authentication via Firebase, and access controls limiting who can view user data. No system is 100% secure; if you discover a security issue, please report it to privacy@vortrexynhangman.app.`,
          },
          {
            title: "Your Rights",
            body: `Depending on your location, you may have the right to:
• Access the personal data we hold about you
• Request correction of inaccurate data
• Request deletion of your data
• Withdraw consent at any time

To exercise any of these rights, contact us at privacy@vortrexynhangman.app.`,
          },
          {
            title: "Changes to This Policy",
            body: `We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last updated" date above and, where required by law, seeking fresh consent. Continued use of the app after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: "Contact Us",
            body: `If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:

Email: privacy@vortrexynhangman.app
Website: https://vortrexynhangman.app`,
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 48 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 800, marginBottom: 14,
              color: "#C084FC",
            }}>{section.title}</h2>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: 24,
            }}>
              <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontSize: 15, whiteSpace: "pre-line" }}>
                {section.body}
              </p>
            </div>
          </div>
        ))}

        <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #C084FC, #818CF8)",
            color: "#fff", textDecoration: "none",
            padding: "12px 32px", borderRadius: 12, fontWeight: 700, fontSize: 15,
          }}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
