import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function Login({ onLogin, onGuest, onFermer, asPage }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError]       = useState("");

  async function handleGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (e) {
      setError("Erreur Google : " + e.message);
    }
  }

  async function handleSubmit() {
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (e) {
      setError("Erreur : " + e.message);
    }
  }

  const isModal = !!onFermer && !asPage;

  const wrapper = isModal ? {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "24px",
    animation: "fonduIn 0.2s ease",
  } : {
    minHeight: "100vh", background: "var(--bg)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    color: "var(--text)", padding: "24px",
  };

  return (
    <div style={wrapper} onClick={isModal ? (e => { if (e.target === e.currentTarget) onFermer(); }) : undefined}>
      {/* Logo — masqué en modal */}
      {!isModal && (
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1 style={{ fontSize: "34px", letterSpacing: "3px", margin: "0 0 8px", color: "var(--text)" }}>
            🎬 SWOCHI
          </h1>
          <p style={{ color: "var(--text-3)", margin: 0, fontSize: "14px" }}>Découvre ton prochain film</p>
        </div>
      )}

      {/* Carte formulaire */}
      <div style={{
        background: "var(--surface)", borderRadius: "22px",
        padding: "32px 28px", width: "100%", maxWidth: "340px",
        display: "flex", flexDirection: "column", gap: "16px",
        boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)",
        position: "relative",
      }}>
        {isModal && (
          <button onClick={onFermer} style={{
            position: "absolute", top: "14px", right: "14px",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            color: "var(--text-3)", borderRadius: "50%",
            width: "30px", height: "30px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px",
          }}>✕</button>
        )}
        <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "700", color: "var(--text)" }}>
          {isRegister ? "Créer un compte" : "Se connecter"}
        </h2>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="login-email" style={labelStyle}>Adresse e-mail</label>
          <input
            id="login-email"
            type="email"
            placeholder="exemple@mail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        {/* Mot de passe */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="login-password" style={labelStyle}>Mot de passe</label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            autoComplete={isRegister ? "new-password" : "current-password"}
            style={inputStyle}
          />
        </div>

        {error && (
          <p role="alert" style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{error}</p>
        )}

        <button onClick={handleSubmit} style={{
          background: "var(--purple)", color: "white",
          border: "none", borderRadius: "50px",
          padding: "15px", fontSize: "16px",
          fontWeight: "700", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(29,99,205,0.35)",
          marginTop: "2px",
        }}>
          {isRegister ? "Créer le compte" : "Se connecter"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--divider)" }} />
          <span style={{ color: "var(--text-4)", fontSize: "12px" }}>ou</span>
          <div style={{ flex: 1, height: "1px", background: "var(--divider)" }} />
        </div>

        <button onClick={handleGoogle} style={{
          background: "#ffffff", color: "#1a1a1a",
          border: "1px solid rgba(0,0,0,0.12)", borderRadius: "50px",
          padding: "13px", fontSize: "15px",
          fontWeight: "600", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden="true" width="18" />
          Continuer avec Google
        </button>

        <button
          onClick={() => setIsRegister(r => !r)}
          style={{
            background: "none", border: "1px solid var(--border-2)",
            color: "var(--text-2)", fontSize: "13px", borderRadius: "50px",
            textAlign: "center", cursor: "pointer",
            padding: "10px 0", fontWeight: "500",
          }}
        >
          {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
        </button>
      </div>

      {/* Mode invité — uniquement sur la page de démarrage */}
      {!isModal && (
        <div style={{ marginTop: "28px", textAlign: "center" }}>
          <p style={{ color: "var(--text-4)", fontSize: "13px", marginBottom: "12px" }}>
            Pas prêt à créer un compte ?
          </p>
          <button onClick={onGuest} style={{
            background: "transparent",
            border: "1px solid var(--border-2)",
            color: "var(--text-3)", borderRadius: "50px",
            padding: "11px 26px", fontSize: "14px",
            cursor: "pointer",
          }}>
            Continuer sans compte →
          </button>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: "13px", color: "var(--text)", fontWeight: "500" };

const inputStyle = {
  background: "var(--input-bg)", border: "1px solid var(--input-border)",
  borderRadius: "10px", padding: "13px 14px",
  color: "var(--text)", fontSize: "16px", outline: "none",
};

export default Login;
