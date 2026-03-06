# Troubleshooting Guide - Web Interface

This guide helps resolve common issues when using the Runpod Storage web interface.

## Installation Issues

### Node.js Not Found

**Error**: `command not found: node` or `command not found: npm`

**Solution**:
```bash
# Install Node.js 18+ (choose one method)

# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Using package manager (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using package manager (macOS)
brew install node@18
```

### Build Script Fails

**Error**: `Permission denied: ./build-frontend.sh`

**Solution**:
```bash
chmod +x build-frontend.sh
./build-frontend.sh
```

### npm install Fails

**Error**: Various npm installation errors

**Solution**:
```bash
# Clear npm cache
cd frontend
npm cache clean --force

# Remove existing files
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Server Issues

### Server Won't Start

**Error**: `ModuleNotFoundError` or similar Python errors

**Solution**:
```bash
# Reinstall dependencies
uv sync

# Try running with explicit path
uv run python -m runpod_storage.server.main
```

### Port Already in Use

**Error**: `Address already in use: 8000`

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use a different port
uv run runpod-storage-server --port 8001
```

### Can't Access Server Remotely

**Issue**: Server works on localhost but not from other machines

**Solution**:
```bash
# Start server with 0.0.0.0 to accept external connections
uv run runpod-storage-server --host 0.0.0.0 --port 8000

# Make sure firewall allows port 8000
# On Linux:
sudo ufw allow 8000/tcp

# On macOS:
# System Preferences → Security & Privacy → Firewall → Add port 8000
```

## Frontend Issues

### White Screen / Blank Page

**Symptoms**: Browser shows blank page at http://localhost:8000

**Solutions**:

1. **Check if frontend is built**:
   ```bash
   ls frontend/dist/
   # Should show index.html and assets/
   ```
   If empty, run: `./build-frontend.sh`

2. **Check browser console** (F12):
   - Look for JavaScript errors
   - Check if files are loading (Network tab)

3. **Clear browser cache**:
   - Chrome: Ctrl+Shift+R (hard refresh)
   - Firefox: Ctrl+F5
   - Safari: Cmd+Option+R

4. **Try development mode**:
   ```bash
   cd frontend
   npm run dev
   ```
   Access at http://localhost:3000

### "Server Connection Error"

**Symptoms**: Red error message saying can't connect to server

**Solutions**:

1. **Verify server is running**:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy",...}
   ```

2. **Check server logs** for errors

3. **Restart the server**:
   ```bash
   # Press Ctrl+C to stop
   uv run runpod-storage-server
   ```

4. **Check if port is correct**:
   - In development: Frontend expects server on port 8000
   - Edit `frontend/vite.config.ts` if using different port

### Development Server Won't Start

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
cd frontend
PORT=3001 npm run dev
```

### Hot Reload Not Working

**Issue**: Changes to code don't reflect in browser

**Solutions**:

1. **Hard refresh**: Ctrl+Shift+R (Chrome) or Ctrl+F5 (Firefox)

2. **Restart dev server**:
   ```bash
   # In frontend terminal, press Ctrl+C
   npm run dev
   ```

3. **Check file watchers limit** (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

## Authentication Issues

### "Invalid API key" Error

**Symptoms**: Error when trying to connect with credentials

**Solutions**:

1. **Verify API key is correct**:
   - Go to [Runpod Console](https://console.runpod.io/user/settings)
   - Copy the API key exactly (no extra spaces)
   - Key should start with `rpa_`

2. **Check key is not expired**:
   - Some API keys have expiration dates
   - Generate a new key if needed

3. **Test key with curl**:
   ```bash
   curl -H "runpod-api-key: YOUR_KEY" http://localhost:8000/api/v1/volumes
   ```

### "S3 credentials required" Error

**Symptoms**: Volume operations work but file operations fail

**Solutions**:

1. **Verify all three credentials**:
   - Runpod API Key (rpa_...)
   - S3 Access Key (user_...)
   - S3 Secret Key (rps_...)

2. **Check S3 keys are enabled**:
   - In Runpod Console, ensure S3 API access is enabled
   - Keys might need to be regenerated

3. **Test S3 credentials separately**:
   ```bash
   # Install AWS CLI
   pip install awscli

   # Test credentials
   aws s3 ls --endpoint-url=https://s3api-eu-ro-1.runpod.io/ \
     --profile runpod
   ```

### Credentials Lost on Refresh

**Symptoms**: Have to re-enter credentials after page refresh

**This is expected behavior** for security:
- Credentials are stored only in browser memory
- They're never saved to disk or cookies
- You must re-enter them after closing/refreshing the page

**Alternative**: Use environment variables with the CLI:
```bash
export RUNPOD_API_KEY="your_key"
export RUNPOD_S3_ACCESS_KEY="your_access_key"
export RUNPOD_S3_SECRET_KEY="your_secret_key"
```

## File Operation Issues

### Upload Fails

**Error**: File upload shows error or gets stuck

**Solutions**:

1. **Check file size**:
   - Very large files (>5GB) may timeout
   - Try smaller files first to test
   - Use CLI for very large files: `uv run runpod-storage upload file.bin volume-id`

2. **Check internet connection**:
   - Upload requires stable connection
   - Try again on better network

3. **Check volume has space**:
   - Look at volume size in Volume Management tab
   - Files won't upload if volume is full

4. **Check filename**:
   - Avoid special characters: `< > : " | ? * \`
   - Use alphanumeric and `-`, `_`, `.` only

5. **Check browser console** (F12) for detailed error

### Download Fails

**Error**: Download doesn't start or file is corrupted

**Solutions**:

1. **Check browser pop-up blocker**:
   - Allow pop-ups for localhost:8000
   - Some browsers block automatic downloads

2. **Check disk space**:
   - Ensure enough space for download
   - Check Downloads folder permissions

3. **Try different browser**:
   - Some browsers have download restrictions
   - Chrome/Firefox usually work best

4. **Use CLI as alternative**:
   ```bash
   uv run runpod-storage download volume-id remote/file.txt local/file.txt
   ```

### Delete Confirmation Doesn't Appear

**Issue**: Clicking delete doesn't show confirmation

**Solutions**:

1. **Check browser pop-up settings**:
   - Allow dialogs for localhost:8000
   - Enable JavaScript

2. **Check browser console for errors**

3. **Try different browser**

### Files Don't Appear After Upload

**Issue**: Upload succeeds but file not visible

**Solutions**:

1. **Click Refresh button**:
   - File list may need manual refresh
   - Wait a few seconds first

2. **Check you're in correct folder**:
   - Files may be in different path than expected
   - Use "Back" to navigate up

3. **Verify upload actually succeeded**:
   - Check for success message
   - Check server logs

4. **List files via CLI**:
   ```bash
   uv run runpod-storage list-files volume-id
   ```

### Can't Navigate to Folders

**Issue**: Clicking folder doesn't open it

**Solutions**:

1. **Check if it's actually a folder**:
   - Folders show folder icon and "items" count
   - Files show file icon and size

2. **Click the folder icon** directly

3. **Refresh the page** and try again

4. **Check browser console for errors**

## Performance Issues

### Slow Upload Speeds

**Solutions**:

1. **Check your internet speed**:
   ```bash
   # Test upload speed
   speedtest-cli
   ```

2. **Choose datacenter closest to you**:
   - EU users: EU-RO-1, EU-CZ-1, or EUR-IS-1
   - US users: US-KS-2

3. **Use wired connection** instead of WiFi

4. **Upload during off-peak hours**

5. **Compress files before uploading**:
   ```bash
   tar czf archive.tar.gz folder/
   ```

### Slow Page Load

**Solutions**:

1. **Build frontend for production**:
   ```bash
   ./build-frontend.sh
   ```
   Production build is much faster

2. **Clear browser cache**

3. **Check for browser extensions** that might slow things down

4. **Use modern browser** (Chrome 90+, Firefox 88+, etc.)

### UI Freezes During Operations

**Solutions**:

1. **Don't close browser tab** during uploads

2. **Avoid uploading multiple large files** simultaneously

3. **Close other browser tabs** to free up memory

4. **Restart browser** if it becomes unresponsive

## Browser-Specific Issues

### Safari Issues

**Issue**: Some features don't work in Safari

**Solutions**:

1. **Update Safari** to latest version (14+)

2. **Enable JavaScript**: Preferences → Security → Enable JavaScript

3. **Clear Website Data**: Safari → Preferences → Privacy → Manage Website Data

4. **Try Chrome or Firefox** as alternative

### Firefox Issues

**Issue**: Upload progress not showing

**Solutions**:

1. **Update Firefox** to version 88+

2. **Disable strict tracking protection** for localhost:
   - Click shield icon in address bar
   - Turn off Enhanced Tracking Protection

3. **Clear cache**: Ctrl+Shift+Delete

### Mobile Browser Issues

**Issue**: UI doesn't work well on mobile

**Solutions**:

1. **Use desktop browser** when possible:
   - Mobile browsers have limitations
   - Better experience on desktop

2. **Try Chrome mobile** (best mobile support)

3. **Use landscape orientation** for more space

4. **Use CLI on mobile** if available:
   ```bash
   # Install Termux on Android
   # Run CLI commands
   ```

## Network Issues

### CORS Errors

**Error**: CORS policy blocking requests

**Solutions**:

1. **In development**: Ensure using proxy (should work automatically)

2. **In production**: Check server CORS settings in `server/main.py`

3. **Don't access via IP + port mismatch**:
   - Use http://localhost:8000 (not 127.0.0.1)
   - Or configure CORS to allow your IP

### Timeout Errors

**Error**: Request timeout or connection timeout

**Solutions**:

1. **Check internet connection**

2. **Increase timeout** (requires code change):
   ```typescript
   // In frontend/src/services/api.ts
   axios.create({
     timeout: 300000, // 5 minutes instead of default
   });
   ```

3. **Use CLI for large operations**:
   ```bash
   uv run runpod-storage upload large-file.bin volume-id
   ```

## Getting More Help

### Check Logs

1. **Browser Console** (F12):
   - See JavaScript errors
   - Check network requests
   - View API responses

2. **Server Logs**:
   - Terminal where server is running
   - Shows API errors and stack traces

3. **Network Tab** (F12 → Network):
   - See all HTTP requests
   - Check request/response details
   - Verify correct URLs and methods

### Report Issues

If you can't resolve the issue:

1. **Check [GitHub Issues](https://github.com/DEV1lmig/Runpod-Network-Volume-Storage-Tool/issues)**

2. **Open new issue** with:
   - Description of problem
   - Steps to reproduce
   - Browser and OS version
   - Error messages from console
   - Server logs if relevant

3. **Include**:
   - `node --version`
   - `python --version`
   - `uv --version`
   - Browser name and version

### Quick Diagnostic

Run this to check your setup:

```bash
# Check versions
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "Python: $(python --version)"
echo "uv: $(uv --version)"

# Check files
echo "Frontend built: $(ls -la frontend/dist/ | wc -l) files"

# Check server
curl -s http://localhost:8000/health | python -m json.tool

# Check ports
echo "Port 8000: $(lsof -i :8000 | wc -l) process(es)"
echo "Port 3000: $(lsof -i :3000 | wc -l) process(es)"
```

## Still Need Help?

- Review the [Quick Start Guide](QUICKSTART_WEB.md)
- Check the [User Guide](WEB_INTERFACE_GUIDE.md)
- Read the [Architecture Documentation](ARCHITECTURE.md)
- Try the CLI as an alternative
- Contact Runpod support for API issues
