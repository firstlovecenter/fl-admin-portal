# GitHub Packages Authentication

## The Problem

AWS Amplify build fails with:
```
npm error 401 Unauthorized - GET https://npm.pkg.github.com/download/@jaedag/admin-portal-types/1.5.16/...
npm error authentication token not provided
```

## Why It Happens

The project uses `@jaedag/admin-portal-types`, a private package hosted on GitHub Packages. GitHub Packages requires authentication via a Personal Access Token (PAT).

## The Solution

### 1. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Configure the token:
   - **Note**: `AWS Amplify - FL Admin Portal`
   - **Expiration**: Set to 1 year or No expiration
   - **Scopes**: ✅ Check `read:packages` ONLY
4. Click **Generate token** at the bottom
5. **IMPORTANT**: Copy the token immediately (starts with `ghp_`)
   - You won't be able to see it again!

### 2. Add Token to AWS Amplify

1. Go to **AWS Amplify Console**
2. Select your app
3. Go to **App settings** → **Environment variables**
4. Click **Add variable**
5. Add:
   - **Variable name**: `GITHUB_TOKEN`
   - **Value**: Paste your token (e.g., `ghp_xxxxxxxxxxxxxxxxxxxx`)
6. Click **Save**

### 3. Redeploy

1. Go to your app in Amplify
2. Click **Run build**
3. Build should now succeed ✅

## How It Works

The `amplify.yml` file automatically creates a `.npmrc` file during build:

```yaml
preBuild:
  commands:
    - echo "@jaedag:registry=https://npm.pkg.github.com" > .npmrc
    - echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
    - cd web-react-ts && cp ../.npmrc . && npm install && cd ..
```

This tells npm to:
1. Use GitHub Packages for `@jaedag` scoped packages
2. Authenticate using the `GITHUB_TOKEN` environment variable

## Files Created

- **`web-react-ts/.npmrc`**: npm configuration for GitHub Packages authentication
- **Updated `amplify.yml`**: Automatic .npmrc creation during build
- **Updated `.env.example`**: Documents the GITHUB_TOKEN requirement

## Verification

After deploying, check the build logs in Amplify. You should see:
```
npm install
✓ Installing dependencies
✓ @jaedag/admin-portal-types@1.5.16
```

No more 401 errors!

## Local Development

For local development, create a `.env.local` file:

```bash
# In web-react-ts/.env.local
GITHUB_TOKEN=ghp_your_token_here
```

Then update the `.npmrc` to use it:
```
@jaedag:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Security Notes

- ✅ The token only has `read:packages` scope (minimal permissions)
- ✅ The token is stored as an environment variable (not in code)
- ✅ The `.npmrc` file uses variable substitution (no hardcoded tokens)
- ⚠️ Never commit tokens to git
- ⚠️ `.npmrc` is in `.gitignore` to prevent accidental commits

## Troubleshooting

### Build still fails with 401
- Verify token was added correctly in Amplify environment variables
- Check token hasn't expired
- Ensure token has `read:packages` scope
- Try regenerating the token

### "Invalid credentials"
- Token may be expired
- Generate a new token with `read:packages` scope

### Works locally but fails in Amplify
- Make sure `GITHUB_TOKEN` is set in Amplify environment variables
- Check the build logs to confirm `.npmrc` was created

## Alternative: Make Package Public

If you own the `@jaedag/admin-portal-types` package, you can make it public:

1. Go to the package on GitHub
2. Settings → Danger Zone → Change visibility
3. Make public

Then you won't need authentication. However, this exposes your types to everyone.

## Related Files

- `web-react-ts/.npmrc` - npm authentication config
- `amplify.yml` - Build configuration
- `web-react-ts/.env.example` - Environment variables template
- `docs/AWS_AMPLIFY_MIGRATION.md` - Full migration guide

---

**Status**: ✅ Fixed  
**Last Updated**: February 6, 2026
