import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform, animate, AnimatePresence, useMotionValueEvent } from "framer-motion";
import { vibrer, vibrerSucces } from "./native";

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

  // Slide in from bottom each time sheet opens
  useEffect(() => {
    if (showDetails) {
      sheetY.set(800);
      animate(sheetY, 0, { type: "spring", damping: 32, stiffness: 300 });
    }
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
              maxWidth: "650px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
            }}
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
                <p style={{ margin: 0, fontSize: "var(--t-lg)", fontWeight: "700", color: "var(--text)" }}>
                  {film.title}
                </p>
                {film.release_date && (
                  <p style={{ margin: "2px 0 0", fontSize: "var(--t-sm)", color: "var(--text-3)" }}>
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
                  justifyContent: "center", cursor: "pointer", fontSize: "var(--t-md)",
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
                        fontSize: "var(--t-sm)",
                        color: "var(--text-2)",
                        fontWeight: "500",
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Genres */}
                  <Section label="GENRES" value={details.genres} />

                  {/* Bande-annonce */}
                  {details.trailerKey && (
                    <div style={{ marginBottom: "20px" }}>
                      <Label>BANDE-ANNONCE</Label>
                      <div style={{
                        position: "relative",
                        paddingBottom: "56.25%",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#000",
                      }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${details.trailerKey}?rel=0&modestbranding=1`}
                          title="Bande-annonce"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: "none",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Synopsis */}
                  <div style={{ marginBottom: "20px" }}>
                    <Label>SYNOPSIS</Label>
                    <p style={{
                      margin: 0, fontSize: "var(--t-sm)",
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
      fontSize: "var(--t-xs)",
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
      <p style={{ margin: 0, fontSize: "var(--t-sm)", color: "var(--text)", lineHeight: "1.5" }}>{value}</p>
    </div>
  );
}

/* ── MovieCard ──────────────────────────────────────────── */
const MovieCard = forwardRef(function MovieCard({ film, onSwipe, isTop }, ref) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate        = useTransform(x, [-220, 220], [-16, 16]);
  const opacity       = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const labelOpacityLeft  = useTransform(x, [-60, -12, 0],  [1, 0, 0]);
  const labelOpacityRight = useTransform(x, [0, 12, 60],   [0, 0, 1]);
  const labelOpacityUp    = useTransform(y, [-60, -12, 0], [1, 0, 0]);
  const labelScaleLeft    = useTransform(x, [-90, -12], [1.05, 0.8]);
  const labelScaleRight   = useTransform(x, [12, 90],   [0.8, 1.05]);
  const labelScaleUp      = useTransform(y, [-90, -12], [1.05, 0.8]);

  // Assombrit légèrement l'affiche pendant le drag pour faire ressortir le tampon.
  const voileOpacity = useTransform(
    [x, y],
    ([vx, vy]) => Math.min(Math.max(Math.abs(vx), Math.abs(vy)) / 180, 0.55)
  );

  // Vibration au franchissement du seuil de validation : on sait au doigt,
  // sans regarder, que lâcher maintenant validera le swipe.
  const seuilX = useRef(false);
  const seuilY = useRef(false);
  useMotionValueEvent(x, "change", v => {
    const franchi = Math.abs(v) > 60;
    if (franchi !== seuilX.current) { seuilX.current = franchi; if (franchi) vibrer("leger"); }
  });
  useMotionValueEvent(y, "change", v => {
    const franchi = v < -60;
    if (franchi !== seuilY.current) { seuilY.current = franchi; if (franchi) vibrer("leger"); }
  });

  const [showDetails, setShowDetails]       = useState(false);
  const [details, setDetails]               = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Les boutons d'action déclenchent la même animation que le geste :
  // sans ça, la carte disparaissait sèchement au clic.
  useImperativeHandle(ref, () => ({ flyOut }));

  const cardRef  = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (showDetails) closeRef.current?.focus();
    else cardRef.current?.focus();
  }, [showDetails]);

  function handleDragEnd(_, info) {
    if (showDetails) return;
    const vx = Math.abs(info.velocity.x);
    const vy = info.velocity.y;
    if      (info.offset.x > 60  || (vx > 400 && info.offset.x > 20))  flyOut("right");
    else if (info.offset.x < -60 || (vx > 400 && info.offset.x < -20)) flyOut("left");
    else if (info.offset.y < -60 || (vy < -400 && info.offset.y < -20)) flyOut("up");
  }

  function flyOut(direction) {
    const targets = {
      right: { x: 600,  y: 0    },
      left:  { x: -600, y: 0    },
      up:    { x: 0,    y: -600 },
    };
    vibrerSucces();
    animate(x, targets[direction].x, { type: "spring", damping: 22, stiffness: 180 });
    animate(y, targets[direction].y, { type: "spring", damping: 22, stiffness: 180 });
    setTimeout(() => onSwipe(direction), 260);
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
      const [detailRes, creditsRes, videosRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${film.id}?api_key=${key}&language=fr-FR`),
        fetch(`https://api.themoviedb.org/3/movie/${film.id}/credits?api_key=${key}&language=fr-FR`),
        fetch(`https://api.themoviedb.org/3/movie/${film.id}/videos?api_key=${key}&language=fr-FR`),
      ]);
      const detailData  = await detailRes.json();
      const creditsData = await creditsRes.json();
      const videosData  = await videosRes.json();
      const director = creditsData.crew?.find(p => p.job === "Director");
      const actors   = creditsData.cast?.slice(0, 5).map(a => a.name).join(", ");
      // Priorité : bande-annonce officielle en français, sinon en anglais
      const trailer =
        videosData.results?.find(v => v.type === "Trailer" && v.site === "YouTube") ||
        videosData.results?.find(v => v.site === "YouTube");
      // Si rien en FR, refetch en EN
      let trailerKey = trailer?.key || null;
      if (!trailerKey) {
        const enRes  = await fetch(`https://api.themoviedb.org/3/movie/${film.id}/videos?api_key=${key}&language=en-US`);
        const enData = await enRes.json();
        const enTrailer = enData.results?.find(v => v.type === "Trailer" && v.site === "YouTube")
                       || enData.results?.find(v => v.site === "YouTube");
        trailerKey = enTrailer?.key || null;
      }
      setDetails({
        synopsis:    detailData.overview || "Aucun synopsis disponible.",
        genres:      detailData.genres?.map(g => g.name).join(", ") || "—",
        duree:       detailData.runtime ? formatDuree(detailData.runtime) : "—",
        note:        detailData.vote_average ? detailData.vote_average.toFixed(1) : "—",
        annee:       detailData.release_date?.slice(0, 4) || "—",
        realisateur: director?.name || "—",
        acteurs:     actors || "—",
        trailerKey,
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

  // Carte suivante : visible sous la carte du dessus pour donner l'impression
  // d'une pile physique — on sait qu'il y a "quelque chose après".
  if (!isTop) {
    return (
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.90, y: 34 }}
        animate={{ scale: 0.94, y: 28 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        style={{
          position: "absolute", inset: 0,
          borderRadius: "24px", overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          zIndex: 0,
        }}
      >
        <img
          src={`https://image.tmdb.org/t/p/w780${film.poster_path}`}
          alt=""
          style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
        />
        {/* Assombrie : elle doit rester en retrait de la carte active */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      </motion.div>
    );
  }

  const panneauId = `details-${film.id}`;

  // Tampon de swipe : inclinés et plaqués dans un coin, ils se lisent d'un
  // coup d'œil périphérique pendant que le pouce tient la carte.
  const tampon = {
    position: "absolute",
    padding: "11px 20px",
    borderRadius: "14px",
    border: "3px solid rgba(255,255,255,0.9)",
    color: "#fff",
    fontWeight: "900",
    fontSize: "clamp(21px, 6.4vw, 32px)",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    textShadow: "0 2px 8px rgba(0,0,0,0.45)",
  };

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
        borderRadius: "24px", overflow: "hidden",
        cursor: showDetails ? "default" : "grab",
        boxShadow: "0 24px 70px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)",
        zIndex: 1,
        outline: "none",
      }}
      initial={{ scale: 0.94 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 260 }}
      drag={!showDetails}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: showDetails ? "default" : "grabbing" }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w780${film.poster_path}`}
        alt={`Affiche du film : ${film.title}`}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", pointerEvents: "none" }}
      />

      {/* Voile : l'affiche s'assombrit à mesure du drag, le tampon ressort */}
      <motion.div aria-hidden="true" style={{
        position: "absolute", inset: 0, background: "#000",
        opacity: voileOpacity, pointerEvents: "none",
      }} />

      <motion.div aria-hidden="true" style={{
        ...tampon, top: "7%", right: "6%", rotate: 14,
        opacity: labelOpacityLeft, scale: labelScaleLeft,
        background: "#ef4444",
        boxShadow: "0 8px 30px rgba(239,68,68,0.6), 0 0 0 1px rgba(0,0,0,0.15)",
      }}>Passer</motion.div>

      <motion.div aria-hidden="true" style={{
        ...tampon, top: "7%", left: "6%", rotate: -14,
        opacity: labelOpacityRight, scale: labelScaleRight,
        background: "#18b957",
        boxShadow: "0 8px 30px rgba(34,197,94,0.6), 0 0 0 1px rgba(0,0,0,0.15)",
      }}>À voir</motion.div>

      <motion.div aria-hidden="true" style={{
        ...tampon, bottom: "24%", left: "50%", x: "-50%", rotate: -4,
        opacity: labelOpacityUp, scale: labelScaleUp,
        background: "#2f7ff0",
        boxShadow: "0 8px 30px rgba(59,130,246,0.6), 0 0 0 1px rgba(0,0,0,0.15)",
      }}>Déjà vu</motion.div>

      {/* Bandeau bas — titre et méta posés sur l'affiche plutôt qu'en légende
          sous la carte : ça rend la hauteur au visuel et ça fait "produit". */}
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
          background: "linear-gradient(transparent, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0.93))",
          cursor: "pointer",
          padding: "68px 18px 18px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0, color: "#fff",
            fontSize: "clamp(19px, 5.6vw, 26px)", fontWeight: "800",
            lineHeight: 1.15, letterSpacing: "-0.3px",
            textShadow: "0 2px 14px rgba(0,0,0,0.65)",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {film.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "7px" }}>
            {film.release_date && (
              <span style={{ color: "rgba(255,255,255,0.95)", fontSize: "var(--t-sm)", fontWeight: "600" }}>
                {film.release_date.slice(0, 4)}
              </span>
            )}
            {film.vote_average > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                color: "#ffc63d", fontSize: "var(--t-sm)", fontWeight: "700",
              }}>
                ★ {film.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <span style={{
          flexShrink: 0,
          background: "rgba(255,255,255,0.16)",
          border: "1px solid rgba(255,255,255,0.3)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          color: "white", borderRadius: "20px",
          padding: "8px 15px", fontSize: "var(--t-sm)", fontWeight: "700",
        }}>
          Infos
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
});

export default MovieCard;
