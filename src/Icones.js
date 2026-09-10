/* ══════════════════════════════════════════════════
   SWOCHI — Icônes

   SVG en trait, dessinées sur une grille 24×24.
   Elles héritent de `currentColor`, donc elles suivent
   automatiquement l'état actif et le thème clair/sombre.
   Remplacent les emojis, qui rendaient différemment
   selon l'OS et donnaient un aspect bricolé.
══════════════════════════════════════════════════ */

function Svg({ children, taille = 20, remplir = false }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill={remplir ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: "block" }}
    >
      {children}
    </svg>
  );
}

// Découvrir — étincelles
export const IconeDecouvrir = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" />
    <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
  </Svg>
);

// Amis — deux silhouettes
export const IconeAmis = (p) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

// Mes films — pellicule
export const IconeFilms = (p) => (
  <Svg {...p}>
    <rect x="2" y="3" width="20" height="18" rx="2.5" />
    <path d="M7 3v18M17 3v18M2 12h20M2 7.5h5M2 16.5h5M17 7.5h5M17 16.5h5" />
  </Svg>
);

// Profil — silhouette
export const IconeProfil = (p) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

// Thème clair — soleil
export const IconeSoleil = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

// Thème sombre — lune
export const IconeLune = (p) => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
);

// Passer — croix
export const IconeCroix = (p) => (
  <Svg {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

// Déjà vu — œil
export const IconeOeil = (p) => (
  <Svg {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

// À voir — cœur plein (action principale, il doit peser visuellement)
export const IconeCoeur = (p) => (
  <Svg {...p} remplir>
    <path d="M12 20.7S3.8 16 3.8 10.2a4.7 4.7 0 0 1 8.2-3.1 4.7 4.7 0 0 1 8.2 3.1c0 5.8-8.2 10.5-8.2 10.5z" strokeWidth="1.2" />
  </Svg>
);

// Annuler — flèche en demi-tour
export const IconeRetour = (p) => (
  <Svg {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </Svg>
);

// Rechercher — loupe
export const IconeRecherche = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20.2 20.2l-4-4" />
  </Svg>
);

// Information — remarque contextuelle
export const IconeInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16.5v-5M12 7.8h.01" />
  </Svg>
);

// Table de correspondance utilisée par les deux menus
export const ICONES_NAV = {
  swipe:    IconeDecouvrir,
  match:    IconeAmis,
  mesfilms: IconeFilms,
  profil:   IconeProfil,
};
