#!/usr/bin/env bash
# 🎼 QUICK REFERENCE: Adding New Servant Mutations
# 
# You're about to add a new mutation to the system?
# Follow this ONE simple checklist. Mozart made it easy.

cat << 'EOF'

╔════════════════════════════════════════════════════════════════╗
║  🎼 SERVANT MUTATION QUICK START GUIDE 🎼                    ║
╚════════════════════════════════════════════════════════════════╝

📋 TO ADD A NEW MUTATION:

  1️⃣  Open: api/src/resolvers/directory/servant-config.ts
  
  2️⃣  Find the SERVANT_MUTATIONS array
  
  3️⃣  Add ONE line:
      {
        name: 'MakeMyNewRoleLeader',                         // Resolver name
        churchType: 'MyNewRole',                             // Church level
        servantType: 'Leader',                               // Admin or Leader
        requiredPermissionLevel: 'ParentLevel',              // Who can make this?
        action: 'make'                                       // 'make' or 'remove'
      },
  
  4️⃣  Save. Done.
  
  ✨ The factory automatically generates both:
     - MakeMyNewRoleLeader mutation
     - RemoveMyNewRoleLeader mutation (just add another line with action: 'remove')


📚 REFERENCE: Church Hierarchy

  Denomination
    └─ Oversight
        └─ Campus
            ├─ Stream
            │   └─ Council
            └─ CreativeArts
                └─ Ministry


🎯 TYPICAL MUTATION PAIR:

  // Make the leader
  {
    name: 'MakeFellowshipLeader',
    churchType: 'Fellowship',
    servantType: 'Leader',
    requiredPermissionLevel: 'Bacenta',
    action: 'make'
  },
  
  // Remove the leader
  {
    name: 'RemoveFellowshipLeader',
    churchType: 'Fellowship',
    servantType: 'Leader',
    requiredPermissionLevel: 'Bacenta',
    action: 'remove'
  },


⚙️  PERMISSION RULES:

  // Standard Admin Permission
  permitAdmin(churchLevel) → Admin must be at parent level
  
  // Special Cases (Already Handled in Factory):
  'fishers'                → Denomination Leaders (admin override)
  permitAdminArrivals()    → Bacenta Leaders (special arrivals permission)


🧪 HOW IT WORKS (Behind the Scenes):

  servant-config.ts          servant-resolver-factory.ts
      ↓                                  ↓
  SERVANT_MUTATIONS[] ─→ buildServantResolvers() ─→ make-servant-resolvers.ts
      ↓                                                      ↓
  [Config Objects]               ↓                    [Resolver Functions]
                          forEach config →
                          create resolver
                          with permissions


❌ WHAT NOT TO DO:

  ✗ Don't edit make-servant-resolvers.ts (it's auto-generated!)
  ✗ Don't add resolvers to make-remove-servants.ts
  ✗ Don't hardcode permissions (let the factory handle it)
  ✗ Don't duplicate mutations in the config


✅ WHAT TO DO:

  ✓ Add to servant-config.ts only
  ✓ Use existing church/servant types
  ✓ Follow the naming convention (Make/Remove + Type + Role)
  ✓ Run npm run build to verify


📞 SPECIAL CASES:

  Bacenta Leader:
    - Uses permitAdminArrivals() instead of permitAdmin()
    - Config line still works! Factory handles it.
  
  Denomination Leader:
    - Uses role 'fishers' instead of permitAdmin()
    - Config line still works! Factory handles it.


🎓 EXAMPLE: Adding "MakeNewShinyRoleLeader"

  Step 1: servant-config.ts
  {
    name: 'MakeNewShinyRoleLeader',
    churchType: 'NewShinyRole',
    servantType: 'Leader',
    requiredPermissionLevel: 'ParentShinyRole',
    action: 'make'
  },
  {
    name: 'RemoveNewShinyRoleLeader',
    churchType: 'NewShinyRole',
    servantType: 'Leader',
    requiredPermissionLevel: 'ParentShinyRole',
    action: 'remove'
  },
  
  Step 2: npm run build
  
  Step 3: Your GraphQL schema now has:
    - mutation MakeNewShinyRoleLeader(...)
    - mutation RemoveNewShinyRoleLeader(...)
  
  ✨ Automatic. Zero manual code.


🚦 TROUBLESHOOTING:

  Q: Mutation not appearing in GraphQL?
  A: Run npm run build. The factory needs to regenerate.
  
  Q: Permission denied error?
  A: Check requiredPermissionLevel. Must be parent level.
  
  Q: TypeScript errors in servant-config.ts?
  A: Check the config object structure. Use the REFERENCE format above.


═══════════════════════════════════════════════════════════════

Questions? Read: REFACTORING_MASTERCLASS.md 📖
Need help? Check: api/src/resolvers/directory/servant-config.ts 🔍

═══════════════════════════════════════════════════════════════

EOF
