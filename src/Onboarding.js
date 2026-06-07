import { useState } from "react";

const ETAPES = [
  {
    emoji: "🎬",
    titre: "Bienvenue sur Swochi",
    description: "L'app qui t'aide à trouver ton prochain film à regarder, seul ou avec tes amis.",
    hint: null,
  },
  {
    emoji: "👆",
    titre: "Swipe les affiches",
    description: "Glisse la carte ou utilise les boutons pour trier chaque film.",
    hint: [
      { icone: "→", label: "À voir",   couleur: "#22c55e" },
      { icone: "←", label: "Skip",     couleur: "#ef4444" },
      { icone: "↑", label: "Déjà vu", couleur: "#3b82f6" },
    ],
  },
  {
    emoji: "🎭",
    titre: "Filtre par genre",
    description: "Action, comédie, horreur... trouve exactement ce dont tu as envie ce soir.",
    hint: null,
    genres: ["Action", "Comédie", "Drame", "Horreur", "Sci-Fi"],
  },
  {
    emoji: "🤝",
    titre: "Compare avec tes amis",
    description: "Ajoute des amis, comparez vos listes et laissez le hasard choisir le film du soir.",
    hint: null,
  },
];

function Onboarding({ onTerminer }) {
  const [etape, setEtape] = useState(0);
  const e = ETAPES[etape];
  const derniere = etape === ETAPES.length - 1;

  function suivant() {
    if (derniere) {
      localStorage.setItem("swochi_onboarded", "1");
      onTerminer();
    } else {
      setEtape(n => n + 1);
    }
  }

  function passer() {
    localStorage.setItem("swochi_onboarded", "1");
    onTerminer();
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.95)",
      zIndex: 600,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", color: "white",
      padding: "24px",
    }}>
      <div style={{ maxWidth: "340px", width: "100%" }}>

        {/* Barre de progression */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
          {ETAPES.map((_, i) => (
            <div key={i} style={{
              flex: 1,
              height: "3px", borderRadius: "2px",
              background: i <= etape ? "white" : "#2a2a2a",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Emoji principal */}
        <div style={{ fontSize: "60px", textAlign: "center", marginBottom: "24px", lineHeight: 1 }}>
          {e.emoji}
        </div>

        {/* Titre */}
        <h2 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 12px", textAlign: "center" }}>
          {e.titre}
        </h2>

        {/* Description */}
        <p style={{ color: "#999", fontSize: "15px", lineHeight: "1.6", textAlign: "center", margin: "0 0 28px" }}>
          {e.description}
        </p>

        {/* Hint directions (étape 2) */}
        {e.hint && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "28px" }}>
            {e.hint.map(h => (
              <div key={h.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                background: "#1a1a1a", borderRadius: "12px",
                padding: "14px 18px",
                border: `1px solid ${h.couleur}33`,
                flex: 1,
              }}>
                <span style={{ fontSize: "22px", color: h.couleur, fontWeight: "bold" }}>{h.icone}</span>
                <span style={{ fontSize: "12px", color: "#aaa" }}>{h.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hint genres (étape 3) */}
        {e.genres && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "28px" }}>
            {e.genres.map((g, i) => (
              <span key={g} style={{
                background: i === 0 ? "white" : "transparent",
                color: i === 0 ? "#0f0f0f" : "#666",
                border: `1px solid ${i === 0 ? "white" : "#333"}`,
                borderRadius: "20px", padding: "5px 14px",
                fontSize: "13px", fontWeight: i === 0 ? "bold" : "normal",
              }}>{g}</span>
            ))}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: "flex", gap: "12px" }}>
          {!derniere && (
            <button onClick={passer} style={{
              flex: 1,
              background: "transparent", border: "1px solid #333",
              color: "#666", borderRadius: "50px",
              padding: "14px", fontSize: "15px",
              cursor: "pointer",
            }}>
              Passer
            </button>
          )}
          <button onClick={suivant} style={{
            flex: 2,
            background: "#a855f7", border: "none",
            color: "white", borderRadius: "50px",
            padding: "14px", fontSize: "15px",
            fontWeight: "bold", cursor: "pointer",
          }}>
            {derniere ? "C'est parti ! 🚀" : "Suivant →"}
          </button>
        </div>

        {/* Compteur (optionnel) */}
        <p style={{ color: "#444", fontSize: "12px", textAlign: "center", marginTop: "20px" }}>
          {etape + 1} / {ETAPES.length}
        </p>
      </div>
    </div>
  );
}

export default Onboarding;
