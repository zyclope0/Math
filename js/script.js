// Variables globales
let progress = 0;
let badges = [];
let allExercises = [];
let currentCategory = 'all';
let currentPage = 1;
const itemsPerPage = 5;
let totalExercises = 0; // Nombre total d'exercices disponibles

// URLs pour l'API Google Sheets
const EXERCISES_API_URL = "https://sheetdb.io/api/v1/lmomhherhri7g";
const PROGRESS_API_URL = "https://sheetdb.io/api/v1/lmomhherhri7g?sheet=Progress";

// Charger les exercices depuis l'API
async function loadExercises() {
    const loadingIndicator = document.querySelector("#loading-indicator");
    const exerciseContainer = document.querySelector("#exercises-container");

    // Afficher l'indicateur de chargement
    if (loadingIndicator) {
        loadingIndicator.style.display = "block";
    }

    try {
        // Réinitialiser le conteneur
        if (exerciseContainer) {
            exerciseContainer.innerHTML = "";
        }

        // Appeler l'API pour récupérer les exercices
        const response = await fetch(EXERCISES_API_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const exercisesData = await response.json();

        // Vérifier si des exercices sont disponibles
        if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
            throw new Error("Aucun exercice trouvé dans l'API.");
        }

        console.log("Exercices chargés :", exercisesData);

        // Stocker les exercices dans la variable globale
        allExercises = exercisesData;

        // Mettre à jour le nombre total d'exercices
        totalExercises = exercisesData.length;

        // Charger les catégories
        loadCategories();

        // Afficher les exercices
        renderExercises(allExercises);

    } catch (error) {
        console.error("Erreur lors du chargement des exercices :", error);
        alert("Impossible de charger les exercices.");
    } finally {
        // Masquer l'indicateur de chargement
        if (loadingIndicator) {
            loadingIndicator.style.display = "none";
        }
    }
}

// Charger les catégories dynamiquement
function loadCategories() {
    const categoriesMenu = document.querySelector("#categories-menu");
    if (!categoriesMenu) {
        console.warn("Conteneur des catégories (#categories-menu) introuvable.");
        return;
    }

    const categories = [...new Set(allExercises.map(exercise => exercise.category).filter(Boolean))];
    console.log("Catégories trouvées :", categories); // Debug

    categoriesMenu.innerHTML = '<button class="btn active" onclick="filterByCategory(\'all\', this)">Tous</button>';
    categories.forEach(category => {
        categoriesMenu.innerHTML += `<button class="btn" onclick="filterByCategory('${category}', this)">${category}</button>`;
    });
}

// Fonction pour filtrer les exercices et gérer l'état actif des catégories
function filterByCategory(category, button) {
    currentCategory = category;

    // Filtrer les exercices
    const filteredExercises = currentCategory === 'all'
        ? allExercises
        : allExercises.filter(exercise => exercise.category === currentCategory);

    // Afficher les exercices filtrés
    renderExercises(filteredExercises);

    // Gérer l'état actif des boutons
    const buttons = document.querySelectorAll("#categories-menu .btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    if (button) button.classList.add("active");
}

// Afficher les exercices avec pagination
function renderExercises(exercises) {
    const exerciseContainer = document.querySelector("#exercises-container"); // Conteneur dédié aux exercices
    if (!exerciseContainer) {
        console.warn("Conteneur des exercices introuvable.");
        return;
    }

    // Réinitialiser uniquement les exercices
    exerciseContainer.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = exercises.slice(start, end);

    if (pageItems.length === 0) {
        exerciseContainer.innerHTML = "<p>Aucun exercice disponible pour cette catégorie.</p>";
        return;
    }

    pageItems.forEach(exercise => {
        const exerciseElement = document.createElement("div");
        exerciseElement.className = "exercise";
        exerciseElement.setAttribute("data-id", exercise.id); // Ajoute l'ID de l'exercice
        exerciseElement.innerHTML = `
            <h3>${exercise.title}</h3>
            <p>${exercise.description}</p>
            ${exercise.image ? `<img src="${exercise.image}" alt="${exercise.title}" onclick="openLightbox('${exercise.image}')">` : ""}
            <button class="btn" onclick="startExercise(${exercise.id}, '${exercise.answer}')">Commencer</button>
        `;
        exerciseContainer.appendChild(exerciseElement);
    });

    checkCompletedExercises(); // Vérifier les exercices complétés après le rendu
    updatePaginationControls(exercises);
}

// Gérer la pagination
function updatePaginationControls(exercises) {
    const prevBtn = document.querySelector("#prev-btn");
    const nextBtn = document.querySelector("#next-btn");
    if (!prevBtn || !nextBtn) return;

    const totalPages = Math.ceil(exercises.length / itemsPerPage);
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    document.querySelector("#page-indicator").textContent = `Page ${currentPage}`;
}

function nextPage() {
    currentPage++;
    filterByCategory(currentCategory);
}

function previousPage() {
    currentPage--;
    filterByCategory(currentCategory);
}

// Démarrer un exercice
function startExercise(id, correctAnswer) {
    console.log("ID de l'exercice :", id); // Log de l'ID de l'exercice
    const userAnswer = prompt("Répondez à cet exercice :");
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        alert("Bonne réponse !");
        grantBadge(`Exercice ${id}`);
        updateDashboard();
        saveProgress(); // Mettre à jour dans Google Sheet
        markExerciseAsCompleted(id); // Mettre à jour l'état de l'exercice dans Google Sheets
    } else {
        alert("Mauvaise réponse, réessayez !");
    }

    progress += 20;
    if (progress > 100) progress = 100;
    updateProgress();
}

// Gérer les badges
function grantBadge(badgeName) {
    if (!badges.includes(badgeName)) {
        badges.push(badgeName);
        displayBadges();
        saveProgress(); // Mettre à jour dans Google Sheet
    }
}

function displayBadges() {
    const badgeContainer = document.querySelector("#badges");
    
    // Conservez le texte "Badges obtenus :"
    const title = badgeContainer.querySelector('h3');
    badgeContainer.innerHTML = ''; // Efface uniquement les badges existants
    badgeContainer.appendChild(title); // Réajoute le titre

    // Ajoutez les nouveaux badges
    badges.forEach(badge => {
        const badgeElement = document.createElement("span");
        badgeElement.className = "badge";
        badgeElement.textContent = badge;
        badgeContainer.appendChild(badgeElement);
    });
}

// Mettre à jour la progression
function updateProgress() {
    const completedExercises = badges.length;
    progress = allExercises.length > 0 ? Math.round((completedExercises / allExercises.length) * 100) : 0;
    document.querySelector("#circle-percentage").textContent = `${progress}%`;
    updateProgressCircle(progress);
}

// Cercle de progression
function updateProgressCircle(score) {
    const circle = document.querySelector(".progress-circle");
    const percentage = document.querySelector("#circle-percentage");

    if (!circle || !percentage) return;

    const fillPercentage = Math.min(score, 100);

    circle.style.background = `conic-gradient(#4caf50 ${fillPercentage}%, #ddd ${fillPercentage}%)`;

    // Animation du texte du pourcentage
    let currentPercentage = parseInt(percentage.textContent) || 0;
    const increment = fillPercentage > currentPercentage ? 1 : -1;
    const interval = setInterval(() => {
        if (currentPercentage === fillPercentage) {
            clearInterval(interval);
        } else {
            currentPercentage += increment;
            percentage.textContent = `${currentPercentage}%`;
        }
    }, 20);
}

// Lightbox pour les images
function openLightbox(imageSrc) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    lightboxImg.src = imageSrc;
    lightbox.style.display = "flex";
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    lightbox.style.display = "none";
}

// Navigation par onglets
function openTab(event, tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    document.getElementById(tabId).classList.add('active-tab');
    event.currentTarget.classList.add('active');

    if (tabId === 'exercises') {
        loadExercises();
    }
}

function updateDashboard() {
    const completedExercises = badges.length; // Le nombre d'exercices terminés correspond au nombre de badges obtenus.
    const score = Math.round((completedExercises / totalExercises) * 100); // Calcul du score global en pourcentage.

    // Mise à jour des éléments HTML
    document.querySelector("#completed-exercises").textContent = completedExercises;
    document.querySelector("#score").textContent = `${score} / 100`;

    // Mise à jour du cercle de progression
    updateProgressCircle(score);
}

// Charger la progression sauvegardée
async function loadProgress() {
    try {
        const response = await fetch(PROGRESS_API_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const progressData = await response.json();
        const userProgress = progressData.find(entry => entry.Nom === "Anakyn"); // Rechercher les données pour Anakyn

        if (userProgress) {
            const completedExercises = parseInt(userProgress["Exercices Terminés"], 10) || 0; // Exercices terminés
            const score = parseInt(userProgress["Score Global"], 10) || 0; // Score global
            const savedBadges = userProgress.Badges ? userProgress.Badges.split(", ") : []; // Liste des badges

            // Mise à jour des variables locales
            badges = savedBadges;
            progress = score;

            // Mise à jour des éléments HTML
            document.querySelector("#completed-exercises").textContent = completedExercises;
            document.querySelector("#score").textContent = `${score} / 100`;
            updateProgressCircle(score); // Mettre à jour le cercle de progression
            displayBadges(); // Afficher les badges
        } else {
            console.log("Aucune progression trouvée pour Anakyn.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement de la progression :", error);
    }
}

// Sauvegarder la progression dans l'onglet "Progress"
async function saveProgress() {
    if (!totalExercises || totalExercises <= 0) {
        console.error("Le nombre total d'exercices n'est pas défini ou est invalide.");
        return;
    }

    const completedExercises = badges.length;
    const score = Math.round((completedExercises / totalExercises) * 100);
    const badgeList = badges.join(", ");

    // Données à envoyer pour la mise à jour
    const data = {
        "Exercices Terminés": completedExercises,
        "Score Global": score,
        "Badges": badgeList,
    };

    // URL de l'API pour la mise à jour
    const updateUrl = `https://sheetdb.io/api/v1/lmomhherhri7g/Nom/Anakyn?sheet=Progress`;

    try {
        console.log("Données envoyées pour mise à jour :", data);

        const response = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const result = await response.json();
        console.log("Progression mise à jour dans Google Sheet :", result);
        // alert("Progression sauvegardée avec succès !"); // Supprimer cette ligne pour ne plus afficher l'alerte
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la progression :", error);
        alert("Une erreur est survenue lors de la sauvegarde des données dans Google Sheet.");
    }
}

async function resetProgress() {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser votre progression ?")) {
        // Réinitialiser les variables globales
        badges = [];
        progress = 0;

        // Réinitialiser les éléments du tableau "Progression"
        document.querySelector("#completed-exercises").textContent = 0;
        document.querySelector("#score").textContent = "0 / 100";
        updateProgressCircle(0); // Réinitialiser le cercle de progression
        displayBadges(); // Réinitialiser les badges affichés

        // Données à envoyer pour la mise à jour
        const data = {
            "Exercices Terminés": 0,
            "Score Global": 0,
            "Badges": "",
        };

        // URL de l'API pour la mise à jour
        const updateUrl = `https://sheetdb.io/api/v1/lmomhherhri7g/Nom/Anakyn?sheet=Progress`;

        try {
            console.log("Données envoyées pour réinitialisation :", data);

            const response = await fetch(updateUrl, {
                method: "PATCH", // Utiliser PATCH pour la mise à jour
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const result = await response.json();
            console.log("Progression réinitialisée dans Google Sheet :", result);
            alert("Progression réinitialisée avec succès !");
        } catch (error) {
            console.error("Erreur lors de la réinitialisation de la progression :", error);
            alert("Une erreur est survenue lors de la réinitialisation des données dans Google Sheet.");
        }
    }
}

async function markExerciseAsCompleted(id) {
    const exerciseElement = document.querySelector(`.exercise[data-id="${id}"]`);
    if (exerciseElement) {
        const checkmark = document.createElement("div");
        checkmark.className = "checkmark-animation";
        checkmark.innerHTML = "✅";
        exerciseElement.appendChild(checkmark);

        // Désactiver le bouton et changer le texte
        const button = exerciseElement.querySelector("button");
        button.textContent = "Réussi";
        button.disabled = true;

        // Mettre à jour l'état de l'exercice dans Google Sheets
        const updateUrl = `https://sheetdb.io/api/v1/lmomhherhri7g/id/${id}?sheet=Exercises`;
        const data = { "Completed": "TRUE" };

        console.log("URL de mise à jour :", updateUrl); // Log de l'URL de mise à jour
        console.log("Données envoyées :", data); // Log des données envoyées

        try {
            const response = await fetch(updateUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const result = await response.json();
            console.log("Exercice marqué comme complété dans Google Sheet :", result);

            // Appeler checkCompletedExercises pour mettre à jour l'interface utilisateur
            checkCompletedExercises();
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'exercice :", error);
        }

        setTimeout(() => checkmark.remove(), 2000); // Retirer après 2 secondes
    }
}

async function checkCompletedExercises() {
    try {
        const response = await fetch(`https://sheetdb.io/api/v1/lmomhherhri7g?sheet=Exercises`);
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const exercises = await response.json();
        console.log("Exercices chargés :", exercises);

        exercises.forEach(exercise => {
            if (exercise.Completed === "TRUE") {
                const exerciseElement = document.querySelector(`.exercise[data-id="${exercise.id}"]`);
                if (exerciseElement) {
                    // Désactiver le bouton et changer le texte
                    const button = exerciseElement.querySelector("button");
                    button.textContent = "Réussi";
                    button.disabled = true;
                    exerciseElement.classList.add("completed");
                }
            }
        });
    } catch (error) {
        console.error("Erreur lors du chargement des exercices :", error);
    }
}

// Chargement initial
window.onload = () => {
    loadProgress();
    displayBadges();
    updateProgress();
    checkCompletedExercises(); // Vérifier les exercices complétés
};