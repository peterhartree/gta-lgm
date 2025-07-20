class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.5);
        this.setTint(0x000000); // Make bullet black
        this.speed = 800;
        this.lifespan = 1000; // 1 second
        this.damage = 25;
        
        this.setBodySize(4, 4);
    }
    
    fire(x, y, angle) {
        this.enableBody(true, x, y, true, true);
        
        this.setRotation(angle);
        
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
        
        this.setVelocity(velocityX, velocityY);
        
        // Auto-destroy after lifespan
        this.scene.time.delayedCall(this.lifespan, () => {
            this.destroy();
        });
    }
    
    hit() {
        // Create impact effect here if needed
        this.destroy();
    }
}