class PoliceVehicle extends Vehicle {
    constructor(scene, x, y) {
        super(scene, x, y, 'police_car');
        
        this.setTint(0xffffff);
        this.maxSpeed = 450;
        this.acceleration = 400;
        this.turnSpeed = 250;
        
        this.target = null;
        this.pursuitSpeed = 0;
        this.isChasing = false;
        this.sirenActive = false;
    }
    
    startPursuit(target) {
        this.target = target;
        this.isChasing = true;
        this.sirenActive = true;
        console.log('Police: Starting pursuit!');
    }
    
    stopPursuit() {
        this.target = null;
        this.isChasing = false;
        this.sirenActive = false;
        this.pursuitSpeed = 0;
        this.setVelocity(0, 0);
        console.log('Police: Pursuit ended');
    }
    
    updatePursuit(delta) {
        if (!this.isChasing || !this.target) return;
        
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
        
        const targetAngle = angle + Math.PI / 2;
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
            this.pursuitSpeed = this.maxSpeed * 1.2;
        }
        
        const velocityX = Math.cos(this.rotation - Math.PI/2) * this.pursuitSpeed;
        const velocityY = Math.sin(this.rotation - Math.PI/2) * this.pursuitSpeed;
        
        this.setVelocity(velocityX, velocityY);
        
        this.currentSpeed = this.pursuitSpeed;
    }
}