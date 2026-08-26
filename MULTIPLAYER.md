# Multiplayer Architecture Proposal

This document proposes an architecture for turning the single-player voxel builder into a real-time multiplayer game.

---

## 1. Realtime Library Comparison

| Library | Pros | Cons | Verdict |
|---|---|---|---|
| **Colyseus** | Built-in room/state sync, matchmaking, built for games,自动 diffing of state | Heavier, adds a server process, learning curve | Best fit for this project |
| **Socket.IO** | Widely known, flexible, easy to set up | No built-in game state sync, you'd reinvent Colyseus features manually | Workable but more boilerplate |
| **PartyKit** | Zero-config deploy, integrates with Cloudflare, easy presence | Newer/less mature for game state, limited control over server logic | Good for prototypes, less ideal for authoritative state |

### Recommendation: **Colyseus**

Colyseus is purpose-built for multiplayer games. Its core features align directly with this project's needs:
- **Room-based architecture**: Each game instance is a "room" with its own state
- **Automated state synchronization**: Define a schema, Colyseus diffs and patches it to clients automatically
- **Built-in matchmaking**: Players can join/create rooms without extra code
- **Handles reconnection, disconnections, and latency** out of the box

---

## 2. Player Position/Rotation Sync

### Current Flow (Single-Player)
```
Keyboard input → useKeyboard hook → Player.jsx useFrame loop → cannon physics → camera follows physics body
```

### Proposed Multiplayer Flow
```
Client:
  Keyboard input → useKeyboard hook → Player.jsx useFrame loop
    → Send input to server (throttled, ~20Hz)
    → Apply local prediction immediately (client-side prediction)
    → Receive authoritative position from server → reconcile if different

Server:
  Receive input → Apply to physics world (server-side cannon instance)
    → Broadcast updated player positions to all clients (~20Hz)
```

### Sync Details
- **Position**: Send `{ x, y, z }` at 20Hz. Server broadcasts authoritative positions at 20Hz.
- **Rotation**: Send camera yaw/pitch (2 floats, not a full quaternion). Enough for FPV rendering.
- **Interpolation**: Clients interpolate between received server positions to smooth out network jitter. Use a 100ms buffer.
- **Prediction**: Client applies movement locally immediately. On server reconciliation, if the difference is > threshold (e.g., 0.5 units), snap to server position.

---

## 3. Block Placement Sync Protocol

### Current Flow (Single-Player)
```
Click Cube → addCube(x,y,z) or removeCube(x,y,z) → update Zustand store → save to localStorage
```

### Proposed Multiplayer Flow
```
Client:
  Click Cube → Send { action: "add"|"remove", x, y, z, texture } to server
    → Optimistically update local store (show block immediately)
    → Server validates and broadcasts to all clients

Server:
  Receive block action → Validate (reach limit, no duplicates, no removing other players' blocks?)
    → Update authoritative world state
    → Broadcast to all clients in the room
```

### Validation Rules (Server-Side)
1. **Reach limit**: Block must be within N units of the player who placed it
2. **No duplicates**: Cannot place a block where one already exists
3. **No removing other players' blocks**: Optional — only the player who placed a block can remove it (or allow anyone for creative mode)
4. **Rate limiting**: Max N placements per second to prevent spam

### Message Format
```json
{
  "type": "block_action",
  "action": "add" | "remove",
  "position": [x, y, z],
  "texture": "dirt"
}
```

---

## 4. Zustand Store Changes for Server-Authoritative State

### Current Store Design
```js
{
  texture: "dirt",          // Client-only (UI state)
  cubes: [...],             // THE source of truth (localStorage)
  addCube: (x, y, z) => {},// Mutates cubes + localStorage
  removeCube: (x, y, z) => {},
  saveWorld: () => {},     // Explicit localStorage save
  resetWorld: () => {},    // Clears cubes + localStorage
}
```

### Problem
The current store is the single source of truth. In multiplayer, the **server** must be the source of truth. Clients should not be able to add/remove cubes without server validation.

### Proposed Store Architecture

Split into two concerns:

```js
// 1. Client-side store (UI state, local predictions)
{
  texture: "dirt",              // UI state, stays client-only
  localAdditions: [],           // Blocks placed by this client, pending server confirmation
  localRemovals: [],           // Blocks removed by this client, pending server confirmation
  setTexture: (t) => {},
}

// 2. Server-authoritative store (received from server)
{
  world: Map<string, {          // Keyed by "x,y,z"
    position: [x, y, z],
    texture: "dirt",
    placedBy: "player-id"
  }>,
  players: Map<string, {        // Other players
    position: [x, y, z],
    rotation: [yaw, pitch]
  }>,
  // Actions go through the network layer, not direct store mutation
  requestAddBlock: (x, y, z) => socket.send("block_action", ...),
  requestRemoveBlock: (x, y, z) => socket.send("block_action", ...),
}
```

### Key Changes Needed

| Current | Proposed |
|---|---|
| `cubes` array in Zustand | `world` Map received from server |
| `addCube()` mutates store directly | `requestAddBlock()` sends to server, server validates, broadcasts |
| `removeCube()` mutates store directly | `requestRemoveBlock()` sends to server, server validates, broadcasts |
| `saveWorld()` → localStorage | Server persists world state (DB or file) |
| `resetWorld()` → clear store + localStorage | Server clears room state, broadcasts to all clients |
| `getLocalStorage()` at module scope | Remove — server sends initial world state on join |
| No player tracking | Add `players` map for other clients' positions |
| No network layer | Add WebSocket connection manager (Colyseus client) |

### Migration Path
1. **Phase 1**: Wrap existing store. Server broadcasts world state on join. Clients render from server state. Local add/remove go through server.
2. **Phase 2**: Add player position sync. Other players appear in the scene as colored cubes/spheres.
3. **Phase 3**: Add server-side persistence. World survives server restarts.
4. **Phase 4**: Add matchmaking, room creation, game rules (bedwars logic).

---

## 5. Server Structure (Colyseus)

```
server/
  rooms/
    VoxelRoom.ts        # Main game room
      - onCreate()      # Initialize world state
      - onJoin()        # Send world state to new player
      - onLeave()       # Cleanup
      - onMessage()     # Handle block actions, player input
  schemas/
    WorldState.ts       # Colyseus Schema: cubes, players
  index.ts              # Colyseus server entry point
```

### WorldState Schema
```ts
import { Schema, MapSchema, type } from "@colyseus/schema";

class Block extends Schema {
  @type("float32") x: number;
  @type("float32") y: number;
  @type("float32") z: number;
  @type("string") texture: string;
  @type("string") placedBy: string;
}

class Player extends Schema {
  @type("float32") x: number;
  @type("float32") y: number;
  @type("float32") z: number;
  @type("float32") yaw: number;
  @type("float32") pitch: number;
}

class WorldState extends Schema {
  @type({ map: Block }) blocks = new MapSchema<Block>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
```

---

## Summary

| Concern | Current | Multiplayer |
|---|---|---|
| Source of truth | Client (Zustand + localStorage) | Server (Colyseus room state) |
| Block placement | Direct store mutation | Client request → Server validate → Broadcast |
| Player sync | N/A | Input sent at 20Hz, server broadcasts positions at 20Hz |
| Persistence | localStorage | Server-side (database or file) |
| State shape | Flat `cubes` array | `Map<key, Block>` + `Map<id, Player>` |
| Network | None | WebSocket via Colyseus client |
