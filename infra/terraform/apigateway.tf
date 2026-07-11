# =============================================================================
# API Gateway v2 (HTTP APIs)
# =============================================================================

# -----------------------------------------------------------------------------
# PROD: api-synago — fronts the GraphQL lambda and the payment webhook.
# -----------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "api_synago" {
  name          = "api-synago"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["GET", "POST"]
    allow_origins     = ["https://admin.firstlovecenter.com", "https://synago.firstlovecenter.com"]
    max_age           = 0
  }
}

resource "aws_apigatewayv2_integration" "synago_graphql" {
  api_id                 = aws_apigatewayv2_api.api_synago.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.this["fl-synago-graphql"].arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "synago_webhook" {
  api_id                 = aws_apigatewayv2_api.api_synago.id
  description            = "Paystack Payment Webhook"
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.this["fl-synago-payment-webhook"].arn
  payload_format_version = "2.0"
}

# Routes are explicit (not for_each): on Terraform 1.5.x a for_each resource
# that references another not-yet-imported resource (the integration ID) can't
# be expanded during import validation.
resource "aws_apigatewayv2_route" "synago_get_root" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "GET /"
  target    = "integrations/${aws_apigatewayv2_integration.synago_graphql.id}"
}

resource "aws_apigatewayv2_route" "synago_options_root" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "OPTIONS /"
  target    = "integrations/${aws_apigatewayv2_integration.synago_graphql.id}"
}

resource "aws_apigatewayv2_route" "synago_post_root" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "POST /"
  target    = "integrations/${aws_apigatewayv2_integration.synago_graphql.id}"
}

resource "aws_apigatewayv2_route" "synago_post_graphql" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "POST /graphql"
  target    = "integrations/${aws_apigatewayv2_integration.synago_graphql.id}"
}

resource "aws_apigatewayv2_route" "synago_downloads" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "ANY /downloads/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.synago_graphql.id}"
}

resource "aws_apigatewayv2_route" "synago_webhook" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "ANY /payment-webhook"
  target    = "integrations/${aws_apigatewayv2_integration.synago_webhook.id}"
}

# Vestigial route present in live infra: an "OPTIONS /graphql" route with NO
# integration target (CORS preflight is otherwise auto-handled). Reproduced
# for a clean import.
resource "aws_apigatewayv2_route" "synago_options_graphql" {
  api_id    = aws_apigatewayv2_api.api_synago.id
  route_key = "OPTIONS /graphql"
}

resource "aws_apigatewayv2_stage" "synago" {
  api_id      = aws_apigatewayv2_api.api_synago.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "synago_graphql_root" {
  statement_id  = "8c3a3f64-60e3-585f-9979-c48095e7184e"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.api_synago.id}/*/*/"
}

resource "aws_lambda_permission" "synago_graphql_graphql" {
  statement_id  = "2ca2cce5-6756-53e5-b7d8-f58aae28b501"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.api_synago.id}/*/*/graphql"
}

resource "aws_lambda_permission" "synago_graphql_downloads" {
  statement_id  = "24f67973-e01c-5b53-b351-b59b9a5db2f5"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.api_synago.id}/*/*/downloads/{proxy+}"
}

resource "aws_lambda_permission" "synago_webhook" {
  statement_id  = "e6cd4bdc-1176-51cc-baf9-a6abb1d652cf"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["fl-synago-payment-webhook"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.api_synago.id}/*/*/payment-webhook"
}

# -----------------------------------------------------------------------------
# DEV: dev-fl-synago-graphql-API
# -----------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "dev_graphql" {
  name          = "dev-fl-synago-graphql-API"
  description   = "Created by AWS Lambda"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["POST", "OPTIONS"]
    # Local dev servers (both loopback hostnames) so developers can run the FE
    # locally against the deployed dev API. 5173 = Vite, 3000 = docker-compose
    # UI. DEV gateway only — never added to the prod or staging gateways.
    allow_origins = [
      "https://dev-synago.firstlovecenter.com",
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
    ]
    max_age = 0
  }
}

resource "aws_apigatewayv2_integration" "dev_graphql" {
  api_id                 = aws_apigatewayv2_api.dev_graphql.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.this["dev-fl-synago-graphql"].arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "dev_named" {
  api_id    = aws_apigatewayv2_api.dev_graphql.id
  route_key = "ANY /dev-fl-synago-graphql"
  target    = "integrations/${aws_apigatewayv2_integration.dev_graphql.id}"
}

resource "aws_apigatewayv2_route" "dev_graphql_route" {
  api_id    = aws_apigatewayv2_api.dev_graphql.id
  route_key = "ANY /graphql"
  target    = "integrations/${aws_apigatewayv2_integration.dev_graphql.id}"
}

resource "aws_apigatewayv2_route" "dev_downloads" {
  api_id    = aws_apigatewayv2_api.dev_graphql.id
  route_key = "ANY /downloads/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.dev_graphql.id}"
}

resource "aws_apigatewayv2_stage" "dev_graphql" {
  api_id      = aws_apigatewayv2_api.dev_graphql.id
  name        = "default"
  description = "Created by AWS Lambda"
  auto_deploy = true
}

resource "aws_lambda_permission" "dev_graphql_named" {
  statement_id  = "lambda-9dae8a78-6597-423c-86b3-97b136b0601f"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["dev-fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.dev_graphql.id}/*/*/dev-fl-synago-graphql"
}

resource "aws_lambda_permission" "dev_graphql_graphql" {
  statement_id  = "5041a8ef-ca90-55b4-b17a-76f867d528bb"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["dev-fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.dev_graphql.id}/*/*/graphql"
}

resource "aws_lambda_permission" "dev_graphql_downloads" {
  statement_id  = "b26aa43e-ef26-572c-9bd7-babcb23fbe32"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["dev-fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.dev_graphql.id}/*/*/downloads/{proxy+}"
}

# -----------------------------------------------------------------------------
# STAGING: staging-fl-synago-graphql-API
# -----------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "staging_graphql" {
  name          = "staging-fl-synago-graphql-API"
  description   = "Created by AWS Lambda"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "authorization"]
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_origins     = ["https://staging-synago.firstlovecenter.com"]
    max_age           = 600
  }
}

resource "aws_apigatewayv2_integration" "staging_graphql" {
  api_id                 = aws_apigatewayv2_api.staging_graphql.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.this["staging-fl-synago-graphql"].arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "staging_graphql_route" {
  api_id    = aws_apigatewayv2_api.staging_graphql.id
  route_key = "ANY /graphql"
  target    = "integrations/${aws_apigatewayv2_integration.staging_graphql.id}"
}

resource "aws_apigatewayv2_route" "staging_downloads" {
  api_id    = aws_apigatewayv2_api.staging_graphql.id
  route_key = "ANY /downloads/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.staging_graphql.id}"
}

resource "aws_apigatewayv2_route" "staging_named" {
  api_id    = aws_apigatewayv2_api.staging_graphql.id
  route_key = "ANY /staging-fl-synago-graphql"
  target    = "integrations/${aws_apigatewayv2_integration.staging_graphql.id}"
}

resource "aws_apigatewayv2_stage" "staging_graphql" {
  api_id      = aws_apigatewayv2_api.staging_graphql.id
  name        = "default"
  description = "Created by AWS Lambda"
  auto_deploy = true
}

resource "aws_lambda_permission" "staging_graphql_named" {
  statement_id  = "lambda-1edbaac2-2447-4297-9506-59d6d5faeeb3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["staging-fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.staging_graphql.id}/*/*/staging-fl-synago-graphql"
}

resource "aws_lambda_permission" "staging_graphql_graphql" {
  statement_id  = "f404be5c-9511-53ff-bbb5-cbb3f26b16b3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["staging-fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.staging_graphql.id}/*/*/graphql"
}

resource "aws_lambda_permission" "staging_graphql_downloads" {
  statement_id  = "a8431098-86d5-5e78-b772-121350c78c9d"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this["staging-fl-synago-graphql"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:871777052000:${aws_apigatewayv2_api.staging_graphql.id}/*/*/downloads/{proxy+}"
}
