import { useEffect, useState, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [clientId, setClientId] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [messages, setMessages] = useState([])
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const ws = useRef(null)
  const reconnectToken = useRef(localStorage.getItem('reconnectToken'))

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      
      // Try to reconnect if we have a token
      if (reconnectToken.current) {
        sendMessage('RECONNECT', { token: reconnectToken.current })
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
          case 'GAME_CREATED':
          case 'JOINED_GAME':
          case 'RECONNECTED':
          case 'PACK_UPDATED':
          case 'TIME_ADDED':
          case 'ERROR':
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
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [connect])

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

  const toggleStreamerMode = useCallback((gameId) => {
    return sendMessage('TOGGLE_STREAMER_MODE', { gameId })
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
    clearMessages
  }
}
