# =============================================================================
# EventBridge Scheduler — one schedule per background job (plus the extra
# Saturday schedule for outside-accra-weekly). All target their lambda via the
# shared scheduler execution role (var.scheduler_role_arn).
#
# The scheduled lambdas have NO resource-based policy: invocation is authorized
# by the scheduler role, so there are deliberately no aws_lambda_permission
# resources here.
#
# Written as explicit resources (not for_each): on Terraform 1.5.x, a for_each
# resource that indexes into another not-yet-imported resource (the target
# lambda) can't be expanded during import validation.
# =============================================================================

resource "aws_scheduler_schedule" "outside_accra_weekly" {
  name                         = "fl-synago-outside-accra-weekly"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(55 23 ? * MON *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 5
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-outside-accra-weekly"].arn
    role_arn = var.scheduler_role_arn
    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

resource "aws_scheduler_schedule" "outside_accra_weekly_saturday" {
  name                         = "fl-synago-outside-accra-weekly-saturday"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(55 23 ? * SAT *)"
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode                      = "FLEXIBLE"
    maximum_window_in_minutes = 5
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-outside-accra-weekly"].arn
    role_arn = var.scheduler_role_arn
    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

resource "aws_scheduler_schedule" "accra_campus_weekly" {
  name                         = "fl-synago-accra-campus-weekly"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(30 23 ? * * *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-accra-campus-weekly"].arn
    role_arn = var.scheduler_role_arn
  }
}

resource "aws_scheduler_schedule" "accra_new_members" {
  name                         = "fl-synago-accra-new-members"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(00 09 ? * WED *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-accra-new-members"].arn
    role_arn = var.scheduler_role_arn
  }
}

resource "aws_scheduler_schedule" "bacenta_graph_aggregator" {
  name                         = "fl-synago-bacenta-graph-aggregator"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(30 * ? * * *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-bacenta-graph-aggregator"].arn
    role_arn = var.scheduler_role_arn
  }
}

resource "aws_scheduler_schedule" "service_graph_aggregator" {
  name                         = "fl-synago-service-graph-aggregator"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(0 * ? * * *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-service-graph-aggregator"].arn
    role_arn = var.scheduler_role_arn
  }
}

resource "aws_scheduler_schedule" "services_not_banked" {
  name                         = "fl-synago-services-not-banked"
  group_name                   = "default"
  state                        = "ENABLED"
  description                  = "Update the google sheet that has the data for the services not banked"
  schedule_expression          = "cron(30 23 ? * MON *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-services-not-banked"].arn
    role_arn = var.scheduler_role_arn
  }
}

resource "aws_scheduler_schedule" "code_of_the_day" {
  name                         = "set_fl-synago-code-of-the-day"
  group_name                   = "default"
  state                        = "ENABLED"
  description                  = "Trigger the lambda function to set the code of the day"
  schedule_expression          = "cron(30 00 * * ? *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-code-of-the-day"].arn
    role_arn = var.scheduler_role_arn
  }
}

resource "aws_scheduler_schedule" "den_office_monthly_report" {
  name                         = "fl-synago-den-office-monthly-report"
  group_name                   = "default"
  state                        = "ENABLED"
  schedule_expression          = "cron(00 08 1 * ? *)"
  schedule_expression_timezone = "Africa/Accra"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.this["fl-synago-den-office-monthly-report"].arn
    role_arn = var.scheduler_role_arn
  }
}
