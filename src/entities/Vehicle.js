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
        this.setMass(2);
        
        this.maxSpeed = 400;
        this.acceleration = 300;
        this.deceleration = 200;
        this.turnSpeed = 200;
        this.handbrakeDeceleration = 600;
        
        this.currentSpeed = 0;
        this.isOccupied = false;
        this.driver = null;
        
        this.setBodySize(this.width * 0.8, this.height * 0.8);
    }
    
    enterVehicle(player) {
        if (!this.isOccupied) {
            this.isOccupied = true;
            this.driver = player;
            player.setVisible(false);
            player.body.enable = false;
            return true;
        }
        return false;
    }
    
    exitVehicle() {
        if (this.isOccupied && this.driver) {
            const exitX = this.x + Math.cos(this.rotation) * 50;
            const exitY = this.y + Math.sin(this.rotation) * 50;
            
            this.driver.setPosition(exitX, exitY);
            this.driver.setVisible(true);
            this.driver.body.enable = true;
            
            this.isOccupied = false;
            this.driver = null;
            this.currentSpeed = 0;
            this.setVelocity(0, 0);
            this.setAngularVelocity(0);
        }
    }
    
    update(cursors, wasd, handbrakeKey, delta) {
        if (!this.isOccupied) return;
        
        const dt = delta / 1000;
        
        const forwardPressed = cursors.up.isDown || wasd.W.isDown;
        const backwardPressed = cursors.down.isDown || wasd.S.isDown;
        const leftPressed = cursors.left.isDown || wasd.A.isDown;
        const rightPressed = cursors.right.isDown || wasd.D.isDown;
        const handbrakePressed = handbrakeKey.isDown;
        
        
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
        
        const velocityX = Math.cos(this.rotation) * this.currentSpeed;
        const velocityY = Math.sin(this.rotation) * this.currentSpeed;
        
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
}