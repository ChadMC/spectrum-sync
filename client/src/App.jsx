import { useState, useEffect, useCallback } from 'react'
import './App.css'
import TVDisplay from './components/TVDisplay'
import PhoneController from './components/PhoneController'
import Home from './components/Home'

// Custom event for URL changes
const URL_CHANGE_EVENT = 'urlchange'

function App() {
  const [view, setView] = useState('home')
  const [gameId, setGameId] = useState(null)

  // Function to parse and update view/gameId from URL
  const updateFromUrl = useCallback(() => {
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
      setGameId(null)
    } else {
      setView('home')
      setGameId(null)
    }
  }, [])

  useEffect(() => {
    // Initial URL check
    updateFromUrl()

    // Listen for popstate events (browser back/forward)
    const handlePopState = () => {
      updateFromUrl()
    }
    window.addEventListener('popstate', handlePopState)

    // Listen for custom URL change events (for pushState)
    const handleUrlChange = () => {
      updateFromUrl()
    }
    window.addEventListener(URL_CHANGE_EVENT, handleUrlChange)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener(URL_CHANGE_EVENT, handleUrlChange)
    }
  }, [updateFromUrl])

  const handleCreateGame = (id) => {
    setGameId(id)
    setView('tv')
    // Only update URL if we have a valid game ID
    if (id && id !== 'null') {
      window.history.pushState({}, '', `/tv/${id}`)
      // Dispatch custom event for URL change detection
      window.dispatchEvent(new Event(URL_CHANGE_EVENT))
    }
  }

  const handleJoinGame = (id) => {
    setGameId(id)
    setView('phone')
    window.history.pushState({}, '', `/join/${id}`)
    // Dispatch custom event for URL change detection
    window.dispatchEvent(new Event(URL_CHANGE_EVENT))
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
