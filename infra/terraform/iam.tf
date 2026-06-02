# =============================================================================
# Lambda execution roles
# =============================================================================

# -----------------------------------------------------------------------------
# fl-lambda-functions — shared by dev/staging GraphQL + all background jobs.
# -----------------------------------------------------------------------------
resource "aws_iam_role" "fl_lambda_functions" {
  name        = "fl-lambda-functions"
  path        = "/"
  description = "Allows Lambda functions to call AWS services on your behalf."

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "fl_lambda_functions_secrets_rw" {
  role       = aws_iam_role.fl_lambda_functions.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

resource "aws_iam_role_policy_attachment" "fl_lambda_functions_basic_exec" {
  role       = aws_iam_role.fl_lambda_functions.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "access_dev_flc_secrets" {
  name = "AccessDevFLCSecrets"
  role = aws_iam_role.fl_lambda_functions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = "arn:aws:secretsmanager:eu-west-2:871777052000:secret:dev/fl-admin-portal"
    }]
  })
}

resource "aws_iam_role_policy" "access_flc_production_secrets" {
  name = "AccessFLCProductionSecrets"
  role = aws_iam_role.fl_lambda_functions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = "arn:aws:secretsmanager:eu-west-2:871777052000:secret:prod/fl-admin-portal-izieAR"
    }]
  })
}

resource "aws_iam_role_policy" "access_flc_cors_origins" {
  name = "AccessFLCCorsOrigins"
  role = aws_iam_role.fl_lambda_functions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "ssm:GetParameter"
      Resource = [
        "arn:aws:ssm:eu-west-2:871777052000:parameter/fl-auth/prod/allowed-origins",
        "arn:aws:ssm:eu-west-2:871777052000:parameter/fl-auth/dev/allowed-origins",
      ]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_invoke_notification_service" {
  name = "lambda-invoke-notification-service"
  role = aws_iam_role.fl_lambda_functions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "lambda:InvokeFunction"
      Resource = [
        "arn:aws:lambda:eu-west-2:871777052000:function:flc-notify-service",
        "arn:aws:lambda:eu-west-2:871777052000:function:dev-flc-notify-service",
      ]
    }]
  })
}

# -----------------------------------------------------------------------------
# fl-synago-graphql-role-1fc95k40 — service role for the prod GraphQL lambda
# (and fl-synago-graphql-dev). Lives under the /service-role/ path.
# -----------------------------------------------------------------------------
resource "aws_iam_role" "fl_synago_graphql" {
  name = "fl-synago-graphql-role-1fc95k40"
  path = "/service-role/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "graphql_secrets_rw" {
  role       = aws_iam_role.fl_synago_graphql.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

# Customer-managed basic-execution policy auto-created with the service role.
# Referenced by ARN (the policy itself is left unmanaged).
resource "aws_iam_role_policy_attachment" "graphql_basic_exec" {
  role       = aws_iam_role.fl_synago_graphql.name
  policy_arn = "arn:aws:iam::871777052000:policy/service-role/AWSLambdaBasicExecutionRole-bec13c64-bdec-41d2-9894-6e81740f150c"
}

resource "aws_iam_role_policy" "call_flc_notify_lambda" {
  name = "CallFLCNotifyLambda"
  role = aws_iam_role.fl_synago_graphql.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "Statement1"
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = "arn:aws:lambda:eu-west-2:871777052000:function:*flc-notify-service*"
    }]
  })
}
