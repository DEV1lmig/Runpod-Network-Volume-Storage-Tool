# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            React Frontend (Port 3000/dev)            │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ Credentials │  │    Volume    │  │    File    │ │   │
│  │  │    Form     │  │  Management  │  │ Operations │ │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘ │   │
│  │                                                      │   │
│  │              API Client (Axios)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              FastAPI Server (Port 8000)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  API Routes                          │   │
│  │  - /api/v1/volumes                                   │   │
│  │  - /api/v1/volumes/{id}/files                       │   │
│  │  - /health                                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Core API Client                         │   │
│  │  - Volume operations                                 │   │
│  │  - File operations                                   │   │
│  │  - S3 client wrapper                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ S3 API / GraphQL
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Runpod Cloud Services                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Network Volumes                        │   │
│  │  - S3-compatible storage                             │   │
│  │  - Volume management API                             │   │
│  │  - Multiple datacenters                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Flow

### 1. Authentication Flow
```
User → Credentials Form → API Client
                            ↓
                     Store in Memory
                            ↓
                    Add to All Requests
```

### 2. File Upload Flow
```
User → File Drop Zone → FileUpload Component
                            ↓
                     Form Data + Path
                            ↓
                       API Client
                            ↓
              POST /volumes/{id}/files
                            ↓
                  FastAPI Server
                            ↓
                 Temp File Handler
                            ↓
              S3 Client (boto3)
                            ↓
              Runpod S3 Storage
```

### 3. File Browse Flow
```
User → Volume Selector → FileManager Component
                            ↓
                  List Files Request
                            ↓
                       API Client
                            ↓
            POST /volumes/{id}/files/list
                            ↓
                  FastAPI Server
                            ↓
                   S3 List Objects
                            ↓
              Return File Metadata
                            ↓
                Display in File List
```

### 4. Volume Management Flow
```
User → Volume Manager → API Client
                            ↓
              POST/DELETE /volumes
                            ↓
                  FastAPI Server
                            ↓
               Runpod GraphQL API
                            ↓
           Volume Created/Deleted
                            ↓
              Update Volume List
```

## File Structure

```
runpod-network-volume-storage-tool/
├── frontend/                    # React web interface
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── services/           # API client
│   │   ├── types/              # TypeScript types
│   │   ├── styles/             # CSS styles
│   │   └── App.tsx             # Main app
│   ├── dist/                   # Built static files (gitignored)
│   └── package.json
│
├── src/runpod_storage/         # Python backend
│   ├── server/
│   │   ├── main.py            # FastAPI app + static serving
│   │   └── routes.py          # API endpoints
│   ├── core/
│   │   ├── api.py             # Runpod API client
│   │   ├── s3_client.py       # S3 operations
│   │   └── models.py          # Data models
│   └── cli/                   # CLI interface
│
├── docs/                       # Documentation
│   ├── QUICKSTART_WEB.md
│   ├── WEB_INTERFACE_GUIDE.md
│   └── api/
│
└── build-frontend.sh          # Build script
```

## Data Flow

### Credentials (In-Memory Only)
```
Browser Memory → API Client → HTTP Headers → FastAPI → Runpod
     ↑                                                      │
     │                                                      │
     └──────────────────────────────────────────────────────┘
                    (Never persisted to disk)
```

### File Upload (Large Files)
```
Browser File → Chunks → FormData → FastAPI Temp → S3 Multipart
                                       ↓
                                  Progress %
                                       ↓
                               Update UI Progress
```

### File Download
```
S3 Storage → FastAPI Temp → Response Stream → Browser Blob
                                                    ↓
                                           Save to Downloads
```

## API Endpoints

### Volume Endpoints (Runpod API Key required)
- `GET /api/v1/volumes` - List all volumes
- `POST /api/v1/volumes` - Create volume
- `GET /api/v1/volumes/{id}` - Get volume details
- `PATCH /api/v1/volumes/{id}` - Update volume
- `DELETE /api/v1/volumes/{id}` - Delete volume
- `GET /api/v1/datacenters` - List datacenters

### File Endpoints (API Key + S3 Keys required)
- `POST /api/v1/volumes/{id}/files/list` - List files
- `POST /api/v1/volumes/{id}/files` - Upload file
- `POST /api/v1/volumes/{id}/files/download` - Download file
- `POST /api/v1/volumes/{id}/files/delete` - Delete file

### Health Endpoints
- `GET /health` - Health check
- `GET /` - Frontend or API info

## Development vs Production

### Development Mode
```
Frontend (Vite) :3000  ──proxy──┐
                                 │
Backend (FastAPI) :8000 ←────────┘

Hot reload enabled for both
```

### Production Mode
```
Browser :8000
    │
    ├─── / (static files)     → Frontend (built)
    │
    └─── /api/v1/*            → Backend (API routes)

Single server, single port
```

## Security Considerations

1. **Credentials**: Stored only in browser memory
2. **CORS**: Enabled for all origins (configure for production)
3. **HTTPS**: Use reverse proxy (nginx/caddy) for production
4. **API Keys**: Never logged or persisted client-side
5. **File Uploads**: Temporary storage, cleaned after upload

## Performance Optimizations

1. **Chunked Uploads**: Large files split into chunks
2. **Progress Tracking**: Real-time upload progress
3. **Lazy Loading**: Components loaded as needed
4. **Debouncing**: Prevents excessive API calls
5. **Caching**: Browser caches static assets

## Deployment Options

### Option 1: Single Server (Recommended)
```bash
cd frontend && npm run build
cd .. && uv run runpod-storage-server
```
Access at http://localhost:8000

### Option 2: Separate Servers
```bash
# Terminal 1
uv run runpod-storage-server

# Terminal 2
cd frontend && npm run dev
```
Access at http://localhost:3000

### Option 3: Docker
```dockerfile
FROM python:3.11
# Install Node.js
# Copy and build frontend
# Install Python deps
# Run server
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive design)

## Future Scalability

The architecture supports future enhancements:
- WebSocket for real-time updates
- Service worker for offline support
- CDN for static assets
- Load balancing for multiple instances
- Redis for session management
- Database for user preferences
