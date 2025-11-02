# 🎯 Odd Ball Out

A TV-hosted, phone-controlled multiplayer bluffing game where one player is secretly different from the others!

## Game Overview

**Odd Ball Out** is an exciting party game for 3-12 players (ages 9+) where:
- One random player is the "Odd One Out" with a different secret clue
- Players answer 2-3 quick prompts (text, emoji, or multiple choice)
- Everyone discusses to figure out who's odd
- Players vote to eliminate the suspected odd player
- Score points for correct votes or surviving as the odd player

## Features

✅ **TV-Hosted Display**: Beautiful large screen display for everyone to see  
✅ **Phone Controller**: Each player uses their phone to join and play  
✅ **QR Code Join**: Quick and easy joining via QR code or game code  
✅ **Avatar Selection**: Fun emoji avatars for each player  
✅ **Multiple Question Types**: Text input, emoji selection, and multiple choice  
✅ **Real-time WebSocket**: Instant updates across all devices  
✅ **Reconnection Support**: Players can rejoin if disconnected  
✅ **Profanity Filter**: Keeps the game family-friendly  
✅ **Host Controls**: Kick/mute players as needed  
✅ **Question Packs**: Multiple themed question sets (default, party, family, kids)  
✅ **Scoreboard**: Live score tracking  
✅ **Streamer Mode**: Hide player names/IDs for streaming  
✅ **Timers**: Keep the game moving with round timers  

## Scoring System

- **+2 points**: Correct voters (if odd player is caught)
- **+3 points**: Odd player (if they avoid detection)
- **+2 points**: Odd player bonus (for correct guess)

## Win Conditions

Game ends when:
- A player reaches **15 points**, or
- **6 rounds** are completed

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ChadMC/odd-ball-out.git
cd odd-ball-out
```

2. Install dependencies for both server and client:
```bash
npm run install-all
```

Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

## Running the Game

### Development Mode

Run both server and client together:
```bash
npm run dev
```

Or run them separately:

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

The server will run on `http://localhost:3001`  
The client will run on `http://localhost:5173`

## How to Play

1. **Host Setup**: 
   - Open the game on a TV/large screen
   - Click "Host Game on TV"
   - Display the QR code and game code

2. **Players Join**:
   - Scan QR code or visit the URL on phones
   - Enter name and pick an avatar
   - Wait for host to start

3. **Gameplay**:
   - Each round, one player is randomly selected as "Odd"
   - All players receive secret clues (odd player gets different clue)
   - Answer 2-3 prompts based on your clue
   - Discuss with other players (keep your clue secret!)
   - Vote for who you think is the odd player
   - See results and earn points

4. **Winning**:
   - First to 15 points wins!
   - Or highest score after 6 rounds

## Project Structure

```
odd-ball-out/
├── server/              # Node.js WebSocket server
│   ├── index.js         # Main server logic
│   └── questionPacks.js # Question sets
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── TVDisplay.jsx     # TV host view
│   │   │   └── PhoneController.jsx # Player phone view
│   │   └── hooks/
│   │       └── useWebSocket.js   # WebSocket hook
│   └── public/
└── package.json         # Root package file
```

## Technology Stack

**Server:**
- Express.js - HTTP server
- ws - WebSocket server
- bad-words - Profanity filter
- qrcode - QR code generation
- uuid - Unique identifiers

**Client:**
- React - UI framework
- Vite - Build tool
- qrcode.react - QR code display
- WebSocket API - Real-time communication

## Configuration

### Server Environment
Edit `server/index.js` to change:
- Port (default: 3001)
- Max players (default: 12)
- Win score (default: 15)
- Max rounds (default: 6)

### Client Environment
Edit `client/.env`:
```
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001
```

## Question Packs

The game includes several question packs:
- **default**: General questions for all ages
- **party**: Fun party-themed questions
- **family**: Family-friendly topics
- **kids**: Kid-friendly questions

Edit `server/questionPacks.js` to add custom question packs.

## Deployment

### Build for Production

```bash
cd client
npm run build
```

The built files will be in `client/dist/`

### Deploy Server

Deploy the `server/` directory to any Node.js hosting service.

### Deploy Client

Deploy the `client/dist/` directory to any static hosting service (Netlify, Vercel, etc.)

## Contributing

Feel free to submit issues and pull requests!

## License

ISC License

## Credits

Created for fun party gaming experiences! 🎮🎉
