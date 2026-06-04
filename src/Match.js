import { useState } from "react";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function Match({ listesUser }) {
  const [pseudo, setPseudo] = useState("");
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function findMatch() {
    setError("");
    setMatches(null);
    setLoading(true);

    try {
      const q = query(collection(db, "users"), where("username", "==", pseudo.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Aucun utilisateur trouvé avec ce pseudo.");
        setLoading(false);
        return;
      }

      const ami = snap.docs[0].data();
      const listesAmi = ami.listes;

      // Films que les deux veulent voir
      const idsUser = listesUser.aVoir.map(f => f.id);
      const filmsCommuns = listesAmi.aVoir.filter(f => idsUser.includes(f.id));

      setMatches(filmsCommuns);
    } catch (e) {
      setError("Erreur : " + e.message);
    }

    setLoading(false);
  }

  return (
    <div style={{
      background: "#1a1a1a", borderRadius: "16px",
      padding: "24px", width: "300px",
      display: "flex", flexDirection: "column", gap: "16px"
    }}>
      <h2 style={{ margin: 0, fontSize: "18px" }}>🤝 Match avec un ami</h2>
      <p style={{ margin: 0, color: "#888", fontSize: "13px" }}>
        Entre le pseudo d'un ami pour voir vos films en commun
      </p>

      <input
        type="text"
        placeholder="@pseudo de ton ami"
        value={pseudo}
        onChange={e => setPseudo(e.target.value)}
        onKeyDown={e => e.key === "Enter" && findMatch()}
        style={inputStyle}
      />

      <button onClick={findMatch} disabled={loading} style={{
        background: "#a855f7", color: "white",
        border: "none", borderRadius: "50px",
        padding: "12px", fontSize: "15px",
        fontWeight: "bold", cursor: "pointer"
      }}>
        {loading ? "Recherche..." : "Trouver les matches 🎬"}
      </button>

      {error && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{error}</p>}

      {matches !== null && (
        <div>
          {matches.length === 0 ? (
            <p style={{ color: "#888", fontSize: "13px" }}>
              Aucun film en commun pour l'instant... Swipez plus ! 😄
            </p>
          ) : (
            <>
              <p style={{ color: "#22c55e", fontSize: "14px", marginBottom: "12px" }}>
                🎉 {matches.length} film{matches.length > 1 ? "s" : ""} en commun !
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {matches.map(film => (
                  <div key={film.id} style={{
                    display: "flex", gap: "12px", alignItems: "center"
                  }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                      alt={film.title}
                      style={{ borderRadius: "6px", width: "46px" }}
                    />
                    <span style={{ fontSize: "14px" }}>{film.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  background: "#2a2a2a", border: "1px solid #333",
  borderRadius: "8px", padding: "12px",
  color: "white", fontSize: "15px", outline: "none"
};

export default Match;