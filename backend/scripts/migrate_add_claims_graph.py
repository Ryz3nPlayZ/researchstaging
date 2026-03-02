"""
Migration script to add claims graph tables.
Run: python scripts/migrate_add_claims_graph.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import engine
from sqlalchemy import text


async def migrate():
    """Create claims graph tables."""
    async with engine.begin() as conn:
        # Check if tables already exist
        result = await conn.execute(
            text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'paper_uploads'
            );
        """)
        )
        exists = result.scalar()

        if exists:
            print("Claims graph tables already exist, skipping migration.")
            return

        print("Creating claims graph tables...")

        # Create paper_uploads table (using VARCHAR(36) like other tables)
        await conn.execute(
            text("""
            CREATE TABLE paper_uploads (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id VARCHAR(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size_bytes INTEGER,
                status VARCHAR(20) DEFAULT 'pending',
                status_message TEXT,
                extracted_text TEXT,
                extraction_metadata JSONB DEFAULT '{}',
                claim_count INTEGER DEFAULT 0,
                relationship_count INTEGER DEFAULT 0,
                contradiction_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        )
        await conn.execute(
            text("CREATE INDEX idx_paper_upload_project ON paper_uploads(project_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_paper_upload_user ON paper_uploads(user_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_paper_upload_status ON paper_uploads(status)")
        )
        print("✓ Created paper_uploads table")

        # Create paper_claims table
        await conn.execute(
            text("""
            CREATE TABLE paper_claims (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                paper_upload_id VARCHAR(36) NOT NULL REFERENCES paper_uploads(id) ON DELETE CASCADE,
                text TEXT NOT NULL,
                quote TEXT NOT NULL,
                claim_type VARCHAR(20) NOT NULL,
                section VARCHAR(50) NOT NULL,
                paragraph_index INTEGER NOT NULL,
                sentence_index INTEGER,
                page_number INTEGER,
                confidence FLOAT DEFAULT 0.0,
                evidence_strength FLOAT,
                importance_score FLOAT DEFAULT 0.0,
                embedding FLOAT[],
                is_valid BOOLEAN,
                user_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        )
        await conn.execute(
            text("CREATE INDEX idx_claim_paper ON paper_claims(paper_upload_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_claim_type ON paper_claims(claim_type)")
        )
        await conn.execute(
            text("CREATE INDEX idx_claim_section ON paper_claims(section)")
        )
        await conn.execute(
            text("CREATE INDEX idx_claim_confidence ON paper_claims(confidence)")
        )
        print("✓ Created paper_claims table")

        # Create paper_claim_relationships table
        await conn.execute(
            text("""
            CREATE TABLE paper_claim_relationships (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                paper_upload_id VARCHAR(36) NOT NULL REFERENCES paper_uploads(id) ON DELETE CASCADE,
                source_claim_id VARCHAR(36) NOT NULL REFERENCES paper_claims(id) ON DELETE CASCADE,
                target_claim_id VARCHAR(36) NOT NULL REFERENCES paper_claims(id) ON DELETE CASCADE,
                relationship_type VARCHAR(20) NOT NULL,
                detection_method VARCHAR(20) DEFAULT 'ai_inferred',
                confidence FLOAT DEFAULT 0.5,
                evidence_quote TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_rel_paper ON paper_claim_relationships(paper_upload_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_rel_source ON paper_claim_relationships(source_claim_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_rel_target ON paper_claim_relationships(target_claim_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_rel_type ON paper_claim_relationships(relationship_type)"
            )
        )
        print("✓ Created paper_claim_relationships table")

        # Create contradictions table
        await conn.execute(
            text("""
            CREATE TABLE claim_contradictions (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                paper_upload_id VARCHAR(36) NOT NULL REFERENCES paper_uploads(id) ON DELETE CASCADE,
                claim_1_id VARCHAR(36) NOT NULL REFERENCES paper_claims(id) ON DELETE CASCADE,
                claim_2_id VARCHAR(36) NOT NULL REFERENCES paper_claims(id) ON DELETE CASCADE,
                contradiction_type VARCHAR(20) NOT NULL,
                severity VARCHAR(10) DEFAULT 'medium',
                explanation TEXT NOT NULL,
                resolution_status VARCHAR(20) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP
            )
        """)
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_contra_paper ON claim_contradictions(paper_upload_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_contra_claims ON claim_contradictions(claim_1_id, claim_2_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX idx_contra_status ON claim_contradictions(resolution_status)"
            )
        )
        print("✓ Created claim_contradictions table")

        # Create claim_annotations table
        await conn.execute(
            text("""
            CREATE TABLE claim_annotations (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
                paper_upload_id VARCHAR(36) NOT NULL REFERENCES paper_uploads(id) ON DELETE CASCADE,
                claim_id VARCHAR(36) REFERENCES paper_claims(id) ON DELETE CASCADE,
                relationship_id VARCHAR(36) REFERENCES paper_claim_relationships(id) ON DELETE CASCADE,
                user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                annotation_type VARCHAR(20) NOT NULL,
                text TEXT NOT NULL,
                parent_annotation_id VARCHAR(36) REFERENCES claim_annotations(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        )
        await conn.execute(
            text("CREATE INDEX idx_anno_paper ON claim_annotations(paper_upload_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_anno_claim ON claim_annotations(claim_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_anno_user ON claim_annotations(user_id)")
        )
        await conn.execute(
            text("CREATE INDEX idx_anno_type ON claim_annotations(annotation_type)")
        )
        print("✓ Created claim_annotations table")

        print("\n✅ Claims graph migration completed successfully!")


if __name__ == "__main__":
    asyncio.run(migrate())
