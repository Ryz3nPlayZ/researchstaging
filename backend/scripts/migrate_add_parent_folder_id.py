#!/usr/bin/env python3
"""
Add parent_folder_id column to folders table.
This column was added in phase 02-02 but the database schema wasn't updated.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db_session


async def migrate():
    """Add parent_folder_id column to folders table if it doesn't exist."""
    async with get_db_session() as session:
        # Check if column exists
        result = await session.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'folders' AND column_name = 'parent_folder_id'
        """))

        if not result.fetchone():
            print("Adding parent_folder_id column to folders table...")
            await session.execute(text("ALTER TABLE folders ADD COLUMN parent_folder_id VARCHAR"))
            await session.commit()
            print("✓ Column added successfully!")
        else:
            print("✓ Column parent_folder_id already exists")


if __name__ == "__main__":
    asyncio.run(migrate())
