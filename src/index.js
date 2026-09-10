import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './ThemeContext';
import reportWebVitals from './reportWebVitals';
import { masquerSplash } from './native';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Splash natif (Android) : on le retire une fois la 1re image peinte,
// pour passer au SplashScreen React sans flash blanc entre les deux.
requestAnimationFrame(() => requestAnimationFrame(masquerSplash));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
