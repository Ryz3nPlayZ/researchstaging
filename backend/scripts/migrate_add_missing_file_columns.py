#!/usr/bin/env python3
"""
Add missing columns to files and folders tables.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db_session


async def migrate():
    """Add missing columns to files and folders tables."""
    async with get_db_session() as session:
        # Fix folders table
        print("Checking folders table...")
        result = await session.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'folders'
        """))
        existing_columns = {row[0] for row in result.fetchall()}

        folder_columns = {
            'path': 'VARCHAR(1000)',
            'description': 'TEXT',
            'file_count': 'INTEGER',
            'updated_at': 'TIMESTAMP WITH TIME ZONE'
        }

        for col_name, col_type in folder_columns.items():
            if col_name not in existing_columns:
                print(f"  Adding folder column {col_name}...")
                default_clause = ""
                if col_name == 'file_count':
                    default_clause = " DEFAULT 0"
                elif col_name == 'path':
                    default_clause = " DEFAULT ''"

                await session.execute(
                    text(f"ALTER TABLE folders ADD COLUMN {col_name} {col_type}{default_clause}")
                )
            else:
                print(f"  ✓ folder.{col_name} exists")

        # Fix files table
        print("\nChecking files table...")
        result = await session.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'files'
        """))
        existing_columns = {row[0] for row in result.fetchall()}

        file_columns = {
            'mime_type': 'VARCHAR(100)',
            'tags': 'JSONB',
            'updated_at': 'TIMESTAMP WITH TIME ZONE'
        }

        for col_name, col_type in file_columns.items():
            if col_name not in existing_columns:
                print(f"  Adding file column {col_name}...")
                await session.execute(
                    text(f"ALTER TABLE files ADD COLUMN {col_name} {col_type}")
                )
            else:
                print(f"  ✓ files.{col_name} exists")

        await session.commit()
        print("\n✓ Migration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
