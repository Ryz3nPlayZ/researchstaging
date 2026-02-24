import asyncio
import sys
import os

# Add parent directory to path so we can import from database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database.connection import engine

async def update_enum():
    async with engine.begin() as conn:
        print("Updating OutputType enum...")
        # Postgres cannot run ALTER TYPE inside a transaction block if it's already in one? 
        # Actually ALTER TYPE ADD VALUE cannot be run inside a transaction block that is not the top level one?
        # SQLAlchemy begin() starts a transaction.
        # But ALTER TYPE ADD VALUE *can* be run in a transaction in newer Postgres versions.
        # Let's try.
        
        values = ['ANALYSIS_REPORT', 'THESIS_CHAPTER', 'META_ANALYSIS']
        
        for value in values:
            try:
                # We need to run this as a text query
                # Note: IF NOT EXISTS is not supported for ADD VALUE until Postgres 12, but we can catch the error
                await conn.execute(text(f"ALTER TYPE outputtype ADD VALUE '{value}'"))
                print(f"Added {value}")
            except Exception as e:
                # Check if it's because it already exists
                if "already exists" in str(e) or "DuplicateObject" in str(e):
                    print(f"Value {value} already exists")
                else:
                    print(f"Error adding {value}: {e}")
                    # Don't re-raise, try others
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_enum())
