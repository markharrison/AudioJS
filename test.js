// test.js — AudioJS Test Suite UI logic
// Imports AudioJS from audio.js and wires up all test-page interactions.

import { AudioJS } from './audio.js';

let audio = new AudioJS();
let musicLoop = false;
let loopSFXHandle = null;

// ─── Logging ─────────────────────────────────────────────────────────────────

function log(message, type = 'info') {
    const logEl = document.getElementById('actionLog');
    const entry = document.createElement('div');
    entry.className = 'log-entry log-' + type;
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = '[' + time + '.' + ms + ']';
    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = message;
    entry.appendChild(timeSpan);
    entry.appendChild(document.createTextNode(' '));
    entry.appendChild(msgSpan);
    logEl.prepend(entry);
    while (logEl.children.length > 150) {
        logEl.removeChild(logEl.lastChild);
    }
}

// ─── Status Updates ──────────────────────────────────────────────────────────

function updateStatus() {
    const state = audio.getContextState();
    const ctxEl = document.getElementById('contextStatus');
    ctxEl.textContent = state;
    ctxEl.className = 'status-badge status-' + state.replace('-', '_');

    const musicName = audio.getCurrentMusicName();
    const musicEl = document.getElementById('currentMusicStatus');
    if (musicName) {
        const paused = audio.isMusicPaused();
        musicEl.textContent = (paused ? '⏸ ' : '▶ ') + musicName;
        musicEl.className = 'status-badge ' + (paused ? 'status-paused' : 'status-playing');
    } else {
        musicEl.textContent = '—';
        musicEl.className = 'status-badge status-idle';
    }

    document.getElementById('activeSFXCount').textContent = audio.getActiveSFXCount();
}

function updateLoadedStatus() {
    ['music1', 'music2', 'sfx1', 'sfx2', 'sfx3'].forEach(name => {
        const dot = document.getElementById('loaded-' + name);
        if (dot) {
            const loaded = audio.isLoaded(name);
            dot.className = 'loaded-dot ' + (loaded ? 'loaded' : 'not-loaded');
            dot.title = loaded ? name + ' loaded ✓' : name + ' not loaded';
        }
    });
}

// ─── Context Controls ─────────────────────────────────────────────────────────

document.getElementById('btnInit').addEventListener('click', async () => {
    const ok = await audio.resumeContext();
    log(ok ? 'AudioContext initialized / resumed' : 'Failed to initialize AudioContext', ok ? 'success' : 'error');
    updateStatus();
});

document.getElementById('btnCleanup').addEventListener('click', () => {
    audio.cleanup();
    loopSFXHandle = null;
    document.getElementById('btnLoopSFX1').textContent = '🔁 Loop SFX1';
    document.getElementById('btnLoopSFX1').classList.remove('active');
    log('Cleanup complete — all audio stopped and resources released', 'info');
    updateStatus();
    updateLoadedStatus();
});

document.getElementById('btnReinit').addEventListener('click', () => {
    audio = new AudioJS();
    audio.setMasterVolume(parseInt(document.getElementById('masterVolSlider').value));
    audio.setMusicVolume(parseInt(document.getElementById('musicVolSlider').value));
    audio.setSFXVolume(parseInt(document.getElementById('sfxVolSlider').value));
    loopSFXHandle = null;
    musicLoop = false;
    const loopBtn = document.getElementById('btnToggleLoop');
    loopBtn.textContent = '🔁 Loop: OFF';
    loopBtn.classList.remove('active');
    document.getElementById('btnLoopSFX1').textContent = '🔁 Loop SFX1';
    document.getElementById('btnLoopSFX1').classList.remove('active');
    log('AudioJS reinitialized (new instance)', 'info');
    updateStatus();
    updateLoadedStatus();
});

// ─── File Loading ─────────────────────────────────────────────────────────────

async function handleLoad(name) {
    const fileInput = document.getElementById('file-' + name);
    const file = fileInput.files[0];
    if (!file) {
        log('Select a file for ' + name + ' first', 'warning');
        return;
    }
    log('Loading ' + name + ' ← ' + file.name + ' …', 'info');
    try {
        const arrayBuffer = await file.arrayBuffer();
        const ok = await audio.load(name, arrayBuffer);
        if (ok) {
            log('Loaded "' + name + '" ← ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)', 'success');
        } else {
            log('Failed to load "' + name + '"', 'error');
        }
    } catch (e) {
        log('Error loading "' + name + '": ' + e.message, 'error');
    }
    updateLoadedStatus();
    updateStatus();
}

function handleUnload(name) {
    audio.unload(name);
    log('Unloaded "' + name + '"', 'info');
    updateLoadedStatus();
    updateStatus();
}

['music1', 'music2', 'sfx1', 'sfx2', 'sfx3'].forEach(name => {
    document.getElementById('btn-load-' + name).addEventListener('click', () => handleLoad(name));
    document.getElementById('btn-unload-' + name).addEventListener('click', () => handleUnload(name));
});

// ─── Music Player ─────────────────────────────────────────────────────────────

document.getElementById('btnPlayMusic1').addEventListener('click', async () => {
    const fadeIn = parseFloat(document.getElementById('fadeInTime').value) || 0;
    await audio.playMusic('music1', { loop: musicLoop, fadeIn });
    log('Playing music1' + (musicLoop ? ' [loop]' : '') + (fadeIn > 0 ? ' [fade-in ' + fadeIn + 's]' : ''), 'success');
    updateStatus();
});

document.getElementById('btnPlayMusic2').addEventListener('click', async () => {
    const fadeIn = parseFloat(document.getElementById('fadeInTime').value) || 0;
    await audio.playMusic('music2', { loop: musicLoop, fadeIn });
    log('Playing music2' + (musicLoop ? ' [loop]' : '') + (fadeIn > 0 ? ' [fade-in ' + fadeIn + 's]' : ''), 'success');
    updateStatus();
});

document.getElementById('btnPauseMusic').addEventListener('click', () => {
    if (audio.pauseMusic()) {
        log('Music paused', 'info');
    } else {
        log('Nothing to pause (music not playing or already paused)', 'warning');
    }
    updateStatus();
});

document.getElementById('btnResumeMusic').addEventListener('click', () => {
    if (audio.resumeMusic()) {
        log('Music resumed', 'success');
    } else {
        log('Nothing to resume (music not paused)', 'warning');
    }
    updateStatus();
});

document.getElementById('btnStopMusic').addEventListener('click', () => {
    const fadeOut = parseFloat(document.getElementById('fadeOutTime').value) || 0;
    audio.stopMusic(fadeOut);
    log('Music stopped' + (fadeOut > 0 ? ' [fade-out ' + fadeOut + 's]' : ''), 'info');
    updateStatus();
});

document.getElementById('btnToggleLoop').addEventListener('click', () => {
    musicLoop = !musicLoop;
    const btn = document.getElementById('btnToggleLoop');
    btn.textContent = '🔁 Loop: ' + (musicLoop ? 'ON' : 'OFF');
    btn.classList.toggle('active', musicLoop);
    log('Music loop: ' + (musicLoop ? 'ON' : 'OFF'), 'info');
});

// ─── Transition ───────────────────────────────────────────────────────────────

document.getElementById('btnTransition').addEventListener('click', async () => {
    const target = document.querySelector('input[name="transitionTarget"]:checked');
    if (!target) {
        log('Select a transition target (Music 1 or Music 2)', 'warning');
        return;
    }
    const time = Math.max(1, Math.min(10, parseFloat(document.getElementById('transitionTime').value) || 3));
    await audio.transitionTo(target.value, time);
    log('Transitioning to ' + target.value + ' over ' + time + 's', 'success');
    updateStatus();
});

// ─── Sound Effects ────────────────────────────────────────────────────────────

async function playSFX(name) {
    const fadeIn = parseFloat(document.getElementById('sfxFadeIn').value) || 0;
    const handle = await audio.playSFX(name, { fadeIn });
    if (handle) {
        log('Playing SFX: ' + name + (fadeIn > 0 ? ' [fade-in ' + fadeIn + 's]' : ''), 'success');
    }
    updateStatus();
    return handle;
}

['sfx1', 'sfx2', 'sfx3'].forEach(name => {
    document.getElementById('btn-play-' + name).addEventListener('click', () => playSFX(name));
    document.getElementById('btn-stop-' + name).addEventListener('click', () => {
        audio.stopSFX(name);
        log('Stopped all instances of: ' + name, 'info');
        updateStatus();
    });
});

document.getElementById('btnPlayAllSFX').addEventListener('click', async () => {
    const loaded = ['sfx1', 'sfx2', 'sfx3'].filter(n => audio.isLoaded(n));
    if (loaded.length === 0) {
        log('No SFX loaded — load at least one SFX file first', 'warning');
        return;
    }
    await Promise.all(loaded.map(n => audio.playSFX(n)));
    log('Playing simultaneously: ' + loaded.join(', '), 'success');
    updateStatus();
});

document.getElementById('btnLoopSFX1').addEventListener('click', async () => {
    const btn = document.getElementById('btnLoopSFX1');
    if (loopSFXHandle) {
        audio.stopSFXHandle(loopSFXHandle);
        loopSFXHandle = null;
        btn.textContent = '🔁 Loop SFX1';
        btn.classList.remove('active');
        log('Stopped looping sfx1', 'info');
    } else {
        loopSFXHandle = await audio.playSFX('sfx1', { loop: true });
        if (loopSFXHandle) {
            btn.textContent = '⏹ Stop SFX1 Loop';
            btn.classList.add('active');
            log('Looping sfx1 (indefinitely)', 'success');
        }
    }
    updateStatus();
});

document.getElementById('btnStopAllSFX').addEventListener('click', () => {
    audio.stopAllSFX();
    loopSFXHandle = null;
    document.getElementById('btnLoopSFX1').textContent = '🔁 Loop SFX1';
    document.getElementById('btnLoopSFX1').classList.remove('active');
    log('Stopped all active SFX', 'info');
    updateStatus();
});

// ─── Volume Controls ─────────────────────────────────────────────────────────

function setupVolume(sliderId, labelId, setter) {
    const slider = document.getElementById(sliderId);
    const label  = document.getElementById(labelId);
    slider.addEventListener('input', () => {
        const v = parseInt(slider.value);
        label.textContent = v;
        setter(v);
    });
}

setupVolume('masterVolSlider', 'masterVolLabel', v => audio.setMasterVolume(v));
setupVolume('musicVolSlider',  'musicVolLabel',  v => audio.setMusicVolume(v));
setupVolume('sfxVolSlider',    'sfxVolLabel',    v => audio.setSFXVolume(v));

// ─── Log Controls ────────────────────────────────────────────────────────────

document.getElementById('btnClearLog').addEventListener('click', () => {
    document.getElementById('actionLog').replaceChildren();
    log('Log cleared', 'info');
});

// ─── Periodic Status Poll ─────────────────────────────────────────────────────

setInterval(updateStatus, 500);

// ─── Init ─────────────────────────────────────────────────────────────────────

log('AudioJS Test Suite ready — click "Init / Resume" to start, then load audio files', 'info');
updateStatus();
updateLoadedStatus();
