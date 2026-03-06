# Quick Start Guide - Web Interface

Get started with the Runpod Storage web interface in just a few minutes!

## Prerequisites

- Python 3.8+ with `uv` installed
- Node.js 18+ and npm
- Runpod API credentials ([Get them here](https://console.runpod.io/user/settings))

## Installation & Setup

### 1. Clone and Install Backend

```bash
git clone https://github.com/DEV1lmig/Runpod-Network-Volume-Storage-Tool.git
cd Runpod-Network-Volume-Storage-Tool
uv sync
```

### 2. Build Frontend (One-time setup)

```bash
./build-frontend.sh
```

This will:
- Install npm dependencies
- Build the React frontend
- Prepare it to be served by the API server

### 3. Start the Server

```bash
uv run runpod-storage-server
```

### 4. Open Your Browser

Navigate to: **http://localhost:8000**

## First Time Usage

### Step 1: Enter Your Credentials

You'll see a login form asking for three pieces of information:

1. **Runpod API Key** (starts with `rpa_`)
2. **S3 Access Key** (starts with `user_`)
3. **S3 Secret Key** (starts with `rps_`)

Get all three from your [Runpod Console Settings](https://console.runpod.io/user/settings).

### Step 2: Create a Volume (if you don't have one)

1. Click the **Volume Management** tab
2. Click **Create Volume**
3. Enter:
   - Name: `my-storage`
   - Size: `50` (GB)
   - Datacenter: Choose one closest to you
4. Click **Create Volume**

### Step 3: Upload Your First File

1. Click the **File Operations** tab
2. Select your volume from the dropdown
3. Click **Upload File**
4. Drag and drop a file or click to browse
5. Click **Upload**

That's it! Your file is now in your Runpod storage.

## Common Tasks

### Upload a File
1. File Operations tab → Upload File → Drag & Drop → Upload

### Download a File
1. Find the file in the list → Click download icon (↓)

### Delete a File
1. Find the file → Click trash icon (🗑) → Confirm

### Create a Folder
1. Upload a file with a path like `folder/file.txt`
2. The folder will be created automatically

### Navigate Folders
1. Click on a folder name to enter it
2. Click **Back** to go up one level

## Development Mode (Optional)

For developing the frontend with hot-reload:

```bash
# Terminal 1 - Start API server
uv run runpod-storage-server

# Terminal 2 - Start frontend dev server
cd frontend
npm run dev
```

Access at http://localhost:3000

## Troubleshooting

**Can't connect to server?**
- Make sure `uv run runpod-storage-server` is running
- Check http://localhost:8000/health shows `{"status":"healthy"}`

**Authentication errors?**
- Double-check your API keys from Runpod Console
- Make sure you copied the complete keys (no extra spaces)

**Upload fails?**
- Check your internet connection
- Verify the volume has enough space
- Try a smaller file first

## Next Steps

- Read the [Full Web Interface Guide](docs/WEB_INTERFACE_GUIDE.md)
- Check out the [Main README](README.md) for CLI and SDK usage
- Review [API Documentation](http://localhost:8000/docs) when server is running

## Need Help?

- Check [GitHub Issues](https://github.com/DEV1lmig/Runpod-Network-Volume-Storage-Tool/issues)
- Review server logs if something isn't working
- Open browser developer console (F12) to see error messages
