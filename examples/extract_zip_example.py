"""
Example: Extract ZIP files in Runpod volumes

This example demonstrates how to:
1. Upload a zip file to a volume
2. Extract the zip file within the volume
3. List the extracted files
"""

import os
import zipfile
from pathlib import Path
from runpod_storage import RunpodStorageAPI

def create_sample_zip(output_path: str = "sample.zip"):
    """Create a sample zip file for testing."""
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

        # Create the zip file
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in temp_path.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(temp_path)
                    zipf.write(file_path, arcname)

        print(f"✓ Created sample zip file: {output_path}")
        return output_path


def extract_zip_example():
    """Example of extracting a zip file in a volume."""

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

    # Create a sample zip file
    zip_path = "sample.zip"
    create_sample_zip(zip_path)

    try:
        # 1. Upload the zip file to the volume
        print(f"\n📤 Uploading {zip_path} to volume...")
        remote_zip_path = "test/sample.zip"
        api.upload_file(zip_path, volume_id, remote_zip_path)
        print(f"✓ Uploaded to {remote_zip_path}")

        # 2. Extract the zip file in the volume
        print(f"\n📂 Extracting {remote_zip_path}...")

        def progress_callback(current, total, filename):
            print(f"  [{current}/{total}] Uploading: {filename}")

        extracted_files = api.extract_zip(
            volume_id,
            remote_zip_path,
            target_path="test/extracted/",  # Optional: specify target directory
            progress_callback=progress_callback
        )

        print(f"\n✓ Extracted {len(extracted_files)} files!")
        print("\nExtracted files:")
        for file_path in extracted_files:
            print(f"  • {file_path}")

        # 3. List files in the extraction directory
        print(f"\n📋 Listing files in test/extracted/...")
        files = api.list_files(volume_id, prefix="test/extracted/")
        print(f"Found {len(files)} files:")
        for file in files:
            size_kb = file['size'] / 1024
            print(f"  • {file['key']} ({size_kb:.1f} KB)")

        # 4. Clean up
        print("\n🧹 Cleaning up test files...")
        # Delete the zip file
        api.delete_file(volume_id, remote_zip_path)
        # Delete extracted files
        for file_path in extracted_files:
            api.delete_file(volume_id, file_path)
        print("✓ Cleanup complete")

    finally:
        # Clean up local zip file
        if os.path.exists(zip_path):
            os.remove(zip_path)
            print(f"✓ Removed local {zip_path}")


def extract_to_same_directory_example():
    """Example of extracting to the same directory as the zip file."""

    api = RunpodStorageAPI()

    volumes = api.list_volumes()
    if not volumes:
        print("❌ No volumes found.")
        return

    volume_id = volumes[0]['id']
    print(f"📦 Using volume: {volumes[0]['name']}")

    # Create and upload sample zip
    zip_path = "sample2.zip"
    create_sample_zip(zip_path)

    try:
        remote_zip = "data/archive.zip"
        print(f"\n📤 Uploading to {remote_zip}...")
        api.upload_file(zip_path, volume_id, remote_zip)

        # Extract to same directory (no target_path specified)
        print(f"\n📂 Extracting to same directory as zip file...")
        extracted_files = api.extract_zip(volume_id, remote_zip)

        print(f"\n✓ Extracted {len(extracted_files)} files to data/ directory")
        for file_path in extracted_files:
            print(f"  • {file_path}")

        # Clean up
        print("\n🧹 Cleaning up...")
        api.delete_file(volume_id, remote_zip)
        for file_path in extracted_files:
            api.delete_file(volume_id, file_path)
        print("✓ Done")

    finally:
        if os.path.exists(zip_path):
            os.remove(zip_path)


if __name__ == "__main__":
    print("=" * 60)
    print("Runpod Storage - ZIP Extraction Example")
    print("=" * 60)

    try:
        print("\n--- Example 1: Extract to custom directory ---")
        extract_zip_example()

        print("\n\n--- Example 2: Extract to same directory ---")
        extract_to_same_directory_example()

        print("\n" + "=" * 60)
        print("✓ All examples completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
