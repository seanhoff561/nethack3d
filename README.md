# NetHack 3D

Open [index.html](C:/Users/Sean/Documents/ChatGPT/nethack3d/index.html) in a current desktop browser with WebGL enabled. The game is self-contained: Three.js is vendored in `vendor/`, the content catalog is generated from the NetHack 3.6.6 release tables, and no build command or network connection is needed at runtime.

The verification suites can be run without a browser:

```powershell
Get-Content tests/engine.cjs -Raw | node
Get-Content tests/keyboard.cjs -Raw | node
```

This is an independent playable adaptation of the documented 3.6.6 rules and data tables, not a complete source-compatible port of every NetHack special level and interaction.
