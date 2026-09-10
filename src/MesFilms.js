import { useState } from "react";
import { IconeRecherche, IconeInfo, IconeCoeur, IconeOeil, IconeCroix, IconeCorbeille } from "./Icones";

/* Chaque onglet porte l'icône de l'action qui y range un film : on retrouve
   ici le geste qu'on a fait sur la carte. « Déjà vu » affichait une coche,
   alors que le geste est l'œil. */
const ONGLETS = [
  { key: "aVoir",        label: "À voir",   Icone: IconeCoeur },
  { key: "dejavu",       label: "Déjà vu",  Icone: IconeOeil  },
  { key: "pasInteresse", label: "Ignorés",  Icone: IconeCroix },
];

function FilmDetail({ film, ongletActif, onDeplacer, onSupprimer, onFermer }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onFermer(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0",
        animation: "fonduIn 0.18s ease",
      }}
    >
      <div style={{
        width: "100%", maxWidth: "480px",
        background: "var(--surface)", borderRadius: "22px 22px 0 0",
        padding: "24px 20px 36px",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        maxHeight: "88vh", overflowY: "auto",
        animation: "slideUp 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Poignée */}
        <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border-2)", margin: "0 auto 20px" }} />

        {/* Contenu */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
          <img
            src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
            alt={`Affiche de ${film.title}`}
            style={{ width: "90px", borderRadius: "var(--r-sm)", objectFit: "cover", flexShrink: 0, boxShadow: "var(--shadow-md)" }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "var(--t-lg)", fontWeight: "700", color: "var(--text)", lineHeight: 1.3 }}>
              {film.title}
            </h2>
            {film.release_date && (
              <p style={{ margin: "0 0 6px", fontSize: "var(--t-sm)", color: "var(--text-3)" }}>
                {film.release_date.slice(0, 4)}
              </p>
            )}
            {film.vote_average > 0 && (
              <p style={{ margin: 0, fontSize: "var(--t-sm)", color: "var(--text-2)" }}>
                ★ {film.vote_average.toFixed(1)} / 10
              </p>
            )}
          </div>
        </div>

        {film.overview && (
          <p style={{ margin: "0 0 24px", fontSize: "var(--t-sm)", color: "var(--text-2)", lineHeight: 1.6 }}>
            {film.overview}
          </p>
        )}

        {/* Déplacer vers */}
        <p style={{ margin: "0 0 10px", fontSize: "var(--t-xs)", fontWeight: "600", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Déplacer vers
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {ONGLETS.filter(o => o.key !== ongletActif).map(o => (
            <button
              key={o.key}
              onClick={() => { onDeplacer(film, ongletActif, o.key); onFermer(); }}
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)", borderRadius: "var(--r-sm)",
                padding: "11px 16px", fontSize: "var(--t-sm)", fontWeight: "600",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: "10px",
              }}
            >
              <span style={{ fontSize: "var(--t-md)" }}>{o.icon}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => { onSupprimer(film, ongletActif); onFermer(); }}
          style={{
            background: "transparent",
            border: "1px solid var(--border-2)",
            color: "var(--text-3)", borderRadius: "var(--r-sm)",
            padding: "11px 16px", fontSize: "var(--t-sm)",
            cursor: "pointer", width: "100%",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          <IconeCorbeille taille={16} /> Retirer de la liste
        </button>
      </div>
    </div>
  );
}

function MesFilms({ listes, onDeplacer, onSupprimer, isGuest }) {
  const [ongletActif, setOngletActif] = useState("aVoir");
  const [recherche, setRecherche]     = useState("");
  const [filmDetail, setFilmDetail]   = useState(null);

  const films = (listes[ongletActif] || []).filter(f =>
    f.title.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={{ width: "100%" }}>

      {filmDetail && (
        <FilmDetail
          film={filmDetail}
          ongletActif={ongletActif}
          onDeplacer={onDeplacer}
          onSupprimer={onSupprimer}
          onFermer={() => setFilmDetail(null)}
        />
      )}

      {/* Bandeau invité */}
      {isGuest && (
        <div style={{
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)", padding: "11px 14px",
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "16px", fontSize: "var(--t-sm)", color: "var(--text-3)",
        }}>
          <IconeInfo taille={17} />
          <span>Tes films ne sont sauvegardés que pour cette session.</span>
        </div>
      )}

      {/* Segment control */}
      <div
        role="tablist"
        aria-label="Mes listes de films"
        style={{
          display: "flex",
          background: "var(--surface-2)",
          borderRadius: "var(--r-md)",
          padding: "4px",
          marginBottom: "20px",
          gap: "2px",
        }}
      >
        {ONGLETS.map(o => {
          const actif = ongletActif === o.key;
          return (
            <button
              key={o.key}
              role="tab"
              aria-selected={actif}
              onClick={() => { setOngletActif(o.key); setRecherche(""); }}
              style={{
                flex: 1,
                background: actif ? "var(--surface)" : "transparent",
                color: actif ? "var(--text)" : "var(--text-2)",
                border: "none",
                borderRadius: "var(--r-sm)",
                padding: "9px 4px",
                fontSize: "var(--t-xs)",
                fontWeight: actif ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: actif ? "var(--shadow-sm)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                lineHeight: 1.2,
              }}
            >
              <o.Icone taille={17} />
              <span>{o.label}</span>
              <span style={{ fontSize: "var(--t-xs)", opacity: 0.9, fontWeight: "400" }}>
                {listes[o.key].length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Barre de recherche */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: "16px" }}>
      <span style={{
        position: "absolute", left: "13px", display: "flex",
        color: "var(--text-3)", pointerEvents: "none",
      }}>
        <IconeRecherche taille={16} />
      </span>
      <input
        type="text"
        placeholder="Rechercher…"
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        style={{
          background: "var(--input-bg)", border: "1px solid var(--input-border)",
          borderRadius: "var(--r-sm)", padding: "11px 14px 11px 38px",
          color: "var(--text)", fontSize: "var(--t-md)", outline: "none",
          width: "100%", boxSizing: "border-box",
        }}
      />
      </div>

      {/* Grille d'affiches */}
      {films.length === 0 ? (
        <p style={{ color: "var(--text-3)", textAlign: "center", fontSize: "var(--t-sm)", paddingTop: "24px" }}>
          {recherche ? "Aucun résultat" : "Aucun film dans cette liste"}
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "12px",
        }}>
          {films.map(film => (
            <button
              key={film.id}
              onClick={() => setFilmDetail(film)}
              aria-label={`Voir les détails de ${film.title}`}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", gap: "6px",
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
                alt={`Affiche de ${film.title}`}
                style={{
                  width: "100%", aspectRatio: "2/3", objectFit: "cover",
                  borderRadius: "var(--r-sm)", display: "block",
                  boxShadow: "var(--shadow-md)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              />
              <span style={{
                fontSize: "var(--t-xs)", fontWeight: "500", color: "var(--text-2)",
                lineHeight: 1.3, display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {film.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MesFilms;
