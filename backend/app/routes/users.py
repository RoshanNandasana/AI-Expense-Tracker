from fastapi import APIRouter, Depends, HTTPException, status
from app.database.connection import db
from app.schemas.user import UserResponse, UserUpdate
from app.auth.security import get_current_user, get_password_hash
from app.utils.helpers import serialize_doc
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Fetches the profile details of the currently authenticated user.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """
    Updates the profile settings of the currently authenticated user.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    update_data = {}
    
    if user_update.name is not None:
        update_data["name"] = user_update.name
        
    if user_update.email is not None:
        # Check if email is already taken
        if user_update.email != current_user["email"]:
            existing_user = await db.db.users.find_one({"email": user_update.email})
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already in use by another account."
                )
            update_data["email"] = user_update.email
            
    if user_update.password is not None:
        update_data["hashed_password"] = get_password_hash(user_update.password)
        
    if not update_data:
        return current_user
        
    # Apply updates to MongoDB
    await db.db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    # Retrieve updated user
    updated_user = await db.db.users.find_one({"_id": ObjectId(current_user["id"])})
    return serialize_doc(updated_user)
