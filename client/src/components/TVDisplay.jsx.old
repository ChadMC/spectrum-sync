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
  }, [ws.connected, gameId])

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
  }, [gameId])

  const handleStartRound = () => {
    ws.startRound(gameId)
  }

  const handleKickPlayer = (playerId) => {
    ws.kickPlayer(gameId, playerId)
  }

  const handleMutePlayer = (playerId) => {
    ws.mutePlayer(gameId, playerId)
  }

  const handleToggleStreamer = () => {
    ws.toggleStreamerMode(gameId)
  }

  const handlePackChange = (pack) => {
    setSelectedPack(pack)
    ws.setQuestionPack(gameId, pack)
  }

  const renderLobby = () => {
    const playerCount = ws.gameState?.players?.length || 0
    const players = ws.gameState?.players || []
    const canStart = playerCount >= 3 && playerCount <= 12

    return (
      <div className="tv-lobby">
        <div className="lobby-header">
          <h1 className="tv-title">🎯 Odd Ball Out</h1>
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
                  {!player.isHost && (
                    <div className="player-actions">
                      <button 
                        onClick={() => handleMutePlayer(player.id)}
                        className="btn-icon"
                        title={player.isMuted ? "Unmute" : "Mute"}
                      >
                        {player.isMuted ? '🔇' : '🔊'}
                      </button>
                      <button 
                        onClick={() => handleKickPlayer(player.id)}
                        className="btn-icon"
                        title="Kick"
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="lobby-controls">
              <div className="pack-selector">
                <label>Question Pack:</label>
                <select value={selectedPack} onChange={(e) => handlePackChange(e.target.value)}>
                  {packs.map(pack => (
                    <option key={pack} value={pack}>{pack}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleToggleStreamer}
                className="btn btn-secondary"
              >
                {ws.gameState?.streamerMode ? '👁️ Streamer Mode ON' : '👁️‍🗨️ Streamer Mode OFF'}
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

  const renderPlaying = () => {
    const prompt = ws.gameState?.currentPrompt
    const players = ws.gameState?.players || []
    const answeredCount = ws.submissionStatus?.type === 'ANSWER_SUBMITTED' ? ws.submissionStatus.answered : 0
    const totalCount = ws.submissionStatus?.total || players.length

    return (
      <div className="tv-playing">
        <div className="round-header">
          <h2>Round {ws.gameState.currentRound}/{ws.gameState.maxRounds}</h2>
          <Timer endTime={ws.gameState.timerEndTime} />
        </div>

        <div className="prompt-display">
          <h1 className="prompt-question">{prompt?.question}</h1>
          {prompt?.type === 'multiple_choice' && (
            <div className="prompt-options">
              {prompt.options.map((option, i) => (
                <div key={i} className="option">{option}</div>
              ))}
            </div>
          )}
          {prompt?.type === 'emoji' && (
            <div className="emoji-options">
              {prompt.options.map((emoji, i) => (
                <span key={i} className="emoji-option">{emoji}</span>
              ))}
            </div>
          )}
        </div>

        <div className="submission-status">
          <h3>Answers Submitted: {answeredCount}/{totalCount}</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(answeredCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        <div className="players-status">
          {players.map(player => (
            <div key={player.id} className="player-status">
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVoting = () => {
    const players = ws.gameState?.players || []
    const votedCount = ws.submissionStatus?.type === 'VOTE_SUBMITTED' ? ws.submissionStatus.answered : 0
    const totalCount = ws.submissionStatus?.total || players.length
    const allPrompts = ws.gameState?.allPrompts || []
    const answers = ws.gameState?.answers || {}

    return (
      <div className="tv-voting">
        <h1 className="voting-title">🗳️ Who is the Odd One Out?</h1>
        <Timer endTime={ws.gameState.timerEndTime} />
        
        <div className="voting-instructions">
          <p>Review the answers and vote on your phone!</p>
        </div>

        <div className="answers-review">
          {allPrompts.map((prompt, idx) => (
            <div key={idx} className="prompt-answer-section">
              <h3 className="question-text">Q{idx + 1}: {prompt.question}</h3>
              <div className="player-answers">
                {players.map(player => {
                  const answer = answers[idx]?.[player.id] || '(no answer)'
                  return (
                    <div key={player.id} className="player-answer-item">
                      <span className="player-avatar">{player.avatar}</span>
                      <span className="player-name">{player.name}</span>
                      <span className="player-answer">{answer}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="submission-status">
          <h3>Votes Cast: {votedCount}/{totalCount}</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(votedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderReveal = () => {
    const players = ws.gameState?.players || []
    const oddPlayer = players.find(p => p.id === ws.gameState.oddPlayerId)
    const votes = ws.gameState?.votes || {}
    
    // Check if round is complete (not game over)
    const lastMessage = ws.messages[ws.messages.length - 1]
    const isRoundComplete = lastMessage?.type === 'ROUND_COMPLETE'

    return (
      <div className="tv-reveal">
        <h1 className="reveal-title">🎭 The Odd One Was...</h1>
        
        <div className="odd-player-reveal">
          <span className="avatar-huge">{oddPlayer?.avatar}</span>
          <h2 className="name-huge">{oddPlayer?.name}</h2>
        </div>

        <div className="vote-results">
          <h3>Vote Results:</h3>
          {players.map(player => {
            const voteCount = Object.values(votes).filter(v => v === player.id).length
            return (
              <div key={player.id} className="vote-result">
                <span className="avatar">{player.avatar}</span>
                <span className="name">{player.name}</span>
                <span className="votes">{'⭐'.repeat(voteCount)}</span>
              </div>
            )
          })}
        </div>

        <Scoreboard players={players} />
        
        {isRoundComplete && (
          <div className="round-complete-controls">
            <button 
              onClick={handleStartRound}
              className="btn btn-primary btn-large"
            >
              ▶️ Start Next Round
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderGameOver = () => {
    const winner = ws.gameState?.winner
    const players = ws.gameState?.players || []

    return (
      <div className="tv-game-over">
        <h1 className="game-over-title">🏆 Game Over!</h1>
        
        <div className="winner-display">
          <span className="avatar-huge">{winner?.avatar}</span>
          <h2 className="name-huge">{winner?.name}</h2>
          <p className="winner-score">{winner?.score} points</p>
        </div>

        <Scoreboard players={players} />
        
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
      {ws.gameState.state === 'PLAYING' && renderPlaying()}
      {ws.gameState.state === 'VOTING' && renderVoting()}
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
