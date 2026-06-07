function Profil({ username, user, listes }) {
  const totalSwipes = listes.aVoir.length + listes.pasInteresse.length + listes.dejavu.length;
  const initiale = username ? username[0].toUpperCase() : "?";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "8px" }}>

      {/* Avatar + nom */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "28px 0 12px" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "linear-gradient(135deg, #a855f7, #3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "30px", fontWeight: "700", color: "white",
          boxShadow: "0 6px 20px rgba(168,85,247,0.35)",
        }}>
          {initiale}
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 5px", fontSize: "21px", fontWeight: "700", color: "var(--text)" }}>@{username}</p>
          <p style={{ margin: 0, color: "var(--text-3)", fontSize: "13px" }}>{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        background: "var(--surface)", borderRadius: "18px", padding: "22px 20px",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
      }}>
        <p style={{ margin: "0 0 18px", color: "var(--text-3)", fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Mes stats
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", gap: "8px" }}>
          <StatItem valeur={totalSwipes}                label="Swipés" />
          <StatItem valeur={listes.aVoir.length}        label="À voir"   couleur="var(--green)" />
          <StatItem valeur={listes.dejavu.length}       label="Déjà vu"  couleur="var(--blue)" />
          <StatItem valeur={listes.pasInteresse.length} label="Skippés"  couleur="var(--red)" />
        </div>
      </div>

      {/* Info compte */}
      <div style={{
        background: "var(--surface)", borderRadius: "18px", padding: "22px 20px",
        border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <p style={{ margin: "0 0 4px", color: "var(--text-3)", fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Mon compte
        </p>
        <InfoLigne label="Pseudo" valeur={`@${username}`} />
        <div style={{ height: "1px", background: "var(--divider)" }} />
        <InfoLigne label="Email" valeur={user?.email} />
      </div>

    </div>
  );
}

function StatItem({ valeur, label, couleur = "var(--text)" }) {
  return (
    <div>
      <p style={{ margin: "0 0 4px", fontSize: "24px", fontWeight: "700", color: couleur }}>{valeur}</p>
      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-3)" }}>{label}</p>
    </div>
  );
}

function InfoLigne({ label, valeur }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <span style={{ color: "var(--text-3)", fontSize: "14px" }}>{label}</span>
      <span style={{ color: "var(--text-2)", fontSize: "14px", fontWeight: "500", textAlign: "right", wordBreak: "break-all" }}>{valeur}</span>
    </div>
  );
}

export default Profil;
