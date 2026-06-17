import { useRef, useState, useEffect, useCallback } from "react";

function GenreScroll({ genres, genreChoisi, onGenreChange }) {
  const scrollRef = useRef(null);
  const [peutAllerGauche, setPeutAllerGauche] = useState(false);
  const [peutAllerDroite, setPeutAllerDroite] = useState(true);

  // Drag-to-scroll
  const drag = useRef({ actif: false, startX: 0, scrollLeft: 0 });

  const mettreAJourFleches = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setPeutAllerGauche(el.scrollLeft > 4);
    setPeutAllerDroite(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    mettreAJourFleches();
    el.addEventListener("scroll", mettreAJourFleches, { passive: true });
    return () => el.removeEventListener("scroll", mettreAJourFleches);
  }, [mettreAJourFleches, genres]);

  function scrollerVers(direction) {
    scrollRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  }

  // Drag souris
  function onMouseDown(e) {
    drag.current = { actif: true, startX: e.pageX - scrollRef.current.offsetLeft, scrollLeft: scrollRef.current.scrollLeft };
    scrollRef.current.style.cursor = "grabbing";
  }
  function onMouseMove(e) {
    if (!drag.current.actif) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = drag.current.scrollLeft - (x - drag.current.startX);
  }
  function onMouseUp() {
    drag.current.actif = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  }

  const fleche = (direction, visible) => (
    <button
      onClick={() => scrollerVers(direction)}
      aria-label={direction === -1 ? "Défiler vers la gauche" : "Défiler vers la droite"}
      tabIndex={visible ? 0 : -1}
      style={{
        display: visible ? "flex" : "none",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(" + (direction === -1 ? "to right" : "to left") + ", var(--bg) 55%, transparent)",
        border: "none", color: "var(--text-2)", cursor: "pointer",
        padding: "0 10px", fontSize: "20px",
        position: "absolute", top: 0, bottom: 0,
        [direction === -1 ? "left" : "right"]: 0,
        zIndex: 2,
      }}
    >
      {direction === -1 ? "‹" : "›"}
    </button>
  );

  return (
    <div style={{ position: "relative", width: "100%", marginBottom: "10px" }}>
      {fleche(-1, peutAllerGauche)}

      <div
        ref={scrollRef}
        role="group"
        aria-label="Filtrer par genre"
        className="genres-scroll"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          display: "flex", gap: "6px",
          cursor: "grab",
          padding: "4px 0",
          paddingLeft: peutAllerGauche ? "28px" : "0",
          paddingRight: peutAllerDroite ? "28px" : "0",
          transition: "padding 0.15s",
        }}
      >
        <button
          onClick={() => onGenreChange("")}
          aria-pressed={genreChoisi === ""}
          style={{ ...genreStyle(genreChoisi === ""), flexShrink: 0 }}
        >Tous</button>
        {genres.map(g => (
          <button
            key={g.id}
            onClick={() => onGenreChange(String(g.id))}
            aria-pressed={genreChoisi === String(g.id)}
            style={{ ...genreStyle(genreChoisi === String(g.id)), flexShrink: 0 }}
          >
            {g.name}
          </button>
        ))}
      </div>

      {fleche(1, peutAllerDroite)}
    </div>
  );
}

function genreStyle(actif) {
  return {
    background: actif ? "var(--purple)" : "var(--surface-2)",
    color: actif ? "#fff" : "var(--text-2)",
    border: actif ? "1.5px solid var(--purple)" : "1.5px solid transparent",
    borderRadius: "20px",
    padding: "6px 16px",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: actif ? "700" : "500",
    whiteSpace: "nowrap",
    letterSpacing: actif ? "0.01em" : "0",
    boxShadow: actif ? "0 2px 10px rgba(29,99,205,0.35)" : "none",
    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
  };
}

export default GenreScroll;
