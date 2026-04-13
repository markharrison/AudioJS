/**
 * AudioJS - A simple Web Audio API library for web games
 * License: MIT
 *
 * Supports playing SFX and music with volume control, looping, fading, and transitions.
 */

export class AudioJS {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        // Volume levels (0-100)
        this.masterVolume = 100;
        this.musicVolume = 100;
        this.sfxVolume = 100;

        // Store loaded audio buffers
        this.audioBuffers = new Map();

        // Store active sources for control
        this.activeSources = new Map();

        // Store active music info
        this.currentMusic = null;

        this.initialized = false;
    }

    /**
     * Initialize the audio context and gain nodes
     * Must be called after user interaction due to browser policies
     */
    async init() {
        try {
            if (this.initialized) {
                return;
            }

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();

            // Connect gain nodes: music/sfx -> master -> destination
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            // Set initial volumes
            this.setMasterVolume(this.masterVolume);
            this.setMusicVolume(this.musicVolume);
            this.setSfxVolume(this.sfxVolume);

            this.initialized = true;

            // Resume context if suspended (handle browser autoplay policies)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            alert('Failed to initialize audio: ' + error.message);
            throw error;
        }
    }

    /**
     * Resume audio context (call this on user interaction if needed)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                alert('Failed to resume audio context: ' + error.message);
            }
        }
    }

    /**
     * Load an audio file from URL or File object
     * @param {string} id - Unique identifier for this audio
     * @param {string|File} source - URL string or File object
     */
    async load(id, source) {
        try {
            if (!this.initialized) {
                await this.init();
            }

            let arrayBuffer;

            if (source instanceof File) {
                // Load from File object
                arrayBuffer = await source.arrayBuffer();
            } else {
                // Load from URL
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error('Failed to fetch audio file: ' + response.statusText);
                }
                arrayBuffer = await response.arrayBuffer();
            }

            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(id, audioBuffer);

        } catch (error) {
            alert('Failed to load audio "' + id + '": ' + error.message);
            throw error;
        }
    }

    /**
     * Unload an audio file
     * @param {string} id - Identifier of audio to unload
     */
    unload(id) {
        // Stop any playing instances first
        this.stop(id);

        // Remove from buffers
        this.audioBuffers.delete(id);
    }

    /**
     * Play SFX (fire and forget, low latency)
     * @param {string} id - Audio identifier
     * @param {object} options - Playback options
     */
    playSfx(id, options = {}) {
        try {
            if (!this.audioBuffers.has(id)) {
                throw new Error('Audio "' + id + '" not loaded');
            }

            const buffer = this.audioBuffers.get(id);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Create gain node for this instance
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.0;

            // Connect: source -> gain -> sfxGain
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);

            // Set looping
            source.loop = options.loop || false;

            // Handle fade-in
            if (options.fadeIn) {
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(1.0, this.audioContext.currentTime + options.fadeIn);
            }

            // Start playback
            source.start(0);

            // Store reference with unique key
            const instanceId = id + '_' + Date.now() + '_' + Math.random();
            this.activeSources.set(instanceId, {
                source: source,
                gainNode: gainNode,
                type: 'sfx',
                id: id,
                startTime: this.audioContext.currentTime
            });

            // Auto-cleanup when finished (if not looping)
            if (!source.loop) {
                source.onended = () => {
                    this.activeSources.delete(instanceId);
                };
            }

            return instanceId;

        } catch (error) {
            alert('Failed to play SFX "' + id + '": ' + error.message);
            throw error;
        }
    }

    /**
     * Play music (with full control)
     * @param {string} id - Audio identifier
     * @param {object} options - Playback options
     */
    playMusic(id, options = {}) {
        try {
            if (!this.audioBuffers.has(id)) {
                throw new Error('Audio "' + id + '" not loaded');
            }

            const buffer = this.audioBuffers.get(id);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Create gain node for this instance
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.0;

            // Connect: source -> gain -> musicGain
            source.connect(gainNode);
            gainNode.connect(this.musicGain);

            // Set looping
            source.loop = options.loop !== undefined ? options.loop : true;

            // Handle fade-in
            if (options.fadeIn) {
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(1.0, this.audioContext.currentTime + options.fadeIn);
            }

            // Start playback
            const startTime = options.startTime || 0;
            source.start(0, startTime);

            // Store reference
            this.currentMusic = {
                source: source,
                gainNode: gainNode,
                type: 'music',
                id: id,
                startTime: this.audioContext.currentTime,
                paused: false,
                pausedAt: 0
            };

            this.activeSources.set(id, this.currentMusic);

            // Auto-cleanup when finished (if not looping)
            if (!source.loop) {
                source.onended = () => {
                    if (this.currentMusic && this.currentMusic.id === id) {
                        this.currentMusic = null;
                    }
                    this.activeSources.delete(id);
                };
            }

            return id;

        } catch (error) {
            alert('Failed to play music "' + id + '": ' + error.message);
            throw error;
        }
    }

    /**
     * Transition from one music track to another with crossfade
     * @param {string} fromId - Current music ID
     * @param {string} toId - New music ID
     * @param {number} duration - Transition duration in seconds (default: 2)
     */
    async transitionMusic(fromId, toId, duration = 2) {
        try {
            if (!this.audioBuffers.has(toId)) {
                throw new Error('Audio "' + toId + '" not loaded');
            }

            const currentTime = this.audioContext.currentTime;

            // Fade out current music if playing
            if (fromId && this.activeSources.has(fromId)) {
                const currentMusic = this.activeSources.get(fromId);
                currentMusic.gainNode.gain.setValueAtTime(
                    currentMusic.gainNode.gain.value,
                    currentTime
                );
                currentMusic.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

                // Stop after fade out
                setTimeout(() => {
                    this.stop(fromId);
                }, duration * 1000);
            }

            // Start new music with fade in
            this.playMusic(toId, {
                fadeIn: duration,
                loop: true
            });

        } catch (error) {
            alert('Failed to transition music: ' + error.message);
            throw error;
        }
    }

    /**
     * Pause playback
     * @param {string} id - Audio identifier
     */
    pause(id) {
        if (!this.activeSources.has(id)) {
            return;
        }

        const audioInfo = this.activeSources.get(id);

        if (audioInfo.paused) {
            return; // Already paused
        }

        // Web Audio API doesn't support pause/resume directly
        // We need to stop and remember position
        audioInfo.pausedAt = this.audioContext.currentTime - audioInfo.startTime;
        audioInfo.paused = true;

        audioInfo.source.stop();
    }

    /**
     * Resume playback
     * @param {string} id - Audio identifier
     */
    resume(id) {
        if (!this.activeSources.has(id)) {
            return;
        }

        const audioInfo = this.activeSources.get(id);

        if (!audioInfo.paused) {
            return; // Not paused
        }

        // Recreate source and continue from paused position
        if (audioInfo.type === 'music') {
            this.playMusic(id, {
                startTime: audioInfo.pausedAt,
                loop: audioInfo.source.loop
            });
        }
    }

    /**
     * Stop playback
     * @param {string} id - Audio identifier (or instance ID for SFX)
     */
    stop(id) {
        // Try to find and stop all matching sources
        const toDelete = [];

        for (const [key, audioInfo] of this.activeSources.entries()) {
            if (key === id || key.startsWith(id + '_') || audioInfo.id === id) {
                try {
                    // Fade out quickly to avoid clicks
                    const currentTime = this.audioContext.currentTime;
                    audioInfo.gainNode.gain.setValueAtTime(audioInfo.gainNode.gain.value, currentTime);
                    audioInfo.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);

                    // Stop after fade
                    setTimeout(() => {
                        try {
                            audioInfo.source.stop();
                        } catch (e) {
                            // Source might already be stopped
                        }
                    }, 60);

                    toDelete.push(key);
                } catch (error) {
                    // Source might already be stopped
                }
            }
        }

        // Clean up references
        toDelete.forEach(key => {
            if (this.currentMusic && this.activeSources.get(key) === this.currentMusic) {
                this.currentMusic = null;
            }
            this.activeSources.delete(key);
        });
    }

    /**
     * Stop all playback
     */
    stopAll() {
        for (const [key, audioInfo] of this.activeSources.entries()) {
            try {
                audioInfo.source.stop();
            } catch (error) {
                // Source might already be stopped
            }
        }

        this.activeSources.clear();
        this.currentMusic = null;
    }

    /**
     * Fade out and stop
     * @param {string} id - Audio identifier
     * @param {number} duration - Fade duration in seconds
     */
    fadeOut(id, duration = 1) {
        if (!this.activeSources.has(id)) {
            return;
        }

        const audioInfo = this.activeSources.get(id);
        const currentTime = this.audioContext.currentTime;

        audioInfo.gainNode.gain.setValueAtTime(audioInfo.gainNode.gain.value, currentTime);
        audioInfo.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

        setTimeout(() => {
            this.stop(id);
        }, duration * 1000);
    }

    /**
     * Set master volume (0-100)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(100, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume / 100;
        }
    }

    /**
     * Set music volume (0-100)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(100, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume / 100;
        }
    }

    /**
     * Set SFX volume (0-100)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(100, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume / 100;
        }
    }

    /**
     * Get master volume (0-100)
     */
    getMasterVolume() {
        return this.masterVolume;
    }

    /**
     * Get music volume (0-100)
     */
    getMusicVolume() {
        return this.musicVolume;
    }

    /**
     * Get SFX volume (0-100)
     */
    getSfxVolume() {
        return this.sfxVolume;
    }

    /**
     * Check if audio is loaded
     */
    isLoaded(id) {
        return this.audioBuffers.has(id);
    }

    /**
     * Check if audio is playing
     */
    isPlaying(id) {
        return this.activeSources.has(id);
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stopAll();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.audioBuffers.clear();
        this.initialized = false;
    }
}
