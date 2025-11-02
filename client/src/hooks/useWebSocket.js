import { useEffect, useState, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
const RECONNECT_TIMEOUT_MS = 5000
const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_DELAY_MS = 30000
const MAX_RECONNECT_ATTEMPTS = 10

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [clientId, setClientId] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [messages, setMessages] = useState([])
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const ws = useRef(null)
  const reconnectToken = useRef(localStorage.getItem('reconnectToken'))
  const reconnectAttempted = useRef(false)
  const connectionTimeout = useRef(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef(null)
  const visibilityChangeHandler = useRef(null)
  const isConnected = useRef(false)

  const clearReconnectToken = useCallback(() => {
    reconnectToken.current = null
    localStorage.removeItem('reconnectToken')
  }, [])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    // Clear any existing connection timeout
    if (connectionTimeout.current) {
      clearTimeout(connectionTimeout.current)
      connectionTimeout.current = null
    }

    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      isConnected.current = true
      reconnectAttempts.current = 0 // Reset reconnect attempts on successful connection
      
      // Try to reconnect if we have a token and haven't attempted yet
      if (reconnectToken.current && !reconnectAttempted.current) {
        reconnectAttempted.current = true
        
        // Send reconnect message
        const message = JSON.stringify({ 
          type: 'RECONNECT', 
          data: { token: reconnectToken.current } 
        })
        ws.current.send(message)
        
        // Set a timeout for reconnect attempt - if no response, clear token
        connectionTimeout.current = setTimeout(() => {
          console.log('Reconnect timeout - clearing stale token')
          clearReconnectToken()
        }, RECONNECT_TIMEOUT_MS)
      }
    }

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received:', data)
        
        switch (data.type) {
          case 'CONNECTED':
            setClientId(data.clientId)
            break
          case 'ROOM_STATE':
            setGameState(data.state)
            break
          case 'ROUND_START':
            setGameState(prev => ({ ...prev, ...data, state: 'ROUND_START' }))
            setMessages(prev => [...prev, data])
            break
          case 'HINT_PHASE_START':
            setGameState(data.state)
            setMessages(prev => [...prev, data])
            break
          case 'HINT_STATUS':
          case 'VOTE_STATUS':
            setSubmissionStatus({
              type: data.type,
              answered: data.hintsSubmitted || data.votesSubmitted,
              total: data.totalCluers || data.totalVoters
            })
            break
          case 'HINT_ACCEPTED':
          case 'HINT_REJECTED':
          case 'HINT_CANCELED':
          case 'VOTE_ACCEPTED':
          case 'VOTE_REJECTED':
          case 'PLACEMENT_ACCEPTED':
            setMessages(prev => [...prev, data])
            break
          case 'VOTE_START':
          case 'PLACE_START':
            setGameState(prev => ({ ...prev, ...data, state: data.type === 'VOTE_START' ? 'VOTE' : 'PLACE' }))
            setMessages(prev => [...prev, data])
            break
          case 'REVEAL':
            setGameState(prev => ({ ...prev, ...data, state: 'REVEAL' }))
            setMessages(prev => [...prev, data])
            break
          case 'GAME_OVER':
            setGameState(prev => ({ ...prev, ...data, state: 'GAME_OVER' }))
            setMessages(prev => [...prev, data])
            break
          case 'ROUND_COMPLETE':
            setMessages(prev => [...prev, data])
            break
          case 'RECONNECTED':
            // Clear connection timeout on successful reconnect
            if (connectionTimeout.current) {
              clearTimeout(connectionTimeout.current)
              connectionTimeout.current = null
            }
            setMessages(prev => [...prev, data])
            break
          case 'ERROR':
            // If error is about invalid reconnect token, clear it
            if (data.message && data.message.includes('reconnect')) {
              console.log('Invalid reconnect token - clearing')
              clearReconnectToken()
              // Clear connection timeout
              if (connectionTimeout.current) {
                clearTimeout(connectionTimeout.current)
                connectionTimeout.current = null
              }
            }
            setMessages(prev => [...prev, data])
            break
          case 'GAME_CREATED':
          case 'JOINED_GAME':
          case 'PACK_UPDATED':
          case 'TIME_ADDED':
            setMessages(prev => [...prev, data])
            break
        }
      } catch (err) {
        console.error('Error parsing message:', err)
      }
    }

    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      isConnected.current = false
      
      // Reset reconnect attempt flag so it can be tried again on reconnection
      reconnectAttempted.current = false
      
      // Implement exponential backoff for reconnection
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(RECONNECT_DELAY_MS * (1.5 ** reconnectAttempts.current), MAX_RECONNECT_DELAY_MS)
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`)
        
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current++
          connect()
        }, delay)
      } else {
        console.log('Max reconnection attempts reached')
      }
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    connect()

    // Handle page visibility changes (e.g., app switching on mobile)
    visibilityChangeHandler.current = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible - checking connection')
        // If we're not connected and have a reconnect token, try to reconnect
        if (!isConnected.current && reconnectToken.current) {
          console.log('Attempting to reconnect after returning to app')
          reconnectAttempted.current = false
          reconnectAttempts.current = 0
          connect()
        }
      }
    }
    
    document.addEventListener('visibilitychange', visibilityChangeHandler.current)

    return () => {
      // Clean up connection timeout
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current)
        connectionTimeout.current = null
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
      if (visibilityChangeHandler.current) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler.current)
      }
      if (ws.current) {
        ws.current.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = useCallback((type, data = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }))
      return true
    }
    return false
  }, [])

  const createGame = useCallback(() => {
    return sendMessage('CREATE_GAME')
  }, [sendMessage])

  const joinGame = useCallback((gameId, name, avatar) => {
    return sendMessage('JOIN_GAME', { gameId, name, avatar })
  }, [sendMessage])

  const startRound = useCallback((gameId) => {
    return sendMessage('START_ROUND', { gameId })
  }, [sendMessage])

  const submitHint = useCallback((gameId, text) => {
    return sendMessage('HINT_SUBMIT', { gameId, text })
  }, [sendMessage])

  const submitVote = useCallback((gameId, hintIds) => {
    return sendMessage('VOTE_CAST', { gameId, hintIds })
  }, [sendMessage])

  const submitPlacement = useCallback((gameId, value) => {
    return sendMessage('PLACEMENT_SET', { gameId, value })
  }, [sendMessage])

  const lockPlacement = useCallback((gameId) => {
    return sendMessage('PLACEMENT_LOCK', { gameId })
  }, [sendMessage])

  const completeHintPhase = useCallback((gameId) => {
    return sendMessage('HINT_PHASE_COMPLETE', { gameId })
  }, [sendMessage])

  const completeVotePhase = useCallback((gameId) => {
    return sendMessage('VOTE_PHASE_COMPLETE', { gameId })
  }, [sendMessage])

  const kickPlayer = useCallback((gameId, playerId) => {
    return sendMessage('KICK_PLAYER', { gameId, playerId })
  }, [sendMessage])

  const mutePlayer = useCallback((gameId, playerId) => {
    return sendMessage('MUTE_PLAYER', { gameId, playerId })
  }, [sendMessage])

  const setSpectrumPack = useCallback((gameId, pack) => {
    return sendMessage('SET_SPECTRUM_PACK', { gameId, pack })
  }, [sendMessage])

  const toggleKidsMode = useCallback((gameId) => {
    return sendMessage('TOGGLE_KIDS_MODE', { gameId })
  }, [sendMessage])

  const addTime = useCallback((gameId) => {
    return sendMessage('ADD_TIME', { gameId })
  }, [sendMessage])

  const getGameState = useCallback((gameId) => {
    return sendMessage('GET_GAME_STATE', { gameId })
  }, [sendMessage])

  const saveReconnectToken = useCallback((token) => {
    reconnectToken.current = token
    localStorage.setItem('reconnectToken', token)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    connected,
    clientId,
    gameState,
    messages,
    submissionStatus,
    createGame,
    joinGame,
    startRound,
    submitHint,
    submitVote,
    submitPlacement,
    lockPlacement,
    completeHintPhase,
    completeVotePhase,
    kickPlayer,
    mutePlayer,
    setSpectrumPack,
    toggleKidsMode,
    addTime,
    getGameState,
    saveReconnectToken,
    clearReconnectToken,
    clearMessages
  }
}
