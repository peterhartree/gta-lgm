class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

        const loadingText = this.make.text({
            x: centerX,
            y: centerY - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(centerX - 150, centerY - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            this.scene.start('GameScene');
        });

        this.createPlaceholderAssets();
    }

    createPlaceholderAssets() {
        const graphics = this.add.graphics();
        
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('player', 32, 32);
        
        graphics.clear();
        graphics.fillStyle(0x0000ff);
        graphics.fillRect(0, 0, 48, 24);
        graphics.generateTexture('car', 48, 24);
        
        graphics.clear();
        graphics.fillStyle(0xff0000);
        graphics.fillRect(0, 0, 24, 24);
        graphics.generateTexture('pedestrian', 24, 24);
        
        graphics.clear();
        graphics.fillStyle(0x000080);
        graphics.fillRect(0, 0, 64, 32);
        graphics.generateTexture('police_car', 64, 32);
        
        graphics.destroy();
    }
}