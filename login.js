
import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const button = document.getElementById("loginButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  button.disabled = true;
  button.textContent = "Logging in...";
  message.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "registered-user.html";
  } catch (error) {
    const errors = {
      "auth/invalid-credential":
        "Incorrect email or password. Please try again.",
      "auth/user-not-found":
        "No account found. Please register first.",
      "auth/too-many-requests":
        "Too many attempts. Please wait before trying again.",
      "auth/network-request-failed":
        "Check your internet connection and try again."
    };

    message.textContent =
      errors[error.code] || "Login failed. Please try again.";

    console.error("Login error:", error);
  } finally {
    button.disabled = false;
    button.textContent = "Login ✨";
  }
});
