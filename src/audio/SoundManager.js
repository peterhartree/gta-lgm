class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.enabled = true;
        this.audioContext = null;
        this.radioStations = {};
        this.currentStation = null;
        this.initAudioContext();
        this.initRadioStations();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized');
        } catch (e) {
            console.error('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playNoise(duration, volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        whiteNoise.buffer = buffer;
        whiteNoise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        whiteNoise.start(this.audioContext.currentTime);
    }
    
    playEngineSound() {
        // Low frequency hum
        this.playTone(80, 0.1, 'sawtooth', 0.1);
        console.log('Sound: Engine start');
    }
    
    stopEngineSound() {
        console.log('Sound: Engine stop');
    }
    
    updateEngineSound(speed) {
        if (!this.enabled) return;
        const pitch = 80 + (Math.abs(speed) / 10);
        if (Math.random() < 0.1) { // Play occasionally to avoid constant noise
            this.playTone(pitch, 0.05, 'sawtooth', 0.05);
        }
    }
    
    playSiren() {
        if (!this.enabled || !this.scene.sound) return;
        
        // Play the police siren sound file
        this.scene.sound.play('police-siren', {
            volume: 0.2
        });
        
        console.log('Sound: Siren on');
    }
    
    stopSiren() {
        console.log('Sound: Siren off');
    }
    
    playCrash(intensity = 1) {
        if (!this.enabled) return;
        // Crash sound: noise + low tone
        this.playNoise(0.2, 0.4 * intensity);
        this.playTone(150, 0.3, 'sawtooth', 0.3 * intensity);
        console.log('Sound: Crash!', intensity);
    }
    
    playPedestrianHit() {
        if (!this.enabled) return;
        // Quick thud sound
        this.playTone(100, 0.1, 'sine', 0.4);
        this.playNoise(0.05, 0.2);
        console.log('Sound: Pedestrian hit!');
    }
    
    playPedestrianDeath() {
        if (!this.enabled || !this.scene.sound) return;
        
        const deathSounds = [
            'death-merde',
            'death-mon-dieu',
            'death-sacre-blue',
            'death-zut-alors',
            'death-zut'
        ];
        
        // Pick a random death sound
        const randomSound = deathSounds[Math.floor(Math.random() * deathSounds.length)];
        
        // Play the sound
        this.scene.sound.play(randomSound, {
            volume: 4.0
        });
        
        console.log('Sound: Pedestrian death -', randomSound);
    }
    
    playCarHorn() {
        if (!this.enabled) return;
        // Classic car horn
        this.playTone(400, 0.3, 'square', 0.3);
        this.playTone(300, 0.3, 'square', 0.3);
        console.log('Sound: Honk!');
    }
    
    playGunshot() {
        if (!this.enabled || !this.scene.sound) return;
        
        // Play the gunshot sound file
        this.scene.sound.play('gunshot', {
            volume: 0.4
        });
        
        console.log('Sound: Gunshot!');
    }
    
    initRadioStations() {
        // Initialize all radio stations
        if (this.scene.sound) {
            const stationNames = ['radio-bonnie', 'radio-rio'];
            
            stationNames.forEach(station => {
                this.radioStations[station] = {
                    music: this.scene.sound.add(station, {
                        volume: 0.6,
                        loop: true
                    }),
                    position: 0
                };
                console.log(`Radio station ${station} loaded`);
            });
        }
    }
    
    playRadio(stationName) {
        // Stop current station if different
        if (this.currentStation && this.currentStation !== stationName) {
            this.stopRadio();
        }
        
        const station = this.radioStations[stationName];
        if (station && !station.music.isPlaying) {
            this.currentStation = stationName;
            
            // Resume from saved position
            if (station.position > 0) {
                station.music.play({
                    seek: station.position
                });
                console.log(`Radio: ${stationName} resumed at`, station.position);
            } else {
                station.music.play();
                console.log(`Radio: ${stationName} started`);
            }
        }
    }
    
    stopRadio() {
        if (this.currentStation) {
            const station = this.radioStations[this.currentStation];
            if (station && station.music.isPlaying) {
                // Save current position before stopping
                station.position = station.music.seek;
                station.music.pause(); // Use pause instead of stop to preserve position
                console.log(`Radio: ${this.currentStation} paused at`, station.position);
            }
            this.currentStation = null;
        }
    }
    
    resetRadio() {
        // Stop all stations and reset positions
        Object.values(this.radioStations).forEach(station => {
            station.music.stop();
            station.position = 0;
        });
        this.currentStation = null;
        console.log('Radio: All stations stopped');
    }
}