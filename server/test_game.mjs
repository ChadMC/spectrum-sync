import WebSocket from 'ws';

let hostWs, gameId, hostId;
const players = [];

console.log('Creating game and simulating full round...\n');

// Create host
hostWs = new WebSocket('ws://localhost:3001');

hostWs.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.type === 'CONNECTED') {
    hostId = msg.clientId;
    console.log('✅ Host connected:', hostId);
    hostWs.send(JSON.stringify({ type: 'CREATE_GAME' }));
  } else if (msg.type === 'GAME_CREATED') {
    gameId = msg.gameId;
    console.log('✅ Game created:', gameId);
    console.log('📋 Join URL: http://localhost:5173/join/' + gameId);
    console.log('📺 TV URL: http://localhost:5173/tv/' + gameId);
    
    // Add players
    addPlayers();
  } else if (msg.type === 'ROUND_START') {
    console.log('\n🎮 Round started!');
    console.log('Spectrum:', msg.spectrum.left, '↔', msg.spectrum.right);
    console.log('Navigator:', msg.navigatorId);
    
    // Wait for hint phase to start
    setTimeout(() => {
      console.log('\n✅ Game is running! Check the URLs above in your browser.');
      console.log('Host ID:', hostId, '(keep this WebSocket alive)');
      console.log('Keeping connection open for 2 minutes...\n');
      
      // Keep alive for 2 minutes
      setTimeout(() => {
        console.log('Timeout - closing');
        process.exit(0);
      }, 120000);
    }, 5000);
  }
});

function addPlayers() {
  const playerData = [
    { name: 'Alice', avatar: '🐱' },
    { name: 'Bob', avatar: '🐶' },
    { name: 'Charlie', avatar: '🐼' }
  ];
  
  playerData.forEach((p, i) => {
    setTimeout(() => {
      const ws = new WebSocket('ws://localhost:3001');
      players.push(ws);
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'CONNECTED') {
          ws.send(JSON.stringify({
            type: 'JOIN_GAME',
            data: { gameId, name: p.name, avatar: p.avatar }
          }));
        } else if (msg.type === 'JOINED_GAME') {
          console.log(`✅ ${p.name} joined`);
          
          // Start round after last player joins
          if (i === playerData.length - 1) {
            setTimeout(() => {
              console.log('\n▶️ Starting round...');
              hostWs.send(JSON.stringify({
                type: 'START_ROUND',
                data: { gameId }
              }));
            }, 1000);
          }
        }
      });
    }, i * 500);
  });
}
