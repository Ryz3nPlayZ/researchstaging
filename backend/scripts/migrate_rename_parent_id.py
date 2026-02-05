#!/usr/bin/env python3
"""
Fix folder table column naming.
The database has 'parent_id' but the model expects 'parent_folder_id'.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db_session


async def migrate():
    """Rename parent_id to parent_folder_id in folders table."""
    async with get_db_session() as session:
        # Check if parent_id exists
        result = await session.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'folders' AND column_name = 'parent_id'
        """))

        if result.fetchone():
            print("Renaming parent_id to parent_folder_id...")

            # Drop the old foreign key constraint
            await session.execute(text("""
                ALTER TABLE folders DROP CONSTRAINT folders_parent_id_fkey
            """))

            # Drop the old index
            await session.execute(text("""
                DROP INDEX IF EXISTS idx_folders_parent_id
            """))

            # Rename the column
            await session.execute(text("""
                ALTER TABLE folders RENAME COLUMN parent_id TO parent_folder_id
            """))

            # Create the new foreign key constraint
            await session.execute(text("""
                ALTER TABLE folders ADD CONSTRAINT folders_parent_folder_id_fkey
                FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE
            """))

            # Create the new index
            await session.execute(text("""
                CREATE INDEX idx_folders_parent_folder_id ON folders(parent_folder_id)
            """))

            await session.commit()
            print("✓ Migration completed successfully!")
        else:
            print("✓ Column parent_id does not exist, already migrated")


if __name__ == "__main__":
    asyncio.run(migrate())
