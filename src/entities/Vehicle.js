class Vehicle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setBounce(0.3);
        this.setDrag(100);
        this.setAngularDrag(100);
        this.setMaxVelocity(500);
        this.setMass(1000);
        this.setScale(0.35); // Scale down the car sprites to 70% of previous size
        this.setImmovable(true); // Start as immovable when unoccupied
        
        this.maxSpeed = 400;
        this.acceleration = 300;
        this.deceleration = 200;
        this.turnSpeed = 200;
        this.handbrakeDeceleration = 600;
        
        this.currentSpeed = 0;
        this.isOccupied = false;
        this.driver = null;
        
        // Health and destruction properties
        this.health = 2; // Takes 2 shots to destroy
        this.maxHealth = 2;
        this.isDestroyed = false;
        
        // Set proper rectangular collision body
        this.setBodySize(this.width * 0.8, this.height * 0.8);
        
        // Create a larger invisible sensor for entry detection
        this.entryZone = scene.add.rectangle(x, y, this.width * 1.8, this.height * 1.8);
        this.entryZone.setVisible(false);
        scene.physics.add.existing(this.entryZone);
        this.entryZone.body.setImmovable(true);
        this.entryZone.vehicle = this; // Reference back to this vehicle
        
        // Store initial position for unoccupied state
        this.parkedX = x;
        this.parkedY = y;
        this.parkedRotation = this.rotation;
        
        // Assign random radio station
        const radioStations = ['radio-bonnie', 'radio-rio'];
        this.radioStation = radioStations[Math.floor(Math.random() * radioStations.length)];
    }
    
    enterVehicle(player) {
        if (!this.isOccupied) {
            this.isOccupied = true;
            this.driver = player;
            player.setVisible(false);
            player.body.enable = false;
            this.setImmovable(false); // Make vehicle movable when occupied
            
            return true;
        }
        return false;
    }
    
    exitVehicle() {
        if (this.isOccupied && this.driver) {
            const exitX = this.x + Math.cos(this.rotation - Math.PI/2) * 50;
            const exitY = this.y + Math.sin(this.rotation - Math.PI/2) * 50;
            
            this.driver.setPosition(exitX, exitY);
            this.driver.setVisible(true);
            this.driver.body.enable = true;
            
            this.isOccupied = false;
            this.driver = null;
            this.currentSpeed = 0;
            this.setVelocity(0, 0);
            this.setAngularVelocity(0);
            this.setImmovable(true); // Make vehicle immovable when unoccupied
            
            // Update parked position to current position when exiting
            this.parkedX = this.x;
            this.parkedY = this.y;
            this.parkedRotation = this.rotation;
        }
    }
    
    update(cursors, wasd, handbrakeKey, delta) {
        // Always update entry zone position to follow vehicle
        if (this.entryZone) {
            this.entryZone.setPosition(this.x, this.y);
            this.entryZone.setRotation(this.rotation);
        }
        
        if (!this.isOccupied) {
            // Force unoccupied vehicles to stay in their parked position
            this.setPosition(this.parkedX, this.parkedY);
            this.setRotation(this.parkedRotation);
            this.setVelocity(0, 0);
            this.setAngularVelocity(0);
            return;
        }
        
        const dt = delta / 1000;
        
        const forwardPressed = cursors.up.isDown || wasd.W.isDown;
        const backwardPressed = cursors.down.isDown || wasd.S.isDown;
        const leftPressed = cursors.left.isDown || wasd.A.isDown;
        const rightPressed = cursors.right.isDown || wasd.D.isDown;
        const handbrakePressed = false; // Handbrake disabled
        
        
        if (forwardPressed) {
            this.currentSpeed = Math.min(this.currentSpeed + this.acceleration * dt, this.maxSpeed);
        } else if (backwardPressed) {
            this.currentSpeed = Math.max(this.currentSpeed - this.acceleration * dt, -this.maxSpeed * 0.5);
        } else {
            const decel = handbrakePressed ? this.handbrakeDeceleration : this.deceleration;
            if (this.currentSpeed > 0) {
                this.currentSpeed = Math.max(this.currentSpeed - decel * dt, 0);
            } else if (this.currentSpeed < 0) {
                this.currentSpeed = Math.min(this.currentSpeed + decel * dt, 0);
            }
        }
        
        if (Math.abs(this.currentSpeed) > 10) {
            let turnAmount = 0;
            if (leftPressed) turnAmount = -1;
            if (rightPressed) turnAmount = 1;
            
            if (this.currentSpeed < 0) turnAmount *= -1;
            
            const turnModifier = handbrakePressed ? 1.5 : 1;
            const speedModifier = Math.min(Math.abs(this.currentSpeed) / this.maxSpeed, 1);
            
            this.setAngularVelocity(turnAmount * this.turnSpeed * turnModifier * speedModifier);
        } else {
            this.setAngularVelocity(0);
        }
        
        const velocityX = Math.cos(this.rotation - Math.PI/2) * this.currentSpeed;
        const velocityY = Math.sin(this.rotation - Math.PI/2) * this.currentSpeed;
        
        if (handbrakePressed && Math.abs(this.currentSpeed) > 50) {
            const driftFactor = 0.7;
            const currentVelX = this.body.velocity.x;
            const currentVelY = this.body.velocity.y;
            
            this.setVelocity(
                currentVelX * driftFactor + velocityX * (1 - driftFactor),
                currentVelY * driftFactor + velocityY * (1 - driftFactor)
            );
        } else {
            this.setVelocity(velocityX, velocityY);
        }
        
        if (this.driver) {
            this.driver.setPosition(this.x, this.y);
        }
    }
    
    takeDamage() {
        // Only non-occupied vehicles can be damaged
        if (this.isOccupied || this.isDestroyed) {
            return;
        }
        
        this.health--;
        
        if (this.health === 1) {
            // First hit - show damage with tint
            this.setTint(0xcccccc);
        } else if (this.health <= 0) {
            // Destroyed
            this.explode();
        }
    }
    
    explode() {
        this.isDestroyed = true;
        this.health = 0;
        
        // Hide the vehicle immediately
        this.setVisible(false);
        
        // Disable physics
        this.body.enable = false;
        if (this.entryZone) {
            this.entryZone.body.enable = false;
        }
        
        // Create smoke cloud explosion effect (same as police car)
        for (let i = 0; i < 15; i++) {
            const smoke = this.scene.add.circle(
                this.x + Phaser.Math.Between(-10, 10),
                this.y + Phaser.Math.Between(-10, 10),
                Phaser.Math.Between(10, 20),
                0x666666,
                0.7
            );
            
            const scale = Phaser.Math.FloatBetween(1, 2);
            smoke.setScale(0.1);
            
            this.scene.tweens.add({
                targets: smoke,
                x: smoke.x + Phaser.Math.Between(-40, 40),
                y: smoke.y + Phaser.Math.Between(-40, 40),
                scaleX: scale,
                scaleY: scale,
                alpha: 0,
                duration: Phaser.Math.Between(800, 1200),
                ease: 'Power2',
                onComplete: () => smoke.destroy()
            });
        }
        
        // Respawn after delay
        this.scene.time.delayedCall(5000, () => {
            this.respawn();
        });
    }
    
    respawn() {
        // Find a new random position away from player
        const newX = Phaser.Math.Between(200, this.scene.physics.world.bounds.width - 200);
        const newY = Phaser.Math.Between(200, this.scene.physics.world.bounds.height - 200);
        
        // Reset vehicle properties
        this.setPosition(newX, newY);
        this.setRotation(Phaser.Math.Between(0, Math.PI * 2));
        this.setVisible(true);
        this.clearTint();
        this.setAlpha(1);
        this.health = this.maxHealth;
        this.isDestroyed = false;
        
        // Re-enable physics
        this.body.enable = true;
        if (this.entryZone) {
            this.entryZone.body.enable = true;
            this.entryZone.setPosition(newX, newY);
        }
        
        // Update parked position
        this.parkedX = newX;
        this.parkedY = newY;
        this.parkedRotation = this.rotation;
    }
    
    destroy() {
        // Clean up the entry zone when vehicle is destroyed
        if (this.entryZone) {
            this.entryZone.destroy();
        }
        super.destroy();
    }
}