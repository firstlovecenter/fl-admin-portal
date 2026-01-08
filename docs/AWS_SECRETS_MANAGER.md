# AWS Secrets Manager Configuration

## Overview

All environment variables are stored in **AWS Secrets Manager**, not directly in Amplify Console. This provides:

- ✅ Centralized secret management
- ✅ Automatic secret rotation
- ✅ Fine-grained access control
- ✅ Audit logging
- ✅ No need to manually configure 20+ variables in Amplify

## Secret Structure

### Secret Name Pattern
```
fl-admin-portal/${AWS_BRANCH}
```

### Examples
- **Production**: `fl-admin-portal/main`
- **Staging**: `fl-admin-portal/develop`
- **Feature**: `fl-admin-portal/feature/aws-amplify-frontend-migration`

### Secret Format (JSON)
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

## Setup Instructions

### 1. Create Secret in AWS Secrets Manager

#### Via AWS Console:
1. Go to **AWS Secrets Manager** → https://console.aws.amazon.com/secretsmanager
2. Click **Store a new secret**
3. Select **Other type of secret**
4. Select **Plaintext** tab
5. Paste the JSON (see template above)
6. Click **Next**
7. Secret name: `fl-admin-portal/main` (or your branch name)
8. Click **Next** → **Next** → **Store**

#### Via AWS CLI:
```bash
# Create the secret
aws secretsmanager create-secret \
  --name fl-admin-portal/main \
  --description "Environment variables for FL Admin Portal frontend" \
  --secret-string file://secrets.json

# Or update existing secret
aws secretsmanager update-secret \
  --secret-id fl-admin-portal/main \
  --secret-string file://secrets.json
```

### 2. Grant Amplify Access to Secrets Manager

#### Option A: Via Amplify Service Role

1. Go to **AWS Amplify Console** → Your App
2. Go to **App settings** → **General**
3. Under **Service role**, note the role name (e.g., `amplifyconsole-backend-role`)
4. Go to **IAM Console** → **Roles** → Find the Amplify role
5. Click **Add permissions** → **Attach policies**
6. Click **Create policy** → JSON tab:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
    }
  ]
}
```

7. Name it: `AmplifySecretsManagerAccess`
8. Attach the policy to the Amplify service role

#### Option B: Add Inline Policy

```bash
aws iam put-role-policy \
  --role-name amplifyconsole-backend-role \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["secretsmanager:GetSecretValue"],
        "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
      }
    ]
  }'
```

### 3. Configure Amplify Build

The `amplify.yml` is already configured to fetch secrets:

```yaml
preBuild:
  commands:
    # Fetch secrets from AWS Secrets Manager
    - export SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id fl-admin-portal/${AWS_BRANCH} --query SecretString --output text)
    # Export all secrets as environment variables
    - export $(echo $SECRET_JSON | jq -r 'to_entries | map("\(.key)=\(.value)") | .[]')
```

**How it works:**
1. `${AWS_BRANCH}` is automatically set by Amplify (e.g., `main`, `develop`)
2. Fetches the secret: `fl-admin-portal/main`
3. Parses JSON and exports all key-value pairs as environment variables
4. All `VITE_*` variables are available during build

## Branch-Specific Secrets

### Production Branch (main)
```bash
aws secretsmanager create-secret \
  --name fl-admin-portal/main \
  --secret-string file://production-secrets.json
```

### Staging Branch (develop)
```bash
aws secretsmanager create-secret \
  --name fl-admin-portal/develop \
  --secret-string file://staging-secrets.json
```

### Feature Branches
Amplify will use the branch name, so create:
```bash
aws secretsmanager create-secret \
  --name "fl-admin-portal/feature/aws-amplify-frontend-migration" \
  --secret-string file://dev-secrets.json
```

**Or** use a wildcard approach: All feature branches use `develop` secrets.

## Environment Variables in Amplify Console

You **only** need to set these in Amplify (not in Secrets Manager):

1. **AWS_REGION** (optional, defaults to `us-east-1`)
2. Any override for specific branches

All other variables come from Secrets Manager automatically.

## Local Development

For local dev, create `.env.local`:

```bash
# Copy example
cp web-react-ts/.env.example web-react-ts/.env.local

# Or fetch from AWS
aws secretsmanager get-secret-value \
  --secret-id fl-admin-portal/main \
  --query SecretString \
  --output text | jq -r 'to_entries | map("\(.key)=\(.value)") | .[]' > web-react-ts/.env.local
```

## Updating Secrets

### Via Console
1. AWS Secrets Manager → Select secret
2. **Retrieve secret value** → **Edit**
3. Update JSON
4. **Save**
5. Redeploy in Amplify

### Via CLI
```bash
# Update single value
aws secretsmanager update-secret \
  --secret-id fl-admin-portal/main \
  --secret-string "$(aws secretsmanager get-secret-value --secret-id fl-admin-portal/main --query SecretString --output text | jq '.VITE_GRAPHQL_URI = "https://new-endpoint.com"')"

# Update entire secret
aws secretsmanager update-secret \
  --secret-id fl-admin-portal/main \
  --secret-string file://updated-secrets.json
```

## Security Best Practices

✅ **DO:**
- Use separate secrets for each environment (prod, staging, dev)
- Enable automatic secret rotation for sensitive credentials
- Use IAM policies to restrict access
- Audit CloudTrail logs for secret access
- Version secrets (Secrets Manager does this automatically)

❌ **DON'T:**
- Store secrets in git
- Share production secrets across environments
- Grant overly broad IAM permissions
- Hardcode secrets in amplify.yml

## Troubleshooting

### Build fails: "AccessDeniedException"
**Cause**: Amplify service role doesn't have permission to read secrets.

**Fix**: Add the IAM policy (see Step 2 above).

### Build fails: "SecretNotFoundException"
**Cause**: Secret doesn't exist for this branch.

**Fix**: Create the secret with the correct name pattern:
```bash
aws secretsmanager create-secret \
  --name "fl-admin-portal/${YOUR_BRANCH_NAME}" \
  --secret-string file://secrets.json
```

### Variables not available during build
**Cause**: `jq` might not be parsing correctly.

**Fix**: Check the secret is valid JSON:
```bash
aws secretsmanager get-secret-value \
  --secret-id fl-admin-portal/main \
  --query SecretString \
  --output text | jq .
```

### How to verify secrets are loaded
Add to `amplify.yml` preBuild:
```yaml
- echo "Loaded secrets:" && env | grep VITE_
```

## Migration from Doppler

If you previously used Doppler:

1. Export secrets from Doppler:
```bash
doppler secrets download --no-file --format json > secrets.json
```

2. Import to AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name fl-admin-portal/main \
  --secret-string file://secrets.json
```

3. Remove Doppler from `amplify.yml` ✅ (already done)

## Cost

AWS Secrets Manager pricing (as of 2026):
- **$0.40 per secret per month**
- **$0.05 per 10,000 API calls**

For 3 secrets (prod, staging, dev):
- **~$1.20/month** for storage
- **~$0.05/month** for API calls (30 builds/month)
- **Total: ~$1.25/month**

## Reference Files

- **amplify.yml** - Configured to fetch from Secrets Manager
- **web-react-ts/.env.example** - Template with all required variables
- **docs/AWS_AMPLIFY_MIGRATION.md** - Full migration guide

---

**Status**: ✅ Configured for AWS Secrets Manager  
**Last Updated**: January 8, 2026
