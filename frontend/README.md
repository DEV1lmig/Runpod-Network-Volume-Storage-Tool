# Runpod Storage Frontend

A modern React-based web interface for managing Runpod network volumes and files.

## Features

- **Volume Management**: Create, list, and delete network volumes
- **File Operations**: Upload, download, browse, and delete files
- **Drag & Drop Upload**: Intuitive file upload with drag and drop support
- **Real-time Progress**: Visual feedback for upload operations
- **Folder Navigation**: Browse through folder structures
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 18+ or npm
- Running Runpod Storage API server on port 8000

## Installation

```bash
cd frontend
npm install
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

The frontend will be available at http://localhost:3000 and will proxy API requests to http://localhost:8000.

## Building for Production

Build the frontend for production:

```bash
npm run build
```

The built files will be in the `dist/` directory. The FastAPI server will automatically serve these files when accessing the root URL.

## Usage

1. Start the API server:
   ```bash
   cd ..
   uv run runpod-storage-server
   ```

2. In development mode:
   ```bash
   cd frontend
   npm run dev
   ```
   Open http://localhost:3000

3. In production mode:
   ```bash
   cd frontend
   npm run build
   cd ..
   uv run runpod-storage-server
   ```
   Open http://localhost:8000

## Configuration

The frontend uses a proxy in development mode to forward API requests to the backend. This is configured in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:8000',
    '/health': 'http://localhost:8000'
  }
}
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── CredentialsForm.tsx
│   │   ├── FileManager.tsx
│   │   ├── FileUpload.tsx
│   │   ├── VolumeManager.tsx
│   │   └── VolumeSelector.tsx
│   ├── services/            # API client
│   │   └── api.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── styles/             # CSS styles
│   │   └── App.css
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technologies

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API calls
- **react-dropzone**: Drag and drop file uploads
- **lucide-react**: Modern icon library

## API Integration

The frontend communicates with the Runpod Storage API using the following endpoints:

- `GET /api/v1/volumes` - List volumes
- `POST /api/v1/volumes` - Create volume
- `DELETE /api/v1/volumes/{id}` - Delete volume
- `POST /api/v1/volumes/{id}/files/list` - List files
- `POST /api/v1/volumes/{id}/files` - Upload file
- `POST /api/v1/volumes/{id}/files/download` - Download file
- `POST /api/v1/volumes/{id}/files/delete` - Delete file

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT License - See LICENSE file for details
