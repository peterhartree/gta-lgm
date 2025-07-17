class Pedestrian extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'pedestrian');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setBounce(0.1);
        this.setDrag(300);
        
        this.walkSpeed = 60;
        this.runSpeed = 150;
        this.panicDistance = 100;
        this.isAlive = true;
        this.isPanicking = false;
        this.walkTimer = 0;
        this.currentDirection = Phaser.Math.Between(0, 360);
        
        this.setBodySize(this.width * 0.8, this.height * 0.8);
        this.setTint(this.getRandomPedColor());
        
        this.changeDirectionTime = Phaser.Math.Between(2000, 5000);
    }
    
    getRandomPedColor() {
        const colors = [0xffcccc, 0xccffcc, 0xccccff, 0xffffcc, 0xffccff, 0xccffff];
        return colors[Phaser.Math.Between(0, colors.length - 1)];
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
    }
    
    getHit(vehicle) {
        if (!this.isAlive) return;
        
        const impactSpeed = Math.abs(vehicle.currentSpeed);
        
        if (impactSpeed > 100) {
            this.isAlive = false;
            this.setTint(0x666666);
            
            const angle = vehicle.rotation;
            const knockbackX = Math.cos(angle) * impactSpeed * 2;
            const knockbackY = Math.sin(angle) * impactSpeed * 2;
            
            this.setVelocity(knockbackX, knockbackY);
            this.setAngularVelocity(Phaser.Math.Between(-500, 500));
            
            this.scene.time.delayedCall(3000, () => {
                this.respawn();
            });
        } else {
            const angle = Phaser.Math.Angle.Between(vehicle.x, vehicle.y, this.x, this.y);
            const pushX = Math.cos(angle) * 200;
            const pushY = Math.sin(angle) * 200;
            this.setVelocity(pushX, pushY);
        }
    }
    
    respawn() {
        const x = Phaser.Math.Between(100, 1900);
        const y = Phaser.Math.Between(100, 1900);
        
        this.setPosition(x, y);
        this.setVelocity(0, 0);
        this.setAngularVelocity(0);
        this.setTint(this.getRandomPedColor());
        this.isAlive = true;
        this.isPanicking = false;
        this.currentDirection = Phaser.Math.Between(0, 360);
    }
}