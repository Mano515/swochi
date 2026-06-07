import { useEffect, useRef } from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { useTheme } from "./ThemeContext";

const ONGLETS_COMPLET = [
  { key: "swipe",    label: "🎬 Swipe" },
  { key: "match",    label: "👥 Amis" },
  { key: "mesfilms", label: "🎞 Mes films" },
  { key: "profil",   label: "👤 Profil" },
];

const FOCUSABLES = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function MenuBurger({ ouvert, onFermer, onglet, onOnglet, isGuest, onSeConnecter }) {
  const drawerRef    = useRef(null);
  const fermerBtnRef = useRef(null);
  const ONGLETS      = ONGLETS_COMPLET;
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!ouvert) return;
    fermerBtnRef.current?.focus();

    const handler = e => {
      if (e.key === "Escape") onFermer();
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
      {ouvert && (
        <div
          onClick={onFermer}
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 100,
            animation: "fonduIn 0.2s ease",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        aria-hidden={!ouvert}
        style={{
          position: "fixed", top: 0, right: 0,
          width: "min(280px, 82vw)", height: "100%",
          background: "var(--drawer)",
          borderLeft: "1px solid var(--border)",
          zIndex: 101,
          display: "flex", flexDirection: "column",
          transform: ouvert ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: ouvert ? "var(--shadow-lg)" : "none",
        }}
      >
        {/* En-tête */}
        <div style={{
          padding: "18px 18px 14px",
          borderBottom: "1px solid var(--divider)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "var(--text-3)", fontSize: "13px", fontWeight: "500" }}>Réglages</span>
          <button
            ref={fermerBtnRef}
            onClick={onFermer}
            aria-label="Fermer le menu"
            style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-3)", fontSize: "18px", cursor: "pointer",
              lineHeight: 1, padding: "6px 9px", borderRadius: "8px",
            }}
          >✕</button>
        </div>

        {/* Badge invité */}
        {isGuest && (
          <div style={{
            margin: "12px 12px 0",
            background: "var(--purple-dim)", border: "1px solid rgba(168,85,247,0.2)",
            borderRadius: "12px", padding: "12px 14px",
          }}>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--purple)", fontWeight: "600" }}>
              Mode invité
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-3)", lineHeight: "1.5" }}>
              Crée un compte pour sauvegarder tes swipes et rejoindre tes amis.
            </p>
          </div>
        )}

        {/* Navigation (desktop seulement — sur mobile la bottom nav prend le relais) */}
        <nav aria-label="Navigation principale" style={{ flex: 1, padding: "12px" }}>
          {ONGLETS.map(o => (
            <button
              key={o.key}
              onClick={() => { onOnglet(o.key); onFermer(); }}
              aria-current={onglet === o.key ? "page" : undefined}
              style={{
                width: "100%", textAlign: "left",
                background: onglet === o.key ? "var(--surface-2)" : "transparent",
                color: onglet === o.key ? "var(--text)" : "var(--text-3)",
                border: "none", borderRadius: "10px",
                padding: "13px 16px", fontSize: "15px",
                fontWeight: onglet === o.key ? "600" : "normal",
                cursor: "pointer", marginBottom: "3px",
                display: "flex", alignItems: "center", gap: "4px",
                borderLeft: onglet === o.key ? "3px solid var(--purple)" : "3px solid transparent",
              }}
            >
              {o.label}
            </button>
          ))}


          {/* Toggle thème */}
          <div style={{ borderTop: "1px solid var(--divider)", marginTop: "8px", paddingTop: "8px" }}>
            <button
              onClick={toggleTheme}
              style={{
                width: "100%", textAlign: "left",
                background: "transparent", border: "none",
                color: "var(--text-3)", borderRadius: "10px",
                padding: "13px 16px", fontSize: "15px",
                cursor: "pointer", marginBottom: "3px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderLeft: "3px solid transparent",
              }}
            >
              <span>{theme === "dark" ? "☀️  Mode clair" : "🌙  Mode sombre"}</span>
            </button>
          </div>
        </nav>

        {/* Pied de page */}
        <div style={{ padding: "14px", borderTop: "1px solid var(--divider)" }}>
          {isGuest ? (
            <button
              onClick={onSeConnecter}
              style={{
                width: "100%", background: "var(--purple)",
                border: "none", color: "white",
                borderRadius: "12px", padding: "13px",
                fontSize: "14px", fontWeight: "600", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(168,85,247,0.3)",
              }}
            >
              Se connecter / S'inscrire
            </button>
          ) : (
            <button
              onClick={() => signOut(auth)}
              style={{
                width: "100%", background: "transparent",
                border: "1px solid var(--border-2)", color: "var(--text-3)",
                borderRadius: "12px", padding: "12px",
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
