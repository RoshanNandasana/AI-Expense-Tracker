import os
import re
from bson import ObjectId
from fastapi import HTTPException, status
from datetime import datetime, timezone

def serialize_doc(doc) -> dict:
    """
    Recursively converts MongoDB '_id' (ObjectId) fields to string 'id'
    in a dictionary to make it JSON serializable for standard Pydantic schemas.
    """
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if key == "_id":
            serialized["id"] = str(value)
        elif isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, dict):
            serialized[key] = serialize_doc(value)
        elif isinstance(value, list):
            serialized[key] = [
                serialize_doc(item) if isinstance(item, dict) else (str(item) if isinstance(item, ObjectId) else item)
                for item in value
            ]
        else:
            serialized[key] = value
    return serialized

def serialize_list(docs) -> list:
    """Converts a list of MongoDB documents into standard serializable dicts."""
    return [serialize_doc(doc) for doc in docs]

def validate_uploaded_file(filename: str, file_size: int = None, max_size_mb: int = 5):
    """
    Validates uploaded receipt files (images or PDFs).
    Raises HTTPException if format is invalid or file exceeds size limits.
    """
    ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.pdf'}
    _, ext = os.path.splitext(filename.lower())
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format: {ext}. Allowed formats: PNG, JPG, JPEG, PDF."
        )
        
    if file_size and file_size > max_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {max_size_mb}MB."
        )
    return ext

def clean_extracted_amount(amount_str: str) -> float:
    """
    Cleans OCR text to extract a floating point number representing the receipt amount.
    """
    if not amount_str:
        return 0.0
    
    # Try finding matching amount string
    # Remove currency symbols and common noises
    cleaned = re.sub(r'[^\d.,]', '', amount_str)
    
    # Handle European decimal notation (1.200,50 -> 1200.50)
    if ',' in cleaned and '.' in cleaned:
        if cleaned.find('.') < cleaned.find(','):
            cleaned = cleaned.replace('.', '').replace(',', '.')
        else:
            cleaned = cleaned.replace(',', '')
    elif ',' in cleaned:
        # If there's only a comma, check if it looks like a decimal separator
        parts = cleaned.split(',')
        if len(parts) == 2 and len(parts[1]) == 2:
            cleaned = cleaned.replace(',', '.')
        else:
            cleaned = cleaned.replace(',', '')
            
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def parse_extracted_date(date_str: str) -> str:
    """
    Parses OCR text to return standard ISO date string 'YYYY-MM-DD'.
    Defaults to today's date if parsing fails.
    """
    if not date_str:
        return datetime.now(timezone.utc).strftime('%Y-%m-%d')
        
    # Standard cleanings
    cleaned_date = date_str.strip()
    
    # Common date formats to try
    formats = [
        '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d',
        '%d-%m-%Y', '%m-%d-%Y', '%d %b %Y', '%d %B %Y'
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(cleaned_date, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
            
    # Try finding a simple pattern using regex: YYYY-MM-DD or DD/MM/YYYY
    match_iso = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', cleaned_date)
    if match_iso:
        return f"{match_iso.group(1)}-{match_iso.group(2).zfill(2)}-{match_iso.group(3).zfill(2)}"
        
    match_slash = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})', cleaned_date)
    if match_slash:
        # Default to assumption of DD/MM/YYYY
        return f"{match_slash.group(3)}-{match_slash.group(2).zfill(2)}-{match_slash.group(1).zfill(2)}"
        
    # Default to today
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')
