import asyncio
import sys
import os

# Append parent dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def test_mongodb_connection():
    print("==================================================")
    print("      MongoDB Atlas Connection Validator          ")
    print("==================================================")
    print(f"Connecting to database url: {settings.MONGODB_URL}")
    
    try:
        # Create client
        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        
        # Ping server to confirm connection
        print("Pinging database server...")
        await client.admin.command('ping')
        print("[OK] Ping successful! Connection to MongoDB Atlas established.")
        
        # Access database
        db_name = settings.DB_NAME
        db = client[db_name]
        print(f"[OK] Database accessed: '{db_name}'")
        
        # Collection indices verification
        print("\nVerifying/Creating indexes...")
        await db.users.create_index("email", unique=True)
        print("[OK] Index verified: users (email -> unique)")
        
        await db.expenses.create_index([("user_id", 1), ("expense_date", -1)])
        await db.expenses.create_index("category")
        print("[OK] Indexes verified: expenses (user_id/expense_date, category)")
        
        await db.receipts.create_index("expense_id", unique=True)
        print("[OK] Index verified: receipts (expense_id -> unique)")
        
        print("\n==================================================")
        print("[SUCCESS] Connection verification completed successfully!")
        print("==================================================")
        
        client.close()
    except Exception as e:
        print("\n[ERROR] Connection Failed!")
        print(f"Error details: {e}")
        print("--------------------------------------------------")
        print("Please check:")
        print("1. Your MONGODB_URL in the .env file is correct.")
        print("2. Your database credentials (username/password) are correct.")
        print("3. Your MongoDB Atlas network access IP whitelist includes your current IP.")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_mongodb_connection())
