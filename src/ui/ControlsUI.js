class ControlsUI {
    constructor(scene) {
        this.scene = scene;
        this.createControlsText();
        this.createDebugText();
    }

    createControlsText() {
        const controls = [
            'Controls:',
            'WASD/Arrows - Move',
            'E - Enter/Exit Vehicle',
            'F/Space - Shoot',
            'H - Horn',
            'B - Collision Editor',
            'T - Test Wanted Level'
        ];

        this.controlsText = this.scene.add.text(10, 10, controls, {
            font: '14px monospace',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 }
        });

        this.controlsText.setScrollFactor(0);
        this.controlsText.setDepth(1000);
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
        
        // Create radio display
        this.radioText = this.scene.add.text(10, 180, '', {
            font: '16px monospace',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        
        this.radioText.setScrollFactor(0);
        this.radioText.setDepth(1000);
    }

    update(player) {
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
        
        // Update radio display
        if (player.isInVehicle && player.currentVehicle) {
            const station = player.currentVehicle.radioStation;
            const stationName = station === 'radio-bonnie' ? 'Bonnie & Clyde FM' : 'Rio Radio';
            this.radioText.setText(`📻 ${stationName}`);
        } else {
            this.radioText.setText('');
        }
    }
}