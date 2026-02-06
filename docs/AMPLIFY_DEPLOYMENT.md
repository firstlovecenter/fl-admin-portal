# AWS Amplify Deployment Guide

## Overview

This guide covers deploying the **React frontend** to AWS Amplify while keeping the GraphQL API on Netlify.

- **Frontend**: AWS Amplify (React + Vite + TypeScript)
- **API**: Netlify Functions (GraphQL + Neo4j)
- **Database**: Neo4j (unchanged)
- **Auth**: Auth0 (unchanged)

---

## Pre-Deployment Checklist

- [ ] AWS Account with Amplify access
- [ ] Repository access (GitHub)
- [ ] Test build locally: `npm run build`
- [ ] Verify API CORS allows Amplify domain

---

## Setup Steps

### 1. Create Amplify App

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **New app** → **Host web app** → **GitHub**
3. Select repository: `firstlovecenter/fl-admin-portal`
4. Select branch: `dev` (or production branch)
5. Click **Next**

Amplify auto-detects `amplify.yml` configuration. Click **Save and deploy** to continue.

**Note**: First build will fail until you configure secrets (Step 2).

---

### 2. Configure AWS Secrets Manager

#### 2a. Create Secret

1. Go to [AWS Secrets Manager](https://console.aws.amazon.com/secretsmanager)
2. Click **Store a new secret** → **Other type of secret** → **Plaintext**
3. Paste this JSON template with your values:

```json
{
  "VITE_GRAPHQL_URI": "https://flcadmin.netlify.app/.netlify/functions/graphql",
  "VITE_AUTH0_DOMAIN": "your-domain.auth0.com",
  "VITE_AUTH0_CLIENT_ID": "your_client_id",
  "VITE_AUTH0_AUDIENCE": "your_audience",
  "VITE_CLOUDINARY_MEMBERS": "cloudinary_preset",
  "VITE_CLOUDINARY_TREASURERS": "cloudinary_preset",
  "VITE_CLOUDINARY_SERVICES": "cloudinary_preset",
  "VITE_CLOUDINARY_BUSSING": "cloudinary_preset",
  "VITE_CLOUDINARY_BANKING": "cloudinary_preset",
  "VITE_CLOUDINARY_BUS_MOBILISATION": "cloudinary_preset",
  "VITE_WHATSAPP_REG": "https://wa.me/your_link",
  "VITE_GOOGLE_MAPS_API_KEY": "your_google_maps_key",
  "VITE_SYNAGO_GRAPHQL_URI": "https://synago-endpoint",
  "SENTRY_AUTH_TOKEN": "your_sentry_token",
  "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
}
```

4. Click **Next**
5. Enter secret name (must match `amplify.yml`): e.g., `fl-admin-portal/main`
6. Click **Store**

#### 2b. Grant Amplify Permission

1. Go to **Amplify Console** → Your app → **App settings** → **General**
2. Note your **Service role** (e.g., `amplifyconsole-backend-role`)
3. Go to **IAM Console** → **Roles** → Find your role
4. Click **Add permissions** → **Create inline policy** → **JSON**
5. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:*"
    }
  ]
}
```

6. Name it: `AmplifySecretsManagerAccess`
7. Click **Create policy**

**Wait 2 minutes** for IAM changes to propagate.

#### 2c. Add GitHub Token

In **Amplify Console** → **Environment variables**, add:

- **Key**: `GITHUB_TOKEN`
- **Value**: Your GitHub Personal Access Token with `read:packages` scope

**How to create GitHub token**:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name it: `AWS Amplify - FL Admin Portal`
4. Check scope: `read:packages` only
5. Generate and copy token immediately

---

### 3. Configure API CORS

Update [api/src/index.js](../api/src/index.js) to allow Amplify domain:

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers: neoSchema.resolvers,
  cors: {
    origin: [
      'https://main.your-amplify-id.amplifyapp.com',
      'https://flcadmin.netlify.app',
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
```

Deploy to Netlify:

```bash
git add api/src/index.js
git commit -m "chore: add Amplify domain to CORS"
git push origin deploy
```

---

### 4. Configure SPA Routing

In **Amplify Console** → **App settings** → **Rewrites and redirects**:

| Source | Target        | Type          |
| ------ | ------------- | ------------- |
| `/<*>` | `/index.html` | 200 (Rewrite) |

---

### 5. Test Deployment

1. Run build: **Amplify Console** → **Run build**
2. Check logs for errors in **Build history**
3. Open deployed URL and verify:
   - [ ] Auth0 login works
   - [ ] GraphQL queries execute
   - [ ] All routes accessible
   - [ ] No CORS errors in DevTools

---

## How It Works

### Build Process

1. **preBuild**: Fetch secrets from AWS Secrets Manager
2. **preBuild**: Create `.npmrc` for GitHub Packages authentication
3. **build**: Compile React with Vite
4. **deploy**: CloudFront CDN distribution

### Secret Injection

`amplify.yml` automatically:

1. Fetches secret using secret name in config (matches `${AWS_BRANCH}`)
2. Extracts all `VITE_*` variables
3. Creates `.env` file for Vite build
4. Vite injects into `index.html` at build time

---

## Custom Domain (Optional)

1. **Amplify Console** → **App settings** → **Domain management**
2. Click **Add domain** → Enter your domain
3. Add DNS records provided by Amplify to your DNS provider
4. SSL certificate auto-provisioned by AWS Certificate Manager
5. Wait 15-30 minutes for DNS propagation

---

## Troubleshooting

| Error                                                 | Cause                             | Solution                                |
| ----------------------------------------------------- | --------------------------------- | --------------------------------------- |
| **Build fails: "AccessDeniedException"**              | Missing IAM policy                | Add policy (Step 2b), wait 2 min, retry |
| **"401 Unauthorized" for @jaedag/admin-portal-types** | Missing GitHub token              | Add `GITHUB_TOKEN` env var (Step 2c)    |
| **"SecretNotFoundException"**                         | Secret name doesn't match config  | Update secret name in `amplify.yml`     |
| **CORS errors in browser**                            | API doesn't allow Amplify domain  | Update CORS (Step 3) and redeploy API   |
| **404 on page refresh**                               | SPA routing not configured        | Add redirect rule (Step 4)              |
| **Blank page**                                        | Environment variables not applied | Redeploy after adding variables         |

---

## Performance

- **Build cache**: Caches `node_modules/` between builds
- **CDN**: CloudFront global distribution
- **Compression**: Gzip/Brotli auto-enabled
- **Average build**: ~3-5 minutes

---

## Costs

- **Build**: $0.01/minute (~$0.03-$0.05 per build)
- **Hosting**: Free tier (15 GB/month, 5 GB storage)
- **Data transfer**: $0.15/GB (after free tier)
- **Secrets Manager**: $0.40/secret/month + $0.05 per 10k API calls
- **Monthly estimate**: ~$1.50-$5

---

## CI/CD Workflow

Amplify auto-deploys on every push to connected branch:

```
git push origin dev
  ↓
Amplify detects push
  ↓
Runs amplify.yml
  ↓
Deploys to CDN
  ↓
Live in ~5-7 minutes
```

---

## Rollback

1. **Amplify Console** → **Build history**
2. Find last working build
3. Click **Redeploy this version**

Or via Git:

```bash
git revert <commit-hash>
git push origin dev
```

---

## Related Files

- [amplify.yml](../amplify.yml) - Build configuration
- [api/src/index.js](../api/src/index.js) - CORS configuration
- [web-react-ts/.env.example](../web-react-ts/.env.example) - Environment variables template

---

**Last Updated**: February 6, 2026
