data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# The three environment secrets. Referenced (not managed) — Terraform never
# touches the secret values, which stay under manual control in Secrets
# Manager per the repo's secret-handling policy. Lambdas read these at runtime
# via the AWS_SECRET_NAME env var + the IAM read grants in iam.tf.
data "aws_secretsmanager_secret" "envs" {
  for_each = toset([
    "prod/fl-admin-portal",
    "dev/fl-admin-portal",
    "staging/fl-admin-portal",
  ])
  name = each.value
}
