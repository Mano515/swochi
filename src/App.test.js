import { render, screen } from '@testing-library/react';

jest.mock('./firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
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
