from typing import List, Optional
from pydantic import BaseModel

class SpendSummaryResponse(BaseModel):
    total_spent: float
    budget: float
    remaining_budget: float
    budget_usage_percent: float

class CategorySpend(BaseModel):
    category: str
    amount: float
    percentage: float

class CategorySpendResponse(BaseModel):
    categories: List[CategorySpend]

class WeeklySpend(BaseModel):
    week_label: str  # e.g., "Week 1", "2026-W22"
    amount: float

class WeeklySpendResponse(BaseModel):
    weeks: List[WeeklySpend]

class HighestCategoryResponse(BaseModel):
    category: str
    amount: float
    percentage: float

class BudgetPredictionResponse(BaseModel):
    current_spend: float
    predicted_spend: float
    budget: float
    will_exceed: bool
    confidence: str  # e.g., "High", "Medium", "Low"
    insight: str  # Plain text advice from Gemini or heuristic fallback

class ExpenseTrendItem(BaseModel):
    date: str  # e.g., "2026-05-29" or "May 2026"
    amount: float

class ExpenseTrendsResponse(BaseModel):
    trends: List[ExpenseTrendItem]

class DashboardStatsResponse(BaseModel):
    total_spent_current_month: float
    total_spent_previous_month: float
    month_over_month_change_percent: float
    highest_category: Optional[str]
    highest_category_amount: float
    recent_expenses: List[dict]  # Simplified list of recent transactions
    budget_usage_percent: float
