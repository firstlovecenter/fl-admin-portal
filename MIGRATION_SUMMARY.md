# AWS Amplify Frontend Migration - Changes Summary

## ✅ All Changes Implemented

This document summarizes all changes made to configure the project for AWS Amplify frontend deployment while keeping the GraphQL API on Netlify.

---

## 📋 Files Added

### Configuration Files

#### 1. **`amplify.yml`** - Amplify Build Configuration

- Fetches secrets from AWS Secrets Manager
- Runs frontend build with Vite
- Caches `node_modules` at both root and `web-react-ts/` levels
- Output: `web-react-ts/dist/`

#### 2. **`web-react-ts/.env.example`** - Environment Variables Template

- Template for all required VITE\_\* variables
- Auth0, Cloudinary, Google Maps, Sentry
- Instructions for local development

### Documentation Files

#### 3. **`AMPLIFY_README.md`** - Quick Start Guide

- Quick deploy steps
- AWS Secrets Manager setup
- Essential configuration

#### 4. **`docs/AWS_AMPLIFY_MIGRATION.md`** - Comprehensive Migration Guide

- Full step-by-step deployment instructions
- Architecture overview
- CORS configuration
- Testing and troubleshooting
- Cost estimation
- Rollback strategy

#### 5. **`docs/AWS_SECRETS_MANAGER.md`** - Secrets Management Guide

- How secrets are stored and fetched
- IAM permissions setup
- Branch-specific secrets
- Local development setup
- Updating secrets
- Security best practices

#### 6. **`docs/IAM_PERMISSIONS_GUIDE.md`** - IAM Permissions Step-by-Step

- Finding your Amplify service role
- Adding IAM permissions to read Secrets Manager
- Policy breakdown and security best practices
- Troubleshooting permission issues

---

## 📝 Files Modified

### 1. **`netlify.toml`** - Removed Frontend Build

**Before**: Built both API and frontend
**After**: Builds **API only**

Changes:

- Removed `cd ../web-react-ts && npm i && cd ..` from build commands
- Changed `publish` from `web-react-ts/dist` to `api/build`
- Removed SPA redirect rule (`from = "/*"` to `/index.html`)
- Added comments explaining frontend is on Amplify
- Kept GraphQL API redirects

### 2. **`web-react-ts/package.json`** - Added Dependencies

New dependencies:

- `@auth0/auth0-react@^1.11.0` - Auth0 integration
- `@sentry/react@^7.27.0` - Sentry error tracking
- `@sentry/tracing@^7.27.0` - Sentry performance tracking

New devDependencies:

- `@sentry/vite-plugin@^0.7.2` - Sentry Vite integration

### 3. **`web-react-ts/vite.config.ts`** - Conditional Sentry Plugin

**Before**: Always loaded Sentry plugin (fails without token)
**After**: Only loads Sentry plugin if `SENTRY_AUTH_TOKEN` is available

```typescript
...(env.SENTRY_AUTH_TOKEN
  ? [sentryVitePlugin({...})]
  : [])
```

This allows builds to succeed even when Sentry token is missing.

### 4. **`.gitignore`** - Added Amplify Files

Added:

```
# AWS Amplify files
.amplify/
amplify-artifacts.json
```

---

## 🔄 Environment Variable Flow

### In Amplify Build (Production)

1. **preBuild Phase**:

   ```bash
   # Fetch secrets from AWS Secrets Manager
   aws secretsmanager get-secret-value --secret-id fl-admin-portal/${AWS_BRANCH}

   # Extract VITE_* variables
   python3 -c "... parse JSON and create .env ..."
   ```

2. **Build Phase**:

   ```bash
   # .env file available with all VITE_* variables
   npm run build  # Vite reads from .env
   ```

3. **Result**: All VITE*\* variables accessible via `import.meta.env.VITE*\*` in code

### Local Development

Users copy `.env.example` to `.env.local` and fill in values manually.

---

## 🎯 Architecture After Migration

```
┌─────────────────────────────────────────────┐
│                  Users                      │
└─────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────────┐
│            AWS CloudFront CDN                              │
│            (Global content delivery)                       │
└─────────────────────────────────────────────────────────────┘
         ↓                                          ↓
┌────────────────────────────┐    ┌────────────────────────────┐
│  AWS Amplify               │    │  Netlify Functions         │
│  (React Frontend)          │    │  (GraphQL API)             │
│  - web-react-ts/dist       │    │  - Apollo Server           │
│  - CloudFront distribution │    │  - Neo4j driver            │
│  - HTTPS by default        │    │  - All resolvers           │
└────────────────────────────┘    └────────────────────────────┘
                                            ↓
                                  ┌────────────────────────┐
                                  │  Neo4j Database        │
                                  │  (Unchanged)           │
                                  └────────────────────────┘
```

---

## 🔐 Secrets Configuration

### AWS Secrets Manager

**Secret Name Pattern**: `fl-admin-portal/${AWS_BRANCH}`

**Examples**:

- Production: `fl-admin-portal/main`
- Staging: `fl-admin-portal/develop`
- Feature: `fl-admin-portal/feature/aws-amplify-frontend-migration`

**Secret Format**: JSON with all environment variables (VITE\_\* and others)

### Amplify Build Access

**Required IAM Policy**:

```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
}
```

**Add to**: Amplify service role in IAM

---

## 📊 Comparison: Before vs After

| Aspect                    | Before                        | After                                   |
| ------------------------- | ----------------------------- | --------------------------------------- |
| **Frontend Host**         | Netlify (from `netlify.toml`) | AWS Amplify (from `amplify.yml`)        |
| **API Host**              | Netlify Functions             | Netlify Functions (unchanged)           |
| **Secrets Management**    | Doppler (via CLI in Netlify)  | AWS Secrets Manager                     |
| **Build Trigger**         | Git push to GitHub            | Git push to GitHub                      |
| **Deployment Time**       | ~3-5 min                      | ~3-5 min (Amplify) + unchanged API time |
| **CDN**                   | Netlify CDN                   | AWS CloudFront                          |
| **Environment Variables** | Netlify UI or Doppler         | AWS Secrets Manager (JSON)              |

---

## ✅ Next Steps

### 1. Deploy to Amplify

```bash
git add .
git commit -m "feat: configure AWS Amplify frontend deployment with Secrets Manager"
git push origin dev
```

### 2. Create Amplify App

1. Go to AWS Amplify Console
2. Connect repository (fl-admin-portal)
3. Select branch (dev)
4. Amplify will auto-detect `amplify.yml`

### 3. Configure AWS Resources

1. **Create Secrets Manager secret**: `fl-admin-portal/main` with all VITE\_\* variables
2. **Add IAM permission**: Amplify service role can read secrets

### 4. Add CORS to API

Update `api/src/index.js` to allow Amplify domain:

```javascript
cors: {
  origin: [
    'https://main.your-amplify-id.amplifyapp.com',
    'https://flcadmin.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true
}
```

### 5. Configure SPA Routing

In Amplify Console → **Rewrites and redirects**:

- Source: `/<*>`
- Target: `/index.html`
- Type: 200 (Rewrite)

---

## 📚 Documentation Reference

| File                                                           | Purpose                        |
| -------------------------------------------------------------- | ------------------------------ |
| [AMPLIFY_README.md](AMPLIFY_README.md)                         | Quick start guide              |
| [docs/AWS_AMPLIFY_MIGRATION.md](docs/AWS_AMPLIFY_MIGRATION.md) | Full migration guide           |
| [docs/AWS_SECRETS_MANAGER.md](docs/AWS_SECRETS_MANAGER.md)     | Secrets setup and management   |
| [docs/GITHUB_PACKAGES_AUTH.md](docs/GITHUB_PACKAGES_AUTH.md)   | GitHub Packages authentication |
| [docs/IAM_PERMISSIONS_GUIDE.md](docs/IAM_PERMISSIONS_GUIDE.md) | IAM permissions setup          |

---

## 🎓 Key Concepts

### Why AWS Secrets Manager?

- ✅ Centralized secret management (no Doppler CLI needed)
- ✅ Automatic environment variable injection
- ✅ Branch-specific secrets (different values for dev/staging/prod)
- ✅ Better security and audit logging
- ✅ ~$1.25/month cost (very cheap)

### Why Amplify?

- ✅ Global CDN (CloudFront) for faster content delivery
- ✅ Auto-scaling for traffic spikes
- ✅ Branch preview deployments (automatic)
- ✅ Better cost efficiency for static content
- ✅ Tighter AWS integration

### Why Keep API on Netlify?

- ✅ GraphQL API doesn't benefit from CDN caching
- ✅ Existing setup is stable and working
- ✅ Easier gradual migration
- ✅ Less operational complexity

---

## 🚨 Important Notes

1. **Secrets Manager Setup is Critical**: Without AWS Secrets Manager secret and IAM permissions, builds will fail
2. **CORS Configuration**: Must add Amplify domain to API CORS whitelist
3. **Environment Variables are Build-Time**: Not runtime - redeploy to change values
4. **Branch Deployment**: Each branch gets its own preview URL

---

## 📞 Support

If you encounter issues:

1. Check the relevant documentation file (see table above)
2. Review Amplify build logs for exact error
3. Verify AWS Secrets Manager secret exists and is accessible
4. Check IAM permissions are properly configured

---

**Status**: ✅ Implementation Complete  
**Branch**: `dev`  
**Date**: February 6, 2026  
**Ready for Deployment**: Yes
