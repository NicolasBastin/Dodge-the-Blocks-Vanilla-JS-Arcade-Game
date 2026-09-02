class Player extends Entity 
{
    // On ajoute le paramètre 'image' au constructeur
    constructor(x, y, image) 
    {
        super({ x, y });
        this.image = image; // On stocke l'image dans l'objet joueur
        this.scale = 1;

        // Valeurs de base
        this.baseWidth = 50; 
        this.baseSpeed = 6;

        // Rotation
        this.currentAngle = 0; 
        this.targetAngle = 0; 
        this.tiltAngle = 0.25; 
        this.rotationSpeed = 0.08;

        // On lance le calcul de taille immédiatement
        this.rescale();
    }

    draw(ctx) 
    {
        ctx.save();
        ctx.translate(this.position.x + this._width / 2, this.position.y + this._height / 2);
        ctx.rotate(this.currentAngle);

        // Plus besoin de vérifier si c'est chargé, on sait que l'image est là
        ctx.drawImage(this.image, -this._width / 2, -this._height / 2, this._width, this._height);
        
        ctx.restore();
    }

    move(dx = 0, dy = 0) 
    {
        // Ta logique de mouvement reste inchangée
        const newX = this.position.x + dx * this._speed; 
        const newY = this.position.y + dy * this._speed;
        
        const minX = Math.max(0, Math.floor(gameCanvas.width * 0.01));
        const finalX = Math.max(minX, Math.min(newX, Math.max(minX + 10, Math.floor(gameCanvas.width * 0.99 - this._width))));

        const minY = Math.max(0, Math.floor(gameCanvas.height * 0.01));
        const maxY = Math.max(minY + 10, Math.floor(gameCanvas.height * 0.99 - this._height));
        const finalY = Math.max(minY, Math.min(newY, maxY));

        this.position = { x: finalX, y: finalY };
    }

    rescale() 
    {
        // On récupère l'échelle globale définie dans script_game.js (state.scale) ou calcul manuel
        // Pour rester compatible avec ton ancien code qui recalcule scale ici :
        this.scale = gameCanvas.width / 760;
        this._speed = this.baseSpeed * this.scale;

        // Calcul propre des dimensions basé sur l'image stockée
        if (this.image && this.image.naturalWidth > 0) {
            const aspectRatio = this.image.naturalHeight / this.image.naturalWidth;
            this._width = this.baseWidth * this.scale;
            this._height = this._width * aspectRatio; 
        } else {
            // Fallback (sécurité)
            this._width = this.baseWidth * this.scale;
            this._height = this.baseWidth * this.scale; 
        }
    }

    update() 
    {
        let deltaAngle = this.targetAngle - this.currentAngle;
        this.currentAngle += deltaAngle * this.rotationSpeed;
    }
}