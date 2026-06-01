output "amplify_app_id" {
  value       = aws_amplify_app.portal.id
  description = "Amplify app ID for the FL Admin Portal frontend."
}

output "amplify_default_domain" {
  value       = aws_amplify_app.portal.default_domain
  description = "Amplify-provided default domain."
}

output "api_endpoints" {
  value = {
    prod    = aws_apigatewayv2_api.api_synago.api_endpoint
    dev     = aws_apigatewayv2_api.dev_graphql.api_endpoint
    staging = aws_apigatewayv2_api.staging_graphql.api_endpoint
  }
  description = "HTTP API execute-api endpoints per environment."
}

output "dev_graphql_function_url" {
  value       = aws_lambda_function_url.dev_graphql.function_url
  description = "Public Function URL for the dev GraphQL lambda."
}

output "lambda_function_names" {
  value       = sort([for fn in aws_lambda_function.this : fn.function_name])
  description = "All managed Lambda function names."
}

output "secret_arns" {
  value       = { for k, s in data.aws_secretsmanager_secret.envs : k => s.arn }
  description = "ARNs of the per-environment secrets (referenced, not managed)."
}
