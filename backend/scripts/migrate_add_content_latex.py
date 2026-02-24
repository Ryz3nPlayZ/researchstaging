#!/usr/bin/env python3
"""
Migration script to add content_latex column to documents table.
When set, the document uses LaTeX/Markdown+math as source with live preview.
"""
import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database.connection import engine
from sqlalchemy import text


async def migrate():
    """Add content_latex column to documents if not present."""
    print("Adding content_latex column to documents...")
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_latex TEXT"
        ))
    print("Migration complete. documents.content_latex is available for LaTeX/Markdown source.")


if __name__ == "__main__":
    asyncio.run(migrate())
