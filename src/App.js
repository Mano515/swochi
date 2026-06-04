import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import MovieCard from "./MovieCard";
import Login from "./Login";
import Match from "./Match";
import MesFilms from "./MesFilms";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingFilms, setLoadingFilms] = useState(false);
  const [films, setFilms] = useState([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [dejaSwiped, setDejaSwiped] = useState([]);
  const [listes, setListes] = useState({ aVoir: [], pasInteresse: [], dejavu: [] });
  const [onglet, setOnglet] = useState("swipe");
  const [genres, setGenres] = useState([]);
  const [genreChoisi, setGenreChoisi] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.REACT_APP_TMDB_KEY}&language=fr-FR`)
      .then(res => res.json())
      .then(data => setGenres(data.genres || []));
  }, []);

  useEffect(() => {
    if (!user) return;

    // Charge les listes depuis Firestore, puis les films
    getDoc(doc(db, "users", user.uid)).then(snap => {
      const listesExistantes = snap.exists() ? snap.data().listes : { aVoir: [], pasInteresse: [], dejavu: [] };
      setListes(listesExistantes);

      const ids = [
        ...listesExistantes.aVoir,
        ...listesExistantes.pasInteresse,
        ...listesExistantes.dejavu,
      ].map(f => f.id);

      setDejaSwiped(ids);
      chargerFilms(1, ids, [], genreChoisi);
    });
  }, [user]);

  function chargerFilms(numPage, swipes, filmsExistants, genre = genreChoisi) {
    setLoadingFilms(true);
    const key = process.env.REACT_APP_TMDB_KEY;
    const genreParam = genre ? `&with_genres=${genre}` : "";
    // Unified discover endpoint — films récents, populaires, en langues occidentales
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=fr-FR&sort_by=popularity.desc&page=${numPage}&vote_count.gte=200&primary_release_date.gte=1990-01-01&with_original_language=en|fr|es|de|it${genreParam}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const resultats = data.results ?? [];
        const nouveaux = resultats.filter(f => !swipes.includes(f.id));
        setFilms([...filmsExistants, ...nouveaux]);
        setPage(numPage);
        setLoadingFilms(false);
      })
      .catch(() => setLoadingFilms(false));
  }

  function handleGenreChange(nouveauGenre) {
    setGenreChoisi(nouveauGenre);
    setFilms([]);
    setIndex(0);
    setPage(1);
    chargerFilms(1, dejaSwiped, [], nouveauGenre);
  }

  async function saveListes(newListes) {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      listes: newListes
    });
  }

  function handleSwipe(direction) {
    const film = films[index];
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir = [...listes.aVoir, film];
    if (direction === "left")  newListes.pasInteresse = [...listes.pasInteresse, film];
    if (direction === "up")    newListes.dejavu = [...listes.dejavu, film];
    setListes(newListes);
    saveListes(newListes);

    const nextIndex = index + 1;
    setIndex(nextIndex);

    // Mémorise ce film comme déjà swipé pour les prochaines pages
    const newDejaSwiped = [...dejaSwiped, film.id];
    setDejaSwiped(newDejaSwiped);

    // Charge la page suivante quand il reste 5 films
    if (nextIndex >= films.length - 5 && !loadingFilms) {
      chargerFilms(page + 1, newDejaSwiped, [...films]);
    }
  }

  async function handleDeplacer(film, de, vers) {
    const newListes = { ...listes };
    newListes[de] = listes[de].filter(f => f.id !== film.id);
    newListes[vers] = [...listes[vers], film];
    setListes(newListes);
    await saveListes(newListes);
  }

  if (loading) return <div style={{ background: "#0f0f0f", minHeight: "100vh" }} />;
  if (!user) return <Login onLogin={() => {}} />;

  const filmActuel = films[index];
  const filmSuivant = films[index + 1];

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", color: "white"
    }}>
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <button onClick={() => signOut(auth)} style={{
          background: "transparent", border: "1px solid #444",
          color: "#888", borderRadius: "8px",
          padding: "8px 16px", cursor: "pointer", fontSize: "13px"
        }}>Déconnexion</button>
      </div>

      <h1 style={{ marginBottom: "4px", fontSize: "28px", letterSpacing: "2px" }}>🎬 SWOCHI</h1>
      <p style={{ marginBottom: "16px", color: "#888", fontSize: "13px" }}>
        Bonjour {user.displayName ? user.displayName.split(" ")[0] : user.email} 👋
      </p>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
        <button onClick={() => setOnglet("swipe")} style={ongletStyle(onglet === "swipe")}>🎬 Swipe</button>
        <button onClick={() => setOnglet("match")} style={ongletStyle(onglet === "match")}>🤝 Match</button>
        <button onClick={() => setOnglet("mesfilms")} style={ongletStyle(onglet === "mesfilms")}>🎞 Mes films</button>
      </div>

      {onglet === "swipe" ? (
        <>
          {/* Filtre par genre */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "20px", maxWidth: "340px", paddingBottom: "4px" }}>
            <button
              onClick={() => handleGenreChange("")}
              style={{ ...genreStyle(genreChoisi === ""), flexShrink: 0 }}
            >Tous</button>
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => handleGenreChange(String(g.id))}
                style={{ ...genreStyle(genreChoisi === String(g.id)), flexShrink: 0 }}
              >{g.name}</button>
            ))}
          </div>

          <div style={{ position: "relative", width: "300px", height: "460px" }}>
            {filmSuivant && <MovieCard key={filmSuivant.id + "-bg"} film={filmSuivant} onSwipe={() => {}} isTop={false} />}
            {filmActuel  && <MovieCard key={filmActuel.id} film={filmActuel} onSwipe={handleSwipe} isTop={true} />}
            {!filmActuel && !loadingFilms && <p style={{ color: "#888", textAlign: "center", paddingTop: "200px" }}>Plus de films !</p>}
            {!filmActuel && loadingFilms && <p style={{ color: "#555", textAlign: "center", paddingTop: "200px" }}>Chargement des films…</p>}
          </div>

          {filmActuel && (
            <div style={{ display: "flex", gap: "24px", marginTop: "36px" }}>
              <button onClick={() => handleSwipe("left")}  style={btnStyle("#ef4444")}>✕ Skip</button>
              <button onClick={() => handleSwipe("up")}    style={btnStyle("#3b82f6")}>👁 Déjà vu</button>
              <button onClick={() => handleSwipe("right")} style={btnStyle("#22c55e")}>♥ À voir</button>
            </div>
          )}

          <div style={{ marginTop: "32px", display: "flex", gap: "32px", fontSize: "13px", color: "#666" }}>
            <span>✅ À voir : {listes.aVoir.length}</span>
            <span>❌ Skip : {listes.pasInteresse.length}</span>
            <span>👁️ Déjà vu : {listes.dejavu.length}</span>
          </div>
        </>
      ) : onglet === "match" ? (
        <Match listesUser={listes} />
      ) : (
        <MesFilms listes={listes} onDeplacer={handleDeplacer} />
      )}
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
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: actif ? "bold" : "normal",
  };
}

function btnStyle(color) {
  return {
    background: "transparent", border: `2px solid ${color}`,
    color: color, borderRadius: "50px",
    padding: "12px 24px", fontSize: "15px",
    fontWeight: "bold", cursor: "pointer",
  };
}

function ongletStyle(actif) {
  return {
    background: actif ? "white" : "transparent",
    color: actif ? "#0f0f0f" : "#888",
    border: "1px solid #333",
    borderRadius: "50px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  };
}

export default App;