# Credit System Implementation Summary

## What's Been Implemented

### 1. **Database Models** (`backend/database/credit_models.py`)

#### User Model
- Google OAuth authentication (google_id, email, name, picture_url)
- Credit tracking (credits_remaining, credits_purchased, credits_used)
- Subscription tracking (subscription_tier, stripe_customer_id)
- Methods: `has_sufficient_credits()`, `deduct_credits()`, `add_credits()`

#### CreditTransaction Model
- Transaction history for all credit operations
- Tracks: consumption, purchases, grants, refunds
- Links to projects/tasks for usage tracking
- Stores provider, model, tokens_used for LLM calls
- Payment metadata (stripe_payment_intent_id, amount_usd)

#### CreditPackage Model
- Predefined credit packages for purchase
- Stripe price_id integration
- Active/display order for frontend

### 2. **Credit Service** (`backend/credit_service.py`)

Functions:
- `get_user_credits()` - Get user's credit balance
- `check_credits()` - Check if user has sufficient credits
- `consume_credits()` - Deduct credits for LLM usage
- `grant_credits()` - Grant/purchase credits
- `get_transaction_history()` - Get transaction history
- `get_usage_stats()` - Get usage by provider/model/project
- `get_credit_packages()` - Get available packages

### 3. **Authentication Service** (`backend/auth_service.py`)

Google OAuth flow:
- `get_google_auth_url()` - Generate OAuth URL
- `exchange_code_for_tokens()` - Exchange code for access token
- `get_google_user_info()` - Get user info from Google
- `authenticate_user()` - Complete OAuth flow, create user, grant initial free credits
- `_generate_jwt_token()` - Generate JWT token
- `verify_jwt_token()` - Verify JWT token
- `get_current_user()` - Get user from JWT token

### 4. **LLM Service Updates** (`backend/llm_service.py`)

Changed `generate()` to return dict with:
- `text` - Generated text
- `provider` - Provider used
- `model` - Model used
- `tokens_used` - Total tokens consumed

Updated all provider methods:
- `_generate_openai()` - Returns usage from OpenAI API
- `_generate_gemini()` - Estimates tokens (1 token ≈ 4 chars)
- `_generate_mistral()` - Returns usage if available
- `_generate_groq()` - Returns usage from Groq API
- `_generate_openrouter()` - Returns usage from OpenRouter API

### 5. **API Endpoints** (`backend/server.py`)

#### Authentication Endpoints
- `POST /api/auth/google` - Authenticate with Google OAuth code
- `GET /api/auth/me` - Get current user from JWT token
- `GET /api/auth/url` - Get Google OAuth URL

#### Credit Endpoints
- `GET /api/credits/balance` - Get user's credit balance
- `GET /api/credits/history` - Get transaction history
- `GET /api/credits/stats` - Get usage statistics
- `GET /api/credits/packages` - Get available credit packages

### 6. **Credit Pricing** (`backend/database/credit_models.py`)

Provider costs per 1K tokens:
- OpenAI GPT-4.1-mini: $0.002
- OpenAI GPT-4o: $0.005
- Gemini 2.5 Flash: $0.0004
- Mistral Large 3: $0.008
- Groq Llama 3.3 70B: $0.001

Credit packages:
- Starter: 10,000 credits for $10
- Professional: 100,000 credits for $79
- Enterprise: 1,000,000 credits for $499

Target margin: 75% (can be 60-90% depending on provider)

### 7. **Database Migration** (`backend/scripts/migrate_add_credits.py`)

Script to add:
- `users` table
- `credit_transactions` table
- `credit_packages` table with default packages

---

## How It Works

### User Authentication Flow

1. User clicks "Sign in with Google" on frontend
2. Frontend calls `GET /api/auth/url` to get OAuth URL
3. User authorizes on Google, redirected with code
4. Frontend sends code to `POST /api/auth/google`
5. Backend:
   - Exchanges code for access token
   - Gets user info from Google
   - Creates or updates user
   - Grants 1,000 free credits if new user
   - Returns JWT token + user info
6. Frontend stores token, sends in `Authorization: Bearer <token>` header

### Credit Consumption Flow

1. Task executor calls LLM service
2. LLM service returns `{text, provider, model, tokens_used}`
3. Task executor calls `credit_service.consume_credits()`:
   - Checks if user has sufficient credits
   - Deducts credits
   - Creates transaction record
   - Returns credits consumed
4. If insufficient credits, raises error

### Credit Tracking

- Every LLM call tracked with: provider, model, tokens_used, project_id, task_id
- Users can see usage by provider, model, project
- Transaction history shows all credit operations

---

## Environment Variables Needed

Add to `.env`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# JWT Secret (change in production!)
JWT_SECRET_KEY=your-secret-key-here
```

## Dependencies Needed

```bash
pip install httpx PyJWT
```

## Next Steps

### Required Before Using:

1. **Run migration**:
   ```bash
   python backend/scripts/migrate_add_credits.py
   ```

2. **Install dependencies**:
   ```bash
   pip install httpx PyJWT
   ```

3. **Set up Google OAuth**:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI
   - Copy to .env

4. **Update task executor** to consume credits:
   - Wrap LLM calls with credit consumption
   - Handle insufficient credits error

### For Production (Stripe Integration):

1. Create Stripe products and prices
2. Update credit_packages table with real Stripe price IDs
3. Implement webhook handler for payment confirmation
4. Add `/api/credits/purchase` endpoint to create Stripe checkout session

### For Frontend:

1. Add authentication flow (Google OAuth)
2. Display credits in sidebar/top-right
3. Show low credit warnings
4. Add "Buy Credits" button (opens Stripe checkout)
5. Show usage stats in settings
6. Add "Edit Mode" toggle for artifacts
7. Update all LLM calls to handle new response format

---

## Notes

- **JWT tokens** expire after 7 days
- **Initial free credits**: 1,000 for new users
- **Credit calculation**: 1 credit ≈ 1,000 tokens at base pricing
- **Auto provider selection**: Optimizes for cost + effectiveness
- **Token tracking**: Essential for accurate credit billing
- **Error handling**: Insufficient credits raises `ValueError`
- **Margin target**: 75% (configurable via `target_margin` parameter)
