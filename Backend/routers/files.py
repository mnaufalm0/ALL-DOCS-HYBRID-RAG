from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from db.models import UploadedFile
from db.redis import set_upload_status, get_upload_status, check_rate_limit
from middleware.auth import get_current_user
from cleaner import get_elements_fast, clean_elements
from chunking import chunk_text
from vectorizer import batch_insert
import hashlib
import shutil
import uuid
import os
from dotenv import load_dotenv
from pinecone import Pinecone
router = APIRouter()
load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX"))
UPLOAD_DIR        = "uploads/"
ALLOWED_EXTENSIONS = [
    ".pdf", ".docx", ".doc", ".pptx", ".ppt",
    ".txt", ".csv", ".xlsx", ".xls",
    ".html", ".htm", ".md", ".rtf", ".epub"
]
MAX_FILE_SIZE     = 20 * 1024 * 1024  

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    user_id = user["user_id"]

    # File type check
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Read + size check
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 20MB allowed")

    # Duplicate check
    file_hash = hashlib.md5(content).hexdigest()
    existing  = await UploadedFile.filter(file_hash=file_hash, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="File already uploaded")

    # Save temp
    file_id   = str(uuid.uuid4())
    temp_path = f"{UPLOAD_DIR}{file_id}{ext}"
    with open(temp_path, "wb") as f:
        f.write(content)

    # Create DB record with processing status
    db_file = await UploadedFile.create(
        id=file_id,
        user_id=user_id,
        filename=f"{file_id}{ext}",
        original_name=file.filename,
        file_hash=file_hash,
        file_size=len(content),
        file_type=ext,
        chunks_stored=0,
        status="processing"
    )

    await set_upload_status(file_id, "processing")

    try:
        # Pipeline
        elements = get_elements_fast(temp_path)
        cleaned  = clean_elements(elements)
        chunks   = chunk_text(cleaned)
        batch_insert(chunks, source_filename=file.filename)

        # Update DB record
        await UploadedFile.filter(id=file_id).update(
            chunks_stored=len(chunks),
            status="completed"
        )
        await set_upload_status(file_id, "completed")

    except Exception as e:
        await UploadedFile.filter(id=file_id).update(
            status="failed",
            error_message=str(e)
        )
        await set_upload_status(file_id, "failed")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    finally:
        os.remove(temp_path)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "chunks_stored": len(chunks),
        "status": "completed"
    }


@router.get("/status/{file_id}")
async def upload_status(
    file_id: str,
    user=Depends(get_current_user)
):
    status = await get_upload_status(file_id)
    if not status:
        raise HTTPException(status_code=404, detail="File not found")
    return status


@router.get("/")
async def list_files(user=Depends(get_current_user)):
    files = await UploadedFile.filter(
        user_id=user["user_id"]
    ).order_by("-uploaded_at")

    return {"files": [
        {
            "file_id": str(f.id),
            "filename": f.original_name,
            "file_type": f.file_type,
            "file_size": f.file_size,
            "chunks_stored": f.chunks_stored,
            "status": f.status,
            "uploaded_at": str(f.uploaded_at)
        }
        for f in files
    ]}


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    user=Depends(get_current_user)
):
    file = await UploadedFile.filter(
        id=file_id,
        user_id=user["user_id"]
    ).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    index.delete(
        filter={
            "file_id": file_id
        }
    )

    await file.delete()

    return {"message": f"✅ {file.original_name} deleted successfully"}