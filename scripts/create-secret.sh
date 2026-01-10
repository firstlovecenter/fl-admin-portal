#!/bin/bash
# Create AWS Secrets Manager secret for fl-admin-portal

echo "=================================================="
echo "Creating Secrets Manager Secret"
echo "=================================================="
echo ""
echo "This script will help you create the secret with all"
echo "environment variables needed for the build."
echo ""

# Read all the env vars from .env.example
echo "📋 Reading variables from web-react-ts/.env.example..."
echo ""

# Create JSON structure
cat > /tmp/secret.json << 'EOF'
{
  "VITE_ENVIRONMENT": "staging",
  "VITE_SENTRY_ENVIRONMENT": "staging",
  "VITE_SENTRY_DSN": "YOUR_SENTRY_DSN_HERE",
  "VITE_NEO4J_URI": "YOUR_NEO4J_URI",
  "VITE_NEO4J_USER": "neo4j",
  "VITE_NEO4J_PASSWORD": "YOUR_NEO4J_PASSWORD",
  "VITE_AUTH0_DOMAIN": "YOUR_AUTH0_DOMAIN",
  "VITE_AUTH0_CLIENT_ID": "YOUR_AUTH0_CLIENT_ID",
  "VITE_AUTH0_AUDIENCE": "YOUR_AUTH0_AUDIENCE",
  "GITHUB_TOKEN": "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN",
  "SENTRY_AUTH_TOKEN": "YOUR_SENTRY_AUTH_TOKEN_OPTIONAL"
}
EOF

echo "✅ Created template at /tmp/secret.json"
echo ""
echo "=================================================="
echo "⚠️  IMPORTANT: Edit the secret values"
echo "=================================================="
echo ""
echo "1. Open /tmp/secret.json in your editor:"
echo "   code /tmp/secret.json"
echo ""
echo "2. Replace ALL placeholder values with real values:"
echo "   - VITE_NEO4J_URI: Your Neo4j database URI"
echo "   - VITE_NEO4J_PASSWORD: Your Neo4j password"
echo "   - VITE_AUTH0_DOMAIN: Your Auth0 domain"
echo "   - VITE_AUTH0_CLIENT_ID: Your Auth0 client ID"
echo "   - VITE_AUTH0_AUDIENCE: Your Auth0 API audience"
echo "   - GITHUB_TOKEN: Your GitHub PAT (same as before)"
echo "   - SENTRY_DSN: Your Sentry DSN (optional)"
echo "   - SENTRY_AUTH_TOKEN: Sentry auth token (optional)"
echo ""
echo "3. Get values from one of these sources:"
echo "   a) Your .env file in web-react-ts/"
echo "   b) Netlify environment variables"
echo "   c) Ask your senior dev for the values"
echo ""
read -p "Press Enter when you've edited /tmp/secret.json..."

# Validate JSON
echo ""
echo "🔍 Validating JSON..."
if ! jq empty /tmp/secret.json 2>/dev/null; then
    echo "❌ Invalid JSON! Please fix /tmp/secret.json"
    exit 1
fi

echo "✅ JSON is valid"
echo ""

# Create the secret
echo "🚀 Creating secret in AWS Secrets Manager..."
aws secretsmanager create-secret \
  --name fl-admin-portal/feature/aws-amplify-frontend-migration \
  --secret-string file:///tmp/secret.json \
  --description "Environment variables for fl-admin-portal Amplify build" \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "✅ Secret Created Successfully!"
    echo "=================================================="
    echo ""
    echo "Secret ARN:"
    aws secretsmanager describe-secret \
      --secret-id fl-admin-portal/feature/aws-amplify-frontend-migration \
      --region us-east-1 \
      --query ARN \
      --output text
    echo ""
    echo "Next step: Trigger deployment"
    echo ""
    echo "aws amplify start-job \\"
    echo "  --app-id d3u8ulkc17u7fb \\"
    echo "  --branch-name feature/aws-amplify-frontend-migration \\"
    echo "  --job-type RELEASE \\"
    echo "  --region us-east-1"
else
    echo "❌ Failed to create secret"
    exit 1
fi

# Cleanup
rm /tmp/secret.json
echo ""
echo "🧹 Cleaned up temporary file"
