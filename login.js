
import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const button = document.getElementById("loginButton");

// The Firebase UID of the authorized administrator
const ADMIN_UID = "VjQ0qznTsfMRzn3zyoHJkTTpUmn1";

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const selectedRole = document.getElementById("loginRole").value;

  button.disabled = true;
  button.textContent = "Logging in...";
  message.textContent = "";

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    if (selectedRole === "admin") {
      // Only the designated administrator can access the admin dashboard
      if (user.uid !== ADMIN_UID) {
        await signOut(auth);

        message.textContent =
          "Access denied. This account is not authorized as an administrator.";

        return;
      }

      window.location.href = "admin-dashboard.html";
      return;
    }

    // Prevent the administrator from entering the registered-user dashboard
    if (user.uid === ADMIN_UID) {
      await signOut(auth);

      message.textContent =
        "Please select Administrator to access your dashboard.";

      return;
    }

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

    button.textContent =
      selectedRole === "admin"
        ? "Login as Administrator 🛡️"
        : "Login as Registered User ✨";
  }
});
