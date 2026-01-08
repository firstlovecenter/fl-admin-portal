# AWS Amplify Frontend Migration - Quick Start

## What's in This Branch

This branch contains all configuration needed to deploy the React frontend to AWS Amplify while keeping the GraphQL API on Netlify.

### New Files Added:
- **`amplify.yml`** - Amplify build configuration
- **`web-react-ts/.env.example`** - Template for environment variables
- **`docs/AWS_AMPLIFY_MIGRATION.md`** - Comprehensive migration guide

### Modified Files:
- **`package.json`** - Added `build:frontend` and `build:api` scripts

---

## Quick Deploy Steps

### 1. Test Build Locally
```bash
npm install
cd web-react-ts && npm install && cd ..
npm run build:frontend
```

Verify build succeeds and outputs to `web-react-ts/dist/`

### 2. Push to GitHub
```bash
git add .
git commit -m "feat: add AWS Amplify configuration for frontend deployment"
git push origin feature/aws-amplify-frontend-migration
```

### 3. Create Amplify App
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **New app** → **Host web app**
3. Connect to GitHub → Select `fl-admin-portal` repo
4. Select branch: `feature/aws-amplify-frontend-migration`
5. Click **Next** → **Save and deploy**

### 4. Configure Secrets in AWS Secrets Manager

**⚠️ CRITICAL**: Environment variables are stored in **AWS Secrets Manager**, not Amplify Console.

**Quick Setup:**

1. **Create secret** in AWS Secrets Manager:
   - Name: `fl-admin-portal/main` (or your branch name)
   - Type: Other type of secret → Plaintext
   - Content: See `web-react-ts/.env.example` for JSON template

2. **Grant Amplify access**:
   - Find your Amplify service role in IAM
   - Add inline policy allowing `secretsmanager:GetSecretValue`
   - Resource: `arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*`

3. **Verify**: Build will automatically fetch secrets!

**📚 Detailed Guide**: See [docs/AWS_SECRETS_MANAGER.md](docs/AWS_SECRETS_MANAGER.md)

**Alternative (Not Recommended)**: Manual environment variables in Amplify Console

### 5. Update API CORS
Add your Amplify domain to the API CORS whitelist in `api/src/index.js`

### 6. Configure Redirects
In Amplify → **Rewrites and redirects**, add:
- Source: `/<*>`
- Target: `/index.html`
- Type: 200 (Rewrite)

---

## Next Steps

1. Test the deployment on the Amplify URL
2. Verify authentication works
3. Check GraphQL queries
4. Set up custom domain (optional)
5. Monitor build logs and performance

For detailed instructions, see [docs/AWS_AMPLIFY_MIGRATION.md](docs/AWS_AMPLIFY_MIGRATION.md)

---

## Rollback

If you need to revert:
```bash
git checkout deploy  # or your main branch
git branch -D feature/aws-amplify-frontend-migration
```

The Netlify deployment remains unchanged.
