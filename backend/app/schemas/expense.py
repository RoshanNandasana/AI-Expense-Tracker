from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount must be positive")
    category: str = Field(..., min_length=1, description="Expense category")
    description: Optional[str] = Field("", description="Optional description")
    payment_method: Optional[str] = Field("Cash", description="Payment method used (e.g. Cash, Credit Card, Debit Card)")
    merchant: Optional[str] = Field("", description="Merchant name")
    expense_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Expense date in YYYY-MM-DD format")

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    merchant: Optional[str] = None
    expense_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")

class ExpenseResponse(BaseModel):
    id: str
    user_id: str
    amount: float
    category: str
    description: str
    payment_method: str
    merchant: str
    expense_date: str
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int
    page: int
    limit: int
    pages: int
