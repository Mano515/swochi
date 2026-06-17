function SplashScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "36px",
      zIndex: 9999,
      animation: "fonduIn 0.3s ease",
    }}>
      <img
        src="/logo_swochi_nom.svg"
        alt="Swochi"
        style={{ width: "200px", height: "auto" }}
      />

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: "var(--purple)",
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

export default SplashScreen;
