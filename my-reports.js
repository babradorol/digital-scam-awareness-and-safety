
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const reportsList = document.getElementById("reportsList");
const reportsMessage = document.getElementById("reportsMessage");

const totalReports = document.getElementById("totalReports");
const pendingReports = document.getElementById("pendingReports");
const reviewedReports = document.getElementById("reviewedReports");
const resolvedReports = document.getElementById("resolvedReports");

let stopListening = null;

function updateSummary(reports) {
  totalReports.textContent = reports.length;

  pendingReports.textContent = reports.filter(
    report => String(report.status || "Pending").toLowerCase() === "pending"
  ).length;

  reviewedReports.textContent = reports.filter(
    report => String(report.status || "").toLowerCase() === "reviewed"
  ).length;

  resolvedReports.textContent = reports.filter(
    report => String(report.status || "").toLowerCase() === "resolved"
  ).length;
}

function formatDate(value) {
  if (!value || value === "Not provided") {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function createReportCard(report) {
  const card = document.createElement("article");
  card.className = "report-card";

  const heading = document.createElement("h2");
  heading.textContent = `🚨 ${report.scamType || "Suspected Scam"}`;

  const statusText = String(report.status || "Pending");
  const status = document.createElement("span");
  status.className = "status";

  if (statusText.toLowerCase() === "reviewed") {
    status.classList.add("reviewed");
  } else if (statusText.toLowerCase() === "resolved") {
    status.classList.add("resolved");
  }

  status.textContent = statusText;

  const platform = document.createElement("p");
  platform.textContent = `Platform: ${report.platform || "Not provided"}`;

  const incidentDate = document.createElement("p");
  incidentDate.textContent =
    `Incident date: ${formatDate(report.incidentDate)}`;

  const amount = document.createElement("p");
  amount.textContent =
    report.amountLost === null ||
    report.amountLost === undefined ||
    report.amountLost === ""
      ? "Estimated money lost: Not provided"
      : `Estimated money lost: KES ${Number(report.amountLost).toLocaleString("en-KE")}`;

  const description = document.createElement("p");
  description.textContent =
    `Description: ${report.description || "No description provided"}`;

  const submitted = document.createElement("p");
  submitted.textContent =
    `Submitted: ${formatDate(report.createdAt)}`;

  card.append(
    heading,
    status,
    platform,
    incidentDate,
    amount,
    description,
    submitted
  );

  return card;
}

onAuthStateChanged(auth, (user) => {
  if (stopListening) {
    stopListening();
    stopListening = null;
  }

  reportsList.replaceChildren();
  updateSummary([]);

  if (!user) {
    reportsMessage.textContent = "Please log in to view your reports.";
    window.location.replace("login.html");
    return;
  }

  reportsMessage.textContent = "Loading your reports...";

  const reportsRef = ref(db, `reports/${user.uid}`);

  stopListening = onValue(
    reportsRef,
    (snapshot) => {
      reportsList.replaceChildren();

      const data = snapshot.val();

      const reports = data
        ? Object.entries(data).map(([id, report]) => ({
            ...report,
            id
          }))
        : [];

      reports.sort(
        (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
      );

      updateSummary(reports);

      if (reports.length === 0) {
        reportsMessage.textContent = "";

        const empty = document.createElement("div");
        empty.className = "empty-state";

        const title = document.createElement("h3");
        title.textContent = "No reports yet 💜";

        const text = document.createElement("p");
        text.textContent =
          "When you submit a suspected scam report, it will appear here.";

        const link = document.createElement("a");
        link.className = "primary-link";
        link.href = "report-scam.html";
        link.textContent = "Report a Scam";

        empty.append(title, text, link);
        reportsList.appendChild(empty);
        return;
      }

      reportsMessage.textContent =
        `You have submitted ${reports.length} report(s).`;

      reports.forEach((report) => {
        reportsList.appendChild(createReportCard(report));
      });
    },
    (error) => {
      console.error("Unable to load reports:", error);
      reportsMessage.textContent =
        "Unable to load your reports. Check your connection and Firebase database rules.";
    }
  );
});
