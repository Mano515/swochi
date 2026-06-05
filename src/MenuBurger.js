import { useEffect } from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

const ONGLETS = [
  { key: "swipe",    label: "🎬 Swipe" },
  { key: "match",    label: "🤝 Match" },
  { key: "mesfilms", label: "🎞 Mes films" },
  { key: "profil",   label: "👤 Profil" },
];

function MenuBurger({ ouvert, onFermer, onglet, onOnglet }) {

  // Ferme avec Escape
  useEffect(() => {
    if (!ouvert) return;
    const handler = e => { if (e.key === "Escape") onFermer(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ouvert, onFermer]);

  return (
    <>
      {/* Overlay sombre */}
      {ouvert && (
        <div
          onClick={onFermer}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            animation: "fonduIn 0.2s ease",
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "min(280px, 80vw)", height: "100%",
        background: "#141414",
        borderLeft: "1px solid #222",
        zIndex: 101,
        display: "flex", flexDirection: "column",
        transform: ouvert ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: ouvert ? "-8px 0 32px rgba(0,0,0,0.5)" : "none",
      }}>

        {/* En-tête du menu */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #1f1f1f",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#555", fontSize: "13px" }}>Menu</span>
          <button onClick={onFermer} style={{
            background: "transparent", border: "none",
            color: "#666", fontSize: "22px", cursor: "pointer",
            lineHeight: 1, padding: "4px",
          }}>✕</button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {ONGLETS.map(o => (
            <button
              key={o.key}
              onClick={() => { onOnglet(o.key); onFermer(); }}
              style={{
                width: "100%", textAlign: "left",
                background: onglet === o.key ? "#1f1f1f" : "transparent",
                color: onglet === o.key ? "white" : "#888",
                border: "none", borderRadius: "10px",
                padding: "14px 16px", fontSize: "15px",
                fontWeight: onglet === o.key ? "bold" : "normal",
                cursor: "pointer", marginBottom: "4px",
                display: "flex", alignItems: "center", gap: "4px",
                borderLeft: onglet === o.key ? "3px solid #a855f7" : "3px solid transparent",
              }}
            >
              {o.label}
            </button>
          ))}
        </nav>

        {/* Déconnexion en bas */}
        <div style={{ padding: "16px", borderTop: "1px solid #1f1f1f" }}>
          <button
            onClick={() => signOut(auth)}
            style={{
              width: "100%", background: "transparent",
              border: "1px solid #333", color: "#666",
              borderRadius: "10px", padding: "12px",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fonduIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default MenuBurger;
