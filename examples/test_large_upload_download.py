#!/usr/bin/env python3
"""
Test large file upload and download with the Runpod Storage SDK.
This test creates a large file, uploads it to a network volume, then downloads it back.
"""

import os
import time
import hashlib
from pathlib import Path
from runpod_storage import RunpodStorageAPI

def generate_large_file(file_path: str, size_gb: float = 20.0):
    """Generate a large test file with random data."""
    print(f"📝 Generating {size_gb}GB test file: {file_path}")
    
    size_bytes = int(size_gb * 1024 * 1024 * 1024)
    chunk_size = 1024 * 1024 * 100  # 100MB chunks
    
    start_time = time.time()
    bytes_written = 0
    
    # Create file with random-like pattern (faster than actual random)
    with open(file_path, 'wb') as f:
        pattern = b'TESTDATA' * (chunk_size // 8)
        while bytes_written < size_bytes:
            write_size = min(chunk_size, size_bytes - bytes_written)
            f.write(pattern[:write_size])
            bytes_written += write_size
            
            # Progress update
            progress = (bytes_written / size_bytes) * 100
            print(f"  Progress: {progress:.1f}% ({bytes_written / (1024**3):.2f}GB / {size_gb}GB)", end='\r')
    
    elapsed = time.time() - start_time
    print(f"\n✅ File generated in {elapsed:.1f} seconds")
    return file_path

def calculate_file_hash(file_path: str, chunk_size: int = 8192):
    """Calculate SHA256 hash of a file."""
    print(f"🔐 Calculating file hash...")
    sha256 = hashlib.sha256()
    
    with open(file_path, 'rb') as f:
        while chunk := f.read(chunk_size * 1024):  # 8MB chunks for faster hashing
            sha256.update(chunk)
    
    hash_value = sha256.hexdigest()
    print(f"✅ Hash: {hash_value[:16]}...")
    return hash_value

def test_large_file_upload_download():
    """Test uploading and downloading a large file."""
    
    # Configuration
    TEST_FILE_SIZE_GB = float(os.getenv('TEST_FILE_SIZE_GB', '3'))
    
    print("🚀 Runpod Storage Large File Test")
    print(f"📦 Test file size: {TEST_FILE_SIZE_GB}GB")
    print("=" * 50)
    
    # Initialize API
    api = RunpodStorageAPI()
    
    # Get or create volume
    volumes = api.list_volumes()
    if not volumes:
        print("❌ No volumes found. Please create a volume first.")
        return False
    
    volume_id = volumes[0]["id"]
    volume_name = volumes[0].get("name", "unnamed")
    print(f"🎯 Using volume: {volume_id} ({volume_name})")
    
    # Create test directory
    test_dir = Path("test_large_files")
    test_dir.mkdir(exist_ok=True)
    
    # Generate test file
    local_file = test_dir / f"test_{TEST_FILE_SIZE_GB}gb.bin"
    generate_large_file(str(local_file), TEST_FILE_SIZE_GB)
    
    # Calculate original hash
    original_hash = calculate_file_hash(str(local_file))
    
    # Get file size
    file_size = local_file.stat().st_size
    print(f"📊 File size: {file_size / (1024**3):.2f}GB ({file_size:,} bytes)")
    
    try:
        # Upload test
        print("\n" + "=" * 50)
        print("⬆️  UPLOAD TEST")
        print("=" * 50)
        
        remote_path = f"test_large/test_{TEST_FILE_SIZE_GB}gb.bin"
        
        upload_start = time.time()
        print(f"📤 Uploading to {remote_path}...")
        print(f"⚡ Using parallel multipart upload (10 concurrent threads)")
        
        # Progress tracking for upload
        last_progress_time = [time.time()]
        last_bytes = [0]
        
        def upload_progress(bytes_uploaded, total_bytes, speed_mbps):
            current_time = time.time()
            time_diff = current_time - last_progress_time[0]
            
            if time_diff >= 1.0 or bytes_uploaded >= total_bytes:  # Update every second or at completion
                bytes_diff = bytes_uploaded - last_bytes[0]
                actual_speed = (bytes_diff / (1024**2)) / time_diff if time_diff > 0 else 0
                
                progress_pct = (bytes_uploaded / total_bytes * 100) if total_bytes > 0 else 0
                uploaded_gb = bytes_uploaded / (1024**3)
                total_gb = total_bytes / (1024**3)
                
                print(f"  Upload Progress: {progress_pct:.1f}% ({uploaded_gb:.2f}/{total_gb:.2f} GB) - Speed: {actual_speed:.2f} MB/s", end='\r')
                
                last_progress_time[0] = current_time
                last_bytes[0] = bytes_uploaded
        
        # Upload with automatic chunk size detection
        api.upload_file(
            str(local_file),
            volume_id,
            remote_path,
            chunk_size=None,  # Auto-detect optimal chunk size
            progress_callback=upload_progress
        )
        
        print()  # New line after progress
        upload_time = time.time() - upload_start
        upload_speed = (file_size / (1024**2)) / upload_time  # MB/s
        
        print(f"✅ Upload completed in {upload_time:.1f} seconds")
        print(f"📈 Upload speed: {upload_speed:.2f} MB/s")
        
        # Verify uploaded file exists
        print("\n🔍 Verifying uploaded file...")
        files = api.list_files(volume_id, "test_large")
        uploaded_file = None
        for f in files:
            if f['key'] == remote_path:
                uploaded_file = f
                break
        
        if not uploaded_file:
            print("❌ Uploaded file not found in volume!")
            return False
        
        print(f"✅ File verified in volume: {uploaded_file['size'] / (1024**3):.2f}GB")
        
        # Download test
        print("\n" + "=" * 50)
        print("⬇️  DOWNLOAD TEST")
        print("=" * 50)
        
        downloaded_file = test_dir / f"downloaded_{TEST_FILE_SIZE_GB}gb.bin"
        
        download_start = time.time()
        print(f"📥 Downloading to {downloaded_file}...")
        print(f"⚡ Using parallel multipart download (10 concurrent threads)")
        
        # Progress tracking for download
        last_progress_time = [time.time()]
        last_bytes = [0]
        
        def download_progress(bytes_downloaded, total_bytes, filename):
            current_time = time.time()
            time_diff = current_time - last_progress_time[0]
            
            if time_diff >= 1.0 or bytes_downloaded >= total_bytes:  # Update every second or at completion
                bytes_diff = bytes_downloaded - last_bytes[0]
                speed_mbps = (bytes_diff / (1024**2)) / time_diff if time_diff > 0 else 0
                
                progress_pct = (bytes_downloaded / total_bytes * 100) if total_bytes > 0 else 0
                downloaded_gb = bytes_downloaded / (1024**3)
                total_gb = total_bytes / (1024**3)
                
                print(f"  Download Progress: {progress_pct:.1f}% ({downloaded_gb:.2f}/{total_gb:.2f} GB) - Speed: {speed_mbps:.2f} MB/s", end='\r')
                
                last_progress_time[0] = current_time
                last_bytes[0] = bytes_downloaded
        
        api.download_file(
            volume_id,
            remote_path,
            str(downloaded_file),
            progress_callback=download_progress
        )
        
        print()  # New line after progress
        download_time = time.time() - download_start
        download_speed = (file_size / (1024**2)) / download_time  # MB/s
        
        print(f"✅ Download completed in {download_time:.1f} seconds")
        print(f"📈 Download speed: {download_speed:.2f} MB/s")
        
        # Verify downloaded file
        print("\n🔍 Verifying downloaded file...")
        if not downloaded_file.exists():
            print("❌ Downloaded file not found!")
            return False
        
        downloaded_size = downloaded_file.stat().st_size
        if downloaded_size != file_size:
            print(f"❌ Size mismatch! Original: {file_size}, Downloaded: {downloaded_size}")
            return False
        
        print(f"✅ File size matches: {downloaded_size / (1024**3):.2f}GB")
        
        # Verify integrity
        downloaded_hash = calculate_file_hash(str(downloaded_file))
        if original_hash != downloaded_hash:
            print(f"❌ Hash mismatch!")
            print(f"  Original:   {original_hash[:32]}...")
            print(f"  Downloaded: {downloaded_hash[:32]}...")
            return False
        
        print(f"✅ File integrity verified (hash matches)")
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"✅ File size: {TEST_FILE_SIZE_GB}GB")
        print(f"✅ Upload time: {upload_time:.1f}s ({upload_speed:.2f} MB/s)")
        print(f"✅ Download time: {download_time:.1f}s ({download_speed:.2f} MB/s)")
        print(f"✅ Total time: {upload_time + download_time:.1f}s")
        print(f"✅ Data integrity verified")
        
        # Cleanup remote file
        print("\n🧹 Cleaning up remote file...")
        api.delete_file(volume_id, remote_path)
        print("✅ Remote file deleted")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup local files
        print("\n🧹 Cleaning up local files...")
        if local_file.exists():
            local_file.unlink()
        if downloaded_file.exists():
            downloaded_file.unlink()
        if test_dir.exists():
            test_dir.rmdir()
        print("✅ Local cleanup completed")

def main():
    # Check credentials
    if not os.getenv("RUNPOD_API_KEY"):
        print("❌ Please set RUNPOD_API_KEY environment variable")
        return 1
    
    if not (os.getenv("RUNPOD_S3_ACCESS_KEY") and os.getenv("RUNPOD_S3_SECRET_KEY")):
        print("❌ Please set RUNPOD_S3_ACCESS_KEY and RUNPOD_S3_SECRET_KEY environment variables")
        return 1
    
    # Run test
    success = test_large_file_upload_download()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("\n❌ TESTS FAILED!")
        return 1

if __name__ == "__main__":
    exit(main())