# AudioJS

A lightweight JavaScript library for Web Audio in browser-based games.
AudioJS wraps the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
and provides a simple, unified interface for **Music** and **Sound Effects (SFX)**.

## Features

- 🎵 **Music playback** — play, pause, resume, stop, loop
- 🔊 **SFX playback** — fire-and-forget, low-latency, simultaneous instances
- 🔀 **Smooth music transitions** — cross-fade between tracks over a configurable duration
- 📦 **Pre-loading** — decode and cache MP3/WAV files before playback
- 🔉 **Volume control** — independent master / music / SFX levels (0–100)
- ✨ **Fade in/out** — for both music and SFX
- ⏸ **Pause & resume** — music resumes from exact playback position
- 🔁 **Looping** — for music and SFX
- 🧹 **Cleanup** — stop all audio and release all resources
- 🚫 **No dependencies** — single ES module file, no build step required

## Files

| File            | Description                                      |
|-----------------|--------------------------------------------------|
| `audio.js`      | AudioJS library — `export class AudioJS`         |
| `index.html`    | Interactive test page                            |
| `test.js`       | Test page logic (imported by `index.html`)       |
| `audiomark.md`  | Full API reference and usage guide               |
| `requirements.md` | Original requirements                          |

## Quick Start

```js
import { AudioJS } from './audio.js';

const audio = new AudioJS();

// Resume AudioContext on first user interaction (required by browsers)
document.addEventListener('click', () => audio.resumeContext(), { once: true });

// Load audio
const buf = await fetch('music.mp3').then(r => r.arrayBuffer());
await audio.load('bgm', buf);

// Play looping background music
await audio.playMusic('bgm', { loop: true });

// Play a sound effect
const sfxBuf = await fetch('shoot.wav').then(r => r.arrayBuffer());
await audio.load('shoot', sfxBuf);
await audio.playSFX('shoot');
```

## Browser Support

Requires a browser with [Web Audio API](https://caniuse.com/audio-api) support.
Tested with Microsoft Edge, Chrome, Firefox, and Safari.

## Documentation

See **[audiomark.md](./audiomark.md)** for the full API reference.

## License

[MIT](./LICENSE)
