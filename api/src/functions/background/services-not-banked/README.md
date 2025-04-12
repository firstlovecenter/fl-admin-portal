# Services Not Banked Lambda Function

This AWS Lambda function automatically updates the "Services Not Banked" data in Google Sheets for First Love Center.

## Function Overview

- **Schedule**: Runs weekly on Monday at 23:30 UTC
- **Functionality**: 
  - Connects to Neo4j database
  - Retrieves services that haven't been banked
  - Writes the data to a Google Sheet
  - Sends SMS notifications to stakeholders

## Structure

- `index.js` - Main Lambda function handler
- `secrets.js` - Helper for loading secrets from AWS Secrets Manager
- `google-credentials.js` - Helper for formatting Google API credentials
- `package.json` - Function dependencies
- `template.yml` - CloudFormation template for Lambda and EventBridge setup

## Deployment

This function is deployed as part of the background functions workflow:
- Code changes trigger the GitHub Actions workflow defined in `.github/workflows/deploy-background-functions.yml`
- The workflow packages and deploys the function to AWS Lambda
- The CloudWatch Events rule is automatically created by the CloudFormation template

## Manual Testing

To manually invoke the function:

```bash
aws lambda invoke --function-name fl-synago-services-not-banked response.json
cat response.json
```

## Logging

Function logs are available in CloudWatch Logs:
- Log group: `/aws/lambda/fl-synago-services-not-banked`