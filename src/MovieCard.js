import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";

function formatDuree(minutes) {
  const h   = Math.floor(minutes / 60);
  const min = minutes % 60;
  if (h === 0) return `${min}min`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}min`;
}

/* ── Bottom Sheet (portail plein-écran, swipe-to-dismiss) ── */
function BottomSheet({ panneauId, film, details, loadingDetails, showDetails, closeRef, onClose }) {
  const sheetY = useMotionValue(0);

  function handleDragEnd(_, info) {
    if (info.offset.y > 80 || info.velocity.y > 500) {
      animate(sheetY, 800, { duration: 0.25 });
      onClose();
    } else {
      animate(sheetY, 0, { type: "spring", damping: 30, stiffness: 300 });
    }
  }

  // Reset position each time sheet opens
  useEffect(() => {
    if (showDetails) sheetY.set(0);
  }, [showDetails, sheetY]);

  const sheet = (
    <AnimatePresence>
      {showDetails && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
              zIndex: 900,
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            id={panneauId}
            role="dialog"
            aria-modal="true"
            aria-label={`Détails de ${film.title}`}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            style={{
              y: sheetY,
              position: "fixed",
              left: 0, right: 0, bottom: 0,
              zIndex: 901,
              background: "var(--surface)",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -4px 40px rgba(0,0,0,0.4)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            onDragEnd={handleDragEnd}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{
              display: "flex", justifyContent: "center",
              padding: "12px 0 8px", flexShrink: 0,
              cursor: "grab",
            }}>
              <div style={{
                width: "40px", height: "4px",
                borderRadius: "2px",
                background: "var(--border-2)",
              }} />
            </div>

            {/* Header fixe */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 20px 16px",
              flexShrink: 0,
              borderBottom: "1px solid var(--divider)",
            }}>
              <div>
                <p style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "var(--text)" }}>
                  {film.title}
                </p>
                {film.release_date && (
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-3)" }}>
                    {film.release_date.slice(0, 4)}
                  </p>
                )}
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  background: "var(--surface-3)", border: "none",
                  color: "var(--text-2)", width: "32px", height: "32px",
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", fontSize: "16px",
                  flexShrink: 0,
                }}
              >✕</button>
            </div>

            {/* Contenu scrollable */}
            <div style={{
              overflowY: "auto",
              padding: "20px",
              flex: 1,
              WebkitOverflowScrolling: "touch",
            }}>
              {loadingDetails ? (
                <p role="status" style={{ color: "var(--text-3)", textAlign: "center", padding: "32px 0" }}>
                  Chargement…
                </p>
              ) : details && (
                <>
                  {/* Pills méta */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                    {[
                      details.annee && `📅 ${details.annee}`,
                      details.duree && `⏱ ${details.duree}`,
                      details.note  && `⭐ ${details.note}`,
                    ].filter(Boolean).map(tag => (
                      <span key={tag} style={{
                        background: "var(--surface-3)",
                        border: "1px solid var(--border)",
                        borderRadius: "20px",
                        padding: "5px 12px",
                        fontSize: "13px",
                        color: "var(--text-2)",
                        fontWeight: "500",
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Genres */}
                  <Section label="GENRES" value={details.genres} />

                  {/* Synopsis */}
                  <div style={{ marginBottom: "20px" }}>
                    <Label>SYNOPSIS</Label>
                    <p style={{
                      margin: 0, fontSize: "14px",
                      lineHeight: "1.65", color: "var(--text-2)",
                    }}>{details.synopsis}</p>
                  </div>

                  {/* Réalisateur */}
                  <Section label="RÉALISATEUR" value={details.realisateur} />

                  {/* Acteurs */}
                  <Section label="ACTEURS" value={details.acteurs} />
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(sheet, document.body);
}

function Label({ children }) {
  return (
    <p style={{
      margin: "0 0 5px",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.8px",
      color: "var(--text-3)",
    }}>{children}</p>
  );
}

function Section({ label, value }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <Label>{label}</Label>
      <p style={{ margin: 0, fontSize: "14px", color: "var(--text)", lineHeight: "1.5" }}>{value}</p>
    </div>
  );
}

/* ── MovieCard ──────────────────────────────────────────── */
function MovieCard({ film, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate        = useTransform(x, [-200, 200], [-25, 25]);
  const opacity       = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const labelOpacityLeft  = useTransform(x, [-100, -30, 0], [1, 0, 0]);
  const labelOpacityRight = useTransform(x, [0, 30, 100],  [0, 0, 1]);
  const labelOpacityUp    = useTransform(y, [-100, -30, 0], [1, 0, 0]);

  const [showDetails, setShowDetails]       = useState(false);
  const [details, setDetails]               = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const cardRef  = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (showDetails) closeRef.current?.focus();
    else cardRef.current?.focus();
  }, [showDetails]);

  function handleDragEnd(_, info) {
    if (showDetails) return;
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

  function handleKeyDown(e) {
    if (showDetails) return;
    if (e.key === "ArrowRight") { e.preventDefault(); flyOut("right"); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); flyOut("left");  }
    if (e.key === "ArrowUp")    { e.preventDefault(); flyOut("up");    }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetails(); }
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
        synopsis:    detailData.overview || "Aucun synopsis disponible.",
        genres:      detailData.genres?.map(g => g.name).join(", ") || "—",
        duree:       detailData.runtime ? formatDuree(detailData.runtime) : "—",
        note:        detailData.vote_average ? detailData.vote_average.toFixed(1) : "—",
        annee:       detailData.release_date?.slice(0, 4) || "—",
        realisateur: director?.name || "—",
        acteurs:     actors || "—",
      });
    } catch {
      setDetails({
        synopsis: "Impossible de charger les informations.",
        genres: "—", duree: "—", note: "—",
        annee: "—", realisateur: "—", acteurs: "—",
      });
    }
    setLoadingDetails(false);
  }

  if (!isTop) {
    return (
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          scale: 0.95, top: 10, zIndex: 0,
        }}
      >
        <img
          src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
          alt=""
          style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        />
      </motion.div>
    );
  }

  const panneauId = `details-${film.id}`;

  return (
    <motion.div
      ref={cardRef}
      role="article"
      aria-label={`${film.title}. Utilisez les flèches du clavier pour swiper, Entrée pour voir les détails.`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        x, y, rotate, opacity,
        position: "absolute", inset: 0,
        borderRadius: "16px", overflow: "hidden",
        cursor: showDetails ? "default" : "grab",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        zIndex: 1,
        outline: "none",
      }}
      drag={!showDetails}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: showDetails ? "default" : "grabbing" }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
        alt={`Affiche du film : ${film.title}`}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", pointerEvents: "none" }}
      />

      {/* Labels swipe — décoratifs */}
      <motion.div aria-hidden="true" style={{
        opacity: labelOpacityLeft,
        position: "absolute", top: 20, right: 20,
        background: "#ef4444", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white",
      }}>SKIP</motion.div>

      <motion.div aria-hidden="true" style={{
        opacity: labelOpacityRight,
        position: "absolute", top: 20, left: 20,
        background: "#22c55e", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white",
      }}>À VOIR</motion.div>

      <motion.div aria-hidden="true" style={{
        opacity: labelOpacityUp,
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        background: "#3b82f6", color: "white",
        padding: "6px 16px", borderRadius: "8px",
        fontWeight: "bold", fontSize: "18px", border: "2px solid white",
      }}>DÉJÀ VU</motion.div>

      {/* Bandeau bas — juste l'année + le bouton Infos */}
      <div
        role="button"
        tabIndex={-1}
        aria-label={`Voir les détails de ${film.title}`}
        aria-expanded={showDetails}
        aria-controls={panneauId}
        onClick={openDetails}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetails(); } }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
          cursor: "pointer",
          padding: "32px 14px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
          {film.release_date?.slice(0, 4)}
        </span>
        <span style={{
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.35)",
          backdropFilter: "blur(8px)",
          color: "white", borderRadius: "20px",
          padding: "5px 13px", fontSize: "12px",
          fontWeight: "600",
        }}>
          ℹ︎ Infos
        </span>
      </div>

      {/* Bottom sheet via portail */}
      <BottomSheet
        panneauId={panneauId}
        film={film}
        details={details}
        loadingDetails={loadingDetails}
        showDetails={showDetails}
        closeRef={closeRef}
        onClose={() => setShowDetails(false)}
      />
    </motion.div>
  );
}

export default MovieCard;
