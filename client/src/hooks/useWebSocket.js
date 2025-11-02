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
          case 'GAME_STATE':
            setGameState(data.state)
            break
          case 'VOTING_STARTED':
          case 'REVEAL':
          case 'GAME_OVER':
            // These messages include updated state
            if (data.state) {
              setGameState(data.state)
            }
            setMessages(prev => [...prev, data])
            break
          case 'ANSWER_SUBMITTED':
          case 'VOTE_SUBMITTED':
            // Update submission status for TV display
            setSubmissionStatus({
              type: data.type,
              answered: data.answeredCount || data.votedCount,
              total: data.totalCount
            })
            break
          case 'ANSWER_ACCEPTED':
          case 'VOTE_ACCEPTED':
            // Player's submission was accepted - add to messages for UI to handle
            setMessages(prev => [...prev, data])
            break
          case 'NEXT_PROMPT':
          case 'ROUND_STARTED':
            // Reset submission status when moving to next prompt or starting round
            setSubmissionStatus(null)
            setMessages(prev => [...prev, data])
            break
          case 'GAME_CREATED':
          case 'JOINED_GAME':
          case 'RECONNECTED':
          case 'ROUND_COMPLETE':
          case 'PLAYER_KICKED':
          case 'PACK_UPDATED':
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

  const submitAnswer = useCallback((gameId, answer) => {
    return sendMessage('SUBMIT_ANSWER', { gameId, answer })
  }, [sendMessage])

  const submitVote = useCallback((gameId, votedForId) => {
    return sendMessage('SUBMIT_VOTE', { gameId, votedForId })
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

  const setQuestionPack = useCallback((gameId, pack) => {
    return sendMessage('SET_QUESTION_PACK', { gameId, pack })
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
    submitAnswer,
    submitVote,
    kickPlayer,
    mutePlayer,
    toggleStreamerMode,
    setQuestionPack,
    getGameState,
    saveReconnectToken,
    clearMessages
  }
}
