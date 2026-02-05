#!/usr/bin/env python3
"""
Add ALL missing columns to files table.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db_session


async def migrate():
    """Add ALL missing columns to files table."""
    async with get_db_session() as session:
        # Get existing columns in files table
        result = await session.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'files'
        """))
        existing_columns = {row[0] for row in result.fetchall()}
        print(f"Existing columns in files: {sorted(existing_columns)}")

        # Define ALL required columns based on File model
        required_columns = {
            'path': "VARCHAR(1000) DEFAULT ''",
            'description': 'TEXT',
            'storage_path': 'VARCHAR(1000)',
            'content_hash': 'VARCHAR(64)',
            'mime_type': 'VARCHAR(100)',
            'tags': 'JSONB',
            'updated_at': 'TIMESTAMP WITH TIME ZONE'
        }

        for col_name, col_def in required_columns.items():
            if col_name not in existing_columns:
                print(f"Adding column files.{col_name}...")
                await session.execute(
                    text(f"ALTER TABLE files ADD COLUMN {col_name} {col_def}")
                )
                print(f"  ✓ Added {col_name}")
            else:
                print(f"  ✓ files.{col_name} already exists")

        await session.commit()
        print("\n✓ Migration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
