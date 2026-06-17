import { useState, useEffect, useRef } from "react";
import MovieCard from "./MovieCard";

const TMDB_KEY = process.env.REACT_APP_TMDB_KEY;

function ResultatFilm({ film, dejaSwiped, listes, onAVoir, onPasInteresse, onDejaVu }) {
  const [showCard, setShowCard] = useState(false);

  const dansList = listes.aVoir.some(f => f.id === film.id)       ? "aVoir"
                 : listes.pasInteresse.some(f => f.id === film.id) ? "pasInteresse"
                 : listes.dejavu.some(f => f.id === film.id)       ? "dejavu"
                 : null;

  const labelDansList = dansList === "aVoir"        ? { label: "À voir", color: "var(--green)" }
                      : dansList === "pasInteresse" ? { label: "Passé", color: "var(--text-3)" }
                      : dansList === "dejavu"        ? { label: "Déjà vu", color: "var(--blue)" }
                      : null;

  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 0",
        borderBottom: "1px solid var(--divider)",
      }}>
        {/* Affiche */}
        <div
          onClick={() => setShowCard(true)}
          style={{
            width: "48px", height: "72px", flexShrink: 0,
            borderRadius: "8px", overflow: "hidden",
            background: "var(--surface-3)", cursor: "pointer",
          }}
        >
          {film.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
              alt={film.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🎬</div>
          )}
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {film.title}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-3)" }}>
            {film.release_date?.slice(0, 4) || "—"}
            {film.vote_average > 0 && ` · ⭐ ${film.vote_average.toFixed(1)}`}
          </p>
          {labelDansList && (
            <p style={{ margin: "4px 0 0", fontSize: "11px", fontWeight: "700", color: labelDansList.color }}>
              {labelDansList.label}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => setShowCard(true)}
            title="Voir les détails"
            style={actionBtn("var(--text-3)")}
          >ℹ︎</button>
          {!dansList && (
            <>
              <button onClick={() => onPasInteresse(film)} title="Pas intéressé" style={actionBtn("var(--red)")}>✕</button>
              <button onClick={() => onAVoir(film)}        title="À voir"         style={actionBtn("var(--green)")}>♥</button>
            </>
          )}
        </div>
      </div>

      {/* Carte détail en overlay */}
      {showCard && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => setShowCard(false)}
        >
          <div style={{ width: "100%", maxWidth: "360px", height: "540px", position: "relative", marginBottom: "80px" }}
               onClick={e => e.stopPropagation()}>
            <div className="card-container" style={{ width: "100%", height: "100%", position: "relative" }}>
              <MovieCard film={film} onSwipe={(dir) => {
                if (dir === "right") onAVoir(film);
                if (dir === "left")  onPasInteresse(film);
                if (dir === "up")    onDejaVu(film);
                setShowCard(false);
              }} isTop={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function actionBtn(color) {
  return {
    width: "34px", height: "34px", borderRadius: "50%",
    background: "transparent", border: `1.5px solid ${color}`,
    color, fontSize: "14px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
}

export default function Recherche({ onFermer, listes, onAVoir, onPasInteresse, onDejaVu, dejaSwiped }) {
  const [query, setQuery]       = useState("");
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [recherche, setRecherche] = useState("");
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResultats([]); setRecherche(""); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setRecherche(query.trim());
      try {
        const res  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&language=fr-FR&query=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        setResultats(data.results?.filter(f => f.poster_path) || []);
      } catch {
        setResultats([]);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 800,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      animation: "fonduIn 0.18s ease",
    }}>
      {/* Barre de recherche */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "16px 16px 12px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: "10px",
          background: "var(--surface-2)", borderRadius: "12px",
          padding: "0 14px", border: "1px solid var(--border)",
        }}>
          <span style={{ color: "var(--text-3)", fontSize: "16px" }}>🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Rechercher un film…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--text)", fontSize: "16px", padding: "13px 0",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              background: "none", border: "none", color: "var(--text-3)",
              cursor: "pointer", fontSize: "18px", padding: "0 2px",
            }}>✕</button>
          )}
        </div>
        <button onClick={onFermer} style={{
          background: "none", border: "none",
          color: "var(--purple)", fontSize: "15px",
          fontWeight: "600", cursor: "pointer", padding: "8px 4px", flexShrink: 0,
        }}>Annuler</button>
      </div>

      {/* Résultats */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", WebkitOverflowScrolling: "touch" }}>
        {loading && (
          <p style={{ textAlign: "center", color: "var(--text-3)", padding: "32px 0", fontSize: "14px" }}>
            Recherche…
          </p>
        )}
        {!loading && recherche && resultats.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-3)", padding: "32px 0", fontSize: "14px" }}>
            Aucun résultat pour « {recherche} »
          </p>
        )}
        {!loading && !recherche && (
          <p style={{ textAlign: "center", color: "var(--text-4)", padding: "48px 0", fontSize: "14px" }}>
            Tape le nom d'un film
          </p>
        )}
        {resultats.map(film => (
          <ResultatFilm
            key={film.id}
            film={film}
            dejaSwiped={dejaSwiped}
            listes={listes}
            onAVoir={f => onAVoir(f)}
            onPasInteresse={f => onPasInteresse(f)}
            onDejaVu={f => onDejaVu(f)}
          />
        ))}
      </div>
    </div>
  );
}
