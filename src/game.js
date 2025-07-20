const config = {
    type: Phaser.AUTO,
    width: 1300,
    height: 700,
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