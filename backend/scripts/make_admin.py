#!/usr/bin/env python3
"""
Make a user an admin by email.

Usage:
    python scripts/make_admin.py user@example.com
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend dir to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from sqlalchemy import select
from database.connection import get_db_session
from database.credit_models import User


async def make_admin(email: str) -> None:
    async with get_db_session() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f"❌ No user found with email: {email}")
            sys.exit(1)

        user.is_admin = True
        await db.commit()
        print(f"✅ {email} is now an admin (id={user.id})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/make_admin.py <email>")
        sys.exit(1)
    asyncio.run(make_admin(sys.argv[1]))
