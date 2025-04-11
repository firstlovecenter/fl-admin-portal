# Code of the Day Lambda Function

This AWS Lambda function automatically sets the daily code for arrivals in the FL Synago application.

## Function Overview

- **Schedule**: Runs daily at 00:30 UTC
- **Functionality**: 
  - Connects to Neo4j database
  - Checks for predefined codes for specific dates
  - Falls back to fetching a random word if no predefined code exists
  - Updates the ArrivalsCodeOfTheDay node in the database

## Structure

- `code-of-the-day.js` - Main Lambda function handler
- `secrets.js` - Helper for loading secrets from AWS Secrets Manager
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
aws lambda invoke --function-name fl-synago-code-of-the-day response.json
cat response.json
```

## Logging

Function logs are available in CloudWatch Logs:
- Log group: `/aws/lambda/fl-synago-code-of-the-day`