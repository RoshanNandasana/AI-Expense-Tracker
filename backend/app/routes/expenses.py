import logging
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse

from app.database.connection import db
from app.auth.security import get_current_user
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse
from app.models.expense import ExpenseDB
from app.services.csv_service import generate_expenses_csv
from app.utils.helpers import serialize_doc, serialize_list

logger = logging.getLogger("app.routes.expenses")
router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(expense_in: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    """
    Creates a new expense record associated with the authenticated user.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    expense_db = ExpenseDB(
        user_id=current_user["id"],
        amount=expense_in.amount,
        category=expense_in.category,
        description=expense_in.description,
        payment_method=expense_in.payment_method,
        merchant=expense_in.merchant,
        expense_date=expense_in.expense_date
    )
    
    result = await db.db.expenses.insert_one(expense_db.dict())
    
    # Retrieve created document
    created_doc = await db.db.expenses.find_one({"_id": result.inserted_id})
    return serialize_doc(created_doc)

@router.get("", response_model=ExpenseListResponse)
async def get_expenses(
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Filter by end date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search merchant, category, or description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieves all expenses with support for search, category/date filtering, and pagination.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Build query
    query = {"user_id": current_user["id"]}
    
    if category:
        query["category"] = category
        
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["expense_date"] = date_query
        
    if search:
        query["$or"] = [
            {"merchant": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
        
    # Pagination skip
    skip = (page - 1) * limit
    
    # Run total count and fetch records in parallel
    total = await db.db.expenses.count_documents(query)
    
    cursor = db.db.expenses.find(query).sort("expense_date", -1).skip(skip).limit(limit)
    expenses_docs = await cursor.to_list(length=limit)
    
    # Calculate pages
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "expenses": serialize_list(expenses_docs),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.get("/export")
async def export_expenses(
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Generates and exports filtered expenses as a beautifully formatted CSV stream.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    query = {"user_id": current_user["id"]}
    
    if category:
        query["category"] = category
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["expense_date"] = date_query
    if search:
        query["$or"] = [
            {"merchant": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = db.db.expenses.find(query).sort("expense_date", -1)
    expenses_docs = await cursor.to_list(length=10000) # Fetch up to 10k records for export
    
    serialized_expenses = serialize_list(expenses_docs)
    csv_buffer = generate_expenses_csv(serialized_expenses)
    
    filename = f"expenses_export_{current_user['name'].replace(' ', '_').lower()}.csv"
    
    return StreamingResponse(
        csv_buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    """
    Fetches the details of a single expense record by ID.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Expense ID format."
        )
        
    expense = await db.db.expenses.find_one({
        "_id": ObjectId(expense_id),
        "user_id": current_user["id"]
    })
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found."
        )
        
    return serialize_doc(expense)

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: str, expense_update: ExpenseUpdate, current_user: dict = Depends(get_current_user)):
    """
    Updates specific fields of an existing expense record.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Expense ID format."
        )
        
    # Check existence and ownership
    expense = await db.db.expenses.find_one({
        "_id": ObjectId(expense_id),
        "user_id": current_user["id"]
    })
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found."
        )
        
    # Prepare update data
    update_data = {k: v for k, v in expense_update.dict().items() if v is not None}
    
    if not update_data:
        return serialize_doc(expense)
        
    await db.db.expenses.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": update_data}
    )
    
    updated_doc = await db.db.expenses.find_one({"_id": ObjectId(expense_id)})
    return serialize_doc(updated_doc)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes an expense record and its associated receipt document.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    if not ObjectId.is_valid(expense_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Expense ID format."
        )
        
    # Verify owner
    expense = await db.db.expenses.find_one({
        "_id": ObjectId(expense_id),
        "user_id": current_user["id"]
    })
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found."
        )
        
    # Delete expense
    await db.db.expenses.delete_one({"_id": ObjectId(expense_id)})
    
    # Clean up associated receipt document from DB (if exists)
    await db.db.receipts.delete_one({"expense_id": expense_id})
    
    return None
