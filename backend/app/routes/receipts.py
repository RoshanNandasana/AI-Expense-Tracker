import logging
import os
import uuid
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from app.database.connection import db
from app.auth.security import get_current_user
from app.config.settings import settings
from app.services.ocr_service import ocr_service
from app.ai.ai_service import ai_service
from app.models.expense import ExpenseDB
from app.models.receipt import ReceiptDB
from app.schemas.receipt import ReceiptResponse, ReceiptAIParsed
from app.utils.helpers import serialize_doc, validate_uploaded_file

logger = logging.getLogger("app.routes.receipts")
router = APIRouter(prefix="/receipts", tags=["Receipt Upload & Scanning"])

@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(..., description="Receipt image or PDF file (max 5MB)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Uploads a receipt image/PDF, extracts text using EasyOCR, structures transaction details 
    via Gemini, and automatically creates an associated Expense record in the database.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )

    # 1. Read first block to check size and validate metadata
    # We read 5.1 MB - if file has more bytes, it's too large!
    max_bytes = 5 * 1024 * 1024
    content = await file.read(max_bytes + 1024)
    file_size = len(content)
    
    # Reset read pointer for saving
    await file.seek(0)
    
    # Run validation
    ext = validate_uploaded_file(file.filename, file_size=file_size, max_size_mb=5)
    
    # 2. Generate unique secure filename and save to local disk
    unique_id = str(uuid.uuid4())
    secure_filename = f"{unique_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, secure_filename)
    
    try:
        # Write chunks to disk
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        logger.info(f"Saved uploaded receipt: {file_path}")
    except Exception as e:
        logger.error(f"Failed to write file to disk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the uploaded file."
        )

    # 3. Extract raw text using OCR
    try:
        raw_text = ocr_service.extract_text(file_path)
    except Exception as e:
        logger.error(f"OCR service failure: {e}")
        raw_text = "ERROR: Failed to run OCR scanning on receipt."

    # 4. Extract structured transaction fields using AI Service (Gemini or Local regex)
    try:
        ai_parsed = await ai_service.parse_receipt_text(raw_text)
    except Exception as e:
        logger.error(f"AI parsing failure: {e}")
        # Build immediate safety fallback
        ai_parsed = {
            "merchant": "Unparsed Merchant",
            "amount": 0.0,
            "date": datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            "category": "Other",
            "description": "OCR Scanned transaction (Parsing failed)"
        }

    # 5. Automatically create a linked Expense DB document
    expense_db = ExpenseDB(
        user_id=current_user["id"],
        amount=ai_parsed["amount"],
        category=ai_parsed["category"],
        description=ai_parsed["description"] or f"Scanned from receipt: {file.filename}",
        payment_method="Cash", # Default assumption for receipt scans
        merchant=ai_parsed["merchant"],
        expense_date=ai_parsed["date"]
    )
    
    expense_result = await db.db.expenses.insert_one(expense_db.dict())
    expense_id = str(expense_result.inserted_id)

    # 6. Save a Receipt log record linked to the created expense
    # We represent the URL locally. In production, this can connect to AWS S3, Cloudinary, etc.
    relative_image_url = f"/uploads/{secure_filename}"
    
    receipt_db = ReceiptDB(
        expense_id=expense_id,
        image_url=relative_image_url,
        extracted_text=raw_text
    )
    
    receipt_result = await db.db.receipts.insert_one(receipt_db.dict())
    receipt_id = str(receipt_result.inserted_id)

    # Fetch created documents to return complete objects
    created_expense = await db.db.expenses.find_one({"_id": ObjectId(expense_id)})
    created_receipt = await db.db.receipts.find_one({"_id": ObjectId(receipt_id)})

    return {
        "message": "Receipt uploaded and scanned successfully.",
        "parsed_data": ai_parsed,
        "expense": serialize_doc(created_expense),
        "receipt": serialize_doc(created_receipt)
    }
