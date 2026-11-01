
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

// The authorised administrator's Firebase UID
const ADMIN_UID = "VjQ0qznTsfMRzn3zyoHJkTTpUmn1";

// Get the HTML elements
const articleForm = document.getElementById("article-form");
const titleInput = document.getElementById("article-title");
const emojiInput = document.getElementById("article-emoji");
const descriptionInput = document.getElementById("article-description");
const warningInput = document.getElementById("article-warning");
const safetyInput = document.getElementById("article-safety");

const articlesContainer = document.getElementById("articles-container");
const formMessage = document.getElementById("form-message");
const saveButton = document.getElementById("save-btn");
const cancelButton = document.getElementById("cancel-btn");
const formHeading = document.getElementById("form-heading");

// Firebase database location
const articlesRef = ref(db, "scamAwareness");

// Stores the ID of an article being edited
let editingArticleId = null;

// Check whether the user is the administrator
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

    // Load articles after confirming the administrator
    loadArticles();
});


// ADD OR UPDATE AN ARTICLE
articleForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const articleData = {
        title: titleInput.value.trim(),
        emoji: emojiInput.value.trim(),
        description: descriptionInput.value.trim(),
        warningSigns: warningInput.value.trim(),
        safetyAdvice: safetyInput.value.trim(),
        updatedAt: new Date().toISOString()
    };

    if (
        !articleData.title ||
        !articleData.emoji ||
        !articleData.description ||
        !articleData.warningSigns ||
        !articleData.safetyAdvice
    ) {
        formMessage.textContent = "Please fill in all the fields.";
        formMessage.style.color = "red";
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {

        if (editingArticleId) {

            // Update an existing article
            const articleRef = ref(
                db,
                `scamAwareness/${editingArticleId}`
            );

            await update(articleRef, articleData);

            formMessage.textContent = "Article updated successfully!";

        } else {

            // Create a new article
            const newArticleRef = push(articlesRef);

            articleData.createdAt = new Date().toISOString();

            await set(newArticleRef, articleData);

            formMessage.textContent = "Article added successfully!";
        }

        formMessage.style.color = "green";

        resetForm();

    } catch (error) {

        console.error("Error saving article:", error);

        formMessage.textContent =
            "Unable to save article. Please try again.";

        formMessage.style.color = "red";

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = editingArticleId
            ? "Update Article"
            : "Save Article";
    }
});


// DISPLAY ARTICLES FROM FIREBASE
function loadArticles() {

    onValue(articlesRef, (snapshot) => {

        articlesContainer.innerHTML = "";

        if (!snapshot.exists()) {
            articlesContainer.textContent =
                "No additional articles have been added yet.";
            return;
        }

        snapshot.forEach((childSnapshot) => {

            const articleId = childSnapshot.key;
            const article = childSnapshot.val();

            const articleCard = document.createElement("div");
            articleCard.className = "managed-article";

            const heading = document.createElement("h3");
            heading.textContent =
                `${article.emoji || "📚"} ${article.title || "Untitled article"}`;

            const description = document.createElement("p");
            description.textContent = article.description || "";

            const warning = document.createElement("p");
            warning.textContent =
                `Warning Signs: ${article.warningSigns || ""}`;

            const safety = document.createElement("p");
            safety.textContent =
                `How to Stay Safe: ${article.safetyAdvice || ""}`;

            const actions = document.createElement("div");
            actions.className = "article-actions";

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "article-btn edit-btn";

            editButton.addEventListener("click", () => {
                editArticle(articleId, article);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "article-btn delete-btn";

            deleteButton.addEventListener("click", () => {
                deleteArticle(articleId);
            });

            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            articleCard.appendChild(heading);
            articleCard.appendChild(description);
            articleCard.appendChild(warning);
            articleCard.appendChild(safety);
            articleCard.appendChild(actions);

            articlesContainer.appendChild(articleCard);
        });
    }, (error) => {

        console.error("Error loading articles:", error);

        articlesContainer.textContent =
            "Unable to load articles. Please check your Firebase permissions.";
    });
}


// EDIT AN ARTICLE
function editArticle(articleId, article) {

    editingArticleId = articleId;

    titleInput.value = article.title || "";
    emojiInput.value = article.emoji || "";
    descriptionInput.value = article.description || "";
    warningInput.value = article.warningSigns || "";
    safetyInput.value = article.safetyAdvice || "";

    formHeading.textContent = "Edit Article";
    saveButton.textContent = "Update Article";
    cancelButton.hidden = false;

    formMessage.textContent = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// DELETE AN ARTICLE
async function deleteArticle(articleId) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this article?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const articleRef = ref(
            db,
            `scamAwareness/${articleId}`
        );

        await remove(articleRef);

        formMessage.textContent = "Article deleted successfully!";
        formMessage.style.color = "green";

    } catch (error) {

        console.error("Error deleting article:", error);

        formMessage.textContent =
            "Unable to delete article. Please try again.";

        formMessage.style.color = "red";
    }
}


// RESET THE FORM
function resetForm() {

    articleForm.reset();

    editingArticleId = null;

    formHeading.textContent = "Add a New Article";
    saveButton.textContent = "Save Article";

    cancelButton.hidden = true;
}


// CANCEL EDITING
cancelButton.addEventListener("click", () => {

    resetForm();

    formMessage.textContent = "";
});
