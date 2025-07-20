const config = {
    type: Phaser.AUTO,
    width: 1800,
    height: 1000,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, StartScene, GameScene]
};

const game = new Phaser.Game(config);