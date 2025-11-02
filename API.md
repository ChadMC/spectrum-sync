# API Documentation

This document describes the server API endpoints and WebSocket messages for the Odd Ball Out game.

## Base URL

**Development:** `http://localhost:3001`  
**Production:** Your deployed server URL

## REST API Endpoints

### Health Check

Check if the server is running and get current game count.

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "games": 0
}
```

### Get QR Code

Generate a QR code for joining a specific game.

```
GET /api/qr/:gameId
```

**Parameters:**
- `gameId` (string): The game code (6 characters)

**Response:**
```json
{
  "qr": "data:image/png;base64,...",
  "url": "http://localhost:5173/join/ABC123"
}
```

### Get Available Avatars

Get list of available emoji avatars for players.

```
GET /api/avatars
```

**Response:**
```json
["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", ...]
```

### Get Question Packs

Get list of available question pack names.

```
GET /api/packs
```

**Response:**
```json
["default", "party", "family", "kids"]
```

## WebSocket API

### Connection

Connect to WebSocket server at: `ws://localhost:3001` (or `wss://` for production)

Upon connection, server sends:
```json
{
  "type": "CONNECTED",
  "clientId": "uuid-v4-string"
}
```

### Client → Server Messages

#### Create Game

Create a new game session.

```json
{
  "type": "CREATE_GAME",
  "data": {}
}
```

**Response:**
```json
{
  "type": "GAME_CREATED",
  "gameId": "ABC123"
}
```

#### Join Game

Join an existing game.

```json
{
  "type": "JOIN_GAME",
  "data": {
    "gameId": "ABC123",
    "name": "PlayerName",
    "avatar": "🐶"
  }
}
```

**Response:**
```json
{
  "type": "JOINED_GAME",
  "gameId": "ABC123",
  "reconnectToken": "uuid-v4-string"
}
```

**Error Response:**
```json
{
  "type": "ERROR",
  "message": "Game not found"
}
```
or
```json
{
  "type": "ERROR",
  "message": "Game is full"
}
```

#### Reconnect

Reconnect to a game using a saved token.

```json
{
  "type": "RECONNECT",
  "data": {
    "token": "uuid-v4-string"
  }
}
```

**Response:**
```json
{
  "type": "RECONNECTED",
  "gameId": "ABC123"
}
```

#### Start Round

Start a new game round (host only).

```json
{
  "type": "START_ROUND",
  "data": {
    "gameId": "ABC123"
  }
}
```

**Response:**
```json
{
  "type": "ROUND_STARTED"
}
```

Then individual players receive:
```json
{
  "type": "GAME_STATE",
  "state": { /* game state with personal clues */ }
}
```

#### Submit Answer

Submit an answer to the current prompt.

```json
{
  "type": "SUBMIT_ANSWER",
  "data": {
    "gameId": "ABC123",
    "answer": "Player's answer text or emoji"
  }
}
```

When all players answer, server sends:
```json
{
  "type": "NEXT_PROMPT"
}
```
or if last prompt:
```json
{
  "type": "VOTING_STARTED",
  "state": { /* game state */ }
}
```

#### Submit Vote

Vote for who you think is the odd player.

```json
{
  "type": "SUBMIT_VOTE",
  "data": {
    "gameId": "ABC123",
    "votedForId": "player-uuid"
  }
}
```

When all players vote, server sends:
```json
{
  "type": "REVEAL",
  "state": { /* game state with results */ }
}
```

#### Kick Player

Remove a player from the game (host only).

```json
{
  "type": "KICK_PLAYER",
  "data": {
    "gameId": "ABC123",
    "playerId": "player-uuid"
  }
}
```

**Response:**
```json
{
  "type": "PLAYER_KICKED",
  "playerId": "player-uuid",
  "state": { /* updated game state */ }
}
```

#### Mute Player

Toggle mute status for a player (host only).

```json
{
  "type": "MUTE_PLAYER",
  "data": {
    "gameId": "ABC123",
    "playerId": "player-uuid"
  }
}
```

**Response:**
```json
{
  "type": "GAME_STATE",
  "state": { /* updated game state */ }
}
```

#### Toggle Streamer Mode

Toggle streamer mode on/off (host only).

```json
{
  "type": "TOGGLE_STREAMER_MODE",
  "data": {
    "gameId": "ABC123"
  }
}
```

**Response:**
```json
{
  "type": "GAME_STATE",
  "state": { /* updated game state */ }
}
```

#### Set Question Pack

Change the question pack for the game (host only, before starting).

```json
{
  "type": "SET_QUESTION_PACK",
  "data": {
    "gameId": "ABC123",
    "pack": "party"
  }
}
```

**Response:**
```json
{
  "type": "PACK_UPDATED",
  "pack": "party"
}
```

#### Get Game State

Request current game state.

```json
{
  "type": "GET_GAME_STATE",
  "data": {
    "gameId": "ABC123"
  }
}
```

**Response:**
```json
{
  "type": "GAME_STATE",
  "state": { /* game state */ }
}
```

### Server → Client Messages

#### Game State

Broadcast when game state changes.

```json
{
  "type": "GAME_STATE",
  "state": {
    "id": "ABC123",
    "state": "LOBBY",
    "currentRound": 0,
    "maxRounds": 6,
    "players": [
      {
        "id": "player-uuid",
        "name": "PlayerName",
        "avatar": "🐶",
        "score": 0,
        "isHost": true,
        "isMuted": false,
        "connected": true
      }
    ],
    "streamerMode": false,
    "timerEndTime": null
  }
}
```

During gameplay, includes:
```json
{
  "currentPrompt": {
    "index": 0,
    "total": 3,
    "question": "What's your favorite food?",
    "type": "text",
    "normalClue": "🍕 Pizza is your favorite",
    "oddClue": "🍔 Burgers are your favorite",
    "options": [] // for multiple choice/emoji
  },
  "clue": "Your specific clue",
  "isOdd": false
}
```

During reveal, includes:
```json
{
  "oddPlayerId": "player-uuid",
  "votes": {
    "voter-uuid": "voted-for-uuid"
  },
  "answers": {
    "0": {
      "player-uuid": "player answer"
    }
  }
}
```

#### Round Complete

After reveal phase, if game continues:

```json
{
  "type": "ROUND_COMPLETE",
  "state": { /* updated game state */ }
}
```

#### Game Over

When win condition is met:

```json
{
  "type": "GAME_OVER",
  "state": {
    /* game state */,
    "winner": {
      "id": "player-uuid",
      "name": "Winner",
      "avatar": "🏆",
      "score": 15
    }
  }
}
```

## Game State Flow

```
LOBBY → PLAYING → VOTING → REVEAL → (ROUND_COMPLETE or GAME_OVER)
  ↑                                           ↓
  └───────────────────────────────────────────┘
```

## Data Types

### Player Object

```typescript
{
  id: string;          // UUID
  name: string;        // Max 20 chars, profanity filtered
  avatar: string;      // Emoji character
  score: number;       // Current score
  isHost: boolean;     // Is game host
  isMuted: boolean;    // Muted by host
  connected: boolean;  // Currently connected
}
```

### Prompt Object

```typescript
{
  normalClue: string;       // Clue for normal players
  oddClue: string;          // Clue for odd player
  question: string;         // Question to answer
  type: 'text' | 'emoji' | 'multiple_choice';
  options?: string[];       // For emoji/MC types
}
```

## Error Codes

Errors are sent as:
```json
{
  "type": "ERROR",
  "message": "Human readable error message"
}
```

Common errors:
- "Game not found" - Invalid game ID
- "Game is full" - 12 players already in game
- "Invalid reconnect token" - Token not found or expired
- Various validation errors

## Rate Limiting

Currently no rate limiting implemented. In production, consider:
- Limiting game creation per IP
- Limiting join attempts per IP
- Limiting message frequency per connection

## Security Notes

1. **Input Validation:**
   - All user input is validated
   - Names are limited to 20 characters
   - Profanity is filtered from names and answers

2. **Game IDs:**
   - 6-character uppercase codes
   - Random generation reduces collision risk
   - No sequential or predictable patterns

3. **Reconnect Tokens:**
   - UUID v4 format
   - Stored per player per game
   - Not automatically expired (game cleanup needed)

4. **WebSocket:**
   - No authentication currently implemented
   - Consider adding for production
   - Use WSS (secure WebSocket) in production

## Monitoring Endpoints

### Health Check with Details

```
GET /health
```

Could be enhanced to return:
```json
{
  "status": "ok",
  "uptime": 12345,
  "games": 5,
  "connections": 23,
  "memory": {
    "used": 50000000,
    "total": 100000000
  }
}
```

## Future API Additions

Potential future endpoints:
- `POST /api/games/:id/reset` - Reset game to lobby
- `GET /api/games/:id/history` - Get game event history
- `POST /api/packs` - Upload custom question pack
- `GET /api/stats` - Server statistics
- `POST /api/auth/login` - User authentication
- `GET /api/leaderboard` - Global leaderboard

## Examples

See the client implementation in `client/src/hooks/useWebSocket.js` for complete usage examples.

## Support

For API questions or issues, open a GitHub issue with the `api` label.
