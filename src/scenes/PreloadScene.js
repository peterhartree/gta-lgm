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
            this.scene.start('StartScene');
        });

        // Load start screen
        this.load.image('start-screen', 'assets/start.jpeg');
        
        // Load the map image
        this.load.image('cityMap', 'assets/map.webp');
        
        // Load car images
        this.load.image('car-red', 'assets/car-red.png');
        this.load.image('car-white', 'assets/car-white.png');
        this.load.image('car-taxi', 'assets/car-taxi.png');
        this.load.image('car-police', 'assets/car-police.png');
        
        // Load all radio music
        this.load.audio('radio-bonnie', 'assets/music/bonnie-and-clyde.mp3');
        this.load.audio('radio-rio', 'assets/music/je-vais-a-rio.mp3');
        
        // Load death sounds
        this.load.audio('death-merde', 'assets/sounds/merde.mp3');
        this.load.audio('death-mon-dieu', 'assets/sounds/mon-dieu.mp3');
        this.load.audio('death-sacre-blue', 'assets/sounds/sacre-blue.mp3');
        this.load.audio('death-zut-alors', 'assets/sounds/zut-alors.mp3');
        this.load.audio('death-zut', 'assets/sounds/zut.mp3');
        
        // Load gunshot sound
        this.load.audio('gunshot', 'assets/sounds/gunshot.mp3');
        
        // Load police siren sound
        this.load.audio('police-siren', 'assets/sounds/police-siren.mp3');
        
        // Load pedestrian images
        this.load.image('player', 'assets/pedestrians/player.png');
        this.load.image('person-1', 'assets/pedestrians/person-1.png');
        this.load.image('person-2', 'assets/pedestrians/person-2.png');
        this.load.image('person-3', 'assets/pedestrians/person-3.png');
        this.load.image('person-4', 'assets/pedestrians/person-4.png');

        this.createPlaceholderAssets();
    }

    createPlaceholderAssets() {
        const graphics = this.add.graphics();
        
        // Only create placeholder for car (since we don't have a generic car image)
        graphics.fillStyle(0x0000ff);
        graphics.fillRect(0, 0, 48, 24);
        graphics.generateTexture('car', 48, 24);
        
        graphics.clear();
        graphics.fillStyle(0xffff00);
        graphics.fillRect(0, 0, 8, 4);
        graphics.generateTexture('bullet', 8, 4);
        
        graphics.destroy();
    }
}