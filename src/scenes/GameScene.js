class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('GameScene created!');
        this.cameras.main.setBackgroundColor('#3a3a3a');
        
        this.wantedLevel = 0;
        this.wantedDecayTimer = 0;
        this.policeSpawnTimer = 0;
        
        this.createCollisionGroups();
        this.createCity();
        this.createPlayer();
        this.createVehicles();
        this.createPedestrians();
        this.createControls();
        this.setupCollisions();
        
        this.controlsUI = new ControlsUI(this);
        this.wantedLevelUI = new WantedLevelUI(this);
        this.soundManager = new SoundManager(this);
        
        // Initialize wanted level display
        this.wantedLevelUI.updateWantedLevel(0);
        
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2);
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

    createCity() {
        const graphics = this.add.graphics();
        
        graphics.lineStyle(4, 0x555555);
        for (let x = 0; x < 2000; x += 200) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, 2000);
        }
        for (let y = 0; y < 2000; y += 200) {
            graphics.moveTo(0, y);
            graphics.lineTo(2000, y);
        }
        graphics.strokePath();
        
        const buildingPositions = [
            { x: 50, y: 50, w: 100, h: 100 },
            { x: 250, y: 50, w: 100, h: 100 },
            { x: 450, y: 50, w: 100, h: 100 },
            { x: 50, y: 250, w: 100, h: 100 },
            { x: 450, y: 250, w: 100, h: 100 },
            { x: 50, y: 450, w: 100, h: 100 },
            { x: 250, y: 450, w: 100, h: 100 },
            { x: 450, y: 450, w: 100, h: 100 },
            { x: 650, y: 50, w: 100, h: 100 },
            { x: 850, y: 50, w: 100, h: 100 },
            { x: 650, y: 250, w: 100, h: 100 },
            { x: 850, y: 250, w: 100, h: 100 },
            { x: 650, y: 450, w: 100, h: 100 },
            { x: 850, y: 450, w: 100, h: 100 },
            { x: 50, y: 650, w: 100, h: 100 },
            { x: 250, y: 650, w: 100, h: 100 },
            { x: 450, y: 650, w: 100, h: 100 },
            { x: 650, y: 650, w: 100, h: 100 },
            { x: 850, y: 650, w: 100, h: 100 }
        ];
        
        buildingPositions.forEach(building => {
            const rect = this.add.rectangle(
                building.x + building.w/2, 
                building.y + building.h/2, 
                building.w, 
                building.h, 
                0x666666
            );
            this.buildings.add(rect);
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.physics.world.setBounds(0, 0, 2000, 2000);
        
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