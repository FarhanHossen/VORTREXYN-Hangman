import { Link } from "wouter";

export default function NotFound() {
  return (
    <div style={{
      background: "#08001C", minHeight: "100vh", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: 24,
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🌌</div>
      <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, color: "#C084FC" }}>404</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, fontSize: 16 }}>
        This page got lost in the cosmos.
      </p>
      <Link href="/" style={{
        background: "linear-gradient(135deg, #C084FC, #818CF8)",
        color: "#fff", textDecoration: "none",
        padding: "12px 32px", borderRadius: 12, fontWeight: 700,
      }}>
        Go Home
      </Link>
    </div>
  );
}
