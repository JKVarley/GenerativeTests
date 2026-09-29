# Generative Tests

A browser-based generative visual sketch that reacts to MIDI input. It listens to notes from a connected MIDI keyboard or controller and transforms the motion, shape, and color of the animation based on the harmonic content and state of the current phrase.

This project is intentionally experimental: it is a live visual instrument for exploring generated geometry and musical color.

## Features

- Real-time generative drawing on a canvas
- MIDI-driven note detection and chord recognition
- Color palettes that shift based on harmonic state
- Animated motion that evolves between calm, unstable, and tense states
- Keyboard controls for palette randomization and canvas clearing

## Requirements

- A modern desktop browser with Web MIDI support
  - Chrome, Edge, or another Chromium-based browser is recommended
- A MIDI keyboard or controller, if you want the visual system to react to live notes
- A local web server is recommended so the browser can run the page reliably

## Run the project

From the project folder, start a simple local web server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

If you are using a browser with Web MIDI support, the page should load the sketch and begin drawing on the canvas.

## How to use it

### 1. Connect MIDI input
Connect your MIDI keyboard or controller before opening the page, or after the page loads if your browser supports detecting new devices.

The sketch watches for MIDI note-on and note-off events and tracks the currently held notes.

### 2. Play notes
Press notes on your MIDI device. The visual system will:

- monitor the pitch classes currently active
- detect simple diatonic triads and chord families
- change the color palette
- alter the motion and shape complexity
- shift between calmer and more unstable visual states depending on the harmony

### 3. Observe the generative response
The canvas will animate continuously, even when no notes are playing, but the motion and appearance will react strongly to the musical input.

### 4. Use the keyboard controls
- R: randomize the diatonic chord color palette
- Space: clear the canvas

## Notes

- This is a visual experiment, not a MIDI audio synthesizer.
- If no MIDI device is connected, the animation still runs in a quiet ambient mode.
- If your browser blocks Web MIDI, check that:
  - you are using a supported browser,
  - your MIDI device is connected and recognized,
  - the page is being served over localhost or another secure/local context.

## Troubleshooting

### The canvas loads but nothing changes
- Confirm that your browser supports Web MIDI.
- Check that your MIDI device is connected and recognized by the OS and browser.
- Try reloading the page after connecting the MIDI device.

### The page does not work as expected
- Make sure you are serving the project from a local server rather than opening the file directly.
- Use a Chromium-based browser for best Web MIDI support.

## License

This project is provided as-is for experimentation and creative use.
