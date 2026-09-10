import { render, screen } from '@testing-library/react';

jest.mock('./firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  // App attend une fonction de désabonnement en retour : sans elle,
  // le démontage lève « unsubscribe is not a function ». Fonction simple et
  // non jest.fn() : `resetMocks`, activé par défaut chez CRA, effacerait
  // l'implémentation d'un mock avant chaque test.
  onAuthStateChanged: () => () => {},
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

import App from './App';

test('affiche le titre SWOCHI', () => {
  render(<App />);
  expect(screen.getByText(/swochi/i)).toBeInTheDocument();
});
