"""
User and Credit Models for Research Pilot.

Adds user authentication (Google OAuth) and credit tracking system.
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
import enum

from .models import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    """
    User account with Google OAuth authentication and credit tracking.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)

    # Authentication (Google OAuth)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    picture_url = Column(String(500), nullable=True)

    # Credit System
    credits_remaining = Column(Float, default=0, nullable=False)
    credits_purchased = Column(Float, default=0, nullable=False)  # Total credits purchased
    credits_used = Column(Float, default=0, nullable=False)  # Total credits consumed

    # Subscription (for future Stripe integration)
    subscription_tier = Column(String(50), default="free")  # free, pro, enterprise
    subscription_status = Column(String(50), default="active")  # active, cancelled, past_due
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    credit_transactions = relationship(
        "CreditTransaction",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(CreditTransaction.created_at)"
    )

    __table_args__ = (
        Index("idx_users_google_id", "google_id"),
        Index("idx_users_email", "email"),
    )

    def has_sufficient_credits(self, amount: float) -> bool:
        """Check if user has sufficient credits."""
        return self.credits_remaining >= amount

    def deduct_credits(self, amount: float) -> bool:
        """
        Deduct credits from user's balance.

        Returns True if successful, False if insufficient credits.
        """
        if not self.has_sufficient_credits(amount):
            return False

        self.credits_remaining -= amount
        self.credits_used += amount
        return True

    def add_credits(self, amount: float, transaction_type: str = "purchase") -> None:
        """Add credits to user's balance."""
        self.credits_remaining += amount
        self.credits_purchased += amount

        # Create transaction record (requires session)
        # This is handled in the service layer


class CreditTransaction(Base):
    """
    Credit transaction history for auditing and billing.
    Tracks all credit additions and consumptions.
    """
    __tablename__ = "credit_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Transaction details
    transaction_type = Column(String(50), nullable=False)  # purchase, grant, consumption, refund
    amount = Column(Float, nullable=False)  # Positive for grants/purchases, negative for consumption

    # Context
    project_id = Column(String(36), nullable=True)  # If consumed by a project
    task_id = Column(String(36), nullable=True)  # If consumed by a specific task
    provider = Column(String(50), nullable=True)  # openai, gemini, mistral, groq
    model = Column(String(100), nullable=True)  # gpt-4.1-mini, gemini-2.5-flash, etc.
    tokens_used = Column(Integer, nullable=True)

    # Pricing metadata
    credits_per_token = Column(Float, nullable=True)  # Credit cost per token
    margin_percent = Column(Float, nullable=True)  # Profit margin (0-100)

    # Payment metadata (for purchases)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    stripe_invoice_id = Column(String(255), nullable=True)
    amount_usd = Column(Float, nullable=True)  # USD amount for purchases

    # Description
    description = Column(String(500), nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="credit_transactions")

    __table_args__ = (
        Index("idx_credit_transactions_user_id", "user_id"),
        Index("idx_credit_transactions_created_at", "created_at"),
        Index("idx_credit_transactions_type", "transaction_type"),
    )


class CreditPackage(Base):
    """
    Predefined credit packages for purchase.
    Used for Stripe checkout configuration.
    """
    __tablename__ = "credit_packages"

    id = Column(String(36), primary_key=True, default=generate_uuid)

    # Package details
    name = Column(String(100), nullable=False)  # "Starter", "Professional", "Enterprise"
    credits_amount = Column(Integer, nullable=False)  # Number of credits
    price_usd = Column(Float, nullable=False)  # Price in USD

    # Stripe configuration
    stripe_price_id = Column(String(255), nullable=False, unique=True)  # Stripe Price ID
    active = Column(Boolean, default=True, nullable=False)

    # Display order
    display_order = Column(Integer, default=0, nullable=False)

    # Metadata
    description = Column(String(500), nullable=True)
    features = Column(JSON, default=list)  # ["X projects", "Priority support", etc.]

    __table_args__ = (
        Index("idx_credit_packages_active", "active"),
    )


# Credit pricing configuration
# Based on 60-90% margin target

# Provider cost per 1K tokens (input + output averaged)
PROVIDER_COSTS = {
    "openai": {
        "gpt-4.1-mini": 0.002,      # ~$2 per 1M tokens
        "gpt-4o": 0.005,             # ~$5 per 1M tokens
        "o1": 0.03,                  # ~$30 per 1M tokens
    },
    "gemini": {
        "gemini-2.5-flash": 0.0004,  # ~$0.40 per 1M tokens
        "gemini-2.5-flash-lite": 0.00015,  # ~$0.15 per 1M tokens
    },
    "mistral": {
        "mistral-large-3": 0.008,    # ~$8 per 1M tokens
    },
    "groq": {
        "llama-3.3-70b": 0.001,      # ~$1 per 1M tokens
        "mixtral-8x7b": 0.0004,      # ~$0.40 per 1M tokens
    },
    "openrouter": {
        "meta-llama/llama-3.3-70b": 0.001,
    }
}

# Credit pricing: 1 credit = 1000 tokens
# User pays $X for credits, we pay provider costs
# Target: 60-90% margin

# Example pricing tiers:
# $10 for 10,000 credits = $0.001 per credit
# Provider cost: $0.0004 per 1K tokens (Gemini Flash)
# Our cost: $0.0004 per credit (1 credit = 1K tokens)
# Margin: ($0.001 - $0.0004) / $0.001 = 60%

CREDIT_PACKAGES = [
    {
        "name": "Starter",
        "credits": 10000,
        "price_usd": 10.0,
        "description": "Perfect for exploring the platform",
        "features": ["10,000 credits", "Email support"],
        "display_order": 1,
    },
    {
        "name": "Professional",
        "credits": 100000,
        "price_usd": 79.0,
        "description": "For serious researchers",
        "features": ["100,000 credits", "Priority support", "Advanced features"],
        "display_order": 2,
    },
    {
        "name": "Enterprise",
        "credits": 1000000,
        "price_usd": 499.0,
        "description": "For research teams and heavy usage",
        "features": ["1,000,000 credits", "Dedicated support", "Custom integrations", "Team features"],
        "display_order": 3,
    },
]

# Auto provider selection (cost + effectiveness optimization)
AUTO_PROVIDER_ORDER = [
    "gemini",      # Best value (fast, cheap)
    "groq",        # Good value (very fast, cheap)
    "openai",      # Best quality (expensive but excellent)
    "mistral",     # Good quality mid-range
    "openrouter",  # Fallback
]


def calculate_credit_cost(
    provider: str,
    model: str,
    tokens_used: int,
    target_margin: float = 0.75  # 75% margin default
) -> float:
    """
    Calculate credit cost for an LLM call.

    Args:
        provider: LLM provider (openai, gemini, etc.)
        model: Model name
        tokens_used: Number of tokens consumed
        target_margin: Target profit margin (0-1, default 0.75 = 75%)

    Returns:
        Credits consumed (float)
    """
    # Get provider cost per 1K tokens
    provider_costs = PROVIDER_COSTS.get(provider, {})
    cost_per_1k = provider_costs.get(model, 0.001)  # Default to $0.001 per 1K

    # Calculate our cost in USD
    our_cost_usd = (tokens_used / 1000) * cost_per_1k

    # Calculate price to user with target margin
    # margin = (price - cost) / price
    # price = cost / (1 - margin)
    price_to_user_usd = our_cost_usd / (1 - target_margin)

    # Convert USD to credits (1 credit = $0.001 default, or $0.00079 for Professional tier)
    # For simplicity: 1 credit = 1000 tokens at base pricing
    # $0.001 per credit = 1 credit per 1K tokens at $1 per 1M

    # Price per credit in USD: $0.001 (1 credit = 1K tokens at $1/1M)
    usd_per_credit = 0.001

    credits_needed = price_to_user_usd / usd_per_credit

    return round(credits_needed, 2)


def get_optimal_provider(
    required_quality: str = "standard",
    available_providers: list = None
) -> tuple[str, str]:
    """
    Get the optimal provider for cost-effectiveness.

    Args:
        required_quality: "fast" (speed), "standard" (balanced), "high" (quality)
        available_providers: List of available providers

    Returns:
        (provider, model) tuple
    """
    if available_providers is None:
        available_providers = AUTO_PROVIDER_ORDER

    if required_quality == "fast":
        # Prioritize speed (Groq, Gemini Flash)
        for provider in ["groq", "gemini", "openai"]:
            if provider in available_providers:
                if provider == "groq":
                    return provider, "llama-3.3-70b"
                elif provider == "gemini":
                    return provider, "gemini-2.5-flash"
                elif provider == "openai":
                    return provider, "gpt-4.1-mini"

    elif required_quality == "high":
        # Prioritize quality (OpenAI GPT-4o, Mistral Large)
        for provider in ["openai", "mistral", "gemini"]:
            if provider in available_providers:
                if provider == "openai":
                    return provider, "gpt-4o"
                elif provider == "mistral":
                    return provider, "mistral-large-3"
                elif provider == "gemini":
                    return provider, "gemini-2.5-flash"

    else:  # standard
        # Balanced cost/quality
        for provider in available_providers:
            if provider == "gemini":
                return provider, "gemini-2.5-flash"
            elif provider == "groq":
                return provider, "llama-3.3-70b"
            elif provider == "openai":
                return provider, "gpt-4.1-mini"

    # Fallback
    return available_providers[0] if available_providers else "openai", "gpt-4.1-mini"
