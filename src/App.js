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
  const [historique, setHistorique] = useState([]); // { film, direction }

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

  async function chargerFilms(numPage, swipes, filmsExistants, genre = genreChoisi, listesAVoir = listes.aVoir) {
    setLoadingFilms(true);
    const key = process.env.REACT_APP_TMDB_KEY;
    const genreParam = genre ? `&with_genres=${genre}` : "";
    const totalSwipes = swipes.length;

    try {
      let resultats = [];

      // Nouveau utilisateur : on commence par les films cultes (note élevée + très votés)
      const estNouvel = totalSwipes < 20;
      if (estNouvel && !genre) {
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=fr-FR&sort_by=vote_average.desc&vote_count.gte=3000&primary_release_date.gte=1990-01-01&page=${numPage}`;
        const data = await fetch(url).then(r => r.json());
        resultats = data.results ?? [];
      }
      // Utilisateur avec des films aimés : 1 page sur 3, on injecte des recommandations
      else if (!genre && listesAVoir.length >= 5 && numPage > 1 && Math.random() < 0.35) {
        const filmRef = listesAVoir[Math.floor(Math.random() * listesAVoir.length)];
        const [discoverData, recoData] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=fr-FR&sort_by=popularity.desc&vote_count.gte=200&primary_release_date.gte=1990-01-01&page=${numPage}`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${filmRef.id}/recommendations?api_key=${key}&language=fr-FR`).then(r => r.json()),
        ]);
        // Mélange : 60% discover, 40% recommandations
        const discover = discoverData.results ?? [];
        const recos = (recoData.results ?? []).filter(f => f.vote_count >= 100);
        resultats = melanger([...discover.slice(0, 12), ...recos.slice(0, 8)]);
      }
      // Cas standard : discover populaire
      else {
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&language=fr-FR&sort_by=popularity.desc&vote_count.gte=200&primary_release_date.gte=1990-01-01&page=${numPage}${genreParam}`;
        const data = await fetch(url).then(r => r.json());
        resultats = data.results ?? [];
      }

      const nouveaux = resultats.filter(f => !swipes.includes(f.id));
      setFilms([...filmsExistants, ...nouveaux]);
      setPage(numPage);
    } catch {
      // silencieux, l'utilisateur garde les films déjà chargés
    } finally {
      setLoadingFilms(false);
    }
  }

  function melanger(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
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

    // Mémorise dans l'historique pour le bouton retour
    setHistorique(h => [...h, { film, direction }]);

    // Mémorise ce film comme déjà swipé pour les prochaines pages
    const newDejaSwiped = [...dejaSwiped, film.id];
    setDejaSwiped(newDejaSwiped);

    // Charge la page suivante quand il reste 5 films
    if (nextIndex >= films.length - 5 && !loadingFilms) {
      chargerFilms(page + 1, newDejaSwiped, [...films], genreChoisi, newListes.aVoir);
    }
  }

  function handleRetour() {
    if (historique.length === 0) return;
    const derniere = historique[historique.length - 1];
    const { film, direction } = derniere;

    // Retire le film de la liste où il avait été mis
    const newListes = { ...listes };
    if (direction === "right") newListes.aVoir = listes.aVoir.filter(f => f.id !== film.id);
    if (direction === "left")  newListes.pasInteresse = listes.pasInteresse.filter(f => f.id !== film.id);
    if (direction === "up")    newListes.dejavu = listes.dejavu.filter(f => f.id !== film.id);
    setListes(newListes);
    saveListes(newListes);

    setHistorique(h => h.slice(0, -1));
    setDejaSwiped(d => d.filter(id => id !== film.id));
    setIndex(i => i - 1);
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
            <div style={{ display: "flex", gap: "16px", marginTop: "36px", alignItems: "center" }}>
              <button onClick={() => handleSwipe("left")}  style={btnStyle("#ef4444")}>✕ Skip</button>
              <button onClick={() => handleSwipe("up")}    style={btnStyle("#3b82f6")}>👁 Déjà vu</button>
              <button onClick={() => handleSwipe("right")} style={btnStyle("#22c55e")}>♥ À voir</button>
              <button
                onClick={handleRetour}
                disabled={historique.length === 0}
                title="Annuler le dernier swipe"
                style={{
                  background: "transparent",
                  border: "2px solid " + (historique.length > 0 ? "#f59e0b" : "#333"),
                  color: historique.length > 0 ? "#f59e0b" : "#333",
                  borderRadius: "50%", width: "44px", height: "44px",
                  fontSize: "18px", cursor: historique.length > 0 ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >↩</button>
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