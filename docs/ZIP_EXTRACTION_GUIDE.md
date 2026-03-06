# Archive File Extraction Guide

Extract zip and 7z archive files directly within your Runpod network volumes.

## Overview

The archive extraction feature allows you to:
- Upload an archive file (.zip or .7z) to your volume
- Extract it directly within the volume (no local download needed)
- Choose the target directory for extracted files
- Track extraction progress

This is useful for:
- Deploying archived applications
- Extracting backup files
- Unpacking datasets
- Batch file uploads

## How It Works

1. **Download**: The archive file is downloaded from the volume to a temporary location
2. **Extract**: Files are extracted locally using the appropriate decompressor (zip or 7z)
3. **Upload**: Each extracted file is uploaded back to the volume
4. **Cleanup**: Temporary files are automatically cleaned up

## Usage

### Python SDK

#### Basic Extraction

```python
from runpod_storage import RunpodStorageAPI

api = RunpodStorageAPI()

# Extract zip file to the same directory
files = api.extract_archive("volume-id", "data/archive.zip")
print(f"Extracted {len(files)} files: {files}")

# Extract 7z file to the same directory
files = api.extract_archive("volume-id", "data/backup.7z")
print(f"Extracted {len(files)} files: {files}")
```

#### Custom Target Directory

```python
# Extract zip to a specific directory
files = api.extract_archive(
    "volume-id",
    "backups/backup.zip",
    target_path="restored/"
)

# Extract 7z to a specific directory
files = api.extract_archive(
    "volume-id",
    "archives/data.7z",
    target_path="extracted/"
)
```

#### With Progress Tracking

```python
def progress_callback(current, total, filename):
    percent = (current / total) * 100
    print(f"[{percent:.1f}%] Uploading: {filename}")

# Works with both zip and 7z files
files = api.extract_archive(
    "volume-id",
    "large-archive.7z",
    target_path="extracted/",
    progress_callback=progress_callback
)
```

#### Backward Compatibility

```python
# The old extract_zip() method still works for zip files
files = api.extract_zip("volume-id", "data/archive.zip")
# But extract_archive() is recommended as it supports both formats
```

### REST API

#### Extract Archive File (ZIP or 7Z)

```bash
# Extract zip file
curl -X POST "http://localhost:8000/api/v1/volumes/{volume_id}/files/extract" \
  -H "runpod-api-key: rpa_your_key" \
  -H "s3-access-key: user_your_key" \
  -H "s3-secret-key: rps_your_key" \
  -d "archive_path=data/archive.zip"

# Extract 7z file
curl -X POST "http://localhost:8000/api/v1/volumes/{volume_id}/files/extract" \
  -H "runpod-api-key: rpa_your_key" \
  -H "s3-access-key: user_your_key" \
  -H "s3-secret-key: rps_your_key" \
  -d "archive_path=data/backup.7z"
```

#### With Target Directory

```bash
curl -X POST "http://localhost:8000/api/v1/volumes/{volume_id}/files/extract" \
  -H "runpod-api-key: rpa_your_key" \
  -H "s3-access-key: user_your_key" \
  -H "s3-secret-key: rps_your_key" \
  -d "archive_path=data/archive.7z" \
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
3. Find the archive file (.zip or .7z) in the file list
4. Click the **Extract** button (archive icon)
5. Confirm the extraction
6. Files will be extracted to the same directory as the archive file
7. Refresh the file list to see extracted files

## CLI Command (Coming Soon)

```bash
# Extract a zip or 7z file
uv run runpod-storage extract volume-id data/archive.zip
uv run runpod-storage extract volume-id data/backup.7z

# Extract to specific directory
uv run runpod-storage extract volume-id data/archive.7z --target extracted/
```

## Complete Example

```python
from runpod_storage import RunpodStorageAPI
import zipfile
import py7zr
import os

api = RunpodStorageAPI()
volume_id = "your-volume-id"

# Example 1: Create and extract a ZIP file
with zipfile.ZipFile('demo.zip', 'w') as zipf:
    zipf.writestr('readme.txt', 'Hello World')
    zipf.writestr('data/file1.txt', 'File 1 content')
    zipf.writestr('data/file2.txt', 'File 2 content')

api.upload_file('demo.zip', volume_id, 'archives/demo.zip')
print("✓ Uploaded demo.zip")

extracted = api.extract_archive(
    volume_id,
    'archives/demo.zip',
    target_path='extracted/'
)
print(f"✓ Extracted {len(extracted)} files from ZIP")

# Example 2: Create and extract a 7Z file
with py7zr.SevenZipFile('demo.7z', 'w') as archive:
    archive.writestr('readme.txt', 'Hello from 7z')
    archive.writestr('data/file1.txt', 'File 1 content')
    archive.writestr('data/file2.txt', 'File 2 content')

api.upload_file('demo.7z', volume_id, 'archives/demo.7z')
print("✓ Uploaded demo.7z")

extracted_7z = api.extract_archive(
    volume_id,
    'archives/demo.7z',
    target_path='extracted_7z/'
)
print(f"✓ Extracted {len(extracted_7z)} files from 7Z")

# List extracted files
files = api.list_files(volume_id, prefix='extracted/')
for file in files:
    print(f"  • {file['key']} ({file['size']} bytes)")

# Clean up
api.delete_file(volume_id, 'archives/demo.zip')
api.delete_file(volume_id, 'archives/demo.7z')
for file_path in extracted + extracted_7z:
    api.delete_file(volume_id, file_path)
os.remove('demo.zip')
os.remove('demo.7z')
print("✓ Cleanup complete")
```

## File Structure Preservation

The extraction preserves the directory structure inside the archive file:

**Archive contents (zip or 7z):**
```
archive.zip (or archive.7z)
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
api.extract_archive(vol_id, "backups/2024-01.zip", target_path="restored/2024-01/")
api.extract_archive(vol_id, "backups/2024-01.7z", target_path="restored/2024-01/")

# Avoid: Extracting to root can clutter the volume
api.extract_archive(vol_id, "archive.zip")  # Extracts to same directory
```

### 2. Check Archive File Size

Large archive files take longer to extract:

```python
files = api.list_files(volume_id)
archive_file = next(f for f in files if f['key'] == 'large.7z')
size_gb = archive_file['size'] / (1024**3)

if size_gb > 10:
    print(f"Warning: Large archive file ({size_gb:.1f} GB) may take several minutes")

api.extract_archive(volume_id, 'large.7z')
```

### 3. Clean Up After Extraction

```python
# Keep the original archive and extracted files
extracted = api.extract_archive(vol_id, "archive.7z", target_path="data/")

# Or delete the archive after successful extraction
if extracted:
    api.delete_file(vol_id, "archive.7z")
    print("✓ Archive file deleted after successful extraction")
```

### 4. Handle Errors Gracefully

```python
try:
    files = api.extract_archive(volume_id, "data/archive.7z")
    print(f"Success! Extracted {len(files)} files")
except ValueError as e:
    print(f"Invalid archive file: {e}")
except Exception as e:
    print(f"Extraction failed: {e}")
```

## Limitations

- **Archive formats**: Currently supports `.zip` and `.7z` formats only (not `.tar`, `.tar.gz`, `.rar`, etc.)
- **File size**: Very large archive files (>50GB) may take significant time to extract
- **Temp space**: Requires enough temporary disk space to hold the extracted files
- **Nested archives**: Nested archive files are not automatically extracted

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Unsupported archive format" | File is not .zip or .7z | Use supported formats only |
| "Invalid zip/7z file" | Corrupted or invalid archive | Verify the file is a valid archive |
| "Volume not found" | Invalid volume ID | Check volume ID is correct |
| "File not found" | Archive file doesn't exist | Verify the archive path is correct |
| "Authentication failed" | Invalid credentials | Check API keys are valid |

## Performance

Extraction time depends on:
- **Archive file size**: Larger files take longer to download
- **Number of files**: More files means more upload operations
- **File sizes**: Many small files are slower than few large files
- **Network speed**: Both download and upload speeds matter
- **Compression ratio**: 7z files may take longer to decompress than zip

**Approximate times** (may vary):
- Small archive (1MB, 10 files): ~5-10 seconds
- Medium archive (100MB, 100 files): ~1-2 minutes
- Large archive (1GB, 1000 files): ~5-10 minutes
- Very large archive (10GB, 10000 files): ~30-60 minutes

## Troubleshooting

### Extraction is Slow

- Check your internet connection speed
- Use progress callback to monitor progress
- Consider extracting locally and uploading via `upload_directory()` instead
- 7z files may decompress slower than zip due to higher compression

### Out of Disk Space

The extraction uses temporary local storage. If you get disk space errors:
- Free up space on your system
- Extract smaller archive files
- Use a machine with more disk space

### Files Not Appearing

- Wait a few seconds and refresh
- Check the target path is correct
- Verify extraction completed successfully

## See Also

- [File Operations Guide](WEB_INTERFACE_GUIDE.md)
- [API Documentation](http://localhost:8000/docs)
- [Python SDK Documentation](../README.md#python-sdk-usage)
