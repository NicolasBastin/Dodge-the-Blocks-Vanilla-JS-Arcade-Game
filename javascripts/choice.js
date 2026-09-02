document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GESTION MUSIQUE PERSISTANTE ---
    const musique = document.getElementById('background-music');

    if (musique) {
        // A. Restauration de l'état (SessionStorage)
        const savedTime = sessionStorage.getItem('bgMusicTime');
        const savedVolume = sessionStorage.getItem('bgMusicVolume');

        if (savedTime) musique.currentTime = parseFloat(savedTime);
        musique.volume = savedVolume ? parseFloat(savedVolume) : 0.3;

        // B. Lecture avec contournement Autoplay
        let hasStarted = false;

        const attemptPlay = async () => {
            if (hasStarted) return;
            try {
                await musique.play();
                hasStarted = true;
                // Nettoyage des écouteurs inutiles
                document.body.removeEventListener('click', attemptPlay);
                document.body.removeEventListener('keydown', attemptPlay);
            } catch (e) {
                console.log("Autoplay bloqué, en attente d'interaction utilisateur...");
            }
        };

        // Tentatives de lecture
        attemptPlay();
        document.body.addEventListener('click', attemptPlay);
        document.body.addEventListener('keydown', attemptPlay);

        // C. Sauvegarde avant de quitter
        window.addEventListener('beforeunload', () => {
            sessionStorage.setItem('bgMusicTime', musique.currentTime);
            sessionStorage.setItem('bgMusicVolume', musique.volume);
        });
        
        // Expose la variable pour settings.js
        window.musique = musique;
    }

    // --- 2. BOUTONS DE CHOIX DE MODE ---
    const modeButtons = document.querySelectorAll(".mode-btn");

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Reset visuel
            modeButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
            // Activation
            button.setAttribute("aria-pressed", "true");
        });
    });
});

// Fonction utilitaire appelée par le HTML pour récupérer le choix
function onClickWithChoice(callback) {
    const selectedButton = document.querySelector('.mode-btn[aria-pressed="true"]');
    const choice = selectedButton ? selectedButton.textContent.trim() : "Normal";
    
    if (callback) callback(choice);
    else console.error("Callback manquant pour onClickWithChoice");
}