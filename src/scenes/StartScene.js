class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        
        const coverArt = this.add.image(width / 2, height / 2, 'start-screen');
        const scaleX = width / coverArt.width;
        const scaleY = height / coverArt.height * 0.85; // Reduce height to prevent cutoff
        const scale = Math.min(scaleX, scaleY);
        coverArt.setScale(scale);
        
        // Position controls in bottom-right corner
        const controlsX = width - 170; // 170 = half of 300px width + 20px margin
        const controlsY = height - 130; // 130 = half of 240px height + 10px margin
        
        const bgRect = this.add.rectangle(controlsX, controlsY, 300, 240, 0x000000, 0.7);
        
        const titleText = this.add.text(controlsX, controlsY - 80, 'CONTROLS', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        
        const controlsText = [
            'WASD / Arrow Keys - Move',
            'F / Space - Shoot',
            'E - Enter/Exit Vehicle'
        ].join('\n');
        
        this.add.text(controlsX, controlsY + 10, controlsText, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        const startText = this.add.text(width / 2, height - 40, 'PRESS SPACE TO START', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        this.input.once('pointerdown', () => this.startGame());
        
        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
    }
    
    startGame() {
        this.scene.start('GameScene');
    }
}