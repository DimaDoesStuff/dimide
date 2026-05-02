# DimIDE Extension Marketplace Server

A self-hosted extension marketplace for DimIDE. Host your own extensions or proxy to Open VSX.

## Quick Start

```bash
cd extension-marketplace-server
npm install
npm start
```

The server will start on `http://localhost:8080`

## Fetch Popular Extensions

```bash
npm run fetch-popular
```

This downloads 50+ popular extensions from Open VSX and creates the metadata file.

## Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)

### Adding Your Own Extensions

1. Put `.vsix` files in the `extensions/` folder
2. Update `extensions.json` with metadata

Example `extensions.json` structure:
```json
{
  "extensions": [
    {
      "publisher": { "publisherName": "mycompany", "displayName": "My Company" },
      "extensionName": "my-extension",
      "displayName": "My Extension",
      "shortDescription": "Does cool things",
      "versions": [{ "version": "1.0.0" }]
    }
  ]
}
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Web interface |
| `GET /api/extensions` | List/search extensions |
| `GET /api/extensions/:publisher/:name` | Extension details |
| `GET /api/download/:publisher/:name/:version` | Download .vsix |
| `GET /health` | Health check |

## Using with DimIDE

To configure DimIDE to use your marketplace, modify the product.json:

```json
{
  "extensionsGallery": {
    "serviceUrl": "http://your-server:8080/api",
    "itemUrl": "http://your-server:8080/api/extensions",
    "resourceUrlTemplate": "http://your-server:8080/api/download/{publisher}/{name}/{version}"
  }
}
```

## Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name dimide-marketplace
```

### Using Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

```bash
docker build -t dimide-marketplace .
docker run -p 8080:8080 -v $(pwd)/extensions:/app/extensions dimide-marketplace
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name extensions.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Extension Sources

This server can:
1. **Serve local extensions** - Place `.vsix` files in `extensions/`
2. **Proxy to Open VSX** - Falls back to open-vsx.org for missing extensions
3. **Cache downloads** - Stores downloaded extensions locally

## License

MIT
