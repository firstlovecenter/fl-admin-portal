# AWS Secrets Manager Configuration

## Overview

All environment variables are stored in **AWS Secrets Manager** and automatically fetched during Amplify builds. This avoids manually configuring 20+ variables in the Amplify Console.

## Secret Format (JSON)

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

1. Go to **AWS Secrets Manager** → https://console.aws.amazon.com/secretsmanager
2. Click **Store a new secret**
3. Select **Other type of secret** → **Plaintext** tab
4. Paste the JSON template (see above)
5. Click **Next**
6. Enter secret name (must match the name in your `amplify.yml`)
7. Click **Next** → **Next** → **Store**

### 2. Grant Amplify Access to Secrets Manager

1. Go to **AWS Amplify Console** → Your App
2. Go to **App settings** → **General**
3. Under **Service role**, note the role name (e.g., `amplifyconsole-backend-role`)
4. Go to **IAM Console** → **Roles** → Find the Amplify role
5. Click **Add permissions** → **Attach policies**
6. Click **Create policy** → JSON tab:

````json
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
  ]In **AWS Amplify Console** → **App settings** → **General**, note your service role name
2. In **IAM Console** → **Roles**, find your Amplify role
3. Click **Add permissions** → **Create inline policy** → **JSON**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:eu-west-2:*:secret:*"
    }
  ]
}
````

4. Name it `SecretsManagerAccess` and save

### 3. Add GITHUB_TOKEN to Amplify Environment Variables

In Amplify Console → **Environment variables**, add:

- **Key**: `GITHUB_TOKEN`
- **Value**: Your GitHub Personal Access Token (for npm packages)

### Variables not available during build

**Cause**: JSON parsing error.

**Fix**: Check the secret is valid JSON:

```bash
aws secretsmanager get-secret-value \
  --secret-id fl-admin-portal/main \
  --query SecretString \
  --output text | jq .
```

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
**Last Updated**: February 6, 2026
**"AccessDeniedException"**
→ IAM policy missing. Add the policy in Step 2.

**"SecretNotFoundException"**
→ Secret name in `amplify.yml` doesn't match AWS. Create the secret or update the name.

**"GITHUB_TOKEN is missing"**
→ Add it as an Amplify environment variable (Step 3).

**Variables not available during build**
→ Validate your secret is valid JSON in AWS Console.
