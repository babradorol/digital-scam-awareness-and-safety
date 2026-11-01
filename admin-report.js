
import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Authorized administrator's Firebase UID
const ADMIN_UID = "VjQ0qznTsfMRzn3zyoHJkTTpUmn1";

const pageMessage = document.getElementById("pageMessage");
const reportSection = document.getElementById("reportSection");
const reportsList = document.getElementById("reportsList");
const searchInput = document.getElementById("searchReports");
const filterStatus = document.getElementById("filterStatus");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const reviewedCount = document.getElementById("reviewedCount");
const resolvedCount = document.getElementById("resolvedCount");

let allReports = [];
let isAuthorizedAdmin = false;
let isSaving = false;

function showMessage(text) {
  pageMessage.textContent = text;
}

function formatDate(value) {
  if (!value) return "Not provided";

  // Incident dates are saved as YYYY-MM-DD strings.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return String(value);
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "Not provided";

  return "KES " + amount.toLocaleString("en-KE");
}

function getStatusClass(status) {
  if (status === "Reviewed") return "status-reviewed";
  if (status === "Resolved") return "status-resolved";
  return "";
}

function updateSummary() {
  totalCount.textContent = allReports.length;

  pendingCount.textContent = allReports.filter(
    report => report.status === "Pending"
  ).length;

  reviewedCount.textContent = allReports.filter(
    report => report.status === "Reviewed"
  ).length;

  resolvedCount.textContent = allReports.filter(
    report => report.status === "Resolved"
  ).length;
}

function createDetail(label, value) {
  const item = document.createElement("div");
  item.className = "detail-item";

  const heading = document.createElement("strong");
  heading.textContent = label;

  const content = document.createElement("span");
  content.textContent = value;

  item.append(heading, content);

  return item;
}

function createReportCard(report) {
  const card = document.createElement("article");
  card.className = "report-card";

  const title = document.createElement("h3");
  title.textContent = report.scamType || "Scam report";

  const status = document.createElement("span");
  status.className =
    "status-badge " + getStatusClass(report.status);
  status.textContent = report.status || "Pending";

  const reference = document.createElement("p");
  reference.textContent = "Reference: " + report.reportId;

  const details = document.createElement("div");
  details.className = "report-details";

  details.append(
    createDetail("Submitted by", report.displayId || "Registered user"),
    createDetail("Platform", report.platform || "Not provided"),
    createDetail("Incident date", formatDate(report.incidentDate)),
    createDetail("Amount lost", formatAmount(report.amountLost))
  );

  const descriptionHeading = document.createElement("h4");
  descriptionHeading.textContent = "Report Description";

  const description = document.createElement("p");
  description.className = "report-description";
  description.textContent = report.description || "No description provided.";

  const management = document.createElement("div");
  management.className = "report-management";

  const statusLabel = document.createElement("label");
  statusLabel.textContent = "Update Report Status";

  const statusSelect = document.createElement("select");
  statusSelect.setAttribute("aria-label", "Report status");

  ["Pending", "Reviewed", "Resolved"].forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    statusSelect.appendChild(option);
  });

  statusSelect.value = ["Pending", "Reviewed", "Resolved"].includes(report.status)
    ? report.status
    : "Pending";

  const responseLabel = document.createElement("label");
  responseLabel.textContent = "Administrator Response";

  const responseInput = document.createElement("textarea");
  responseInput.placeholder =
    "Enter a response or guidance for the person who submitted this report...";
  responseInput.value = report.adminResponse || "";
  responseInput.setAttribute("aria-label", "Administrator response");

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "save-button";
  saveButton.textContent = "Save Changes";

  const saveMessage = document.createElement("p");
  saveMessage.setAttribute("role", "status");
  saveMessage.setAttribute("aria-live", "polite");

  saveButton.addEventListener("click", async () => {
    if (!isAuthorizedAdmin || isSaving) return;

    saveButton.disabled = true;
    saveMessage.textContent = "Saving changes...";

    try {
      const reportPath =
        `reports/${report.userUid}/${report.reportId}`;

      await update(ref(db, reportPath), {
        status: statusSelect.value,
        adminResponse: responseInput.value.trim(),
        updatedAt: Date.now()
      });

      // Update local data after Firebase confirms the write.
      report.status = statusSelect.value;
      report.adminResponse = responseInput.value.trim();
      report.updatedAt = Date.now();

      status.textContent = report.status;
      status.className =
        "status-badge " + getStatusClass(report.status);

      updateSummary();

      saveMessage.textContent = "Changes saved successfully.";
    } catch (error) {
      console.error("Error updating report:", error);

      saveMessage.textContent =
        "Could not save changes. Check Firebase database permissions and connection.";
    } finally {
      saveButton.disabled = false;
    }
  });

  management.append(
    statusLabel,
    statusSelect,
    responseLabel,
    responseInput,
    saveButton,
    saveMessage
  );

  card.append(
    title,
    status,
    reference,
    details,
    descriptionHeading,
    description,
    management
  );

  return card;
}

function renderReports() {
  reportsList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = filterStatus.value;

  const filteredReports = allReports.filter(report => {
    const matchesStatus =
      selectedStatus === "All" || report.status === selectedStatus;

    const searchableText = [
      report.scamType,
      report.platform,
      report.description,
      report.reportId,
      report.displayId
    ].join(" ").toLowerCase();

    return matchesStatus && searchableText.includes(searchTerm);
  });

  if (filteredReports.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = allReports.length === 0
      ? "No scam reports have been submitted yet."
      : "No reports match your search or selected status.";

    reportsList.appendChild(emptyMessage);
    return;
  }

  filteredReports.forEach(report => {
    reportsList.appendChild(createReportCard(report));
  });
}

async function loadReports() {
  showMessage("Loading submitted scam reports...");

  try {
    const snapshot = await get(ref(db, "reports"));

    allReports = [];

    if (snapshot.exists()) {
      snapshot.forEach(userSnapshot => {
        const userUid = userSnapshot.key;

        userSnapshot.forEach(reportSnapshot => {
          const reportData = reportSnapshot.val();

          allReports.push({
            ...reportData,
            userUid,
            reportId: reportSnapshot.key,
            status: reportData.status || "Pending"
          });
        });
      });
    }

    // Show newest reports first.
    allReports.sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    updateSummary();
    renderReports();

    reportSection.hidden = false;
    showMessage("Reports loaded successfully.");
  } catch (error) {
    console.error("Error loading reports:", error);

    showMessage(
      "Unable to load reports. Firebase database rules must allow the authorized administrator to read reports."
    );
  }
}

searchInput.addEventListener("input", renderReports);
filterStatus.addEventListener("change", renderReports);

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  if (user.uid !== ADMIN_UID) {
    window.location.replace("registered-user.html");
    return;
  }

  isAuthorizedAdmin = true;
  await loadReports();
});
