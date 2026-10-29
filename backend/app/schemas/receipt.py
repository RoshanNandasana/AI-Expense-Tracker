from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ReceiptResponse(BaseModel):
    id: str
    expense_id: Optional[str] = None
    image_url: str
    extracted_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReceiptAIParsed(BaseModel):
    merchant: str
    amount: float
    date: str  # YYYY-MM-DD
    category: str
    description: str = ""
    confidence: Optional[float] = 1.0
