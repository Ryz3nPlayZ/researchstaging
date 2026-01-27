# Security Best Practices

**Last Updated:** 2026-01-26

## Environment Variables

### ✅ Current Setup
- `.gitignore` contains `*.env` pattern (all .env files are ignored)
- `.env.template` provided with example values
- Real API keys in `backend/.env` are NOT tracked by git

### 🔐 Required Actions Before Deployment

1. **Rotate All API Keys**
   - Current keys in `backend/.env` may have been exposed
   - Generate new keys from:
     - OpenAI: https://platform.openai.com/api-keys
     - Google Gemini: https://console.cloud.google.com/apis/credentials
     - Mistral: https://console.mistral.ai/api-keys
     - Groq: https://console.groq.com/keys
     - OpenRouter: https://openrouter.ai/keys

2. **Generate Strong JWT Secret**
   ```bash
   # Generate secure random secret
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
   - Update `JWT_SECRET_KEY` in `backend/.env` with generated value

3. **Verify .env is NOT in Git**
   ```bash
   # Should return nothing
   git ls-files | grep "\.env$"
   ```

### ✅ DO NOT Commit
- `.env` files with real credentials
- Any files containing:
  - API keys
  - Database passwords
  - JWT secrets
  - Private certificates

### ✅ DO Commit
- `.env.template` with example/dummy values
- Documentation like this file

## Authentication & Token Storage

### Current Implementation
- Frontend: Tokens stored in `localStorage` (XSS vulnerable)
- Backend: JWT authentication with Bearer tokens

### Recommended Improvements
1. **Use httpOnly Cookies** for auth tokens (prevents XSS access)
2. **Implement CSRF protection** for cookie-based auth
3. **Add token refresh mechanism** for expired tokens
4. **Handle 401 responses** with automatic re-authentication

## API Security

### Current Setup
- CORS configured via `CORS_ORIGINS` env var
- No rate limiting implemented

### Recommended Improvements
1. **Add Rate Limiting** especially for:
   - `/api/planning/*` endpoints
   - `/api/projects` creation
   - LLM endpoints

2. **CORS Best Practices**
   - Set strict default (not `*`)
   - Validate origin format
   - Document required env vars

## Production Checklist

- [ ] All API keys rotated
- [ ] Strong JWT secret generated
- [ ] `.env` file in `.gitignore`
- [ ] Rate limiting implemented
- - [ ] CORS origins set to production domain only
- [ ] httpOnly cookies for auth tokens
- [ ] HTTPS enforced in production
- [ ] Database credentials not in code
- [ ] Secrets managed via vault/service (AWS Secrets Manager, etc.)

## Development Guidelines

### Local Development
- Use `.env` for local credentials
- Never commit real keys
- Share `.env.template` for setup instructions

### Testing
- Use mock/dummy credentials in test env
- Never use production keys in tests
- Test auth flows with test accounts
