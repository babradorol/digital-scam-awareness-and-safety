
import { db } from "./firebase-config.js";
import { ref, get } from
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const cards = document.getElementById("scamCards");
const tips = document.getElementById("safetyList");
const status = document.getElementById("firebaseStatus");

const sampleScams = [
  { icon: "🎣", title: "Phishing Scams",
    description: "Fake messages and links that try to steal personal details." },
  { icon: "💼", title: "Fake Job Offers",
    description: "Fraudulent jobs that may demand fees or private information." },
  { icon: "🛍️", title: "Shopping Scams",
    description: "Fake sellers who take payments without delivering goods." },
  { icon: "📈", title: "Investment Scams",
    description: "False promises of high profits to trick people into sending money." }
];

const sampleTips = [
  "✅ Verify messages before clicking links.",
  "✅ Never share your passwords or PIN.",
  "✅ Check sellers and job offers carefully.",
  "✅ Be cautious of guaranteed profits.",
  "✅ Report suspected scams to relevant authorities."
];

function showScams(data) {
  cards.replaceChildren();
  const items = data ? Object.values(data) : sampleScams;

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = `card ${["pink", "yellow", "blue", "green"][index % 4]}`;

    const icon = document.createElement("div");
    icon.className = "emoji";
    icon.textContent = item.icon || "🛡️";

    const title = document.createElement("h3");
    title.textContent = item.title || "Scam Awareness";

    const description = document.createElement("p");
    description.textContent = item.description || "";

    card.append(icon, title, description);
    cards.appendChild(card);
  });
}

function showTips(data) {
  tips.replaceChildren();
  const items = data ? Object.values(data) : sampleTips;

  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = typeof item === "string"
      ? item
      : `✅ ${item.text || item.title || ""}`;
    tips.appendChild(li);
  });
}

async function loadContent() {
  try {
    const [scams, safety] = await Promise.all([
      get(ref(db, "scamAwareness")),
      get(ref(db, "safetyTips"))
    ]);

    showScams(scams.val());
    showTips(safety.val());

    status.textContent = "✓ Connected to Firebase";
    if (!scams.exists() && !safety.exists()) {
      status.textContent += " — sample content shown";
    }
  } catch (error) {
    showScams(null);
    showTips(null);
    status.textContent = "Firebase connection failed. Check configuration and rules.";
    console.error("Firebase error:", error);
  }
}

loadContent();
