import WebSocket from 'ws';

const gameId = process.argv[2] || '6B886D';

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected to server');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('Received:', msg.type);
  
  if (msg.type === 'CONNECTED') {
    console.log('Client ID:', msg.clientId);
    // Create a game to become host
    ws.send(JSON.stringify({
      type: 'CREATE_GAME'
    }));
  } else if (msg.type === 'GAME_CREATED') {
    console.log('Game created:', msg.gameId);
    // Join the existing game as host by getting game state
    ws.send(JSON.stringify({
      type: 'GET_GAME_STATE',
      data: { gameId: gameId }
    }));
    
    // Start the round
    setTimeout(() => {
      console.log('Starting round for game', gameId);
      ws.send(JSON.stringify({
        type: 'START_ROUND',
        data: { gameId: gameId }
      }));
      
      setTimeout(() => {
        console.log('Done!');
        process.exit(0);
      }, 2000);
    }, 1000);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout - exiting');
  process.exit(1);
}, 10000);
