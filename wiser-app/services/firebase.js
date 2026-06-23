import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBB7o2ulLbYpQpzee8byyUpkanldeU2qWA",
  authDomain: "wiser-app-ff1ae.firebaseapp.com",
  projectId: "wiser-app-ff1ae",
  storageBucket: "wiser-app-ff1ae.firebasestorage.app",
  messagingSenderId: "55196130045",
  appId: "1:55196130045:web:f4f6879863078a07333c94"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;