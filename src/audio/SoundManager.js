class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.enabled = true;
        this.audioContext = null;
        this.initAudioContext();
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
        if (!this.enabled) return;
        // Alternating high-low siren
        this.playTone(800, 0.3, 'square', 0.2);
        setTimeout(() => this.playTone(600, 0.3, 'square', 0.2), 300);
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
    
    playCarHorn() {
        if (!this.enabled) return;
        // Classic car horn
        this.playTone(400, 0.3, 'square', 0.3);
        this.playTone(300, 0.3, 'square', 0.3);
        console.log('Sound: Honk!');
    }
}