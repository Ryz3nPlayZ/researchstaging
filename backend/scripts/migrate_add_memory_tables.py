#!/usr/bin/env python3
"""
Migration script to add memory and information graph tables.
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database.connection import engine
from database import Base
from database.models import Claim, Finding, Preference, ClaimRelationship
from sqlalchemy import text


async def migrate():
    """Run migration to add memory tables."""
    print("Starting memory tables migration...")

    # Enable pg_trgm extension for text search
    print("Enabling pg_trgm extension...")
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
    print("  pg_trgm extension enabled")

    # Create helper function for recursive claim traversal
    print("Creating get_related_claims() helper function...")
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE OR REPLACE FUNCTION get_related_claims(
                p_project_id VARCHAR(36),
                p_claim_id VARCHAR(36),
                p_max_depth INTEGER DEFAULT 3
            )
            RETURNS TABLE (
                claim_id VARCHAR(36),
                claim_text TEXT,
                relationship_type VARCHAR(50),
                depth INTEGER,
                path VARCHAR(256)[]
            ) AS $$
            DECLARE
            BEGIN
                RETURN QUERY
                WITH RECURSIVE claim_graph AS (
                    -- Base case: direct relationships
                    SELECT
                        c.id,
                        c.claim_text,
                        cr.relationship_type,
                        1 as depth,
                        ARRAY[c.id] as path
                    FROM claims c
                    JOIN claim_relationships cr ON cr.to_claim_id = c.id
                    WHERE cr.from_claim_id = p_claim_id
                      AND c.project_id = p_project_id

                    UNION ALL

                    -- Recursive case: follow relationships
                    SELECT
                        c.id,
                        c.claim_text,
                        cr.relationship_type,
                        cg.depth + 1,
                        cg.path || c.id
                    FROM claims c
                    JOIN claim_relationships cr ON cr.to_claim_id = c.id
                    JOIN claim_graph cg ON cg.claim_id = cr.from_claim_id
                    WHERE c.project_id = p_project_id
                      AND cg.depth < p_max_depth
                      AND NOT c.id = ANY(cg.path)  -- Prevent cycles
                )
                SELECT * FROM claim_graph
                ORDER BY depth, relationship_type;
            END;
            $$ LANGUAGE plpgsql;
        """))
    print("  get_related_claims() function created")

    # Create all tables that don't exist yet
    print("Creating memory tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("  Tables created successfully")

    print("\n Migration complete!")
    print("\nCreated tables:")
    print("  - claims (provenance tracking, confidence, relevance)")
    print("  - findings (analysis results, significance)")
    print("  - preferences (user settings, flexible JSONB values)")
    print("  - claim_relationships (adjacency list for graph traversal)")
    print("\nCreated indexes:")
    print("  - GIN indexes on claim_text and finding_text (full-text search)")
    print("  - B-tree indexes on project_id, source_type/source_id, relevance")
    print("\nCreated helper functions:")
    print("  - get_related_claims(project_id, claim_id, max_depth)")
    print("    Returns all claims connected to the given claim via recursive CTE")
    print("\nNext steps:")
    print("  Memory backend is ready for claim extraction and relationship tracking")


if __name__ == "__main__":
    asyncio.run(migrate())
