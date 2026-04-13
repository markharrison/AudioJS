# AudioJS

A lightweight JavaScript library for playing audio in web games, built on the Web Audio API.

## Overview

AudioJS provides a simple, intuitive interface for managing game audio with support for:

- **Background Music** - Long, looping tracks with full playback controls
- **Sound Effects (SFX)** - Short, low-latency, fire-and-forget sounds
- **Volume Control** - Independent control over master, music, and SFX volumes
- **Advanced Features** - Fade in/out, smooth music transitions, looping, pause/resume
- **Format Support** - MP3 and WAV audio files
- **Browser Ready** - Handles browser autoplay policies automatically

## Quick Start

```javascript
import { AudioJS } from './audio.js';

// Create and initialize
const audio = new AudioJS();
await audio.init(); // Call after user interaction

// Load audio files
await audio.load('background', '/audio/background.mp3');
await audio.load('coin', '/audio/coin.wav');

// Play music
audio.playMusic('background', { loop: true });

// Play sound effects
audio.playSfx('coin');

// Control volume (0-100)
audio.setMasterVolume(80);
audio.setMusicVolume(70);
audio.setSfxVolume(100);
```

## Features

### Dual Audio System
- **Music**: Full-featured playback for longer tracks with controls for pause, resume, stop, and transitions
- **SFX**: Optimized for short sounds with minimal latency, perfect for rapid-fire events

### Volume Management
- Master volume controls overall audio level
- Music volume for background tracks
- SFX volume for sound effects
- All volumes range from 0 (muted) to 100 (full)

### Advanced Playback
- **Looping**: Configure tracks to loop indefinitely
- **Fade In/Out**: Smooth audio transitions
- **Music Transitions**: Crossfade between tracks with configurable duration
- **Simultaneous Playback**: Play multiple sounds at once

### Resource Management
- Pre-load audio files for instant playback
- Unload files when no longer needed
- Cleanup method for complete resource disposal

## Test Page

AudioJS includes a comprehensive test page (`index.html`) with a modern UI for testing all features:

- Load audio files from disk
- Test music and SFX playback
- Experiment with volume controls
- Test looping and simultaneous playback
- Try smooth music transitions with adjustable duration
- Pause, resume, and stop controls
- Real-time action logging

Simply open `index.html` in a modern browser to try it out!

## Documentation

- **[audiomark.md](audiomark.md)** - Complete API documentation with examples
- **[requirements.md](requirements.md)** - Project requirements and specifications

## Browser Compatibility

AudioJS uses the Web Audio API and supports:
- Microsoft Edge (all versions)
- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Opera 22+

**Note**: Internet Explorer is not supported.

## Files

- `audio.js` - Main AudioJS library (ES6 module)
- `index.html` - Test page with interactive UI
- `test.js` - Test page logic (ES6 module)
- `audiomark.md` - Detailed documentation
- `README.md` - This file

## Usage Example

```javascript
import { AudioJS } from './audio.js';

class Game {
    constructor() {
        this.audio = new AudioJS();
    }

    async init() {
        await this.audio.init();

        // Load game audio
        await this.audio.load('menu-music', '/audio/menu.mp3');
        await this.audio.load('game-music', '/audio/game.mp3');
        await this.audio.load('jump', '/audio/jump.wav');

        // Start menu music
        this.audio.playMusic('menu-music', { loop: true });
    }

    startGame() {
        // Smooth transition to game music
        this.audio.transitionMusic('menu-music', 'game-music', 2);
    }

    playerJump() {
        this.audio.playSfx('jump');
    }
}
```

## Best Practices

1. **Initialize after user interaction** - Browser policies require user interaction before playing audio
2. **Pre-load audio files** - Load files during initialization, not during gameplay
3. **Use appropriate types** - Use `playSfx()` for short sounds, `playMusic()` for longer tracks
4. **Handle cleanup** - Call `cleanup()` when done to free resources

## License

MIT License - See LICENSE file for details.

Copyright (c) 2026 Mark Harrison

## Contributing

Issues and pull requests are welcome!
