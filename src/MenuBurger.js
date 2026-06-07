import { useEffect, useRef } from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

const ONGLETS_COMPLET = [
  { key: "swipe",    label: "🎬 Swipe" },
  { key: "match",    label: "🤝 Match" },
  { key: "mesfilms", label: "🎞 Mes films" },
  { key: "profil",   label: "👤 Profil" },
];

// Sélecteurs d'éléments focusables dans le drawer
const FOCUSABLES = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function MenuBurger({ ouvert, onFermer, onglet, onOnglet }) {
  const drawerRef = useRef(null);
  const fermerBtnRef = useRef(null);

  // Ferme avec Escape + gestion du focus
  useEffect(() => {
    if (!ouvert) return;

    // Remet le focus sur le bouton de fermeture à l'ouverture
    fermerBtnRef.current?.focus();

    const handler = e => {
      if (e.key === "Escape") onFermer();

      // Piège le focus à l'intérieur du drawer (Tab / Shift+Tab)
      if (e.key === "Tab") {
        const focusables = Array.from(drawerRef.current?.querySelectorAll(FOCUSABLES) ?? []);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ouvert, onFermer]);

  return (
    <>
      {/* Overlay sombre — masqué aux lecteurs d'écran */}
      {ouvert && (
        <div
          onClick={onFermer}
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            animation: "fonduIn 0.2s ease",
          }}
        />
      )}

      {/* Drawer — dialog accessible */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        aria-hidden={!ouvert}
        style={{
          position: "fixed", top: 0, right: 0,
          width: "min(280px, 80vw)", height: "100%",
          background: "#141414",
          borderLeft: "1px solid #222",
          zIndex: 101,
          display: "flex", flexDirection: "column",
          transform: ouvert ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: ouvert ? "-8px 0 32px rgba(0,0,0,0.5)" : "none",
        }}
      >
        {/* En-tête du menu */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #1f1f1f",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#555", fontSize: "13px" }}>Menu</span>
          <button
            ref={fermerBtnRef}
            onClick={onFermer}
            aria-label="Fermer le menu"
            style={{
              background: "transparent", border: "none",
              color: "#666", fontSize: "22px", cursor: "pointer",
              lineHeight: 1, padding: "4px",
            }}
          >✕</button>
        </div>

        {/* Badge invité */}
        {isGuest && (
          <div style={{
            margin: "12px 12px 0",
            background: "#a855f710", border: "1px solid #a855f730",
            borderRadius: "10px", padding: "10px 14px",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#a855f7", fontWeight: "bold" }}>
              Mode invité
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
              Crée un compte pour sauvegarder tes swipes et rejoindre tes amis.
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav aria-label="Navigation principale" style={{ flex: 1, padding: "12px 12px" }}>
          {ONGLETS.map(o => (
            <button
              key={o.key}
              onClick={() => { onOnglet(o.key); onFermer(); }}
              aria-current={onglet === o.key ? "page" : undefined}
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

          {/* Onglets verrouillés pour les invités */}
          {isGuest && ONGLETS_COMPLET.filter(o => o.key !== "swipe").map(o => (
            <div key={o.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", borderRadius: "10px", marginBottom: "4px",
              opacity: 0.4,
            }}>
              <span style={{ fontSize: "15px", color: "#555" }}>{o.label}</span>
              <span style={{ fontSize: "11px", color: "#555", background: "#222", borderRadius: "6px", padding: "2px 6px" }}>
                🔒
              </span>
            </div>
          ))}
        </nav>

        {/* Pied de page */}
        <div style={{ padding: "16px", borderTop: "1px solid #1f1f1f" }}>
          {isGuest ? (
            <button
              onClick={onSeConnecter}
              style={{
                width: "100%", background: "#a855f7",
                border: "none", color: "white",
                borderRadius: "10px", padding: "13px",
                fontSize: "14px", fontWeight: "bold", cursor: "pointer",
              }}
            >
              Se connecter / S'inscrire
            </button>
          ) : (
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
          )}
        </div>
      </div>

      <style>{`
        @keyframes fonduIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

export default MenuBurger;
