# AudioJS - Detailed Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [Browser Compatibility](#browser-compatibility)
8. [Troubleshooting](#troubleshooting)

## Introduction

AudioJS is a lightweight JavaScript library built on the Web Audio API, designed specifically for simple web games. It provides an easy-to-use interface for playing background music and sound effects with full control over volume, looping, fading, and smooth transitions.

### Features

- **Web Audio API**: Built on modern Web Audio API (no fallback needed)
- **Dual Audio Types**: Support for both Music (long, looping tracks) and SFX (short, fire-and-forget sounds)
- **Simultaneous Playback**: Play multiple sounds at the same time
- **Volume Control**: Separate volume controls for master, music, and SFX
- **Pre-loading**: Load and unload audio files as needed
- **Format Support**: MP3 and WAV formats
- **Advanced Features**: Fade in/out, looping, pause/resume, smooth music transitions
- **Browser Policy Handling**: Automatic handling of browser autoplay restrictions

## Installation

AudioJS is a single JavaScript file with no dependencies. Simply include it in your project:

```html
<script type="module" src="audio.js"></script>
```

Or in your JavaScript module:

```javascript
import { AudioJS } from './audio.js';
```

## Getting Started

### Basic Setup

```javascript
import { AudioJS } from './audio.js';

// Create an instance
const audio = new AudioJS();

// Initialize (must be called after user interaction)
document.getElementById('start-button').addEventListener('click', async () => {
    await audio.init();
    console.log('AudioJS initialized!');
});
```

### Loading Audio Files

AudioJS can load audio from URLs or File objects:

```javascript
// Load from URL
await audio.load('background-music', '/assets/music/background.mp3');
await audio.load('coin-sound', '/assets/sfx/coin.wav');

// Load from File object (e.g., from file input)
const fileInput = document.getElementById('audio-file');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    await audio.load('user-music', file);
});
```

### Playing Audio

```javascript
// Play background music (looping by default)
audio.playMusic('background-music', { loop: true });

// Play sound effect (fire and forget)
audio.playSfx('coin-sound');
```

## API Reference

### Constructor

#### `new AudioJS()`

Creates a new AudioJS instance.

```javascript
const audio = new AudioJS();
```

### Initialization Methods

#### `async init()`

Initializes the Web Audio API context and gain nodes. Must be called after user interaction due to browser autoplay policies.

**Returns:** `Promise<void>`

**Example:**
```javascript
await audio.init();
```

#### `async resume()`

Resumes the audio context if it's suspended. Useful for handling browser autoplay restrictions.

**Returns:** `Promise<void>`

**Example:**
```javascript
await audio.resume();
```

### Loading Methods

#### `async load(id, source)`

Loads an audio file and stores it in memory.

**Parameters:**
- `id` (string): Unique identifier for this audio
- `source` (string | File): URL string or File object

**Returns:** `Promise<void>`

**Example:**
```javascript
await audio.load('bgm-1', '/music/background1.mp3');
await audio.load('sfx-jump', fileObject);
```

#### `unload(id)`

Unloads an audio file from memory and stops any playing instances.

**Parameters:**
- `id` (string): Identifier of audio to unload

**Example:**
```javascript
audio.unload('bgm-1');
```

### Playback Methods

#### `playSfx(id, options)`

Plays a sound effect. SFX are fire-and-forget with low latency, ideal for short sounds that may be triggered frequently.

**Parameters:**
- `id` (string): Audio identifier
- `options` (object, optional):
  - `loop` (boolean): Whether to loop (default: false)
  - `fadeIn` (number): Fade-in duration in seconds

**Returns:** `string` - Instance ID for this playback

**Example:**
```javascript
audio.playSfx('explosion');
audio.playSfx('gunshot', { fadeIn: 0.1 });
audio.playSfx('engine', { loop: true });
```

#### `playMusic(id, options)`

Plays music with full playback control. Music tracks are typically longer and have loop enabled by default.

**Parameters:**
- `id` (string): Audio identifier
- `options` (object, optional):
  - `loop` (boolean): Whether to loop (default: true)
  - `fadeIn` (number): Fade-in duration in seconds
  - `startTime` (number): Start position in seconds

**Returns:** `string` - Audio ID

**Example:**
```javascript
audio.playMusic('background-music');
audio.playMusic('boss-theme', { loop: true, fadeIn: 2 });
audio.playMusic('menu-music', { loop: true, startTime: 10 });
```

#### `async transitionMusic(fromId, toId, duration)`

Smoothly transitions from one music track to another with crossfade.

**Parameters:**
- `fromId` (string): Current music ID (can be null)
- `toId` (string): New music ID to transition to
- `duration` (number): Transition duration in seconds (default: 2)

**Returns:** `Promise<void>`

**Example:**
```javascript
await audio.transitionMusic('menu-music', 'game-music', 3);
await audio.transitionMusic(null, 'boss-music', 2);
```

### Control Methods

#### `pause(id)`

Pauses playback. Note: Due to Web Audio API limitations, pause is implemented by stopping and remembering the position.

**Parameters:**
- `id` (string): Audio identifier

**Example:**
```javascript
audio.pause('background-music');
```

#### `resume(id)`

Resumes paused playback from the paused position.

**Parameters:**
- `id` (string): Audio identifier

**Example:**
```javascript
audio.resume('background-music');
```

#### `stop(id)`

Stops playback with a quick fade-out to avoid clicks.

**Parameters:**
- `id` (string): Audio identifier or instance ID

**Example:**
```javascript
audio.stop('background-music');
```

#### `stopAll()`

Stops all currently playing audio.

**Example:**
```javascript
audio.stopAll();
```

#### `fadeOut(id, duration)`

Fades out and stops audio over the specified duration.

**Parameters:**
- `id` (string): Audio identifier
- `duration` (number): Fade duration in seconds (default: 1)

**Example:**
```javascript
audio.fadeOut('background-music', 2);
```

### Volume Methods

All volume methods accept values from 0 (muted) to 100 (full volume).

#### `setMasterVolume(volume)`

Sets the master volume, affecting all audio.

**Parameters:**
- `volume` (number): Volume level 0-100

**Example:**
```javascript
audio.setMasterVolume(80);
```

#### `setMusicVolume(volume)`

Sets the music volume.

**Parameters:**
- `volume` (number): Volume level 0-100

**Example:**
```javascript
audio.setMusicVolume(60);
```

#### `setSfxVolume(volume)`

Sets the sound effects volume.

**Parameters:**
- `volume` (number): Volume level 0-100

**Example:**
```javascript
audio.setSfxVolume(90);
```

#### `getMasterVolume()`

Returns the current master volume (0-100).

#### `getMusicVolume()`

Returns the current music volume (0-100).

#### `getSfxVolume()`

Returns the current SFX volume (0-100).

### Utility Methods

#### `isLoaded(id)`

Checks if an audio file is loaded.

**Parameters:**
- `id` (string): Audio identifier

**Returns:** `boolean`

**Example:**
```javascript
if (audio.isLoaded('background-music')) {
    audio.playMusic('background-music');
}
```

#### `isPlaying(id)`

Checks if audio is currently playing.

**Parameters:**
- `id` (string): Audio identifier

**Returns:** `boolean`

**Example:**
```javascript
if (!audio.isPlaying('background-music')) {
    audio.playMusic('background-music');
}
```

#### `cleanup()`

Cleans up all resources, closes the audio context, and clears all loaded audio. Call this when you're done using the library.

**Example:**
```javascript
audio.cleanup();
```

## Examples

### Complete Game Example

```javascript
import { AudioJS } from './audio.js';

class Game {
    constructor() {
        this.audio = new AudioJS();
        this.initialized = false;
    }

    async start() {
        // Initialize audio on user interaction
        await this.audio.init();
        this.initialized = true;

        // Load game audio
        await this.loadAudio();

        // Start background music
        this.audio.playMusic('menu-music', { loop: true, fadeIn: 1 });

        // Set preferred volumes
        this.audio.setMasterVolume(80);
        this.audio.setMusicVolume(70);
        this.audio.setSfxVolume(100);
    }

    async loadAudio() {
        // Load music
        await this.audio.load('menu-music', '/audio/music/menu.mp3');
        await this.audio.load('game-music', '/audio/music/game.mp3');
        await this.audio.load('boss-music', '/audio/music/boss.mp3');

        // Load SFX
        await this.audio.load('jump', '/audio/sfx/jump.wav');
        await this.audio.load('coin', '/audio/sfx/coin.wav');
        await this.audio.load('powerup', '/audio/sfx/powerup.wav');
        await this.audio.load('explosion', '/audio/sfx/explosion.wav');
    }

    startLevel() {
        // Transition from menu to game music
        this.audio.transitionMusic('menu-music', 'game-music', 2);
    }

    startBossFight() {
        // Transition to boss music with longer fade
        this.audio.transitionMusic('game-music', 'boss-music', 3);
    }

    playerJump() {
        this.audio.playSfx('jump');
    }

    collectCoin() {
        this.audio.playSfx('coin');
    }

    collectPowerup() {
        this.audio.playSfx('powerup', { fadeIn: 0.2 });
    }

    gameOver() {
        // Fade out music
        this.audio.fadeOut('game-music', 2);

        // Play explosion
        this.audio.playSfx('explosion');
    }

    pause() {
        if (this.audio.currentMusic) {
            this.audio.pause(this.audio.currentMusic.id);
        }
    }

    resume() {
        if (this.audio.currentMusic) {
            this.audio.resume(this.audio.currentMusic.id);
        }
    }

    cleanup() {
        this.audio.cleanup();
    }
}

// Usage
const game = new Game();

document.getElementById('start-game').addEventListener('click', async () => {
    await game.start();
});
```

### Handling Browser Autoplay Policies

Modern browsers restrict audio playback until user interaction. Here's how to handle it:

```javascript
import { AudioJS } from './audio.js';

const audio = new AudioJS();
let audioInitialized = false;

// Initialize on first user interaction
document.addEventListener('click', async () => {
    if (!audioInitialized) {
        try {
            await audio.init();
            await audio.resume(); // Resume if suspended
            audioInitialized = true;
            console.log('Audio ready!');
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }
}, { once: true });
```

### Loading Audio with Progress

```javascript
async function loadGameAudio(audio, progressCallback) {
    const audioFiles = [
        { id: 'music1', url: '/audio/music1.mp3' },
        { id: 'music2', url: '/audio/music2.mp3' },
        { id: 'sfx1', url: '/audio/sfx1.wav' },
        { id: 'sfx2', url: '/audio/sfx2.wav' }
    ];

    let loaded = 0;

    for (const file of audioFiles) {
        await audio.load(file.id, file.url);
        loaded++;
        progressCallback(loaded / audioFiles.length * 100);
    }
}

// Usage
await loadGameAudio(audio, (progress) => {
    console.log(`Loading: ${progress}%`);
});
```

### Dynamic Volume Control

```javascript
// Create volume settings UI
function createVolumeControls(audio) {
    const masterSlider = document.getElementById('master-volume');
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');

    masterSlider.addEventListener('input', (e) => {
        audio.setMasterVolume(parseInt(e.target.value));
        // Save to localStorage
        localStorage.setItem('masterVolume', e.target.value);
    });

    musicSlider.addEventListener('input', (e) => {
        audio.setMusicVolume(parseInt(e.target.value));
        localStorage.setItem('musicVolume', e.target.value);
    });

    sfxSlider.addEventListener('input', (e) => {
        audio.setSfxVolume(parseInt(e.target.value));
        localStorage.setItem('sfxVolume', e.target.value);
    });

    // Load saved volumes
    const savedMaster = localStorage.getItem('masterVolume');
    const savedMusic = localStorage.getItem('musicVolume');
    const savedSfx = localStorage.getItem('sfxVolume');

    if (savedMaster) audio.setMasterVolume(parseInt(savedMaster));
    if (savedMusic) audio.setMusicVolume(parseInt(savedMusic));
    if (savedSfx) audio.setSfxVolume(parseInt(savedSfx));
}
```

## Best Practices

### 1. Always Initialize After User Interaction

Due to browser autoplay policies, always call `init()` after a user interaction:

```javascript
document.getElementById('play-button').addEventListener('click', async () => {
    await audio.init();
    // Now you can play audio
});
```

### 2. Pre-load Audio Files

Load audio files during loading screens or initialization, not during gameplay:

```javascript
// Good: Load during initialization
async function initialize() {
    await audio.init();
    await audio.load('jump', '/audio/jump.wav');
    await audio.load('coin', '/audio/coin.wav');
}

// Bad: Loading during gameplay (causes lag)
function collectCoin() {
    await audio.load('coin', '/audio/coin.wav'); // Don't do this!
    audio.playSfx('coin');
}
```

### 3. Use Appropriate Audio Types

- **Use `playSfx()` for**: Short sounds, UI feedback, collision sounds, frequent sounds
- **Use `playMusic()` for**: Background music, ambient sounds, long looping tracks

### 4. Handle Errors Gracefully

AudioJS displays errors using `alert()`, but you can wrap calls in try-catch for custom error handling:

```javascript
try {
    await audio.load('background', '/audio/bg.mp3');
} catch (error) {
    // Custom error handling
    showErrorMessage('Failed to load background music');
}
```

### 5. Clean Up Resources

Always call `cleanup()` when you're done (e.g., when leaving the game):

```javascript
window.addEventListener('beforeunload', () => {
    audio.cleanup();
});
```

### 6. Optimize File Sizes

- Use MP3 for music (smaller file size, good quality)
- Use WAV for short SFX (better for looping, no compression artifacts)
- Keep SFX files as short as possible

### 7. Use Transitions for Music Changes

Instead of abruptly stopping and starting music, use smooth transitions:

```javascript
// Bad: Abrupt change
audio.stop('menu-music');
audio.playMusic('game-music');

// Good: Smooth transition
audio.transitionMusic('menu-music', 'game-music', 2);
```

## Browser Compatibility

AudioJS requires the Web Audio API, which is supported in:

- ✅ Microsoft Edge (all versions)
- ✅ Google Chrome 35+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Opera 22+

**Note:** Internet Explorer is not supported as it doesn't have Web Audio API.

## Troubleshooting

### Audio Won't Play

**Problem:** Audio doesn't play when calling `playMusic()` or `playSfx()`

**Solutions:**
1. Ensure `init()` was called after user interaction
2. Check that the audio file was loaded successfully
3. Try calling `resume()` to resume suspended audio context
4. Check browser console for errors

```javascript
// Debug helper
if (!audio.isLoaded('music')) {
    console.error('Music not loaded!');
}

if (!audio.initialized) {
    console.error('AudioJS not initialized!');
}
```

### Choppy or Laggy Audio

**Problem:** Audio playback is choppy or has lag

**Solutions:**
1. Pre-load all audio files before gameplay
2. Use smaller audio files
3. Reduce the number of simultaneous sounds
4. Use MP3 instead of WAV for large files

### Pause/Resume Not Working as Expected

**Problem:** Pause and resume don't maintain exact playback position

**Note:** Due to Web Audio API limitations, pause/resume is implemented by stopping and recreating the source. This may not be frame-perfect but should be sufficient for most game use cases.

**Alternative:** For music, consider using smooth transitions instead of pause/resume.

### Volume Changes Don't Take Effect

**Problem:** Changing volume doesn't affect audio

**Solutions:**
1. Ensure `init()` was called first
2. Check that values are between 0 and 100
3. Verify that master volume isn't set to 0

```javascript
console.log('Master:', audio.getMasterVolume());
console.log('Music:', audio.getMusicVolume());
console.log('SFX:', audio.getSfxVolume());
```

### Memory Leaks

**Problem:** Memory usage grows over time

**Solutions:**
1. Call `unload()` for audio files no longer needed
2. Call `cleanup()` when done with the library
3. Don't create multiple AudioJS instances unnecessarily

```javascript
// Clean up unused audio
audio.unload('old-music');

// Clean up everything when done
audio.cleanup();
```

## License

AudioJS is released under the MIT License. See LICENSE file for details.

## Support

For issues, questions, or contributions, please visit the project repository.
