import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./auth.js";

export function protectPage() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Not logged in, redirect away
      window.location.href = "/index.html";
    }
  });
}
