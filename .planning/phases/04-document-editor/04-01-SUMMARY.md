# Plan 04-01: Document Backend Foundation

**Status:** ✓ Complete
**Duration:** 5 minutes
**Date:** 2026-02-04

## Tasks Completed

### Task 1: Create Document and DocumentVersion Models
**Commit:** a8c303e - `feat(04-01): add CitationStyle enum to Document model`

Created database models in `backend/database/models.py`:
- Document model with id, project_id, title, content (JSONB), content_hash, citation_style (SQLEnum)
- DocumentVersion model with id, document_id, content, change_description, created_at, created_by, parent_version_id
- CitationStyle enum: APA, MLA, CHICAGO
- Indexes on project_id, updated_at, document_id

### Task 2: Create Database Migration Script
**Commit:** 6b45587 - `feat(04-01): create database migration for document tables`

Created `backend/scripts/migrate_add_document_tables.py`:
- Async migration using AsyncSession
- Creates documents and document_versions tables
- Prints success message on completion

### Task 3: Create Document API Endpoints
**Commits:**
- aafeda9 - `feat(04-01): create Document API endpoints`
- b72fb38 - `feat(04-01): register document router in FastAPI app`

Created `backend/document_api.py` with 7 endpoints:
1. GET /api/projects/{project_id}/documents - List project documents
2. POST /api/projects/{project_id}/documents - Create new document
3. GET /api/documents/{document_id} - Get single document with content
4. PUT /api/documents/{document_id} - Update document content and/or title
5. DELETE /api/documents/{document_id} - Delete document
6. GET /api/documents/{document_id}/versions - List document versions
7. GET /api/documents/versions/{version_id} - Get specific version content

### Task 4: Register Document Router in FastAPI App
**Commit:** b72fb38 (combined with Task 3)

Registered document router in `backend/server.py` with `/api` prefix.

## Deviations

- Fixed blocking issue: Missing `Dict` import in memory_api.py (Rule 3)
- Discovery: Document models already existed from previous work, updated to use CitationStyle enum

## Verification

✓ All models import successfully  
✓ Migration runs successfully, tables created  
✓ Router has 7 endpoints  
✓ POST /api/projects/{id}/documents creates document  
✓ GET /api/documents/{id} retrieves document with content  
✓ PUT /api/documents/{id} updates document  
✓ content_hash calculated correctly (SHA-256)

## Next Steps

Document backend is complete with TipTap JSONB storage, SHA-256 hashing for change detection, auto-versioning, and full REST API. Ready for Phase 04-02: TipTap Document Editor Component.
