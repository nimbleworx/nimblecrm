"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.replace("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
        setMode("login");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>⚡ NimbleCRM</div>
          <div style={{ fontSize: 11, color: "#334155", letterSpacing: "1px", marginTop: 4 }}>AI-POWERED BY NIMBLEWORX</div>
        </div>

        <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 14, padding: "28px 24px", boxShadow: "0 24px 60px #00000099" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#E2E8F0", marginBottom: 22 }}>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </div>

          {message && (
            <div style={{ background: "#14532D22", border: "1px solid #22C55E44", borderRadius: 8, padding: "10px 14px", color: "#22C55E", fontSize: 13, marginBottom: 16 }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ background: "#7F1D1D22", border: "1px solid #EF444444", borderRadius: 8, padding: "10px 14px", color: "#EF4444", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, letterSpacing: "0.5px" }}>EMAIL</div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, letterSpacing: "0.5px" }}>PASSWORD</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"}
                required
                style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#64748B" }}>
            {mode === "login" ? (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }} style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>Sign up</button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
