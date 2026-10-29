import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database.connection import db
from app.auth.security import get_current_user
from app.ai.ai_service import ai_service
from app.utils.helpers import serialize_list
from app.schemas.analytics import (
    SpendSummaryResponse,
    CategorySpendResponse,
    CategorySpend,
    WeeklySpendResponse,
    WeeklySpend,
    HighestCategoryResponse,
    BudgetPredictionResponse,
    ExpenseTrendsResponse,
    ExpenseTrendItem,
    DashboardStatsResponse
)

logger = logging.getLogger("app.routes.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

@router.get("/summary", response_model=SpendSummaryResponse)
async def get_spending_summary(
    budget: float = Query(2500.0, gt=0, description="Monthly budget limit"),
    current_user: dict = Depends(get_current_user)
):
    """
    Computes total monthly spending and remaining budget balances.
    Filters automatically for the current calendar month.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Get current month dates boundaries
    today = datetime.now(timezone.utc)
    start_of_month = today.replace(day=1).strftime('%Y-%m-%d')
    
    # Run aggregation
    pipeline = [
        {
            "$match": {
                "user_id": current_user["id"],
                "expense_date": {"$gte": start_of_month}
            }
        },
        {
            "$group": {
                "_id": None,
                "total_spent": {"$sum": "$amount"}
            }
        }
    ]
    
    cursor = db.db.expenses.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    
    total_spent = result[0]["total_spent"] if result else 0.0
    remaining_budget = max(budget - total_spent, 0.0)
    usage_percent = (total_spent / budget) * 100 if budget > 0 else 0.0
    
    return {
        "total_spent": round(total_spent, 2),
        "budget": budget,
        "remaining_budget": round(remaining_budget, 2),
        "budget_usage_percent": round(usage_percent, 2)
    }

@router.get("/category", response_model=CategorySpendResponse)
async def get_category_spending(current_user: dict = Depends(get_current_user)):
    """
    Calculates overall categorical breakdowns of user spending, returning amounts and percentages.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Step 1: Calculate total spent overall
    total_pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    total_cursor = db.db.expenses.aggregate(total_pipeline)
    total_res = await total_cursor.to_list(length=1)
    overall_total = total_res[0]["total"] if total_res else 0.0
    
    if overall_total == 0.0:
        return {"categories": []}
        
    # Step 2: Calculate spent per category
    cat_pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": "$category",
            "amount": {"$sum": "$amount"}
        }},
        {"$sort": {"amount": -1}}
    ]
    
    cat_cursor = db.db.expenses.aggregate(cat_pipeline)
    cat_results = await cat_cursor.to_list(length=50)
    
    categories = []
    for item in cat_results:
        cat_name = item["_id"] or "Other"
        amount = item["amount"]
        percentage = (amount / overall_total) * 100
        
        categories.append(CategorySpend(
            category=cat_name,
            amount=round(amount, 2),
            percentage=round(percentage, 2)
        ))
        
    return {"categories": categories}

@router.get("/weekly", response_model=WeeklySpendResponse)
async def get_weekly_spending(current_user: dict = Depends(get_current_user)):
    """
    Groups and summarizes spending by week for the last 8 weeks.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Query all user expenses from the last 8 weeks
    eight_weeks_ago = (datetime.now(timezone.utc) - timedelta(weeks=8)).strftime('%Y-%m-%d')
    
    cursor = db.db.expenses.find({
        "user_id": current_user["id"],
        "expense_date": {"$gte": eight_weeks_ago}
    })
    expenses = await cursor.to_list(length=1000)
    
    # Group in python to ensure timezone-clean ISO week labels
    # Key: "YYYY-W##", Value: amount
    weeks_map = {}
    
    # Initialize last 8 weeks in map to ensure empty weeks show 0.0
    for i in range(8):
        dt = datetime.now(timezone.utc) - timedelta(weeks=i)
        year, week, _ = dt.isocalendar()
        weeks_map[f"{year}-W{week}"] = 0.0
        
    for exp in expenses:
        try:
            exp_dt = datetime.strptime(exp["expense_date"], '%Y-%m-%d')
            year, week, _ = exp_dt.isocalendar()
            week_key = f"{year}-W{week}"
            if week_key in weeks_map:
                weeks_map[week_key] += exp["amount"]
        except Exception:
            continue
            
    # Sort chronologically
    sorted_weeks = sorted(weeks_map.items())
    
    weeks = [
        WeeklySpend(week_label=item[0], amount=round(item[1], 2))
        for item in sorted_weeks
    ]
    
    return {"weeks": weeks}

@router.get("/highest-category", response_model=HighestCategoryResponse)
async def get_highest_spending_category(current_user: dict = Depends(get_current_user)):
    """
    Identifies the single highest spending category for the user and its share.
    """
    cat_data = await get_category_spending(current_user)
    categories = cat_data["categories"]
    
    if not categories:
        return {
            "category": "None",
            "amount": 0.0,
            "percentage": 0.0
        }
        
    # Categories are already sorted in descending order of amount in get_category_spending
    highest = categories[0]
    return {
        "category": highest.category,
        "amount": highest.amount,
        "percentage": highest.percentage
    }

@router.get("/budget-prediction", response_model=BudgetPredictionResponse)
async def get_budget_prediction(
    budget: float = Query(2500.0, gt=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Runs predictive algorithms (Generative AI or Fallback data science engines) 
    to forecast monthly spending limits and output actionable advice.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Get user expenses for current month
    start_of_month = datetime.now(timezone.utc).replace(day=1).strftime('%Y-%m-%d')
    cursor = db.db.expenses.find({
        "user_id": current_user["id"],
        "expense_date": {"$gte": start_of_month}
    })
    expenses_docs = await cursor.to_list(length=1000)
    
    serialized_expenses = serialize_list(expenses_docs)
    
    # Process through AI Insights Service
    prediction = await ai_service.generate_spending_insights(serialized_expenses, budget)
    
    current_spend = sum(exp["amount"] for exp in serialized_expenses)
    
    return {
        "current_spend": round(current_spend, 2),
        "predicted_spend": round(prediction.get("predicted_spend", current_spend), 2),
        "budget": budget,
        "will_exceed": prediction.get("will_exceed", False),
        "confidence": prediction.get("confidence", "Medium"),
        "insight": prediction.get("insight", "Manage your cash outflows diligently to stay inside your budget.")
    }

@router.get("/trends", response_model=ExpenseTrendsResponse)
async def get_expense_trends(current_user: dict = Depends(get_current_user)):
    """
    Groups spending daily for the last 30 days to build premium sparklines and charts.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d')
    
    pipeline = [
        {
            "$match": {
                "user_id": current_user["id"],
                "expense_date": {"$gte": thirty_days_ago}
            }
        },
        {
            "$group": {
                "_id": "$expense_date",
                "amount": {"$sum": "$amount"}
            }
        },
        {"$sort": {"_id": 1}} # Sort ascending by date
    ]
    
    cursor = db.db.expenses.aggregate(pipeline)
    results = await cursor.to_list(length=100)
    
    # Map dates to amounts
    trend_map = {item["_id"]: item["amount"] for item in results}
    
    # Ensure all days are represented in chronological order
    trends = []
    for i in range(30, -1, -1):
        d_str = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        amount = trend_map.get(d_str, 0.0)
        trends.append(ExpenseTrendItem(date=d_str, amount=round(amount, 2)))
        
    return {"trends": trends}

@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_statistics(
    budget: float = Query(2500.0, gt=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Aggregates a complete bird's-eye view statistics array for frontend dashboards.
    Consolidates months comparison, top category, usage percent, and recent expenses.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # 1. Current Month Total
    now = datetime.now(timezone.utc)
    cur_month_start = now.replace(day=1).strftime('%Y-%m-%d')
    
    # 2. Previous Month Total
    prev_month_end = (now.replace(day=1) - timedelta(days=1))
    prev_month_start = prev_month_end.replace(day=1).strftime('%Y-%m-%d')
    prev_month_end_str = prev_month_end.strftime('%Y-%m-%d')
    
    # Query database
    cur_cursor = db.db.expenses.find({
        "user_id": current_user["id"],
        "expense_date": {"$gte": cur_month_start}
    })
    cur_expenses = await cur_cursor.to_list(length=1000)
    
    prev_pipeline = [
        {
            "$match": {
                "user_id": current_user["id"],
                "expense_date": {
                    "$gte": prev_month_start,
                    "$lte": prev_month_end_str
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }
        }
    ]
    prev_cursor = db.db.expenses.aggregate(prev_pipeline)
    prev_res = await prev_cursor.to_list(length=1)
    
    cur_total = sum(exp["amount"] for exp in cur_expenses)
    prev_total = prev_res[0]["total"] if prev_res else 0.0
    
    # MoM percentage
    mom_change = 0.0
    if prev_total > 0:
        mom_change = ((cur_total - prev_total) / prev_total) * 100
        
    # 3. Highest Spending Category (Historical)
    highest_cat_res = await get_highest_spending_category(current_user)
    
    # 4. Recent Expenses (limit to 5)
    recent_cursor = db.db.expenses.find({"user_id": current_user["id"]}).sort("expense_date", -1).limit(5)
    recent_docs = await recent_cursor.to_list(length=5)
    recent_expenses = serialize_list(recent_docs)
    
    # usage %
    usage_percent = (cur_total / budget) * 100 if budget > 0 else 0.0
    
    return {
        "total_spent_current_month": round(cur_total, 2),
        "total_spent_previous_month": round(prev_total, 2),
        "month_over_month_change_percent": round(mom_change, 2),
        "highest_category": highest_cat_res["category"],
        "highest_category_amount": highest_cat_res["amount"],
        "recent_expenses": recent_expenses,
        "budget_usage_percent": round(usage_percent, 2)
    }
