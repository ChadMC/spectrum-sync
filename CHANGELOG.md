# Changelog

All notable changes to the Odd Ball Out game will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-01

### Added

#### Core Game Features
- TV-hosted display for group viewing
- Phone-controlled player interface
- Support for 3-12 players (ages 9+)
- QR code and game code joining system
- 20 emoji avatar options for players
- Secret clue system (one player is "Odd")
- 2-3 prompt rounds per game
- Multiple input types:
  - Text input (with no-typing option via emoji/MC)
  - Emoji selection
  - Multiple choice
- Discussion phase between rounds
- Voting mechanism to identify the Odd player
- Automatic scoring system:
  - +2 points for voters who correctly identify Odd
  - +3 points for Odd player if they avoid detection
  - +2 bonus points for Odd player (conditional)
- Win conditions:
  - First player to reach 15 points
  - Highest score after 6 rounds

#### UI/UX Features
- Beautiful gradient design with purple theme
- Responsive layouts for TV and phone
- Real-time updates across all devices
- Timer displays for each phase
- Live scoreboard with ranking
- Player status indicators (connected/disconnected)
- Host controls in TV view
- Smooth transitions between game phases

#### Technical Features
- WebSocket-based real-time communication
- Reconnection token system for dropped connections
- Profanity filter using bad-words library
- Game state management on server
- Client-side state synchronization

#### Host Controls
- Kick player functionality
- Mute/unmute player functionality
- Streamer mode (hides player names/IDs)
- Question pack selection
- Manual game start control

#### Question Packs
- **Default Pack**: General questions for all ages
- **Party Pack**: Fun party-themed questions
- **Family Pack**: Family-friendly topics
- **Kids Pack**: Kid-appropriate questions

Each pack includes:
- Mix of text, emoji, and multiple-choice questions
- Secret clues for normal and odd players
- Age-appropriate content

#### Developer Experience
- Monorepo structure (server + client)
- Environment variable configuration
- Hot module replacement in development
- Production build system
- Comprehensive documentation

#### Documentation
- README with game overview and setup instructions
- DEPLOYMENT guide for production hosting
- TESTING guide with manual test checklist
- Code comments and JSDoc annotations

### Technical Stack

**Server:**
- Node.js with ES modules
- Express.js for HTTP server
- ws library for WebSocket server
- bad-words for profanity filtering
- qrcode for QR code generation
- uuid for unique identifiers
- cors for cross-origin support

**Client:**
- React 18 with Hooks
- Vite for build tooling
- qrcode.react for QR display
- Native WebSocket API
- CSS3 with modern features

### Security
- Input sanitization with profanity filter
- WebSocket connection validation
- Environment-based configuration
- No exposed secrets or credentials
- Clean separation of concerns

### Performance
- Optimized WebSocket message handling
- Efficient state updates
- Minimal re-renders with React hooks
- Production build optimization
- Gzipped assets

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

### Known Limitations
- No persistent data storage (games are ephemeral)
- No authentication system
- Single server instance (no horizontal scaling yet)
- No game replay or history
- Timer sync depends on system clocks

### Future Considerations
- Add database for game history
- Implement user accounts and profiles
- Add more question packs
- Support for custom question creation
- Game statistics and analytics
- Chat functionality
- Sound effects and animations
- Internationalization (i18n)
- Accessibility improvements
- Mobile app versions

## [0.1.0] - 2025-11-01 (Development)

### Added
- Initial project setup
- Basic server implementation
- Basic client implementation
- Core game logic
- WebSocket communication

---

## Version History

- **1.0.0** - Initial production release with all core features
- **0.1.0** - Development version (not released)
