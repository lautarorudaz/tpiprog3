import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";

export const registrarse = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const iniciarSesion = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const cerrarSesion = () => signOut(auth);

export const enviarResetPassword = (email) =>
  sendPasswordResetEmail(auth, email);