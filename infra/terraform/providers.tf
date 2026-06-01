provider "aws" {
  region = var.aws_region

  # NOTE: default_tags is intentionally NOT set. The live resources carry no
  # `ManagedBy`/`Project` tags, so adding default_tags would make the first
  # `terraform plan` show tag additions on every resource (a change, not a
  # clean adopt). Add tags deliberately in a follow-up once the import is
  # confirmed green.
}
