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
| Lambda | 13 functions (4 GraphQL incl. dev/staging + 9 background) + 1 Function URL |
| API Gateway | 3 HTTP APIs (`api-synago`, dev, staging) + integrations/routes/stages |
| Scheduler | 8 EventBridge schedules |
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

# 2. Dry-run the adopt. Expect: "86 to import, 0 to add, 0 to change, 0 to destroy",
#    apart from the expected changes under "Reading a non-clean plan" below.
#    After a first adoption (step 3), also follow the SYN-279 `destroy` note there.
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
- **`aws_amplify_app.portal` `custom_rule` change** — expected, and
  intentional (SYN-289). It replaces the live `/<*>` → `/index.html`
  `404-200` fallback with the SPA regex `200` rewrite, so deep links return
  HTTP 200 instead of 301 → 404. It affects every host on the app (admin.,
  synago., dev-synago., staging-synago.). Production change: get JD's OK
  before applying. Then verify:
  `curl -sI https://admin.firstlovecenter.com/arrivals/bacenta` → `200` with
  `x-robots-tag: noindex, nofollow` and no `location:` header, and
  `curl -sI https://admin.firstlovecenter.com/assets/does-not-exist.js` → `404`.
  The matching `X-Robots-Tag: noindex, nofollow` header ships from
  [`/customHttp.yml`](../../customHttp.yml) on the next Amplify build, not
  from Terraform.
- **`destroy` of `fl-synago-services-not-banked`** (the Lambda and its
  schedule) — expected, and intentional (SYN-279). The weekly "Services Not
  Banked" Google Sheet job is retired (its spreadsheet no longer exists), so
  neither is declared here any more, and this destroy is how they leave
  production. Nothing is deleted by hand. Production change: get JD's OK,
  and apply it only once this change is on `main`. Until then a `main`
  deploy still tries to update the function, and fails once it is gone.
  - If your state already holds them, run `terraform plan -out=retire.tfplan`.
    Expect `0 to add, 0 to change, 2 to destroy`, the two being
    `aws_lambda_function.this["fl-synago-services-not-banked"]` and
    `aws_scheduler_schedule.services_not_banked`. If anything else shows,
    settle it under its own note first, then plan again: a saved plan keeps
    whatever it was made with. Apply only a `retire.tfplan` that reads exactly
    that, with `terraform apply retire.tfplan`. Terraform removes the schedule
    before the function it targets.
  - If your state never adopted them, `plan` does not list them at all,
    because Terraform only destroys what its state holds. Finish the normal
    adoption first (Usage steps 2–3). Then, from `infra/terraform` on a clean
    tree, put back only SYN-279's Terraform removal and adopt just those two:

    ```bash
    C=$(git log -1 --format=%H -S services_not_banked -- :/infra/terraform/schedules.tf)
    git diff "$C^" "$C" -- :/infra/terraform/locals.tf \
      :/infra/terraform/schedules.tf :/infra/terraform/imports.tf | git apply -R
    terraform plan -target=aws_scheduler_schedule.services_not_banked -out=adopt.tfplan
    ```

    If `C` is empty, this checkout does not contain SYN-279: stop. If
    `git apply` fails because a later commit touched the same lines, copy the
    Lambda entry, the schedule and their two `import` blocks back by hand from
    `git show "$C^:infra/terraform/<file>"`. The plan must read
    `2 to import, 0 to add, 0 to change, 0 to destroy`. Apply it with
    `terraform apply adopt.tfplan`, restore the files with
    `git checkout -- :/infra/terraform`, then follow the step above.
  - The function's CloudWatch log group,
    `/aws/lambda/fl-synago-services-not-banked`, is not managed here and
    keeps the old logs after the destroy. Deleting it or shortening its
    retention is JD's call.
- **Any other `destroy`** — never apply a destroy during adoption. It means an
  `import` block is missing or a resource address is wrong.

## File map

| File | Contents |
| --- | --- |
| `versions.tf` / `providers.tf` / `backend.tf` | Provider + state setup |
| `variables.tf` / `data.tf` / `locals.tf` | Inputs, secret data sources, resource maps |
| `iam.tf` | The two Lambda execution roles + policies |
| `lambda.tf` | 13 functions + dev Function URL |
| `apigateway.tf` | 3 HTTP APIs + integrations/routes/stages + invoke permissions |
| `schedules.tf` | 8 EventBridge schedules |
| `amplify.tf` | App + branches + domain |
| `s3.tf` | 3 buckets + policy/PAB/encryption/CORS |
| `imports.tf` | All `import {}` blocks |
| `outputs.tf` | Endpoints, app id, secret ARNs |
