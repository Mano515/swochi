import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import reportWebVitals from './reportWebVitals';
import { masquerSplash } from './native';
import { MotionConfig } from 'framer-motion';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* `reducedMotion="user"` neutralise ressorts et déplacements dès que le
        système le demande, sans toucher aux neuf transitions de la carte.
        Les fondus d'opacité restent : ce ne sont pas des mouvements. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MotionConfig>
  </React.StrictMode>
);

// Splash natif (Android) : on le retire une fois la 1re image peinte,
// pour passer au SplashScreen React sans flash blanc entre les deux.
requestAnimationFrame(() => requestAnimationFrame(masquerSplash));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
