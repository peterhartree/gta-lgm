class Pedestrian extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Choose random pedestrian sprite
        const pedestrianTextures = ['person-1', 'person-2', 'person-3', 'person-4'];
        const randomTexture = pedestrianTextures[Math.floor(Math.random() * pedestrianTextures.length)];
        
        super(scene, x, y, randomTexture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setDrag(300);
        this.setScale(0.105); // Scale down the pedestrian images to 70% of previous size
        
        this.walkSpeed = 60;
        this.runSpeed = 150;
        this.panicDistance = 100;
        this.isAlive = true;
        this.isPanicking = false;
        this.walkTimer = 0;
        this.currentDirection = Phaser.Math.Between(0, 360);
        
        this.setBodySize(this.width * 0.5, this.height * 0.5);
        
        this.changeDirectionTime = Phaser.Math.Between(2000, 5000);
        
        // Store original texture for respawn
        this.originalTexture = randomTexture;
    }
    
    
    update(time, delta, vehicles, player) {
        if (!this.isAlive) {
            this.setVelocity(0, 0);
            return;
        }
        
        this.checkForDanger(vehicles, player);
        
        if (this.isPanicking) {
            this.runFromDanger(vehicles, player);
        } else {
            this.walkAround(time, delta);
        }
    }
    
    checkForDanger(vehicles, player) {
        this.isPanicking = false;
        
        vehicles.forEach(vehicle => {
            if (vehicle.isOccupied && Math.abs(vehicle.currentSpeed) > 50) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, vehicle.x, vehicle.y);
                if (distance < this.panicDistance) {
                    this.isPanicking = true;
                }
            }
        });
        
        if (player.isInVehicle && player.currentVehicle) {
            const vehicle = player.currentVehicle;
            if (Math.abs(vehicle.currentSpeed) > 50) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, vehicle.x, vehicle.y);
                if (distance < this.panicDistance) {
                    this.isPanicking = true;
                }
            }
        }
    }
    
    runFromDanger(vehicles, player) {
        let nearestThreat = null;
        let nearestDistance = Infinity;
        
        vehicles.forEach(vehicle => {
            if (vehicle.isOccupied && Math.abs(vehicle.currentSpeed) > 50) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, vehicle.x, vehicle.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestThreat = vehicle;
                }
            }
        });
        
        if (player.isInVehicle && player.currentVehicle) {
            const vehicle = player.currentVehicle;
            const distance = Phaser.Math.Distance.Between(this.x, this.y, vehicle.x, vehicle.y);
            if (distance < nearestDistance) {
                nearestThreat = vehicle;
            }
        }
        
        if (nearestThreat) {
            const angle = Phaser.Math.Angle.Between(nearestThreat.x, nearestThreat.y, this.x, this.y);
            const velocityX = Math.cos(angle) * this.runSpeed;
            const velocityY = Math.sin(angle) * this.runSpeed;
            this.setVelocity(velocityX, velocityY);
            
            // Update rotation to face movement direction
            // Add PI to flip 180 degrees
            this.setRotation(angle + Math.PI/2 + Math.PI);
        }
    }
    
    walkAround(time, delta) {
        this.walkTimer += delta;
        
        if (this.walkTimer > this.changeDirectionTime) {
            this.walkTimer = 0;
            this.currentDirection = Phaser.Math.Between(0, 360);
            this.changeDirectionTime = Phaser.Math.Between(2000, 5000);
        }
        
        const radian = Phaser.Math.DegToRad(this.currentDirection);
        const velocityX = Math.cos(radian) * this.walkSpeed;
        const velocityY = Math.sin(radian) * this.walkSpeed;
        
        this.setVelocity(velocityX, velocityY);
        
        // Update rotation to face movement direction
        // Add PI/2 because sprites face down by default, plus PI to flip 180 degrees
        this.setRotation(radian + Math.PI/2 + Math.PI);
    }
    
    getHit(vehicle) {
        if (!this.isAlive) return;
        
        const impactSpeed = Math.abs(vehicle.currentSpeed);
        
        if (impactSpeed > 100) {
            this.isAlive = false;
            this.setTint(0x666666); // Dark tint for dead pedestrian
            
            // Play death sound
            if (this.scene.soundManager) {
                this.scene.soundManager.playPedestrianDeath();
            }
            
            // Create blood splatter effect
            this.createBloodSplatter();
            
            const angle = vehicle.rotation - Math.PI/2;
            const knockbackX = Math.cos(angle) * impactSpeed * 2;
            const knockbackY = Math.sin(angle) * impactSpeed * 2;
            
            this.setVelocity(knockbackX, knockbackY);
            // Remove spinning animation
            // this.setAngularVelocity(Phaser.Math.Between(-500, 500));
            
            this.scene.time.delayedCall(3000, () => {
                this.respawn();
            });
        } else {
            const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, this.x, this.y);
            const pushX = Math.cos(angle) * 200;
            const pushY = Math.sin(angle) * 200;
            this.setVelocity(pushX, pushY);
            
            // Update rotation when pushed
            this.setRotation(angle + Math.PI/2 + Math.PI);
        }
    }
    
    createBloodSplatter() {
        // Create multiple blood particles for splatter effect
        const bloodCount = Phaser.Math.Between(5, 8);
        
        for (let i = 0; i < bloodCount; i++) {
            // Create a simple red circle for blood
            const blood = this.scene.add.circle(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(3, 8),
                0x8B0000
            );
            
            // Set depth to appear on ground
            blood.setDepth(0);
            
            // Fade out and destroy after delay
            this.scene.tweens.add({
                targets: blood,
                alpha: 0,
                duration: 5000,
                delay: 2000,
                onComplete: () => {
                    blood.destroy();
                }
            });
        }
    }
    
    respawn() {
        const x = Phaser.Math.Between(100, 1900);
        const y = Phaser.Math.Between(100, 1900);
        
        this.setPosition(x, y);
        this.setVelocity(0, 0);
        this.setAngularVelocity(0);
        this.clearTint(); // Remove death tint
        this.isAlive = true;
        this.isPanicking = false;
        this.currentDirection = Phaser.Math.Between(0, 360);
    }
}