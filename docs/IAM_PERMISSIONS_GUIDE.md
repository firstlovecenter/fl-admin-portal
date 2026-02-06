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

## 📋 Quick Summary

### The Policy You Need (Copy This!)

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

### Where to Put It

1. **AWS Amplify Console** → Your app → **App settings** → **General**
2. Find "**Service role**" → Click the role name link
3. **IAM** → **Permissions** → **Add permissions** → **Create inline policy**
4. **JSON** tab → Paste policy above
5. **Name it**: `SecretsManagerAccess`
6. **Create policy**
7. **Test**: Amplify → **Run build**

---

## 🔍 Understanding the Policy

```json
{
  "Effect": "Allow",                          ← Allow this access
  "Action": ["secretsmanager:GetSecretValue"], ← Only READ secrets
  "Resource": "arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*"
                                 ↑         ↑                ↑
                            Any Region  Any Account    Any fl-admin-portal secret
}
```

**What it means:**

- ✅ Can READ secrets from Secrets Manager
- ❌ Cannot DELETE secrets
- ❌ Cannot MODIFY secrets
- ✅ Can read any `fl-admin-portal/main`, `fl-admin-portal/develop`, etc.

---

## 🚀 Step-by-Step Instructions

### Step 1: Find Your Service Role in Amplify

1. Go to **AWS Amplify Console**: https://console.aws.amazon.com/amplify
2. Click your app: **fl-admin-portal**
3. Go to **App settings** → **General** (left sidebar)
4. Scroll down to **"Service role"**

**You'll see one of these:**

- ✅ `Service role: amplifyconsole-backend-role-a1b2c3`

  - **Good!** Copy this name and go to Step 2

- ❌ `Service role: No service role set`
  - Click **Edit** → Select "**Create and use a new service role**" → **Save**
  - Wait 30 seconds, refresh, then copy the role name

---

### Step 2: Go to IAM Console

1. Search for **"IAM"** in AWS Console search bar
2. Click **IAM** (Identity and Access Management)
3. Click **Roles** (left sidebar)

---

### Step 3: Find Your Role

1. In the **search box**, paste your role name from Step 1

   - Example: `amplifyconsole-backend-role`

2. Click on the role to open it

---

### Step 4: Add the Permission

1. Click the **"Permissions"** tab
2. Click **"Add permissions"** (blue button on the right)
3. Select **"Create inline policy"**

---

### Step 5: Paste the Policy

1. Click the **"JSON"** tab
2. **Delete** all existing content
3. **Copy and paste** this exactly:

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

4. Click **"Review policy"** (bottom right)

---

### Step 6: Name and Create

1. **Policy name**: Enter `SecretsManagerAccess`
2. **Description** (optional):
   ```
   Allows Amplify to read fl-admin-portal secrets from AWS Secrets Manager
   ```
3. Click **"Create policy"** (blue button)

---

### Step 7: Test It

1. Go back to **AWS Amplify Console**
2. Click **"Run build"**
3. Watch the build logs - should work now! ✅

**Success message:**

```
Fetching secrets from AWS Secrets Manager...
✓ Build started successfully
```

**Failure message:**

```
❌ AccessDeniedException: User is not authorized to perform secretsmanager:GetSecretValue
```

If it fails, wait 2 minutes (IAM changes propagate slowly) and try again.

---

## 🆘 Troubleshooting

### "AccessDeniedException" - Still Failing?

**Checklist:**

- [ ] Waited at least 2 minutes after creating the policy?
- [ ] Policy uses exactly this Resource: `arn:aws:secretsmanager:*:*:secret:fl-admin-portal/*`?
- [ ] Your secret in Secrets Manager starts with `fl-admin-portal/`?
- [ ] Cleared Amplify build cache? (Settings → Build → Clear cache)

**If still failing:**

```bash
# Verify the policy is attached
aws iam get-role-policy --role-name YOUR_ROLE_NAME --policy-name SecretsManagerAccess

# Verify the secret exists
aws secretsmanager describe-secret --secret-id fl-admin-portal/main
```

### "Policy name already exists"

**Solution**: Use a different name like `AmplifySecretsAccess`

### "No service role set" in Amplify

**Solution**:

1. Click **Edit** in the Service role field
2. Select **"Create and use a new service role"**
3. Click **Save**
4. Wait 30 seconds
5. Refresh the page
6. Role should now be created

---

## 📚 Related Docs

- [AWS_AMPLIFY_MIGRATION.md](AWS_AMPLIFY_MIGRATION.md) - Full deployment guide
- [AWS_SECRETS_MANAGER.md](AWS_SECRETS_MANAGER.md) - Secrets Manager setup
- [GITHUB_PACKAGES_AUTH.md](GITHUB_PACKAGES_AUTH.md) - GitHub Packages authentication

---

**Status**: ✅ IAM Permissions Guide  
**Last Updated**: February 6, 2026
