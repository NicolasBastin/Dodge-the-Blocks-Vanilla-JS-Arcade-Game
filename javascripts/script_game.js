/**
 * CONFIGURATION DU MODE SURVIE
 */
const CONFIG = {
    REF_WIDTH: 760,
    ASSETS: {
        ASTEROID: '../medias/img/asteroide.png',
        PLAYER_PREFIX: '../medias/img/', // Préfixe pour le skin
        PLAYER_DEFAULT: 'vaisseau0' // Skin par défaut
    },
    STORAGE: {
        SKIN: 'skin',
        PSEUDO: 'playerPseudo',
        HIGHSCORES: 'survivalHighScores'
    }
};

let musicStarted = false;

function tryStartMusic() {
    // Si la musique est déjà lancée, on ne fait rien
    if (musicStarted) return;

    const audio = document.getElementById('background-music');
    if (audio) {
        audio.volume = 0.4;
        audio.play().then(() => {
            musicStarted = true;
            console.log("Musique lancée !");
        }).catch(error => {
            console.log("Le navigateur a bloqué l'audio (attente d'interaction) :", error);
        });
    }
}


/**
 * ÉTAT GLOBAL DU JEU
 */
const state = {
    // Canvas & Scale
    ctx: null,
    scale: 1,
    
    // Jeu
    score: 0,
    gameOver: false,
    isPaused: false,
    animationId: null,
    
    // Inputs
    keysPressed: new Set(),
    buttonDirection: { dx: 0, dy: 0 }
};

// Conteneur des assets chargés
const assets = {
    player: new Image(),
    asteroid: new Image()
};

// Entités
let player = null;
let blocks = [];
let particles = [];

/* =========================================
   1. INITIALISATION & CHARGEMENT
   ========================================= */

const loadAsset = (img, src) => {
    return new Promise((resolve, reject) => {
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(`Erreur de chargement : ${src}`);
    });
};

async function initGameSystem() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return; // Sécurité si on n'est pas sur la bonne page
    state.ctx = canvas.getContext('2d');

    // Récupération du skin choisi ou par défaut
    const skinName = localStorage.getItem(CONFIG.STORAGE.SKIN) || CONFIG.ASSETS.PLAYER_DEFAULT;
    const playerSrc = `${CONFIG.ASSETS.PLAYER_PREFIX}${skinName}.png`;

    console.log("Chargement des assets...");
    
    try {
        await Promise.all([
            loadAsset(assets.asteroid, CONFIG.ASSETS.ASTEROID),
            loadAsset(assets.player, playerSrc)
        ]);

        console.log("Assets prêts. Démarrage du jeu.");
        
        setupEventListeners();
        resizeCanvas();
        initGame(); // Lance une partie

    } catch (error) {
        console.error("Erreur fatale :", error);
        alert("Impossible de charger les fichiers du jeu.");
    }
}

/* =========================================
   2. GESTION DU CANVAS (RESPONSIVE)
   ========================================= */

function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const container = document.querySelector('.game-container');
    
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const sidePadding = 48;
    const maxWidth = Math.min(760, Math.max(300, containerWidth - sidePadding));
    
    canvas.width = maxWidth;
    
    // Hauteur adaptative selon l'écran
    const availableHeight = window.innerHeight;
    canvas.height = Math.min(520, Math.max(320, availableHeight - 180));

    // Calcul de l'échelle globale
    state.scale = canvas.width / CONFIG.REF_WIDTH;

    // Repositionnement des entités si changement de taille
    if (player) {
        player.rescale();
        player.position.x = Math.min(Math.max(0, player.position.x), canvas.width - player._width);
        player.position.y = Math.min(Math.max(0, player.position.y), canvas.height - player._height);
    }
    blocks.forEach(b => b.rescale());
}

/* =========================================
   3. BOUCLE DE JEU (LOGIQUE)
   ========================================= */

function initGame() {
    if (state.animationId) cancelAnimationFrame(state.animationId);

    const canvas = document.getElementById('gameCanvas');
    
    // Reset État
    state.score = 0;
    state.gameOver = false;
    updateScoreDisplay();

    // Reset Entités
    blocks = [];
    particles = [];
    
    // Création du Joueur (On passe l'image chargée)
    player = new Player(
        Math.floor(canvas.width / 2 - 25), 
        canvas.height - 60, 
        assets.player
    );
    player.rescale(); // Force le calcul immédiat des dimensions

    gameLoop();
}

function gameLoop() {
    if (state.gameOver) return;
    updatePhysics();
    
    if (state.gameOver) return;
    draw();

    state.animationId = requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    const canvas = document.getElementById('gameCanvas');

    // 1. Mouvement Joueur (Clavier + Tactile)
    let dx = 0, dy = 0;
    
    if (state.keysPressed.has('ArrowLeft') || state.keysPressed.has('q')) dx -= 1;
    if (state.keysPressed.has('ArrowRight') || state.keysPressed.has('d')) dx += 1;
    if (state.keysPressed.has('ArrowUp') || state.keysPressed.has('z')) dy -= 1;
    if (state.keysPressed.has('ArrowDown') || state.keysPressed.has('s')) dy += 1;

    let totalDX = dx + state.buttonDirection.dx;
    let totalDY = dy + state.buttonDirection.dy;

    const moveDX = totalDX > 0 ? 1 : (totalDX < 0 ? -1 : 0);
    const moveDY = totalDY > 0 ? 1 : (totalDY < 0 ? -1 : 0);

    // Inclinaison
    if (moveDX > 0) player.targetAngle = player.tiltAngle;
    else if (moveDX < 0) player.targetAngle = -player.tiltAngle;
    else player.targetAngle = 0;

    if (moveDX !== 0 || moveDY !== 0) player.move(moveDX, moveDY);
    player.update();

    // 2. Particules
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.lifespan <= 0) particles.splice(i, 1);
    }

    // 3. Gestion des Astéroïdes
    // Spawn aléatoire : probabilité de base 2%
    if (Math.random() < 0.02) {
        const x = Math.random() * Math.max(0, canvas.width - 40);
        
        // Difficulté progressive : augmente doucement avec le score
        // Base 0.5, augmente de 0.1 tous les 10 points, maxé à 2.5
        const difficultyFactor = Math.min(2.5, 0.5 + (state.score / 100));

        blocks.push(new Block(x, difficultyFactor, assets.asteroid));
    }

    for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        b.update();

        // Traînée de poussière derrière l'astéroïde
        if (Math.random() > 0.6) {
            particles.push(new Particle(
                b.position.x + (b._width / 2),
                b.position.y + (b._height / 2),
                '#ff6b6b'
            ));
        }

        // Collision Joueur-Astéroïde
        if (checkCollision(player, b)) {
            finishGame();
            return;
        }

        // Passage réussi (Sortie d'écran)
        if (b.position.y > canvas.height + 20) {
            blocks.splice(i, 1);
            state.score += 1;
            updateScoreDisplay();
        }
    }
}

function draw() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = state.ctx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => p.draw(ctx));
    if (player) player.draw(ctx);
    blocks.forEach(b => b.draw(ctx));
}

/* =========================================
   4. UTILITAIRES & EVENTS
   ========================================= */

function checkCollision(p, b) {
    // AABB Collision standard
    return (
        p.position.x < b.position.x + b._width &&
        p.position.x + p._width > b.position.x &&
        p.position.y < b.position.y + b._height &&
        p.position.y + p._height > b.position.y
    );
}

function updateScoreDisplay() {
    const el = document.getElementById('score');
    if (el) el.textContent = state.score;
}

function finishGame() {
    state.gameOver = true;
    if (state.animationId) cancelAnimationFrame(state.animationId);

    saveHighScore();
    drawGameOverScreen();
}

function saveHighScore() {
    const pseudo = localStorage.getItem(CONFIG.STORAGE.PSEUDO) || 'Anonyme';
    const hs = JSON.parse(localStorage.getItem(CONFIG.STORAGE.HIGHSCORES) || '[]');
    
    hs.push({ pseudo, score: state.score });
    hs.sort((a, b) => b.score - a.score); // Tri décroissant
    
    localStorage.setItem(CONFIG.STORAGE.HIGHSCORES, JSON.stringify(hs));
}

function drawGameOverScreen() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = state.ctx;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + state.score, canvas.width / 2, canvas.height / 2 + 30);
    
    // Indication pour restart
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Touchez ou cliquez pour rejouer', canvas.width / 2, canvas.height / 2 + 70);

    // Click to restart
    const restartHandler = () => {
        canvas.removeEventListener('click', restartHandler);
        canvas.removeEventListener('touchstart', restartHandler);
        initGame();
    };
    
    // Petit délai pour éviter le restart accidentel immédiat
    setTimeout(() => {
        canvas.addEventListener('click', restartHandler);
        canvas.addEventListener('touchstart', restartHandler);
    }, 500);
}

function setupEventListeners() {
    window.addEventListener('resize', resizeCanvas);

    // Clavier
    document.addEventListener('keydown', (e) => {
        tryStartMusic();
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
        state.keysPressed.add(e.key);
    });
    document.addEventListener('keyup', (e) => state.keysPressed.delete(e.key));

    // Mobile Controls
    setupMobileButtons();
}

function setupMobileButtons() {
    const btns = {
        up: document.getElementById('upBtn'),
        down: document.getElementById('downBtn'),
        left: document.getElementById('leftBtn'),
        right: document.getElementById('rightBtn')
    };

    if (!btns.up) return; // Pas de boutons trouvés

    // Affichage des contrôles si mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const controlsEl = document.querySelector('.mobile-controls');
    if (controlsEl) controlsEl.style.display = isMobile ? 'block' : 'none';

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
        el.addEventListener('mousedown', add);
        el.addEventListener('mouseup', remove);
        el.addEventListener('mouseleave', remove);
    };

    bind(btns.up, 'up');
    bind(btns.down, 'down');
    bind(btns.left, 'left');
    bind(btns.right, 'right');
}

// Lancement au chargement de la page
document.addEventListener('DOMContentLoaded', initGameSystem);

// Export global pour redémarrer depuis la console si besoin
window.restartGame = initGame;