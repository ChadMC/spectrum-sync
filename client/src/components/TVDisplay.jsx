import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useWebSocket } from '../hooks/useWebSocket'
import './TVDisplay.css'

function TVDisplay({ gameId: initialGameId }) {
  const [gameId, setGameId] = useState(initialGameId)
  const [qrUrl, setQrUrl] = useState('')
  const [selectedPack, setSelectedPack] = useState('default')
  const [packs, setPacks] = useState(['default'])
  const ws = useWebSocket()

  useEffect(() => {
    if (ws.connected && !gameId) {
      ws.createGame()
    }
  }, [ws, gameId])

  useEffect(() => {
    const lastMessage = ws.messages[ws.messages.length - 1]
    if (lastMessage?.type === 'GAME_CREATED') {
      setGameId(lastMessage.gameId)
      const url = `${window.location.origin}/join/${lastMessage.gameId}`
      setQrUrl(url)
    }
  }, [ws.messages])

  useEffect(() => {
    if (gameId) {
      ws.getGameState(gameId)
      
      // Fetch available packs
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      fetch(`${apiUrl}/api/packs`)
        .then(res => res.json())
        .then(data => setPacks(data))
        .catch(err => console.error('Failed to fetch packs:', err))
    }
  }, [ws, gameId])

  const handleStartRound = () => {
    ws.startRound(gameId)
  }

  const handleCompleteHintPhase = () => {
    ws.completeHintPhase(gameId)
  }

  const handleCompleteVotePhase = () => {
    ws.completeVotePhase(gameId)
  }

  const handleToggleKidsMode = () => {
    ws.toggleKidsMode(gameId)
  }

  const handlePackChange = (pack) => {
    setSelectedPack(pack)
    ws.setSpectrumPack(gameId, pack)
  }

  const handleAddTime = () => {
    ws.addTime(gameId)
  }

  const renderLobby = () => {
    const playerCount = ws.gameState?.players?.length || 0
    const players = ws.gameState?.players || []
    const canStart = playerCount >= 3 && playerCount <= 12

    return (
      <div className="tv-lobby">
        <div className="lobby-header">
          <h1 className="tv-title">🌈 Spectrum Sync</h1>
          <div className="game-code">
            Game Code: <span className="code">{gameId}</span>
          </div>
        </div>

        <div className="lobby-content">
          <div className="qr-section">
            {qrUrl && (
              <div className="qr-container">
                <QRCodeSVG value={qrUrl} size={300} />
                <p className="join-instruction">Scan to join!</p>
                <p className="join-url">{qrUrl}</p>
              </div>
            )}
          </div>

          <div className="players-section">
            <h2>Players ({playerCount}/12)</h2>
            <div className="players-grid">
              {players.map(player => (
                <div key={player.id} className="player-card">
                  <span className="player-avatar">{player.avatar}</span>
                  <span className="player-name">{player.name}</span>
                  {player.isHost && <span className="host-badge">👑</span>}
                  <span className="player-score">{player.score} pts</span>
                </div>
              ))}
            </div>

            <div className="lobby-controls">
              <div className="pack-selector">
                <label>Spectrum Pack:</label>
                <select value={selectedPack} onChange={(e) => handlePackChange(e.target.value)}>
                  {packs.map(pack => (
                    <option key={pack} value={pack}>{pack}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleToggleKidsMode}
                className="btn btn-secondary"
              >
                {ws.gameState?.kidsMode ? '👶 Kids Mode ON' : '👶 Kids Mode OFF'}
              </button>

              <button 
                onClick={handleStartRound}
                disabled={!canStart}
                className="btn btn-primary btn-large"
              >
                {canStart ? '▶️ Start Round' : `Need ${3 - playerCount} more players`}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRoundStart = () => {
    const spectrum = ws.gameState?.spectrum
    const navigator = ws.gameState?.players?.find(p => p.id === ws.gameState.navigatorId)

    return (
      <div className="tv-round-start">
        <h1 className="phase-title">🌈 New Round!</h1>
        <div className="round-info">
          <h2>Round {ws.gameState.currentRound}/{ws.gameState.maxRounds}</h2>
        </div>

        {spectrum && (
          <div className="spectrum-display">
            <div className="spectrum-bar">
              <span className="spectrum-left">{spectrum.left}</span>
              <div className="spectrum-line"></div>
              <span className="spectrum-right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <div className="navigator-announcement">
          <h3>Navigator this round:</h3>
          <div className="navigator-display">
            <span className="avatar-large">{navigator?.avatar}</span>
            <span className="name-large">{navigator?.name}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderHintPhase = () => {
    const spectrum = ws.gameState?.spectrum
    const hintsSubmitted = ws.submissionStatus?.answered || 0
    const totalCluers = ws.submissionStatus?.total || (ws.gameState?.players?.length - 1)

    return (
      <div className="tv-hint-phase">
        <div className="round-header">
          <h2>Round {ws.gameState.currentRound}/{ws.gameState.maxRounds}</h2>
          <Timer endTime={ws.gameState.timerEndTime} />
        </div>

        <h1 className="phase-title">💡 Cluers Submitting Hints</h1>

        {spectrum && (
          <div className="spectrum-display">
            <div className="spectrum-bar">
              <span className="spectrum-left">{spectrum.left}</span>
              <div className="spectrum-line">
                <div className="spectrum-ticks">
                  <span className="tick">0</span>
                  <span className="tick">25</span>
                  <span className="tick">50</span>
                  <span className="tick">75</span>
                  <span className="tick">100</span>
                </div>
              </div>
              <span className="spectrum-right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <div className="submission-status">
          <h3>Hints Submitted: {hintsSubmitted}/{totalCluers}</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(hintsSubmitted / totalCluers) * 100}%` }}
            />
          </div>
        </div>

        <div className="host-controls">
          <button onClick={handleAddTime} className="btn btn-secondary">
            ⏱️ +10s
          </button>
          <button onClick={handleCompleteHintPhase} className="btn btn-primary">
            ▶️ Continue to Voting
          </button>
        </div>
      </div>
    )
  }

  const renderVotePhase = () => {
    const hints = ws.gameState?.hints || []
    const votesSubmitted = ws.submissionStatus?.answered || 0
    const totalVoters = ws.submissionStatus?.total || (ws.gameState?.players?.length - 1)

    return (
      <div className="tv-vote-phase">
        <div className="round-header">
          <h2>Round {ws.gameState.currentRound}/{ws.gameState.maxRounds}</h2>
          <Timer endTime={ws.gameState.timerEndTime} />
        </div>

        <h1 className="phase-title">🗳️ Cluers Voting on Hints</h1>

        <div className="hints-display">
          <h3>Anonymous Hints:</h3>
          <div className="hints-list">
            {hints.map((hint, index) => (
              <div key={hint.id} className="hint-item">
                <span className="hint-number">#{index + 1}</span>
                <span className="hint-text">{hint.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="submission-status">
          <h3>Votes Cast: {votesSubmitted}/{totalVoters}</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(votesSubmitted / totalVoters) * 100}%` }}
            />
          </div>
        </div>

        <div className="host-controls">
          <button onClick={handleAddTime} className="btn btn-secondary">
            ⏱️ +10s
          </button>
          <button onClick={handleCompleteVotePhase} className="btn btn-primary">
            ▶️ Continue to Placement
          </button>
        </div>
      </div>
    )
  }

  const renderPlacePhase = () => {
    const spectrum = ws.gameState?.spectrum
    const finalClues = ws.gameState?.finalClues || []
    const navigator = ws.gameState?.players?.find(p => p.id === ws.gameState.navigatorId)

    return (
      <div className="tv-place-phase">
        <div className="round-header">
          <h2>Round {ws.gameState.currentRound}/{ws.gameState.maxRounds}</h2>
          <Timer endTime={ws.gameState.timerEndTime} />
        </div>

        <h1 className="phase-title">🎯 Navigator Placing</h1>

        <div className="navigator-info">
          <span className="avatar-medium">{navigator?.avatar}</span>
          <span className="name-medium">{navigator?.name}</span>
          <span className="label">is placing the slider</span>
        </div>

        {spectrum && (
          <div className="spectrum-display">
            <div className="spectrum-bar">
              <span className="spectrum-left">{spectrum.left}</span>
              <div className="spectrum-line">
                <div className="spectrum-ticks">
                  <span className="tick">0</span>
                  <span className="tick">25</span>
                  <span className="tick">50</span>
                  <span className="tick">75</span>
                  <span className="tick">100</span>
                </div>
              </div>
              <span className="spectrum-right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <div className="final-clues-display">
          <h3>Final Clues:</h3>
          <div className="final-clues-list">
            {finalClues.length === 0 ? (
              <p className="no-clues">No clues selected! Navigator must guess blind.</p>
            ) : (
              finalClues.map((clue) => (
                <div key={clue.id} className="final-clue-item">
                  <span className="clue-text">"{clue.text}"</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="host-controls">
          <button onClick={handleAddTime} className="btn btn-secondary">
            ⏱️ +10s
          </button>
        </div>
      </div>
    )
  }

  const renderReveal = () => {
    const spectrum = ws.gameState?.spectrum
    const target = ws.gameState?.target
    const placement = ws.gameState?.placement
    const distance = ws.gameState?.distance
    const teamResult = ws.gameState?.teamResult
    const pointsPerPlayer = ws.gameState?.pointsPerPlayer || {}
    const finalClueAuthors = ws.gameState?.finalClueAuthors || []
    const players = ws.gameState?.players || []

    return (
      <div className="tv-reveal">
        <h1 className="phase-title">🎉 Results!</h1>

        {spectrum && (
          <div className="spectrum-display">
            <div className="spectrum-bar">
              <span className="spectrum-left">{spectrum.left}</span>
              <div className="spectrum-line">
                <div className="spectrum-ticks">
                  <span className="tick">0</span>
                  <span className="tick">25</span>
                  <span className="tick">50</span>
                  <span className="tick">75</span>
                  <span className="tick">100</span>
                </div>
                {target !== null && (
                  <div className="target-marker" style={{ left: `${target}%` }}>
                    <div className="marker-label">🎯 Target: {target}</div>
                  </div>
                )}
                {placement !== null && (
                  <div className="placement-marker" style={{ left: `${placement}%` }}>
                    <div className="marker-label">📍 Guess: {placement}</div>
                  </div>
                )}
              </div>
              <span className="spectrum-right">{spectrum.right}</span>
            </div>
          </div>
        )}

        <div className="result-summary">
          <h2 className={`result-${teamResult?.toLowerCase()}`}>
            Distance: {distance} → {teamResult}!
          </h2>
        </div>

        <div className="points-awarded">
          <h3>Points Awarded:</h3>
          <div className="points-list">
            {players.map(player => {
              const points = pointsPerPlayer[player.id] || 0
              return (
                <div key={player.id} className="points-item">
                  <span className="avatar">{player.avatar}</span>
                  <span className="name">{player.name}</span>
                  <span className={`points ${points > 0 ? 'positive' : ''}`}>
                    +{points}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {finalClueAuthors.length > 0 && (
          <div className="clue-authors">
            <h3>Final Clue Authors:</h3>
            <div className="authors-list">
              {finalClueAuthors.map(author => (
                <div key={author.hintId} className="author-item">
                  <span className="avatar">{author.avatar}</span>
                  <span className="name">{author.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Scoreboard players={players} />
      </div>
    )
  }

  const renderGameOver = () => {
    const leaderboard = ws.gameState?.leaderboard || []
    const winner = leaderboard[0]

    return (
      <div className="tv-game-over">
        <h1 className="game-over-title">🏆 Game Over!</h1>
        
        {winner && (
          <div className="winner-display">
            <span className="avatar-huge">{winner.avatar}</span>
            <h2 className="name-huge">{winner.name}</h2>
            <p className="winner-score">{winner.score} points</p>
          </div>
        )}

        <Scoreboard players={leaderboard} />
        
        <button onClick={() => window.location.reload()} className="btn btn-primary btn-large">
          🔄 Play Again
        </button>
      </div>
    )
  }

  if (!ws.connected) {
    return (
      <div className="tv-loading">
        <div className="spinner"></div>
        <p>Connecting...</p>
      </div>
    )
  }

  if (!ws.gameState) {
    return (
      <div className="tv-loading">
        <div className="spinner"></div>
        <p>Loading game...</p>
      </div>
    )
  }

  return (
    <div className="tv-display">
      {ws.gameState.state === 'LOBBY' && renderLobby()}
      {ws.gameState.state === 'ROUND_START' && renderRoundStart()}
      {ws.gameState.state === 'HINT' && renderHintPhase()}
      {ws.gameState.state === 'VOTE' && renderVotePhase()}
      {ws.gameState.state === 'PLACE' && renderPlacePhase()}
      {ws.gameState.state === 'REVEAL' && renderReveal()}
      {ws.gameState.state === 'GAME_OVER' && renderGameOver()}
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

function Scoreboard({ players }) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="scoreboard">
      <h3>Scoreboard</h3>
      <div className="scores">
        {sorted.map((player, i) => (
          <div key={player.id} className="score-row">
            <span className="rank">#{i + 1}</span>
            <span className="avatar">{player.avatar}</span>
            <span className="name">{player.name}</span>
            <span className="score">{player.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TVDisplay
