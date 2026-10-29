from datetime import datetime, timezone
from pydantic import BaseModel, Field

class ExpenseDB(BaseModel):
    user_id: str
    amount: float
    category: str
    description: str = ""
    payment_method: str = "Cash"
    merchant: str = ""
    expense_date: str  # Format: YYYY-MM-DD
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
