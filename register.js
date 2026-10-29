
import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const db = getDatabase();

const form = document.getElementById("registerForm");
const message = document.getElementById("message");
const button = document.getElementById("registerButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    return;
  }

  button.disabled = true;
  button.textContent = "Creating account...";
  message.textContent = "";

  let accountCreated = false;

  try {
    // 1. Create the Firebase Authentication account
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    accountCreated = true;

    // 2. Save the user's name in their Firebase profile
    await updateProfile(result.user, {
      displayName: name
    });

    // 3. Safely increment the shared user counter
    const counterResult = await runTransaction(
      ref(db, "metadata/userCounter"),
      (currentValue) => {
        return (currentValue || 0) + 1;
      }
    );

    if (!counterResult.committed) {
      throw new Error("Could not assign a user ID.");
    }

    // 4. Generate the display ID: U001, U002, U003...
    const number = counterResult.snapshot.val();
    const displayId = "U" + String(number).padStart(3, "0");

    // 5. Save the user's profile in Realtime Database
    await set(ref(db, "users/" + result.user.uid), {
      displayId: displayId,
      name: name,
      email: email,
      createdAt: Date.now()
    });

    message.textContent =
      "Account created successfully! Your ScamSafe User ID is " +
      displayId + ".";

    form.reset();

  } catch (error) {
    console.error("Registration error:", error);

    if (accountCreated) {
      message.textContent =
        "Your account was created, but your User ID could not be saved. " +
        "Please contact the administrator before registering again.";
    } else {
      const errors = {
        "auth/email-already-in-use":
          "This email is already registered. Please log in.",
        "auth/invalid-email":
          "Please enter a valid email address.",
        "auth/weak-password":
          "Please choose a stronger password.",
        "auth/network-request-failed":
          "Network error. Check your internet connection."
      };

      message.textContent =
        errors[error.code] ||
        "Could not create account. Please try again.";
    }
  } finally {
    button.disabled = false;
    button.textContent = "Create Account ✨";
  }
});
