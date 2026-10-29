from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field

class UserDB(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
