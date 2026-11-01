
import { db, auth } from "./firebase-config.js";

import {
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Authorised administrator's Firebase UID
const ADMIN_UID = "VjQ0qznTsfMRzn3zyoHJkTTpUmn1";

// Get HTML elements
const tipForm = document.getElementById("tip-form");

const titleInput = document.getElementById("tip-title");
const emojiInput = document.getElementById("tip-emoji");
const descriptionInput = document.getElementById("tip-description");

const tipsContainer = document.getElementById("tips-container");
const formMessage = document.getElementById("form-message");

const saveButton = document.getElementById("save-btn");
const cancelButton = document.getElementById("cancel-btn");
const formHeading = document.getElementById("form-heading");

// Firebase safety tips location
const tipsRef = ref(db, "safetyTips");

// Stores the ID of a tip being edited
let editingTipId = null;


// CHECK ADMIN ACCESS
onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (user.uid !== ADMIN_UID) {
        alert("You are not authorised to access this page.");
        window.location.href = "registered-user.html";
        return;
    }

    loadTips();
});


// ADD OR UPDATE A SAFETY TIP
tipForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const tipData = {
        title: titleInput.value.trim(),
        emoji: emojiInput.value.trim(),
        description: descriptionInput.value.trim(),
        updatedAt: new Date().toISOString()
    };

    if (
        !tipData.title ||
        !tipData.emoji ||
        !tipData.description
    ) {
        showMessage("Please fill in all the fields.", "red");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {

        if (editingTipId) {

            // Update an existing safety tip
            const tipRef = ref(
                db,
                `safetyTips/${editingTipId}`
            );

            await update(tipRef, tipData);

            showMessage("Safety tip updated successfully!", "green");

        } else {

            // Add a new safety tip
            const newTipRef = push(tipsRef);

            tipData.createdAt = new Date().toISOString();

            await set(newTipRef, tipData);

            showMessage("Safety tip added successfully!", "green");
        }

        resetForm();

    } catch (error) {

        console.error("Error saving safety tip:", error);

        showMessage(
            "Unable to save safety tip. Check your Firebase permissions.",
            "red"
        );

    } finally {

        saveButton.disabled = false;
    }
});


// DISPLAY SAFETY TIPS FROM FIREBASE
function loadTips() {

    onValue(tipsRef, (snapshot) => {

        tipsContainer.innerHTML = "";

        if (!snapshot.exists()) {

            tipsContainer.textContent =
                "No additional safety tips have been added yet.";

            return;
        }

        snapshot.forEach((childSnapshot) => {

            const tipId = childSnapshot.key;
            const tip = childSnapshot.val();

            const tipCard = document.createElement("div");
            tipCard.className = "managed-tip";

            const heading = document.createElement("h3");

            heading.textContent =
                `${tip.emoji || "💡"} ${tip.title || "Untitled Tip"}`;

            const description = document.createElement("p");
            description.textContent = tip.description || "";

            const actions = document.createElement("div");
            actions.className = "tip-actions";

            // Edit button
            const editButton = document.createElement("button");

            editButton.textContent = "Edit";
            editButton.className = "tip-btn edit-btn";

            editButton.addEventListener("click", () => {
                editTip(tipId, tip);
            });

            // Delete button
            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "tip-btn delete-btn";

            deleteButton.addEventListener("click", () => {
                deleteTip(tipId);
            });

            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            tipCard.appendChild(heading);
            tipCard.appendChild(description);
            tipCard.appendChild(actions);

            tipsContainer.appendChild(tipCard);

        });

    }, (error) => {

        console.error("Error loading safety tips:", error);

        tipsContainer.textContent =
            "Unable to load safety tips. Check your Firebase permissions.";

    });
}


// EDIT A SAFETY TIP
function editTip(tipId, tip) {

    editingTipId = tipId;

    titleInput.value = tip.title || "";
    emojiInput.value = tip.emoji || "";
    descriptionInput.value = tip.description || "";

    formHeading.textContent = "Edit Safety Tip";
    saveButton.textContent = "Update Safety Tip";

    cancelButton.hidden = false;

    formMessage.textContent = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// DELETE A SAFETY TIP
async function deleteTip(tipId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this safety tip?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const tipRef = ref(
            db,
            `safetyTips/${tipId}`
        );

        await remove(tipRef);

        showMessage("Safety tip deleted successfully!", "green");

    } catch (error) {

        console.error("Error deleting safety tip:", error);

        showMessage(
            "Unable to delete safety tip. Check your Firebase permissions.",
            "red"
        );
    }
}


// RESET THE FORM
function resetForm() {

    tipForm.reset();

    editingTipId = null;

    formHeading.textContent = "Add a New Safety Tip";
    saveButton.textContent = "Save Safety Tip";

    cancelButton.hidden = true;
}


// DISPLAY A MESSAGE
function showMessage(message, color) {

    formMessage.textContent = message;
    formMessage.style.color = color;
}


// CANCEL EDITING
cancelButton.addEventListener("click", () => {

    resetForm();

    formMessage.textContent = "";
});
