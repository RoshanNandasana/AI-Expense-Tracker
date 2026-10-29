import logging
from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse
from app.config.settings import settings

logger = logging.getLogger("app.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB Atlas...")
    
    # Read configured DB name
    db_name = settings.DB_NAME
    
    try:
        # If database name is specified in the MONGODB_URL connection string, extract it
        parsed = urlparse(settings.MONGODB_URL)
        if parsed.path and parsed.path != '/':
            # Strip leading '/' and remove query params if any
            extracted_db = parsed.path.lstrip('/')
            if extracted_db:
                db_name = extracted_db
    except Exception as e:
        logger.warning(f"Error parsing database name from MONGODB_URL: {e}. Defaulting to '{db_name}'.")

    # Connect client
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[db_name]
    
    logger.info(f"Successfully connected to MongoDB database: {db_name}")
    
    # Initialize indexes
    await create_indexes()

async def close_mongo_connection():
    if db.client:
        logger.info("Closing MongoDB connection...")
        db.client.close()
        logger.info("MongoDB connection closed.")

async def create_indexes():
    """Create collection indexes for search optimizations and unique constraints."""
    if db.db is not None:
        try:
            # Users Collection
            # Email must be unique
            await db.db.users.create_index("email", unique=True)
            
            # Expenses Collection
            # Index on user_id + expense_date (descending) is perfect for chronological queries per user
            await db.db.expenses.create_index([("user_id", 1), ("expense_date", -1)])
            # Index on category for category-wise aggregations and filtering
            await db.db.expenses.create_index("category")
            # Text index for search functionality
            await db.db.expenses.create_index([
                ("merchant", "text"),
                ("category", "text"),
                ("description", "text")
            ], name="expense_text_search")
            
            # Receipts Collection
            # Index on expense_id since receipts are linked to expenses
            await db.db.receipts.create_index("expense_id", unique=True)
            
            logger.info("MongoDB indexes successfully verified and created.")
        except Exception as e:
            logger.error(f"Failed to create MongoDB indexes: {e}")
