# Payment Webhook Lambda Function

This AWS Lambda function handles Paystack payment webhook callbacks for the FLC Admin Portal.

## Function Overview

- **Purpose**: Process payment callbacks from Paystack payment gateway
- **Functionality**: 
  - Validates that the request comes from authorized Paystack IP addresses
  - Updates transaction statuses in Neo4j database
  - Updates records in Firebase collections (offerings, tithes, etc.)
  - Credits church accounts for valid transactions (if applicable)

## Structure

- `payment-webhook.js` - Main Lambda function handler
- `firebase.js` - Firebase integration module
- `secrets.js` - Helper for loading secrets from AWS Secrets Manager
- `package.json` - Function dependencies
- `template.yml` - CloudFormation template for Lambda and API Gateway setup

## Migration from Netlify

This function is a direct replacement for the Netlify function `payment-background`. Key changes in the migration:

1. **Environment Variables**: Changed from Netlify env vars to AWS Secrets Manager
2. **Request Processing**: Adapted to handle API Gateway event format
3. **Deployment**: Changed from Netlify Functions to AWS Lambda + API Gateway

After deploying this Lambda function, you'll need to update the Paystack webhook URL in the Paystack dashboard to point to the new API Gateway endpoint.

## Deployment

### Manual Deployment

1. Package the function:
```bash
cd api/src/functions/background/payment-webhook
npm install
zip -r payment-webhook.zip .
```

2. Deploy using AWS CloudFormation:
```bash
aws cloudformation package \
  --template-file template.yml \
  --s3-bucket your-deployment-bucket \
  --output-template-file packaged-template.yml

aws cloudformation deploy \
  --template-file packaged-template.yml \
  --stack-name fl-synago-payment-webhook \
  --capabilities CAPABILITY_IAM
```

3. Get the webhook URL:
```bash
aws cloudformation describe-stacks \
  --stack-name fl-synago-payment-webhook \
  --query "Stacks[0].Outputs[?OutputKey=='WebhookUrl'].OutputValue" \
  --output text
```

4. Update the webhook URL in Paystack dashboard

### CI/CD Deployment

This function can be deployed as part of your CI/CD pipeline using GitHub Actions. Add this function to your existing deployment workflow.

## Testing

You can test the webhook using a tool like Postman to send a sample Paystack webhook payload to the API Gateway endpoint.

Sample payload:
```json
{
  "event": "charge.success",
  "data": {
    "reference": "your-test-reference",
    "status": "success"
  }
}
```

## Security Considerations

- The webhook verifies requests are coming from Paystack's IP addresses
- Ensure your AWS Secrets Manager contains all required secrets
- API Gateway is configured without authentication, relying on Paystack IP verification