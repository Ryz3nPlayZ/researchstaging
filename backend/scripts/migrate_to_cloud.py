#!/usr/bin/env python3
"""
Migrate Local Files to Cloud Storage

This script migrates files from local disk storage to S3/R2 cloud storage.
It updates database records and verifies successful uploads before deletion.

Usage:
    python migrate_to_cloud.py --dry-run  # Test without modifying data
    python migrate_to_cloud.py            # Perform migration
"""
import os
import sys
import logging
import asyncio
from pathlib import Path
from typing import Optional
import argparse

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_session, File
from storage_service import get_storage, S3StorageBackend, LocalStorageBackend

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MigrationStats:
    """Track migration statistics."""

    def __init__(self):
        self.total_files = 0
        self.migrated = 0
        self.failed = 0
        self.skipped = 0
        self.deleted_local = 0
        self.total_size_bytes = 0

    def report(self):
        """Print migration report."""
        size_mb = self.total_size_bytes / (1024 * 1024)

        print("\n" + "=" * 60)
        print("MIGRATION REPORT")
        print("=" * 60)
        print(f"Total files found:      {self.total_files}")
        print(f"Successfully migrated:  {self.migrated}")
        print(f"Failed:                 {self.failed}")
        print(f"Skipped:                {self.skipped}")
        print(f"Local files deleted:    {self.deleted_local}")
        print(f"Total data migrated:    {size_mb:.2f} MB")
        print("=" * 60)


async def migrate_file(
    file_record: File,
    storage_backend: S3StorageBackend,
    dry_run: bool = False
) -> bool:
    """
    Migrate a single file to cloud storage.

    Args:
        file_record: File database record
        storage_backend: Cloud storage backend
        dry_run: If True, don't actually upload

    Returns:
        True if migration succeeded, False otherwise
    """
    # Check if file exists locally
    if not os.path.exists(file_record.storage_path):
        logger.warning(f"Local file not found: {file_record.storage_path}")
        return False

    # Determine storage key from storage_path
    # storage_path format: uploads/projects/{project_id}/{subdir}/{file_id}.{ext}
    # storage_key format: projects/{project_id}/{subdir}/{file_id}.{ext}
    storage_key = file_record.storage_path.replace("uploads/", "") if file_record.storage_path.startswith("uploads/") else file_record.storage_path

    logger.info(f"Processing: {file_record.name} ({file_record.size_bytes} bytes)")
    logger.debug(f"  Local path:  {file_record.storage_path}")
    logger.debug(f"  Storage key: {storage_key}")

    if dry_run:
        logger.info(f"  [DRY RUN] Would upload to cloud storage")
        return True

    try:
        # Read file content
        with open(file_record.storage_path, 'rb') as f:
            content = f.read()

        # Upload to cloud storage
        await storage_backend.upload_file(storage_key, content)

        # Verify upload
        if await storage_backend.file_exists(storage_key):
            logger.info(f"  ✓ Upload verified")

            # Update database record (storage_path already correct format)
            # No need to update storage_path as it already represents the key

            # Delete local file
            try:
                os.remove(file_record.storage_path)
                logger.info(f"  ✓ Local file deleted")
                return True
            except Exception as e:
                logger.error(f"  ✗ Failed to delete local file: {e}")
                return False
        else:
            logger.error(f"  ✗ Upload verification failed")
            return False

    except Exception as e:
        logger.error(f"  ✗ Migration failed: {e}")
        return False


async def main(dry_run: bool = False, project_id: Optional[str] = None):
    """Main migration function."""

    print("\n" + "=" * 60)
    print("CLOUD STORAGE MIGRATION")
    print("=" * 60)

    # Check storage backend
    storage = get_storage()
    if not isinstance(storage, S3StorageBackend):
        print("\n✗ Error: Cloud storage not configured!")
        print("\nTo enable cloud storage, set these environment variables:")
        print("  STORAGE_BACKEND=s3 (or r2)")
        print("  S3_BUCKET_NAME=your-bucket-name")
        print("  S3_ACCESS_KEY_ID=your-access-key")
        print("  S3_SECRET_ACCESS_KEY=your-secret-key")
        print("\nFor Cloudflare R2, also set:")
        print("  S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com")
        print("\nFor AWS S3, also set:")
        print("  S3_REGION=us-east-1")
        sys.exit(1)

    storage_type = "R2" if storage.endpoint_url and "r2" in storage.endpoint_url else "S3"
    print(f"\nStorage backend: {storage_type}")
    print(f"Bucket: {storage.bucket_name}")
    print(f"Dry run: {'Yes' if dry_run else 'No'}")

    if project_id:
        print(f"Project filter: {project_id}")

    print("\n" + "-" * 60)

    # Get database session
    async with get_db_session() as db:
        # Query files
        query = db.query(File)
        if project_id:
            query = query.filter(File.project_id == project_id)

        files = await query.all()

        if not files:
            print("\nNo files found to migrate.")
            return

        stats = MigrationStats()
        stats.total_files = len(files)

        print(f"\nFound {stats.total_files} files to process\n")

        # Migrate each file
        for i, file_record in enumerate(files, 1):
            print(f"\n[{i}/{stats.total_files}]", end=" ")

            # Check if already in cloud (no local file exists)
            if not os.path.exists(file_record.storage_path):
                logger.info(f"Skipping {file_record.name} (no local file)")
                stats.skipped += 1
                continue

            stats.total_size_bytes += file_record.size_bytes

            # Migrate file
            success = await migrate_file(file_record, storage, dry_run=dry_run)

            if success:
                stats.migrated += 1
                if not dry_run:
                    stats.deleted_local += 1
            else:
                stats.failed += 1

        # Print report
        stats.report()

        if stats.failed > 0:
            print(f"\n⚠ {stats.failed} files failed to migrate.")
            print("Please check the logs above and re-run this script.")
            sys.exit(1)

        if dry_run:
            print("\n[DRY RUN] No files were actually migrated.")
            print("Run without --dry-run to perform the migration.")
        else:
            print("\n✓ Migration completed successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Migrate files from local to cloud storage"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Test migration without actually uploading files"
    )
    parser.add_argument(
        "--project-id",
        type=str,
        help="Only migrate files from a specific project"
    )

    args = parser.parse_args()

    try:
        asyncio.run(main(dry_run=args.dry_run, project_id=args.project_id))
    except KeyboardInterrupt:
        print("\n\nMigration cancelled by user.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        sys.exit(1)
