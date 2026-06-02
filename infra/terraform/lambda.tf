# =============================================================================
# Lambda functions
#
# Code is deployed out-of-band by CI (GitHub Actions / Amplify), NOT Terraform.
# We attach a tiny placeholder zip purely to satisfy the required argument and
# then ignore all code attributes, so `terraform apply` never redeploys code.
# =============================================================================

data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/build/placeholder.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'placeholder' });"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "this" {
  for_each = local.lambdas

  function_name = each.key
  description   = lookup(each.value, "description", null)
  role          = each.value.role
  runtime       = each.value.runtime
  handler       = each.value.handler
  memory_size   = each.value.memory_size
  timeout       = each.value.timeout
  architectures = each.value.architectures

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  ephemeral_storage {
    size = each.value.ephemeral_storage
  }

  dynamic "environment" {
    for_each = length(each.value.environment) > 0 ? [1] : []
    content {
      variables = each.value.environment
    }
  }

  lifecycle {
    # CI owns the deployment package — never let Terraform push code.
    # `environment` is ignored so live env vars (incl. the prod MAILGUN_API_KEY
    # secret) stay untouched and no secret is ever needed in Terraform.
    ignore_changes = [filename, source_code_hash, layers, environment]
  }
}

# -----------------------------------------------------------------------------
# Function URL on dev-fl-synago-graphql (auth NONE). The associated public-
# access resource-policy statements are left unmanaged (the URL resource and
# the resource policy are independent in AWS).
# -----------------------------------------------------------------------------
resource "aws_lambda_function_url" "dev_graphql" {
  function_name      = aws_lambda_function.this["dev-fl-synago-graphql"].function_name
  authorization_type = "NONE"
  invoke_mode        = "BUFFERED"
}
