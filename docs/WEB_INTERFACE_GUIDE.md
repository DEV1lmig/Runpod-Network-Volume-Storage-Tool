# Web Interface Usage Guide

This guide provides step-by-step instructions for using the Runpod Storage web interface.

## Getting Started

### 1. Start the API Server

First, make sure the API server is running:

```bash
uv run runpod-storage-server
```

The server will start on http://localhost:8000

### 2. Access the Web Interface

**Option A: Production Mode** (Recommended)
1. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Access the interface at http://localhost:8000

**Option B: Development Mode**
1. In a separate terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Access the interface at http://localhost:3000

## Using the Interface

### Entering Credentials

When you first open the interface, you'll see a credentials form:

1. **Runpod API Key**: Enter your Runpod API key (starts with `rpa_`)
   - Get it from [Runpod Console → Settings](https://console.runpod.io/user/settings)

2. **S3 Access Key**: Enter your S3 access key (starts with `user_`)
   - Get it from Runpod Console

3. **S3 Secret Key**: Enter your S3 secret key (starts with `rps_`)
   - Get it from Runpod Console

4. Click **Connect**

Your credentials are stored only in memory and are never saved to disk.

### Managing Volumes

Click on the **Volume Management** tab to:

#### Creating a Volume

1. Click **Create Volume**
2. Fill in the form:
   - **Volume Name**: Choose a descriptive name (e.g., "ml-datasets")
   - **Size (GB)**: Enter size between 10-4000 GB
   - **Datacenter**: Select a datacenter close to you
3. Click **Create Volume**

#### Viewing Volumes

All your volumes are displayed as cards showing:
- Volume name
- Volume ID
- Size in GB
- Datacenter location

#### Deleting a Volume

1. Click the trash icon on the volume card
2. Confirm the deletion (this cannot be undone!)

### Managing Files

Click on the **File Operations** tab to work with files.

#### Selecting a Volume

Use the dropdown at the top to select which volume you want to work with. The file browser will automatically refresh.

#### Browsing Files

The file browser shows:
- **Folders**: Displayed with a folder icon, shows number of items
- **Files**: Displayed with a file icon, shows size and last modified date

To navigate:
- Click on a folder to enter it
- Click **Back** to go up one level
- The current path is displayed above the file list

#### Uploading Files

1. Click **Upload File**
2. In the upload dialog:
   - Drag and drop a file onto the upload area, OR
   - Click the upload area to select a file
3. Review/edit the remote path (defaults to current folder + filename)
4. Click **Upload**
5. Watch the progress bar as the file uploads
6. The dialog will close automatically when complete

**Tips:**
- Files are uploaded to the current folder you're viewing
- You can edit the remote path to upload to a different location
- Large files will show upload progress

#### Downloading Files

1. Click the download icon (↓) next to a file
2. The file will be downloaded to your browser's download folder
3. A success message will appear when complete

#### Deleting Files

1. Click the trash icon (🗑) next to a file
2. Confirm the deletion
3. The file list will refresh automatically

### Tips and Best Practices

#### Organization

- Create a folder structure before uploading files
- Use descriptive names for volumes and files
- Group related files in folders

#### Performance

- For large uploads, use a stable internet connection
- Upload during off-peak hours for better speeds
- Consider compressing files before uploading

#### Security

- Never share your API keys
- Log out when finished (click **Logout** button)
- Clear your browser history if using a shared computer

## Troubleshooting

### "Server Connection Error"

This means the API server is not running or not reachable.

**Solution:**
1. Make sure the API server is running:
   ```bash
   uv run runpod-storage-server
   ```
2. Check that it's on port 8000
3. Try accessing http://localhost:8000/health in your browser

### "Invalid API key" or "Authentication failed"

Your credentials are incorrect or expired.

**Solution:**
1. Click **Logout**
2. Get fresh credentials from [Runpod Console](https://console.runpod.io/user/settings)
3. Re-enter your credentials

### "Failed to load volumes" or "Failed to load files"

This usually means there's an issue with your S3 credentials.

**Solution:**
1. Verify your S3 access key and secret key are correct
2. Check that the keys have the necessary permissions
3. Try logging out and back in

### Upload Fails

**Solution:**
1. Check your internet connection
2. Verify the volume has enough space
3. Try uploading a smaller file first
4. Check the remote path doesn't contain invalid characters

### Files Don't Appear After Upload

**Solution:**
1. Click the **Refresh** button
2. Navigate to the correct folder
3. Wait a few seconds and refresh again

## Keyboard Shortcuts

Currently, the interface does not support keyboard shortcuts, but they may be added in future versions.

## Browser Compatibility

The interface works best with modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Getting Help

If you encounter issues:
1. Check the browser console for error messages (F12)
2. Review the API server logs
3. Check the [GitHub Issues](https://github.com/DEV1lmig/Runpod-Network-Volume-Storage-Tool/issues)
4. Refer to the main [README.md](../README.md)
