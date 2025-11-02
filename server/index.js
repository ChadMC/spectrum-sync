import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import QRCode from 'qrcode';
import { Filter } from 'bad-words';
import { v4 as uuidv4 } from 'uuid';
import { spectrumPacks } from './spectrumPacks.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const filter = new Filter();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Game configuration
const WIN_SCORE = 15;
const MAX_ROUNDS = 6;
const PHASE_SECONDS = {
  SPECTRUM_REVEAL: 3,
  HINT: 35,
  VOTE: 10,
  PLACE: 20,
  REVEAL: 8,
  BUFFER: 5
};
const KIDS_MODE_TIME_BONUS = 5;

// Game state
const games = new Map();
const playerConnections = new Map();

// Avatar options
const AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', 
  '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🦋', '🐝', '🐛', '🦀'
];

/**
 * Normalizes text for duplicate detection by applying the following transformations:
 * 1. Convert to lowercase
 * 2. Trim and collapse multiple spaces into single space
 * 3. Remove punctuation (keeping only word characters, spaces, and emoji)
 * 4. Collapse repeated characters (e.g., "hellooo" -> "helo")
 * 5. Remove diacritical marks (e.g., "café" -> "cafe")
 * 
 * This ensures that hints like "Spicy!", "spicy", and "SPICY!!!" are treated as duplicates.
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\p{Emoji}]/gu, '')
    .replace(/(.)\1+/g, '$1') // collapse repeated characters
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove diacritics
}

// Check if text contains banned words
function containsBannedWords(text, bannedWords) {
  const normalized = normalizeText(text);
  return bannedWords.some(word => normalized.includes(word.toLowerCase()));
}

class Game {
  constructor(hostId) {
    this.id = uuidv4().substring(0, 6).toUpperCase();
    this.hostId = hostId;
    this.players = new Map();
    this.state = 'LOBBY'; // LOBBY, ROUND_START, HINT, VOTE, PLACE, REVEAL, GAME_OVER
    this.currentRound = 0;
    this.maxRounds = MAX_ROUNDS;
    this.winScore = WIN_SCORE;
    this.navigatorId = null;
    this.currentSpectrum = null;
    this.target = null;
    this.hints = new Map(); // playerId -> { text, normalized, canceled, resubmitted }
    this.votes = new Map(); // playerId -> [hintId1, hintId2]
    this.placement = null;
    this.timer = null;
    this.timerEndTime = null;
    this.kidsMode = false;
    this.duplicateMode = 'exact';
    this.spectrumPack = 'default';
    this.reconnectTokens = new Map();
    this.usedSpectrums = [];
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
      ready: false,
      connected: true,
      reconnectToken: token
    });
    
    return token;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  startRound() {
    if (this.players.size < 3) return false;
    
    this.currentRound++;
    this.state = 'ROUND_START';
    this.hints.clear();
    this.votes.clear();
    this.placement = null;
    
    // Rotate navigator
    const playerIds = Array.from(this.players.keys());
    if (this.navigatorId) {
      const currentIndex = playerIds.indexOf(this.navigatorId);
      this.navigatorId = playerIds[(currentIndex + 1) % playerIds.length];
    } else {
      this.navigatorId = playerIds[0];
    }
    
    // Select random spectrum (avoid recent repeats)
    const pack = spectrumPacks[this.spectrumPack] || spectrumPacks.default;
    const availableSpectrums = pack.filter(s => !this.usedSpectrums.includes(s.id));
    const spectrums = availableSpectrums.length > 0 ? availableSpectrums : pack;
    this.currentSpectrum = spectrums[Math.floor(Math.random() * spectrums.length)];
    this.usedSpectrums.push(this.currentSpectrum.id);
    if (this.usedSpectrums.length > 5) this.usedSpectrums.shift();
    
    // Generate random target (0-100)
    this.target = Math.floor(Math.random() * 101);
    
    return true;
  }

  submitHint(playerId, text) {
    if (this.state !== 'HINT') return { success: false, reason: 'Invalid state' };
    if (playerId === this.navigatorId) return { success: false, reason: 'Navigator cannot submit hints' };
    
    const player = this.players.get(playerId);
    if (!player) return { success: false, reason: 'Player not found' };
    
    // Check profanity
    if (filter.isProfane(text)) {
      return { success: false, reason: 'Profanity detected' };
    }
    
    // Check banned words
    if (containsBannedWords(text, this.currentSpectrum.banned)) {
      return { success: false, reason: 'Contains banned words' };
    }
    
    const normalized = normalizeText(text);
    const existingHint = this.hints.get(playerId);
    
    // Check if this is a resubmission after cancellation
    if (existingHint && existingHint.canceled && existingHint.resubmitted) {
      return { success: false, reason: 'Already resubmitted' };
    }
    
    this.hints.set(playerId, {
      id: playerId,
      text: text.trim(),
      normalized,
      canceled: false,
      resubmitted: existingHint?.canceled || false
    });
    
    return { success: true };
  }

  processDuplicates() {
    const normalizedMap = new Map(); // normalized -> [playerIds]
    
    for (const [playerId, hint] of this.hints.entries()) {
      if (!hint.canceled) {
        const existing = normalizedMap.get(hint.normalized) || [];
        existing.push(playerId);
        normalizedMap.set(hint.normalized, existing);
      }
    }
    
    // Mark duplicates as canceled
    const canceledPlayers = [];
    for (const [normalized, playerIds] of normalizedMap.entries()) {
      if (playerIds.length > 1) {
        for (const playerId of playerIds) {
          const hint = this.hints.get(playerId);
          if (!hint.resubmitted) {
            hint.canceled = true;
            canceledPlayers.push(playerId);
          }
        }
      }
    }
    
    return canceledPlayers;
  }

  getActiveHints() {
    const activeHints = [];
    for (const [playerId, hint] of this.hints.entries()) {
      if (!hint.canceled) {
        activeHints.push({ id: hint.id, text: hint.text });
      }
    }
    return activeHints;
  }

  submitVote(playerId, hintIds) {
    if (this.state !== 'VOTE') return { success: false, reason: 'Invalid state' };
    if (playerId === this.navigatorId) return { success: false, reason: 'Navigator cannot vote' };
    
    // Validate hintIds
    if (!Array.isArray(hintIds) || hintIds.length > 2) {
      return { success: false, reason: 'Can vote for max 2 hints' };
    }
    
    // Check for self-vote
    if (hintIds.includes(playerId)) {
      return { success: false, reason: 'Cannot vote for own hint' };
    }
    
    // Validate hint IDs exist and are not canceled
    for (const hintId of hintIds) {
      const hint = this.hints.get(hintId);
      if (!hint || hint.canceled) {
        return { success: false, reason: 'Invalid hint ID' };
      }
    }
    
    this.votes.set(playerId, hintIds);
    return { success: true };
  }

  calculateFinalClues() {
    const voteCounts = new Map();
    const activeHints = this.getActiveHints();
    
    // Count votes
    for (const hintIds of this.votes.values()) {
      for (const hintId of hintIds) {
        voteCounts.set(hintId, (voteCounts.get(hintId) || 0) + 1);
      }
    }
    
    // If no votes or no hints, return empty
    if (voteCounts.size === 0 || activeHints.length === 0) {
      return [];
    }
    
    // Find max vote count
    const maxVotes = Math.max(...voteCounts.values());
    
    // Return all hints tied for first place
    const finalClueIds = [];
    for (const [hintId, count] of voteCounts.entries()) {
      if (count === maxVotes) {
        finalClueIds.push(hintId);
      }
    }
    
    return finalClueIds;
  }

  submitPlacement(playerId, value) {
    if (this.state !== 'PLACE') return { success: false, reason: 'Invalid state' };
    if (playerId !== this.navigatorId) return { success: false, reason: 'Only Navigator can place' };
    if (value < 0 || value > 100) return { success: false, reason: 'Invalid value' };
    
    this.placement = Math.round(value);
    return { success: true };
  }

  calculateScores() {
    if (this.placement === null) return {};
    
    const distance = Math.abs(this.placement - this.target);
    const pointsPerPlayer = {};
    
    // Initialize all players to 0
    for (const playerId of this.players.keys()) {
      pointsPerPlayer[playerId] = 0;
    }
    
    // Team Proximity (everyone)
    let teamPoints = 0;
    if (distance <= 3) {
      teamPoints = 3; // Bullseye
    } else if (distance <= 10) {
      teamPoints = 2; // Close
    } else if (distance <= 24) {
      teamPoints = 1; // Decent
    }
    
    for (const playerId of this.players.keys()) {
      pointsPerPlayer[playerId] += teamPoints;
    }
    
    // Navigator Bonus
    if (distance <= 3) {
      pointsPerPlayer[this.navigatorId] += 2; // Bullseye bonus
    } else if (distance <= 10) {
      pointsPerPlayer[this.navigatorId] += 1; // Close bonus
    }
    
    // Assist (authors of Final Clues)
    const finalClueIds = this.calculateFinalClues();
    if (distance <= 24 && finalClueIds.length > 0) { // Decent or better
      for (const clueId of finalClueIds) {
        if (distance <= 3) {
          pointsPerPlayer[clueId] += 2; // Bullseye
        } else {
          pointsPerPlayer[clueId] += 1; // Decent or Close
        }
      }
    }
    
    // Voter Insight (voters who approved at least one Final Clue)
    if (distance <= 10) { // Close or Bullseye
      for (const [voterId, votedIds] of this.votes.entries()) {
        const approvedFinalClue = votedIds.some(id => finalClueIds.includes(id));
        if (approvedFinalClue) {
          pointsPerPlayer[voterId] += 1;
        }
      }
    }
    
    // Apply points to players
    for (const [playerId, points] of Object.entries(pointsPerPlayer)) {
      const player = this.players.get(playerId);
      if (player) {
        player.score += points;
      }
    }
    
    return {
      distance,
      pointsPerPlayer,
      finalClueIds,
      teamResult: distance <= 3 ? 'Bullseye' : distance <= 10 ? 'Close' : distance <= 24 ? 'Decent' : 'Off'
    };
  }

  checkWinCondition() {
    // Check if someone reached WIN_SCORE
    for (const player of this.players.values()) {
      if (player.score >= this.winScore) {
        this.state = 'GAME_OVER';
        return true;
      }
    }
    
    // Check if MAX_ROUNDS completed
    if (this.currentRound >= this.maxRounds) {
      this.state = 'GAME_OVER';
      return true;
    }
    
    return false;
  }

  getLeaderboard() {
    return Array.from(this.players.values())
      .map(p => ({ id: p.id, name: p.name, avatar: p.avatar, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  reconnectPlayer(token) {
    const playerId = this.reconnectTokens.get(token);
    if (!playerId) return null;
    
    const player = this.players.get(playerId);
    if (player) {
      player.connected = true;
      return playerId;
    }
    
    return null;
  }

  startTimer(seconds, onComplete = null) {
    this.timerEndTime = Date.now() + (seconds * 1000);
    
    // Clear any existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    // Set new timer with callback
    if (onComplete) {
      this.timer = setTimeout(() => {
        onComplete();
      }, seconds * 1000);
    }
  }
  
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getTimeBonus() {
    return this.kidsMode ? KIDS_MODE_TIME_BONUS : 0;
  }
  
  shouldShowTarget(forPlayerId) {
    // Show target to cluers (not navigator, not TV/host)
    return forPlayerId && forPlayerId !== this.navigatorId;
  }

  getGameState(forPlayerId = null) {
    const state = {
      id: this.id,
      state: this.state,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      winScore: this.winScore,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
        ready: p.ready,
        connected: p.connected
      })),
      navigatorId: this.navigatorId,
      kidsMode: this.kidsMode,
      timerEndTime: this.timerEndTime
    };

    if (this.state === 'ROUND_START' || this.state === 'HINT' || this.state === 'VOTE' || this.state === 'PLACE' || this.state === 'REVEAL') {
      if (this.currentSpectrum) {
        state.spectrum = {
          id: this.currentSpectrum.id,
          left: this.currentSpectrum.left,
          right: this.currentSpectrum.right
        };
      }

      // Show target to Cluers only (not to Navigator, not to TV/host)
      if (this.shouldShowTarget(forPlayerId)) {
        state.target = this.target;
      }
    }

    if (this.state === 'HINT') {
      const hintsSubmitted = Array.from(this.hints.values()).filter(h => !h.canceled).length;
      const totalCluers = this.players.size - 1; // excluding Navigator
      state.hintsSubmitted = hintsSubmitted;
      state.totalCluers = totalCluers;
    }

    if (this.state === 'VOTE') {
      // Show anonymous hints for voting
      state.hints = this.getActiveHints();
      state.votesSubmitted = this.votes.size;
      state.totalVoters = this.players.size - 1; // excluding Navigator
      
      // Also include target for cluers (for context when they refresh)
      if (this.shouldShowTarget(forPlayerId)) {
        state.target = this.target;
      }
    }

    if (this.state === 'PLACE') {
      const finalClueIds = this.calculateFinalClues();
      state.finalClues = finalClueIds.map(id => {
        const hint = this.hints.get(id);
        return { id, text: hint.text };
      });
      
      // Include target for cluers (for reference when they refresh)
      if (this.shouldShowTarget(forPlayerId)) {
        state.target = this.target;
      }
    }

    if (this.state === 'REVEAL') {
      state.target = this.target;
      state.placement = this.placement;
      const scores = this.calculateScores();
      state.distance = scores.distance;
      state.pointsPerPlayer = scores.pointsPerPlayer;
      state.teamResult = scores.teamResult;
      
      // Reveal Final Clue authors
      const finalClueIds = scores.finalClueIds;
      state.finalClueAuthors = finalClueIds.map(id => {
        const player = this.players.get(id);
        return { hintId: id, playerId: id, name: player?.name, avatar: player?.avatar };
      });
    }

    if (this.state === 'GAME_OVER') {
      state.leaderboard = this.getLeaderboard();
    }

    return state;
  }
}

// Phase transition helpers
function transitionToHintPhase(game) {
  if (game.state !== 'ROUND_START') return;
  
  game.state = 'HINT';
  const hintTime = PHASE_SECONDS.HINT + game.getTimeBonus();
  game.startTimer(hintTime, () => {
    // Auto-transition to VOTE phase
    transitionToVotePhase(game);
  });
  
  // Send individual states to show target to Cluers
  sendPlayerSpecificGameStates(game);
  
  // Also send HINT_PHASE_START message
  for (const [playerId] of game.players) {
    sendToPlayer(playerId, {
      type: 'HINT_PHASE_START',
      state: game.getGameState(playerId)
    });
  }
}

function transitionToVotePhase(game) {
  if (game.state !== 'HINT') return;
  
  // Process duplicates
  const canceledPlayers = game.processDuplicates();
  
  if (canceledPlayers.length > 0) {
    // Notify canceled players
    for (const playerId of canceledPlayers) {
      sendToPlayer(playerId, {
        type: 'HINT_CANCELED',
        reason: 'Duplicate detected - you may resubmit once'
      });
    }
  }
  
  // Transition to voting
  game.state = 'VOTE';
  game.startTimer(PHASE_SECONDS.VOTE, () => {
    // Auto-transition to PLACE phase
    transitionToPlacePhase(game);
  });
  
  broadcastToGame(game.id, {
    type: 'VOTE_START',
    hints: game.getActiveHints(),
    maxVotes: 2
  });
}

function transitionToPlacePhase(game) {
  if (game.state !== 'VOTE') return;
  
  game.state = 'PLACE';
  const placeTime = PHASE_SECONDS.PLACE + game.getTimeBonus();
  game.startTimer(placeTime, () => {
    // Auto-transition to REVEAL phase (with default placement if not set)
    transitionToRevealPhase(game);
  });
  
  const finalClueIds = game.calculateFinalClues();
  const finalClues = finalClueIds.map(id => {
    const hint = game.hints.get(id);
    return { id, text: hint.text };
  });
  
  broadcastToGame(game.id, {
    type: 'PLACE_START',
    finalClues,
    phase: 'PLACE'
  });
}

function transitionToRevealPhase(game) {
  if (game.state !== 'PLACE') return;
  
  // If navigator didn't place, use middle of scale (50 on 0-100 scale) as default
  if (game.placement === null) {
    game.placement = 50;
  }
  
  game.state = 'REVEAL';
  game.startTimer(PHASE_SECONDS.REVEAL, () => {
    // Auto-transition to next round or game over
    transitionAfterReveal(game);
  });
  
  const scores = game.calculateScores();
  
  broadcastToGame(game.id, {
    type: 'REVEAL',
    target: game.target,
    placement: game.placement,
    distance: scores.distance,
    pointsPerPlayer: scores.pointsPerPlayer,
    teamResult: scores.teamResult,
    finalClueAuthors: scores.finalClueIds.map(id => {
      const player = game.players.get(id);
      return { hintId: id, playerId: id, name: player?.name, avatar: player?.avatar };
    })
  });
}

function transitionAfterReveal(game) {
  if (game.state !== 'REVEAL') return;
  
  // Check win condition
  if (game.checkWinCondition()) {
    broadcastToGame(game.id, {
      type: 'GAME_OVER',
      leaderboard: game.getLeaderboard()
    });
  } else {
    // Wait buffer time then prepare for next round
    game.startTimer(PHASE_SECONDS.BUFFER, () => {
      // Return to lobby-like state, ready for next round
      game.state = 'LOBBY';
      broadcastToGame(game.id, {
        type: 'ROUND_COMPLETE',
        state: game.getGameState()
      });
    });
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
        sendPlayerSpecificGameStates(game);
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

      sendPlayerSpecificGameStates(joinGame);
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
            gameId: game.id,
            playerId: playerId
          }));

          sendPlayerSpecificGameStates(game);
          return;
        }
      }
      
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid reconnect token'
      }));
      break;

    case 'PLAYER_READY':
      const readyGame = games.get(data.gameId);
      if (!readyGame) return;
      
      const readyPlayer = readyGame.players.get(clientId);
      if (readyPlayer) {
        readyPlayer.ready = !readyPlayer.ready;
        broadcastToGame(readyGame.id, {
          type: 'ROOM_STATE',
          state: readyGame.getGameState()
        });
      }
      break;

    case 'START_ROUND':
      const startGame = games.get(data.gameId);
      if (!startGame || startGame.hostId !== clientId) return;
      
      if (startGame.startRound()) {
        startGame.state = 'ROUND_START';
        startGame.startTimer(PHASE_SECONDS.SPECTRUM_REVEAL, () => {
          // Auto-transition to HINT phase
          transitionToHintPhase(startGame);
        });
        
        broadcastToGame(startGame.id, {
          type: 'ROUND_START',
          round: startGame.currentRound,
          spectrum: {
            id: startGame.currentSpectrum.id,
            left: startGame.currentSpectrum.left,
            right: startGame.currentSpectrum.right
          },
          navigatorId: startGame.navigatorId,
          phase: 'ROUND_START'
        });
      }
      break;

    case 'HINT_SUBMIT':
      const hintGame = games.get(data.gameId);
      if (!hintGame) return;
      
      const result = hintGame.submitHint(clientId, data.text);
      
      sendToPlayer(clientId, {
        type: result.success ? 'HINT_ACCEPTED' : 'HINT_REJECTED',
        reason: result.reason
      });
      
      if (result.success) {
        // Broadcast hint count to host
        sendToPlayer(hintGame.hostId, {
          type: 'HINT_STATUS',
          hintsSubmitted: Array.from(hintGame.hints.values()).filter(h => !h.canceled).length,
          totalCluers: hintGame.players.size - 1
        });
      }
      break;

    case 'HINT_PHASE_COMPLETE':
      const completeHintGame = games.get(data.gameId);
      if (!completeHintGame || completeHintGame.hostId !== clientId) return;
      if (completeHintGame.state !== 'HINT') return;
      
      // Clear the auto-timer and manually transition
      completeHintGame.clearTimer();
      transitionToVotePhase(completeHintGame);
      break;

    case 'VOTE_CAST':
      const voteGame = games.get(data.gameId);
      if (!voteGame) return;
      
      const voteResult = voteGame.submitVote(clientId, data.hintIds);
      
      sendToPlayer(clientId, {
        type: voteResult.success ? 'VOTE_ACCEPTED' : 'VOTE_REJECTED',
        reason: voteResult.reason
      });
      
      if (voteResult.success) {
        // Broadcast vote count to host
        sendToPlayer(voteGame.hostId, {
          type: 'VOTE_STATUS',
          votesSubmitted: voteGame.votes.size,
          totalVoters: voteGame.players.size - 1
        });
      }
      break;

    case 'VOTE_PHASE_COMPLETE':
      const completeVoteGame = games.get(data.gameId);
      if (!completeVoteGame || completeVoteGame.hostId !== clientId) return;
      if (completeVoteGame.state !== 'VOTE') return;
      
      // Clear the auto-timer and manually transition
      completeVoteGame.clearTimer();
      transitionToPlacePhase(completeVoteGame);
      break;

    case 'PLACEMENT_SET':
      const placeGame = games.get(data.gameId);
      if (!placeGame) return;
      
      const placeResult = placeGame.submitPlacement(clientId, data.value);
      
      if (placeResult.success) {
        sendToPlayer(clientId, {
          type: 'PLACEMENT_ACCEPTED'
        });
      }
      break;

    case 'PLACEMENT_LOCK':
      const lockGame = games.get(data.gameId);
      if (!lockGame) return;
      if (lockGame.navigatorId !== clientId) return;
      if (lockGame.state !== 'PLACE') return;
      if (lockGame.placement === null) return;
      
      // Clear the auto-timer and manually transition
      lockGame.clearTimer();
      transitionToRevealPhase(lockGame);
      break;

    case 'TOGGLE_KIDS_MODE':
      const kidsGame = games.get(data.gameId);
      if (!kidsGame || kidsGame.hostId !== clientId) return;
      
      kidsGame.kidsMode = !kidsGame.kidsMode;
      broadcastToGame(kidsGame.id, {
        type: 'ROOM_STATE',
        state: kidsGame.getGameState()
      });
      break;

    case 'SET_SPECTRUM_PACK':
      const packGame = games.get(data.gameId);
      if (!packGame || packGame.hostId !== clientId) return;
      
      packGame.spectrumPack = data.pack;
      ws.send(JSON.stringify({
        type: 'PACK_UPDATED',
        pack: data.pack
      }));
      break;

    case 'GET_GAME_STATE':
      const stateGame = games.get(data.gameId);
      if (!stateGame) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Game not found'
        }));
        return;
      }
      
      // Send player-specific state (includes target for cluers, etc.)
      sendToPlayer(clientId, {
        type: 'ROOM_STATE',
        state: stateGame.getGameState(clientId)
      });
      break;

    case 'ADD_TIME':
      const timeGame = games.get(data.gameId);
      if (!timeGame || timeGame.hostId !== clientId) return;
      
      if (timeGame.timerEndTime && timeGame.timer) {
        // Add 10 seconds to the timer
        timeGame.timerEndTime += 10000;
        
        // Clear and restart the timer with the new duration
        const remainingTime = Math.max(0, Math.ceil((timeGame.timerEndTime - Date.now()) / 1000));
        
        // Store the original callback before clearing
        const currentState = timeGame.state;
        timeGame.clearTimer();
        
        // Restart timer with appropriate callback based on current state
        let callback = null;
        switch (currentState) {
          case 'HINT':
            callback = () => transitionToVotePhase(timeGame);
            break;
          case 'VOTE':
            callback = () => transitionToPlacePhase(timeGame);
            break;
          case 'PLACE':
            callback = () => transitionToRevealPhase(timeGame);
            break;
          case 'REVEAL':
            callback = () => transitionAfterReveal(timeGame);
            break;
        }
        
        if (callback) {
          timeGame.timer = setTimeout(callback, remainingTime * 1000);
        }
        
        broadcastToGame(timeGame.id, {
          type: 'TIME_ADDED',
          newEndTime: timeGame.timerEndTime
        });
      }
      break;

    default:
      console.log('Unknown message type:', type);
  }
}

/**
 * Sends player-specific game states to all players in a game.
 * This ensures that cluers receive the target value while navigators don't.
 * Also sends game state to the host if they're not in the players list.
 */
function sendPlayerSpecificGameStates(game) {
  // Send player-specific game states to ensure cluers get target value
  for (const [pId] of game.players) {
    sendToPlayer(pId, {
      type: 'ROOM_STATE',
      state: game.getGameState(pId)
    });
  }
  // Also send to host if host is not in the players list
  if (!game.players.has(game.hostId)) {
    sendToPlayer(game.hostId, {
      type: 'ROOM_STATE',
      state: game.getGameState()
    });
  }
}

function broadcastToGame(gameId, message) {
  const game = games.get(gameId);
  if (!game) return;

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
  res.json(Object.keys(spectrumPacks));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
