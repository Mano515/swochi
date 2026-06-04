import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

function App() {
  const [films, setFilms] = useState([]);
  const [index, setIndex] = useState(0);
  const [listes, setListes] = useState({ aVoir: [], pasInteresse: [], dejavu: [] });

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${process.env.REACT_APP_TMDB_KEY}&language=fr-FR`)
      .then(res => res.json())
      .then(data => setFilms(data.results));
  }, []);

  function handleSwipe(direction) {
    const film = films[index];
    if (direction === "right") setListes(l => ({ ...l, aVoir: [...l.aVoir, film] }));
    if (direction === "left")  setListes(l => ({ ...l, pasInteresse: [...l.pasInteresse, film] }));
    if (direction === "up")    setListes(l => ({ ...l, dejavu: [...l.dejavu, film] }));
    setIndex(i => i + 1);
  }

  const filmActuel = films[index];
  const filmSuivant = films[index + 1];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      color: "white"
    }}>
      <h1 style={{ marginBottom: "8px", fontSize: "28px", letterSpacing: "2px" }}>🎬 SWOCHI</h1>
      <p style={{ marginBottom: "40px", color: "#888", fontSize: "14px" }}>
        Swipe ou utilise les boutons
      </p>

      {/* Pile de cartes */}
      <div style={{ position: "relative", width: "300px", height: "460px" }}>
        {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
        {filmActuel  && <MovieCard key={filmActuel.id} film={filmActuel} onSwipe={handleSwipe} isTop={true} />}
        {!filmActuel && <p style={{ color: "#888", textAlign: "center", paddingTop: "200px" }}>Plus de films !</p>}
      </div>

      {/* Boutons */}
      {filmActuel && (
        <div style={{ display: "flex", gap: "24px", marginTop: "36px" }}>
          <button onClick={() => handleSwipe("left")} style={btnStyle("#ef4444")}>✕ Skip</button>
          <button onClick={() => handleSwipe("up")}   style={btnStyle("#3b82f6")}>👁 Déjà vu</button>
          <button onClick={() => handleSwipe("right")} style={btnStyle("#22c55e")}>♥ À voir</button>
        </div>
      )}

      {/* Compteurs */}
      <div style={{ marginTop: "32px", display: "flex", gap: "32px", fontSize: "13px", color: "#666" }}>
        <span>✅ À voir : {listes.aVoir.length}</span>
        <span>❌ Skip : {listes.pasInteresse.length}</span>
        <span>👁️ Déjà vu : {listes.dejavu.length}</span>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: "transparent",
    border: `2px solid ${color}`,
    color: color,
    borderRadius: "50px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

export default App;