class SkidMark {
    constructor(scene, x, y, angle) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.alpha = 0.6;
        this.lifetime = 3000; // 3 seconds
        this.createdAt = Date.now();
        
        // Create the skid mark graphics
        this.graphics = scene.add.graphics();
        this.draw();
    }

    draw() {
        const width = 5;
        const length = 20;
        
        // Calculate the offset for the skid mark based on angle
        const offsetX = Math.cos(this.angle) * length / 2;
        const offsetY = Math.sin(this.angle) * length / 2;
        
        // Draw a dark rectangle for the skid mark
        this.graphics.fillStyle(0x1a1a1a, this.alpha);
        this.graphics.fillRect(-width / 2, -length / 2, width, length);
        
        // Position and rotate the graphics
        this.graphics.x = this.x;
        this.graphics.y = this.y;
        this.graphics.rotation = this.angle;
    }

    update() {
        const elapsed = Date.now() - this.createdAt;
        
        // Fade out over time
        if (elapsed < this.lifetime) {
            this.alpha = 0.6 * (1 - elapsed / this.lifetime);
            this.graphics.alpha = this.alpha;
            return true; // Keep the skid mark
        } else {
            this.destroy();
            return false; // Remove the skid mark
        }
    }

    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
    }
}

class SkidMarkManager {
    constructor(scene, maxMarks = 200) {
        this.scene = scene;
        this.maxMarks = maxMarks;
        this.marks = [];
        this.lastMarkTimeLeft = 0;
        this.lastMarkTimeRight = 0;
        this.markInterval = 50; // Milliseconds between marks
    }

    addSkidMark(x, y, angle, wheelSide = 'left') {
        const now = Date.now();
        
        // Check timing based on which wheel
        const lastTime = wheelSide === 'left' ? this.lastMarkTimeLeft : this.lastMarkTimeRight;
        
        // Only add marks at intervals to avoid too many overlapping marks
        if (now - lastTime < this.markInterval) {
            return;
        }
        
        // Update the appropriate timer
        if (wheelSide === 'left') {
            this.lastMarkTimeLeft = now;
        } else {
            this.lastMarkTimeRight = now;
        }
        
        // Remove oldest mark if we've reached the limit
        if (this.marks.length >= this.maxMarks) {
            const oldest = this.marks.shift();
            oldest.destroy();
        }
        
        // Create new skid mark
        const mark = new SkidMark(this.scene, x, y, angle);
        this.marks.push(mark);
    }

    update() {
        // Update all marks and remove expired ones
        this.marks = this.marks.filter(mark => mark.update());
    }

    clear() {
        this.marks.forEach(mark => mark.destroy());
        this.marks = [];
    }

    destroy() {
        this.clear();
    }
}