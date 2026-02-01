"""
Authentication Service for Google OAuth.

Handles:
- Google OAuth flow
- User creation and login
- JWT token generation/validation
- User session management
"""
import logging
import json
import os
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from database import User
from credit_service import credit_service

logger = logging.getLogger(__name__)


# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback")

# JWT configuration (use python-jose if available, otherwise simple implementation)
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days


class AuthService:
    """Service for user authentication with Google OAuth."""

    def __init__(self):
        self.google_client_id = GOOGLE_CLIENT_ID
        self.google_client_secret = GOOGLE_CLIENT_SECRET
        self.redirect_uri = GOOGLE_REDIRECT_URI

    def get_google_auth_url(self, state: Optional[str] = None) -> str:
        """
        Generate Google OAuth authorization URL.

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            Authorization URL
        """
        if not self.google_client_id:
            raise ValueError("GOOGLE_CLIENT_ID not configured")

        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": self.google_client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
        }

        if state:
            params["state"] = state

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query_string}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access tokens.

        Args:
            code: Authorization code from Google OAuth callback

        Returns:
            Dict with access_token, id_token, refresh_token, etc.
        """
        if not self.google_client_secret:
            raise ValueError("GOOGLE_CLIENT_SECRET not configured")

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": self.google_client_id,
            "client_secret": self.google_client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()

    async def get_google_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user info from Google using access token.

        Args:
            access_token: Google OAuth access token

        Returns:
            Dict with user info (id, email, name, picture)
        """
        url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    async def authenticate_user(
        self,
        code: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Authenticate user with Google OAuth code.

        Creates user if doesn't exist, grants initial free credits.

        Args:
            code: Authorization code from Google
            db: Database session

        Returns:
            Dict with user info and JWT token
        """
        # Exchange code for tokens
        tokens = await self.exchange_code_for_tokens(code)
        access_token = tokens.get("access_token")

        if not access_token:
            raise ValueError("Failed to obtain access token from Google")

        # Get user info from Google
        google_user = await self.get_google_user_info(access_token)

        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name")
        picture_url = google_user.get("picture")

        if not google_id or not email:
            raise ValueError("Invalid user data from Google")

        # Find or create user
        result = await db.execute(
            select(User).where(User.google_id == google_id)
        )
        user = result.scalar_one_or_none()

        is_new_user = user is None

        if is_new_user:
            # Check if user exists by email (maybe they signed up with different method)
            result = await db.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()

            if user:
                # Link Google account to existing user
                user.google_id = google_id
                logger.info(f"Linked Google account to existing user {user.id}")
            else:
                # Create new user
                user = User(
                    google_id=google_id,
                    email=email,
                    name=name,
                    picture_url=picture_url,
                    credits_remaining=0,  # Will grant initial credits below
                    credits_purchased=0,
                    credits_used=0,
                )
                db.add(user)
                await db.flush()
                logger.info(f"Created new user {user.id} from Google OAuth")

        # Update user info
        user.name = name
        user.picture_url = picture_url
        user.last_login_at = datetime.now(timezone.utc)

        # Grant initial free credits for new users
        if is_new_user:
            from backend.credit_service import INITIAL_FREE_CREDITS
            await credit_service.grant_credits(
                db=db,
                user_id=user.id,
                amount=INITIAL_FREE_CREDITS,
                transaction_type="grant",
                description="Initial free credits for new user"
            )
            logger.info(f"Granted {INITIAL_FREE_CREDITS} free credits to new user {user.id}")

        await db.commit()
        await db.refresh(user)

        # Generate JWT token
        token = self._generate_jwt_token(user.id)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture_url": user.picture_url,
                "credits_remaining": round(user.credits_remaining, 2),
                "is_new_user": is_new_user,
            },
            "token": token,
        }

    def _generate_jwt_token(self, user_id: str) -> str:
        """
        Generate JWT token for user.

        Args:
            user_id: User ID

        Returns:
            JWT token string
        """
        try:
            import jwt
            payload = {
                "user_id": user_id,
                "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
                "iat": datetime.now(timezone.utc),
            }
            return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        except ImportError:
            # If jwt library not available, use simple base64 encoding
            # WARNING: This is not secure for production
            import base64
            payload = {
                "user_id": user_id,
                "exp": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)).isoformat(),
            }
            return base64.b64encode(json.dumps(payload).encode()).decode()

    def verify_jwt_token(self, token: str) -> Optional[str]:
        """
        Verify JWT token and return user ID.

        Args:
            token: JWT token string

        Returns:
            User ID if valid, None otherwise
        """
        try:
            import jwt
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload.get("user_id")
        except ImportError:
            # Simple base64 decoding (not secure, for development only)
            import base64
            try:
                payload = json.loads(base64.b64decode(token).decode())
                exp = datetime.fromisoformat(payload.get("exp", ""))
                if exp > datetime.now(timezone.utc):
                    return payload.get("user_id")
            except Exception:
                pass
        except Exception as e:
            logger.warning(f"Failed to verify JWT token: {e}")
        return None

    async def mock_authenticate_user(
        self,
        email: str,
        name: Optional[str],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Mock authentication for local development (no OAuth required).

        Creates user if doesn't exist, grants initial free credits.

        Args:
            email: User email
            name: Optional user name
            db: Database session

        Returns:
            Dict with user info and JWT token
        """
        if not email:
            raise ValueError("Email is required")

        # Find or create user by email
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        is_new_user = user is None

        if is_new_user:
            # Create new user
            user = User(
                google_id=None,  # No Google ID for mock auth
                email=email,
                name=name or email.split("@")[0],  # Use email username if no name provided
                picture_url=None,
                credits_remaining=0,  # Will grant initial credits below
                credits_purchased=0,
                credits_used=0,
            )
            db.add(user)
            await db.flush()
            logger.info(f"Created new mock user {user.id} with email {email}")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)

        # Grant initial free credits for new users
        if is_new_user:
            from backend.credit_service import INITIAL_FREE_CREDITS
            await credit_service.grant_credits(
                db=db,
                user_id=user.id,
                amount=INITIAL_FREE_CREDITS,
                transaction_type="grant",
                description="Initial free credits for new user"
            )
            logger.info(f"Granted {INITIAL_FREE_CREDITS} free credits to new user {user.id}")

        await db.commit()
        await db.refresh(user)

        # Generate JWT token
        token = self._generate_jwt_token(user.id)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "picture_url": user.picture_url,
                "credits_remaining": round(user.credits_remaining, 2),
                "is_new_user": is_new_user,
            },
            "token": token,
        }

    async def get_current_user(
        self,
        token: str,
        db: AsyncSession
    ) -> Optional[User]:
        """
        Get current user from JWT token.

        Args:
            token: JWT token
            db: Database session

        Returns:
            User object if valid, None otherwise
        """
        user_id = self.verify_jwt_token(token)
        if not user_id:
            return None

        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()


# Singleton instance
auth_service = AuthService()
