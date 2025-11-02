# Deployment Guide

This guide explains how to deploy the Odd Ball Out game to production.

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- A server with public IP or domain
- Port 3001 available (or configure different port)

## Local Development

1. **Clone and Install:**
```bash
git clone https://github.com/ChadMC/odd-ball-out.git
cd odd-ball-out
npm run install-all
```

2. **Run Development Server:**
```bash
npm run dev
```

This starts both server (port 3001) and client (port 5173).

## Production Deployment

### Option 1: Single Server Setup

1. **Build the Client:**
```bash
cd client
npm run build
```

2. **Serve Static Files:**
Update `server/index.js` to serve the built client:

```javascript
// Add before REST endpoints
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, '../client/dist')));

// Catch-all route for React Router
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});
```

3. **Start Server:**
```bash
cd server
npm start
```

Or use PM2 for process management:
```bash
npm install -g pm2
pm2 start index.js --name odd-ball-out
pm2 save
pm2 startup
```

### Option 2: Separate Hosting

**Server:**
- Deploy to any Node.js hosting (Heroku, Railway, DigitalOcean, etc.)
- Set environment variable `PORT` if needed
- Ensure WebSocket connections are allowed

**Client:**
- Build: `cd client && npm run build`
- Deploy `client/dist/` to static hosting (Netlify, Vercel, Cloudflare Pages, etc.)
- Set environment variables:
  - `VITE_WS_URL`: Your WebSocket server URL (e.g., `wss://your-server.com`)
  - `VITE_API_URL`: Your API server URL (e.g., `https://your-server.com`)

### Docker Deployment

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production
RUN cd client && npm ci

# Copy source
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/index.js"]
```

Build and run:
```bash
docker build -t odd-ball-out .
docker run -p 3001:3001 odd-ball-out
```

### Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: odd-ball-out
spec:
  replicas: 2
  selector:
    matchLabels:
      app: odd-ball-out
  template:
    metadata:
      labels:
        app: odd-ball-out
    spec:
      containers:
      - name: odd-ball-out
        image: your-registry/odd-ball-out:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
---
apiVersion: v1
kind: Service
metadata:
  name: odd-ball-out
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: odd-ball-out
```

Deploy:
```bash
kubectl apply -f k8s-deployment.yaml
```

## Environment Variables

### Server

- `PORT`: Server port (default: 3001)

### Client

Create `client/.env.production`:
```
VITE_WS_URL=wss://your-production-domain.com
VITE_API_URL=https://your-production-domain.com
```

## HTTPS/WSS Setup

For production, use HTTPS and WSS (secure WebSocket):

1. **Get SSL Certificate:**
   - Use Let's Encrypt with Certbot
   - Or use your cloud provider's certificate manager

2. **Configure Nginx as Reverse Proxy:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # WebSocket upgrade
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Update Client Environment:**
```
VITE_WS_URL=wss://your-domain.com
VITE_API_URL=https://your-domain.com
```

## Monitoring

Use PM2 for monitoring:
```bash
pm2 monit
pm2 logs odd-ball-out
```

Or integrate with monitoring tools:
- New Relic
- DataDog
- Grafana + Prometheus

## Scaling

For high traffic:

1. **Use Redis for State Management:**
   - Store game state in Redis instead of in-memory Map
   - Enables horizontal scaling across multiple servers

2. **Load Balancer:**
   - Use sticky sessions (session affinity) for WebSocket connections
   - Or use Redis pub/sub for cross-server communication

3. **CDN for Static Assets:**
   - Serve client assets from CDN (Cloudflare, CloudFront)

## Backup

The game state is ephemeral (no persistence), but consider:
- Logging game events for analytics
- Backing up question packs
- Monitoring error logs

## Security Checklist

- ✅ Use HTTPS/WSS in production
- ✅ Enable CORS only for your domain
- ✅ Rate limit API endpoints
- ✅ Validate all user inputs
- ✅ Keep dependencies updated
- ✅ Use environment variables for sensitive data
- ✅ Enable security headers

## Performance Tips

1. **Enable Gzip Compression:**
```javascript
import compression from 'compression';
app.use(compression());
```

2. **Set Cache Headers for Static Assets:**
```javascript
app.use(express.static('dist', {
  maxAge: '1y',
  etag: false
}));
```

3. **Connection Pooling:**
If using database, configure connection pooling properly.

## Troubleshooting

**WebSocket Connection Failed:**
- Check firewall settings
- Verify WebSocket URL is correct (ws:// or wss://)
- Check if proxy supports WebSocket upgrades

**Players Can't Join:**
- Verify server is accessible from outside network
- Check CORS settings
- Test with public IP/domain

**High Memory Usage:**
- Clean up disconnected games periodically
- Implement game expiration (delete games after X hours of inactivity)

## Support

For issues, open a GitHub issue or contact the maintainers.
