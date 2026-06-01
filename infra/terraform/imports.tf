# =============================================================================
# Import blocks — adopt the existing live infrastructure into Terraform state.
#
# Run `terraform plan` after `terraform init`. A clean adopt shows "N to import,
# 0 to add, 0 to change, 0 to destroy". Investigate any add/change/destroy
# before applying. Once imported and confirmed green, these blocks can be
# deleted (state already holds the resources).
# =============================================================================

# --- Lambda functions -------------------------------------------------------
import {
  to = aws_lambda_function.this["fl-synago-graphql"]
  id = "fl-synago-graphql"
}
import {
  to = aws_lambda_function.this["fl-synago-graphql-dev"]
  id = "fl-synago-graphql-dev"
}
import {
  to = aws_lambda_function.this["dev-fl-synago-graphql"]
  id = "dev-fl-synago-graphql"
}
import {
  to = aws_lambda_function.this["staging-fl-synago-graphql"]
  id = "staging-fl-synago-graphql"
}
import {
  to = aws_lambda_function.this["fl-synago-service-graph-aggregator"]
  id = "fl-synago-service-graph-aggregator"
}
import {
  to = aws_lambda_function.this["fl-synago-bacenta-graph-aggregator"]
  id = "fl-synago-bacenta-graph-aggregator"
}
import {
  to = aws_lambda_function.this["fl-synago-accra-new-members"]
  id = "fl-synago-accra-new-members"
}
import {
  to = aws_lambda_function.this["fl-synago-code-of-the-day"]
  id = "fl-synago-code-of-the-day"
}
import {
  to = aws_lambda_function.this["fl-synago-services-not-banked"]
  id = "fl-synago-services-not-banked"
}
import {
  to = aws_lambda_function.this["fl-synago-payment-webhook"]
  id = "fl-synago-payment-webhook"
}
import {
  to = aws_lambda_function.this["fl-synago-outside-accra-weekly"]
  id = "fl-synago-outside-accra-weekly"
}
import {
  to = aws_lambda_function.this["fl-synago-accra-campus-weekly"]
  id = "fl-synago-accra-campus-weekly"
}
import {
  to = aws_lambda_function.this["fl-synago-den-office-monthly-report"]
  id = "fl-synago-den-office-monthly-report"
}
import {
  to = aws_lambda_function.this["fl-synago-weekly-tip-generator"]
  id = "fl-synago-weekly-tip-generator"
}

import {
  to = aws_lambda_function_url.dev_graphql
  id = "dev-fl-synago-graphql"
}

# --- IAM roles --------------------------------------------------------------
import {
  to = aws_iam_role.fl_lambda_functions
  id = "fl-lambda-functions"
}
import {
  to = aws_iam_role.fl_synago_graphql
  id = "fl-synago-graphql-role-1fc95k40"
}

# --- IAM managed-policy attachments (id = "role-name/policy-arn") -----------
import {
  to = aws_iam_role_policy_attachment.fl_lambda_functions_secrets_rw
  id = "fl-lambda-functions/arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}
import {
  to = aws_iam_role_policy_attachment.fl_lambda_functions_basic_exec
  id = "fl-lambda-functions/arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
import {
  to = aws_iam_role_policy_attachment.graphql_secrets_rw
  id = "fl-synago-graphql-role-1fc95k40/arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}
import {
  to = aws_iam_role_policy_attachment.graphql_basic_exec
  id = "fl-synago-graphql-role-1fc95k40/arn:aws:iam::871777052000:policy/service-role/AWSLambdaBasicExecutionRole-bec13c64-bdec-41d2-9894-6e81740f150c"
}

# --- IAM inline role policies (id = "role-name:policy-name") ----------------
import {
  to = aws_iam_role_policy.access_dev_flc_secrets
  id = "fl-lambda-functions:AccessDevFLCSecrets"
}
import {
  to = aws_iam_role_policy.access_flc_production_secrets
  id = "fl-lambda-functions:AccessFLCProductionSecrets"
}
import {
  to = aws_iam_role_policy.access_flc_cors_origins
  id = "fl-lambda-functions:AccessFLCCorsOrigins"
}
import {
  to = aws_iam_role_policy.lambda_invoke_notification_service
  id = "fl-lambda-functions:lambda-invoke-notification-service"
}
import {
  to = aws_iam_role_policy.call_flc_notify_lambda
  id = "fl-synago-graphql-role-1fc95k40:CallFLCNotifyLambda"
}

# --- API Gateway APIs -------------------------------------------------------
import {
  to = aws_apigatewayv2_api.api_synago
  id = "wexe5r7yzd"
}
import {
  to = aws_apigatewayv2_api.dev_graphql
  id = "p30wkvgyo6"
}
import {
  to = aws_apigatewayv2_api.staging_graphql
  id = "y191o0o7g2"
}

# --- API Gateway integrations (id = "api-id/integration-id") ----------------
import {
  to = aws_apigatewayv2_integration.synago_graphql
  id = "wexe5r7yzd/a1kq4yd"
}
import {
  to = aws_apigatewayv2_integration.synago_webhook
  id = "wexe5r7yzd/bof5wmt"
}
import {
  to = aws_apigatewayv2_integration.dev_graphql
  id = "p30wkvgyo6/u4fi21d"
}
import {
  to = aws_apigatewayv2_integration.staging_graphql
  id = "y191o0o7g2/71gi998"
}

# --- API Gateway routes (id = "api-id/route-id") ----------------------------
import {
  to = aws_apigatewayv2_route.synago_get_root
  id = "wexe5r7yzd/2x04482"
}
import {
  to = aws_apigatewayv2_route.synago_options_root
  id = "wexe5r7yzd/am4xiqe"
}
import {
  to = aws_apigatewayv2_route.synago_post_root
  id = "wexe5r7yzd/fqgy8oq"
}
import {
  to = aws_apigatewayv2_route.synago_post_graphql
  id = "wexe5r7yzd/rnb7v0q"
}
import {
  to = aws_apigatewayv2_route.synago_downloads
  id = "wexe5r7yzd/oeol5fm"
}
import {
  to = aws_apigatewayv2_route.synago_webhook
  id = "wexe5r7yzd/c2ts5i9"
}
import {
  to = aws_apigatewayv2_route.synago_options_graphql
  id = "wexe5r7yzd/h1973d7"
}
import {
  to = aws_apigatewayv2_route.dev_named
  id = "p30wkvgyo6/31c0dms"
}
import {
  to = aws_apigatewayv2_route.dev_graphql_route
  id = "p30wkvgyo6/gsmvcrq"
}
import {
  to = aws_apigatewayv2_route.dev_downloads
  id = "p30wkvgyo6/v2ovndp"
}
import {
  to = aws_apigatewayv2_route.staging_graphql_route
  id = "y191o0o7g2/12pfj9p"
}
import {
  to = aws_apigatewayv2_route.staging_downloads
  id = "y191o0o7g2/6d37j4o"
}
import {
  to = aws_apigatewayv2_route.staging_named
  id = "y191o0o7g2/iid5ob7"
}

# --- API Gateway stages (id = "api-id/stage-name") --------------------------
import {
  to = aws_apigatewayv2_stage.synago
  id = "wexe5r7yzd/$default"
}
import {
  to = aws_apigatewayv2_stage.dev_graphql
  id = "p30wkvgyo6/default"
}
import {
  to = aws_apigatewayv2_stage.staging_graphql
  id = "y191o0o7g2/default"
}

# --- Lambda permissions (id = "function-name/statement-id") -----------------
import {
  to = aws_lambda_permission.synago_graphql_root
  id = "fl-synago-graphql/8c3a3f64-60e3-585f-9979-c48095e7184e"
}
import {
  to = aws_lambda_permission.synago_graphql_graphql
  id = "fl-synago-graphql/2ca2cce5-6756-53e5-b7d8-f58aae28b501"
}
import {
  to = aws_lambda_permission.synago_graphql_downloads
  id = "fl-synago-graphql/24f67973-e01c-5b53-b351-b59b9a5db2f5"
}
import {
  to = aws_lambda_permission.synago_webhook
  id = "fl-synago-payment-webhook/e6cd4bdc-1176-51cc-baf9-a6abb1d652cf"
}
import {
  to = aws_lambda_permission.dev_graphql_named
  id = "dev-fl-synago-graphql/lambda-9dae8a78-6597-423c-86b3-97b136b0601f"
}
import {
  to = aws_lambda_permission.dev_graphql_graphql
  id = "dev-fl-synago-graphql/5041a8ef-ca90-55b4-b17a-76f867d528bb"
}
import {
  to = aws_lambda_permission.dev_graphql_downloads
  id = "dev-fl-synago-graphql/b26aa43e-ef26-572c-9bd7-babcb23fbe32"
}
import {
  to = aws_lambda_permission.staging_graphql_named
  id = "staging-fl-synago-graphql/lambda-1edbaac2-2447-4297-9506-59d6d5faeeb3"
}
import {
  to = aws_lambda_permission.staging_graphql_graphql
  id = "staging-fl-synago-graphql/f404be5c-9511-53ff-bbb5-cbb3f26b16b3"
}
import {
  to = aws_lambda_permission.staging_graphql_downloads
  id = "staging-fl-synago-graphql/a8431098-86d5-5e78-b772-121350c78c9d"
}

# --- EventBridge schedules (id = "group-name/schedule-name") ----------------
import {
  to = aws_scheduler_schedule.outside_accra_weekly
  id = "default/fl-synago-outside-accra-weekly"
}
import {
  to = aws_scheduler_schedule.outside_accra_weekly_saturday
  id = "default/fl-synago-outside-accra-weekly-saturday"
}
import {
  to = aws_scheduler_schedule.accra_campus_weekly
  id = "default/fl-synago-accra-campus-weekly"
}
import {
  to = aws_scheduler_schedule.accra_new_members
  id = "default/fl-synago-accra-new-members"
}
import {
  to = aws_scheduler_schedule.bacenta_graph_aggregator
  id = "default/fl-synago-bacenta-graph-aggregator"
}
import {
  to = aws_scheduler_schedule.service_graph_aggregator
  id = "default/fl-synago-service-graph-aggregator"
}
import {
  to = aws_scheduler_schedule.services_not_banked
  id = "default/fl-synago-services-not-banked"
}
import {
  to = aws_scheduler_schedule.code_of_the_day
  id = "default/set_fl-synago-code-of-the-day"
}
import {
  to = aws_scheduler_schedule.den_office_monthly_report
  id = "default/fl-synago-den-office-monthly-report"
}

# --- Amplify ----------------------------------------------------------------
import {
  to = aws_amplify_app.portal
  id = "dti54uhzqmdg1"
}
import {
  to = aws_amplify_branch.this["main"]
  id = "dti54uhzqmdg1/main"
}
import {
  to = aws_amplify_branch.this["dev"]
  id = "dti54uhzqmdg1/dev"
}
import {
  to = aws_amplify_branch.this["staging"]
  id = "dti54uhzqmdg1/staging"
}
import {
  to = aws_amplify_branch.this["SYN-service-checkin"]
  id = "dti54uhzqmdg1/SYN-service-checkin"
}
import {
  to = aws_amplify_domain_association.main
  id = "dti54uhzqmdg1/firstlovecenter.com"
}

# --- S3 buckets -------------------------------------------------------------
import {
  to = aws_s3_bucket.fl_admin_apps
  id = "fl-admin-apps"
}
import {
  to = aws_s3_bucket.fl_admin_apps_dev
  id = "fl-admin-apps-dev"
}
import {
  to = aws_s3_bucket.fl_synago_react
  id = "fl-synago-react"
}
import {
  to = aws_s3_bucket_server_side_encryption_configuration.fl_admin_apps
  id = "fl-admin-apps"
}
import {
  to = aws_s3_bucket_server_side_encryption_configuration.fl_admin_apps_dev
  id = "fl-admin-apps-dev"
}
import {
  to = aws_s3_bucket_server_side_encryption_configuration.fl_synago_react
  id = "fl-synago-react"
}
import {
  to = aws_s3_bucket_public_access_block.fl_admin_apps
  id = "fl-admin-apps"
}
import {
  to = aws_s3_bucket_public_access_block.fl_admin_apps_dev
  id = "fl-admin-apps-dev"
}
import {
  to = aws_s3_bucket_public_access_block.fl_synago_react
  id = "fl-synago-react"
}
import {
  to = aws_s3_bucket_policy.fl_admin_apps
  id = "fl-admin-apps"
}
import {
  to = aws_s3_bucket_policy.fl_admin_apps_dev
  id = "fl-admin-apps-dev"
}
import {
  to = aws_s3_bucket_policy.fl_synago_react
  id = "fl-synago-react"
}
import {
  to = aws_s3_bucket_cors_configuration.fl_admin_apps
  id = "fl-admin-apps"
}
import {
  to = aws_s3_bucket_cors_configuration.fl_admin_apps_dev
  id = "fl-admin-apps-dev"
}
