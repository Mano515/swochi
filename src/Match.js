import { useState, useEffect, useCallback } from "react";
import { IconeAmis, IconeBoite, IconeCadenas, IconeCoche, IconeCopier, IconeCroix, IconeDe, IconeFleche, IconePartage } from "./Icones";
import { db } from "./firebase";
import {
  collection, query, where, getDocs,
  addDoc, updateDoc, deleteDoc, doc, getDoc,
  serverTimestamp,
} from "firebase/firestore";

// ─── Confettis ────────────────────────────────────────────────────────────────

function useConfettis(actif) {
  const [confettis, setConfettis] = useState([]);
  useEffect(() => {
    if (!actif) { setConfettis([]); return; }
    const couleurs = ["#22c55e", "#1d63cd", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899"];
    const items = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delai: Math.random() * 1.2,
      duree: 1.5 + Math.random() * 1.5,
      couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
      taille: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setConfettis(items);
    const t = setTimeout(() => setConfettis([]), 4000);
    return () => clearTimeout(t);
  }, [actif]);
  return confettis;
}

// ─── Avatar lettre ────────────────────────────────────────────────────────────

function Avatar({ username, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--accent), var(--accent-txt))",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: "bold", color: "white",
      flexShrink: 0,
    }}>
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ─── Vue principale : liste d'amis ────────────────────────────────────────────

function VueAmis({ amis, demandesRecues, username, onComparer, onAccepter, onRefuser, onAjouter, onCopier, onPartager, copied }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <button onClick={onAjouter} style={{
        background: "var(--accent)", color: "white",
        border: "none", borderRadius: "var(--r-md)",
        padding: "14px", fontSize: "var(--t-md)",
        fontWeight: "700", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        boxShadow: "0 4px 14px rgb(var(--accent-rvb) / 0.3)",
      }}>
        + Ajouter un ami
      </button>

      {/* Demandes reçues */}
      {demandesRecues.length > 0 && (
        <section>
          <p style={titreSectionStyle}><IconeBoite taille={15} /> Demandes reçues ({demandesRecues.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {demandesRecues.map(d => (
              <div key={d.id} style={carteStyle}>
                <Avatar username={d.username} />
                <span style={pseudoStyle}>@{d.username}</span>
                <button onClick={() => onAccepter(d)} style={btnVertStyle}>Accepter</button>
                <button onClick={() => onRefuser(d)} style={btnGrisStyle} aria-label="Refuser la demande"><IconeCroix taille={15} /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mes amis */}
      <section>
        <p style={titreSectionStyle}>
          <IconeAmis taille={15} /> Mes amis {amis.length > 0 ? `(${amis.length})` : ""}
        </p>
        {amis.length === 0 ? (
          <div style={{
            background: "var(--surface)", borderRadius: "var(--r-md)",
            padding: "28px", textAlign: "center",
            border: "1px solid var(--border)",
          }}>
            <p style={{ color: "var(--text-3)", fontSize: "var(--t-sm)", margin: 0, lineHeight: "1.6" }}>
              Aucun ami pour l'instant.<br />Ajoute quelqu'un pour comparer vos listes !
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {amis.map(a => (
              <div key={a.id} style={carteStyle}>
                <Avatar username={a.username} />
                <span style={pseudoStyle}>@{a.username}</span>
                <button onClick={() => onComparer(a)} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", 
                  background: "var(--accent-doux)", color: "var(--accent-txt)",
                  border: "1px solid rgb(var(--accent-rvb) / 0.25)",
                  borderRadius: "var(--r-lg)", padding: "0 16px", minHeight: "var(--touch)",
                  fontSize: "var(--t-sm)", fontWeight: "600",
                  cursor: "pointer", flexShrink: 0,
                }}>
                  Comparer <IconeFleche taille={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mon pseudo */}
      {username && (
        <section>
          <p style={titreSectionStyle}>Mon pseudo</p>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", padding: "16px",
            boxShadow: "var(--shadow-sm)",
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            {/* Pseudo sélectionnable en grand */}
            <div style={{
              background: "var(--surface-2)", borderRadius: "var(--r-sm)",
              padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: "var(--t-xl)", fontWeight: "800", color: "var(--text)",
                letterSpacing: "0.5px",
                userSelect: "text", WebkitUserSelect: "text",
                cursor: "text",
              }}>
                @{username}
              </span>
              {/* Bouton copier le pseudo brut */}
              <button
                onClick={onCopier}
                aria-label="Copier le pseudo"
                style={{
                  background: copied === "pseudo" ? "var(--green)" : "var(--surface-3)",
                  color: copied === "pseudo" ? "white" : "var(--text-2)",
                  border: "none", borderRadius: "var(--r-xs)",
                  padding: "0 12px", minHeight: "var(--touch)", fontSize: "var(--t-sm)",
                  fontWeight: "600", cursor: "pointer", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", 
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {copied === "pseudo" ? <><IconeCoche taille={15} /> Copié</> : <><IconeCopier taille={15} /> Copier</>}
              </button>
            </div>

            {/* Bouton partager avec message */}
            <button
              onClick={onPartager}
              aria-label="Partager mon pseudo"
              style={{
                background: copied === "partage" ? "var(--green)" : "var(--accent)",
                color: "white", border: "none",
                borderRadius: "var(--r-sm)", padding: "12px",
                fontSize: "var(--t-sm)", fontWeight: "600",
                cursor: "pointer", width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", 
                transition: "background 0.2s",
                boxShadow: copied === "partage" ? "0 4px 14px rgba(34,197,94,0.3)" : "0 4px 14px rgb(var(--accent-rvb) / 0.25)",
              }}
            >
              {copied === "partage" ? <><IconeCoche taille={16} /> Lien copié&nbsp;!</> : <><IconePartage taille={16} /> Partager mon pseudo</>}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Vue : ajouter un ami ─────────────────────────────────────────────────────

function VueAjouter({ myUid, myUsername, onRetour }) {
  const [pseudo, setPseudo]               = useState("");
  const [resultat, setResultat]           = useState(null);
  const [loading, setLoading]             = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [succès, setSuccès]               = useState(false);

  async function chercher() {
    if (!pseudo.trim()) return;
    setLoading(true);
    setResultat(null);
    setSuccès(false);
    const cible = pseudo.trim().toLowerCase().replace(/^@/, "");
    if (cible === myUsername) {
      setResultat({ etat: "soi_meme" });
      setLoading(false);
      return;
    }
    try {
      const userSnap = await getDocs(
        query(collection(db, "users"), where("username", "==", cible))
      );
      if (userSnap.empty) { setResultat({ etat: "not_found" }); setLoading(false); return; }

      const cibleDoc = userSnap.docs[0];
      const cibleUid = cibleDoc.id;

      // Requêtes simples sur un seul champ (règles Firestore OR + queries)
      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(query(collection(db, "friendRequests"), where("fromUid", "==", myUid))),
        getDocs(query(collection(db, "friendRequests"), where("toUid",   "==", myUid))),
      ]);

      const sentDoc     = sentSnap.docs.find(d => d.data().toUid   === cibleUid);
      const receivedDoc = receivedSnap.docs.find(d => d.data().fromUid === cibleUid);

      let etat = "aucun";
      if (sentDoc)     { etat = sentDoc.data().status     === "accepted" ? "ami" : "envoyée"; }
      if (receivedDoc) { etat = receivedDoc.data().status === "accepted" ? "ami" : "recue"; }

      setResultat({ uid: cibleUid, username: cible, etat });
    } catch (e) {
      console.error("Erreur recherche ami:", e?.code, e?.message);
      const etat = e?.code === "permission-denied" ? "permission" : "erreur";
      setResultat({ etat });
    }
    setLoading(false);
  }

  async function envoyerDemande(cibleUid, cibleUsername) {
    setLoadingAction(true);
    try {
      await addDoc(collection(db, "friendRequests"), {
        fromUid:      myUid,
        fromUsername: myUsername,
        toUid:        cibleUid,
        toUsername:   cibleUsername,
        status:       "pending",
        createdAt:    serverTimestamp(),
      });
      setSuccès(true);
      setResultat(r => ({ ...r, etat: "envoyée" }));
    } catch { /* silencieux */ }
    setLoadingAction(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <button onClick={onRetour} style={btnRetourStyle}><IconeFleche vers="gauche" taille={15} /> Retour</button>

      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: "var(--t-lg)", color: "var(--text)" }}>Ajouter un ami</h3>
        <p style={{ color: "var(--text-3)", fontSize: "var(--t-sm)", margin: 0 }}>
          Entre le pseudo de quelqu'un pour lui envoyer une demande
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {/* Champ avec @ fixe devant */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          background: "var(--input-bg)", border: "1px solid var(--input-border)",
          borderRadius: "var(--r-sm)", overflow: "hidden",
        }}>
          <span style={{
            padding: "0 0 0 14px",
            fontSize: "var(--t-md)", fontWeight: "700",
            color: "var(--text-3)", flexShrink: 0,
            userSelect: "none",
          }}>@</span>
          <input
            type="text"
            placeholder="pseudo de ton ami"
            value={pseudo.replace(/^@/, "")}
            onChange={e => setPseudo(e.target.value.replace(/^@/, ""))}
            onKeyDown={e => e.key === "Enter" && chercher()}
            style={{
              flex: 1, minWidth: 0, background: "transparent", border: "none",
              padding: "13px 14px 13px 6px",
              color: "var(--text)", fontSize: "var(--t-md)", outline: "none",
            }}
          />
        </div>
        <button onClick={chercher} disabled={loading} style={{
          background: "var(--accent)", color: "white",
          border: "none", borderRadius: "var(--r-sm)",
          padding: "0 18px", fontSize: "var(--t-sm)",
          fontWeight: "700", cursor: "pointer",
          opacity: loading ? 0.7 : 1, flexShrink: 0,
        }}>
          {loading ? "…" : "Chercher"}
        </button>
      </div>

      {resultat && (
        <div style={{
          background: "var(--surface)", borderRadius: "var(--r-md)",
          padding: "16px", border: "1px solid var(--border)",
          animation: "slideUp 0.2s ease-out",
        }}>
          {resultat.etat === "not_found" && (
            <p style={{ color: "var(--text-3)", margin: 0, fontSize: "var(--t-sm)" }}>
              Aucun utilisateur avec ce pseudo. Vérifie l'orthographe.
            </p>
          )}
          {resultat.etat === "soi_meme" && (
            <p style={{ color: "var(--text-3)", margin: 0, fontSize: "var(--t-sm)" }}>
              C'est toi ! Entre le pseudo d'un ami 😄
            </p>
          )}
          {resultat.etat === "erreur" && (
            <p style={{ color: "var(--red-txt)", margin: 0, fontSize: "var(--t-sm)" }}>
              Une erreur est survenue, réessaie. (détails dans la console)
            </p>
          )}
          {resultat.etat === "permission" && (
            <p style={{ color: "var(--amber-txt)", margin: 0, fontSize: "var(--t-sm)" }}>
              Index Firestore manquant — crée l'index <strong>fromUid + toUid</strong> dans la Firebase Console.
            </p>
          )}
          {resultat.etat === "ami" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar username={resultat.username} />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
                <p style={{ ...ligneIcone, color: "var(--green-txt)", fontSize: "var(--t-sm)" }}><IconeCoche taille={15} /> Vous êtes déjà amis</p>
              </div>
            </div>
          )}
          {resultat.etat === "envoyée" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar username={resultat.username} />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
                <p style={{ margin: 0, color: "var(--amber-txt)", fontSize: "var(--t-sm)" }}>
                  {succès ? <><IconeCoche taille={15} /> Demande envoyée&nbsp;!</> : "Demande déjà envoyée"}
                </p>
              </div>
            </div>
          )}
          {resultat.etat === "recue" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar username={resultat.username} />
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
                <p style={{ margin: 0, color: "var(--blue-txt)", fontSize: "var(--t-sm)" }}>
                  Il t'a déjà envoyé une demande — accepte-la dans tes demandes reçues
                </p>
              </div>
            </div>
          )}
          {resultat.etat === "aucun" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Avatar username={resultat.username} />
                <p style={{ margin: 0, fontWeight: "700", color: "var(--text)" }}>@{resultat.username}</p>
              </div>
              <button
                onClick={() => envoyerDemande(resultat.uid, resultat.username)}
                disabled={loadingAction}
                style={{
                  background: "var(--accent)", color: "white",
                  border: "none", borderRadius: "var(--r-lg)",
                  padding: "8px 16px", fontSize: "var(--t-sm)",
                  fontWeight: "700", cursor: "pointer",
                  opacity: loadingAction ? 0.7 : 1, flexShrink: 0,
                }}
              >
                {loadingAction ? "…" : "Ajouter"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Vue : comparaison de listes ──────────────────────────────────────────────

function VueComparer({ ami, listesUser, onRetour }) {
  const [matches, setMatches]   = useState(null);
  const [filmTire, setFilmTire] = useState(null);
  const [loading, setLoading]   = useState(true);
  const confettis = useConfettis(matches !== null && matches.length > 0 && !loading);

  useEffect(() => {
    async function charger() {
      try {
        const snap = await getDoc(doc(db, "users", ami.uid));
        if (!snap.exists()) { setMatches([]); setLoading(false); return; }
        const idsUser     = listesUser.aVoir.map(f => f.id);
        const aVoirAmi    = snap.data().listes?.aVoir || [];
        const filmsCommuns = aVoirAmi.filter(f => idsUser.includes(f.id));
        setMatches(filmsCommuns);
      } catch {
        setMatches([]);
      }
      setLoading(false);
    }
    charger();
  }, [ami, listesUser]);

  function tirerAuSort() {
    if (!matches || matches.length === 0) return;
    const pool   = filmTire ? matches.filter(f => f.id !== filmTire.id) : matches;
    const source = pool.length > 0 ? pool : matches;
    setFilmTire(source[Math.floor(Math.random() * source.length)]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Confettis */}
      <div aria-hidden="true">
        {confettis.map(c => (
          <div key={c.id} style={{
            position: "fixed", top: "-10px", left: `${c.x}vw`,
            width: c.taille, height: c.taille,
            background: c.couleur,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `tomber ${c.duree}s ${c.delai}s ease-in forwards`,
            transform: `rotate(${c.rotation}deg)`,
            zIndex: 999, pointerEvents: "none",
          }} />
        ))}
      </div>

      <button onClick={onRetour} style={btnRetourStyle}><IconeFleche vers="gauche" taille={15} /> Retour</button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Avatar username={ami.username} size={42} />
        <div>
          <p style={{ margin: 0, fontSize: "var(--t-lg)", fontWeight: "bold" }}>@{ami.username}</p>
          <p style={{ margin: 0, color: "var(--text-3)", fontSize: "var(--t-sm)" }}>Films à voir en commun</p>
        </div>
      </div>

      {loading ? (
        <p role="status" style={{ color: "var(--text-3)", textAlign: "center", padding: "20px" }}>Chargement…</p>
      ) : (
        <div aria-live="polite">
          {matches === null || matches.length === 0 ? (
            <div style={{
              background: "var(--surface)", borderRadius: "var(--r-md)",
              padding: "28px", textAlign: "center",
              border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: "var(--t-2xl)", margin: "0 0 12px" }}>🤷</p>
              <p style={{ color: "var(--text-3)", margin: 0, fontSize: "var(--t-sm)", lineHeight: "1.6" }}>
                Aucun film en commun pour l'instant.<br />Swipez plus tous les deux !
              </p>
            </div>
          ) : (
            <>
              <div style={{
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "var(--r-md)", padding: "16px",
                textAlign: "center", marginBottom: "12px",
              }}>
                <p style={{ fontSize: "var(--t-2xl)", margin: "0 0 4px" }}>🎉</p>
                <p style={{ color: "var(--green-txt)", fontSize: "var(--t-md)", fontWeight: "700", margin: 0 }}>
                  {matches.length} film{matches.length > 1 ? "s" : ""} en commun !
                </p>
              </div>

              <button onClick={tirerAuSort} style={{
                background: "var(--amber)", color: "var(--bg)",
                border: "none", borderRadius: "var(--r-md)",
                padding: "14px", fontSize: "var(--t-md)",
                fontWeight: "700", cursor: "pointer",
                width: "100%", marginBottom: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", 
                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
              }}>
                <IconeDe taille={18} /> {filmTire ? "Retirer au sort" : "Choisir au sort"}
              </button>

              {filmTire && (
                <div style={{
                  display: "flex", gap: "14px", alignItems: "center",
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "var(--r-md)", padding: "14px", marginBottom: "12px",
                  animation: "slideUp 0.25s ease-out",
                }}>
                  <img
                    src={`https://image.tmdb.org/t/p/w92${filmTire.poster_path}`}
                    alt={`Affiche de ${filmTire.title}`}
                    style={{ borderRadius: "var(--r-xs)", width: "54px", flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "var(--t-xs)", color: "var(--amber-txt)", fontWeight: "700", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                      Ce soir on regarde
                    </p>
                    <p style={{ margin: 0, fontSize: "var(--t-md)", fontWeight: "700", color: "var(--text)" }}>{filmTire.title}</p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {matches.map(film => (
                  <div key={film.id} style={{
                    display: "flex", gap: "12px", alignItems: "center",
                    background: filmTire?.id === film.id ? "rgba(245,158,11,0.08)" : "var(--surface)",
                    border: `1px solid ${filmTire?.id === film.id ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
                    borderRadius: "var(--r-sm)", padding: "10px",
                    transition: "all 0.2s",
                  }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w92${film.poster_path}`}
                      alt={`Affiche de ${film.title}`}
                      style={{ borderRadius: "var(--r-xs)", width: "44px", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "var(--t-sm)", color: "var(--text)", fontWeight: "500" }}>{film.title}</span>
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

// ─── Composant principal ──────────────────────────────────────────────────────

function Match({ user, username, listesUser, isGuest, onSeConnecter }) {
  const [vue, setVue]                       = useState("amis");
  const [amis, setAmis]                     = useState([]);
  const [demandesRecues, setDemandesRecues] = useState([]);
  const [amiSelectionne, setAmiSelectionne] = useState(null);
  const [copied, setCopied]                 = useState(null); // "pseudo" | "partage" | null
  const [chargement, setChargement]         = useState(!isGuest);

  const chargerAmis = useCallback(async () => {
    if (!user || isGuest) return;
    setChargement(true);
    try {
      const [snap1, snap2, snap3] = await Promise.all([
        getDocs(query(collection(db, "friendRequests"),
          where("fromUid", "==", user.uid), where("status", "==", "accepted"))),
        getDocs(query(collection(db, "friendRequests"),
          where("toUid", "==", user.uid), where("status", "==", "accepted"))),
        getDocs(query(collection(db, "friendRequests"),
          where("toUid", "==", user.uid), where("status", "==", "pending"))),
      ]);

      setAmis([
        ...snap1.docs.map(d => ({ id: d.id, uid: d.data().toUid,   username: d.data().toUsername   })),
        ...snap2.docs.map(d => ({ id: d.id, uid: d.data().fromUid, username: d.data().fromUsername })),
      ]);
      setDemandesRecues(snap3.docs.map(d => ({
        id: d.id,
        uid: d.data().fromUid,
        username: d.data().fromUsername,
      })));
    } catch (e) {
      console.error("Erreur chargement amis:", e);
    }
    setChargement(false);
  }, [user, isGuest]);

  useEffect(() => { chargerAmis(); }, [chargerAmis]);

  async function accepterDemande(demande) {
    try {
      await updateDoc(doc(db, "friendRequests", demande.id), { status: "accepted" });
      await chargerAmis();
    } catch (e) { console.error(e); }
  }

  async function refuserDemande(demande) {
    try {
      await deleteDoc(doc(db, "friendRequests", demande.id));
      await chargerAmis();
    } catch (e) { console.error(e); }
  }

  async function copierPseudo() {
    try {
      await navigator.clipboard.writeText(username);
      setCopied("pseudo");
      setTimeout(() => setCopied(null), 2500);
    } catch { /* silencieux */ }
  }

  async function partagerPseudo() {
    const texte = `Rejoins-moi sur Swochi ! Mon pseudo : @${username}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Swochi", text: texte }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(texte);
      setCopied("partage");
      setTimeout(() => setCopied(null), 2500);
    } catch { /* silencieux */ }
  }

  if (vue === "ajouter") {
    return (
      <div style={conteneurStyle}>
        <VueAjouter
          myUid={user.uid}
          myUsername={username}
          onRetour={() => { setVue("amis"); chargerAmis(); }}
        />
      </div>
    );
  }

  if (vue === "comparer" && amiSelectionne) {
    return (
      <div style={conteneurStyle}>
        <VueComparer
          ami={amiSelectionne}
          listesUser={listesUser}
          onRetour={() => setVue("amis")}
        />
      </div>
    );
  }

  /* ── Mode invité ── */
  if (isGuest) {
    return (
      <div style={conteneurStyle}>
        {/* Bannière info */}
        <div style={{
          background: "var(--accent-doux)", border: "1px solid rgb(var(--accent-rvb) / 0.2)",
          borderRadius: "var(--r-md)", padding: "16px 18px", marginBottom: "20px",
          display: "flex", gap: "12px", alignItems: "flex-start",
        }}>
          <span style={{ color: "var(--accent-txt)", lineHeight: 1, flexShrink: 0, marginTop: "1px" }}><IconeCadenas taille={20} /></span>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "var(--t-sm)", fontWeight: "600", color: "var(--accent-txt)" }}>
              Les amis nécessitent un compte
            </p>
            <p style={{ margin: "0 0 12px", fontSize: "var(--t-sm)", color: "var(--text-3)", lineHeight: "1.5" }}>
              Crée un compte gratuit pour ajouter des amis et comparer vos listes de films.
            </p>
            <button onClick={onSeConnecter} style={{
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: "var(--r-lg)", padding: "0 18px", minHeight: "var(--touch)",
              fontSize: "var(--t-sm)", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", 
            }}>
              Créer un compte <IconeFleche taille={15} />
            </button>
          </div>
        </div>

        {/* Aperçu désactivé */}
        <div style={{ opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-md)", padding: "14px", marginBottom: "8px", border: "1px solid var(--border)" }}>
            <p style={{ margin: 0, fontSize: "var(--t-sm)", color: "var(--text-3)", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px", display: "flex", alignItems: "center", gap: "7px" }}><IconeAmis taille={14} /> Mes amis</p>
            {[1,2].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: i === 1 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-3)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "60%", height: 12, background: "var(--surface-3)", borderRadius: 6 }} />
                </div>
                <div style={{ width: 70, height: 28, background: "var(--surface-3)", borderRadius: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={conteneurStyle}>
      {chargement ? (
        <p role="status" style={{ color: "var(--text-3)", textAlign: "center", padding: "40px" }}>Chargement…</p>
      ) : (
        <VueAmis
          amis={amis}
          demandesRecues={demandesRecues}
          username={username}
          onComparer={ami => { setAmiSelectionne(ami); setVue("comparer"); }}
          onAccepter={accepterDemande}
          onRefuser={refuserDemande}
          onAjouter={() => setVue("ajouter")}
          onCopier={copierPseudo}
          onPartager={partagerPseudo}
          copied={copied}
        />
      )}
    </div>
  );
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const conteneurStyle    = { width: "100%", color: "var(--text)" };
const carteStyle        = { background: "var(--surface)", borderRadius: "var(--r-md)", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" };
/* Un élément flex refuse par défaut de se réduire sous la largeur de son
   contenu : sans minWidth, un pseudo long chassait le bouton hors de l'écran
   au lieu de se tronquer. */
const pseudoStyle       = { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--t-md)", fontWeight: "500" };
const titreSectionStyle = { margin: "0 0 10px", fontSize: "var(--t-xs)", fontWeight: "700", color: "var(--text-3)", letterSpacing: "1.2px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "7px" };
/* Icône et texte sur la même ligne optique : un SVG est une boîte, pas un
   glyphe, il ne s'aligne pas seul sur la ligne de base. */
const ligneIcone        = { margin: 0, display: "flex", alignItems: "center", gap: "6px" };
const btnVertStyle      = { background: "var(--green)", color: "white", border: "none", borderRadius: "var(--r-lg)", padding: "0 14px", minHeight: "var(--touch)", fontSize: "var(--t-sm)", fontWeight: "700", cursor: "pointer", flexShrink: 0 };
const btnGrisStyle      = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", background: "transparent", color: "var(--text-3)", border: "1px solid var(--border-2)", borderRadius: "var(--r-lg)", padding: "0 12px", minWidth: "var(--touch)", minHeight: "var(--touch)", fontSize: "var(--t-sm)", cursor: "pointer", flexShrink: 0 };
const btnRetourStyle    = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", background: "transparent", border: "none", color: "var(--text-3)", fontSize: "var(--t-sm)", cursor: "pointer", padding: "0 4px", minHeight: "var(--touch)" };

export default Match;
