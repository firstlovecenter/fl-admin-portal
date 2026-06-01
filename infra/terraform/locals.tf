locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region

  # Lambda execution roles (managed in iam.tf).
  role_fl_lambda_functions = aws_iam_role.fl_lambda_functions.arn
  role_graphql_service     = aws_iam_role.fl_synago_graphql.arn

  # ---------------------------------------------------------------------------
  # All 14 in-scope Lambda functions, mirrored from the live configuration.
  # `environment` holds env-var KEYS/values that are NOT secret (the secret
  # CONTENT lives in Secrets Manager; AWS_SECRET_NAME is just a pointer).
  # ---------------------------------------------------------------------------
  lambdas = {
    # --- GraphQL API (one per environment) ---
    "fl-synago-graphql" = {
      runtime           = "nodejs18.x"
      handler           = "graphql.handler"
      memory_size       = 1024
      timeout           = 25
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_graphql_service
      # Live env also has MAILGUN_API_KEY (secret) + MAILGUN_DOMAIN; `environment`
      # is in ignore_changes (lambda.tf), so the live values are adopted and
      # left untouched — documented here for reference only.
      environment = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-graphql-dev" = {
      runtime           = "nodejs18.x"
      handler           = "graphql.handler"
      memory_size       = 1024
      timeout           = 25
      architectures     = ["x86_64"]
      ephemeral_storage = 512
      role              = local.role_graphql_service
      description       = "Development GraphQL API for FL Admin Portal"
      environment       = { AWS_SECRET_NAME = "dev/fl-admin-portal" }
    }
    "dev-fl-synago-graphql" = {
      runtime           = "nodejs24.x"
      handler           = "index.handler"
      memory_size       = 1024
      timeout           = 60
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "dev/fl-admin-portal" }
    }
    "staging-fl-synago-graphql" = {
      runtime           = "nodejs24.x"
      handler           = "index.handler"
      memory_size       = 512
      timeout           = 900
      architectures     = ["x86_64"]
      ephemeral_storage = 10240
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "staging/fl-admin-portal" }
    }

    # --- Background / scheduled jobs (production singletons) ---
    "fl-synago-service-graph-aggregator" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 330
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-bacenta-graph-aggregator" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 900
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-accra-new-members" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 10
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-code-of-the-day" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 10
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-services-not-banked" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 20
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-payment-webhook" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 30
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-outside-accra-weekly" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 512
      timeout           = 900
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-accra-campus-weekly" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 60
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    "fl-synago-den-office-monthly-report" = {
      runtime           = "nodejs22.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 10
      architectures     = ["arm64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = { AWS_SECRET_NAME = "prod/fl-admin-portal" }
    }
    # Orphan: no schedule, no function URL, no env vars. Likely invoked by
    # another lambda. Captured here so it isn't lost.
    "fl-synago-weekly-tip-generator" = {
      runtime           = "nodejs24.x"
      handler           = "index.handler"
      memory_size       = 128
      timeout           = 3
      architectures     = ["x86_64"]
      ephemeral_storage = 512
      role              = local.role_fl_lambda_functions
      environment       = {}
    }
  }
}
