# AWS Amplify Frontend Migration Guide

## 🎯 Migration Overview

This guide covers migrating **only the React frontend** (`web-react-ts`) from Netlify to AWS Amplify, while keeping the GraphQL API on Netlify.

### Architecture After Migration

- **Frontend**: AWS Amplify (React + Vite + TypeScript)
- **API**: Netlify Functions (GraphQL + Neo4j)
- **Database**: Neo4j (unchanged)
- **Auth**: Auth0 (unchanged)

---

## 📋 Pre-Migration Checklist

- [ ] AWS Account with Amplify access
- [ ] Repository access (GitHub/GitLab)
- [ ] All environment variables documented
- [ ] Doppler CLI configured locally
- [ ] Test the frontend build locally: `npm run build:frontend`
- [ ] Verify API CORS allows Amplify domain

---

## 🚀 Step-by-Step Deployment

### 1. Create Amplify App via AWS Console

1. Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **New app** → **Host web app**
3. **Connect repository**:
   - Provider: GitHub
   - Repository: `firstlovecenter/fl-admin-portal`
   - Branch: `dev` (or your production branch)
4. Click **Next**

### 2. Configure Build Settings

Amplify will auto-detect the `amplify.yml` file in your repository root. Review the settings:

```yaml
Build command: Automatically configured via amplify.yml
Output directory: web-react-ts/dist
```

Click **Next**

### 3. Review and Create

Review settings and click **Save and deploy**

The first build will fail until you add environment variables (next step).

---

## 🔐 Configure Environment Variables

### ⚠️ IMPORTANT: Using AWS Secrets Manager

**All environment variables are stored in AWS Secrets Manager, not directly in Amplify Console.**

This provides:

- ✅ Centralized secret management
- ✅ No need to manually configure 20+ variables
- ✅ Automatic secret rotation
- ✅ Better security and audit logging

### Step 1: Create Secret in AWS Secrets Manager

1. Go to **AWS Secrets Manager Console**: https://console.aws.amazon.com/secretsmanager
2. Click **Store a new secret**
3. Select **Other type of secret**
4. Select **Plaintext** tab
5. Paste this JSON (update with your actual values):

```json
{
  "VITE_GRAPHQL_URI": "https://flcadmin.netlify.app/.netlify/functions/graphql",
  "VITE_AUTH0_DOMAIN": "your-domain.auth0.com",
  "VITE_AUTH0_CLIENT_ID": "your_client_id",
  "VITE_AUTH0_AUDIENCE": "your_audience",
  "VITE_CLOUDINARY_MEMBERS": "cloudinary_members_preset",
  "VITE_CLOUDINARY_TREASURERS": "cloudinary_treasurers_preset",
  "VITE_CLOUDINARY_SERVICES": "cloudinary_services_preset",
  "VITE_CLOUDINARY_BUSSING": "cloudinary_bussing_preset",
  "VITE_CLOUDINARY_BANKING": "cloudinary_banking_preset",
  "VITE_CLOUDINARY_BUS_MOBILISATION": "cloudinary_bus_mobilisation_preset",
  "VITE_WHATSAPP_REG": "https://wa.me/your_link",
  "VITE_GOOGLE_MAPS_API_KEY": "your_google_maps_key",
  "VITE_SYNAGO_GRAPHQL_URI": "https://synago-endpoint",
  "AWS_REGION": "us-east-1",
  "AWS_ACCESS_KEY_ID": "AKIAXXXXXXXXXXXXXXXX",
  "AWS_SECRET_ACCESS_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "AWS_S3_BUCKET_NAME": "your-bucket",
  "SENTRY_AUTH_TOKEN": "your_sentry_token",
  "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx"
}
```

6. Click **Next**
7. **Secret name**: `fl-admin-portal/main` (or `fl-admin-portal/${YOUR_BRANCH_NAME}`)
8. Click **Next** → **Next** → **Store**

### Step 2: Grant Amplify Access to Secrets

1. Go to **AWS Amplify Console** → Your App
2. Go to **App settings** → **General**
3. Note the **Service role** name (e.g., `amplifyconsole-backend-role`)
4. Go to **IAM Console** → **Roles** → Find the role
5. Click **Add permissions** → **Create inline policy**
6. Select **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
    }
  ]
}
```

7. Name it: `SecretsManagerAccess`
8. Click **Create policy**

### Step 3: Verify Configuration

The `amplify.yml` is already configured to automatically fetch secrets during build:

```yaml
preBuild:
  commands:
    # Fetch secrets from AWS Secrets Manager
    - aws secretsmanager get-secret-value --secret-id fl-admin-portal/${AWS_BRANCH} > /tmp/secrets.json
    # Extract VITE_ variables and create .env
    - python3 -c "import json; secrets = json.load(open('/tmp/secrets.json')); vite_vars = {k:v for k,v in secrets.items() if k.startswith('VITE_')}; open('web-react-ts/.env','w').write('\n'.join([f'{k}={v}' for k,v in vite_vars.items()]))"
```

**No manual configuration needed in Amplify Console!**

---

## 🔄 Configure API CORS

Update your Netlify API to allow requests from Amplify:

### In `api/src/index.js`:

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers: neoSchema.resolvers,
  context: ({ event }) => {
    // ... existing context code
  },
  cors: {
    origin: [
      'https://main.your-amplify-id.amplifyapp.com', // Replace with your Amplify URL
      'https://flcadmin.netlify.app',
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
```

Deploy the API changes to Netlify:

```bash
git add api/src/index.js
git commit -m "chore: add Amplify domain to CORS"
git push origin deploy
```

---

## 🌐 Configure SPA Routing (Redirects)

### In Amplify Console:

1. Go to **App settings** → **Rewrites and redirects**
2. Add the following rule:

| Source address | Target address | Type          |
| -------------- | -------------- | ------------- |
| `/<*>`         | `/index.html`  | 200 (Rewrite) |

---

## 🎨 Custom Domain Setup (Optional)

### Add Custom Domain:

1. Go to **App settings** → **Domain management**
2. Click **Add domain**
3. Enter your domain: `admin.firstlovechurch.org`
4. Amplify will provide DNS records:
   - **CNAME** record for subdomains
   - **ANAME/ALIAS** record for root domains
5. Add these records to your DNS provider
6. Wait for DNS propagation (~15-30 minutes)
7. SSL certificate auto-provisioned by AWS Certificate Manager

---

## 🧪 Testing Deployment

### 1. Check Build Logs

- Go to **Amplify Console** → **Build history**
- Verify build succeeds without errors

### 2. Test Frontend

- Open the Amplify URL: `https://main.your-amplify-id.amplifyapp.com`
- Test authentication (Auth0 login)
- Verify GraphQL queries work
- Check all routes (use React Router navigation)

### 3. Monitor Network Requests

- Open browser DevTools → Network tab
- Verify API calls go to `https://flcadmin.netlify.app/.netlify/functions/graphql`
- Check for CORS errors

---

## 📊 Performance Optimization

### Enable Build Cache

Already configured in `amplify.yml`:

```yaml
cache:
  paths:
    - node_modules/**/*
    - web-react-ts/node_modules/**/*
```

### Enable Compression

Amplify automatically enables Gzip/Brotli compression.

### CDN Distribution

Amplify uses CloudFront CDN for global distribution.

---

## 💰 Cost Estimation

### AWS Amplify Pricing (as of 2026):

- **Build minutes**: $0.01/minute
  - Average build: ~3-5 minutes = **$0.03-$0.05 per build**
- **Hosting**: Free tier includes:
  - 15 GB served per month
  - 5 GB storage
- **Data transfer**: $0.15/GB after free tier

### Monthly Estimate:

- 30 builds/month: ~$1.50
- Hosting (under free tier): $0
- **Total: ~$1.50-$5/month**

---

## 🔧 Troubleshooting

### Build Fails with "Module not found"

**Solution**: Ensure all dependencies are in `web-react-ts/package.json`, not just root `package.json`.

### Build Fails with "401 Unauthorized" for @jaedag/admin-portal-types

**Cause**: Missing GitHub token for private package.

**Solution**:

1. Create GitHub Personal Access Token at https://github.com/settings/tokens
2. Select scope: `read:packages`
3. Add to Amplify environment variables as `GITHUB_TOKEN`
4. Redeploy

The `.npmrc` file automatically configures authentication during build.

### Environment Variables Not Applied

**Solution**: Redeploy after adding variables. Variables are only injected during build.

### CORS Errors

**Solution**: Add your Amplify domain to the API CORS whitelist (see above).

### 404 on Page Refresh

**Solution**: Configure SPA redirects (see "Configure SPA Routing").

### Blank Page After Deployment

**Solution**: Check browser console for errors. Verify `VITE_GRAPHQL_URI` is set correctly.

---

## 🔄 CI/CD Workflow

Amplify auto-deploys on every push to your connected branch:

```
git push origin dev
  ↓
Amplify detects push
  ↓
Runs amplify.yml build
  ↓
Deploys to CloudFront CDN
  ↓
Live in ~5-7 minutes
```

### Branch-Based Deployments:

- **Production**: `main` or `deploy` branch
- **Staging**: `develop` branch
- **Feature branches**: Auto-create preview URLs

---

## 📦 Rollback Strategy

### Instant Rollback:

1. Go to **Amplify Console** → **Build history**
2. Find the last working build
3. Click **Redeploy this version**

### Git Rollback:

```bash
git revert <commit-hash>
git push origin dev
```

---

## 🚦 Migration Phases

### Phase 1: Testing (Current)

- Deploy to Amplify preview environment
- Test all functionality
- Monitor for issues

### Phase 2: Parallel Running

- Keep Netlify deployment active
- Run Amplify alongside
- A/B test with subset of users

### Phase 3: Full Migration

- Update DNS to point to Amplify
- Deprecate Netlify frontend deployment
- Keep Netlify API active

### Phase 4: Optimization

- Monitor performance metrics
- Optimize build times
- Fine-tune caching

---

## 📞 Support & Resources

- **AWS Amplify Docs**: https://docs.amplify.aws
- **Vite Docs**: https://vitejs.dev
- **Repository Issues**: https://github.com/firstlovecenter/fl-admin-portal/issues

---

## ✅ Post-Migration Checklist

- [ ] Build succeeds in Amplify
- [ ] All environment variables configured
- [ ] CORS configured in API
- [ ] SPA redirects working
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Auth0 login works
- [ ] GraphQL queries successful
- [ ] All routes accessible
- [ ] Image uploads work (Cloudinary/S3)
- [ ] Monitoring/logging enabled
- [ ] Team notified of new URL
- [ ] Documentation updated

---

_Last updated: February 6, 2026_
