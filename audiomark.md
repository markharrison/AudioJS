# AudioJS — API Reference

AudioJS is a lightweight JavaScript library for Web Audio in browser-based games.
It wraps the Web Audio API and provides a simple, unified interface for playing
**Sound Effects (SFX)** and **Music** with full playback controls, smooth transitions,
volume management, fade in/out, looping, pause/resume, and resource management.

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Audio Signal Chain](#audio-signal-chain)
4. [Constructor](#constructor)
5. [Context Management](#context-management)
6. [Loading & Unloading](#loading--unloading)
7. [Sound Effects (SFX)](#sound-effects-sfx)
8. [Music](#music)
9. [Music Transition](#music-transition)
10. [Volume Control](#volume-control)
11. [Status Queries](#status-queries)
12. [Cleanup](#cleanup)
13. [Error Handling](#error-handling)
14. [Browser Support](#browser-support)
15. [Full Example](#full-example)

---

## Installation

AudioJS is a single ES module file — no build step or package manager required.

```html
<script type="module">
    import { AudioJS } from './audio.js';
    const audio = new AudioJS();
</script>
```

Or in a separate JS module:

```js
import { AudioJS } from './audio.js';
```

---

## Quick Start

```js
import { AudioJS } from './audio.js';

const audio = new AudioJS();

// 1. Resume context on first user interaction (required by browsers)
document.addEventListener('click', async () => {
    await audio.resumeContext();
}, { once: true });

// 2. Fetch and load audio files
const res = await fetch('music.mp3');
const buf = await res.arrayBuffer();
await audio.load('bgm', buf);

const res2 = await fetch('shoot.wav');
const buf2 = await res2.arrayBuffer();
await audio.load('shoot', buf2);

// 3. Play background music (looping)
await audio.playMusic('bgm', { loop: true });

// 4. Play a sound effect (fire-and-forget)
await audio.playSFX('shoot');
```

---

## Audio Signal Chain

All audio flows through a three-level gain graph:

```
AudioContext
└── masterGain  ← setMasterVolume()
    ├── musicGain  ← setMusicVolume()
    │   └── per-track GainNode  ← fade in/out, transitions
    │       └── AudioBufferSourceNode  (music)
    └── sfxGain    ← setSFXVolume()
        └── per-instance GainNode  ← fade in/out
            └── AudioBufferSourceNode  (sfx)
```

Volume values at each stage multiply. For example, at `masterVolume=80`,
`musicVolume=50`, the effective music level is `0.8 × 0.5 = 0.4` (40%).

---

## Constructor

```js
const audio = new AudioJS();
```

Creates a new AudioJS instance. The `AudioContext` is **not** created until the first
audio operation — this respects browser autoplay policies.

Volume defaults: master = 100, music = 100, SFX = 100.

---

## Context Management

### `resumeContext() → Promise<boolean>`

Resume a suspended `AudioContext`. Browsers often suspend the context until the user
interacts with the page (click, keypress, etc.). Call this method on first user interaction.

```js
document.getElementById('startBtn').addEventListener('click', async () => {
    await audio.resumeContext();
});
```

Returns `true` if the context is now running.
Displays an `alert()` on failure.

---

### `getContextState() → string`

Returns the `AudioContext` state:

| Value              | Meaning                                      |
|--------------------|----------------------------------------------|
| `'not-initialized'`| Context has not been created yet             |
| `'running'`        | Audio is active                              |
| `'suspended'`      | Context is paused (awaiting user interaction)|
| `'closed'`         | Context was closed by `cleanup()`            |

---

## Loading & Unloading

### `load(name, arrayBuffer) → Promise<boolean>`

Decode an MP3 or WAV `ArrayBuffer` and store the result under `name`.

| Parameter     | Type          | Description                        |
|---------------|---------------|------------------------------------|
| `name`        | `string`      | Identifier to reference the sound  |
| `arrayBuffer` | `ArrayBuffer` | Raw audio data                     |

```js
const response  = await fetch('explosion.wav');
const rawBuffer = await response.arrayBuffer();
const ok = await audio.load('explosion', rawBuffer);
```

Returns `true` on success. Shows an `alert()` on decode failure.

> Loading the same `name` twice overwrites the previous buffer.

---

### `unload(name)`

Stop any active playback of `name` and release its decoded buffer from memory.

```js
audio.unload('explosion');
```

---

### `isLoaded(name) → boolean`

```js
if (audio.isLoaded('bgm')) { /* safe to play */ }
```

---

### `getLoadedSounds() → string[]`

Returns an array of all currently loaded sound names.

```js
console.log(audio.getLoadedSounds()); // ['bgm', 'shoot', 'explosion']
```

---

## Sound Effects (SFX)

SFX are designed for **fire-and-forget**, low-latency playback. Each call to `playSFX`
creates an independent instance — multiple can play simultaneously.

---

### `playSFX(name, options?) → Promise<handle|null>`

Play a loaded sound effect.

| Parameter         | Type      | Default | Description                   |
|-------------------|-----------|---------|-------------------------------|
| `name`            | `string`  | —       | Sound identifier              |
| `options.loop`    | `boolean` | `false` | Loop the SFX indefinitely     |
| `options.fadeIn`  | `number`  | `0`     | Fade-in duration (seconds)    |

```js
// Simple play
await audio.playSFX('shoot');

// With options
const handle = await audio.playSFX('engine', { loop: true, fadeIn: 0.2 });
```

Returns a **handle** object that can be passed to `stopSFXHandle()` or `fadeOutSFX()`.
Returns `null` if the sound is not loaded.

---

### `stopSFX(name)`

Stop **all** active instances of the named SFX.

```js
audio.stopSFX('engine');
```

---

### `stopSFXHandle(handle)`

Stop a **specific** SFX instance returned by `playSFX()`.

```js
const handle = await audio.playSFX('engine', { loop: true });
// ...later...
audio.stopSFXHandle(handle);
```

---

### `stopAllSFX()`

Stop all currently playing SFX instances.

```js
audio.stopAllSFX();
```

---

### `fadeOutSFX(handle, duration?)`

Fade out and stop a specific SFX instance.

| Parameter  | Type     | Default | Description                  |
|------------|----------|---------|------------------------------|
| `handle`   | `object` | —       | Handle from `playSFX()`      |
| `duration` | `number` | `1`     | Fade duration in seconds     |

```js
const handle = await audio.playSFX('engine', { loop: true });
// Fade out over 2 seconds
audio.fadeOutSFX(handle, 2);
```

---

### `getActiveSFXCount() → number`

Returns the number of SFX instances currently playing.

---

## Music

Only **one** music track plays at a time. Music supports looping, fade-in/out, pause,
and resume from exact playback position.

---

### `playMusic(name, options?)`

Play a music track. Any currently playing music is stopped immediately.

| Parameter        | Type      | Default | Description                  |
|------------------|-----------|---------|------------------------------|
| `name`           | `string`  | —       | Sound identifier             |
| `options.loop`   | `boolean` | `true`  | Loop the track               |
| `options.fadeIn` | `number`  | `0`     | Fade-in duration (seconds)   |

```js
await audio.playMusic('bgm', { loop: true });

// With 2-second fade-in
await audio.playMusic('bgm', { loop: true, fadeIn: 2 });
```

---

### `stopMusic(fadeOut?)`

Stop the current music track.

| Parameter | Type     | Default | Description                 |
|-----------|----------|---------|-----------------------------|
| `fadeOut` | `number` | `0`     | Fade-out duration (seconds) |

```js
// Stop immediately
audio.stopMusic();

// Stop with 3-second fade-out
audio.stopMusic(3);
```

---

### `pauseMusic() → boolean`

Pause the current music track, saving the playback position.
Returns `true` if paused successfully, `false` if nothing was playing.

```js
audio.pauseMusic();
```

---

### `resumeMusic() → boolean`

Resume a paused music track from the exact position it was paused.
Returns `true` if resumed successfully, `false` if music was not paused.

```js
audio.resumeMusic();
```

---

## Music Transition

### `transitionTo(name, transitionTime?)`

Smoothly cross-fade from the current track to a new one.
The current track's volume fades to 0 while the new track fades in from 0,
both over `transitionTime` seconds simultaneously.

| Parameter        | Type     | Default | Description                       |
|------------------|----------|---------|-----------------------------------|
| `name`           | `string` | —       | Sound identifier of new track     |
| `transitionTime` | `number` | `3`     | Cross-fade duration (1–10 seconds)|

```js
// Start playing music1
await audio.playMusic('music1', { loop: true });

// Later, transition smoothly to music2 over 5 seconds
await audio.transitionTo('music2', 5);
```

The new track always loops (`loop: true`) when started via `transitionTo`.

---

## Volume Control

All volumes are integers from **0** (silent) to **100** (full volume).

### `setMasterVolume(volume)`

Controls the overall output level — affects all music and SFX.

```js
audio.setMasterVolume(80); // 80%
audio.setMasterVolume(0);  // mute all
```

---

### `setMusicVolume(volume)`

Controls the music level independently of SFX.

```js
audio.setMusicVolume(60);
```

---

### `setSFXVolume(volume)`

Controls the SFX level independently of music.

```js
audio.setSFXVolume(100);
```

---

### `getMasterVolume() → number`
### `getMusicVolume() → number`
### `getSFXVolume() → number`

Return the current volume values (0–100).

```js
console.log(audio.getMasterVolume()); // 80
```

---

## Status Queries

### `getCurrentMusicName() → string|null`

Returns the name of the currently loaded/playing music track, or `null`.

```js
const name = audio.getCurrentMusicName(); // 'bgm' or null
```

---

### `isMusicPlaying() → boolean`

Returns `true` if music is currently playing (not paused).

---

### `isMusicPaused() → boolean`

Returns `true` if music is currently paused.

---

## Cleanup

### `cleanup()`

Stop all audio, close the `AudioContext`, and release all decoded audio buffers.

```js
audio.cleanup();
```

After `cleanup()`:
- All sounds must be re-loaded with `load()` before they can be played.
- The `AudioContext` is closed; it will be re-created on the next audio operation.
- Volume settings are preserved on the `AudioJS` instance.

---

## Error Handling

Errors are reported via `alert()` calls for ease of use in game contexts.

Situations that trigger an `alert()`:

| Situation                              | Message                                          |
|----------------------------------------|--------------------------------------------------|
| `AudioContext` creation fails          | `AudioJS: Failed to create AudioContext — …`     |
| `AudioContext` resume fails            | `AudioJS: Failed to resume AudioContext — …`     |
| Audio file decode fails                | `AudioJS: Failed to decode "name" — …`           |
| Playing a sound that is not loaded     | `AudioJS: Sound "name" is not loaded`            |
| Transitioning to a sound not loaded    | `AudioJS: Sound "name" is not loaded`            |

---

## Browser Support

AudioJS requires a browser that supports the **Web Audio API**.
No polyfills or fallbacks are provided.

Tested and working in:
- Microsoft Edge (Chromium)
- Google Chrome
- Mozilla Firefox
- Apple Safari (14+)

> **Note:** Browsers block audio playback until the user interacts with the page.
> Always call `audio.resumeContext()` inside a user-triggered event handler
> (click, keydown, etc.) before playing audio.

---

## Full Example

```js
import { AudioJS } from './audio.js';

const audio = new AudioJS();

// Resume context on first interaction
document.body.addEventListener('click', () => audio.resumeContext(), { once: true });

async function init() {
    // Load files
    const [musicBuf, shootBuf, explosionBuf] = await Promise.all([
        fetch('theme.mp3').then(r => r.arrayBuffer()),
        fetch('shoot.wav').then(r => r.arrayBuffer()),
        fetch('explosion.wav').then(r => r.arrayBuffer()),
    ]);

    await audio.load('theme',     musicBuf);
    await audio.load('shoot',     shootBuf);
    await audio.load('explosion', explosionBuf);

    // Volume setup
    audio.setMasterVolume(90);
    audio.setMusicVolume(70);
    audio.setSFXVolume(100);

    // Start music with 2s fade-in
    await audio.playMusic('theme', { loop: true, fadeIn: 2 });
}

// Play SFX on game events
function onShoot()     { audio.playSFX('shoot'); }
function onExplosion() { audio.playSFX('explosion'); }

// Pause game
function onPause()  { audio.pauseMusic(); }
function onResume() { audio.resumeMusic(); }

// Load next level — transition music over 4 seconds
async function onNextLevel() {
    await audio.load('level2', await fetch('level2.mp3').then(r => r.arrayBuffer()));
    await audio.transitionTo('level2', 4);
}

// Quit
function onQuit() { audio.cleanup(); }
```
