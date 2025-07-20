class ControlsUI {
    constructor(scene) {
        this.scene = scene;
        this.debugMode = window.location.search.includes('debug');
        if (this.debugMode) {
            this.createDebugText();
        }
    }

    createDebugText() {
        this.debugText = this.scene.add.text(10, 120, '', {
            font: '12px monospace',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });

        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);
    }

    update(player) {
        if (this.debugMode && this.debugText) {
            const debugInfo = [
                `In Vehicle: ${player.isInVehicle}`,
                `Current Vehicle: ${player.currentVehicle ? 'Yes' : 'No'}`,
                `Player Visible: ${player.visible}`,
                `Player Body Enabled: ${player.body.enable}`
            ];
            
            if (player.currentVehicle) {
                debugInfo.push(`Vehicle Speed: ${Math.round(player.currentVehicle.currentSpeed)}`);
            }
            
            this.debugText.setText(debugInfo);
        }
    }
}