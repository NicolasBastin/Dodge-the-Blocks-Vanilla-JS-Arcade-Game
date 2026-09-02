/**
 * CONFIGURATION & ÉTAT GLOBAL (MODE HISTOIRE)
 */
const CONFIG = {
    DURATION: 60000, // 1 minute
    PATHS: {
        DIALOGUES: '../json/dialogues.json',
        ASTEROID: '../medias/img/asteroide.png',
        PLAYER: '../medias/img/vaisseau0.png',
        BACKGROUND: '../medias/img/background.png'
    }
};

const state = {
    // Jeu
    ctx: null,
    gameOver: false,
    isPaused: false,
    gameStartTime: 0,
    totalPausedTime: 0,
    pauseStartTime: 0,
    animationId: null,
    score: 0,
    difficultyFactor: 1.0,
    
    // Dialogue
    dialogues: null,
    currentConversation: [],
    conversationIndex: 0,
    isTyping: false,
    typingInterval: null,
    
    // Inputs
    keysPressed: new Set(),
    buttonDirection: { dx: 0, dy: 0 }
};

// Conteneur des assets chargés
const assets = {
    player: new Image(),
    asteroid: new Image(),
    background: new Image()
};

// Entités
let player = null;
let blocks = [];
let particles = [];
let bgY = 0;

/* =========================================
   1. SYSTÈME DE CHARGEMENT (ASSETS & JSON)
   ========================================= */

const loadAsset = (img, src) => {
    return new Promise((resolve, reject) => {
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Erreur chargement ${src}`);
    });
};

async function initSystem() {
    try {
        // 1. Charger les dialogues et les images en parallèle
        const [dialoguesData] = await Promise.all([
            fetch(CONFIG.PATHS.DIALOGUES).then(r => r.json()),
            loadAsset(assets.player, CONFIG.PATHS.PLAYER),
            loadAsset(assets.asteroid, CONFIG.PATHS.ASTEROID),
            loadAsset(assets.background, CONFIG.PATHS.BACKGROUND)
        ]);

        state.dialogues = dialoguesData;
        console.log("Système prêt. Lancement cinématique...");
        
        // 2. Configurer l'environnement
        setupEventListeners();
        setupMobileControls();
        
        // 3. Lancer la séquence d'intro
        startCinematic();

    } catch (e) {
        console.error("Erreur critique d'initialisation:", e);
        alert("Impossible de charger les fichiers du jeu (Images ou Dialogues).");
    }
}

/* =========================================
   2. GESTION DES DIALOGUES (CINÉMATIQUE)
   ========================================= */

const uiDialogue = {
    box: document.getElementById('dialogue-box'),
    text: document.getElementById('dialogue-text'),
    name: document.getElementById('speaker-name'),
    portrait: document.getElementById('speaker-portrait'),
    next: document.getElementById('next-indicator'),
    sounds: {
        typing: document.getElementById('text-typing'),
        astro: document.getElementById('astro-blip'),
        commandant: document.getElementById('commandant-blip')
    }
};

function startCinematic() {
    const fadeOverlay = document.getElementById('fade-overlay');
    const backgroundVideo = document.getElementById('background-video');
    const spaceship = document.getElementById('spaceship');

    if (fadeOverlay) fadeOverlay.style.display = 'none';
    if (backgroundVideo) backgroundVideo.style.display = 'block';
    
    if (spaceship) {
        spaceship.style.display = 'block';
        spaceship.classList.add('arrive');
    }

    startDialogue("missionBriefingHyperspace");
}

function startDialogue(key) {
    if (!state.dialogues || !state.dialogues[key]) return;
    state.currentConversation = state.dialogues[key];
    state.conversationIndex = 0;
    
    if (uiDialogue.box) {
        uiDialogue.box.style.display = 'flex';
        showDialogueLine();
    }
}

function showDialogueLine() {
    if (uiDialogue.sounds.typing) uiDialogue.sounds.typing.pause();
    
    const line = state.currentConversation[state.conversationIndex];
    
    uiDialogue.name.textContent = line.name;
    uiDialogue.portrait.src = line.portrait;
    
    // Joue le son "blip" si disponible
    const blip = uiDialogue.sounds[line.voiceBlip];
    if (blip) {
        blip.currentTime = 0;
        blip.play().catch(() => {});
    }

    typeWriter(line.text);
}

function typeWriter(text) {
    uiDialogue.text.textContent = "";
    uiDialogue.next.classList.add('hidden');
    state.isTyping = true;
    let charIndex = 0;

    if (uiDialogue.sounds.typing) {
        uiDialogue.sounds.typing.currentTime = 0;
        uiDialogue.sounds.typing.play().catch(() => {});
    }

    if (state.typingInterval) clearInterval(state.typingInterval);

    state.typingInterval = setInterval(() => {
        if (charIndex < text.length) {
            uiDialogue.text.textContent += text.charAt(charIndex);
            charIndex++;
        } else {
            finishTyping(text);
        }
    }, 40); // Vitesse de frappe
}

function finishTyping(fullText) {
    clearInterval(state.typingInterval);
    uiDialogue.text.textContent = fullText || state.currentConversation[state.conversationIndex].text;
    state.isTyping = false;
    uiDialogue.next.classList.remove('hidden');
    if (uiDialogue.sounds.typing) uiDialogue.sounds.typing.pause();
}

function advanceDialogue() {
    if (state.isTyping) {
        finishTyping(); // Skip instantané
    } else {
        state.conversationIndex++;
        if (state.conversationIndex < state.currentConversation.length) {
            showDialogueLine();
        } else {
            endCinematicAndStartGame();
        }
    }
}

function endCinematicAndStartGame() {
    uiDialogue.box.style.display = 'none';
    const bgMusic = document.getElementById('background-music');
    if (bgMusic) bgMusic.pause();
    
    // Masquer cinématique
    const spaceship = document.getElementById('spaceship');
    const bgVideo = document.getElementById('background-video');
    if (spaceship) spaceship.style.display = 'none';
    if (bgVideo) bgVideo.style.display = 'none';

    // Afficher Jeu
    const canvas = document.getElementById('gameCanvas');
    const gameUI = document.getElementById('game-ui');
    if (canvas) canvas.style.display = 'block';
    if (gameUI) gameUI.style.display = 'flex';
    
    // Config Difficulté
    const diffStr = localStorage.getItem('gameDifficulty');
    if (diffStr === 'Facile') state.difficultyFactor = 0.5;
    else if (diffStr === 'Difficile') state.difficultyFactor = 3.0;
    else state.difficultyFactor = 1.5;

    // Lancer le jeu
    initStoryGame();
}

/* =========================================
   3. MOTEUR DU JEU (GAME LOOP)
   ========================================= */

function initStoryGame() {
    const canvas = document.getElementById('gameCanvas');
    state.ctx = canvas.getContext('2d');
    resizeGameCanvas();

    // RESET GLOBAL
    state.gameOver = false;
    state.isPaused = false;
    state.totalPausedTime = 0;
    state.gameStartTime = Date.now();
    blocks = [];
    particles = [];
    
    // CRÉATION DU JOUEUR (On passe l'image chargée assets.player)
    player = new Player(
        canvas.width / 2 - 25, 
        canvas.height - 80, 
        assets.player 
    );

    const resumeBtn = document.getElementById('resume-btn');
    const pauseMenu = document.getElementById('pause-menu');
    if (resumeBtn) resumeBtn.style.display = 'block';
    if (pauseMenu) pauseMenu.style.display = 'none';

    // Affichage touches mobiles si besoin
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const mobControls = document.getElementById('mobile-controls');
        if (mobControls) mobControls.style.display = 'block';
    }

    gameLoop();
}

function gameLoop() {
    // Gestion Pause / Game Over
    if (state.gameOver || state.isPaused) {
        if (state.isPaused) state.animationId = requestAnimationFrame(gameLoop);
        return;
    }

    const canvas = document.getElementById('gameCanvas');
    const ctx = state.ctx;
    
    // 1. Nettoyage
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Background Défilant
    bgY += 2; // Vitesse scroll
    if (bgY >= canvas.height) bgY = 0;
    ctx.drawImage(assets.background, 0, bgY, canvas.width, canvas.height);
    ctx.drawImage(assets.background, 0, bgY - canvas.height, canvas.width, canvas.height);

    // 3. Logique Temps
    const elapsedTime = (Date.now() - state.gameStartTime) - state.totalPausedTime;
    const remainingTime = CONFIG.DURATION - elapsedTime;

    if (remainingTime <= 0) {
        finishGame(true);
        return;
    }
    updateTimerDisplay(remainingTime);

    // 4. Update Joueur
    updatePlayerMovement();
    player.update();
    player.draw(ctx);

    // 5. Update Particules
    particles = particles.filter(p => p.lifespan > 0);
    particles.forEach(p => { p.update(); p.draw(ctx); });

    // 6. Update Blocs (Astéroïdes)
    // Spawn (ajusté par difficulté)
    if (Math.random() < (0.02 * state.difficultyFactor)) {
        blocks.push(new Block(
            Math.random() * (canvas.width - 40), 
            state.difficultyFactor, 
            assets.asteroid // On passe l'image assets.asteroid
        ));
    }

    // Boucle blocs
    for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        b.update();
        b.draw(ctx);

        // Collision
        if (checkCollision(player, b)) {
            finishGame(false);
            return;
        }

        // Nettoyage hors écran
        if (b.position.y > canvas.height + 20) {
            blocks.splice(i, 1);
        }
    }

    // Alerte proximité (bords rouges)
    const isNear = blocks.some(b => Math.abs(b.position.y - player.position.y) < 150 && Math.abs(b.position.x - player.position.x) < 60);
    const container = document.getElementById('game-container');
    if (container) {
        if (isNear) container.classList.add('near-collision');
        else container.classList.remove('near-collision');
    }

    state.animationId = requestAnimationFrame(gameLoop);
}

function updatePlayerMovement() {
    let dx = 0, dy = 0;
    
    // Clavier
    if (state.keysPressed.has('ArrowLeft') || state.keysPressed.has('q')) dx -= 1;
    if (state.keysPressed.has('ArrowRight') || state.keysPressed.has('d')) dx += 1;
    if (state.keysPressed.has('ArrowUp') || state.keysPressed.has('z')) dy -= 1;
    if (state.keysPressed.has('ArrowDown') || state.keysPressed.has('s')) dy += 1;

    // Mobile
    dx += state.buttonDirection.dx;
    dy += state.buttonDirection.dy;

    // Normalisation
    const moveDX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    const moveDY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);

    // Inclinaison visuelle
    if (moveDX > 0) player.targetAngle = player.tiltAngle;
    else if (moveDX < 0) player.targetAngle = -player.tiltAngle;
    else player.targetAngle = 0;

    if (moveDX !== 0 || moveDY !== 0) player.move(moveDX, moveDY);
}

function finishGame(isVictory) {
    state.gameOver = true;
    if (state.animationId) cancelAnimationFrame(state.animationId);

    const gameUI = document.getElementById('game-ui');
    const mobControls = document.getElementById('mobile-controls');
    if (gameUI) gameUI.style.display = 'none';
    if (mobControls) mobControls.style.display = 'none';

    if (isVictory) {
        const victoryMenu = document.getElementById('victory-menu');
        if (victoryMenu) victoryMenu.style.display = 'flex';
        
        // Débloquer niveau suivant
        const currentLevel = parseInt(localStorage.getItem('unlockedLevel') || '1');
        localStorage.setItem('unlockedLevel', currentLevel + 1);
        
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) nextBtn.onclick = () => window.location.reload();
    } else {
        const pauseMenu = document.getElementById('pause-menu');
        const resumeBtn = document.getElementById('resume-btn');
        const restartBtn = document.getElementById('restart-chapter-btn');
        
        if (pauseMenu) pauseMenu.style.display = 'flex';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'block';
    }
}

/* =========================================
   4. UTILITAIRES & EVENTS
   ========================================= */

function resizeGameCanvas() {
    const container = document.getElementById('game-container');
    const canvas = document.getElementById('gameCanvas');
    if (!container || !canvas) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    if (player) {
        player.rescale();
        // Garder le joueur dans l'écran après redimensionnement
        player.position.x = Math.min(player.position.x, canvas.width - player._width);
        player.position.y = Math.min(player.position.y, canvas.height - player._height);
    }
    blocks.forEach(b => b.rescale());
}

function checkCollision(p, b) {
    const padding = 10; // Marge de tolérance
    return (
        p.position.x < b.position.x + b._width - padding &&
        p.position.x + p._width > b.position.x + padding &&
        p.position.y < b.position.y + b._height - padding &&
        p.position.y + p._height > b.position.y + padding
    );
}

function updateTimerDisplay(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const timerEl = document.getElementById('game-timer');
    if (timerEl) timerEl.textContent = `SURVIVRE: ${minutes}:${seconds}`;
}

function togglePause() {
    if (state.gameOver) return;
    state.isPaused = !state.isPaused;
    
    const pauseMenu = document.getElementById('pause-menu');

    if (state.isPaused) {
        state.pauseStartTime = Date.now();
        if (pauseMenu) pauseMenu.style.display = 'flex';
    } else {
        state.totalPausedTime += (Date.now() - state.pauseStartTime);
        if (pauseMenu) pauseMenu.style.display = 'none';
    }
}

function setupEventListeners() {
    window.addEventListener('resize', resizeGameCanvas);
    
    // Contrôles UI
    document.getElementById('pause-btn')?.addEventListener('click', togglePause);
    document.getElementById('resume-btn')?.addEventListener('click', togglePause);
    document.getElementById('restart-chapter-btn')?.addEventListener('click', () => window.location.reload());
    document.getElementById('main-menu-btn')?.addEventListener('click', () => window.location.href = '../index.html');
    
    // Dialogue
    document.getElementById('dialogue-box')?.addEventListener('click', advanceDialogue);

    // Clavier
    document.addEventListener('keydown', (e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
        state.keysPressed.add(e.key);
        if (e.key === 'Escape' || e.key === 'p') togglePause();
    });
    document.addEventListener('keyup', (e) => state.keysPressed.delete(e.key));
}

function setupMobileControls() {
    const btns = {
        up: document.getElementById('upBtn'),
        down: document.getElementById('downBtn'),
        left: document.getElementById('leftBtn'),
        right: document.getElementById('rightBtn')
    };

    if (!btns.up) return;

    const pressed = new Set();
    const updateDir = () => {
        let dx = 0, dy = 0;
        if (pressed.has('left')) dx -= 1;
        if (pressed.has('right')) dx += 1;
        if (pressed.has('up')) dy -= 1;
        if (pressed.has('down')) dy += 1;
        state.buttonDirection = { dx, dy };
    };

    const bind = (el, dir) => {
        const add = (e) => { if (e.cancelable) e.preventDefault(); pressed.add(dir); updateDir(); };
        const remove = (e) => { if (e.cancelable) e.preventDefault(); pressed.delete(dir); updateDir(); };
        el.addEventListener('touchstart', add, { passive: false });
        el.addEventListener('touchend', remove, { passive: false });
    };

    bind(btns.up, 'up');
    bind(btns.down, 'down');
    bind(btns.left, 'left');
    bind(btns.right, 'right');
}

// POINT D'ENTRÉE PRINCIPAL
document.addEventListener('DOMContentLoaded', initSystem);