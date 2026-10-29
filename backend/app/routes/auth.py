from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from app.config.settings import settings
from app.database.connection import db
from app.schemas.user import UserRegister, UserResponse
from app.schemas.auth import UserLogin, Token
from app.auth.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserDB
from app.utils.helpers import serialize_doc

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    """
    Registers a new user in the system.
    Saves a hashed password, creates database entry, and issues a JWT token.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Check if user already exists
    existing_user = await db.db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
        
    # Prepare user database object
    hashed_pwd = get_password_hash(user_in.password)
    user_db = UserDB(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd
    )
    
    # Save to MongoDB
    result = await db.db.users.insert_one(user_db.dict())
    user_id = str(result.inserted_id)
    
    # Create Access Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_in.email, "user_id": user_id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    Authenticates user credentials and issues a JWT access token.
    """
    if db.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is offline."
        )
        
    # Fetch user from DB
    user = await db.db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Create Access Token
    user_id = str(user["_id"])
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "user_id": user_id},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
