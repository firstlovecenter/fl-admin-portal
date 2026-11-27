# =============================================================================
# AWS Amplify — frontend hosting
#
# environment_variables and build_spec are intentionally under ignore_changes:
#  - environment_variables hold live secrets (GitHub PAT, Slack webhook, Maps
#    key) that must NOT be committed. They stay managed in the Amplify console.
#  - build_spec is multi-hundred-line YAML; leaving it console-managed avoids
#    byte-for-byte reproduction drift.
#  - oauth_token / access_token are the GitHub connection credential.
# =============================================================================

resource "aws_amplify_app" "portal" {
  name                 = "fl-admin-portal"
  repository           = "https://github.com/firstlovecenter/fl-admin-portal"
  platform             = "WEB"
  iam_service_role_arn = "arn:aws:iam::871777052000:role/AmplifyServiceRole-fl-admin-portal"

  enable_branch_auto_build    = false
  enable_branch_auto_deletion = true

  # SPA rewrite (SYN-289). Extensionless paths (app routes such as
  # /arrivals/bacenta) are served /index.html with HTTP 200 at the edge.
  #
  # This replaces the old `/<*>` → /index.html "404-200" fallback. Under it,
  # Amplify's edge first 301'd /arrivals → /arrivals/ and then answered the
  # trailing-slash URL with index.html but status 404. Users never noticed,
  # because the SPA router took over, but Google and uptime monitors saw 404 on
  # every deep link.
  #
  # Paths whose extension is listed below are NOT rewritten. A 200 rewrite
  # applies even when the file exists, so this list MUST cover every static
  # file type the build ships (web-react-ts/public + dist). Otherwise e.g.
  # /site.webmanifest would come back as HTML. In return, a missing asset
  # (/assets/nope.js) still returns a real 404.
  # web-react-ts/src/hosting/spa-rewrite.test.ts guards the list against public/.
  #
  # Amplify-managed CloudFront cannot take a CloudFront Function or a response
  # headers policy. That is why this lives here, and why the noindex header
  # lives in /customHttp.yml.
  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|webmanifest|html|xml)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }

  lifecycle {
    ignore_changes = [
      environment_variables,
      build_spec,
      oauth_token,
      access_token,
    ]
  }
}

resource "aws_amplify_branch" "this" {
  for_each = {
    "main"                = "PRODUCTION"
    "dev"                 = "DEVELOPMENT"
    "staging"             = "NONE"
    "SYN-service-checkin" = "NONE" # feature branch — ephemeral
  }

  app_id      = aws_amplify_app.portal.id
  branch_name = each.key
  # The provider has no "NONE" stage enum; live "NONE" branches leave stage
  # unset, so pass null for them.
  stage             = each.value == "NONE" ? null : each.value
  enable_auto_build = true

  lifecycle {
    # main/staging carry branch-level env vars (VITE_* endpoints); leave them
    # console-managed alongside the app-level vars.
    ignore_changes = [environment_variables]
  }
}

resource "aws_amplify_domain_association" "main" {
  app_id                = aws_amplify_app.portal.id
  domain_name           = "firstlovecenter.com"
  wait_for_verification = false

  sub_domain {
    branch_name = "main"
    prefix      = "synago"
  }
  sub_domain {
    branch_name = "main"
    prefix      = "admin"
  }
  sub_domain {
    branch_name = "dev"
    prefix      = "dev-synago"
  }
  sub_domain {
    branch_name = "staging"
    prefix      = "staging-synago"
  }
}
