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
        <h1 className="game-title">🌈 Spectrum Sync</h1>
        <p className="game-subtitle">Cooperative spectrum guessing game!</p>
        
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
            <li>🧭 One Navigator places a slider on a spectrum</li>
            <li>💡 Cluers see the exact target and submit hints</li>
            <li>🗳️ Anonymous voting picks the best hints</li>
            <li>🎯 Navigator uses hints to guess the target</li>
            <li>🏆 Team scores based on proximity!</li>
            <li>⭐ First to 15 points or after 6 rounds wins!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Home
