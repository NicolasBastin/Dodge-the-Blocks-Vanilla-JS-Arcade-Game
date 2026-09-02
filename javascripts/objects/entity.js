class Entity 
{
    constructor(position, health = 100, speed = 5) 
    {
        this.position = position;
        this.health = health;
        this.speed = speed;
    }

    set damage(amount) { this.health = max(this.health - amount, 0); }
    set heal(amount) { this.health = min(this.health + amount, 100); }
}