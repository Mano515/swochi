import { useRef, useState, useEffect, useCallback } from "react";

function GenreScroll({ genres, genreChoisi, onGenreChange }) {
  const scrollRef = useRef(null);
  const [fadeLeft, setFadeLeft]   = useState(false);
  const [fadeRight, setFadeRight] = useState(true);

  const drag = useRef({ actif: false, startX: 0, scrollLeft: 0 });

  const mettreAJourFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 4);
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    mettreAJourFade();
    el.addEventListener("scroll", mettreAJourFade, { passive: true });
    return () => el.removeEventListener("scroll", mettreAJourFade);
  }, [mettreAJourFade, genres]);

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

  const fadeStyle = (side) => ({
    position: "absolute", top: 0, bottom: 0,
    [side]: 0,
    width: "48px",
    pointerEvents: "none",
    zIndex: 2,
    background: `linear-gradient(to ${side === "left" ? "right" : "left"}, var(--bg) 0%, transparent 100%)`,
    opacity: side === "left" ? (fadeLeft ? 1 : 0) : (fadeRight ? 1 : 0),
    transition: "opacity 0.2s ease",
  });

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={fadeStyle("left")} aria-hidden="true" />
      <div style={fadeStyle("right")} aria-hidden="true" />

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
