import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { Capacitor } from "@capacitor/core";

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
// App Check — web uniquement.
//
// reCAPTCHA v3 atteste une origine web. Dans la WebView Android, la page est
// servie depuis https://localhost : reCAPTCHA refuse cette origine (400), et
// le SDK enchaîne les tentatives puis throttle. Vérifié sur l'appareil.
// Autoriser « localhost » côté reCAPTCHA serait pire : n'importe quelle page
// locale pourrait alors obtenir un jeton valide.
//
// L'app native reste protégée par les règles Firestore. Si App Check devait un
// jour être *appliqué* (il ne l'est pas aujourd'hui sur ce projet), il faudrait
// un fournisseur natif Play Integrity, pas reCAPTCHA.
if (process.env.REACT_APP_RECAPTCHA_KEY && !Capacitor.isNativePlatform()) {
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
