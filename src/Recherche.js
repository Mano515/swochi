import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const KEY = process.env.REACT_APP_TMDB_KEY;

function formatDuree(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m}min`;
  if (!m) return `${h}h`;
  return `${h}h${m}`;
}

/* ── Panneau détail film (réutilise le style BottomSheet) ── */
function DetailFilm({ film, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dRes, cRes, vRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${film.id}?api_key=${KEY}&language=fr-FR`),
          fetch(`https://api.themoviedb.org/3/movie/${film.id}/credits?api_key=${KEY}&language=fr-FR`),
          fetch(`https://api.themoviedb.org/3/movie/${film.id}/videos?api_key=${KEY}&language=fr-FR`),
        ]);
        const [d, c, v] = await Promise.all([dRes.json(), cRes.json(), vRes.json()]);
        let trailerKey = v.results?.find(x => x.type === "Trailer" && x.site === "YouTube")?.key
                      || v.results?.find(x => x.site === "YouTube")?.key || null;
        if (!trailerKey) {
          const enV = await fetch(`https://api.themoviedb.org/3/movie/${film.id}/videos?api_key=${KEY}&language=en-US`);
          const enD = await enV.json();
          trailerKey = enD.results?.find(x => x.type === "Trailer" && x.site === "YouTube")?.key
                    || enD.results?.find(x => x.site === "YouTube")?.key || null;
        }
        if (!cancelled) setDetails({
          synopsis:    d.overview || "Aucun synopsis disponible.",
          genres:      d.genres?.map(g => g.name).join(", ") || "—",
          duree:       d.runtime ? formatDuree(d.runtime) : null,
          note:        d.vote_average > 0 ? d.vote_average.toFixed(1) : null,
          annee:       d.release_date?.slice(0, 4) || null,
          realisateur: c.crew?.find(p => p.job === "Director")?.name || null,
          acteurs:     c.cast?.slice(0, 5).map(a => a.name).join(", ") || null,
          trailerKey,
        });
      } catch {
        if (!cancelled) setDetails({ synopsis: "Impossible de charger les informations.", genres: null, duree: null, note: null, annee: null, realisateur: null, acteurs: null, trailerKey: null });
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [film.id]);

  const sheet = (
    <AnimatePresence>
      <motion.div
        key="backdrop-detail"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1200 }}
      />
      <motion.div
        key="sheet-detail"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1201,
          background: "var(--surface)", borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.5)",
          maxHeight: "88vh", maxWidth: "650px", margin: "0 auto",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px", flexShrink: 0 }}>
          <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "var(--border-2)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px 16px", flexShrink: 0, borderBottom: "1px solid var(--divider)",
        }}>
          <div style={{ minWidth: 0, paddingRight: "12px" }}>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{film.title}</p>
            {film.release_date && <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-3)" }}>{film.release_date.slice(0, 4)}</p>}
          </div>
          <button onClick={onClose} style={{ background: "var(--surface-3)", border: "none", color: "var(--text-2)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px", flex: 1, WebkitOverflowScrolling: "touch" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-2)", borderTopColor: "var(--purple)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : details && (
            <>
              {/* Meta pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                {[details.annee && `📅 ${details.annee}`, details.duree && `⏱ ${details.duree}`, details.note && `⭐ ${details.note}`].filter(Boolean).map(tag => (
                  <span key={tag} style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "20px", padding: "5px 12px", fontSize: "13px", color: "var(--text-2)", fontWeight: "500" }}>{tag}</span>
                ))}
              </div>

              {/* Trailer */}
              {details.trailerKey && (
                <div style={{ marginBottom: "20px" }}>
                  <SectionLabel>BANDE-ANNONCE</SectionLabel>
                  <div style={{ position: "relative", paddingBottom: "56.25%", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
                    <iframe src={`https://www.youtube.com/embed/${details.trailerKey}?rel=0&modestbranding=1`} title="Bande-annonce" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                  </div>
                </div>
              )}

              {details.genres    && <DetailSection label="GENRES"      value={details.genres} />}
              <div style={{ marginBottom: "20px" }}>
                <SectionLabel>SYNOPSIS</SectionLabel>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.65", color: "var(--text-2)" }}>{details.synopsis}</p>
              </div>
              {details.realisateur && <DetailSection label="RÉALISATEUR" value={details.realisateur} />}
              {details.acteurs     && <DetailSection label="ACTEURS"     value={details.acteurs} />}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(sheet, document.body);
}

function SectionLabel({ children }) {
  return <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.8px", color: "var(--text-3)" }}>{children}</p>;
}
function DetailSection({ label, value }) {
  return <div style={{ marginBottom: "20px" }}><SectionLabel>{label}</SectionLabel><p style={{ margin: 0, fontSize: "14px", color: "var(--text)", lineHeight: "1.5" }}>{value}</p></div>;
}

/* ── Badge liste ── */
function ListeBadge({ liste }) {
  const config = {
    aVoir:        { label: "À voir",    color: "var(--green)",  bg: "rgba(34,197,94,0.1)"   },
    pasInteresse: { label: "Pas intéressé", color: "var(--text-3)", bg: "var(--surface-3)"   },
    dejavu:       { label: "Déjà vu",   color: "var(--blue)",   bg: "rgba(59,130,246,0.1)"  },
  }[liste];
  if (!config) return null;
  return (
    <span style={{
      display: "inline-block", fontSize: "11px", fontWeight: "600",
      color: config.color, background: config.bg,
      borderRadius: "20px", padding: "3px 10px",
    }}>{config.label}</span>
  );
}

/* ── Ligne résultat ── */
function LigneFilm({ film, listes, onAVoir, onPasInteresse, onDejaVu }) {
  const [detail, setDetail] = useState(false);

  const dansList = listes.aVoir.some(f => f.id === film.id)       ? "aVoir"
                 : listes.pasInteresse.some(f => f.id === film.id) ? "pasInteresse"
                 : listes.dejavu.some(f => f.id === film.id)       ? "dejavu"
                 : null;

  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "12px 0",
        borderBottom: "1px solid var(--divider)",
        cursor: "pointer",
      }}
        onClick={() => setDetail(true)}
      >
        {/* Affiche */}
        <div style={{
          width: "52px", height: "78px", flexShrink: 0,
          borderRadius: "8px", overflow: "hidden",
          background: "var(--surface-3)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        }}>
          {film.poster_path
            ? <img src={`https://image.tmdb.org/t/p/w92${film.poster_path}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🎬</div>
          }
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontWeight: "600", fontSize: "15px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {film.title}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--text-3)" }}>
            {[film.release_date?.slice(0, 4), film.vote_average > 0 && `⭐ ${film.vote_average.toFixed(1)}`].filter(Boolean).join("  ·  ")}
          </p>
          {dansList
            ? <ListeBadge liste={dansList} />
            : (
              <div style={{ display: "flex", gap: "8px" }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onPasInteresse(film)}
                  style={{ ...pillBtn, color: "var(--text-3)", borderColor: "var(--border-2)" }}
                >✕ Passer</button>
                <button
                  onClick={() => onAVoir(film)}
                  style={{ ...pillBtn, color: "var(--green)", borderColor: "var(--green)", background: "rgba(34,197,94,0.08)" }}
                >♥ À voir</button>
              </div>
            )
          }
        </div>

        {/* Flèche */}
        <span style={{ color: "var(--text-4)", fontSize: "16px", flexShrink: 0 }}>›</span>
      </div>

      {detail && <DetailFilm film={film} onClose={() => setDetail(false)} />}
    </>
  );
}

const pillBtn = {
  background: "transparent",
  border: "1px solid",
  borderRadius: "20px",
  padding: "4px 12px",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "opacity 0.15s",
};

/* ── Composant principal Recherche ── */
export default function Recherche({ onFermer, listes, onAVoir, onPasInteresse, onDejaVu, dejaSwiped }) {
  const [query, setQuery]       = useState("");
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const timer    = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResultats([]); setHasSearched(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${KEY}&language=fr-FR&query=${encodeURIComponent(query.trim())}&page=1`);
        const data = await res.json();
        setResultats(data.results?.filter(f => f.poster_path) ?? []);
      } catch {
        setResultats([]);
      }
      setLoading(false);
    }, 380);
    return () => clearTimeout(timer.current);
  }, [query]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed", inset: 0, zIndex: 800,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "0",
      }}
      onClick={onFermer}
    >
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      onClick={e => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: "600px",
        height: "100%",
        maxHeight: "100%",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Barre de recherche */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <div style={{
          flex: 1,
          display: "flex", alignItems: "center", gap: "10px",
          background: "var(--surface-2)",
          border: "1.5px solid var(--border-2)",
          borderRadius: "14px",
          padding: "0 14px",
          transition: "border-color 0.2s",
        }}>
          <span style={{ color: "var(--text-3)", fontSize: "15px", flexShrink: 0 }}>🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Titre, acteur, réalisateur…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, border: "none", background: "none", outline: "none",
              color: "var(--text)", fontSize: "16px", padding: "13px 0",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "var(--surface-3)", border: "none", color: "var(--text-3)", width: "20px", height: "20px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>✕</button>
          )}
        </div>
        <button
          onClick={onFermer}
          style={{ background: "none", border: "none", color: "var(--purple)", fontSize: "15px", fontWeight: "600", cursor: "pointer", padding: "8px 0", flexShrink: 0, whiteSpace: "nowrap" }}
        >Annuler</button>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* État vide initial */}
        {!query && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", gap: "12px", textAlign: "center" }}>
            <span style={{ fontSize: "48px" }}>🎬</span>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--text)" }}>Cherche un film</p>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)", lineHeight: "1.6" }}>Tape un titre pour trouver n'importe quel film et l'ajouter à ta liste.</p>
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: "28px", height: "28px", border: "3px solid var(--border-2)", borderTopColor: "var(--purple)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && hasSearched && resultats.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 32px" }}>
            <p style={{ fontSize: "36px", margin: "0 0 12px" }}>🤷</p>
            <p style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "600", color: "var(--text)" }}>Aucun résultat</p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-3)" }}>Vérifie l'orthographe ou essaie un autre titre.</p>
          </div>
        )}

        {/* Résultats */}
        {!loading && resultats.length > 0 && (
          <div style={{ padding: "0 16px" }}>
            <p style={{ margin: "12px 0 4px", fontSize: "12px", color: "var(--text-3)", fontWeight: "600", letterSpacing: "0.5px" }}>
              {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
            </p>
            {resultats.map(film => (
              <LigneFilm
                key={film.id}
                film={film}
                listes={listes}
                onAVoir={f => { onAVoir(f); }}
                onPasInteresse={f => { onPasInteresse(f); }}
                onDejaVu={f => { onDejaVu(f); }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
    </motion.div>
  );
}
