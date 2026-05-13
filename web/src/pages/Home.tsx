/**
 * pages/Home.tsx
 *
 * Landing page for the VORTREXYN Hangman marketing website.
 *
 * ── Sections (top → bottom) ──────────────────────────────────────────────
 *  1. Stars background — 80 randomly placed twinkling white dots (CSS animation).
 *  2. Nav bar — logo, Features anchor link, Privacy page link, Download button.
 *  3. Hero — animated orbital V logo, app title, tagline, App Store + Android CTA.
 *  4. Features grid — 6 feature cards rendered from the FEATURES array.
 *  5. CTA banner — "Ready to guess your way to the stars?" with Download button.
 *  6. Footer — Privacy Policy link, support email, copyright, domain.
 *
 * ── OrbitalRing component ────────────────────────────────────────────────
 * A pure-CSS spinning ring rendered as an absolutely positioned circle.
 * Three rings (200 px / 160 px / 120 px) spin at different speeds and
 * directions around the centre "V" logo, creating a planet-orbit effect.
 * Controlled by the `spin-slow` keyframe defined in index.css.
 *
 * ── Stars component ──────────────────────────────────────────────────────
 * Renders 80 div elements with random size, position, opacity, and
 * animation duration. The `.star` class in index.css applies the
 * twinkle keyframe. Stars are fixed-position so they don't scroll.
 *
 * ── App Store links ──────────────────────────────────────────────────────
 * Both the hero "App Store" button and the CTA "Download Free" button link
 * directly to the Apple App Store listing. All external links use
 * target="_blank" rel="noopener noreferrer" for security.
 */
import { useEffect, useRef } from "react";
import { Link } from "wouter";

function Stars() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            width: Math.random() * 2.5 + 0.5 + "px",
            height: Math.random() * 2.5 + 0.5 + "px",
            top: Math.random() * 100 + "%",
            left: Math.random() * 100 + "%",
            animationDuration: Math.random() * 3 + 2 + "s",
            animationDelay: Math.random() * 4 + "s",
            opacity: Math.random() * 0.7 + 0.3,
          }}
        />
      ))}
    </div>
  );
}

function OrbitalRing({ size, color, duration, reverse }: { size: number; color: string; duration: number; reverse?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        animation: `spin-slow ${duration}s linear infinite ${reverse ? "reverse" : ""}`,
        opacity: 0.6,
        boxShadow: `0 0 15px ${color}40`,
      }}
    />
  );
}

const FEATURES = [
  { emoji: "🧠", title: "4 Difficulty Levels", desc: "Easy, Medium, Hard, and Extreme — challenge grows with you" },
  { emoji: "🌌", title: "8 Word Categories", desc: "Animals, Food, Space, Nature, Sports, Vehicles & more — with emoji hints!" },
  { emoji: "🏆", title: "Leaderboard", desc: "Compete globally by win streak — climb the cosmic rankings" },
  { emoji: "✨", title: "Animated Cosmic Art", desc: "Animated hangman, neon keyboard, star confetti celebrations" },
  { emoji: "👤", title: "Guest Mode", desc: "Play immediately without signing up — no friction" },
  { emoji: "🔥", title: "Win Streaks", desc: "Track your best streaks and session stats per difficulty" },
];

const SCREENSHOTS = [
  { label: "Splash Screen", bg: "from-purple-900 to-indigo-900" },
  { label: "Gameplay", bg: "from-indigo-900 to-blue-900" },
  { label: "Leaderboard", bg: "from-blue-900 to-purple-900" },
];

export default function Home() {
  return (
    <div style={{ background: "#08001C", minHeight: "100vh", overflowX: "hidden" }}>
      <Stars />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(8,0,28,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(192,132,252,0.15)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #FFD700, #FF6B6B, #C084FC)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#08001C",
          }}>V</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>VORTREXYN Hangman</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="#features" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14 }}>Features</a>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14 }}>Privacy</Link>
          <a
            href="https://apps.apple.com/au/app/vortrexyn-hangman/id6767557504"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "linear-gradient(135deg, #C084FC, #818CF8)",
              color: "#fff", textDecoration: "none", padding: "8px 18px",
              borderRadius: 20, fontSize: 13, fontWeight: 700,
            }}
          >Download</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 100, textAlign: "center", position: "relative" }}>
        {/* Cosmic orb */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: 48 }}>
          <div className="float-animation" style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
            <OrbitalRing size={200} color="#22D3EE" duration={12} />
            <OrbitalRing size={160} color="#C084FC" duration={9} reverse />
            <OrbitalRing size={120} color="#FF6B6B" duration={7} />
            <div className="pulse-glow" style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 90, height: 90, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFD700, #FF6B6B, #C084FC)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 42, fontWeight: 900, color: "#08001C",
            }}>V</div>
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
          <span className="gradient-text">VORTREXYN</span>
          <br />
          <span style={{ color: "#fff" }}>Hangman</span>
        </h1>
        <p style={{ fontSize: 20, color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6 }}>
          The cosmic word-guessing adventure built for kids. Guess letters, save the astronaut, and climb the galaxy leaderboard!
        </p>

        <div id="download" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="https://apps.apple.com/au/app/vortrexyn-hangman/id6767557504"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #C084FC, #818CF8)",
              color: "#fff", textDecoration: "none",
              padding: "14px 28px", borderRadius: 14, fontWeight: 700, fontSize: 16,
              boxShadow: "0 8px 32px rgba(192,132,252,0.4)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            App Store
          </a>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.5)", padding: "14px 28px",
            borderRadius: 14, fontSize: 14,
          }}>
            Android — Coming Soon
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, marginBottom: 12 }}>
          <span className="gradient-text">Everything kids love</span>
        </h2>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginBottom: 60, fontSize: 16 }}>
          Designed from the ground up to be fun, safe, and educational.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card neon-border" style={{ padding: 28, borderRadius: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{f.emoji}</div>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: "#fff" }}>{f.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          background: "linear-gradient(135deg, rgba(192,132,252,0.15), rgba(34,211,238,0.1))",
          border: "1px solid rgba(192,132,252,0.25)",
          borderRadius: 28, padding: "60px 40px",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, marginBottom: 16, color: "#fff" }}>
            Ready to guess your way to the stars?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 32 }}>
            Free to play. Available now on iOS. Android coming soon.
          </p>
          <a
            href="https://apps.apple.com/au/app/vortrexyn-hangman/id6767557504"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #FFD700, #FF6B6B)",
              color: "#08001C", textDecoration: "none",
              padding: "16px 40px", borderRadius: 16, fontWeight: 900, fontSize: 17,
              boxShadow: "0 8px 32px rgba(255,215,0,0.3)",
            }}
          >
            Download Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 24px", textAlign: "center",
        color: "rgba(255,255,255,0.3)", fontSize: 13,
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Privacy Policy</Link>
          <a href="mailto:support@vortrexynhangman.app" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Support</a>
        </div>
        <p>© {new Date().getFullYear()} VORTREXYN Hangman. All rights reserved.</p>
        <p style={{ marginTop: 4 }}>vortrexynhangman.app</p>
      </footer>
    </div>
  );
}
