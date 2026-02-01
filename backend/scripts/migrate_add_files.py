#!/usr/bin/env python3
"""
Database Migration: Add File Management Tables

Adds folders and files tables for hierarchical file storage.
"""
import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from database import Base, engine
from database.file_models import Folder, File


async def migrate():
    """Create file management tables."""
    print("Creating file management tables...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Specifically create folders table
        await conn.run_sync(Folder.__table__.create, checkfirst=True)
        print("✓ Created 'folders' table")

        # Specifically create files table
        await conn.run_sync(File.__table__.create, checkfirst=True)
        print("✓ Created 'files' table")

    print("\n✅ File management migration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
