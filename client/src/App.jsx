import { useState, useEffect } from 'react'
import './App.css'
import TVDisplay from './components/TVDisplay'
import PhoneController from './components/PhoneController'
import Home from './components/Home'

function App() {
  const [view, setView] = useState('home')
  const [gameId, setGameId] = useState(null)

  useEffect(() => {
    // Check URL for view type
    const path = window.location.pathname
    if (path.startsWith('/tv')) {
      setView('tv')
      const id = path.split('/')[2]
      if (id) setGameId(id)
    } else if (path.startsWith('/join')) {
      setView('phone')
      const id = path.split('/')[2]
      if (id) setGameId(id)
    } else if (path.startsWith('/phone')) {
      setView('phone')
    }
  }, [])

  const handleCreateGame = (id) => {
    setGameId(id)
    setView('tv')
    window.history.pushState({}, '', `/tv/${id}`)
  }

  const handleJoinGame = (id) => {
    setGameId(id)
    setView('phone')
    window.history.pushState({}, '', `/join/${id}`)
  }

  return (
    <div className="App">
      {view === 'home' && (
        <Home 
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      )}
      {view === 'tv' && <TVDisplay gameId={gameId} />}
      {view === 'phone' && <PhoneController gameId={gameId} />}
    </div>
  )
}

export default App
