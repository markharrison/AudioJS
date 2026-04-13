/**
 * Test script for AudioJS library
 * Provides UI controls and logging for testing audio functionality
 */

import { AudioJS } from './audio.js';

// Global audio instance
let audio = null;

// Loaded files tracking
const loadedFiles = {
    music1: null,
    music2: null,
    sfx1: null,
    sfx2: null,
    sfx3: null
};

// Current transition duration
let transitionDuration = 2; // seconds

/**
 * Initialize the test interface
 */
function init() {
    audio = new AudioJS();

    // Setup event listeners
    setupEventListeners();

    // Initialize with user interaction
    document.getElementById('init-btn').addEventListener('click', async () => {
        try {
            await audio.init();
            log('AudioJS initialized successfully');
            updateStatus('Initialized');
        } catch (error) {
            log('Failed to initialize: ' + error.message, 'error');
        }
    });

    log('Test interface loaded. Click "Initialize AudioJS" to start.');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // File loaders
    setupFileLoader('music1');
    setupFileLoader('music2');
    setupFileLoader('sfx1');
    setupFileLoader('sfx2');
    setupFileLoader('sfx3');

    // Unload buttons
    document.getElementById('unload-music1').addEventListener('click', () => unloadFile('music1'));
    document.getElementById('unload-music2').addEventListener('click', () => unloadFile('music2'));
    document.getElementById('unload-sfx1').addEventListener('click', () => unloadFile('sfx1'));
    document.getElementById('unload-sfx2').addEventListener('click', () => unloadFile('sfx2'));
    document.getElementById('unload-sfx3').addEventListener('click', () => unloadFile('sfx3'));

    // Play buttons
    document.getElementById('play-music1').addEventListener('click', () => playMusic('music1'));
    document.getElementById('play-music2').addEventListener('click', () => playMusic('music2'));
    document.getElementById('play-sfx1').addEventListener('click', () => playSfx('sfx1'));
    document.getElementById('play-sfx2').addEventListener('click', () => playSfx('sfx2'));
    document.getElementById('play-sfx3').addEventListener('click', () => playSfx('sfx3'));

    // Control buttons
    document.getElementById('pause-music').addEventListener('click', pauseMusic);
    document.getElementById('resume-music').addEventListener('click', resumeMusic);
    document.getElementById('stop-music').addEventListener('click', stopMusic);
    document.getElementById('stop-all').addEventListener('click', stopAll);

    // Loop test
    document.getElementById('test-loop').addEventListener('click', testLoop);

    // Simultaneous play test
    document.getElementById('test-simultaneous').addEventListener('click', testSimultaneous);

    // Music transition
    document.getElementById('transition-1to2').addEventListener('click', () => transitionMusic('music1', 'music2'));
    document.getElementById('transition-2to1').addEventListener('click', () => transitionMusic('music2', 'music1'));

    // Transition duration slider
    const transitionSlider = document.getElementById('transition-duration');
    const transitionValue = document.getElementById('transition-value');
    transitionSlider.addEventListener('input', (e) => {
        transitionDuration = parseInt(e.target.value);
        transitionValue.textContent = transitionDuration + 's';
    });

    // Volume controls
    document.getElementById('master-volume').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        audio.setMasterVolume(value);
        document.getElementById('master-value').textContent = value;
        log('Master volume set to ' + value);
    });

    document.getElementById('music-volume').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        audio.setMusicVolume(value);
        document.getElementById('music-value').textContent = value;
        log('Music volume set to ' + value);
    });

    document.getElementById('sfx-volume').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        audio.setSfxVolume(value);
        document.getElementById('sfx-value').textContent = value;
        log('SFX volume set to ' + value);
    });

    // Cleanup
    document.getElementById('cleanup-btn').addEventListener('click', cleanup);

    // Clear log
    document.getElementById('clear-log').addEventListener('click', clearLog);
}

/**
 * Setup file loader for a specific audio slot
 */
function setupFileLoader(id) {
    const fileInput = document.getElementById('file-' + id);
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await loadFile(id, file);
        }
    });
}

/**
 * Load an audio file
 */
async function loadFile(id, file) {
    try {
        log('Loading ' + id + ': ' + file.name + '...');
        await audio.load(id, file);
        loadedFiles[id] = file.name;
        updateFileStatus(id, file.name, true);
        log(id + ' loaded successfully: ' + file.name, 'success');
    } catch (error) {
        log('Failed to load ' + id + ': ' + error.message, 'error');
        updateFileStatus(id, 'Failed', false);
    }
}

/**
 * Unload an audio file
 */
function unloadFile(id) {
    if (!loadedFiles[id]) {
        log(id + ' is not loaded', 'warning');
        return;
    }

    audio.unload(id);
    loadedFiles[id] = null;
    updateFileStatus(id, 'Not loaded', false);
    log(id + ' unloaded', 'info');

    // Clear file input
    document.getElementById('file-' + id).value = '';
}

/**
 * Play music
 */
function playMusic(id) {
    if (!loadedFiles[id]) {
        log(id + ' is not loaded', 'warning');
        return;
    }

    try {
        audio.playMusic(id, { loop: true, fadeIn: 0.5 });
        log('Playing ' + id + ' (looping, fade-in 0.5s)', 'info');
        updateStatus('Playing ' + id);
    } catch (error) {
        log('Failed to play ' + id + ': ' + error.message, 'error');
    }
}

/**
 * Play SFX
 */
function playSfx(id) {
    if (!loadedFiles[id]) {
        log(id + ' is not loaded', 'warning');
        return;
    }

    try {
        audio.playSfx(id);
        log('Playing SFX: ' + id, 'info');
    } catch (error) {
        log('Failed to play ' + id + ': ' + error.message, 'error');
    }
}

/**
 * Pause current music
 */
function pauseMusic() {
    if (audio.currentMusic) {
        audio.pause(audio.currentMusic.id);
        log('Music paused', 'info');
        updateStatus('Paused');
    } else {
        log('No music is currently playing', 'warning');
    }
}

/**
 * Resume paused music
 */
function resumeMusic() {
    if (audio.currentMusic) {
        audio.resume(audio.currentMusic.id);
        log('Music resumed', 'info');
        updateStatus('Playing');
    } else {
        log('No music to resume', 'warning');
    }
}

/**
 * Stop current music
 */
function stopMusic() {
    if (audio.currentMusic) {
        const musicId = audio.currentMusic.id;
        audio.stop(musicId);
        log('Stopped ' + musicId, 'info');
        updateStatus('Stopped');
    } else {
        log('No music is currently playing', 'warning');
    }
}

/**
 * Stop all audio
 */
function stopAll() {
    audio.stopAll();
    log('All audio stopped', 'info');
    updateStatus('All stopped');
}

/**
 * Test looping functionality
 */
function testLoop() {
    const musicId = loadedFiles.music1 ? 'music1' : (loadedFiles.music2 ? 'music2' : null);

    if (!musicId) {
        log('Load music1 or music2 first to test looping', 'warning');
        return;
    }

    try {
        audio.playMusic(musicId, { loop: true });
        log('Testing loop: Playing ' + musicId + ' with loop enabled', 'info');
        updateStatus('Loop test: ' + musicId);
    } catch (error) {
        log('Loop test failed: ' + error.message, 'error');
    }
}

/**
 * Test simultaneous playback
 */
function testSimultaneous() {
    const hasMusic = loadedFiles.music1 || loadedFiles.music2;
    const hasSfx = loadedFiles.sfx1 || loadedFiles.sfx2 || loadedFiles.sfx3;

    if (!hasMusic || !hasSfx) {
        log('Load at least one music file and one SFX to test simultaneous playback', 'warning');
        return;
    }

    log('Testing simultaneous playback...', 'info');

    // Play music
    if (loadedFiles.music1) {
        audio.playMusic('music1', { loop: true });
        log('Started music1', 'info');
    } else if (loadedFiles.music2) {
        audio.playMusic('music2', { loop: true });
        log('Started music2', 'info');
    }

    // Play SFX with delays
    setTimeout(() => {
        if (loadedFiles.sfx1) {
            audio.playSfx('sfx1');
            log('Played sfx1', 'info');
        }
    }, 500);

    setTimeout(() => {
        if (loadedFiles.sfx2) {
            audio.playSfx('sfx2');
            log('Played sfx2', 'info');
        }
    }, 1000);

    setTimeout(() => {
        if (loadedFiles.sfx3) {
            audio.playSfx('sfx3');
            log('Played sfx3', 'info');
        }
    }, 1500);

    updateStatus('Simultaneous playback test');
}

/**
 * Transition between music tracks
 */
function transitionMusic(fromId, toId) {
    if (!loadedFiles[toId]) {
        log(toId + ' is not loaded', 'warning');
        return;
    }

    try {
        const currentMusicId = audio.currentMusic ? audio.currentMusic.id : null;
        audio.transitionMusic(currentMusicId || fromId, toId, transitionDuration);
        log('Transitioning to ' + toId + ' over ' + transitionDuration + 's', 'info');
        updateStatus('Transitioning to ' + toId);
    } catch (error) {
        log('Transition failed: ' + error.message, 'error');
    }
}

/**
 * Cleanup audio resources
 */
function cleanup() {
    audio.cleanup();
    Object.keys(loadedFiles).forEach(key => {
        loadedFiles[key] = null;
        updateFileStatus(key, 'Not loaded', false);
        document.getElementById('file-' + key).value = '';
    });
    log('Audio resources cleaned up', 'info');
    updateStatus('Cleaned up');
}

/**
 * Update file status display
 */
function updateFileStatus(id, filename, loaded) {
    const statusEl = document.getElementById('status-' + id);
    if (statusEl) {
        statusEl.textContent = loaded ? '✓ ' + filename : filename;
        statusEl.className = 'file-status ' + (loaded ? 'loaded' : 'not-loaded');
    }
}

/**
 * Update playback status
 */
function updateStatus(status) {
    const statusEl = document.getElementById('playback-status');
    if (statusEl) {
        statusEl.textContent = status;
    }
}

/**
 * Log message to the action log
 */
function log(message, type = 'info') {
    const logContainer = document.getElementById('action-log');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry log-' + type;
    logEntry.textContent = '[' + timestamp + '] ' + message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Clear the action log
 */
function clearLog() {
    const logContainer = document.getElementById('action-log');
    logContainer.innerHTML = '';
    log('Log cleared');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
