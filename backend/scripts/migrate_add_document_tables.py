#!/usr/bin/env python3
"""
Migration script to add document tables.
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database.connection import engine
from database import Base
from database.models import Document, DocumentVersion, DocumentCitation, CitationStyle, CitationSource


async def migrate():
    """Run migration to add document tables."""
    print("Starting document tables migration...")

    # Create all tables that don't exist yet
    print("Creating document tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  Tables created successfully")

    print("\nMigration complete!")
    print("\nCreated tables:")
    print("  - documents (TipTap JSON content, citation style)")
    print("  - document_versions (version history with branching support)")
    print("  - document_citations (citation management for documents)")
    print("\nCreated indexes:")
    print("  - idx_documents_project_id (for project document lookup)")
    print("  - idx_documents_updated_at (for sorting recent documents)")
    print("  - idx_document_versions_document_id (for version queries)")
    print("  - idx_document_versions_created_at (for timeline view)")
    print("  - idx_document_citations_document_id (for document citations)")
    print("  - idx_document_citations_source (for source lookup)")
    print("\nSupported citation styles:")
    print("  - APA (default)")
    print("  - MLA")
    print("  - Chicago")
    print("\nNext steps:")
    print("  Document backend is ready for rich text editor integration")


if __name__ == "__main__":
    asyncio.run(migrate())
