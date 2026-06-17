import { useEffect, useRef } from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { useTheme } from "./ThemeContext";

const ONGLETS_COMPLET = [
  { key: "swipe",    emoji: "🍿", label: "Découvrir" },
  { key: "match",    emoji: "🤝", label: "Amis"      },
  { key: "mesfilms", emoji: "🎬", label: "Mes films" },
  { key: "profil",   emoji: "👤", label: "Profil"    },
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
          width: "min(320px, 88vw)", height: "100%",
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
          display: "flex", alignItems: "center", justifyContent: "flex-end",
        }}>
          <button
            ref={fermerBtnRef}
            onClick={onFermer}
            aria-label="Fermer le menu"
            style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-3)", fontSize: "18px", cursor: "pointer",
              lineHeight: 1, padding: "6px 10px", borderRadius: "8px",
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

        {/* Navigation — cachée sur desktop (tabs dans le header) */}
        <nav aria-label="Navigation principale" className="menu-nav-mobile" style={{ padding: "16px 14px 0" }}>
          {ONGLETS.map(o => {
            const actif = onglet === o.key;
            return (
              <button
                key={o.key}
                onClick={() => { onOnglet(o.key); onFermer(); }}
                aria-current={actif ? "page" : undefined}
                style={{
                  width: "100%", textAlign: "left",
                  background: actif ? "var(--purple-dim)" : "transparent",
                  color: actif ? "var(--purple)" : "var(--text-2)",
                  border: "none", borderRadius: "14px",
                  padding: "14px 18px",
                  cursor: "pointer", marginBottom: "4px",
                  display: "flex", alignItems: "center", gap: "14px",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <span style={{
                  fontSize: "22px", lineHeight: 1,
                  width: "28px", textAlign: "center", flexShrink: 0,
                }}>{o.emoji}</span>
                <span style={{
                  fontSize: "17px",
                  fontWeight: actif ? "700" : "500",
                  letterSpacing: "-0.2px",
                }}>{o.label}</span>
                {actif && (
                  <span style={{
                    marginLeft: "auto",
                    width: "6px", height: "6px",
                    borderRadius: "50%",
                    background: "var(--purple)",
                    flexShrink: 0,
                  }} />
                )}
              </button>
            );
          })}


          {/* Toggle thème */}
          <div style={{ borderTop: "1px solid var(--divider)", marginTop: "12px", paddingTop: "8px" }}>
            <button
              onClick={toggleTheme}
              style={{
                width: "100%", textAlign: "left",
                background: "transparent", border: "none",
                color: "var(--text-3)", borderRadius: "14px",
                padding: "14px 18px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "14px",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: "22px", lineHeight: 1, width: "28px", textAlign: "center", flexShrink: 0 }}>
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
              <span style={{ fontSize: "17px", fontWeight: "500" }}>
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </span>
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
