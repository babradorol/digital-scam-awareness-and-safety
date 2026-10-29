
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  ref,
  push,
  set
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const form = document.getElementById("reportForm");
const message = document.getElementById("reportMessage");
const submitButton = document.getElementById("submitReport");
const incidentDateInput = document.getElementById("incidentDate");

let currentUser = null;
let authReady = false;

// Get today's date in the user's local time.
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Prevent selecting a future incident date.
function setMaximumIncidentDate() {
  incidentDateInput.max = getTodayDate();
}

setMaximumIncidentDate();

// Check the user's login status.
onAuthStateChanged(auth, (user) => {
  authReady = true;
  currentUser = user;

  if (!user) {
    message.textContent = "Please log in to submit a report.";
    submitButton.disabled = true;
    return;
  }

  message.textContent = "";
  submitButton.disabled = false;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!authReady) {
    message.textContent =
      "Checking your account. Please try again shortly.";
    return;
  }

  if (!currentUser) {
    message.textContent =
      "Please log in before submitting a report.";
    return;
  }

  const scamType = document.getElementById("scamType").value;
  const platform = document.getElementById("platform").value;
  const incidentDate = incidentDateInput.value;
  const amountText = document.getElementById("amount").value;
  const description =
    document.getElementById("description").value.trim();

  if (!scamType || !platform || description.length < 10) {
    message.textContent = "Please complete the required fields.";
    return;
  }

  // Reject future incident dates, even if entered manually.
  const today = getTodayDate();

  if (incidentDate && incidentDate > today) {
    message.textContent =
      "The incident date cannot be in the future. Please select today or an earlier date.";
    incidentDateInput.max = today;
    return;
  }

  const amountLost =
    amountText === "" ? null : Number(amountText);

  if (
    amountLost !== null &&
    (!Number.isFinite(amountLost) || amountLost < 0)
  ) {
    message.textContent = "Please enter a valid amount.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  message.textContent = "";

  try {
    const reportsRef = ref(db, `reports/${currentUser.uid}`);
    const newReportRef = push(reportsRef);

    await set(newReportRef, {
      scamType,
      platform,
      incidentDate: incidentDate || "Not provided",
      amountLost,
      description,
      status: "Pending",
      createdAt: Date.now()
    });

    form.reset();
    setMaximumIncidentDate();

    message.textContent =
      "✅ Your report has been submitted successfully! Reference: " +
      newReportRef.key;

  } catch (error) {
    console.error("Report submission error:", error);

    message.textContent =
      "We could not submit your report. Please check your connection and Firebase database rules, then try again.";

  } finally {
    submitButton.disabled = !currentUser;
    submitButton.textContent = "Submit Report 🚀";
  }
});
