import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function Login({ onLogin, onGuest }) {
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

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", color: "white",
      padding: "20px",
    }}>
      <h1 style={{ fontSize: "32px", letterSpacing: "2px", marginBottom: "8px" }}>🎬 SWOCHI</h1>
      <p style={{ color: "#888", marginBottom: "40px" }}>Découvre ton prochain film</p>

      <div style={{
        background: "#1a1a1a", borderRadius: "16px",
        padding: "32px", width: "100%", maxWidth: "320px",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>
          {isRegister ? "Créer un compte" : "Se connecter"}
        </h2>

        {/* Champ email */}
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

        {/* Champ mot de passe */}
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
          background: "#22c55e", color: "white",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "16px",
          fontWeight: "bold", cursor: "pointer",
        }}>
          {isRegister ? "Créer le compte" : "Se connecter"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, height: "1px", background: "#2a2a2a" }} />
          <span style={{ color: "#444", fontSize: "12px" }}>ou</span>
          <div style={{ flex: 1, height: "1px", background: "#2a2a2a" }} />
        </div>

        <button onClick={handleGoogle} style={{
          background: "white", color: "#111",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "15px",
          fontWeight: "bold", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
        }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden="true" width="20" />
          Continuer avec Google
        </button>

        <button
          onClick={() => setIsRegister(r => !r)}
          style={{
            background: "none", border: "none",
            color: "#666", fontSize: "13px",
            textAlign: "center", cursor: "pointer",
            padding: "4px 0", textDecoration: "underline",
          }}
        >
          {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
        </button>
      </div>

      {/* Mode invité */}
      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <p style={{ color: "#444", fontSize: "13px", marginBottom: "10px" }}>
          Pas prêt à créer un compte ?
        </p>
        <button onClick={onGuest} style={{
          background: "transparent",
          border: "1px solid #2a2a2a",
          color: "#666", borderRadius: "50px",
          padding: "10px 24px", fontSize: "14px",
          cursor: "pointer",
        }}>
          Continuer sans compte →
        </button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: "13px", color: "#888" };

const inputStyle = {
  background: "#2a2a2a", border: "1px solid #333",
  borderRadius: "8px", padding: "12px",
  color: "white", fontSize: "16px", outline: "none",
};

export default Login;
