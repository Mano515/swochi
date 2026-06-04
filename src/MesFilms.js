import { useState } from "react";

const ONGLETS = [
  { key: "aVoir",       label: "❤️ À voir",  color: "#22c55e" },
  { key: "dejavu",      label: "👁 Déjà vu", color: "#3b82f6" },
  { key: "pasInteresse",label: "✕ Skip",     color: "#ef4444" },
];

function FilmItem({ film, ongletActif, onDeplacer, onSupprimer }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div style={{ background: "#1a1a1a", borderRadius: "12px", overflow: "hidden" }}>
      {/* Ligne principale */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px" }}>
        <img
          src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
          alt={film.title}
          style={{ borderRadius: "6px", width: "46px", flexShrink: 0 }}
        />
        <div style={{ flex: 1, fontSize: "14px" }}>{film.title}</div>
        <button
          onClick={() => setOuvert(o => !o)}
          style={{
            background: ouvert ? "#333" : "transparent",
            border: "1px solid #333",
            color: "#aaa", borderRadius: "8px",
            padding: "6px 10px", fontSize: "16px",
            cursor: "pointer", flexShrink: 0,
            transition: "background 0.15s",
          }}
        >···</button>
      </div>

      {/* Panneau d'options déroulant */}
      {ouvert && (
        <div style={{
          borderTop: "1px solid #2a2a2a",
          padding: "10px 12px",
          display: "flex", flexWrap: "wrap", gap: "8px",
          animation: "apparaitre 0.15s ease-out",
        }}>
          {ONGLETS.filter(o => o.key !== ongletActif).map(o => (
            <button
              key={o.key}
              onClick={() => { onDeplacer(film, ongletActif, o.key); setOuvert(false); }}
              style={{
                background: "transparent",
                border: `1px solid ${o.color}`,
                color: o.color, borderRadius: "20px",
                padding: "5px 12px", fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Déplacer → {o.label}
            </button>
          ))}
          <button
            onClick={() => { onSupprimer(film, ongletActif); setOuvert(false); }}
            style={{
              background: "transparent",
              border: "1px solid #555",
              color: "#888", borderRadius: "20px",
              padding: "5px 12px", fontSize: "13px",
              cursor: "pointer",
            }}
          >
            🗑 Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function MesFilms({ listes, onDeplacer, onSupprimer }) {
  const [ongletActif, setOngletActif] = useState("aVoir");
  const [recherche, setRecherche] = useState("");

  const films = (listes[ongletActif] || []).filter(f =>
    f.title.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={{ width: "100%" }}>
      {/* Sous-onglets */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {ONGLETS.map(o => (
          <button
            key={o.key}
            onClick={() => { setOngletActif(o.key); setRecherche(""); }}
            style={{
              flex: 1,
              background: ongletActif === o.key ? o.color : "transparent",
              color: ongletActif === o.key ? "white" : "#888",
              border: `1px solid ${ongletActif === o.key ? o.color : "#333"}`,
              borderRadius: "50px", padding: "8px 6px",
              fontSize: "13px", fontWeight: "bold", cursor: "pointer",
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
          color: "white", fontSize: "16px", outline: "none",
          width: "100%", marginBottom: "12px",
        }}
      />

      {/* Liste */}
      {films.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", fontSize: "14px" }}>
          {recherche ? "Aucun résultat" : "Aucun film dans cette liste"}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {films.map(film => (
            <FilmItem
              key={film.id}
              film={film}
              ongletActif={ongletActif}
              onDeplacer={onDeplacer}
              onSupprimer={onSupprimer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MesFilms;
