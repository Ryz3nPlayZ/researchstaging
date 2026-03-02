"""
Migration script to rename claim_relationships to paper_claim_relationships.
Run: python scripts/rename_claim_relationships_table.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import engine
from sqlalchemy import text


async def migrate():
    """Rename claim_relationships table to paper_claim_relationships."""
    async with engine.begin() as conn:
        # Check if old table exists
        result = await conn.execute(
            text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'claim_relationships'
            );
        """)
        )
        old_exists = result.scalar()

        # Check if new table exists
        result = await conn.execute(
            text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'paper_claim_relationships'
            );
        """)
        )
        new_exists = result.scalar()

        if new_exists:
            print("New table paper_claim_relationships already exists.")
            if old_exists:
                print("Old table claim_relationships also exists - dropping it.")
                # Drop foreign key constraints from claim_annotations first
                await conn.execute(
                    text("""
                    ALTER TABLE claim_annotations
                    DROP CONSTRAINT IF EXISTS claim_annotations_relationship_id_fkey
                """)
                )
                # Drop old table
                await conn.execute(text("DROP TABLE claim_relationships CASCADE"))
                print("✓ Dropped old claim_relationships table")
            return

        if not old_exists:
            print("Neither table exists - fresh migration needed.")
            return

        print("Renaming claim_relationships to paper_claim_relationships...")

        # Drop foreign key constraint from claim_annotations
        await conn.execute(
            text("""
            ALTER TABLE claim_annotations
            DROP CONSTRAINT IF EXISTS claim_annotations_relationship_id_fkey
        """)
        )
        print("✓ Dropped FK constraint from claim_annotations")

        # Rename the table
        await conn.execute(
            text("ALTER TABLE claim_relationships RENAME TO paper_claim_relationships")
        )
        print("✓ Renamed table to paper_claim_relationships")

        # Rename indexes
        await conn.execute(
            text("ALTER INDEX idx_rel_paper RENAME TO idx_paper_rel_paper")
        )
        await conn.execute(
            text("ALTER INDEX idx_rel_source RENAME TO idx_paper_rel_source")
        )
        await conn.execute(
            text("ALTER INDEX idx_rel_target RENAME TO idx_paper_rel_target")
        )
        await conn.execute(
            text("ALTER INDEX idx_rel_type RENAME TO idx_paper_rel_type")
        )
        print("✓ Renamed indexes")

        # Recreate foreign key constraint
        await conn.execute(
            text("""
            ALTER TABLE claim_annotations
            ADD CONSTRAINT claim_annotations_relationship_id_fkey
            FOREIGN KEY (relationship_id) REFERENCES paper_claim_relationships(id) ON DELETE CASCADE
        """)
        )
        print("✓ Recreated FK constraint on claim_annotations")

        print("\n✅ Table rename completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
