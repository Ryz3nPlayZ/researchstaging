# Architecture

**Analysis Date:** 2026-02-11

## Pattern Overview

**Overall:** Over-engineered service-oriented architecture with contradictory patterns

**Key Characteristics:**
- **State Machine Contradiction**: Claims state-driven orchestration but implements RPC-style API endpoints
- **Layer Violations**: Business logic leaks into API layer, violating separation of concerns
- **Service Explosion**: 15+ services where 3-4 would suffice
- **Multiple Frontends**: Three separate frontend implementations creating confusion

## Layers

### API Layer ( backend/*.py )
- **Purpose**: HTTP endpoint definitions
- **Location**: `/home/zemul/Programming/research/backend/`
- **Contains**: API route definitions and HTTP request handling
- **Depends on**: All services, orchestration engine, database
- **Issues**:
  - Business logic mixed with API concerns (lines 100-800 in server.py)
  - API endpoints directly manipulate database state instead of using orchestration engine
  - 20+ API endpoints create unnecessary complexity

### Service Layer ( backend/*_service.py )
- **Purpose**: Business logic encapsulation
- **Location**: `/home/zemul/Programming/research/backend/`
- **Contains**: 15 service classes with unclear responsibilities
- **Issues**:
  - Over-abstraction: Each micro-feature has its own service
  - Circular dependencies: Services depend on each other
  - Violation of single responsibility principle

### Orchestration Layer ( backend/orchestration/ )
- **Purpose**: Task state management and dependency resolution
- **Location**: `/home/zemul/Programming/research/backend/orchestration/`
- **Contains**: OrchestrationEngine class
- **Issues**:
  - Unused by API layer (endpoints bypass it)
  - Over-engineered for simple task state transitions
  - Redis dependency adds unnecessary complexity

### Data Layer ( backend/database/ )
- **Purpose**: Database models and connection management
- **Location**: `/home/zemul/Programming/research/backend/database/`
- **Contains**: SQLAlchemy models and connection utilities
- **Issues**:
  - Good separation but coupled to ORM specifics
  - Migration scripts scattered across codebase

### Frontend Layer ( frontend/, frontend3/ )
- **Purpose**: User interface
- **Location**: Multiple locations (confusing)
- **Issues**:
  - Three separate implementations (frontend/, frontend3/, research_tui/)
  - No clear primary interface
  - Code duplication across versions

## Data Flow

### Stated Flow:
```
User Request → API → Service → Orchestration → Worker → Database
```

### Actual Flow:
```
User Request → API → Direct DB manipulation (bypassing orchestration)
```

**Critical Issue**: The system claims to be "state-driven orchestration" but API endpoints directly manipulate database records without going through the orchestration engine. This violates the core architectural principle.

## Key Abstractions

### OrchestrationEngine:
- **Purpose**: Manage task lifecycle
- **Location**: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- **Issue**: Engine exists but API routes don't use it

### Service Classes:
- **Issue**: Too many services with unclear boundaries
- **Examples**:
  - `llm_service.py`: LLM provider abstraction (good)
  - `credit_service.py`: API usage tracking (reasonable)
  - `relevance_service.py`: Paper relevance scoring (over-specific)

### API Models:
- **Location**: `/home/zemul/Programming/research/backend/api_models.py`
- **Issue**: Pydantic models duplicated across endpoints

## Entry Points

### Backend:
- **Location**: `/home/zemul/Programming/research/backend/server.py`
- **Issues**:
  - 1000+ lines mixing everything
  - No clear separation of concerns
  - Direct database operations bypassing architecture

### Frontend:
- **Primary**: `/home/zemul/Programming/research/frontend/src/`
- **Secondary**: `/home/zemul/Programming/research/frontend3/` (incomplete)
- **TUI**: `/home/zemul/Programming/research/research_tui/` (separate package)
- **Issue**: Three entry points create confusion

### Frontend3 (New Implementation):
- **Issue**: Parallel implementation suggests dissatisfaction with original

## Error Handling

**Strategy**: Mixed - some services use proper error handling, others don't

**Patterns**:
- Inconsistent error responses across endpoints
- No centralized error handling
- Database errors not properly abstracted

## Cross-Cutting Concerns

**Logging**: Basic logging configuration, no structured logging
**Authentication**: JWT + Google OAuth but inconsistently applied
**Validation**: Mixed between API validation and service validation

## Architecture Disparities

### Claimed vs Actual Architecture:
- **Claimed**: "State-driven orchestration pipeline"
- **Actual**: RPC-style API with direct database manipulation

### Over-Engineering Issues:
1. **15+ Services**: System could work with 3-4 core services
2. **Orchestration Engine**: Unused by main API paths
3. **Multiple Frontends**: Three implementations waste resources
4. **Complex Dependencies**: Redis for task queue that could be simpler

### Inconsistencies:
- Database models accessed directly instead of through repository pattern
- Business logic in API endpoints instead of services
- No clear bounded contexts

## Recommendations

1. **Remove Orchestration Engine**: It's unused and adds complexity
2. **Consolidate Services**: Merge related services into logical units
3. **Single Frontend**: Choose one implementation and maintain it
4. **Repository Pattern**: Add data access layer to prevent direct DB access
5. **API Gateway**: Centralize cross-cutting concerns

---

*Architecture analysis: 2026-02-11*
