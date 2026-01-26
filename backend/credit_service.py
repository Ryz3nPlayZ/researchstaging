"""
Credit Service for managing user credits and transactions.

Handles:
- Credit balance checks
- Credit deduction for LLM usage
- Credit purchase tracking (for future Stripe integration)
- Transaction history
- Initial free credit grants
"""
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from database import (
    User, CreditTransaction, CreditPackage,
    CREDIT_PACKAGES, calculate_credit_cost, get_optimal_provider
)

logger = logging.getLogger(__name__)


# Initial free credit grant for new users
INITIAL_FREE_CREDITS = 1000  # 1K free credits to explore


class CreditService:
    """Service for managing user credits and transactions."""

    async def get_user_credits(self, db: AsyncSession, user_id: str) -> Dict[str, float]:
        """
        Get user's credit balance.

        Returns:
            Dict with credits_remaining, credits_purchased, credits_used
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User not found: {user_id}")

        return {
            "credits_remaining": round(user.credits_remaining, 2),
            "credits_purchased": round(user.credits_purchased, 2),
            "credits_used": round(user.credits_used, 2),
        }

    async def check_credits(
        self,
        db: AsyncSession,
        user_id: str,
        estimated_cost: float
    ) -> bool:
        """
        Check if user has sufficient credits.

        Returns:
            True if user has enough credits, False otherwise
        """
        credits = await self.get_user_credits(db, user_id)
        return credits["credits_remaining"] >= estimated_cost

    async def consume_credits(
        self,
        db: AsyncSession,
        user_id: str,
        provider: str,
        model: str,
        tokens_used: int,
        project_id: Optional[str] = None,
        task_id: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Consume credits for an LLM call.

        Args:
            db: Database session
            user_id: User consuming credits
            provider: LLM provider (openai, gemini, etc.)
            model: Model used
            tokens_used: Number of tokens consumed
            project_id: Optional project ID
            task_id: Optional task ID
            description: Optional description

        Returns:
            Dict with credits_consumed, credits_remaining, transaction_id

        Raises:
            ValueError: If insufficient credits
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User not found: {user_id}")

        # Calculate credit cost
        credits_consumed = calculate_credit_cost(
            provider=provider,
            model=model,
            tokens_used=tokens_used,
            target_margin=0.75  # 75% margin
        )

        # Check if user has sufficient credits
        if not user.has_sufficient_credits(credits_consumed):
            logger.warning(
                f"User {user_id} has insufficient credits. "
                f"Required: {credits_consumed}, Available: {user.credits_remaining}"
            )
            raise ValueError(
                f"Insufficient credits. Required: {credits_consumed:.2f}, "
                f"Available: {user.credits_remaining:.2f}"
            )

        # Deduct credits
        success = user.deduct_credits(credits_consumed)
        if not success:
            raise ValueError("Failed to deduct credits")

        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            transaction_type="consumption",
            amount=-credits_consumed,  # Negative for consumption
            project_id=project_id,
            task_id=task_id,
            provider=provider,
            model=model,
            tokens_used=tokens_used,
            credits_per_token=credits_consumed / tokens_used if tokens_used > 0 else 0,
            margin_percent=75.0,
            description=description or f"{provider} {model} LLM call"
        )

        db.add(transaction)
        await db.flush()

        logger.info(
            f"Consumed {credits_consumed:.2f} credits from user {user_id}. "
            f"Provider: {provider}, Model: {model}, Tokens: {tokens_used}"
        )

        return {
            "credits_consumed": round(credits_consumed, 2),
            "credits_remaining": round(user.credits_remaining, 2),
            "transaction_id": transaction.id,
        }

    async def grant_credits(
        self,
        db: AsyncSession,
        user_id: str,
        amount: float,
        transaction_type: str = "grant",
        description: Optional[str] = None,
        stripe_payment_intent_id: Optional[str] = None,
        amount_usd: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Grant/purchase credits for a user.

        Args:
            db: Database session
            user_id: User to receive credits
            amount: Number of credits to grant
            transaction_type: Type of transaction (grant, purchase, refund)
            description: Optional description
            stripe_payment_intent_id: Optional Stripe payment ID
            amount_usd: Optional USD amount for purchases

        Returns:
            Dict with credits_granted, credits_remaining, transaction_id
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User not found: {user_id}")

        # Add credits
        user.add_credits(amount, transaction_type)

        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,  # Positive for grants/purchases
            description=description or f"Credits {transaction_type}",
            stripe_payment_intent_id=stripe_payment_intent_id,
            amount_usd=amount_usd,
        )

        db.add(transaction)
        await db.flush()

        logger.info(
            f"Granted {amount} credits to user {user_id}. "
            f"Type: {transaction_type}, Remaining: {user.credits_remaining:.2f}"
        )

        return {
            "credits_granted": amount,
            "credits_remaining": round(user.credits_remaining, 2),
            "transaction_id": transaction.id,
        }

    async def get_transaction_history(
        self,
        db: AsyncSession,
        user_id: str,
        limit: int = 50,
        transaction_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get credit transaction history for a user.

        Args:
            db: Database session
            user_id: User ID
            limit: Maximum number of transactions to return
            transaction_type: Optional filter by transaction type

        Returns:
            List of transaction dicts
        """
        query = select(CreditTransaction).where(
            CreditTransaction.user_id == user_id
        )

        if transaction_type:
            query = query.where(CreditTransaction.transaction_type == transaction_type)

        query = query.order_by(CreditTransaction.created_at.desc()).limit(limit)

        result = await db.execute(query)
        transactions = result.scalars().all()

        return [
            {
                "id": t.id,
                "transaction_type": t.transaction_type,
                "amount": t.amount,
                "description": t.description,
                "provider": t.provider,
                "model": t.model,
                "tokens_used": t.tokens_used,
                "credits_per_token": t.credits_per_token,
                "project_id": t.project_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ]

    async def get_usage_stats(
        self,
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get usage statistics for a user.

        Returns:
            Dict with usage by provider, model, project, etc.
        """
        # Get total usage by provider
        provider_result = await db.execute(
            select(
                CreditTransaction.provider,
                func.sum(CreditTransaction.amount).label("total_credits"),
                func.sum(CreditTransaction.tokens_used).label("total_tokens"),
            )
            .where(
                CreditTransaction.user_id == user_id,
                CreditTransaction.transaction_type == "consumption"
            )
            .group_by(CreditTransaction.provider)
        )
        provider_stats = {
            row.provider: {
                "credits_consumed": abs(float(row.total_credits or 0)),
                "tokens_used": int(row.total_tokens or 0),
            }
            for row in provider_result.all()
        }

        # Get total usage by model
        model_result = await db.execute(
            select(
                CreditTransaction.model,
                func.sum(CreditTransaction.amount).label("total_credits"),
                func.count(CreditTransaction.id).label("call_count"),
            )
            .where(
                CreditTransaction.user_id == user_id,
                CreditTransaction.transaction_type == "consumption"
            )
            .group_by(CreditTransaction.model)
        )
        model_stats = {
            row.model: {
                "credits_consumed": abs(float(row.total_credits or 0)),
                "call_count": int(row.call_count or 0),
            }
            for row in model_result.all()
        }

        # Get usage by project
        project_result = await db.execute(
            select(
                CreditTransaction.project_id,
                func.sum(CreditTransaction.amount).label("total_credits"),
                func.count(CreditTransaction.id).label("call_count"),
            )
            .where(
                CreditTransaction.user_id == user_id,
                CreditTransaction.transaction_type == "consumption",
                CreditTransaction.project_id.isnot(None)
            )
            .group_by(CreditTransaction.project_id)
        )
        project_stats = {
            row.project_id: {
                "credits_consumed": abs(float(row.total_credits or 0)),
                "call_count": int(row.call_count or 0),
            }
            for row in project_result.all()
        }

        return {
            "by_provider": provider_stats,
            "by_model": model_stats,
            "by_project": project_stats,
        }

    async def get_credit_packages(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Get available credit packages for purchase.

        Returns:
            List of credit package dicts
        """
        # For now, return static packages
        # In the future, fetch from CreditPackage table
        return CREDIT_PACKAGES


# Singleton instance
credit_service = CreditService()
