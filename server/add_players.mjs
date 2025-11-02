import WebSocket from 'ws';

const gameId = process.argv[2] || '6B886D';
const numPlayers = parseInt(process.argv[3]) || 3;

const players = [
  { name: 'Alice', avatar: '🐱' },
  { name: 'Bob', avatar: '🐶' },
  { name: 'Charlie', avatar: '🐼' },
  { name: 'Diana', avatar: '🦊' },
];

async function addPlayer(player) {
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('open', () => {
      console.log(`Connecting ${player.name}...`);
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      console.log(`${player.name} received:`, msg.type);
      
      if (msg.type === 'CONNECTED') {
        ws.send(JSON.stringify({
          type: 'JOIN_GAME',
          data: {
            gameId: gameId,
            name: player.name,
            avatar: player.avatar
          }
        }));
      } else if (msg.type === 'JOINED_GAME') {
        console.log(`✅ ${player.name} joined game ${gameId}!`);
        setTimeout(() => {
          resolve();
        }, 1000);
      } else if (msg.type === 'ERROR') {
        console.error(`❌ ${player.name} error:`, msg.message);
        ws.close();
        resolve();
      }
    });
    
    ws.on('error', (err) => {
      console.error(`${player.name} WebSocket error:`, err.message);
      resolve();
    });
  });
}

async function main() {
  console.log(`Adding ${numPlayers} players to game ${gameId}...`);
  
  for (let i = 0; i < numPlayers && i < players.length; i++) {
    await addPlayer(players[i]);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('✨ Done adding players!');
  process.exit(0);
}

main();
