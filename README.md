# React Minecraft

A Minecraft-style voxel builder built with React Three Fiber. Place and remove blocks in a 3D world using first-person controls, with physics and persistent saves.

## Controls

| Key | Action |
|---|---|
| W/A/S/D or Arrow Keys | Move |
| Space | Jump |
| Mouse | Look around (click to lock) |
| Left Click | Place block on adjacent face |
| Alt + Click | Remove block |
| 1-5 | Select texture (dirt, grass, glass, wood, log) |

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** (App Router)
- **React Three Fiber** — React renderer for Three.js
- **@react-three/cannon** — Physics engine
- **@react-three/drei** — Useful R3F helpers (Sky, PointerLockControls)
- **Zustand** — State management
- **localStorage** — World persistence

## Project Structure

```
app/
  page.jsx          # Landing page
  game/page.jsx     # Game route
components/
  game.jsx          # Main Canvas + Physics scene
  Player.jsx        # First-person player with physics
  Cube.jsx          # Individual block component
  Cubes.jsx         # Renders all placed blocks
  Ground.jsx        # Ground plane
  FPV.jsx           # PointerLockControls
  Menu.jsx          # Save/Reset UI
  TextureSelector.jsx  # Texture HUD
hooks/
  useStore.jsx      # Zustand store (cubes, texture, save/reset)
  useKeyboard.jsx   # Keyboard input tracking
utils/
  textures.js       # Three.js texture loader
  images.js         # Asset path constants
```

## License

MIT
