# Testing Guide

This document provides comprehensive testing instructions for the Odd Ball Out game.

## Manual Testing Checklist

### Setup and Start

- [ ] Server starts without errors on port 3001
- [ ] Client dev server starts without errors on port 5173
- [ ] Health endpoint returns status: `curl http://localhost:3001/health`
- [ ] Avatars endpoint returns emoji list
- [ ] Packs endpoint returns question pack names

### Home Screen

- [ ] Home page loads with game title and description
- [ ] "Host Game on TV" button is visible and clickable
- [ ] "Join Game" input accepts 6-character code
- [ ] Game instructions are displayed correctly

### TV Display - Creating Game

- [ ] Clicking "Host Game on TV" navigates to TV display
- [ ] Game code (6 characters) is generated and displayed
- [ ] QR code is generated and displayed
- [ ] Join URL is shown below QR code
- [ ] URL format is correct: `http://localhost:5173/join/XXXXXX`

### TV Display - Lobby

- [ ] Players section shows "Players (0/12)"
- [ ] Question pack selector shows available packs
- [ ] "Streamer Mode OFF" button is visible
- [ ] "Start Round" button is disabled with message "Need 3 more players"
- [ ] When players join, they appear in the players grid
- [ ] Each player shows avatar, name, and host badge (for host)
- [ ] Mute and Kick buttons appear for non-host players

### Phone Controller - Join

- [ ] Navigating to join URL or entering code manually shows join form
- [ ] Game code input accepts uppercase letters
- [ ] Name input accepts text (max 20 characters)
- [ ] Avatar grid displays 20 emoji options
- [ ] Selected avatar is highlighted
- [ ] Clicking avatar selects it
- [ ] "Join Game" button submits the form
- [ ] After joining, player sees lobby view

### Phone Controller - Lobby

- [ ] Game code is displayed
- [ ] Player count is shown
- [ ] All players in game are listed
- [ ] Host has crown badge
- [ ] "Waiting for host to start the game..." message is displayed

### TV Display - Host Controls

- [ ] Changing question pack updates the selection
- [ ] Clicking "Streamer Mode" toggles to "Streamer Mode ON"
- [ ] When streamer mode is ON, player names show as "***"
- [ ] Clicking mute button toggles mute status (icon changes)
- [ ] Clicking kick button removes player from game
- [ ] When 3+ players join, "Start Round" button becomes enabled

### Game Start (3+ Players Required)

**TV Display:**
- [ ] Round counter shows "Round 1/6"
- [ ] Timer starts at 60 seconds and counts down
- [ ] Prompt question is displayed prominently
- [ ] For multiple choice, options are shown
- [ ] For emoji type, emoji options are displayed
- [ ] Player status shows all players

**Phone Controller:**
- [ ] Clue display shows either "You are the ODD ONE!" or "You are NORMAL"
- [ ] Secret clue is shown in colored box
- [ ] Prompt question matches TV display
- [ ] Input type matches prompt type (text/emoji/MC)
- [ ] Round info shows "Round X/6 • Question Y/Z"

### Answering Prompts

**Text Input:**
- [ ] Textarea accepts text input
- [ ] Submit button is disabled when empty
- [ ] Submit button is enabled when text is entered
- [ ] Clicking submit sends answer
- [ ] After submitting, button state updates

**Emoji Selection:**
- [ ] Emoji buttons are large and tappable
- [ ] Clicking emoji submits answer immediately
- [ ] Selected emoji is sent to server

**Multiple Choice:**
- [ ] All options are displayed as buttons
- [ ] Buttons are styled clearly
- [ ] Clicking option submits answer immediately

**After All Players Answer:**
- [ ] TV shows next prompt after 2-second delay
- [ ] Phone shows next prompt
- [ ] Process repeats for 2-3 prompts total

### Voting Phase

**TV Display:**
- [ ] Title changes to "Who is the Odd One Out?"
- [ ] Timer shows 30 seconds
- [ ] All players are displayed as voting cards
- [ ] Instructions say "Discuss and vote on your phone!"

**Phone Controller:**
- [ ] Title shows "Vote!"
- [ ] Instruction says "Who is the Odd One Out?"
- [ ] All other players are shown as vote buttons
- [ ] Player cannot vote for themselves
- [ ] Clicking a player submits vote
- [ ] After voting, UI updates

### Reveal Phase

**TV Display:**
- [ ] Title shows "The Odd One Was..."
- [ ] Odd player's avatar and name are displayed large
- [ ] Vote results show vote count for each player
- [ ] Scoreboard displays all players sorted by score
- [ ] Scores are updated correctly:
  - Voters who found odd player: +2 points
  - Odd player if not caught: +3 points
  - Random bonus for odd player: +2 points

**Phone Controller:**
- [ ] Shows "The Odd One Was:" with avatar and name
- [ ] Player's own score is displayed prominently
- [ ] Mini scoreboard shows all players ranked by score

### Round Complete

- [ ] After 5 seconds, if no win condition met:
  - [ ] TV shows "Round Complete" state briefly
  - [ ] Game returns to playing state for next round
  - [ ] Round counter increments
  - [ ] New odd player is selected randomly
  - [ ] New prompts are selected

### Win Conditions

**First to 15 Points:**
- [ ] When a player reaches 15 points, game ends
- [ ] Game Over screen is shown

**6 Rounds Complete:**
- [ ] After 6 rounds, game ends
- [ ] Winner is player with highest score

### Game Over

**TV Display:**
- [ ] Title shows "Game Over!"
- [ ] Winner's avatar and name are displayed large
- [ ] Winner's final score is shown
- [ ] Full scoreboard shows all players ranked
- [ ] "Play Again" button is visible
- [ ] Clicking "Play Again" reloads the page

**Phone Controller:**
- [ ] Shows "Game Over!"
- [ ] Winner information is displayed
- [ ] Player's final score is shown
- [ ] "Back to Home" button navigates to home page

## WebSocket Testing

### Connection

- [ ] WebSocket connects on page load
- [ ] Connection indicator shows "Connecting..." then updates
- [ ] Console shows "WebSocket connected" message
- [ ] Client receives `CONNECTED` message with clientId

### Disconnection/Reconnection

- [ ] Stop server, verify "Connecting..." appears
- [ ] Start server, verify reconnection happens within 3 seconds
- [ ] Reconnection token is saved to localStorage
- [ ] Player can reconnect with saved token
- [ ] After refresh, player maintains game state

### Real-time Updates

- [ ] When player joins, all devices update immediately
- [ ] When player is kicked, their device shows alert
- [ ] Game state changes propagate to all clients
- [ ] Timer updates are synchronized across devices

## Edge Cases

### Player Limits

- [ ] Cannot join game with more than 12 players
- [ ] Error message shown when trying to join full game

### Minimum Players

- [ ] Cannot start game with less than 3 players
- [ ] Error message clearly indicates need for more players

### Invalid Game Codes

- [ ] Entering invalid game code shows error
- [ ] Error message is user-friendly

### Profanity Filter

- [ ] Player names with profanity are cleaned
- [ ] Text answers with profanity are cleaned
- [ ] Stars replace inappropriate words

### Timer Expiration

- [ ] When prompt timer expires, game continues
- [ ] When voting timer expires, votes are counted

### Disconnected Players

- [ ] Disconnected players show as not connected
- [ ] Game can continue with disconnected players
- [ ] Reconnected players resume normal state

### Host Disconnect

- [ ] If host disconnects, game continues
- [ ] Other players can still play
- [ ] Host can reconnect and regain control

## Browser Compatibility

Test on these browsers:

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile:**
- [ ] Safari on iOS
- [ ] Chrome on Android
- [ ] Firefox on Android
- [ ] Samsung Internet

## Device Testing

- [ ] Desktop/Laptop (TV display)
- [ ] Tablet (TV display or phone controller)
- [ ] Phone (phone controller)
- [ ] Different screen sizes

## Performance Testing

- [ ] Test with 3 players (minimum)
- [ ] Test with 6 players (medium)
- [ ] Test with 12 players (maximum)
- [ ] Check memory usage over multiple rounds
- [ ] Verify no memory leaks after games end
- [ ] Test with slow network connection
- [ ] Test with high latency

## Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient
- [ ] Text is readable at all sizes
- [ ] Buttons are large enough for touch
- [ ] Error messages are clear

## Network Testing

- [ ] Test on localhost
- [ ] Test on local network (TV on WiFi, phones on same network)
- [ ] Test with TV and phones on different networks
- [ ] Test with mobile data (phones)
- [ ] Test through reverse proxy/load balancer

## Load Testing

Simple load test script (optional):

```javascript
// test-load.js
import { WebSocket } from 'ws';

const NUM_CONNECTIONS = 50;
const connections = [];

for (let i = 0; i < NUM_CONNECTIONS; i++) {
  const ws = new WebSocket('ws://localhost:3001');
  ws.on('open', () => console.log(`Connection ${i} opened`));
  ws.on('error', (err) => console.error(`Connection ${i} error:`, err));
  connections.push(ws);
}

setTimeout(() => {
  connections.forEach(ws => ws.close());
  console.log('All connections closed');
}, 30000);
```

Run: `node test-load.js`

## Automated Testing (Future)

Consider adding:
- Unit tests for game logic
- Integration tests for WebSocket communication
- End-to-end tests with Playwright
- Visual regression tests

## Bug Report Template

When reporting bugs, include:

```
**Description:** [Clear description of the bug]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:** [What should happen]

**Actual Behavior:** [What actually happens]

**Environment:**
- Browser: [e.g., Chrome 120]
- Device: [e.g., iPhone 14]
- OS: [e.g., iOS 17]
- Game State: [e.g., Lobby, Playing Round 2, Voting]
- Number of Players: [e.g., 5]

**Screenshots/Videos:** [If applicable]

**Console Errors:** [Any errors from browser console]
```

## Testing Status

Last tested: [Date]
Tested by: [Name]
Test environment: [Development/Staging/Production]
Overall status: [Pass/Fail]

## Known Issues

[List any known issues or limitations]

## Future Improvements

- [ ] Add automated test suite
- [ ] Add CI/CD pipeline with tests
- [ ] Add visual regression testing
- [ ] Add performance monitoring
- [ ] Add error tracking (e.g., Sentry)
