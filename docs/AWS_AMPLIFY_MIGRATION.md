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
   - Branch: `feature/aws-amplify-frontend-migration` (or your production branch)
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

### In AWS Amplify Console:

1. Go to **App settings** → **Environment variables**
2. Add the following variables:

#### Required Frontend Variables

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_GRAPHQL_URI` | GraphQL API endpoint | `https://flcadmin.netlify.app/.netlify/functions/graphql` |
| `VITE_AUTH0_DOMAIN` | Auth0 domain | `your-domain.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Auth0 client ID | `your_client_id` |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience | `https://flcadmin.netlify.app/graphql` |

#### Cloudinary Presets

| Variable Name | Description |
|--------------|-------------|
| `VITE_CLOUDINARY_MEMBERS` | Members upload preset |
| `VITE_CLOUDINARY_TREASURERS` | Treasurers upload preset |
| `VITE_CLOUDINARY_SERVICES` | Services upload preset |
| `VITE_CLOUDINARY_BUSSING` | Bussing upload preset |
| `VITE_CLOUDINARY_BANKING` | Banking upload preset |
| `VITE_CLOUDINARY_BUS_MOBILISATION` | Bus mobilisation preset |

#### Additional Services

| Variable Name | Description |
|--------------|-------------|
| `VITE_WHATSAPP_REG` | WhatsApp registration link |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `VITE_SYNAGO_GRAPHQL_URI` | Synago GraphQL endpoint |

#### AWS S3 Configuration (Optional)

| Variable Name | Description |
|--------------|-------------|
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET_NAME` | S3 bucket name |

#### Sentry (Optional)

| Variable Name | Description |
|--------------|-------------|
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps |

### Save and Redeploy

After adding variables:
1. Click **Save**
2. Go to **App** → Click **Run build**

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
      'http://localhost:3000'
    ],
    credentials: true
  }
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

| Source address | Target address | Type |
|---------------|---------------|------|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

**Explanation**: This regex ensures all routes without file extensions are rewritten to `index.html`, allowing React Router to handle navigation.

### Simpler Alternative:

| Source address | Target address | Type |
|---------------|---------------|------|
| `/<*>` | `/index.html` | 200 (Rewrite) |

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
git push origin feature/aws-amplify-frontend-migration
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
git push origin feature/aws-amplify-frontend-migration
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

## 🎓 Key Differences: Netlify vs Amplify

| Feature | Netlify | AWS Amplify |
|---------|---------|-------------|
| Build command | Custom in `netlify.toml` | `amplify.yml` |
| Functions | Netlify Functions | Not used (API stays on Netlify) |
| CDN | Netlify CDN | AWS CloudFront |
| SSL | Auto (Let's Encrypt) | Auto (AWS Certificate Manager) |
| Redirects | `netlify.toml` | Amplify Console UI |
| Preview deploys | Auto | Auto per branch |
| Build time | ~2-4 min | ~3-5 min |

---

## 🔮 Future Enhancements

1. **API Migration**: Move GraphQL API to AWS Lambda/AppSync
2. **Database**: Consider Amazon Neptune (graph database)
3. **Auth**: Integrate AWS Cognito alongside Auth0
4. **Monitoring**: AWS CloudWatch for logs and metrics
5. **CI/CD**: GitHub Actions for advanced workflows

---

*Last updated: January 8, 2026*
