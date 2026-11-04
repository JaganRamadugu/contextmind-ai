import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth, googleProvider } from "../firebase";

// Google login
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Logout
export async function logout() {
  await signOut(auth);
}

// Track login status
export function listenToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}