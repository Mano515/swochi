import { useState } from "react";

const ONGLETS = [
  { key: "aVoir", label: "❤️ À voir", color: "#22c55e" },
  { key: "dejavu", label: "👁 Déjà vu", color: "#3b82f6" },
  { key: "pasInteresse", label: "✕ Skip", color: "#ef4444" },
];

function MesFilms({ listes, onDeplacer }) {
  const [ongletActif, setOngletActif] = useState("aVoir");
  const [recherche, setRecherche] = useState("");

  const films = (listes[ongletActif] || []).filter(f =>
    f.title.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={{ width: "100%" }}>
      {/* Sous-onglets */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", justifyContent: "center" }}>
        {ONGLETS.map(o => (
          <button
            key={o.key}
            onClick={() => setOngletActif(o.key)}
            style={{
              background: ongletActif === o.key ? o.color : "transparent",
              color: ongletActif === o.key ? "white" : "#888",
              border: `1px solid ${ongletActif === o.key ? o.color : "#333"}`,
              borderRadius: "50px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {o.label} ({listes[o.key].length})
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <input
        type="text"
        placeholder="🔍 Rechercher un film..."
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        style={{
          background: "#1a1a1a", border: "1px solid #333",
          borderRadius: "8px", padding: "10px 14px",
          color: "white", fontSize: "14px", outline: "none",
          width: "100%", boxSizing: "border-box", marginBottom: "12px"
        }}
      />

      {/* Liste de films */}
      {films.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", fontSize: "14px" }}>
          Aucun film dans cette liste
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
          {films.map(film => (
            <div key={film.id} style={{
              display: "flex", gap: "12px", alignItems: "center",
              background: "#1a1a1a", borderRadius: "12px", padding: "10px"
            }}>
              <img
                src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                alt={film.title}
                style={{ borderRadius: "6px", width: "46px", flexShrink: 0 }}
              />
              <div style={{ flex: 1, fontSize: "14px" }}>{film.title}</div>

              {/* Boutons pour déplacer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {ONGLETS.filter(o => o.key !== ongletActif).map(o => (
                  <button
                    key={o.key}
                    onClick={() => onDeplacer(film, ongletActif, o.key)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${o.color}`,
                      color: o.color,
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MesFilms;