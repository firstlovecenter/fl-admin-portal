# =============================================================================
# S3 buckets
#
# - fl-admin-apps      : prod app asset bucket (public-read, CORS for prod web)
# - fl-admin-apps-dev  : dev app asset bucket (public-read, CORS for localhost)
# - fl-synago-react    : legacy static frontend, private, fronted by CloudFront
#                        distribution E3H00O2VW24DR9 (that distribution is left
#                        UNMANAGED — superseded by Amplify).
#
# Versioning is disabled on all three (live state), so no versioning resource
# is declared.
# =============================================================================

# -----------------------------------------------------------------------------
# fl-admin-apps (prod)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "fl_admin_apps" {
  bucket = "fl-admin-apps"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "fl_admin_apps" {
  bucket = aws_s3_bucket.fl_admin_apps.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "fl_admin_apps" {
  bucket                  = aws_s3_bucket.fl_admin_apps.id
  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "fl_admin_apps" {
  bucket = aws_s3_bucket.fl_admin_apps.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "arn:aws:s3:::fl-admin-apps/*"
    }]
  })
}

resource "aws_s3_bucket_cors_configuration" "fl_admin_apps" {
  bucket = aws_s3_bucket.fl_admin_apps.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["https://synago.firstlovecenter.com", "https://admin.firstlovecenter.com"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# -----------------------------------------------------------------------------
# fl-admin-apps-dev (dev)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "fl_admin_apps_dev" {
  bucket = "fl-admin-apps-dev"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "fl_admin_apps_dev" {
  bucket = aws_s3_bucket.fl_admin_apps_dev.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "fl_admin_apps_dev" {
  bucket                  = aws_s3_bucket.fl_admin_apps_dev.id
  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "fl_admin_apps_dev" {
  bucket = aws_s3_bucket.fl_admin_apps_dev.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "arn:aws:s3:::fl-admin-apps-dev/*"
    }]
  })
}

resource "aws_s3_bucket_cors_configuration" "fl_admin_apps_dev" {
  bucket = aws_s3_bucket.fl_admin_apps_dev.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["http://localhost:4001", "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# -----------------------------------------------------------------------------
# fl-synago-react (legacy, private, CloudFront OAC)
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "fl_synago_react" {
  bucket = "fl-synago-react"
  tags = {
    client = "firstlovecenter"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "fl_synago_react" {
  bucket = aws_s3_bucket.fl_synago_react.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "fl_synago_react" {
  bucket                  = aws_s3_bucket.fl_synago_react.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "fl_synago_react" {
  bucket = aws_s3_bucket.fl_synago_react.id
  policy = jsonencode({
    Version = "2008-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipal"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "arn:aws:s3:::fl-synago-react/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = "arn:aws:cloudfront::871777052000:distribution/E3H00O2VW24DR9"
        }
      }
    }]
  })
}
