# AWS IAM Permissions for Secrets Manager - Step-by-Step Guide

## 🎯 What You're Trying to Do

Give your **Amplify app** permission to **read secrets** from Secrets Manager during the build process.

Think of it like this:
- 🏠 Secrets Manager = Your locked safe with passwords
- 🤖 Amplify = A robot trying to build your app
- 🔑 IAM Policy = The key you give the robot to open the safe

**Without the key**: Build fails with "AccessDeniedException"  
**With the key**: Build succeeds ✅

---

## 📋 Step-by-Step Instructions

### Step 1: Find Your Amplify Service Role

#### ⚠️ Can't Find Service Role in Amplify Console?

**Check your build logs instead!** The error message shows the exact role:

1. **Go to Amplify Console** → Your App
2. Click on a **failed build**
3. Look for the error message like:
   ```
   User: arn:aws:sts::499901155257:assumed-role/
   AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E/...
   ```
4. **Copy the role name** from the ARN:
   - Full ARN: `arn:aws:sts::499901155257:assumed-role/AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E/...`
   - **Role name**: `AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E`
   
5. This is your **CodeBuild role** - you need to add permissions to THIS role

**In your case**, the role is:
```
AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E
```

Skip to **Step 2** and use this role name!

---

#### ⚠️ If You See "No service role set"

**Don't panic!** You need to create one first. Here's how:

1. **Still in Amplify Console** → **App settings** → **General**
2. Scroll to **"Service role"** section
3. Click the **"Edit"** button (next to "No service role set")
4. You'll see two options:

   **Option A: Create new role** (Recommended)
   - Select **"Create and use a new service role"**
   - AWS will auto-generate a role name like `amplifyconsole-backend-role-XXXXX`
   - Click **"Save"**
   - ✅ AWS creates the role automatically!
   
   **Option B: Use existing role** (If you already have one)
   - Select **"Use an existing service role"**
   - Choose from dropdown
   - Click **"Save"**

5. **Wait 30 seconds** for the role to be created
6. **Refresh the page**
7. You should now see the role name under "Service role"
8. **Copy this role name** - you'll need it in Step 3!

#### Visual Guide:
```
┌─────────────────────────────────────────┐
│ General settings                        │
│ ┌─────────────────────────────────────┐│
│ │ Service role                        ││
│ │ No service role set        [Edit]  ││  ← Click Edit
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘

After clicking Edit:
┌─────────────────────────────────────────┐
│ Edit service role                       │
├─────────────────────────────────────────┤
│ ⚫ Create and use a new service role    │ ← Select this
│    AWS Amplify will create a role       │
│                                         │
│ ⚪ Use an existing service role         │
│    [Select role ▼]                      │
│                                         │
│              [Cancel]  [Save]           │ ← Click Save
└─────────────────────────────────────────┘
```

#### After Creating the Role

Go back to **App settings** → **General** and you should see:
```
Service role: amplifyconsole-backend-role-a1b2c3d4
              ↑ Copy this name!
```

Now continue to **Step 2** below to add permissions to this role.

---

#### Option A: Via Amplify Console (Easiest)

1. **Go to AWS Amplify Console**
   - URL: https://console.aws.amazon.com/amplify
   - Or search "Amplify" in AWS Console search bar

2. **Click on your app** (fl-admin-portal)

3. **Go to App settings** (left sidebar) → **General**

4. **Scroll down** to find "Service role"
   - You'll see something like: `amplifyconsole-backend-role`
   - Or: `AmplifyServiceRole-d1e2f3g4h5`
   
5. **Copy this role name** - you'll need it!

#### Visual Guide:
```
┌─────────────────────────────────────────┐
│ AWS Amplify Console                     │
├─────────────────────────────────────────┤
│ [Your App Name]                         │
│                                         │
│ App settings                            │
│  ├─ General              ← Click here  │
│  ├─ Environment vars                   │
│  └─ Build settings                     │
│                                         │
│ General settings                        │
│ ┌─────────────────────────────────────┐│
│ │ Service role                        ││
│ │ amplifyconsole-backend-role  ← Copy││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

#### Option B: Via AWS CLI

```bash
# List all Amplify apps
aws amplify list-apps --query 'apps[*].[name,defaultDomain,appId]' --output table

# Get service role for specific app
aws amplify get-app --app-id YOUR_APP_ID --query 'app.iamServiceRoleArn'
```

---

### Step 2: Open IAM Console

1. **Search for "IAM"** in the AWS Console search bar (top)
2. Click **IAM** (Identity and Access Management)
3. You should see the IAM Dashboard

#### Visual Guide:
```
┌─────────────────────────────────────────┐
│ AWS Console                    [Search]│
│                                         │
│ Type: IAM                               │
│ Results:                                │
│  ⭐ IAM                                 │
│     Identity and Access Management      │
│                                ← Click  │
└─────────────────────────────────────────┘
```

---

### Step 3: Find Your Role

**⚠️ EXPERT MODE: Role Not Found?**

If you can't find the role in IAM, here's what's happening:

#### Understanding the ARN

Your error shows:
```
arn:aws:sts::499901155257:assumed-role/
AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E/
AWSCodeBuild-628e205e-0abe-43d3-ae74-aeac4005038b
```

Let's break this down:
- `sts` = **Security Token Service** (temporary credentials, not a permanent role)
- `499901155257` = **AWS Account ID** where the role exists
- `AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E` = **Actual IAM role name**
- `AWSCodeBuild-628e205e...` = **Session name** (temporary, changes each build)

#### Why You Can't Find It

**Scenario 1: Wrong AWS Account**
The role is in account `499901155257`. Check which account you're logged into:

1. Click your username (top right of AWS Console)
2. Look for "Account ID"
3. **If different from `499901155257`**: You're in the wrong account!

**Solution**: 
- Switch to the correct AWS account (499901155257)
- Or ask your admin for access to that account
- Or have someone with access to that account add the policy

**Scenario 2: Different Region**
IAM is global, but sometimes roles don't show up if:
- You have region-specific filters
- You don't have `iam:ListRoles` permission

**Solution**:
```bash
# Via AWS CLI - check if role exists
aws iam get-role --role-name AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E

# If you get the role details, it exists
# If you get "NoSuchEntity", it's not in this account
```

**Scenario 3: Service-Linked or Cross-Account Role**
The "AemiliaControlPlaneLambda" naming suggests:
- Custom infrastructure/control plane
- Possibly managed by AWS Organizations
- Might be a cross-account role
- Could be managed by another team

**Solution**: 
- Check with your DevOps/Platform team
- They might need to add the policy
- Ask: "Who manages the AemiliaControlPlaneLambda infrastructure?"

**Scenario 4: Insufficient IAM Permissions**
You might not have permission to view all roles.

**Solution**:
```bash
# Check your permissions
aws iam get-user

# Try to get the specific role
aws iam get-role --role-name AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E
```

#### Alternative: Use AWS CLI to Add Policy Directly

If you have `iam:PutRolePolicy` permission but can't see the role in console:

```bash
# Create the policy
cat > secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
    }
  ]
}
EOF

# Attach it to the role
aws iam put-role-policy \
  --role-name AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E \
  --policy-name SecretsManagerAccess \
  --policy-document file://secrets-policy.json
```

#### What to Do Next

1. **Verify your AWS account**: Is it `499901155257`?
   ```bash
   aws sts get-caller-identity
   ```

2. **If wrong account**: Ask for access or have admin add policy

3. **If right account but can't find role**: Try CLI method above

4. **If still stuck**: This is a custom infrastructure setup
   - Contact your DevOps/Platform team
   - Share the error message
   - Ask them to add Secrets Manager permissions to the CodeBuild role

---

#### If You CAN Find the Role

1. In IAM Dashboard, click **Roles** (left sidebar)

2. In the search box, paste your role name:
   - Your role: `AemiliaControlPlaneLambda-CodeBuildRole-FWJ0802Z113E`
   - Example: `amplifyconsole-backend-role`

3. Click on the role name to open it

#### Visual Guide:
```
┌─────────────────────────────────────────┐
│ IAM > Roles                             │
├─────────────────────────────────────────┤
│ [Search roles] 🔍                       │
│  Type: amplifyconsole-backend-role      │
│                                         │
│ Results:                                │
│ ☑️ amplifyconsole-backend-role  ← Click│
└─────────────────────────────────────────┘
```

---

### Step 4: Add Permission Policy

Now you're inside the role page. Here's where you add permissions:

1. **Click the "Permissions" tab** (should be selected by default)

2. **Click "Add permissions"** button (blue button on the right)

3. **Select "Create inline policy"**
   - Not "Attach policies" - we're creating a new one

#### Visual Guide:
```
┌─────────────────────────────────────────┐
│ Role: amplifyconsole-backend-role       │
├─────────────────────────────────────────┤
│ [Permissions] [Trust relationships]     │
│                                         │
│            [Add permissions ▼]  ← Click│
│                                         │
│ Dropdown options:                       │
│  • Attach policies                      │
│  • Create inline policy      ← Select  │
│  • Set permissions boundary             │
└─────────────────────────────────────────┘
```

---

### Step 5: Create the Policy

You'll now see the policy editor. There are two ways to do this:

#### Method 1: JSON Editor (Recommended - Copy & Paste)

1. **Click the "JSON" tab** (top of the editor)

2. **Delete everything** in the text box

3. **Copy and paste this exactly**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
    }
  ]
}
```

4. **Click "Review policy"** (bottom right)

#### What This Means:
```
{
  "Effect": "Allow",           ← Allow access (not deny)
  "Action": [
    "secretsmanager:           ← From Secrets Manager service
     GetSecretValue"           ← Only read secrets (not write/delete)
  ],
  "Resource":                  ← Which secrets?
    "arn:aws:secretsmanager:   ← AWS resource identifier
     *:*:                      ← Any region, any account
     secret:fl-admin-portal/*" ← Only secrets starting with "fl-admin-portal/"
}
```

#### Method 2: Visual Editor (If you prefer clicking)

1. **Service**: Search and select "Secrets Manager"

2. **Actions**: 
   - Expand "Read" section
   - Check ✅ "GetSecretValue"

3. **Resources**:
   - Click "Add ARN"
   - For "Secret name": Enter `fl-admin-portal/*`
   - Click "Add"

4. **Click "Review policy"**

---

### Step 6: Name and Create the Policy

1. **Policy name**: Enter `SecretsManagerAccess`
   - Or any name you like (e.g., `AmplifyReadSecrets`)

2. **Description** (optional): 
   ```
   Allows Amplify to read secrets from fl-admin-portal/* in Secrets Manager
   ```

3. **Click "Create policy"** (blue button)

#### Visual Guide:
```
┌─────────────────────────────────────────┐
│ Review policy                           │
├─────────────────────────────────────────┤
│ Name *                                  │
│ [SecretsManagerAccess            ]     │
│                                         │
│ Description (optional)                  │
│ [Allows Amplify to read secrets...]    │
│                                         │
│                    [Create policy]  ← Click│
└─────────────────────────────────────────┘
```

---

### Step 7: Verify It Worked

1. You should see a **green success banner**:
   ```
   ✅ Successfully created policy SecretsManagerAccess
   ```

2. You should now see the policy in the list:
   ```
   Permissions policies (2)
   ├─ AWSLambdaBasicExecutionRole-xxx
   └─ SecretsManagerAccess  ← Your new policy!
   ```

3. Click on **"SecretsManagerAccess"** to expand and verify:
   - Action: `secretsmanager:GetSecretValue`
   - Resource: `arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*`

---

## ✅ Testing

Now test if it works:

1. Go back to **Amplify Console**
2. Click **"Run build"**
3. Watch the build logs

**Success looks like:**
```
Fetching secrets from AWS Secrets Manager...
✓ Loaded 18 environment variables
✓ Installing dependencies
```

**Failure looks like:**
```
❌ AccessDeniedException: User is not authorized to perform: 
   secretsmanager:GetSecretValue on resource: fl-admin-portal/main
```

---

## 🆘 Troubleshooting

### Error: "AccessDeniedException"

**Problem**: The permission isn't working.

**Solutions to try**:

1. **Wait 1-2 minutes** - IAM changes take time to propagate

2. **Check the policy JSON** - Make sure you copied it exactly:
   - Go to IAM → Roles → Your role → Permissions
   - Click on "SecretsManagerAccess"
   - Click "Edit policy" → JSON tab
   - Verify it matches exactly

3. **Check the secret name** - Must be exactly `fl-admin-portal/main`:
   ```bash
   # List your secrets
   aws secretsmanager list-secrets --query 'SecretList[*].Name'
   ```

4. **Check the region** - Secret and Amplify should be in the same region (or use `*` in ARN)

### Error: "Policy name already exists"

**Problem**: You already created a policy with that name.

**Solution**: Use a different name like `AmplifySecretsAccess` or delete the old one first.

### Can't Find the Service Role

**Problem**: "Service role" field shows "No service role set" in Amplify.

**Solution**: 
1. Go to **App settings** → **General**
2. Scroll to **"Service role"** section
3. Click **"Edit"** button
4. Select **"Create and use a new service role"**
5. Click **"Save"**
6. Wait 30 seconds, then refresh the page
7. You should now see the role name
8. **Copy the role name** and continue with Step 2

**What AWS creates for you**:
- Role name: `amplifyconsole-backend-role-XXXXX`
- Basic permissions: Lambda execution (but NOT Secrets Manager yet!)
- You still need to add Secrets Manager permissions (continue with Step 2)

---

### Permission Added But Still Fails

**Problem**: Everything looks right but build still fails.

**Checklist**:
- [ ] Secret exists in Secrets Manager? (`fl-admin-portal/main`)
- [ ] Policy resource matches secret name? (`fl-admin-portal/*`)
- [ ] Waited 2 minutes after adding policy?
- [ ] Cleared Amplify build cache? (Settings → Build → Clear cache)
- [ ] Checked CloudWatch logs for exact error?

---

## 🔍 Understanding IAM Policies (Deep Dive)

### The Three Parts of Every Policy

```json
{
  "Effect": "Allow",     ← 1. What to do (Allow or Deny)
  "Action": [...],       ← 2. What action to allow
  "Resource": "..."      ← 3. On which resources
}
```

### Example Variations

#### Too Permissive (Don't use - security risk):
```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:*",          ← All actions (read, write, delete!)
  "Resource": "*"                        ← All secrets everywhere!
}
```

#### Too Restrictive (Will fail):
```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:us-east-1:123456789:secret:fl-admin-portal/main"
                                          ↑ Only ONE specific secret, not all branches!
}
```

#### Just Right ✅:
```json
{
  "Effect": "Allow",
  "Action": "secretsmanager:GetSecretValue",  ← Only read
  "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
              ↑ Any region  ↑ Any account  ↑ All fl-admin-portal secrets
}
```

---

## 📝 Quick Reference

### Full Process Summary

```bash
1. Amplify Console → App → General → Copy "Service role"
   ↓
2. IAM Console → Roles → Search for role → Click it
   ↓
3. Permissions tab → Add permissions → Create inline policy
   ↓
4. JSON tab → Paste policy → Review
   ↓
5. Name it "SecretsManagerAccess" → Create
   ↓
6. Test: Amplify → Run build
```

### The Magic Policy (Copy This!)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
    }
  ]
}
```

### Quick Verification Commands

```bash
# Check if secret exists
aws secretsmanager describe-secret --secret-id fl-admin-portal/main

# Check what permissions the role has
aws iam get-role-policy --role-name amplifyconsole-backend-role --policy-name SecretsManagerAccess

# Test reading the secret (simulate what Amplify does)
aws secretsmanager get-secret-value --secret-id fl-admin-portal/main --query SecretString
```

---

## 🎓 Why This Works

When Amplify runs your build:

1. **Amplify assumes the service role** (like putting on a costume)
2. **Checks IAM policies** attached to that role (what can this costume do?)
3. **Tries to read secrets** using the policy permissions
4. **AWS checks**: Does the policy allow `secretsmanager:GetSecretValue` on `fl-admin-portal/*`?
5. **If yes** ✅ → Returns secrets → Build continues
6. **If no** ❌ → Returns AccessDenied → Build fails

---

**Need more help?** 
- AWS IAM docs: https://docs.aws.amazon.com/IAM/latest/UserGuide/
- Ask in the thread and I'll help debug!

**Last Updated**: January 8, 2026
