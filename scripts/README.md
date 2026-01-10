# Scripts

This directory contains scripts for working with the FL Admin Portal monorepo and should be run as npm scripts from the root directory.

## Available Scripts

```bash
npm run start            # Starts GraphQL API and React dev servers
npm run build            # Builds API and frontend for production
npm run build:api        # Builds GraphQL API only
npm run build:frontend   # Builds React frontend only
```

## Script Files

- `start-dev.js` - Starts the GraphQL API (port 4000) and React dev server (port 3000)
- `build.js` - Builds both API and frontend projects
- `release.js` - Runs build and deploys to Netlify (API) and AWS Amplify (frontend)
- `create-amplify-app.sh` - Creates new AWS Amplify app for frontend deployment
- `create-secret.sh` - Helper script for creating AWS Secrets Manager secrets

## Deployment

- **Frontend**: AWS Amplify (automated via GitHub webhooks)
- **GraphQL API**: Netlify Functions (automated via GitHub integration)

See [AWS Amplify Migration Guide](../docs/AWS_AMPLIFY_MIGRATION.md) for deployment details.