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
      style={{
        display: visible ? "flex" : "none",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(" + (direction === -1 ? "to right" : "to left") + ", #0f0f0f 60%, transparent)",
        border: "none", color: "#aaa", cursor: "pointer",
        padding: "0 10px", fontSize: "18px",
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
        className="genres-scroll"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          display: "flex", gap: "6px",
          cursor: "grab",
          padding: "4px 0",
          // Laisse de la place pour les flèches quand elles sont visibles
          paddingLeft: peutAllerGauche ? "28px" : "0",
          paddingRight: peutAllerDroite ? "28px" : "0",
          transition: "padding 0.15s",
        }}
      >
        <button
          onClick={() => onGenreChange("")}
          style={{ ...genreStyle(genreChoisi === ""), flexShrink: 0 }}
        >Tous</button>
        {genres.map(g => (
          <button
            key={g.id}
            onClick={() => onGenreChange(String(g.id))}
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
    background: actif ? "white" : "transparent",
    color: actif ? "#0f0f0f" : "#666",
    border: "1px solid " + (actif ? "white" : "#333"),
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: actif ? "bold" : "normal",
    whiteSpace: "nowrap",
  };
}

export default GenreScroll;
