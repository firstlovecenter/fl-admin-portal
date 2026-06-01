# FL Admin Portal — Core Infrastructure (Terraform)

Terraform reverse-engineered from the **live** AWS account `871777052000`
(`eu-west-2`) for the core portal: Amplify frontend, the GraphQL + background
Lambdas, their API Gateways, EventBridge schedules, S3 asset buckets, and the
IAM roles that tie them together.

This config **adopts** existing infrastructure via [`import` blocks](imports.tf).
Nothing is created from scratch — the goal of the first `plan` is to reconcile
state to reality with **zero** changes.

## Scope

| Group | Resources |
| --- | --- |
| Amplify | 1 app (`fl-admin-portal`), 4 branches, 1 domain association |
| Lambda | 14 functions (4 GraphQL incl. dev/staging + 10 background) + 1 Function URL |
| API Gateway | 3 HTTP APIs (`api-synago`, dev, staging) + integrations/routes/stages |
| Scheduler | 9 EventBridge schedules |
| S3 | `fl-admin-apps`, `fl-admin-apps-dev`, `fl-synago-react` |
| IAM | `fl-lambda-functions`, `fl-synago-graphql-role-1fc95k40` + policies |
| Secrets | `prod|dev|staging/fl-admin-portal` (**referenced via data source, not managed**) |

### Deliberately NOT managed

- **Secret values** — referenced only; content stays manual in Secrets Manager.
- **Lambda code** — deployed by CI; `ignore_changes` keeps Terraform off it.
- **Amplify env vars + build spec** — hold live secrets (GitHub PAT, Slack
  webhook, Maps key); left console-managed under `ignore_changes`.
- **CloudFront `E3H00O2VW24DR9`** (fronts `fl-synago-react`) — legacy, unmanaged.
- **EventBridge Scheduler role** `Amazon_EventBridge_Scheduler_LAMBDA_8338f6a258`
  — referenced by ARN (`var.scheduler_role_arn`).
- Auth microservice, notify service, poimen, and unrelated buckets — out of scope.

## Environment model

> **Note on the requested workspaces layout:** a pure `terraform workspace`
> split doesn't fit this account cleanly — the Amplify app is a single object
> spanning all branches, several resources are prod-only singletons, and live
> names use inconsistent prefixes (`dev-`, `staging-`, and a `-dev` suffix).
> Forcing per-workspace state would cause name collisions on the shared
> singletons. Instead this uses a **single state** with per-environment values
> expressed through `for_each` maps in [`locals.tf`](locals.tf) — DRY, and an
> honest 1:1 with what exists. Per-env `.tfvars` are still supported for the
> sensitive values. If you'd rather have hard env isolation, the cleanest
> refactor is **separate directories per env**, not workspaces — ask and it can
> be restructured.

## Usage

```bash
cd infra/terraform

# 1. Init providers (local state by default — see backend.tf for S3).
#    Requires AWS provider >= 6.0 (for the nodejs24.x runtime) and
#    Terraform >= 1.5 (for import blocks).
terraform init

# 2. Dry-run the adopt. Expect: "88 to import, 0 to add, 0 to change, 0 to destroy"
terraform plan

# 3. Adopt into state
terraform apply

# 4. Once green, the import blocks can be deleted (state already holds them)
```

No secret variables are required — Lambda and Amplify env vars (which hold the
live secrets) are under `ignore_changes`, so nothing sensitive enters Terraform.

Credentials come from your standard AWS chain (`~/.aws`, env, or SSO). The
account must be `871777052000` / region `eu-west-2`.

## Reading a non-clean plan

If `plan` shows **changes** (not just imports), reconcile before applying:

- **Tag additions** — shouldn't happen (no `default_tags`); if so, something
  added tags out-of-band.
- **Lambda `environment` / `runtime` / `memory` / `timeout` drift** — the live
  function changed since this was generated; update [`locals.tf`](locals.tf) to
  match, then re-plan. (`environment` is under `ignore_changes`, so env-var
  changes alone won't show.)
- **`destroy`** — never apply a destroy during adoption. It means an `import`
  block is missing or a resource address is wrong.

## File map

| File | Contents |
| --- | --- |
| `versions.tf` / `providers.tf` / `backend.tf` | Provider + state setup |
| `variables.tf` / `data.tf` / `locals.tf` | Inputs, secret data sources, resource maps |
| `iam.tf` | The two Lambda execution roles + policies |
| `lambda.tf` | 14 functions + dev Function URL |
| `apigateway.tf` | 3 HTTP APIs + integrations/routes/stages + invoke permissions |
| `schedules.tf` | 9 EventBridge schedules |
| `amplify.tf` | App + branches + domain |
| `s3.tf` | 3 buckets + policy/PAB/encryption/CORS |
| `imports.tf` | All `import {}` blocks |
| `outputs.tf` | Endpoints, app id, secret ARNs |
