#!/usr/bin/env python3
"""
Add missing columns to folders table.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db_session


async def migrate():
    """Add missing columns to folders table."""
    async with get_db_session() as session:
        # Get existing columns
        result = await session.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'folders'
        """))
        existing_columns = {row[0] for row in result.fetchall()}
        print(f"Existing columns: {existing_columns}")

        # Define required columns
        required_columns = {
            'parent_folder_id': 'VARCHAR',
            'path': 'VARCHAR(1000)',
            'description': 'TEXT',
            'file_count': 'INTEGER',
            'updated_at': 'TIMESTAMP WITH TIME ZONE'
        }

        for col_name, col_type in required_columns.items():
            if col_name not in existing_columns:
                print(f"Adding column {col_name}...")
                default_clause = ""
                if col_name == 'file_count':
                    default_clause = " DEFAULT 0"
                elif col_name == 'path':
                    default_clause = " DEFAULT ''"

                await session.execute(
                    text(f"ALTER TABLE folders ADD COLUMN {col_name} {col_type}{default_clause}")
                )
                print(f"  ✓ Added {col_name}")
            else:
                print(f"  ✓ {col_name} already exists")

        await session.commit()
        print("\n✓ Migration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
