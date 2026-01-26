#!/usr/bin/env python3
"""
Migration script to add credit system tables to existing database using SQLAlchemy.
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database.connection import engine
from database import Base, User, CreditTransaction, CreditPackage


async def migrate():
    """Run migration to add credit system tables using SQLAlchemy."""
    print("Starting credit system migration...")

    # Create all tables that don't exist yet
    print("Creating new tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print(" Tables created successfully!")

    # Insert default credit packages
    print("Inserting default credit packages...")
    import uuid
    from sqlalchemy.ext.asyncio import AsyncSession

    async with AsyncSession(engine) as session:
        packages = [
            CreditPackage(
                id=str(uuid.uuid4()),
                name="Starter",
                credits_amount=10000,
                price_usd=10.0,
                stripe_price_id="price_starter",
                display_order=1,
                description="Perfect for exploring the platform",
                features=["10,000 credits", "Email support"]
            ),
            CreditPackage(
                id=str(uuid.uuid4()),
                name="Professional",
                credits_amount=100000,
                price_usd=79.0,
                stripe_price_id="price_professional",
                display_order=2,
                description="For serious researchers",
                features=["100,000 credits", "Priority support", "Advanced features"]
            ),
            CreditPackage(
                id=str(uuid.uuid4()),
                name="Enterprise",
                credits_amount=1000000,
                price_usd=499.0,
                stripe_price_id="price_enterprise",
                display_order=3,
                description="For research teams and heavy usage",
                features=["1,000,000 credits", "Dedicated support", "Custom integrations", "Team features"]
            ),
        ]
        
        for pkg in packages:
            session.add(pkg)
        
        await session.commit()

    print(" Migration completed successfully!")
    print("\nNext steps:")
    print("1. Set up Google OAuth credentials in .env (optional):")
    print("   GOOGLE_CLIENT_ID=your-client-id")
    print("   GOOGLE_CLIENT_SECRET=your-client-secret")
    print("   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback")
    print("\n2. Dependencies installed: httpx PyJWT")
    print("\n3. Start the backend server: ./run-backend.sh")


if __name__ == "__main__":
    asyncio.run(migrate())
