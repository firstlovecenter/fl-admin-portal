# State backend.
#
# Defaults to LOCAL state (terraform.tfstate in this directory) so you can run
# the first import/plan with zero setup. State will contain resource metadata
# but NO secret values (secrets are referenced, not managed — see data.tf and
# the ignore_changes blocks in amplify.tf / lambda.tf).
#
# For team use, move to a shared S3 backend with DynamoDB locking. Create the
# bucket + table first (manually or in a separate bootstrap config), then
# uncomment and run `terraform init -migrate-state`.
#
# terraform {
#   backend "s3" {
#     bucket         = "fl-admin-portal-tfstate"
#     key            = "core-portal/terraform.tfstate"
#     region         = "eu-west-2"
#     dynamodb_table = "fl-admin-portal-tflock"
#     encrypt        = true
#   }
# }
