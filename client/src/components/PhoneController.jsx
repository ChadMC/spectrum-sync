import { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import './PhoneController.css'

function PhoneController({ gameId: initialGameId }) {
  const [gameId, setGameId] = useState(initialGameId)
  const [joined, setJoined] = useState(false)
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [avatars, setAvatars] = useState([])
  const [hintText, setHintText] = useState('')
  const [hasSubmittedHint, setHasSubmittedHint] = useState(false)
  const [selectedVotes, setSelectedVotes] = useState([])
  const [hasSubmittedVote, setHasSubmittedVote] = useState(false)
  const [placementValue, setPlacementValue] = useState(50)
  const ws = useWebSocket()

  useEffect(() => {
    // Fetch available avatars
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    fetch(`${apiUrl}/api/avatars`)
      .then(res => res.json())
      .then(data => {
        setAvatars(data)
        setSelectedAvatar(data[0])
      })
      .catch(err => console.error('Failed to fetch avatars:', err))
  }, [])

  useEffect(() => {
    const lastMessage = ws.messages[ws.messages.length - 1]
    
    if (lastMessage?.type === 'JOINED_GAME') {
      setJoined(true)
      ws.saveReconnectToken(lastMessage.reconnectToken)
      ws.clearMessages()
    } else if (lastMessage?.type === 'RECONNECTED') {
      setJoined(true)
      setGameId(lastMessage.gameId)
      ws.clearMessages()
    } else if (lastMessage?.type === 'ERROR') {
      alert(lastMessage.message)
      ws.clearMessages()
    } else if (lastMessage?.type === 'HINT_ACCEPTED') {
      setHasSubmittedHint(true)
      setHintText('')
      ws.clearMessages()
    } else if (lastMessage?.type === 'HINT_REJECTED') {
      alert(lastMessage.reason || 'Hint rejected')
      ws.clearMessages()
    } else if (lastMessage?.type === 'HINT_CANCELED') {
      setHasSubmittedHint(false)
      alert(lastMessage.reason || 'Your hint was canceled due to duplicate')
      ws.clearMessages()
    } else if (lastMessage?.type === 'VOTE_ACCEPTED') {
      setHasSubmittedVote(true)
      ws.clearMessages()
    } else if (lastMessage?.type === 'VOTE_REJECTED') {
      alert(lastMessage.reason || 'Vote rejected')
      ws.clearMessages()
    } else if (lastMessage?.type === 'PLACEMENT_ACCEPTED') {
      ws.clearMessages()
    } else if (lastMessage?.type === 'ROUND_START' || lastMessage?.type === 'HINT_PHASE_START') {
      // Reset state for new round
      setHasSubmittedHint(false)
      setHasSubmittedVote(false)
      setSelectedVotes([])
      setHintText('')
      setPlacementValue(50)
      ws.clearMessages()
    } else if (lastMessage?.type === 'VOTE_START') {
      // Reset vote state
      setHasSubmittedVote(false)
      setSelectedVotes([])
      ws.clearMessages()
    } else if (lastMessage?.type === 'PLACE_START') {
      // Reset placement
      setPlacementValue(50)
      ws.clearMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.messages])

  const handleJoin = (e) => {
    e.preventDefault()
    if (gameId && name.trim() && selectedAvatar) {
      ws.joinGame(gameId, name.trim(), selectedAvatar)
    }
  }

  const handleSubmitHint = () => {
    if (hintText.trim()) {
      ws.submitHint(gameId, hintText.trim())
    }
  }

  const handleToggleVote = (hintId) => {
    if (selectedVotes.includes(hintId)) {
      setSelectedVotes(selectedVotes.filter(id => id !== hintId))
    } else if (selectedVotes.length < 2) {
      setSelectedVotes([...selectedVotes, hintId])
    }
  }

  const handleSubmitVote = () => {
    ws.submitVote(gameId, selectedVotes)
  }

  const handleLockPlacement = () => {
    ws.submitPlacement(gameId, placementValue)
    ws.lockPlacement(gameId)
  }

  const handlePlacementChange = (e) => {
    const value = parseInt(e.target.value)
    setPlacementValue(value)
    ws.submitPlacement(gameId, value)
  }

  if (!ws.connected) {
    return (
      <div className="phone-loading">
        <div className="spinner"></div>
        <p>Connecting...</p>
      </div>
    )
  }

  if (!joined) {
    return (
      <div className="phone-join">
        <h1 className="phone-title">🌈 Join Game</h1>
        
        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label>Game Code</label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              placeholder="Enter code"
              maxLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label>Pick an Avatar</label>
            <div className="avatar-grid">
              {avatars.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            Join Game 🎮
          </button>
        </form>
      </div>
    )
  }

  if (!ws.gameState) {
    return (
      <div className="phone-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  const myPlayerId = ws.clientId
  const isNavigator = ws.gameState.navigatorId === myPlayerId
  const gameState = ws.gameState.state

  // Lobby state
  if (gameState === 'LOBBY') {
    const players = ws.gameState.players || []
    const myPlayer = players.find(p => p.id === myPlayerId)

    return (
      <div className="phone-lobby">
        <h1 className="phone-title">🧭 Spectrum Sync</h1>
        <div className="game-code-display">
          <p>Game Code:</p>
          <h2 className="code">{gameId}</h2>
        </div>

        <div className="my-player-card">
          <span className="avatar-large">{myPlayer?.avatar}</span>
          <h3>{myPlayer?.name}</h3>
          <p className="score">{myPlayer?.score} points</p>
        </div>

        <div className="waiting-message">
          <p>Waiting for host to start the game...</p>
          <p className="player-count">{players.length}/12 players</p>
        </div>

        <div className="players-list">
          <h3>Players:</h3>
          {players.map(player => (
            <div key={player.id} className="player-item">
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.name}</span>
              {player.isHost && <span className="host-badge">👑</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Round start state
  if (gameState === 'ROUND_START') {
    const spectrum = ws.gameState.spectrum
    const navigator = ws.gameState.players?.find(p => p.id === ws.gameState.navigatorId)

    return (
      <div className="phone-round-start">
        <h1 className="phase-title">🧭 New Round!</h1>
        <h2>Round {ws.gameState.currentRound}/{ws.gameState.maxRounds}</h2>

        {spectrum && (
          <div className="spectrum-info">
            <div className="spectrum-labels">
              <span className="left">{spectrum.left}</span>
              <span className="divider">↔</span>
              <span className="right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <div className="navigator-announcement">
          <h3>Navigator this round:</h3>
          <div className="navigator-card">
            <span className="avatar-large">{navigator?.avatar}</span>
            <span className="name-large">{navigator?.name}</span>
          </div>
          {isNavigator && (
            <p className="navigator-note">You'll place the slider after seeing the hints!</p>
          )}
          {!isNavigator && (
            <p className="cluer-note">You'll submit a hint to help the Navigator!</p>
          )}
        </div>
      </div>
    )
  }

  // Hint phase
  if (gameState === 'HINT') {
    const spectrum = ws.gameState.spectrum
    const target = ws.gameState.target

    if (isNavigator) {
      return (
        <div className="phone-hint-navigator">
          <h1 className="phase-title">🧭 You're the Navigator!</h1>
          <Timer endTime={ws.gameState.timerEndTime} />

          {spectrum && (
            <div className="spectrum-info">
              <div className="spectrum-labels">
                <span className="left">{spectrum.left}</span>
                <span className="divider">↔</span>
                <span className="right">{spectrum.right}</span>
              </div>
            </div>
          )}

          <div className="waiting-message">
            <p>Wait for the Cluers to submit their hints...</p>
            <p className="instruction">You'll see the winning hints and place a slider from 0-100!</p>
          </div>
        </div>
      )
    }

    // Cluer view
    return (
      <div className="phone-hint-cluer">
        <h1 className="phase-title">💡 Submit Your Hint</h1>
        <Timer endTime={ws.gameState.timerEndTime} />

        {spectrum && (
          <div className="spectrum-info">
            <div className="spectrum-labels">
              <span className="left">{spectrum.left}</span>
              <span className="divider">↔</span>
              <span className="right">{spectrum.right}</span>
            </div>
            <div className="target-display">
              <h2>🎯 Target: {target}</h2>
              <p className="target-hint">Help the Navigator guess this value!</p>
            </div>
          </div>
        )}

        {!hasSubmittedHint ? (
          <div className="hint-input">
            <label>Your Hint (short and helpful!):</label>
            <textarea
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="Enter a hint..."
              maxLength={100}
              rows={3}
            />
            <div className="char-count">{hintText.length}/100</div>
            <button 
              onClick={handleSubmitHint}
              disabled={!hintText.trim()}
              className="btn btn-primary btn-large"
            >
              Submit Hint ✓
            </button>
          </div>
        ) : (
          <div className="hint-submitted">
            <div className="success-icon">✓</div>
            <h3>Hint Submitted!</h3>
            <p>Wait for others to submit...</p>
          </div>
        )}
      </div>
    )
  }

  // Vote phase
  if (gameState === 'VOTE') {
    const hints = ws.gameState.hints || []

    if (isNavigator) {
      return (
        <div className="phone-vote-navigator">
          <h1 className="phase-title">🧭 You're the Navigator!</h1>
          <Timer endTime={ws.gameState.timerEndTime} />

          <div className="waiting-message">
            <p>Cluers are voting on the best hints...</p>
            <p className="instruction">You'll see the winning hints next!</p>
          </div>
        </div>
      )
    }

    // Cluer view
    return (
      <div className="phone-vote-cluer">
        <h1 className="phase-title">🗳️ Vote for Best Hints</h1>
        <Timer endTime={ws.gameState.timerEndTime} />

        <p className="vote-instruction">
          Select up to 2 hints that will best help the Navigator.
          <br />
          <small>(Hints are anonymous - you can't vote for your own)</small>
        </p>

        <div className="hints-list">
          {hints.map((hint, index) => {
            const isMyHint = hint.id === myPlayerId
            const isSelected = selectedVotes.includes(hint.id)
            const canSelect = !isMyHint && (isSelected || selectedVotes.length < 2)

            return (
              <div
                key={hint.id}
                className={`hint-vote-item ${isMyHint ? 'my-hint' : ''} ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                onClick={() => !isMyHint && canSelect && !hasSubmittedVote && handleToggleVote(hint.id)}
              >
                <span className="hint-number">#{index + 1}</span>
                <span className="hint-text">{hint.text}</span>
                {isMyHint && <span className="my-hint-badge">Your hint</span>}
                {isSelected && <span className="vote-badge">✓</span>}
              </div>
            )
          })}
        </div>

        {!hasSubmittedVote ? (
          <button 
            onClick={handleSubmitVote}
            disabled={selectedVotes.length === 0}
            className="btn btn-primary btn-large"
          >
            Submit Vote{selectedVotes.length > 0 ? ` (${selectedVotes.length})` : ''} ✓
          </button>
        ) : (
          <div className="vote-submitted">
            <div className="success-icon">✓</div>
            <h3>Vote Submitted!</h3>
            <p>Wait for others to vote...</p>
          </div>
        )}
      </div>
    )
  }

  // Placement phase
  if (gameState === 'PLACE') {
    const spectrum = ws.gameState.spectrum
    const finalClues = ws.gameState.finalClues || []

    if (!isNavigator) {
      return (
        <div className="phone-place-cluer">
          <h1 className="phase-title">🎯 Navigator Placing</h1>
          <Timer endTime={ws.gameState.timerEndTime} />

          <div className="waiting-message">
            <p>Wait for the Navigator to place the slider...</p>
          </div>

          <div className="final-clues-display">
            <h3>Final Clues Shown to Navigator:</h3>
            {finalClues.length === 0 ? (
              <p className="no-clues">No clues! Navigator is guessing blind!</p>
            ) : (
              <div className="clues-list">
                {finalClues.map((clue) => (
                  <div key={clue.id} className="clue-item">
                    <span className="clue-text">"{clue.text}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Navigator view
    return (
      <div className="phone-place-navigator">
        <h1 className="phase-title">🎯 Place Your Guess</h1>
        <Timer endTime={ws.gameState.timerEndTime} />

        {spectrum && (
          <div className="spectrum-info">
            <div className="spectrum-labels">
              <span className="left">{spectrum.left}</span>
              <span className="divider">↔</span>
              <span className="right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <div className="final-clues-display">
          <h3>Your Clues:</h3>
          {finalClues.length === 0 ? (
            <p className="no-clues">No clues selected! Make your best guess!</p>
          ) : (
            <div className="clues-list">
              {finalClues.map((clue) => (
                <div key={clue.id} className="clue-item">
                  <span className="clue-text">"{clue.text}"</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="placement-slider">
          <h3>Place the slider: {placementValue}</h3>
          <div className="slider-container">
            <span className="slider-label">0</span>
            <input
              type="range"
              min="0"
              max="100"
              value={placementValue}
              onChange={handlePlacementChange}
              className="slider"
            />
            <span className="slider-label">100</span>
          </div>
          <div className="value-display">{placementValue}</div>
        </div>

        <button 
          onClick={handleLockPlacement}
          className="btn btn-primary btn-large"
        >
          Lock In Guess 🔒
        </button>
      </div>
    )
  }

  // Reveal phase
  if (gameState === 'REVEAL') {
    const target = ws.gameState.target
    const placement = ws.gameState.placement
    const distance = ws.gameState.distance
    const teamResult = ws.gameState.teamResult
    const pointsPerPlayer = ws.gameState.pointsPerPlayer || {}
    const myPoints = pointsPerPlayer[myPlayerId] || 0
    const players = ws.gameState.players || []
    const myPlayer = players.find(p => p.id === myPlayerId)

    return (
      <div className="phone-reveal">
        <h1 className="phase-title">🎉 Results!</h1>

        <div className="result-summary">
          <div className="result-values">
            <div className="result-item">
              <span className="label">🎯 Target:</span>
              <span className="value">{target}</span>
            </div>
            <div className="result-item">
              <span className="label">📍 Guess:</span>
              <span className="value">{placement}</span>
            </div>
            <div className="result-item">
              <span className="label">📏 Distance:</span>
              <span className="value">{distance}</span>
            </div>
          </div>
          <h2 className={`result-${teamResult?.toLowerCase()}`}>{teamResult}!</h2>
        </div>

        <div className="my-points">
          <h3>You earned:</h3>
          <div className={`points-display ${myPoints > 0 ? 'positive' : ''}`}>
            +{myPoints} points
          </div>
          <div className="my-score">
            <span className="avatar-large">{myPlayer?.avatar}</span>
            <span className="name">{myPlayer?.name}</span>
            <span className="score">{myPlayer?.score} pts total</span>
          </div>
        </div>
      </div>
    )
  }

  // Game over
  if (gameState === 'GAME_OVER') {
    const leaderboard = ws.gameState.leaderboard || []
    const winner = leaderboard[0]
    const myPlayer = leaderboard.find(p => p.id === myPlayerId)
    const myRank = leaderboard.findIndex(p => p.id === myPlayerId) + 1

    return (
      <div className="phone-game-over">
        <h1 className="game-over-title">🏆 Game Over!</h1>

        <div className="winner-display">
          <h2>Winner:</h2>
          <div className="winner-card">
            <span className="avatar-huge">{winner?.avatar}</span>
            <h3>{winner?.name}</h3>
            <p className="score">{winner?.score} points</p>
          </div>
        </div>

        <div className="my-result">
          <h3>Your Result:</h3>
          <div className="my-rank">
            <span className="rank-number">#{myRank}</span>
            <span className="avatar-large">{myPlayer?.avatar}</span>
            <span className="name">{myPlayer?.name}</span>
            <span className="score">{myPlayer?.score} pts</span>
          </div>
        </div>

        <div className="leaderboard">
          <h3>Final Standings:</h3>
          {leaderboard.map((player, index) => (
            <div key={player.id} className={`leaderboard-item ${player.id === myPlayerId ? 'me' : ''}`}>
              <span className="rank">#{index + 1}</span>
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score} pts</span>
            </div>
          ))}
        </div>

        <button onClick={() => window.location.reload()} className="btn btn-primary btn-large">
          🔄 Play Again
        </button>
      </div>
    )
  }

  return (
    <div className="phone-waiting">
      <div className="spinner"></div>
      <p>Waiting...</p>
    </div>
  )
}

function Timer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!endTime) return

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [endTime])

  return (
    <div className={`timer ${timeLeft < 10 ? 'timer-warning' : ''}`}>
      ⏱️ {timeLeft}s
    </div>
  )
}

export default PhoneController
