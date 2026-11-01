
import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const db = getDatabase();

const userName = document.getElementById("userName");
const userId = document.getElementById("userId");
const message = document.getElementById("dashboardMessage");
const logoutButton = document.getElementById("logoutButton");

// Check the signed-in user
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  userName.textContent = user.displayName || "User";
  message.textContent = "Loading your account details...";

  try {
    // Retrieve the user's profile using their Firebase UID
    const userRef = ref(db, "users/" + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const profile = snapshot.val();

      // Display the friendly ID saved in Firebase
      userId.textContent = profile.displayId || "Not assigned";
    } else {
      // The profile or display ID has not been created yet
      userId.textContent = "Not assigned";
    }

    message.textContent = "You are signed in successfully.";
  } catch (error) {
    console.error("Error loading user details:", error);
    userId.textContent = "Unavailable";
    message.textContent =
      "Your account is signed in, but your profile details could not be loaded.";
  }
});

// Log out
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  message.textContent = "Logging out...";

  try {
    await signOut(auth);
    window.location.replace("index.html");
  } catch (error) {
    message.textContent = "Unable to log out. Please try again.";
    logoutButton.disabled = false;
    console.error("Logout error:", error);
  }
});
