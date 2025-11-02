# Quick Start Guide

Get the Odd Ball Out game running in 5 minutes!

## Prerequisites

- Node.js v18+ installed ([Download here](https://nodejs.org/))
- A computer/laptop for the TV display
- 3+ smartphones for players

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ChadMC/odd-ball-out.git
   cd odd-ball-out
   ```

2. **Install dependencies:**
   ```bash
   npm run install-all
   ```
   
   This installs packages for both server and client.

## Running the Game

### Option 1: Run Both Together (Recommended)

```bash
npm run dev
```

This starts:
- Server on `http://localhost:3001`
- Client on `http://localhost:5173`

### Option 2: Run Separately

**Terminal 1 - Server:**
```bash
cd server
npm start
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

## Playing the Game

### Step 1: Set Up TV Display

1. Open `http://localhost:5173` in a browser on your TV/large screen
2. Click **"Host Game on TV"**
3. A game code and QR code will appear

### Step 2: Players Join

**Option A - Scan QR Code:**
- Players scan the QR code with their phone cameras
- Browser opens automatically

**Option B - Manual Entry:**
- Players open `http://localhost:5173` on their phones
- Enter the 6-character game code
- Type their name
- Choose an avatar

### Step 3: Start Playing

1. Wait for all players to join (3-12 players)
2. Host clicks **"Start Round"** on TV
3. Players receive secret clues on their phones:
   - One random player is "Odd" (gets different clue)
   - Others are "Normal" (get same clue)
4. Everyone answers 2-3 quick questions
5. Discuss together who you think is the Odd one
6. Vote on your phone
7. See results and scores!
8. Repeat for 6 rounds or until someone reaches 15 points

## Game Rules Summary

### Objective
- **Normal Players:** Find and vote out the Odd player
- **Odd Player:** Blend in and avoid detection

### Scoring
- **+2 points:** Voters who correctly identify the Odd player
- **+3 points:** Odd player if they avoid being caught
- **+2 bonus:** Odd player for correct guess (random)

### Winning
- First to **15 points**, OR
- Highest score after **6 rounds**

## Troubleshooting

### Server won't start
```
Error: listen EADDRINUSE :::3001
```
**Solution:** Port 3001 is in use. Kill the process or change the port in `server/index.js`

### Client won't start
```
Error: Port 5173 is already in use
```
**Solution:** Port 5173 is in use. Vite will automatically try the next available port.

### Players can't connect from phones

**Issue 1: Different Networks**
- TV and phones must be on same WiFi network for localhost to work
- Alternative: Use `ngrok` to expose your server

**Issue 2: Firewall**
- Ensure firewall allows connections on port 3001
- Try disabling firewall temporarily to test

**Issue 3: Wrong URL**
- Check that phones are using the correct URL
- On Mac, use your computer's IP address instead of `localhost`
  - Find IP: `System Preferences → Network`
  - Use: `http://YOUR_IP:5173`

### WebSocket connection fails

**Check:**
1. Server is running on port 3001
2. No proxy blocking WebSocket connections
3. Browser supports WebSocket (all modern browsers do)

### Game freezes or doesn't progress

**Solution:**
- Refresh the page
- Players can reconnect using their saved token
- If persists, restart the server

## Tips for Best Experience

### Network Setup
- Use 5GHz WiFi for lower latency
- Keep router close to playing area
- Ensure strong signal for all devices

### Hardware
- Use largest screen available for TV display
- Ensure phones are charged
- Have backup device in case of issues

### Gameplay
- Set 30-second timer for discussions
- Encourage everyone to participate
- Take breaks between games
- Try different question packs

### For Streamers
- Enable **Streamer Mode** to hide player names
- Position camera to avoid showing phone screens
- Explain rules clearly to viewers
- Interact with chat during discussion phase

## Next Steps

- Read [README.md](README.md) for full feature list
- Check [TESTING.md](TESTING.md) for comprehensive testing
- See [DEPLOYMENT.md](DEPLOYMENT.md) to host publicly
- Review [API.md](API.md) to understand the architecture

## Need Help?

- Check existing [GitHub Issues](https://github.com/ChadMC/odd-ball-out/issues)
- Open a new issue with:
  - Description of problem
  - Steps to reproduce
  - Error messages
  - Browser/device info

## Have Fun! 🎉

Enjoy playing Odd Ball Out with friends and family!

---

**Pro Tips:**
- 🎭 As the Odd player, try to match the normal players' style
- 🕵️ As normal players, look for subtle differences in answers
- 💬 Discuss thoroughly but watch the timer
- 🎯 Pay attention to everyone's reactions during reveal
- 🏆 First game is practice - strategy develops with experience!
