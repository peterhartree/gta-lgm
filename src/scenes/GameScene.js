class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene created!');
        
        this.wantedLevel = 0;
        this.wantedDecayTimer = 0;
        this.policeSpawnTimer = 0;
        this.wantedActiveTimer = 0; // Track how long we've been wanted
        this.pedestrianKillCount = 0; // Track pedestrian kills for wanted level
        
        // Game state
        this.isGameOver = false;
        this.arrestTimer = 0;
        this.arrestingPolice = null;
        this.lastCollisionSound = 0;
        
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
        
        // Create game over UI
        this.createGameOverUI();
        
        // Create arrest timer UI
        this.arrestTimerBar = this.add.rectangle(this.cameras.main.width / 2, 50, 0, 20, 0xff0000);
        this.arrestTimerBar.setScrollFactor(0);
        this.arrestTimerBar.setDepth(1500);
        this.arrestTimerBar.setVisible(false);
        
        this.arrestTimerBg = this.add.rectangle(this.cameras.main.width / 2, 50, 200, 20, 0x000000);
        this.arrestTimerBg.setScrollFactor(0);
        this.arrestTimerBg.setDepth(1499);
        this.arrestTimerBg.setVisible(false);
    }

    createCollisionGroups() {
        this.buildings = this.physics.add.staticGroup();
        this.pedestrians = this.physics.add.group({
            classType: Pedestrian
        });
        this.policeVehicles = this.physics.add.group({
            classType: PoliceVehicle
        });
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 50,
            runChildUpdate: false
        });
    }

    createMapBackground() {
        // Add the map image as background
        const map = this.add.image(0, 0, 'cityMap');
        map.setOrigin(0, 0);
        
        // Scale map to fit game world (adjust these values based on your map)
        const mapScale = 0.35; // Reduced to 70% of previous size
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
        this.editorText.setVisible(false); // Start hidden
        
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
            this.editorText.setVisible(true);
            this.drawCollisionBoundaries();
        } else {
            this.editorText.setText('');
            this.editorText.setVisible(false);
            this.collisionGraphics.clear();
        }
    }

    createPlayer() {
        // Spawn player at center of the map
        const centerX = this.physics.world.bounds.width / 2;
        const centerY = this.physics.world.bounds.height / 2;
        
        this.player = this.physics.add.sprite(centerX, centerY, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.105); // Scale down the player image to 70% of previous size
        
        this.player.speed = 200;
        this.player.isInVehicle = false;
        this.player.currentVehicle = null;
        this.player.lastDirection = 0; // Store last movement direction in radians
    }

    createVehicles() {
        this.vehicles = this.physics.add.group({
            classType: Vehicle
        });
        
        // Create a group for vehicle entry zones
        this.vehicleEntryZones = this.physics.add.group();
        
        const vehiclePositions = [
            { x: 300, y: 200, angle: 0 },
            { x: 600, y: 400, angle: 0 },
            { x: 150, y: 150, angle: 0 },
            { x: 350, y: 350, angle: 90 },
            { x: 550, y: 550, angle: 45 },
            { x: 950, y: 450, angle: 180 }
        ];
        
        const carTextures = ['car-red', 'car-white', 'car-taxi'];
        
        vehiclePositions.forEach(pos => {
            const texture = carTextures[Math.floor(Math.random() * carTextures.length)];
            const vehicle = new Vehicle(this, pos.x, pos.y, texture);
            if (pos.angle) {
                vehicle.setAngle(pos.angle);
                vehicle.rotation = Phaser.Math.DegToRad(pos.angle + 90); // Adjust rotation for proper orientation
                vehicle.parkedRotation = vehicle.rotation; // Update parked rotation
            }
            this.vehicles.add(vehicle);
            this.vehicleEntryZones.add(vehicle.entryZone);
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
        // First set up colliders to prevent walking through vehicles
        this.physics.add.collider(this.player, this.vehicles, this.handlePlayerVehicleCollision, null, this);
        this.physics.add.collider(this.player, this.policeVehicles, this.handlePlayerVehicleCollision, null, this);
        
        // Add overlap for pedestrian arrest
        this.physics.add.overlap(this.player, this.policeVehicles, this.handlePlayerPoliceOverlap, null, this);
        
        // Use entry zones for vehicle entry detection (larger area for easier entry)
        this.physics.add.overlap(this.player, this.vehicleEntryZones, this.handlePlayerEntryZoneOverlap, null, this);
        
        this.physics.add.collider(this.player, this.buildings);
        this.physics.add.collider(this.vehicles, this.buildings, this.handleVehicleBuildingCollision, null, this);
        this.physics.add.collider(this.vehicles, this.vehicles, this.handleVehicleVehicleCollision, null, this);
        
        this.physics.add.collider(this.pedestrians, this.buildings);
        this.physics.add.collider(this.pedestrians, this.pedestrians);
        
        this.physics.add.collider(this.player, this.pedestrians);
        this.physics.add.overlap(this.vehicles, this.pedestrians, this.handleVehiclePedestrianCollision, null, this);
        
        this.physics.add.collider(this.policeVehicles, this.buildings, this.handleVehicleBuildingCollision, null, this);
        this.physics.add.collider(this.policeVehicles, this.vehicles, this.handlePoliceVehicleCollision, null, this);
        this.physics.add.collider(this.policeVehicles, this.policeVehicles);
        this.physics.add.overlap(this.policeVehicles, this.pedestrians, this.handleVehiclePedestrianCollision, null, this);
        
        // Bullet collisions
        this.physics.add.overlap(this.bullets, this.buildings, this.handleBulletWallCollision, null, this);
        this.physics.add.overlap(this.bullets, this.pedestrians, this.handleBulletPedestrianCollision, null, this);
        this.physics.add.overlap(this.bullets, this.vehicles, this.handleBulletVehicleCollision, null, this);
        this.physics.add.overlap(this.bullets, this.policeVehicles, this.handleBulletVehicleCollision, null, this);
    }

    handleVehicleBuildingCollision(vehicle, building) {
        const speed = Math.abs(vehicle.currentSpeed);
        if (speed > 200) {
            this.cameras.main.shake(100, 0.01);
            vehicle.currentSpeed *= 0.3;
        }
    }

    handleVehicleVehicleCollision(vehicle1, vehicle2) {
        const relativeSpeed = Math.abs(vehicle1.currentSpeed - vehicle2.currentSpeed);
        if (relativeSpeed > 150) {
            this.cameras.main.shake(150, 0.02);
        }
    }
    
    handlePlayerVehicleCollision(player, vehicle) {
        // Prevent collision only when player is in a different vehicle
        // or when on foot and vehicle is unoccupied
        if (player.isInVehicle && player.currentVehicle === vehicle) {
            return false; // Don't collide with own vehicle
        }
        return true; // Always collide otherwise
    }

    handleVehiclePedestrianCollision(vehicle, pedestrian) {
        if (vehicle.isOccupied && Math.abs(vehicle.currentSpeed) > 30) {
            console.log('Vehicle hit pedestrian at speed:', vehicle.currentSpeed, 'Pedestrian alive:', pedestrian.isAlive);
            
            // Check if pedestrian was alive before the hit for wanted level
            const wasAlive = pedestrian.isAlive;
            
            pedestrian.getHit(vehicle);
            
            if (Math.abs(vehicle.currentSpeed) > 100 && wasAlive) {
                this.pedestrianKillCount++;
                console.log('Pedestrian kill count:', this.pedestrianKillCount);
                
                // Only increase wanted level after 3 kills
                if (this.pedestrianKillCount >= 3 && this.wantedLevel === 0) {
                    this.increaseWantedLevel(1);
                }
            }
        }
    }

    handlePoliceVehicleCollision(police, vehicle) {
        const relativeSpeed = Math.abs(police.currentSpeed - vehicle.currentSpeed);
        
        // Check if this is the player's vehicle
        if (vehicle === this.player.currentVehicle) {
            // Track arrest timer
            if (this.arrestingPolice === police) {
                // Continue arrest
            } else {
                // New arrest attempt
                this.arrestingPolice = police;
                this.arrestTimer = 0;
            }
            
            // Only play crash sound with cooldown
            const currentTime = this.time.now;
            if (relativeSpeed > 150 && currentTime - this.lastCollisionSound > 1000) {
                this.cameras.main.shake(200, 0.03);
                this.increaseWantedLevel(1);
                this.lastCollisionSound = currentTime;
            }
        } else {
            // Regular collision between police and other vehicles
            if (relativeSpeed > 150) {
                this.cameras.main.shake(100, 0.02);
            }
        }
    }

    handlePlayerEntryZoneOverlap(player, entryZone) {
        // Get the vehicle reference from the entry zone
        const vehicle = entryZone.vehicle;
        if (!vehicle) return;
        
        if (!player.isInVehicle && !vehicle.isOccupied && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            console.log('Attempting to enter vehicle...');
            if (vehicle.enterVehicle(player)) {
                player.isInVehicle = true;
                player.currentVehicle = vehicle;
                this.cameras.main.startFollow(vehicle, true, 0.08, 0.08);
                
                // Start radio music for this specific vehicle (only for regular vehicles, not police)
                if (vehicle.radioStation) {
                    this.soundManager.playRadio(vehicle.radioStation);
                }
                
                console.log('Successfully entered vehicle!');
            }
        }
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.enterKey = this.input.keyboard.addKey('E');
        this.hornKey = this.input.keyboard.addKey('H');
        this.testWantedKey = this.input.keyboard.addKey('T'); // Test key
        
        // Shooting controls
        this.shootKey = this.input.keyboard.addKey('F');
        this.shootKeyAlt = this.input.keyboard.addKey('SPACE');
        this.lastShotTime = 0;
        this.shotCooldown = 200; // milliseconds between shots
    }

    update(time, delta) {
        if (this.isGameOver) {
            // Handle restart
            if (this.input.keyboard.addKey('SPACE').isDown) {
                this.restartGame();
            }
            return;
        }
        
        this.handlePlayerMovement();
        this.handleVehicleExit();
        this.handleHorn();
        this.handleShooting(time);
        
        // Test wanted level with T key
        if (Phaser.Input.Keyboard.JustDown(this.testWantedKey)) {
            this.increaseWantedLevel(1);
            console.log('TEST: Increased wanted level');
        }
        
        this.vehicles.children.entries.forEach(vehicle => {
            vehicle.update(this.cursors, this.wasd, null, delta);
        });
        
        this.policeVehicles.children.entries.forEach(police => {
            police.updatePursuit(delta);
        });
        
        this.pedestrians.children.entries.forEach(pedestrian => {
            pedestrian.update(time, delta, [...this.vehicles.children.entries, ...this.policeVehicles.children.entries], this.player);
        });
        
        this.updateWantedLevel(delta);
        this.updatePoliceSpawning(delta);
        this.updateArrestTimer(delta);
        
        // Update UI
        this.controlsUI.update(this.player);
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
            
            // Update player rotation based on movement direction
            if (velocityX !== 0 || velocityY !== 0) {
                const angle = Math.atan2(velocityY, velocityX);
                // Add PI/2 because sprites face down by default, plus PI to flip 180 degrees
                this.player.setRotation(angle + Math.PI/2 + Math.PI);
                // Store the last direction for shooting
                this.player.lastDirection = angle;
            }
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
            
            // Stop radio music when exiting vehicle
            this.soundManager.stopRadio();
            
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
        if (this.wantedLevel > 0 && this.wantedActiveTimer === 0) {
            this.wantedActiveTimer = 0; // Reset the timer when becoming wanted
        }
        this.wantedLevelUI.updateWantedLevel(this.wantedLevel);
        console.log('Wanted level:', this.wantedLevel);
    }

    updateWantedLevel(delta) {
        if (this.wantedLevel > 0) {
            this.wantedDecayTimer += delta;
            this.wantedActiveTimer += delta;
            
            // Check if all police are destroyed to reset wanted level
            if (this.policeVehicles.children.entries.length === 0 && this.wantedActiveTimer > 10000) {
                this.wantedLevel = 0;
                this.wantedDecayTimer = 0;
                this.wantedActiveTimer = 0;
                this.pedestrianKillCount = 0; // Reset kill count
                this.wantedLevelUI.updateWantedLevel(this.wantedLevel);
                console.log('Wanted level reset - all police destroyed');
            } else if (this.wantedDecayTimer > 10000 && this.wantedActiveTimer >= 15000) {
                // Only allow wanted level to decrease after 15 seconds minimum
                this.wantedLevel = Math.max(0, this.wantedLevel - 1);
                this.wantedDecayTimer = 0;
                this.wantedLevelUI.updateWantedLevel(this.wantedLevel);
                console.log('Wanted level decreased to:', this.wantedLevel);
            }
        } else {
            this.wantedActiveTimer = 0;
        }
    }

    updatePoliceSpawning(delta) {
        if (this.wantedLevel > 0) {
            this.policeSpawnTimer += delta;
            
            const spawnInterval = Math.max(3000, 8000 - (this.wantedLevel * 1000));
            const maxPolice = Math.min(this.wantedLevel * 2, 6);
            
            // Only spawn police after 5 seconds of being wanted and stop spawning after 10 seconds
            if (this.wantedActiveTimer >= 5000 && 
                this.wantedActiveTimer < 10000 && 
                this.policeSpawnTimer > spawnInterval && 
                this.policeVehicles.children.entries.length < maxPolice) {
                this.spawnPolice();
                this.policeSpawnTimer = 0;
            }
        } else {
            this.policeVehicles.children.entries.forEach(police => {
                if (!police.isDestroyed) {
                    police.stopPursuit();
                    this.time.delayedCall(2000, () => {
                        if (police.scene && !police.isDestroyed) {
                            police.destroy(false); // No explosion, just disappear
                        }
                    });
                }
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
        // Add the police vehicle's entry zone to the entry zones group
        this.vehicleEntryZones.add(police.entryZone);
        police.startPursuit(this.player);
        this.soundManager.playSiren();
        
        console.log('Police spawned at', x, y);
    }
    
    createGameOverUI() {
        // Game over background
        this.gameOverBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, 
            this.cameras.main.width, this.cameras.main.height, 0x000000, 0.8);
        this.gameOverBg.setScrollFactor(0);
        this.gameOverBg.setDepth(2000);
        this.gameOverBg.setVisible(false);
        
        // Game over text
        this.gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, 
            'ARRESTED', {
            fontSize: '72px',
            fontFamily: 'Arial Black',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8
        });
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setScrollFactor(0);
        this.gameOverText.setDepth(2001);
        this.gameOverText.setVisible(false);
        
        // Restart text
        this.restartText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50,
            'Press SPACE to restart', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.restartText.setOrigin(0.5);
        this.restartText.setScrollFactor(0);
        this.restartText.setDepth(2001);
        this.restartText.setVisible(false);
    }
    
    showGameOver() {
        this.isGameOver = true;
        this.gameOverBg.setVisible(true);
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
        
        // Stop radio music completely (reset position)
        this.soundManager.resetRadio();
        
        // Stop all vehicles
        this.vehicles.children.entries.forEach(vehicle => {
            vehicle.setVelocity(0, 0);
            vehicle.setAngularVelocity(0);
        });
        
        this.policeVehicles.children.entries.forEach(police => {
            police.setVelocity(0, 0);
            police.setAngularVelocity(0);
        });
        
        // Stop player
        this.player.setVelocity(0, 0);
        if (this.player.currentVehicle) {
            this.player.currentVehicle.setVelocity(0, 0);
            this.player.currentVehicle.setAngularVelocity(0);
        }
    }
    
    restartGame() {
        this.scene.restart();
    }
    
    updateArrestTimer(delta) {
        // Check if player is being arrested (either in vehicle or on foot)
        if (this.arrestingPolice) {
            let distance;
            
            if (this.player.isInVehicle && this.player.currentVehicle) {
                // Check distance to player's vehicle
                distance = Phaser.Math.Distance.Between(
                    this.arrestingPolice.x, this.arrestingPolice.y,
                    this.player.currentVehicle.x, this.player.currentVehicle.y
                );
            } else if (!this.player.isInVehicle) {
                // Check distance to player on foot
                distance = Phaser.Math.Distance.Between(
                    this.arrestingPolice.x, this.arrestingPolice.y,
                    this.player.x, this.player.y
                );
            } else {
                // Player is in a vehicle but it's not their current vehicle somehow
                distance = Infinity;
            }
            
            // If still touching (within collision distance)
            if (distance < 80) {
                this.arrestTimer += delta;
                
                // Show arrest timer bar
                this.arrestTimerBar.setVisible(true);
                this.arrestTimerBg.setVisible(true);
                
                // Update bar width (max 200 pixels for 5 seconds)
                const progress = Math.min(this.arrestTimer / 5000, 1);
                this.arrestTimerBar.width = progress * 200;
                
                // Check if arrested (5 seconds = 5000ms)
                if (this.arrestTimer >= 5000) {
                    this.showGameOver();
                }
            } else {
                // Reset if police moved away
                this.arrestTimer = 0;
                this.arrestingPolice = null;
                this.arrestTimerBar.setVisible(false);
                this.arrestTimerBg.setVisible(false);
            }
        } else {
            // Reset if no arresting police
            this.arrestTimer = 0;
            this.arrestingPolice = null;
            this.arrestTimerBar.setVisible(false);
            this.arrestTimerBg.setVisible(false);
        }
    }
    
    handleShooting(time) {
        if ((this.shootKey.isDown || this.shootKeyAlt.isDown) && time > this.lastShotTime + this.shotCooldown) {
            this.lastShotTime = time;
            
            let shootX, shootY, shootAngle;
            
            if (this.player.isInVehicle && this.player.currentVehicle) {
                // Shooting from vehicle
                const vehicle = this.player.currentVehicle;
                
                // Shoot in the direction the vehicle is facing
                shootAngle = vehicle.rotation - Math.PI/2;
                
                // Position bullet at front of vehicle
                const frontOffset = 30; // Distance from center to front of vehicle
                shootX = vehicle.x + Math.cos(shootAngle) * frontOffset;
                shootY = vehicle.y + Math.sin(shootAngle) * frontOffset;
            } else {
                // Shooting on foot
                shootX = this.player.x;
                shootY = this.player.y;
                
                // Use the last direction the player was moving
                shootAngle = this.player.lastDirection;
            }
            
            this.fireBullet(shootX, shootY, shootAngle);
        }
    }
    
    fireBullet(x, y, angle) {
        const bullet = this.bullets.get();
        
        if (bullet) {
            bullet.fire(x, y, angle);
            this.soundManager.playGunshot();
        }
    }
    
    handleBulletWallCollision(bullet, wall) {
        bullet.hit();
    }
    
    handleBulletPedestrianCollision(bullet, pedestrian) {
        if (pedestrian.isAlive) {
            pedestrian.getHit({ currentSpeed: 300, rotation: bullet.rotation });
            bullet.hit();
            
            // Count pedestrian kills
            this.pedestrianKillCount++;
            console.log('Pedestrian kill count:', this.pedestrianKillCount);
            
            // Only increase wanted level after 3 kills
            if (this.pedestrianKillCount >= 3 && this.wantedLevel === 0) {
                this.increaseWantedLevel(1);
            }
        }
    }
    
    handlePlayerPoliceOverlap(player, police) {
        // Only arrest if player is on foot and police is active
        if (!this.player.isInVehicle && police.isChasing) {
            // Start or continue arrest
            if (this.arrestingPolice !== police) {
                this.arrestingPolice = police;
                this.arrestTimer = 0;
            }
        }
    }
    
    handleBulletVehicleCollision(bullet, vehicle) {
        bullet.hit();
        
        // Add some visual/audio feedback
        this.cameras.main.shake(50, 0.005);
        
        // Damage any vehicle that isn't the player's current vehicle
        if (!this.player.isInVehicle || this.player.currentVehicle !== vehicle) {
            vehicle.takeDamage();
            
            // If it's a police vehicle, increase wanted level more
            if (vehicle instanceof PoliceVehicle) {
                this.increaseWantedLevel(2);
            }
        }
    }
}