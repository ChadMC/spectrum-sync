import { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import './PhoneController.css'

function PhoneController({ gameId: initialGameId }) {
  const [gameId, setGameId] = useState(initialGameId)
  const [joined, setJoined] = useState(false)
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [avatars, setAvatars] = useState([])
  const [answer, setAnswer] = useState('')
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false)
  const [hasSubmittedVote, setHasSubmittedVote] = useState(false)
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
    } else if (lastMessage?.type === 'PLAYER_KICKED') {
      if (lastMessage.playerId === ws.clientId) {
        alert('You have been kicked from the game')
        window.location.href = '/'
      }
    } else if (lastMessage?.type === 'ERROR') {
      alert(lastMessage.message)
      ws.clearMessages()
    } else if (lastMessage?.type === 'ANSWER_ACCEPTED') {
      setHasSubmittedAnswer(true)
      ws.clearMessages()
    } else if (lastMessage?.type === 'VOTE_ACCEPTED') {
      setHasSubmittedVote(true)
      ws.clearMessages()
    } else if (lastMessage?.type === 'NEXT_PROMPT' || lastMessage?.type === 'ROUND_STARTED') {
      // Reset submission state when moving to next prompt or new round
      setHasSubmittedAnswer(false)
      setHasSubmittedVote(false)
      ws.clearMessages()
    } else if (lastMessage?.type === 'VOTING_STARTED') {
      // Reset answer submission state when voting starts
      setHasSubmittedAnswer(false)
      setHasSubmittedVote(false)
      ws.clearMessages()
    }
  }, [ws.messages])

  const handleJoin = (e) => {
    e.preventDefault()
    if (gameId && name.trim() && selectedAvatar) {
      ws.joinGame(gameId, name.trim(), selectedAvatar)
    }
  }

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      ws.submitAnswer(gameId, answer.trim())
      setAnswer('')
    }
  }

  const handleEmojiAnswer = (emoji) => {
    ws.submitAnswer(gameId, emoji)
  }

  const handleVote = (playerId) => {
    ws.submitVote(gameId, playerId)
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
        <h1 className="phone-title">🎯 Join Game</h1>
        
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

  const renderLobby = () => {
    const players = ws.gameState?.players || []
    const playerCount = players.length

    return (
      <div className="phone-lobby">
        <h1 className="phone-title">🎯 Waiting to Start</h1>
        
        <div className="game-info">
          <div className="info-item">
            <span className="label">Game Code:</span>
            <span className="value">{gameId}</span>
          </div>
          <div className="info-item">
            <span className="label">Players:</span>
            <span className="value">{playerCount}/12</span>
          </div>
        </div>

        <div className="players-list">
          {players.map(player => (
            <div key={player.id} className="player-item">
              <span className="avatar">{player.avatar}</span>
              <span className="name">{player.name}</span>
              {player.isHost && <span className="badge">👑</span>}
            </div>
          ))}
        </div>

        <p className="waiting-message">Waiting for host to start the game...</p>
      </div>
    )
  }

  const renderPlaying = () => {
    const prompt = ws.gameState?.currentPrompt
    const clue = ws.gameState?.clue
    const isOdd = ws.gameState?.isOdd

    return (
      <div className="phone-playing">
        <div className="clue-display">
          <h2>{isOdd ? '🎭 You are the ODD ONE!' : '👥 You are NORMAL'}</h2>
          <div className="clue-box">
            <p className="clue">{clue}</p>
          </div>
        </div>

        {hasSubmittedAnswer ? (
          <div className="submission-confirmation">
            <div className="confirmation-icon">✓</div>
            <h2>Answer Submitted!</h2>
            <p>Waiting for other players...</p>
          </div>
        ) : (
          <div className="prompt-section">
            <h3 className="prompt-question">{prompt?.question}</h3>
            
            {prompt?.type === 'text' && (
              <div className="text-input-section">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  maxLength={100}
                  rows={3}
                />
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim()}
                  className="btn btn-primary"
                >
                  Submit Answer ✓
                </button>
              </div>
            )}

            {prompt?.type === 'emoji' && (
              <div className="emoji-buttons">
                {prompt.options.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => handleEmojiAnswer(emoji)}
                    className="btn-emoji"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {prompt?.type === 'multiple_choice' && (
              <div className="choice-buttons">
                {prompt.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleEmojiAnswer(option)}
                    className="btn btn-choice"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="round-info">
          Round {ws.gameState.currentRound}/{ws.gameState.maxRounds} • 
          Question {prompt?.index + 1}/{prompt?.total}
        </div>
      </div>
    )
  }

  const renderVoting = () => {
    const players = ws.gameState?.players || []
    const myId = ws.clientId
    const allPrompts = ws.gameState?.allPrompts || []
    const answers = ws.gameState?.answers || {}

    return (
      <div className="phone-voting">
        <h1 className="voting-title">🗳️ Vote!</h1>
        <p className="voting-instruction">Who is the Odd One Out?</p>

        <div className="answers-review">
          {allPrompts.map((prompt, idx) => (
            <div key={idx} className="prompt-section">
              <h3 className="question">Q{idx + 1}: {prompt.question}</h3>
              <div className="answers-list">
                {players.map(player => {
                  const answer = answers[idx]?.[player.id] || '(no answer)'
                  return (
                    <div key={player.id} className="answer-item">
                      <span className="avatar">{player.avatar}</span>
                      <span className="name">{player.name}:</span>
                      <span className="answer">{answer}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {hasSubmittedVote ? (
          <div className="submission-confirmation">
            <div className="confirmation-icon">✓</div>
            <h2>Vote Submitted!</h2>
            <p>Waiting for other players...</p>
          </div>
        ) : (
          <div className="vote-section">
            <h2 className="vote-prompt">Cast Your Vote:</h2>
            <div className="vote-options">
              {players
                .filter(p => p.id !== myId)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleVote(player.id)}
                    className="vote-button"
                  >
                    <span className="avatar">{player.avatar}</span>
                    <span className="name">{player.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderReveal = () => {
    const players = ws.gameState?.players || []
    const oddPlayer = players.find(p => p.id === ws.gameState.oddPlayerId)
    const myPlayer = players.find(p => p.id === ws.clientId)

    return (
      <div className="phone-reveal">
        <h1 className="reveal-title">🎭 Reveal!</h1>
        
        <div className="odd-reveal">
          <p className="reveal-label">The Odd One Was:</p>
          <div className="odd-player">
            <span className="avatar-large">{oddPlayer?.avatar}</span>
            <span className="name-large">{oddPlayer?.name}</span>
          </div>
        </div>

        <div className="my-score">
          <h3>Your Score</h3>
          <p className="score">{myPlayer?.score} points</p>
        </div>

        <div className="mini-scoreboard">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, i) => (
              <div key={player.id} className="score-item">
                <span className="rank">#{i + 1}</span>
                <span className="avatar">{player.avatar}</span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score}</span>
              </div>
            ))}
        </div>
      </div>
    )
  }

  const renderGameOver = () => {
    const winner = ws.gameState?.winner
    const players = ws.gameState?.players || []
    const myPlayer = players.find(p => p.id === ws.clientId)

    return (
      <div className="phone-game-over">
        <h1 className="game-over-title">🏆 Game Over!</h1>
        
        <div className="winner-section">
          <p className="winner-label">Winner:</p>
          <div className="winner">
            <span className="avatar-large">{winner?.avatar}</span>
            <span className="name-large">{winner?.name}</span>
            <span className="score-large">{winner?.score} pts</span>
          </div>
        </div>

        <div className="my-final-score">
          <h3>You Finished With</h3>
          <p className="score-large">{myPlayer?.score} points</p>
        </div>

        <button onClick={() => window.location.href = '/'} className="btn btn-primary btn-large">
          🏠 Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="phone-controller">
      {ws.gameState.state === 'LOBBY' && renderLobby()}
      {ws.gameState.state === 'PLAYING' && renderPlaying()}
      {ws.gameState.state === 'VOTING' && renderVoting()}
      {ws.gameState.state === 'REVEAL' && renderReveal()}
      {ws.gameState.state === 'GAME_OVER' && renderGameOver()}
    </div>
  )
}

export default PhoneController
