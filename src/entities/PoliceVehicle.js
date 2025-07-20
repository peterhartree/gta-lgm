class PoliceVehicle extends Vehicle {
    constructor(scene, x, y) {
        super(scene, x, y, 'car-police');
        
        this.setTint(0xffffff);
        this.maxSpeed = 350; // Slower than player's 400
        this.acceleration = 350; // Slightly slower acceleration too
        this.turnSpeed = 250;
        
        this.target = null;
        this.pursuitSpeed = 0;
        this.isChasing = false;
        this.sirenActive = false;
        
        // Health system
        this.health = 2;
        this.isDestroyed = false;
    }
    
    startPursuit(target) {
        this.target = target;
        this.isChasing = true;
        this.sirenActive = true;
        console.log('Police: Starting pursuit!');
        
        // Start siren loop
        this.sirenInterval = setInterval(() => {
            if (this.sirenActive && this.scene.soundManager) {
                this.scene.soundManager.playSiren();
            }
        }, 800);
    }
    
    stopPursuit() {
        this.target = null;
        this.isChasing = false;
        this.sirenActive = false;
        this.pursuitSpeed = 0;
        
        // Only set velocity if not destroyed
        if (!this.isDestroyed && this.body) {
            this.setVelocity(0, 0);
        }
        
        // Stop siren
        if (this.sirenInterval) {
            clearInterval(this.sirenInterval);
            this.sirenInterval = null;
        }
        
        console.log('Police: Pursuit ended');
    }
    
    takeDamage() {
        if (this.isDestroyed) return;
        
        this.health--;
        
        // Flash red when hit
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.setTint(0xffffff);
        });
        
        if (this.health <= 0) {
            this.destroy();
        }
    }
    
    destroy(showExplosion = true) {
        if (this.isDestroyed) return; // Prevent double destruction
        
        this.isDestroyed = true;
        this.stopPursuit();
        
        if (this.body) {
            this.setVelocity(0, 0);
        }
        
        this.setVisible(false); // Hide immediately
        
        // Create explosion smoke effect only when destroyed by damage
        if (showExplosion) {
                for (let i = 0; i < 15; i++) {
                const smoke = this.scene.add.circle(
                    this.x + Phaser.Math.Between(-30, 30),
                    this.y + Phaser.Math.Between(-30, 30),
                    Phaser.Math.Between(20, 40),
                    0x666666,
                    0.8
                );
                
                this.scene.tweens.add({
                    targets: smoke,
                    alpha: 0,
                    scale: 3,
                    duration: 2000,
                    delay: i * 50,
                    onComplete: () => smoke.destroy()
                });
            }
        }
        
        // Remove after delay
        this.scene.time.delayedCall(500, () => {
            if (this.scene) {
                this.scene.policeVehicles.remove(this);
                // Also remove the entry zone from the group
                if (this.entryZone && this.scene.vehicleEntryZones) {
                    this.scene.vehicleEntryZones.remove(this.entryZone);
                    this.entryZone.destroy();
                }
                super.destroy();
            }
        });
    }
    
    updatePursuit(delta) {
        if (!this.isChasing || !this.target || this.isDestroyed) return;
        
        const dt = delta / 1000;
        
        const targetVehicle = this.target.isInVehicle ? this.target.currentVehicle : null;
        const targetX = targetVehicle ? targetVehicle.x : this.target.x;
        const targetY = targetVehicle ? targetVehicle.y : this.target.y;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
        
        if (distance > 800) {
            this.stopPursuit();
            return;
        }
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        
        const targetAngle = angle + Math.PI/2;
        let angleDiff = targetAngle - this.rotation;
        
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turnSpeed * dt);
        this.setRotation(this.rotation + turnAmount);
        
        if (distance > 50) {
            this.pursuitSpeed = Math.min(this.pursuitSpeed + this.acceleration * dt, this.maxSpeed);
        } else {
            this.pursuitSpeed = Math.max(this.pursuitSpeed - this.deceleration * dt, 0);
        }
        
        if (targetVehicle && distance < 100 && this.pursuitSpeed > 200) {
            this.pursuitSpeed = this.maxSpeed; // No speed boost for ramming
        }
        
        const velocityX = Math.cos(this.rotation - Math.PI/2) * this.pursuitSpeed;
        const velocityY = Math.sin(this.rotation - Math.PI/2) * this.pursuitSpeed;
        
        this.setVelocity(velocityX, velocityY);
        
        this.currentSpeed = this.pursuitSpeed;
    }
}