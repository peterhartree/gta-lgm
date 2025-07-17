class WantedLevelUI {
    constructor(scene) {
        this.scene = scene;
        this.wantedElement = document.getElementById('wanted-level');
        this.currentLevel = 0;
        
        if (!this.wantedElement) {
            console.error('Wanted level DOM element not found!');
        } else {
            console.log('Wanted level UI initialized with DOM element');
        }
    }
    
    updateWantedLevel(level) {
        level = Math.max(0, Math.min(5, level));
        this.currentLevel = level;
        
        if (this.wantedElement) {
            this.wantedElement.textContent = `Wanted Level: ${level}`;
            
            // Remove all classes
            this.wantedElement.classList.remove('low', 'medium', 'high');
            
            // Add appropriate class based on level
            if (level === 0) {
                this.wantedElement.classList.add('low');
            } else if (level <= 2) {
                this.wantedElement.classList.add('medium');
            } else {
                this.wantedElement.classList.add('high');
            }
        }
        
        console.log('Updated wanted level to:', level);
    }
}