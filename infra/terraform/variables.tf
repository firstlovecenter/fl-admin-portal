variable "aws_region" {
  type        = string
  default     = "eu-west-2"
  description = "AWS region hosting the FL Admin Portal core infrastructure."
}

variable "scheduler_role_arn" {
  type        = string
  default     = "arn:aws:iam::871777052000:role/service-role/Amazon_EventBridge_Scheduler_LAMBDA_8338f6a258"
  description = <<-EOT
    ARN of the shared EventBridge Scheduler execution role that invokes the
    scheduled lambdas. This role is auto-created/managed by the AWS console and
    is referenced (not managed) here so the schedules can point at it.
  EOT
}

# NOTE: This configuration needs NO secret variables. Lambda env vars and
# Amplify env vars (which hold the live secrets) are under `ignore_changes`,
# so secret values never enter Terraform or any tfvars file.
