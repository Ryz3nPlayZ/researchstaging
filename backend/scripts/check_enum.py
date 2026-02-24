import asyncio
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database.connection import engine

async def check():
    print("Checking enum values...")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT unnest(enum_range(NULL::outputtype))"))
            values = result.scalars().all()
            print(f"Enum values in DB: {values}")
    except Exception as e:
        print(f"Error checking enum: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
