// audio.js — AudioJS Library
// MIT License
// Web Audio API library for use in web games.
// Supports SFX (fire-and-forget) and Music (full playback controls),
// with volume management, smooth transitions, fade in/out, loop, pause/resume,
// pre-loading, and AudioContext resume handling.

export class AudioJS {
    constructor() {
        this._context = null;
        this._masterGain = null;
        this._musicGain = null;
        this._sfxGain = null;
        this._buffers = new Map();
        this._currentMusic = null;  // { source, name, gainNode, loop, paused, startOffset, startContextTime, pauseOffset }
        this._activeSFX = [];       // [{ source, name, gainNode }]
        this._masterVolume = 100;
        this._musicVolume = 100;
        this._sfxVolume = 100;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    _ensureContext() {
        if (this._context) return true;
        try {
            this._context = new (window.AudioContext || window.webkitAudioContext)();
            this._masterGain = this._context.createGain();
            this._musicGain  = this._context.createGain();
            this._sfxGain    = this._context.createGain();
            this._musicGain.connect(this._masterGain);
            this._sfxGain.connect(this._masterGain);
            this._masterGain.connect(this._context.destination);
            this._masterGain.gain.value = this._masterVolume / 100;
            this._musicGain.gain.value  = this._musicVolume  / 100;
            this._sfxGain.gain.value    = this._sfxVolume    / 100;
            return true;
        } catch (e) {
            alert('AudioJS: Failed to create AudioContext — ' + e.message);
            return false;
        }
    }

    // ─── Context ─────────────────────────────────────────────────────────────

    /**
     * Resume a suspended AudioContext (required after a user interaction on some browsers).
     * @returns {Promise<boolean>} true if context is running.
     */
    async resumeContext() {
        if (!this._ensureContext()) return false;
        if (this._context.state === 'suspended') {
            try {
                await this._context.resume();
            } catch (e) {
                alert('AudioJS: Failed to resume AudioContext — ' + e.message);
                return false;
            }
        }
        return true;
    }

    /** Returns the AudioContext state: 'running', 'suspended', 'closed', or 'not-initialized'. */
    getContextState() {
        return this._context ? this._context.state : 'not-initialized';
    }

    // ─── Loading ─────────────────────────────────────────────────────────────

    /**
     * Decode and store an audio file for later playback.
     * @param {string} name       Identifier used to reference this sound.
     * @param {ArrayBuffer} arrayBuffer  Raw audio data (MP3 or WAV).
     * @returns {Promise<boolean>} true on success.
     */
    async load(name, arrayBuffer) {
        if (!this._ensureContext()) return false;
        try {
            const buffer = await this._context.decodeAudioData(arrayBuffer);
            this._buffers.set(name, buffer);
            return true;
        } catch (e) {
            alert('AudioJS: Failed to decode "' + name + '" — ' + e.message);
            return false;
        }
    }

    /**
     * Unload a previously loaded sound, stopping it first if active.
     * @param {string} name  Sound identifier.
     */
    unload(name) {
        if (this._currentMusic && this._currentMusic.name === name) {
            this.stopMusic(0);
        }
        this._activeSFX
            .filter(s => s.name === name)
            .forEach(s => { try { s.source.stop(); } catch (_) {} });
        this._activeSFX = this._activeSFX.filter(s => s.name !== name);
        this._buffers.delete(name);
    }

    /** Returns true if the named sound is loaded. */
    isLoaded(name) {
        return this._buffers.has(name);
    }

    /** Returns an array of all currently loaded sound names. */
    getLoadedSounds() {
        return [...this._buffers.keys()];
    }

    // ─── SFX ─────────────────────────────────────────────────────────────────

    /**
     * Play a sound effect. Fire-and-forget, low-latency.
     * Multiple simultaneous instances are supported.
     * @param {string} name  Sound identifier (must be loaded).
     * @param {object} [options]
     * @param {boolean} [options.loop=false]  Loop the SFX.
     * @param {number}  [options.fadeIn=0]    Fade-in duration in seconds.
     * @returns {Promise<object|null>} A handle for stopping/fading this specific instance.
     */
    async playSFX(name, options = {}) {
        const { loop = false, fadeIn = 0 } = options;
        if (!this._buffers.has(name)) {
            alert('AudioJS: Sound "' + name + '" is not loaded');
            return null;
        }
        if (!this._ensureContext()) return null;
        await this.resumeContext();

        const source = this._context.createBufferSource();
        source.buffer = this._buffers.get(name);
        source.loop = loop;

        const gainNode = this._context.createGain();
        source.connect(gainNode);
        gainNode.connect(this._sfxGain);

        const now = this._context.currentTime;
        if (fadeIn > 0) {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(1, now + fadeIn);
        } else {
            gainNode.gain.value = 1;
        }

        const handle = { source, name, gainNode };
        this._activeSFX.push(handle);
        source.onended = () => {
            const i = this._activeSFX.indexOf(handle);
            if (i !== -1) this._activeSFX.splice(i, 1);
        };
        source.start();
        return handle;
    }

    /**
     * Stop all active instances of a named SFX.
     * @param {string} name  Sound identifier.
     */
    stopSFX(name) {
        this._activeSFX
            .filter(s => s.name === name)
            .forEach(s => { try { s.source.stop(); } catch (_) {} });
    }

    /**
     * Stop a specific SFX instance returned by playSFX().
     * @param {object} handle  Handle returned by playSFX().
     */
    stopSFXHandle(handle) {
        if (handle) try { handle.source.stop(); } catch (_) {}
    }

    /** Stop all currently playing SFX instances. */
    stopAllSFX() {
        [...this._activeSFX].forEach(s => { try { s.source.stop(); } catch (_) {} });
    }

    /**
     * Fade out a specific SFX instance then stop it.
     * @param {object} handle    Handle returned by playSFX().
     * @param {number} [duration=1]  Fade duration in seconds.
     */
    fadeOutSFX(handle, duration = 1) {
        if (!handle || !this._context) return;
        const now = this._context.currentTime;
        handle.gainNode.gain.setValueAtTime(handle.gainNode.gain.value, now);
        handle.gainNode.gain.linearRampToValueAtTime(0, now + duration);
        try { handle.source.stop(now + duration); } catch (_) {}
    }

    /** Returns the number of currently active (playing) SFX instances. */
    getActiveSFXCount() {
        return this._activeSFX.length;
    }

    // ─── Music ───────────────────────────────────────────────────────────────

    /**
     * Play a music track, stopping any currently playing music.
     * @param {string} name  Sound identifier (must be loaded).
     * @param {object} [options]
     * @param {boolean} [options.loop=true]   Loop the track.
     * @param {number}  [options.fadeIn=0]    Fade-in duration in seconds.
     */
    async playMusic(name, options = {}) {
        const { loop = true, fadeIn = 0 } = options;
        if (!this._buffers.has(name)) {
            alert('AudioJS: Sound "' + name + '" is not loaded');
            return;
        }
        if (!this._ensureContext()) return;
        await this.resumeContext();

        if (this._currentMusic) {
            const old = this._currentMusic;
            this._currentMusic = null;
            if (!old.paused) {
                try { old.source.stop(); } catch (_) {}
            }
        }

        const source = this._context.createBufferSource();
        source.buffer = this._buffers.get(name);
        source.loop = loop;

        const trackGain = this._context.createGain();
        source.connect(trackGain);
        trackGain.connect(this._musicGain);

        const now = this._context.currentTime;
        if (fadeIn > 0) {
            trackGain.gain.setValueAtTime(0, now);
            trackGain.gain.linearRampToValueAtTime(1, now + fadeIn);
        } else {
            trackGain.gain.value = 1;
        }

        this._currentMusic = {
            source, name, gainNode: trackGain,
            loop, paused: false,
            startOffset: 0,
            startContextTime: now,
            pauseOffset: 0,
        };

        source.start(0, 0);
        source.onended = () => {
            if (this._currentMusic && this._currentMusic.source === source) {
                this._currentMusic = null;
            }
        };
    }

    /**
     * Stop the currently playing music track.
     * @param {number} [fadeOut=0]  Fade-out duration in seconds before stopping.
     */
    stopMusic(fadeOut = 0) {
        if (!this._currentMusic) return;
        const music = this._currentMusic;
        this._currentMusic = null;
        if (fadeOut > 0 && this._context) {
            const now = this._context.currentTime;
            music.gainNode.gain.setValueAtTime(music.gainNode.gain.value, now);
            music.gainNode.gain.linearRampToValueAtTime(0, now + fadeOut);
            try { music.source.stop(now + fadeOut); } catch (_) {}
        } else {
            try { music.source.stop(); } catch (_) {}
        }
    }

    /**
     * Pause the currently playing music, remembering the playback position.
     * @returns {boolean} true if paused successfully.
     */
    pauseMusic() {
        if (!this._currentMusic || this._currentMusic.paused || !this._context) return false;
        const music = this._currentMusic;
        const buffer = this._buffers.get(music.name);
        if (!buffer) return false;
        const elapsed = this._context.currentTime - music.startContextTime;
        const rawOffset = music.startOffset + elapsed;
        music.pauseOffset = music.loop
            ? rawOffset % buffer.duration
            : Math.min(rawOffset, buffer.duration);
        try { music.source.stop(); } catch (_) {}
        music.paused = true;
        return true;
    }

    /**
     * Resume a paused music track from where it was paused.
     * @returns {boolean} true if resumed successfully.
     */
    resumeMusic() {
        if (!this._currentMusic || !this._currentMusic.paused || !this._context) return false;
        const music = this._currentMusic;
        const buffer = this._buffers.get(music.name);
        if (!buffer) return false;

        const source = this._context.createBufferSource();
        source.buffer = buffer;
        source.loop = music.loop;
        source.connect(music.gainNode);
        music.gainNode.gain.value = 1;

        const offset = music.pauseOffset || 0;
        const now = this._context.currentTime;
        music.source = source;
        music.startOffset = offset;
        music.startContextTime = now;
        music.paused = false;

        source.start(0, offset);
        source.onended = () => {
            if (this._currentMusic && this._currentMusic.source === source) {
                this._currentMusic = null;
            }
        };
        return true;
    }

    /**
     * Smoothly transition from the current music track to a new one.
     * The current track fades out while the new one fades in simultaneously.
     * @param {string} name              Sound identifier of the new track (must be loaded).
     * @param {number} [transitionTime=3]  Cross-fade duration in seconds (1–10).
     */
    async transitionTo(name, transitionTime = 3) {
        if (!this._buffers.has(name)) {
            alert('AudioJS: Sound "' + name + '" is not loaded');
            return;
        }
        if (!this._ensureContext()) return;
        await this.resumeContext();

        const now = this._context.currentTime;

        if (this._currentMusic) {
            const old = this._currentMusic;
            this._currentMusic = null;
            if (!old.paused) {
                old.gainNode.gain.setValueAtTime(old.gainNode.gain.value, now);
                old.gainNode.gain.linearRampToValueAtTime(0, now + transitionTime);
                try { old.source.stop(now + transitionTime); } catch (_) {}
            }
        }

        const buffer = this._buffers.get(name);
        const source = this._context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const trackGain = this._context.createGain();
        source.connect(trackGain);
        trackGain.connect(this._musicGain);

        trackGain.gain.setValueAtTime(0, now);
        trackGain.gain.linearRampToValueAtTime(1, now + transitionTime);

        this._currentMusic = {
            source, name, gainNode: trackGain,
            loop: true, paused: false,
            startOffset: 0,
            startContextTime: now,
            pauseOffset: 0,
        };

        source.start();
        source.onended = () => {
            if (this._currentMusic && this._currentMusic.source === source) {
                this._currentMusic = null;
            }
        };
    }

    // ─── Volume ───────────────────────────────────────────────────────────────

    /**
     * Set the master volume (affects all audio).
     * @param {number} volume  Value from 0 (silent) to 100 (full volume).
     */
    setMasterVolume(volume) {
        this._masterVolume = Math.max(0, Math.min(100, Number(volume)));
        if (this._masterGain) this._masterGain.gain.value = this._masterVolume / 100;
    }

    /**
     * Set the music volume (affects music tracks only).
     * @param {number} volume  Value from 0 to 100.
     */
    setMusicVolume(volume) {
        this._musicVolume = Math.max(0, Math.min(100, Number(volume)));
        if (this._musicGain) this._musicGain.gain.value = this._musicVolume / 100;
    }

    /**
     * Set the SFX volume (affects sound effects only).
     * @param {number} volume  Value from 0 to 100.
     */
    setSFXVolume(volume) {
        this._sfxVolume = Math.max(0, Math.min(100, Number(volume)));
        if (this._sfxGain) this._sfxGain.gain.value = this._sfxVolume / 100;
    }

    /** Returns the current master volume (0–100). */
    getMasterVolume() { return this._masterVolume; }

    /** Returns the current music volume (0–100). */
    getMusicVolume() { return this._musicVolume; }

    /** Returns the current SFX volume (0–100). */
    getSFXVolume() { return this._sfxVolume; }

    // ─── Status ───────────────────────────────────────────────────────────────

    /** Returns the name of the currently playing/paused music track, or null. */
    getCurrentMusicName() {
        return this._currentMusic ? this._currentMusic.name : null;
    }

    /** Returns true if music is currently playing (not paused). */
    isMusicPlaying() {
        return !!(this._currentMusic && !this._currentMusic.paused);
    }

    /** Returns true if music is currently paused. */
    isMusicPaused() {
        return !!(this._currentMusic && this._currentMusic.paused);
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    /**
     * Stop all audio, close the AudioContext, and release all resources.
     * After calling cleanup(), load() must be called again before playing.
     */
    cleanup() {
        this.stopAllSFX();
        this._activeSFX = [];
        if (this._currentMusic) {
            try { this._currentMusic.source.stop(); } catch (_) {}
            this._currentMusic = null;
        }
        if (this._context) {
            this._context.close().catch(() => {});
            this._context = null;
            this._masterGain = null;
            this._musicGain  = null;
            this._sfxGain    = null;
        }
        this._buffers.clear();
    }
}
