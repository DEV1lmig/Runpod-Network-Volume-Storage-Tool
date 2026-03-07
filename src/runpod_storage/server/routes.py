"""
API routes for Runpod Storage server.

Implements all REST endpoints with comprehensive validation and error handling.
"""

import os
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Header
from fastapi.responses import FileResponse

from ..core.api import RunpodStorageAPI
from ..core.exceptions import (
    AuthenticationError,
    NetworkError,
    RunpodStorageError,
    VolumeNotFoundError,
)
from ..core.models import (
    CreateFolderResponse,
    CreateVolumeRequest,
    DatacenterInfo,
    DeleteFileRequest,
    DeleteFolderResponse,
    DeleteResponse,
    DownloadFileRequest,
    ExtractZipRequest,
    ExtractZipResponse,
    ListFilesRequest,
    ListFilesResponse,
    ListVolumesResponse,
    NetworkVolume,
    NetworkVolumeUpdateRequest,
    UploadResponse,
)

# Security
router = APIRouter(
    prefix="",
    tags=["Storage"],
    responses={
        401: {"description": "Authentication failed"},
        403: {"description": "Authorization failed"},
        500: {"description": "Internal server error"},
    },
)


async def get_runpod_api_key(
    runpod_api_key: str = Header(..., description="Your Runpod API key (e.g., rpa_XXX...)"),
) -> str:
    """Simple authentication - just pass your Runpod API key."""
    return runpod_api_key


async def get_storage_api(api_key: str = Depends(get_runpod_api_key)) -> RunpodStorageAPI:
    """Get authenticated storage API instance for volume operations only."""
    try:
        return RunpodStorageAPI(api_key=api_key, auto_setup_s3=False)
    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize storage API: {e}",
        )


@router.get(
    "/volumes",
    response_model=ListVolumesResponse,
    summary="List network volumes",
    description="Retrieve a list of all network volumes associated with your account.",
)
async def list_volumes(
    api: RunpodStorageAPI = Depends(get_storage_api),
) -> ListVolumesResponse:
    """List all network volumes."""
    try:
        volumes = api.list_volumes()
        return ListVolumesResponse(
            volumes=[NetworkVolume(**vol) for vol in volumes], total_count=len(volumes)
        )
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes",
    response_model=NetworkVolume,
    status_code=status.HTTP_201_CREATED,
    summary="Create network volume",
    description="Create a new network volume with specified name, size, and datacenter.",
)
async def create_volume(
    request: CreateVolumeRequest, api: RunpodStorageAPI = Depends(get_storage_api)
) -> NetworkVolume:
    """Create a new network volume."""
    try:
        volume = api.create_volume(
            name=request.name, size=request.size, datacenter_id=request.datacenter_id
        )
        return NetworkVolume(**volume)
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/volumes/{volume_id}",
    response_model=NetworkVolume,
    summary="Get volume details",
    description="Retrieve detailed information about a specific network volume.",
)
async def get_volume(
    volume_id: str, api: RunpodStorageAPI = Depends(get_storage_api)
) -> NetworkVolume:
    """Get volume details."""
    try:
        volume = api.get_volume(volume_id)
        return NetworkVolume(**volume)
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch(
    "/volumes/{volume_id}",
    response_model=NetworkVolume,
    summary="Update volume",
    description="Update a network volume's name and/or size. Size can only be increased.",
)
async def update_volume(
    volume_id: str,
    request: NetworkVolumeUpdateRequest,
    api: RunpodStorageAPI = Depends(get_storage_api),
) -> NetworkVolume:
    """Update a network volume."""
    try:
        volume = api.update_volume(
            volume_id=volume_id, name=request.name, size=request.size
        )
        return NetworkVolume(**volume)
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/volumes/{volume_id}",
    response_model=DeleteResponse,
    summary="Delete volume",
    description="Delete a network volume. This operation is irreversible.",
)
async def delete_volume(
    volume_id: str, api: RunpodStorageAPI = Depends(get_storage_api)
) -> DeleteResponse:
    """Delete a network volume."""
    try:
        success = api.delete_volume(volume_id)
        if success:
            return DeleteResponse(
                success=True, message=f"Volume {volume_id} deleted successfully"
            )
        else:
            raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes/{volume_id}/files/list",
    response_model=ListFilesResponse,
    summary="List files in volume",
    description="List all files in a network volume, optionally filtered by prefix.",
)
async def list_files(
    volume_id: str,
    prefix: Optional[str] = None,
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> ListFilesResponse:
    """List files in a volume."""
    try:
        # Create API instance with provided S3 credentials
        api = RunpodStorageAPI(
            api_key=api_key,
            s3_access_key=s3_access_key,
            s3_secret_key=s3_secret_key,
        )

        files = api.list_files(volume_id, prefix or "")
        return ListFilesResponse(
            files=files,
            total_count=len(files),
            prefix=prefix if prefix else None,
        )
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes/{volume_id}/files",
    response_model=UploadResponse,
    summary="Upload file",
    description="Upload a file to a network volume. Supports large files via multipart upload.",
)
async def upload_file(
    volume_id: str,
    file: UploadFile = File(..., description="File to upload"),
    remote_path: str = Form(None, description="Remote path for the file"),
    chunk_size: int = Form(None, description="Chunk size for multipart upload (auto-detected if not specified)"),
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> UploadResponse:
    """Upload a file to a volume."""

    # Use filename if remote_path not provided
    if not remote_path:
        remote_path = file.filename or "uploaded_file"

    # Stream uploaded file to disk in chunks to avoid loading it all into memory
    file_size = 0
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        tmp_file_path = tmp_file.name
        while True:
            chunk = await file.read(8 * 1024 * 1024)  # 8 MB chunks
            if not chunk:
                break
            tmp_file.write(chunk)
            file_size += len(chunk)

    try:
        import time

        start_time = time.time()

        # Create API instance with provided S3 credentials
        api = RunpodStorageAPI(
            api_key=api_key, s3_access_key=s3_access_key, s3_secret_key=s3_secret_key
        )

        success = api.upload_file(tmp_file_path, volume_id, remote_path, chunk_size)

        upload_time = time.time() - start_time
        speed_mbps = (file_size / (1024 * 1024)) / upload_time if upload_time > 0 else 0

        return UploadResponse(
            success=success,
            file_path=remote_path,
            size=file_size,
            upload_time=upload_time,
            speed_mbps=speed_mbps,
        )

    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        # Clean up temporary file
        try:
            os.unlink(tmp_file_path)
        except:
            pass


@router.post(
    "/volumes/{volume_id}/files/download",
    response_class=FileResponse,
    summary="Download file",
    description="Download a file from a network volume.",
)
async def download_file(
    volume_id: str,
    remote_path: str,
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> FileResponse:
    """Download a file from a volume."""

    # Create temporary file for download
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        tmp_file_path = tmp_file.name

    try:
        # Create API instance with provided S3 credentials
        api = RunpodStorageAPI(
            api_key=api_key,
            s3_access_key=s3_access_key,
            s3_secret_key=s3_secret_key,
        )

        success = api.download_file(volume_id, remote_path, tmp_file_path)

        if success:
            filename = os.path.basename(remote_path)
            return FileResponse(
                path=tmp_file_path,
                filename=filename,
                media_type="application/octet-stream",
            )
        else:
            raise HTTPException(
                status_code=404, detail=f"File {request.remote_path} not found"
            )

    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes/{volume_id}/files/delete",
    response_model=DeleteResponse,
    summary="Delete file",
    description="Delete a file from a network volume.",
)
async def delete_file(
    volume_id: str,
    remote_path: str,
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> DeleteResponse:
    """Delete a file from a volume."""
    try:
        # Create API instance with provided S3 credentials
        api = RunpodStorageAPI(
            api_key=api_key,
            s3_access_key=s3_access_key,
            s3_secret_key=s3_secret_key,
        )

        success = api.delete_file(volume_id, remote_path)
        if success:
            return DeleteResponse(
                success=True, message=f"File {remote_path} deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=404, detail=f"File {remote_path} not found"
            )
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes/{volume_id}/folders/create",
    response_model=CreateFolderResponse,
    summary="Create folder",
    description="Create a folder in a network volume.",
)
async def create_folder(
    volume_id: str,
    folder_path: str,
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> CreateFolderResponse:
    """Create a folder in a volume."""
    try:
        api = RunpodStorageAPI(
            api_key=api_key,
            s3_access_key=s3_access_key,
            s3_secret_key=s3_secret_key,
        )

        normalized = folder_path if folder_path.endswith("/") else folder_path + "/"
        api.create_folder(volume_id, normalized)
        return CreateFolderResponse(success=True, folder_path=normalized)
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes/{volume_id}/folders/delete",
    response_model=DeleteFolderResponse,
    summary="Delete folder",
    description="Delete a folder and all its contents from a network volume.",
)
async def delete_folder(
    volume_id: str,
    folder_path: str,
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> DeleteFolderResponse:
    """Delete a folder and all its contents from a volume."""
    try:
        api = RunpodStorageAPI(
            api_key=api_key,
            s3_access_key=s3_access_key,
            s3_secret_key=s3_secret_key,
        )

        normalized = folder_path if folder_path.endswith("/") else folder_path + "/"
        deleted_count = api.delete_folder(volume_id, normalized)
        return DeleteFolderResponse(
            success=True, folder_path=normalized, deleted_count=deleted_count
        )
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/volumes/{volume_id}/files/extract",
    response_model=ExtractZipResponse,
    summary="Extract zip file",
    description="Extract a zip file within a network volume. Downloads the zip, extracts it, and uploads the extracted files back to the volume.",
)
async def extract_zip(
    volume_id: str,
    zip_path: str,
    target_path: str = None,
    api_key: str = Depends(get_runpod_api_key),
    s3_access_key: str = Header(..., description="S3 access key (e.g., user_XXX...)"),
    s3_secret_key: str = Header(..., description="S3 secret key (e.g., rps_XXX...)"),
) -> ExtractZipResponse:
    """Extract a zip file in a volume."""
    try:
        # Create API instance with provided S3 credentials
        api = RunpodStorageAPI(
            api_key=api_key,
            s3_access_key=s3_access_key,
            s3_secret_key=s3_secret_key,
        )

        # Extract the zip file
        extracted_files = api.extract_zip(volume_id, zip_path, target_path)

        return ExtractZipResponse(
            success=True,
            extracted_files=extracted_files,
            total_files=len(extracted_files),
            target_path=target_path if target_path else str(Path(zip_path).parent)
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except VolumeNotFoundError:
        raise HTTPException(status_code=404, detail=f"Volume {volume_id} not found")
    except NetworkError as e:
        raise HTTPException(status_code=e.status_code or 500, detail=str(e))
    except RunpodStorageError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get(
    "/datacenters",
    response_model=List[DatacenterInfo],
    summary="List available datacenters",
    description="Get information about available Runpod datacenters for volume creation.",
)
async def list_datacenters(
    api: RunpodStorageAPI = Depends(get_storage_api),
) -> List[DatacenterInfo]:
    """List available datacenters."""
    datacenters = api.get_available_datacenters()

    datacenter_names = {
        "EUR-IS-1": "Europe - Iceland",
        "EU-RO-1": "Europe - Romania",
        "EU-CZ-1": "Europe - Czech Republic",
        "US-KS-2": "USA - Kansas",
    }

    return [
        DatacenterInfo(
            id=dc_id,
            name=datacenter_names.get(dc_id, dc_id),
            s3_endpoint=endpoint,
            region=dc_id,
        )
        for dc_id, endpoint in datacenters.items()
    ]
