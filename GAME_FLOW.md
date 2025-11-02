# Game Flow and State Management

This document explains how the game flow and state management works in Spectrum Sync.

## Overview

The game uses automatic phase transitions driven by server-side timers. Each phase automatically advances to the next when its timer expires, ensuring a smooth gameplay experience without requiring manual host intervention.

## Phase Flow

```
LOBBY → START ROUND → ROUND_START (3s) → HINT (35s) → VOTE (10s) → PLACE (20s) → REVEAL (8s) → LOBBY (5s) → ...
```

**Note:** Kids Mode adds +5s to HINT and PLACE phases.

## Phase Descriptions

### LOBBY
- **Duration:** Until host starts round
- **Purpose:** Players join, host configures settings
- **Auto-transition:** None (requires host to start round)
- **Special:** Shows different UI for first round vs subsequent rounds

### ROUND_START
- **Duration:** 3 seconds
- **Purpose:** Show spectrum and navigator announcement
- **Auto-transition:** → HINT phase

### HINT
- **Duration:** 35 seconds (+5s in kids mode)
- **Purpose:** Cluers submit hints to help Navigator
- **Auto-transition:** → VOTE phase
- **Players:**
  - Cluers: See target value, submit hints
  - Navigator: Waits, does not submit hint

### VOTE
- **Duration:** 10 seconds
- **Purpose:** Cluers vote on best hints (up to 2 votes each)
- **Auto-transition:** → PLACE phase
- **Players:**
  - Cluers: Vote anonymously on hints (cannot vote for own)
  - Navigator: Waits

### PLACE
- **Duration:** 20 seconds (+5s in kids mode)
- **Purpose:** Navigator places slider based on final clues
- **Auto-transition:** → REVEAL phase (with default placement if not set)
- **Players:**
  - Navigator: See final clues, place slider (0-100)
  - Cluers: Wait, see which clues were selected

### REVEAL
- **Duration:** 8 seconds
- **Purpose:** Show target, guess, distance, and points awarded
- **Auto-transition:** → LOBBY (after 5s buffer)
- **Special:** Checks win condition (15 points or 6 rounds)

## Automatic Transitions

### Implementation

Automatic transitions are implemented using timer callbacks:

```javascript
game.startTimer(seconds, onComplete);
```

When the timer expires, the callback is invoked which transitions to the next phase.

### Transition Functions

- `transitionToHintPhase(game)` - ROUND_START → HINT
- `transitionToVotePhase(game)` - HINT → VOTE (after processing duplicates)
- `transitionToPlacePhase(game)` - VOTE → PLACE
- `transitionToRevealPhase(game)` - PLACE → REVEAL (defaults placement to 50 if not set)
- `transitionAfterReveal(game)` - REVEAL → LOBBY or GAME_OVER

### Manual Override

Host can manually advance phases using control buttons. This clears the auto-timer and immediately transitions.

## State Persistence and Reconnection

### Reconnection Flow

1. Player disconnects (connection lost, page refresh, etc.)
2. Client reconnects to WebSocket
3. Client sends `RECONNECT` message with saved token
4. Server validates token and restores player identity
5. Server sends current game state to player

### Game State Contents

The `getGameState(forPlayerId)` method returns player-specific state:

- **Always included:**
  - Game ID, state, round, scores, players, navigator ID, timer

- **Phase-specific:**
  - ROUND_START/HINT/VOTE/PLACE/REVEAL: Spectrum information
  - HINT: Target (cluers only), hints submitted count
  - VOTE: Active hints list, target (cluers only), votes count
  - PLACE: Final clues, target (cluers only)
  - REVEAL: Target, placement, distance, points, clue authors

- **Player-specific:**
  - **Cluers:** See target value in HINT, VOTE, and PLACE phases
  - **Navigator:** Does NOT see target (only sees final clues in PLACE)
  - **Host/TV:** Does NOT see target during gameplay

## Edge Cases

### Navigator Timeout

If the navigator doesn't lock placement before the timer expires:
- Placement automatically set to 50 (middle of 0-100 scale)
- Game continues to REVEAL phase normally
- Fair outcome for all players

### No Hints Submitted

If no hints are submitted or all are canceled:
- Empty final clues array `[]`
- Navigator sees message: "No clues selected! Make your best guess!"
- Game continues normally with blind guess

### Duplicate Hints

When identical hints are detected:
- All duplicate hints are marked as canceled
- Authors are notified and can resubmit once
- Auto-transition to VOTE continues as scheduled

### Host Add Time

When host clicks "+10s" button:
- Timer end time extended by 10 seconds
- Timer callback preserved and rescheduled
- Players see updated timer

## Testing

All game flow is automatically tested:

```bash
cd server
node test-game-flow.js      # Full game flow
node test-reconnect.js       # Reconnection scenarios
node test-timeout.js         # Navigator timeout
```

## Troubleshooting

### Game Stuck in Phase

**Symptom:** Phase doesn't advance automatically
**Cause:** Timer callback not set or cleared
**Solution:** Host can manually advance using control buttons

### Players See Wrong State After Refresh

**Symptom:** Cluer doesn't see target after refresh
**Cause:** Game state not requested on reconnection
**Solution:** Already handled - `getGameState()` called on reconnect

### Navigator Placement Not Working

**Symptom:** Navigator can't lock placement
**Cause:** Game not in PLACE state or placement not set
**Solution:** Ensure `submitPlacement()` called before `lockPlacement()`

## Architecture

### Server-Side (Node.js)

- `Game` class manages game state and transitions
- `startTimer(seconds, callback)` creates timeout with callback
- `clearTimer()` clears active timer
- Transition functions orchestrate phase changes
- WebSocket handlers respond to client messages

### Client-Side (React)

- `useWebSocket` hook manages connection and state
- Components (TVDisplay, PhoneController) render based on state
- Reconnection handled automatically with localStorage tokens
- Timer displays countdown based on `timerEndTime`

## Future Considerations

- Configurable phase timers
- Pause/resume functionality
- Spectator mode
- Save/replay completed games
- Analytics and statistics

## Questions?

For questions about game flow, see:
- Server code: `server/index.js`
- Client state: `client/src/hooks/useWebSocket.js`
- UI components: `client/src/components/`
