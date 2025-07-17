class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.on('complete', () => {
            this.scene.start('PreloadScene');
        });
    }

    create() {
        
    }
}