---
phase: 02-file-management
plan: 04
subsystem: infra
tags: [s3, r2, cloudflare, aws, storage, boto3, presigned-urls]

# Dependency graph
requires:
  - phase: 02-file-management
    plan: 01-03
    provides: Complete file management system with local storage
provides:
  - Storage abstraction layer supporting local, S3, and R2 backends
  - Environment-based storage backend configuration
  - Presigned URL generation for secure S3/R2 downloads
  - Migration script for moving local files to cloud storage
  - Complete documentation for cloud storage setup
affects: [02-file-management, future deployment phases]

# Tech tracking
tech-stack:
  added: [boto3 (AWS S3 SDK), storage abstraction pattern]
  patterns:
    - Storage backend factory pattern with environment-based selection
    - Presigned URL generation for secure cloud file access
    - Graceful fallback to local storage on configuration errors

key-files:
  created:
    - backend/storage_service.py
    - backend/scripts/migrate_to_cloud.py
    - backend/.env.example
  modified:
    - backend/file_service.py
    - backend/file_api.py
    - frontend/src/lib/api.js
    - frontend/src/components/files/FileExplorer.jsx
    - SETUP.md

key-decisions:
  - "Use Cloudflare R2 as recommended storage backend (zero egress fees for research datasets)"
  - "Maintain backward compatibility with local storage for development"
  - "Storage backend selection via environment variable (STORAGE_BACKEND)"
  - "Presigned URLs for S3/R2, direct streaming for local storage"
  - "Graceful fallback to local storage if cloud credentials incomplete"

patterns-established:
  - "Storage backend abstraction: Single interface (upload_file, download_file, delete_file, get_file_url)"
  - "Environment-driven configuration: STORAGE_BACKEND determines backend at runtime"
  - "Presigned URL pattern: S3/R2 returns temporary URL, local streams directly"
  - "Migration with verification: Upload to cloud, verify existence, then delete local"

# Metrics
duration: 6min
completed: 2026-02-04
---

# Phase 2: Plan 4 - Cloud Storage Integration Summary

**S3/R2 storage abstraction with boto3, presigned URL downloads, and local-to-cloud migration utility**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-02-04T01:58:38Z
- **Completed:** 2026-02-04T02:04:36Z
- **Tasks:** 5 (all completed)
- **Files modified:** 8

## Accomplishments

- **Storage abstraction layer** supporting local disk, AWS S3, and Cloudflare R2 backends via unified interface
- **Environment-based configuration** with automatic fallback to local storage for development ease
- **Presigned URL generation** for secure S3/R2 downloads (1-hour expiration, no exposed credentials)
- **Migration script** for moving existing local files to cloud storage with verification and dry-run mode
- **Complete documentation** covering S3 and R2 setup, migration process, and rollback procedures

## Task Commits

Each task was committed atomically:

1. **Task 1: Add S3 client configuration and abstraction layer** - `86c033a` (feat)
2. **Task 2-4: Update file_service to use storage abstraction, implement presigned URLs** - `a3d17bb` (feat)
3. **Task 5: Update frontend to handle presigned URLs** - `613808d` (feat)

**Plan metadata:** (to be committed)

## Files Created/Modified

### Created
- `backend/storage_service.py` - Storage backend abstraction (Local, S3, R2)
- `backend/scripts/migrate_to_cloud.py` - Migration utility with verification
- `backend/.env.example` - Complete environment variable template

### Modified
- `backend/file_service.py` - Use storage service instead of direct file I/O
- `backend/file_api.py` - Presigned URL generation for downloads
- `frontend/src/lib/api.js` - Async downloadFile function handling both URL types
- `frontend/src/components/files/FileExplorer.jsx` - Async download with error handling
- `SETUP.md` - Added cloud storage configuration and migration docs

## Decisions Made

1. **Cloudflare R2 recommended over AWS S3** - Zero egress fees critical for research datasets that may be frequently downloaded. S3-compatible API makes drop-in replacement trivial.

2. **Storage backend via environment variable** - `STORAGE_BACKEND=local|s3|r2` allows switching without code changes. Fallback to local if cloud credentials incomplete prevents deployment failures.

3. **Presigned URLs for cloud, streaming for local** - S3/R2 return `{ download_url, expires_in }` JSON response; local storage streams file directly. Frontend handles both cases transparently.

4. **Migration with verification** - Script uploads each file to cloud, verifies existence via `file_exists()`, then deletes local copy. Prevents data loss from failed uploads.

5. **Maintain local storage_path format** - No schema migration required. Storage key format (`projects/{id}/{subdir}/{file}.{ext}`) works for both local and cloud.

6. **Temporary files for metadata extraction** - Since files are now uploaded to storage before metadata extraction, save to temp file for extraction, then clean up. Small performance trade-off for cleaner architecture.

## Deviations from Plan

None - plan executed exactly as written. All tasks completed without unexpected issues or auto-fixes.

## Issues Encountered

None - implementation proceeded smoothly. Boto3 integration worked as expected, presigned URL generation standard AWS pattern, and frontend async conversion straightforward.

## User Setup Required

External services require manual configuration. See [SETUP.md](../../SETUP.md) for:

### Cloudflare R2 (Recommended)
1. Create Cloudflare account and enable R2
2. Create bucket (e.g., `research-workspace-files`)
3. Create R2 API token with edit permissions
4. Configure environment variables:
   - `STORAGE_BACKEND=r2`
   - `S3_BUCKET_NAME=your-bucket-name`
   - `S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID=your-r2-token-access-key`
   - `S3_SECRET_ACCESS_KEY=your-r2-token-secret`

### AWS S3 (Alternative)
1. Create AWS account and S3 bucket
2. Create IAM user with S3 permissions
3. Generate access keys
4. Configure environment variables:
   - `STORAGE_BACKEND=s3`
   - `S3_BUCKET_NAME=your-bucket-name`
   - `S3_REGION=us-east-1`
   - `S3_ACCESS_KEY_ID=your-aws-access-key`
   - `S3_SECRET_ACCESS_KEY=your-aws-secret-key`

### Migration (if switching from local)
1. Configure cloud credentials in `.env`
2. Test migration: `python scripts/migrate_to_cloud.py --dry-run`
3. Perform migration: `python scripts/migrate_to_cloud.py`
4. Update `STORAGE_BACKEND=s3` or `r2` in `.env`
5. Restart backend

## Next Phase Readiness

### Complete
- Storage abstraction allows seamless switching between backends
- Migration script enables moving existing data to cloud
- Frontend handles both local and cloud downloads transparently
- Documentation covers setup, migration, and rollback

### For Phase 3 (Search & Retrieval)
- Cloud storage enables global file access across instances
- Presigned URLs can be embedded in search results
- No additional storage work needed for search functionality

### Blockers/Concerns
- **None** - Phase 2 complete and ready for Phase 3

---
*Phase: 02-file-management*
*Completed: 2026-02-04*
