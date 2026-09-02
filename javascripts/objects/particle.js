class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Taille aléatoire entre 1 et 3
        this.size = Math.random() * 2 + 1;
        
        // Vélocité (Mouvement)
        // vx : léger mouvement horizontal aléatoire (-0.75 à +0.75)
        this.vx = Math.random() * 1.5 - 0.75;
        // vy : mouvement vertical vers le bas (chute) ou le haut selon le contexte
        this.vy = Math.random() * 1 + 0.5;
        
        // Durée de vie (100% au départ)
        this.lifespan = 100;
        this.decayRate = 2.5; // Vitesse de disparition
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifespan -= this.decayRate;
    }

    draw(ctx) {
        // On ne dessine pas si la particule est morte
        if (this.lifespan <= 0) return;

        ctx.save();
        
        // Effet de transparence basé sur la durée de vie restante
        // Math.max(0, ...) évite un bug si lifespan devient négatif
        ctx.globalAlpha = Math.max(0, this.lifespan / 100);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        
        ctx.restore();
    }
}