# ZIP File Extraction Guide

Extract zip files directly within your Runpod network volumes.

## Overview

The zip extraction feature allows you to:
- Upload a zip file to your volume
- Extract it directly within the volume (no local download needed)
- Choose the target directory for extracted files
- Track extraction progress

This is useful for:
- Deploying archived applications
- Extracting backup files
- Unpacking datasets
- Batch file uploads

## How It Works

1. **Download**: The zip file is downloaded from the volume to a temporary location
2. **Extract**: Files are extracted locally
3. **Upload**: Each extracted file is uploaded back to the volume
4. **Cleanup**: Temporary files are automatically cleaned up

## Usage

### Python SDK

#### Basic Extraction

```python
from runpod_storage import RunpodStorageAPI

api = RunpodStorageAPI()

# Extract to the same directory as the zip file
files = api.extract_zip("volume-id", "data/archive.zip")
print(f"Extracted {len(files)} files: {files}")
```

#### Custom Target Directory

```python
# Extract to a specific directory
files = api.extract_zip(
    "volume-id",
    "backups/backup.zip",
    target_path="restored/"
)
```

#### With Progress Tracking

```python
def progress_callback(current, total, filename):
    percent = (current / total) * 100
    print(f"[{percent:.1f}%] Uploading: {filename}")

files = api.extract_zip(
    "volume-id",
    "large-archive.zip",
    target_path="extracted/",
    progress_callback=progress_callback
)
```

### REST API

#### Extract ZIP File

```bash
curl -X POST "http://localhost:8000/api/v1/volumes/{volume_id}/files/extract" \
  -H "runpod-api-key: rpa_your_key" \
  -H "s3-access-key: user_your_key" \
  -H "s3-secret-key: rps_your_key" \
  -d "zip_path=data/archive.zip"
```

#### With Target Directory

```bash
curl -X POST "http://localhost:8000/api/v1/volumes/{volume_id}/files/extract" \
  -H "runpod-api-key: rpa_your_key" \
  -H "s3-access-key: user_your_key" \
  -H "s3-secret-key: rps_your_key" \
  -d "zip_path=data/archive.zip" \
  -d "target_path=extracted/"
```

#### Response

```json
{
  "success": true,
  "extracted_files": [
    "extracted/file1.txt",
    "extracted/file2.txt",
    "extracted/subdir/file3.txt"
  ],
  "total_files": 3,
  "target_path": "extracted/"
}
```

### Web Interface

1. Navigate to the **File Operations** tab
2. Select your volume
3. Find the zip file in the file list
4. Click the **Extract** button (archive icon)
5. Confirm the extraction
6. Files will be extracted to the same directory as the zip file
7. Refresh the file list to see extracted files

## CLI Command (Coming Soon)

```bash
# Extract a zip file
uv run runpod-storage extract volume-id data/archive.zip

# Extract to specific directory
uv run runpod-storage extract volume-id data/archive.zip --target extracted/
```

## Complete Example

```python
from runpod_storage import RunpodStorageAPI
import zipfile
import os

api = RunpodStorageAPI()
volume_id = "your-volume-id"

# 1. Create a sample zip file locally
with zipfile.ZipFile('demo.zip', 'w') as zipf:
    zipf.writestr('readme.txt', 'Hello World')
    zipf.writestr('data/file1.txt', 'File 1 content')
    zipf.writestr('data/file2.txt', 'File 2 content')

# 2. Upload the zip file to the volume
api.upload_file('demo.zip', volume_id, 'archives/demo.zip')
print("✓ Uploaded demo.zip")

# 3. Extract the zip file in the volume
extracted = api.extract_zip(
    volume_id,
    'archives/demo.zip',
    target_path='extracted/'
)
print(f"✓ Extracted {len(extracted)} files")

# 4. List extracted files
files = api.list_files(volume_id, prefix='extracted/')
for file in files:
    print(f"  • {file['key']} ({file['size']} bytes)")

# 5. Clean up
api.delete_file(volume_id, 'archives/demo.zip')
for file_path in extracted:
    api.delete_file(volume_id, file_path)
os.remove('demo.zip')
print("✓ Cleanup complete")
```

## File Structure Preservation

The extraction preserves the directory structure inside the zip file:

**Zip contents:**
```
archive.zip
├── file1.txt
├── file2.txt
└── subdir/
    └── file3.txt
```

**After extraction to `extracted/`:**
```
extracted/
├── file1.txt
├── file2.txt
└── subdir/
    └── file3.txt
```

## Best Practices

### 1. Use Appropriate Target Paths

```python
# Good: Clear, organized structure
api.extract_zip(vol_id, "backups/2024-01.zip", target_path="restored/2024-01/")

# Avoid: Extracting to root can clutter the volume
api.extract_zip(vol_id, "archive.zip")  # Extracts to same directory
```

### 2. Check Zip File Size

Large zip files take longer to extract:

```python
files = api.list_files(volume_id)
zip_file = next(f for f in files if f['key'] == 'large.zip')
size_gb = zip_file['size'] / (1024**3)

if size_gb > 10:
    print(f"Warning: Large zip file ({size_gb:.1f} GB) may take several minutes")

api.extract_zip(volume_id, 'large.zip')
```

### 3. Clean Up After Extraction

```python
# Keep the original zip and extracted files
extracted = api.extract_zip(vol_id, "archive.zip", target_path="data/")

# Or delete the zip after successful extraction
if extracted:
    api.delete_file(vol_id, "archive.zip")
    print("✓ Zip file deleted after successful extraction")
```

### 4. Handle Errors Gracefully

```python
try:
    files = api.extract_zip(volume_id, "data/archive.zip")
    print(f"Success! Extracted {len(files)} files")
except ValueError as e:
    print(f"Invalid zip file: {e}")
except Exception as e:
    print(f"Extraction failed: {e}")
```

## Limitations

- **Zip files only**: Currently only supports `.zip` format (not `.tar`, `.tar.gz`, `.7z`, etc.)
- **File size**: Very large zip files (>50GB) may take significant time to extract
- **Temp space**: Requires enough temporary disk space to hold the extracted files
- **Nested zips**: Nested zip files are not automatically extracted

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid zip file" | Corrupted or non-zip file | Verify the file is a valid zip |
| "Volume not found" | Invalid volume ID | Check volume ID is correct |
| "File not found" | Zip file doesn't exist | Verify the zip path is correct |
| "Authentication failed" | Invalid credentials | Check API keys are valid |

## Performance

Extraction time depends on:
- **Zip file size**: Larger files take longer to download
- **Number of files**: More files means more upload operations
- **File sizes**: Many small files are slower than few large files
- **Network speed**: Both download and upload speeds matter

**Approximate times** (may vary):
- Small zip (1MB, 10 files): ~5-10 seconds
- Medium zip (100MB, 100 files): ~1-2 minutes
- Large zip (1GB, 1000 files): ~5-10 minutes
- Very large zip (10GB, 10000 files): ~30-60 minutes

## Troubleshooting

### Extraction is Slow

- Check your internet connection speed
- Use progress callback to monitor progress
- Consider extracting locally and uploading via `upload_directory()` instead

### Out of Disk Space

The extraction uses temporary local storage. If you get disk space errors:
- Free up space on your system
- Extract smaller zip files
- Use a machine with more disk space

### Files Not Appearing

- Wait a few seconds and refresh
- Check the target path is correct
- Verify extraction completed successfully

## See Also

- [File Operations Guide](WEB_INTERFACE_GUIDE.md)
- [API Documentation](http://localhost:8000/docs)
- [Python SDK Documentation](../README.md#python-sdk-usage)
