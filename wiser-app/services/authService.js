import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

// Registro
export const registrarse = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

// Login
export const iniciarSesion = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Logout
export const cerrarSesion = () => signOut(auth);