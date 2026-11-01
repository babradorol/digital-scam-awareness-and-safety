import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const message = document.getElementById("dashboardMessage");
const logoutButton = document.getElementById("logoutButton");

// Your registered administrator's Firebase UID
const ADMIN_UID = "VjQ0qznTsfMRzn3zyoHJkTTpUmn1";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  // Allow only the designated admin account to open this page
  if (user.uid !== ADMIN_UID) {
    window.location.replace("registered-user.html");
    return;
  }

  message.textContent = "Welcome! You are signed in as the administrator.";
});

// Log out the administrator
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  message.textContent = "Logging out...";

  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout error:", error);
    message.textContent = "Unable to log out. Please try again.";
    logoutButton.disabled = false;
  }
});
