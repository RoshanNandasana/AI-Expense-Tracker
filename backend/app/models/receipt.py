from datetime import datetime, timezone
from pydantic import BaseModel, Field

class ReceiptDB(BaseModel):
    expense_id: str
    image_url: str
    extracted_text: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
