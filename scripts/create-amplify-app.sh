#!/bin/bash
set -e

echo "=================================================="
echo "Creating fl-admin-portal Amplify App"
echo "Account: 871777052000 (your account)"
echo "=================================================="
echo ""

# Step 1: Get GitHub token
echo "📝 Step 1: GitHub Personal Access Token"
echo "Go to: https://github.com/settings/tokens/new"
echo "Required scopes: repo, read:packages"
echo ""
read -p "Enter your GitHub PAT: " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GitHub token is required!"
    exit 1
fi

# Step 2: Create Amplify app
echo ""
echo "🚀 Step 2: Creating Amplify app..."
APP_OUTPUT=$(aws amplify create-app \
  --name fl-admin-portal \
  --repository https://github.com/firstlovecenter/fl-admin-portal \
  --access-token "$GITHUB_TOKEN" \
  --environment-variables GITHUB_TOKEN="$GITHUB_TOKEN" \
  --enable-branch-auto-build \
  --enable-branch-auto-deletion \
  --platform WEB \
  --region eu-west-2 \
  --output json)

APP_ID=$(echo "$APP_OUTPUT" | jq -r '.app.appId')
echo "✅ App created! App ID: $APP_ID"

# Step 3: Update app with custom build spec and redirect rules
echo ""
echo "📋 Step 3: Configuring build settings..."
aws amplify update-app \
  --app-id "$APP_ID" \
  --custom-rules source='/<*>',target='/index.html',status='404-200' \
  --region eu-west-2 > /dev/null

echo "✅ Build config updated"

# Step 4: Create IAM service role for Amplify
echo ""
echo "🔐 Step 4: Creating IAM service role for Secrets Manager access..."

# Create trust policy
cat > /tmp/amplify-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
ROLE_NAME="AmplifyServiceRole-fl-admin-portal"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file:///tmp/amplify-trust-policy.json \
  --description "Service role for fl-admin-portal Amplify app" 2>/dev/null || echo "Role already exists, continuing..."

# Attach Secrets Manager policy
cat > /tmp/secrets-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:871777052000:secret:fl-admin-portal/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name SecretsManagerAccess \
  --policy-document file:///tmp/secrets-policy.json

ROLE_ARN="arn:aws:iam::871777052000:role/$ROLE_NAME"
echo "✅ IAM role created: $ROLE_ARN"

# Wait for role to propagate
echo "⏳ Waiting for IAM role to propagate (10 seconds)..."
sleep 10

# Step 5: Attach service role to Amplify app
echo ""
echo "🔗 Step 5: Attaching service role to app..."
aws amplify update-app \
  --app-id "$APP_ID" \
  --iam-service-role-arn "$ROLE_ARN" \
  --region eu-west-2 > /dev/null

echo "✅ Service role attached"

# Step 6: Create branch
echo ""
echo "🌿 Step 6: Creating branch: feature/aws-amplify-frontend-migration..."
aws amplify create-branch \
  --app-id "$APP_ID" \
  --branch-name feature/aws-amplify-frontend-migration \
  --enable-auto-build \
  --region eu-west-2 > /dev/null

echo "✅ Branch created"

# Step 7: Show next steps for Secrets Manager
echo ""
echo "=================================================="
echo "✅ Amplify App Created Successfully!"
echo "=================================================="
echo ""
echo "App ID: $APP_ID"
echo "Console: https://console.aws.amazon.com/amplify/home?region=eu-west-2#/$APP_ID"
echo ""
echo "📌 NEXT STEPS:"
echo ""
echo "1. Copy existing secret to new name:"
echo "   aws secretsmanager get-secret-value \\"
echo "     --secret-id prod/fl-admin-portal \\"
echo "     --region eu-west-2 \\"
echo "     --query SecretString --output text | \\"
echo "   aws secretsmanager create-secret \\"
echo "     --name fl-admin-portal/feature/aws-amplify-frontend-migration \\"
echo "     --secret-string file:///dev/stdin \\"
echo "     --region eu-west-2"
echo ""
echo "2. Trigger a deployment:"
echo "   aws amplify start-job \\"
echo "     --app-id $APP_ID \\"
echo "     --branch-name feature/aws-amplify-frontend-migration \\"
echo "     --job-type RELEASE \\"
echo "     --region eu-west-2 \\"
echo "     --region us-east-1"
echo ""
echo "=================================================="

# Cleanup temp files
rm -f /tmp/amplify-trust-policy.json /tmp/secrets-policy.json
