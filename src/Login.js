import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

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
      fontFamily: "sans-serif", color: "white"
    }}>
      <h1 style={{ fontSize: "32px", letterSpacing: "2px", marginBottom: "8px" }}>🎬 SWOCHI</h1>
      <p style={{ color: "#888", marginBottom: "40px" }}>Découvre ton prochain film</p>

      <div style={{
        background: "#1a1a1a", borderRadius: "16px",
        padding: "32px", width: "300px",
        display: "flex", flexDirection: "column", gap: "16px"
      }}>
        <h2 style={{ margin: 0, fontSize: "20px" }}>
          {isRegister ? "Créer un compte" : "Se connecter"}
        </h2>

        <input
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password" placeholder="Mot de passe"
          value={password} onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{error}</p>}

        <button onClick={handleSubmit} style={{
          background: "#22c55e", color: "white",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "16px",
          fontWeight: "bold", cursor: "pointer"
        }}>
          {isRegister ? "Créer le compte" : "Se connecter"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, height: "1px", background: "#333" }} />
          <span style={{ color: "#555", fontSize: "12px" }}>ou</span>
          <div style={{ flex: 1, height: "1px", background: "#333" }} />
        </div>

        <button onClick={handleGoogle} style={{
          background: "white", color: "#111",
          border: "none", borderRadius: "50px",
          padding: "14px", fontSize: "15px",
          fontWeight: "bold", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
        }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
          Continuer avec Google
        </button>

        <p
          onClick={() => setIsRegister(r => !r)}
          style={{ color: "#888", fontSize: "13px", textAlign: "center", cursor: "pointer", margin: 0 }}
        >
          {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#2a2a2a", border: "1px solid #333",
  borderRadius: "8px", padding: "12px",
  color: "white", fontSize: "15px", outline: "none"
};

export default Login;
