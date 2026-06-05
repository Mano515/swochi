function Profil({ username, user, listes }) {
  const totalSwipes = listes.aVoir.length + listes.pasInteresse.length + listes.dejavu.length;
  const initiale = username ? username[0].toUpperCase() : "?";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Avatar + nom */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "24px 0 8px" }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, #a855f7, #3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "28px", fontWeight: "bold", color: "white",
        }}>
          {initiale}
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "bold" }}>@{username}</p>
          <p style={{ margin: 0, color: "#555", fontSize: "13px" }}>{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: "#1a1a1a", borderRadius: "16px", padding: "20px" }}>
        <p style={{ margin: "0 0 16px", color: "#888", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" }}>
          MES STATS
        </p>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <StatItem valeur={totalSwipes}              label="Swipés" />
          <StatItem valeur={listes.aVoir.length}      label="À voir" couleur="#22c55e" />
          <StatItem valeur={listes.dejavu.length}     label="Déjà vu" couleur="#3b82f6" />
          <StatItem valeur={listes.pasInteresse.length} label="Skippés" couleur="#ef4444" />
        </div>
      </div>

      {/* Info compte */}
      <div style={{ background: "#1a1a1a", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <p style={{ margin: "0 0 4px", color: "#888", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" }}>
          MON COMPTE
        </p>
        <InfoLigne label="Pseudo" valeur={`@${username}`} />
        <InfoLigne label="Email" valeur={user?.email} />
      </div>

    </div>
  );
}

function StatItem({ valeur, label, couleur = "white" }) {
  return (
    <div>
      <p style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "bold", color: couleur }}>{valeur}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{label}</p>
    </div>
  );
}

function InfoLigne({ label, valeur }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "#666", fontSize: "14px" }}>{label}</span>
      <span style={{ color: "#ccc", fontSize: "14px" }}>{valeur}</span>
    </div>
  );
}

export default Profil;
