import { useState } from "react";

const ONGLETS = [
  { key: "aVoir",        label: "❤️ À voir",  color: "#22c55e" },
  { key: "dejavu",       label: "👁 Déjà vu", color: "#3b82f6" },
  { key: "pasInteresse", label: "✕ Skip",     color: "#ef4444" },
];

function FilmItem({ film, ongletActif, onDeplacer, onSupprimer }) {
  const [ouvert, setOuvert] = useState(false);
  const menuId = `options-${film.id}`;

  return (
    <div style={{
      background: "var(--surface)", borderRadius: "14px", overflow: "hidden",
      border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
    }}>
      {/* Ligne principale */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "11px 11px 11px 12px" }}>
        <img
          src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
          alt={`Affiche de ${film.title}`}
          style={{ borderRadius: "8px", width: "44px", aspectRatio: "2/3", objectFit: "cover", flexShrink: 0 }}
        />
        <div style={{ flex: 1, fontSize: "14px", fontWeight: "500", color: "var(--text)", lineHeight: "1.4" }}>{film.title}</div>
        <button
          onClick={() => setOuvert(o => !o)}
          aria-label={`Options pour ${film.title}`}
          aria-expanded={ouvert}
          aria-controls={menuId}
          style={{
            background: ouvert ? "var(--surface-3)" : "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-2)", borderRadius: "8px",
            padding: "7px 11px", fontSize: "16px",
            cursor: "pointer", flexShrink: 0,
            transition: "background 0.15s",
          }}
        >···</button>
      </div>

      {/* Panneau d'options */}
      {ouvert && (
        <div
          id={menuId}
          role="group"
          aria-label={`Actions pour ${film.title}`}
          style={{
            borderTop: "1px solid var(--divider)",
            padding: "10px 12px",
            display: "flex", flexWrap: "wrap", gap: "8px",
            animation: "slideUp 0.15s ease-out",
          }}
        >
          {ONGLETS.filter(o => o.key !== ongletActif).map(o => (
            <button
              key={o.key}
              onClick={() => { onDeplacer(film, ongletActif, o.key); setOuvert(false); }}
              style={{
                background: "transparent",
                border: `1px solid ${o.color}`,
                color: o.color, borderRadius: "20px",
                padding: "5px 13px", fontSize: "13px",
                cursor: "pointer",
              }}
            >
              → {o.label}
            </button>
          ))}
          <button
            onClick={() => { onSupprimer(film, ongletActif); setOuvert(false); }}
            style={{
              background: "transparent",
              border: "1px solid var(--border-2)",
              color: "var(--text-3)", borderRadius: "20px",
              padding: "5px 13px", fontSize: "13px",
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
  const [recherche, setRecherche]     = useState("");

  const films = (listes[ongletActif] || []).filter(f =>
    f.title.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={{ width: "100%" }}>
      {/* Sous-onglets */}
      <div role="tablist" aria-label="Mes listes de films" style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {ONGLETS.map(o => (
          <button
            key={o.key}
            role="tab"
            aria-selected={ongletActif === o.key}
            onClick={() => { setOngletActif(o.key); setRecherche(""); }}
            style={{
              flex: 1,
              background: ongletActif === o.key ? o.color : "var(--surface)",
              color: ongletActif === o.key ? "white" : "var(--text-3)",
              border: `1px solid ${ongletActif === o.key ? o.color : "var(--border)"}`,
              borderRadius: "50px", padding: "9px 6px",
              fontSize: "12px", fontWeight: "600", cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {o.label} <span style={{ opacity: 0.75 }}>({listes[o.key].length})</span>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <label htmlFor="recherche-film" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        Rechercher un film
      </label>
      <input
        id="recherche-film"
        type="search"
        placeholder="🔍 Rechercher un film..."
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        aria-label="Rechercher un film dans cette liste"
        style={{
          background: "var(--input-bg)", border: "1px solid var(--input-border)",
          borderRadius: "10px", padding: "11px 14px",
          color: "var(--text)", fontSize: "16px", outline: "none",
          width: "100%", marginBottom: "14px",
        }}
      />

      {/* Liste */}
      {films.length === 0 ? (
        <p style={{ color: "var(--text-3)", textAlign: "center", fontSize: "14px", paddingTop: "24px" }}>
          {recherche ? "Aucun résultat" : "Aucun film dans cette liste"}
        </p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "8px", listStyle: "none", margin: 0, padding: 0 }}>
          {films.map(film => (
            <li key={film.id}>
              <FilmItem
                film={film}
                ongletActif={ongletActif}
                onDeplacer={onDeplacer}
                onSupprimer={onSupprimer}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MesFilms;
