import { useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

function formatDuree(minutes) {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  if (h === 0) return `${min}min`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}min`;
}

function MovieCard({ film, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const labelOpacityLeft  = useTransform(x, [-100, -30, 0], [1, 0, 0]);
  const labelOpacityRight = useTransform(x, [0, 30, 100], [0, 0, 1]);
  const labelOpacityUp    = useTransform(y, [-100, -30, 0], [1, 0, 0]);

  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails]         = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  function handleDragEnd(_, info) {
    if (info.offset.x > 120)       flyOut("right");
    else if (info.offset.x < -120) flyOut("left");
    else if (info.offset.y < -120) flyOut("up");
  }

  function flyOut(direction) {
    const targets = {
      right: { x: 600,  y: 0    },
      left:  { x: -600, y: 0    },
      up:    { x: 0,    y: -600 },
    };
    animate(x, targets[direction].x, { duration: 0.3 });
    animate(y, targets[direction].y, { duration: 0.3 });
    setTimeout(() => onSwipe(direction), 300);
  }

  async function openDetails() {
    setShowDetails(true);
    if (details) return;
    setLoadingDetails(true);
    try {
      const key = process.env.REACT_APP_TMDB_KEY;
      const [detailRes, creditsRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${film.id}?api_key=${key}&language=fr-FR`),
        fetch(`https://api.themoviedb.org/3/movie/${film.id}/credits?api_key=${key}&language=fr-FR`),
      ]);
      const detailData  = await detailRes.json();
      const creditsData = await creditsRes.json();

      const director = creditsData.crew?.find(p => p.job === "Director");
      const actors   = creditsData.cast?.slice(0, 5).map(a => a.name).join(", ");

      setDetails({
        synopsis:  detailData.overview || "Aucun synopsis disponible.",
        genres:    detailData.genres?.map(g => g.name).join(", ") || "—",
        duree:     detailData.runtime ? formatDuree(detailData.runtime) : "—",
        note:      detailData.vote_average ? detailData.vote_average.toFixed(1) : "—",
        annee:     detailData.release_date?.slice(0, 4) || "—",
        realisateur: director?.name || "—",
        acteurs:   actors || "—",
      });
    } catch {
      setDetails({ synopsis: "Impossible de charger les informations.", genres: "—", duree: "—", note: "—", annee: "—", realisateur: "—", acteurs: "—" });
    }
    setLoadingDetails(false);
  }

  if (!isTop) {
    return (
      <motion.div style={{
        position: "absolute", inset: 0,
        borderRadius: "16px", overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        scale: 0.95, top: 10, zIndex: 0,
      }}>
        <img
          src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
          alt={film.title}
          style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        x, y, rotate, opacity,
        position: "absolute", inset: 0,
        borderRadius: "16px", overflow: "hidden",
        cursor: "grab",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        zIndex: 1,
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
        alt={film.title}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", pointerEvents: "none" }}
      />

      {/* Labels de swipe */}
      <motion.div style={{
        opacity: labelOpacityLeft,
        position: "absolute", top: 20, right: 20,
        background: "#ef4444", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white"
      }}>SKIP</motion.div>

      <motion.div style={{
        opacity: labelOpacityRight,
        position: "absolute", top: 20, left: 20,
        background: "#22c55e", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white"
      }}>À VOIR</motion.div>

      <motion.div style={{
        opacity: labelOpacityUp,
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        background: "#3b82f6", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white"
      }}>DÉJÀ VU</motion.div>

      {/* Zone cliquable bas — indicateur d'infos centré */}
      <div
        onClick={openDetails}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
          cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingBottom: "12px", paddingTop: "40px",
          gap: "2px",
        }}
      >
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", letterSpacing: "1px", fontWeight: "500" }}>Infos</span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>︿</span>
      </div>

      {/* Panneau de détails */}
      {showDetails && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(15,15,15,0.97)",
            borderRadius: "16px 16px 0 0",
            padding: "20px 16px",
            color: "white",
            maxHeight: "75%",
            overflowY: "auto",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Poignée + fermeture */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>{film.title}</span>
            <button
              onClick={() => setShowDetails(false)}
              style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}
            >✕</button>
          </div>

          {loadingDetails ? (
            <p style={{ color: "#888", textAlign: "center", padding: "20px 0" }}>Chargement…</p>
          ) : details && (
            <>
              {/* Méta infos */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {[details.annee, details.duree, `⭐ ${details.note}`].map(tag => (
                  <span key={tag} style={{
                    background: "#2a2a2a", borderRadius: "20px",
                    padding: "4px 10px", fontSize: "12px", color: "#ccc"
                  }}>{tag}</span>
                ))}
              </div>

              {/* Genres */}
              <div style={{ marginBottom: "12px" }}>
                <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>GENRES</p>
                <p style={{ margin: 0, fontSize: "13px" }}>{details.genres}</p>
              </div>

              {/* Synopsis */}
              <div style={{ marginBottom: "12px" }}>
                <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>SYNOPSIS</p>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: "#ddd" }}>{details.synopsis}</p>
              </div>

              {/* Réalisateur */}
              <div style={{ marginBottom: "12px" }}>
                <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>RÉALISATEUR</p>
                <p style={{ margin: 0, fontSize: "13px" }}>{details.realisateur}</p>
              </div>

              {/* Acteurs */}
              <div>
                <p style={{ color: "#888", fontSize: "11px", margin: "0 0 4px" }}>ACTEURS</p>
                <p style={{ margin: 0, fontSize: "13px", color: "#ddd" }}>{details.acteurs}</p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default MovieCard;
