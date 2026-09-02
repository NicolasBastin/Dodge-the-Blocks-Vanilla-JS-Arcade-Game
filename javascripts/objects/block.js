class Block extends Entity 
{
    // On ajoute 'image' à la fin des arguments
    constructor(x, gameDifficultyFactor = 0.5, image) 
    {
        super({ x, y: -20 });
        this.image = image; // Stockage de l'image
        
        const scale = gameCanvas.width / 760;
        
        this.gameDifficultyFactor = gameDifficultyFactor;
        this.baseSize = Math.random() * 15 + 20;
        this.baseSpeed = (Math.random() * 1.6 + 3.0) * (this.gameDifficultyFactor + 0.5);
        
        this._width = this.baseSize * scale;
        this._height = this.baseSize * scale;
        this._speed = this.baseSpeed * scale;
    }

    draw(ctx) 
    {
        // Dessin direct sans vérification de variable globale
        ctx.drawImage(this.image, this.position.x, this.position.y, this._width, this._height);
    }

    update() { 
        this.position = { x: this.position.x, y: this.position.y + this._speed }; 
    }

    rescale() 
    {
        const scale = gameCanvas.width / 760;
        this._width = this.baseSize * scale;
        this._height = this.baseSize * scale;
        this._speed = this.baseSpeed * scale;
    }
}