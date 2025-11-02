import { useState } from 'react'
import './Home.css'

function Home({ onCreateGame, onJoinGame }) {
  const [joinCode, setJoinCode] = useState('')

  const handleCreate = () => {
    // Create game will be handled by TVDisplay
    onCreateGame(null)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (joinCode.trim()) {
      onJoinGame(joinCode.trim().toUpperCase())
    }
  }

  return (
    <div className="home">
      <div className="home-container">
        <h1 className="game-title">🎯 Odd Ball Out</h1>
        <p className="game-subtitle">Find the odd one out!</p>
        
        <div className="home-actions">
          <button className="btn btn-primary btn-large" onClick={handleCreate}>
            🖥️ Host Game on TV
          </button>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <form onSubmit={handleJoin} className="join-form">
            <input
              type="text"
              placeholder="Enter game code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="join-input"
            />
            <button type="submit" className="btn btn-secondary btn-large">
              📱 Join Game
            </button>
          </form>
        </div>

        <div className="game-info">
          <h3>How to Play:</h3>
          <ul>
            <li>🎮 3-12 players join using their phones</li>
            <li>🎭 One random player is the "Odd" one</li>
            <li>💭 Everyone gets secret clues (Odd gets different clue)</li>
            <li>❓ Answer 2-3 quick prompts</li>
            <li>🗣️ Discuss and figure out who's Odd</li>
            <li>🗳️ Vote to eliminate the Odd player</li>
            <li>🏆 First to 15 points or after 6 rounds wins!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Home
