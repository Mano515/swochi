import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// App Check — actif uniquement si la clé est définie
// (en développement local, on peut laisser REACT_APP_RECAPTCHA_KEY vide
//  et activer le mode debug via la console Firebase)
// Dans l'app Android, la page est servie depuis https://localhost : ce domaine
// doit figurer dans les domaines autorisés de la clé reCAPTCHA, sinon
// l'initialisation échoue. On l'isole pour ne pas bloquer le démarrage —
// l'application reste protégée côté serveur par les règles Firestore.
if (process.env.REACT_APP_RECAPTCHA_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn("App Check non initialisé :", e?.message);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
