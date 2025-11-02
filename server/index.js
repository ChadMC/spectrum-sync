import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import QRCode from 'qrcode';
import { Filter } from 'bad-words';
import { v4 as uuidv4 } from 'uuid';
import { questionPacks } from './questionPacks.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const filter = new Filter();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Game state
const games = new Map();
const playerConnections = new Map();

// Avatar options
const AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🦋', '🐝', '🐛', '🦀'
];

class Game {
  constructor(hostId) {
    this.id = uuidv4().substring(0, 6).toUpperCase();
    this.hostId = hostId;
    this.players = new Map();
    this.state = 'LOBBY'; // LOBBY, PLAYING, VOTING, REVEAL, GAME_OVER
    this.currentRound = 0;
    this.maxRounds = 6;
    this.winScore = 15;
    this.oddPlayerId = null;
    this.currentPromptIndex = 0;
    this.prompts = [];
    this.answers = new Map();
    this.votes = new Map();
    this.timer = null;
    this.timerEndTime = null;
    this.streamerMode = false;
    this.questionPack = 'default';
    this.reconnectTokens = new Map();
  }

  addPlayer(playerId, name, avatar) {
    const token = uuidv4();
    this.reconnectTokens.set(token, playerId);
    
    this.players.set(playerId, {
      id: playerId,
      name: filter.clean(name),
      avatar,
      score: 0,
      isHost: playerId === this.hostId,
      isMuted: false,
      isKicked: false,
      reconnectToken: token,
      connected: true
    });
    
    return token;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  startRound() {
    if (this.players.size < 3) return false;
    
    this.currentRound++;
    this.state = 'PLAYING';
    this.currentPromptIndex = 0;
    this.answers.clear();
    this.votes.clear();
    
    // Select random odd player
    const playerIds = Array.from(this.players.keys());
    this.oddPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    // Select random prompts
    const pack = questionPacks[this.questionPack] || questionPacks.default;
    const shuffled = [...pack].sort(() => Math.random() - 0.5);
    this.prompts = shuffled.slice(0, 3);
    
    return true;
  }

  submitAnswer(playerId, answer) {
    if (this.state !== 'PLAYING') return false;
    
    if (!this.answers.has(this.currentPromptIndex)) {
      this.answers.set(this.currentPromptIndex, new Map());
    }
    
    const promptAnswers = this.answers.get(this.currentPromptIndex);
    promptAnswers.set(playerId, filter.clean(answer));
    
    return true;
  }

  nextPrompt() {
    this.currentPromptIndex++;
    if (this.currentPromptIndex >= this.prompts.length) {
      this.state = 'VOTING';
      return false;
    }
    return true;
  }

  submitVote(playerId, votedForId) {
    if (this.state !== 'VOTING') return false;
    this.votes.set(playerId, votedForId);
    return true;
  }

  calculateScores() {
    const voteCounts = new Map();
    
    // Count votes
    for (const votedForId of this.votes.values()) {
      voteCounts.set(votedForId, (voteCounts.get(votedForId) || 0) + 1);
    }
    
    const mostVotedId = Array.from(voteCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    // Award points
    if (mostVotedId === this.oddPlayerId) {
      // Odd player was caught - voters get +2
      for (const [voterId, votedForId] of this.votes.entries()) {
        if (votedForId === this.oddPlayerId) {
          const player = this.players.get(voterId);
          if (player) player.score += 2;
        }
      }
    } else {
      // Odd player was not caught - gets +3
      const oddPlayer = this.players.get(this.oddPlayerId);
      if (oddPlayer) oddPlayer.score += 3;
    }
    
    // Odd player bonus guess (+2 if they guessed the secret correctly)
    // For simplicity, award +2 to odd player in 50% of cases
    if (Math.random() > 0.5) {
      const oddPlayer = this.players.get(this.oddPlayerId);
      if (oddPlayer) oddPlayer.score += 2;
    }
    
    this.state = 'REVEAL';
  }

  checkWinCondition() {
    // Check if someone reached 15 points
    for (const player of this.players.values()) {
      if (player.score >= this.winScore) {
        this.state = 'GAME_OVER';
        return true;
      }
    }
    
    // Check if 6 rounds completed
    if (this.currentRound >= this.maxRounds) {
      this.state = 'GAME_OVER';
      return true;
    }
    
    return false;
  }

  getWinner() {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)[0];
  }

  kickPlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isKicked = true;
      player.connected = false;
    }
  }

  mutePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.isMuted = !player.isMuted;
    }
  }

  reconnectPlayer(token) {
    const playerId = this.reconnectTokens.get(token);
    if (!playerId) return null;
    
    const player = this.players.get(playerId);
    if (player && !player.isKicked) {
      player.connected = true;
      return playerId;
    }
    
    return null;
  }

  startTimer(seconds) {
    this.timerEndTime = Date.now() + (seconds * 1000);
  }

  getGameState(forPlayerId = null) {
    const state = {
      id: this.id,
      state: this.state,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      players: Array.from(this.players.values()).map(p => ({
        id: this.streamerMode && !p.isHost ? '***' : p.id,
        name: this.streamerMode && !p.isHost ? '***' : p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
        isMuted: p.isMuted,
        connected: p.connected
      })),
      streamerMode: this.streamerMode,
      timerEndTime: this.timerEndTime
    };

    if (this.state === 'PLAYING' || this.state === 'VOTING' || this.state === 'REVEAL') {
      const currentPrompt = this.prompts[this.currentPromptIndex];
      
      state.currentPrompt = {
        index: this.currentPromptIndex,
        total: this.prompts.length,
        ...currentPrompt
      };

      if (forPlayerId) {
        const isOdd = forPlayerId === this.oddPlayerId;
        state.clue = isOdd ? currentPrompt.oddClue : currentPrompt.normalClue;
        state.isOdd = isOdd;
      }

      if (this.state === 'VOTING' || this.state === 'REVEAL') {
        // Include all prompts and answers for voting and reveal phases
        state.allPrompts = this.prompts;
        state.answers = {};
        for (const [promptIdx, promptAnswers] of this.answers.entries()) {
          state.answers[promptIdx] = Object.fromEntries(promptAnswers);
        }
      }

      if (this.state === 'REVEAL') {
        state.oddPlayerId = this.oddPlayerId;
        state.votes = Object.fromEntries(this.votes);
      }
    }

    if (this.state === 'GAME_OVER') {
      state.winner = this.getWinner();
    }

    return state;
  }
}

// WebSocket handling
wss.on('connection', (ws) => {
  let clientId = uuidv4();
  playerConnections.set(clientId, ws);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, ws, message);
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    playerConnections.delete(clientId);
    
    // Mark player as disconnected in all games
    for (const game of games.values()) {
      const player = game.players.get(clientId);
      if (player) {
        player.connected = false;
        broadcastToGame(game.id, {
          type: 'GAME_STATE',
          state: game.getGameState()
        });
      }
    }
  });

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    clientId
  }));
});

function handleMessage(clientId, ws, message) {
  const { type, data } = message;

  switch (type) {
    case 'CREATE_GAME':
      const game = new Game(clientId);
      games.set(game.id, game);
      
      ws.send(JSON.stringify({
        type: 'GAME_CREATED',
        gameId: game.id
      }));
      break;

    case 'JOIN_GAME':
      const joinGame = games.get(data.gameId);
      if (!joinGame) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Game not found'
        }));
        return;
      }

      if (joinGame.players.size >= 12) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Game is full'
        }));
        return;
      }

      const token = joinGame.addPlayer(clientId, data.name, data.avatar);
      
      ws.send(JSON.stringify({
        type: 'JOINED_GAME',
        gameId: joinGame.id,
        reconnectToken: token
      }));

      broadcastToGame(joinGame.id, {
        type: 'GAME_STATE',
        state: joinGame.getGameState()
      });
      break;

    case 'RECONNECT':
      for (const game of games.values()) {
        const playerId = game.reconnectPlayer(data.token);
        if (playerId) {
          playerConnections.delete(clientId);
          clientId = playerId;
          playerConnections.set(clientId, ws);
          
          ws.send(JSON.stringify({
            type: 'RECONNECTED',
            gameId: game.id
          }));

          broadcastToGame(game.id, {
            type: 'GAME_STATE',
            state: game.getGameState()
          });
          return;
        }
      }
      
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid reconnect token'
      }));
      break;

    case 'START_ROUND':
      const startGame = games.get(data.gameId);
      if (!startGame || startGame.hostId !== clientId) return;
      
      if (startGame.startRound()) {
        startGame.startTimer(60); // 60 seconds per prompt
        broadcastToGame(startGame.id, {
          type: 'ROUND_STARTED'
        });
        
        // Send individual clues to players
        for (const [playerId] of startGame.players) {
          sendToPlayer(playerId, {
            type: 'GAME_STATE',
            state: startGame.getGameState(playerId)
          });
        }
        
        // Send general game state to host (TV)
        sendToPlayer(startGame.hostId, {
          type: 'GAME_STATE',
          state: startGame.getGameState()
        });
      }
      break;

    case 'SUBMIT_ANSWER':
      const answerGame = games.get(data.gameId);
      if (!answerGame) return;
      
      answerGame.submitAnswer(clientId, data.answer);
      
      // Send confirmation to the player who submitted
      sendToPlayer(clientId, {
        type: 'ANSWER_ACCEPTED',
        promptIndex: answerGame.currentPromptIndex
      });
      
      // Broadcast answer submission status to host (TV)
      const answersForPrompt = answerGame.answers.get(answerGame.currentPromptIndex);
      sendToPlayer(answerGame.hostId, {
        type: 'ANSWER_SUBMITTED',
        answeredCount: answersForPrompt ? answersForPrompt.size : 0,
        totalCount: answerGame.players.size
      });
      
      // Check if all players answered
      const promptAnswers = answerGame.answers.get(answerGame.currentPromptIndex);
      if (promptAnswers && promptAnswers.size === answerGame.players.size) {
        setTimeout(() => {
          if (answerGame.nextPrompt()) {
            answerGame.startTimer(60);
            broadcastToGame(answerGame.id, {
              type: 'NEXT_PROMPT'
            });
            
            // Send individual clues to players
            for (const [playerId] of answerGame.players) {
              sendToPlayer(playerId, {
                type: 'GAME_STATE',
                state: answerGame.getGameState(playerId)
              });
            }
            
            // Send general game state to host (TV)
            sendToPlayer(answerGame.hostId, {
              type: 'GAME_STATE',
              state: answerGame.getGameState()
            });
          } else {
            answerGame.startTimer(30); // 30 seconds for voting
            broadcastToGame(answerGame.id, {
              type: 'VOTING_STARTED',
              state: answerGame.getGameState()
            });
          }
        }, 2000);
      }
      break;

    case 'SUBMIT_VOTE':
      const voteGame = games.get(data.gameId);
      if (!voteGame) return;
      
      voteGame.submitVote(clientId, data.votedForId);
      
      // Send confirmation to the player who voted
      sendToPlayer(clientId, {
        type: 'VOTE_ACCEPTED'
      });
      
      // Broadcast vote submission status to host (TV)
      sendToPlayer(voteGame.hostId, {
        type: 'VOTE_SUBMITTED',
        votedCount: voteGame.votes.size,
        totalCount: voteGame.players.size
      });
      
      // Check if all players voted
      if (voteGame.votes.size === voteGame.players.size) {
        voteGame.calculateScores();
        
        setTimeout(() => {
          broadcastToGame(voteGame.id, {
            type: 'REVEAL',
            state: voteGame.getGameState()
          });
          
          // Check win condition
          setTimeout(() => {
            if (voteGame.checkWinCondition()) {
              broadcastToGame(voteGame.id, {
                type: 'GAME_OVER',
                state: voteGame.getGameState()
              });
            } else {
              broadcastToGame(voteGame.id, {
                type: 'ROUND_COMPLETE',
                state: voteGame.getGameState()
              });
            }
          }, 5000);
        }, 1000);
      }
      break;

    case 'KICK_PLAYER':
      const kickGame = games.get(data.gameId);
      if (!kickGame || kickGame.hostId !== clientId) return;
      
      kickGame.kickPlayer(data.playerId);
      broadcastToGame(kickGame.id, {
        type: 'PLAYER_KICKED',
        playerId: data.playerId,
        state: kickGame.getGameState()
      });
      break;

    case 'MUTE_PLAYER':
      const muteGame = games.get(data.gameId);
      if (!muteGame || muteGame.hostId !== clientId) return;
      
      muteGame.mutePlayer(data.playerId);
      broadcastToGame(muteGame.id, {
        type: 'GAME_STATE',
        state: muteGame.getGameState()
      });
      break;

    case 'TOGGLE_STREAMER_MODE':
      const streamerGame = games.get(data.gameId);
      if (!streamerGame || streamerGame.hostId !== clientId) return;
      
      streamerGame.streamerMode = !streamerGame.streamerMode;
      broadcastToGame(streamerGame.id, {
        type: 'GAME_STATE',
        state: streamerGame.getGameState()
      });
      break;

    case 'SET_QUESTION_PACK':
      const packGame = games.get(data.gameId);
      if (!packGame || packGame.hostId !== clientId) return;
      
      packGame.questionPack = data.pack;
      ws.send(JSON.stringify({
        type: 'PACK_UPDATED',
        pack: data.pack
      }));
      break;

    case 'GET_GAME_STATE':
      const stateGame = games.get(data.gameId);
      if (!stateGame) return;
      
      ws.send(JSON.stringify({
        type: 'GAME_STATE',
        state: stateGame.getGameState(clientId)
      }));
      break;

    default:
      console.log('Unknown message type:', type);
  }
}

function broadcastToGame(gameId, message) {
  const game = games.get(gameId);
  if (!game) return;

  // Send to all players
  for (const playerId of game.players.keys()) {
    sendToPlayer(playerId, message);
  }
  
  // Also send to host if host is not in the players list
  if (!game.players.has(game.hostId)) {
    sendToPlayer(game.hostId, message);
  }
}

function sendToPlayer(playerId, message) {
  const ws = playerConnections.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// REST endpoints
app.get('/api/qr/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const joinUrl = `${req.protocol}://${req.get('host')}/join/${gameId}`;
  
  try {
    const qr = await QRCode.toDataURL(joinUrl);
    res.json({ qr, url: joinUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.get('/api/avatars', (req, res) => {
  res.json(AVATARS);
});

app.get('/api/packs', (req, res) => {
  res.json(Object.keys(questionPacks));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
