class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene created!');
        
        this.wantedLevel = 0;
        this.wantedDecayTimer = 0;
        this.policeSpawnTimer = 0;
        
        // Collision editor mode
        this.editMode = false;
        this.collisionPoints = [];
        this.currentPolygon = [];
        
        this.createMapBackground();
        this.createCollisionGroups();
        this.loadPredefinedCollisions();
        this.createPlayer();
        this.createVehicles();
        this.createPedestrians();
        this.createControls();
        this.setupCollisions();
        this.setupCollisionEditor();
        
        this.controlsUI = new ControlsUI(this);
        this.wantedLevelUI = new WantedLevelUI(this);
        this.soundManager = new SoundManager(this);
        
        // Initialize wanted level display
        this.wantedLevelUI.updateWantedLevel(0);
        
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1);
    }

    createCollisionGroups() {
        this.buildings = this.physics.add.staticGroup();
        this.parkedCars = this.physics.add.group();
        this.pedestrians = this.physics.add.group({
            classType: Pedestrian
        });
        this.policeVehicles = this.physics.add.group({
            classType: PoliceVehicle
        });
    }

    createMapBackground() {
        // Add the map image as background
        const map = this.add.image(0, 0, 'cityMap');
        map.setOrigin(0, 0);
        
        // Scale map to fit game world (adjust these values based on your map)
        const mapScale = 0.5; // Reduced to half size
        map.setScale(mapScale);
        
        // Set world bounds to match map size
        const worldWidth = map.width * mapScale;
        const worldHeight = map.height * mapScale;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Store map dimensions for reference
        this.mapWidth = worldWidth;
        this.mapHeight = worldHeight;
        
        console.log('Map loaded. World size:', worldWidth, 'x', worldHeight);
    }
    
    loadPredefinedCollisions() {
        // Predefined collision boundaries from map tracing
        const savedCollisions = [
            // Empty - no predefined collisions
        ];
        
        // Load each saved collision polygon
        savedCollisions.forEach(polygon => {
            this.createBuildingFromPolygon(polygon);
        });
        
        console.log(`Loaded ${savedCollisions.length} predefined collision boundaries`);
    }
    
    setupCollisionEditor() {
        // Graphics for drawing collision boundaries
        this.collisionGraphics = this.add.graphics();
        this.collisionGraphics.setDepth(100);
        
        // Text for editor instructions
        this.editorText = this.add.text(10, 150, '', {
            fontSize: '16px',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.editorText.setScrollFactor(0);
        this.editorText.setDepth(1002);
        
        // Toggle edit mode with 'B' key
        this.input.keyboard.on('keydown-B', () => {
            this.editMode = !this.editMode;
            this.updateEditorDisplay();
            
            if (!this.editMode && this.currentPolygon.length > 2) {
                // Save current polygon when exiting edit mode
                this.createBuildingFromPolygon(this.currentPolygon);
                this.currentPolygon = [];
            }
        });
        
        // Mouse click handler for adding collision points
        this.input.on('pointerdown', (pointer) => {
            if (!this.editMode) return;
            
            // Convert screen coordinates to world coordinates
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            
            if (pointer.rightButtonDown()) {
                // Right click - finish current polygon
                if (this.currentPolygon.length > 2) {
                    this.createBuildingFromPolygon(this.currentPolygon);
                    this.currentPolygon = [];
                }
            } else {
                // Left click - add point
                this.currentPolygon.push({ x: worldPoint.x, y: worldPoint.y });
            }
            
            this.drawCollisionBoundaries();
        });
        
        // Export collision data with 'X' key
        this.input.keyboard.on('keydown-X', () => {
            if (this.editMode) {
                console.log('Collision boundaries:', JSON.stringify(this.collisionPoints));
                console.log('Copy this data to save your collision boundaries!');
            }
        });
        
        // Toggle collision visibility with 'V' key
        this.input.keyboard.on('keydown-V', () => {
            this.showCollisions = !this.showCollisions;
            if (this.showCollisions && !this.editMode) {
                this.drawCollisionBoundaries();
            } else if (!this.editMode) {
                this.collisionGraphics.clear();
            }
        });
    }
    
    createBuildingFromPolygon(points) {
        if (points.length < 3) return;
        
        // Calculate center and bounds
        let minX = points[0].x, maxX = points[0].x;
        let minY = points[0].y, maxY = points[0].y;
        
        points.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Create invisible rectangle for collision
        const building = this.add.rectangle(centerX, centerY, width, height);
        building.setVisible(false);
        this.buildings.add(building);
        
        // Store the polygon data
        this.collisionPoints.push([...points]);
    }
    
    drawCollisionBoundaries() {
        this.collisionGraphics.clear();
        
        if (!this.editMode && !this.showCollisions) return;
        
        // Draw saved polygons
        const color = this.editMode ? 0x00ff00 : 0xff0000;
        const alpha = this.editMode ? 0.8 : 0.5;
        this.collisionGraphics.lineStyle(3, color, alpha);
        
        this.collisionPoints.forEach(polygon => {
            this.collisionGraphics.beginPath();
            polygon.forEach((point, i) => {
                if (i === 0) {
                    this.collisionGraphics.moveTo(point.x, point.y);
                } else {
                    this.collisionGraphics.lineTo(point.x, point.y);
                }
            });
            this.collisionGraphics.closePath();
            this.collisionGraphics.strokePath();
        });
        
        // Draw current polygon being edited (only in edit mode)
        if (this.editMode && this.currentPolygon.length > 0) {
            this.collisionGraphics.lineStyle(3, 0xffff00, 1);
            this.collisionGraphics.beginPath();
            this.currentPolygon.forEach((point, i) => {
                if (i === 0) {
                    this.collisionGraphics.moveTo(point.x, point.y);
                } else {
                    this.collisionGraphics.lineTo(point.x, point.y);
                }
                // Draw point
                this.collisionGraphics.fillStyle(0xffff00);
                this.collisionGraphics.fillCircle(point.x, point.y, 5);
            });
            this.collisionGraphics.strokePath();
        }
    }
    
    updateEditorDisplay() {
        if (this.editMode) {
            this.editorText.setText([
                'COLLISION EDITOR MODE',
                'Left Click: Add point',
                'Right Click: Finish polygon',
                'B: Toggle editor',
                'X: Export collision data',
                `Points: ${this.currentPolygon.length}`
            ]);
            this.drawCollisionBoundaries();
        } else {
            this.editorText.setText('');
            this.collisionGraphics.clear();
        }
    }

    createPlayer() {
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        
        this.player.speed = 200;
        this.player.isInVehicle = false;
        this.player.currentVehicle = null;
    }

    createVehicles() {
        this.vehicles = this.physics.add.group({
            classType: Vehicle
        });
        
        const vehiclePositions = [
            { x: 300, y: 200 },
            { x: 600, y: 400 },
            { x: 200, y: 600 },
            { x: 800, y: 300 },
            { x: 500, y: 700 }
        ];
        
        vehiclePositions.forEach(pos => {
            const vehicle = new Vehicle(this, pos.x, pos.y, 'car');
            this.vehicles.add(vehicle);
        });
        
        const parkedPositions = [
            { x: 150, y: 150, angle: 0 },
            { x: 150, y: 180, angle: 0 },
            { x: 350, y: 350, angle: 90 },
            { x: 350, y: 380, angle: 90 },
            { x: 750, y: 150, angle: 0 },
            { x: 750, y: 180, angle: 0 },
            { x: 550, y: 550, angle: 45 }
        ];
        
        parkedPositions.forEach(pos => {
            const parkedCar = this.physics.add.sprite(pos.x, pos.y, 'car');
            parkedCar.setTint(0x808080);
            parkedCar.setAngle(pos.angle);
            parkedCar.setImmovable(true);
            parkedCar.setBounce(0.2);
            this.parkedCars.add(parkedCar);
        });
    }

    createPedestrians() {
        const pedestrianCount = 20;
        
        for (let i = 0; i < pedestrianCount; i++) {
            const x = Phaser.Math.Between(100, 1900);
            const y = Phaser.Math.Between(100, 1900);
            
            const pedestrian = new Pedestrian(this, x, y);
            this.pedestrians.add(pedestrian);
        }
    }

    setupCollisions() {
        this.physics.add.overlap(this.player, this.vehicles, this.handlePlayerVehicleOverlap, null, this);
        this.physics.add.overlap(this.player, this.policeVehicles, this.handlePlayerVehicleOverlap, null, this);
        
        this.physics.add.collider(this.player, this.buildings);
        this.physics.add.collider(this.vehicles, this.buildings, this.handleVehicleBuildingCollision, null, this);
        this.physics.add.collider(this.vehicles, this.vehicles, this.handleVehicleVehicleCollision, null, this);
        
        this.physics.add.collider(this.player, this.parkedCars);
        this.physics.add.collider(this.vehicles, this.parkedCars, this.handleVehicleParkedCarCollision, null, this);
        
        this.physics.add.collider(this.pedestrians, this.buildings);
        this.physics.add.collider(this.pedestrians, this.pedestrians);
        this.physics.add.collider(this.pedestrians, this.parkedCars);
        
        this.physics.add.collider(this.player, this.pedestrians);
        this.physics.add.overlap(this.vehicles, this.pedestrians, this.handleVehiclePedestrianCollision, null, this);
        
        this.physics.add.collider(this.policeVehicles, this.buildings, this.handleVehicleBuildingCollision, null, this);
        this.physics.add.collider(this.policeVehicles, this.vehicles, this.handlePoliceVehicleCollision, null, this);
        this.physics.add.collider(this.policeVehicles, this.policeVehicles);
        this.physics.add.collider(this.policeVehicles, this.parkedCars);
        this.physics.add.overlap(this.policeVehicles, this.pedestrians, this.handleVehiclePedestrianCollision, null, this);
    }

    handleVehicleBuildingCollision(vehicle, building) {
        const speed = Math.abs(vehicle.currentSpeed);
        if (speed > 200) {
            this.cameras.main.shake(100, 0.01);
            vehicle.currentSpeed *= 0.3;
            this.soundManager.playCrash(speed / 400);
        }
    }

    handleVehicleVehicleCollision(vehicle1, vehicle2) {
        const relativeSpeed = Math.abs(vehicle1.currentSpeed - vehicle2.currentSpeed);
        if (relativeSpeed > 150) {
            this.cameras.main.shake(150, 0.02);
            this.soundManager.playCrash(relativeSpeed / 300);
        }
    }

    handleVehicleParkedCarCollision(vehicle, parkedCar) {
        const speed = Math.abs(vehicle.currentSpeed);
        if (speed > 100) {
            this.cameras.main.shake(80, 0.01);
            parkedCar.setVelocity(
                Math.cos(vehicle.rotation) * speed * 0.3,
                Math.sin(vehicle.rotation) * speed * 0.3
            );
        }
    }

    handleVehiclePedestrianCollision(vehicle, pedestrian) {
        if (vehicle.isOccupied && Math.abs(vehicle.currentSpeed) > 30) {
            console.log('Vehicle hit pedestrian at speed:', vehicle.currentSpeed, 'Pedestrian alive:', pedestrian.isAlive);
            
            // Check if pedestrian was alive before the hit for wanted level
            const wasAlive = pedestrian.isAlive;
            
            pedestrian.getHit(vehicle);
            this.soundManager.playPedestrianHit();
            
            if (Math.abs(vehicle.currentSpeed) > 100 && wasAlive) {
                this.increaseWantedLevel(1);
            }
        }
    }

    handlePoliceVehicleCollision(police, vehicle) {
        const relativeSpeed = Math.abs(police.currentSpeed - vehicle.currentSpeed);
        if (relativeSpeed > 150) {
            this.cameras.main.shake(200, 0.03);
            this.soundManager.playCrash(1.5);
            
            if (vehicle === this.player.currentVehicle) {
                this.increaseWantedLevel(1);
            }
        }
    }

    handlePlayerVehicleOverlap(player, vehicle) {
        if (!player.isInVehicle && !vehicle.isOccupied && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            console.log('Attempting to enter vehicle...');
            if (vehicle.enterVehicle(player)) {
                player.isInVehicle = true;
                player.currentVehicle = vehicle;
                this.cameras.main.startFollow(vehicle, true, 0.08, 0.08);
                console.log('Successfully entered vehicle!');
            }
        }
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.enterKey = this.input.keyboard.addKey('E');
        this.handbrakeKey = this.input.keyboard.addKey('SPACE');
        this.hornKey = this.input.keyboard.addKey('H');
        this.testWantedKey = this.input.keyboard.addKey('T'); // Test key
    }

    update(time, delta) {
        this.handlePlayerMovement();
        this.handleVehicleExit();
        this.handleHorn();
        
        // Test wanted level with T key
        if (Phaser.Input.Keyboard.JustDown(this.testWantedKey)) {
            this.increaseWantedLevel(1);
            console.log('TEST: Increased wanted level');
        }
        
        this.vehicles.children.entries.forEach(vehicle => {
            if (vehicle.isOccupied) {
                vehicle.update(this.cursors, this.wasd, this.handbrakeKey, delta);
            }
        });
        
        this.policeVehicles.children.entries.forEach(police => {
            police.updatePursuit(delta);
        });
        
        this.pedestrians.children.entries.forEach(pedestrian => {
            pedestrian.update(time, delta, [...this.vehicles.children.entries, ...this.policeVehicles.children.entries], this.player);
        });
        
        this.updateWantedLevel(delta);
        this.updatePoliceSpawning(delta);
    }

    handlePlayerMovement() {
        if (this.player.isInVehicle) {
            
        } else {
            const speed = this.player.speed;
            let velocityX = 0;
            let velocityY = 0;

            if (this.cursors.left.isDown || this.wasd.A.isDown) {
                velocityX = -speed;
            } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
                velocityX = speed;
            }

            if (this.cursors.up.isDown || this.wasd.W.isDown) {
                velocityY = -speed;
            } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
                velocityY = speed;
            }

            if (velocityX !== 0 && velocityY !== 0) {
                velocityX *= 0.707;
                velocityY *= 0.707;
            }

            this.player.setVelocity(velocityX, velocityY);
        }
    }

    handleVehicleExit() {
        if (this.player.isInVehicle && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            console.log('Attempting to exit vehicle...');
            console.log('Player in vehicle:', this.player.isInVehicle);
            console.log('Current vehicle:', this.player.currentVehicle);
            
            this.player.currentVehicle.exitVehicle();
            this.player.isInVehicle = false;
            this.player.currentVehicle = null;
            this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
            
            console.log('Successfully exited vehicle!');
        }
    }

    handleHorn() {
        if (this.player.isInVehicle && Phaser.Input.Keyboard.JustDown(this.hornKey)) {
            this.soundManager.playCarHorn();
        }
    }

    increaseWantedLevel(amount) {
        this.wantedLevel = Math.min(this.wantedLevel + amount, 5);
        this.wantedDecayTimer = 0;
        this.wantedLevelUI.updateWantedLevel(this.wantedLevel);
        console.log('Wanted level:', this.wantedLevel);
    }

    updateWantedLevel(delta) {
        if (this.wantedLevel > 0) {
            this.wantedDecayTimer += delta;
            
            if (this.wantedDecayTimer > 10000) {
                this.wantedLevel = Math.max(0, this.wantedLevel - 1);
                this.wantedDecayTimer = 0;
                this.wantedLevelUI.updateWantedLevel(this.wantedLevel);
                console.log('Wanted level decreased to:', this.wantedLevel);
            }
        }
    }

    updatePoliceSpawning(delta) {
        if (this.wantedLevel > 0) {
            this.policeSpawnTimer += delta;
            
            const spawnInterval = Math.max(3000, 8000 - (this.wantedLevel * 1000));
            const maxPolice = Math.min(this.wantedLevel * 2, 6);
            
            if (this.policeSpawnTimer > spawnInterval && this.policeVehicles.children.entries.length < maxPolice) {
                this.spawnPolice();
                this.policeSpawnTimer = 0;
            }
        } else {
            this.policeVehicles.children.entries.forEach(police => {
                police.stopPursuit();
                this.time.delayedCall(2000, () => {
                    police.destroy();
                });
            });
        }
    }

    spawnPolice() {
        const spawnDistance = 400;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const targetPos = this.player.currentVehicle || this.player;
        
        const x = targetPos.x + Math.cos(angle) * spawnDistance;
        const y = targetPos.y + Math.sin(angle) * spawnDistance;
        
        const police = new PoliceVehicle(this, x, y);
        this.policeVehicles.add(police);
        police.startPursuit(this.player);
        this.soundManager.playSiren();
        
        console.log('Police spawned at', x, y);
    }
}