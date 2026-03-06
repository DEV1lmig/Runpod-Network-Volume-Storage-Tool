"""
Example: Extract 7Z files in Runpod volumes

This example demonstrates how to:
1. Upload a 7z file to a volume
2. Extract the 7z file within the volume
3. List the extracted files
4. Compare 7z with zip extraction
"""

import os
import zipfile
from pathlib import Path
from runpod_storage import RunpodStorageAPI

try:
    import py7zr
except ImportError:
    print("❌ py7zr not installed. Install it with: pip install py7zr")
    exit(1)


def create_sample_7z(output_path: str = "sample.7z"):
    """Create a sample 7z file for testing."""
    import tempfile

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Create some sample files
        (temp_path / "file1.txt").write_text("This is file 1")
        (temp_path / "file2.txt").write_text("This is file 2")

        # Create a subdirectory with files
        sub_dir = temp_path / "subdir"
        sub_dir.mkdir()
        (sub_dir / "file3.txt").write_text("This is file 3 in subdir")

        # Create the 7z file
        with py7zr.SevenZipFile(output_path, 'w') as archive:
            for file_path in temp_path.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(temp_path)
                    archive.write(file_path, arcname)

        print(f"✓ Created sample 7z file: {output_path}")
        return output_path


def create_sample_zip(output_path: str = "sample.zip"):
    """Create a sample zip file for comparison."""
    import tempfile

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Create the same files as 7z
        (temp_path / "file1.txt").write_text("This is file 1")
        (temp_path / "file2.txt").write_text("This is file 2")

        sub_dir = temp_path / "subdir"
        sub_dir.mkdir()
        (sub_dir / "file3.txt").write_text("This is file 3 in subdir")

        # Create the zip file
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in temp_path.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(temp_path)
                    zipf.write(file_path, arcname)

        print(f"✓ Created sample zip file: {output_path}")
        return output_path


def extract_7z_example():
    """Example of extracting a 7z file in a volume."""

    # Initialize API (uses environment variables for credentials)
    api = RunpodStorageAPI()

    # Get the first available volume
    volumes = api.list_volumes()
    if not volumes:
        print("❌ No volumes found. Please create a volume first.")
        return

    volume_id = volumes[0]['id']
    volume_name = volumes[0]['name']
    print(f"📦 Using volume: {volume_name} ({volume_id})")

    # Create a sample 7z file
    sevenzip_path = "sample.7z"
    create_sample_7z(sevenzip_path)

    try:
        # 1. Upload the 7z file to the volume
        print(f"\n📤 Uploading {sevenzip_path} to volume...")
        remote_7z_path = "test/sample.7z"
        api.upload_file(sevenzip_path, volume_id, remote_7z_path)
        print(f"✓ Uploaded to {remote_7z_path}")

        # 2. Extract the 7z file in the volume
        print(f"\n📂 Extracting {remote_7z_path}...")

        def progress_callback(current, total, filename):
            print(f"  [{current}/{total}] Uploading: {filename}")

        extracted_files = api.extract_archive(
            volume_id,
            remote_7z_path,
            target_path="test/extracted_7z/",
            progress_callback=progress_callback
        )

        print(f"\n✓ Extracted {len(extracted_files)} files!")
        print("\nExtracted files:")
        for file_path in extracted_files:
            print(f"  • {file_path}")

        # 3. List files in the extraction directory
        print(f"\n📋 Listing files in test/extracted_7z/...")
        files = api.list_files(volume_id, prefix="test/extracted_7z/")
        print(f"Found {len(files)} files:")
        for file in files:
            size_kb = file['size'] / 1024
            print(f"  • {file['key']} ({size_kb:.1f} KB)")

        # 4. Clean up
        print("\n🧹 Cleaning up test files...")
        # Delete the 7z file
        api.delete_file(volume_id, remote_7z_path)
        # Delete extracted files
        for file_path in extracted_files:
            api.delete_file(volume_id, file_path)
        print("✓ Cleanup complete")

    finally:
        # Clean up local 7z file
        if os.path.exists(sevenzip_path):
            os.remove(sevenzip_path)
            print(f"✓ Removed local {sevenzip_path}")


def compare_7z_vs_zip_example():
    """Compare 7z and zip extraction."""

    api = RunpodStorageAPI()

    volumes = api.list_volumes()
    if not volumes:
        print("❌ No volumes found.")
        return

    volume_id = volumes[0]['id']
    print(f"📦 Using volume: {volumes[0]['name']}")

    # Create both 7z and zip files
    sevenzip_path = "comparison.7z"
    zip_path = "comparison.zip"
    create_sample_7z(sevenzip_path)
    create_sample_zip(zip_path)

    # Check file sizes
    sevenzip_size = os.path.getsize(sevenzip_path)
    zip_size = os.path.getsize(zip_path)

    print(f"\n📊 File size comparison:")
    print(f"  • 7z:  {sevenzip_size:,} bytes ({sevenzip_size / 1024:.2f} KB)")
    print(f"  • zip: {zip_size:,} bytes ({zip_size / 1024:.2f} KB)")
    print(f"  • 7z is {((zip_size - sevenzip_size) / zip_size * 100):.1f}% smaller")

    try:
        # Upload and extract 7z
        print(f"\n📤 Uploading and extracting 7z file...")
        remote_7z = "compare/archive.7z"
        api.upload_file(sevenzip_path, volume_id, remote_7z)

        import time
        start_time = time.time()
        extracted_7z = api.extract_archive(volume_id, remote_7z, target_path="compare/7z/")
        sevenzip_time = time.time() - start_time

        print(f"✓ Extracted {len(extracted_7z)} files in {sevenzip_time:.2f} seconds")

        # Upload and extract zip
        print(f"\n📤 Uploading and extracting zip file...")
        remote_zip = "compare/archive.zip"
        api.upload_file(zip_path, volume_id, remote_zip)

        start_time = time.time()
        extracted_zip = api.extract_archive(volume_id, remote_zip, target_path="compare/zip/")
        zip_time = time.time() - start_time

        print(f"✓ Extracted {len(extracted_zip)} files in {zip_time:.2f} seconds")

        # Summary
        print(f"\n📊 Extraction time comparison:")
        print(f"  • 7z:  {sevenzip_time:.2f} seconds")
        print(f"  • zip: {zip_time:.2f} seconds")
        if sevenzip_time < zip_time:
            print(f"  • 7z was {((zip_time - sevenzip_time) / zip_time * 100):.1f}% faster")
        else:
            print(f"  • zip was {((sevenzip_time - zip_time) / sevenzip_time * 100):.1f}% faster")

        # Clean up
        print("\n🧹 Cleaning up...")
        api.delete_file(volume_id, remote_7z)
        api.delete_file(volume_id, remote_zip)
        for file_path in extracted_7z + extracted_zip:
            api.delete_file(volume_id, file_path)
        print("✓ Done")

    finally:
        if os.path.exists(sevenzip_path):
            os.remove(sevenzip_path)
        if os.path.exists(zip_path):
            os.remove(zip_path)


if __name__ == "__main__":
    print("=" * 60)
    print("Runpod Storage - 7Z Extraction Example")
    print("=" * 60)

    try:
        print("\n--- Example 1: Extract 7z file ---")
        extract_7z_example()

        print("\n\n--- Example 2: Compare 7z vs zip ---")
        compare_7z_vs_zip_example()

        print("\n" + "=" * 60)
        print("✓ All examples completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
