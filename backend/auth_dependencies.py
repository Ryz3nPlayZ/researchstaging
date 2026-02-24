"""
Authentication Dependencies for FastAPI endpoints.

Provides reusable Depends() for requiring or optionally extracting
the current authenticated user from a JWT Bearer token.
"""
import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, User
from auth_service import auth_service

logger = logging.getLogger(__name__)


async def require_auth(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that requires a valid JWT token.

    Usage:
        @router.get("/protected")
        async def protected(user: User = Depends(require_auth)):
            ...

    Raises:
        HTTPException 401 if token is missing, invalid, or user not found.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Extract token from "Bearer <token>" format
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization

    if not token or not token.strip():
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = await auth_service.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


async def optional_auth(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    FastAPI dependency that optionally extracts the authenticated user.

    Returns None if no token is provided (does not raise).
    Raises 401 only if a token IS provided but is invalid.
    """
    if not authorization:
        return None

    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization

    if not token or not token.strip():
        return None

    user = await auth_service.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


async def require_admin(
    user: User = Depends(require_auth),
) -> User:
    """
    FastAPI dependency that requires the authenticated user to be an admin.

    Usage:
        @router.get("/admin/users")
        async def list_users(admin: User = Depends(require_admin)):
            ...

    Raises:
        HTTPException 403 if user is not an admin.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
