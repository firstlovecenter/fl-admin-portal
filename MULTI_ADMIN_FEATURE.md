# Multiple Administrators Feature

## Overview
This feature allows organizational levels (Council, Stream, Campus, Oversight, Denomination, Governorship, CreativeArts, Ministry) to have multiple administrators instead of just one. This provides better flexibility for church management and allows administrative responsibilities to be shared.

## Backend Implementation

### GraphQL Schema Changes

All church levels that support admins now have two fields:
- `admin: Member` - Returns a single admin (first one) for backward compatibility
- `admins: [Member!]!` - Returns all admins as an array

Example for Council:
```graphql
type Council {
  # ... other fields
  admin: Member @relationship(type: "IS_ADMIN_FOR", direction: IN)
  admins: [Member!]! @relationship(type: "IS_ADMIN_FOR", direction: IN)
}
```

### New Mutations

#### Add Admin Mutations
These mutations add a new admin WITHOUT removing existing admins:

- `AddCouncilAdmin(adminId: ID!, councilId: ID!): Member!`
- `AddStreamAdmin(adminId: ID!, streamId: ID!): Member!`
- `AddCampusAdmin(adminId: ID!, campusId: ID!): Member!`
- `AddOversightAdmin(adminId: ID!, oversightId: ID!): Member!`
- `AddDenominationAdmin(adminId: ID!, denominationId: ID!): Member!`
- `AddGovernorshipAdmin(adminId: ID!, governorshipId: ID!): Member!`
- `AddCreativeArtsAdmin(adminId: ID!, creativeArtsId: ID!): Member!`
- `AddMinistryAdmin(adminId: ID!, ministryId: ID!): Member!`

#### Delete Admin Mutations
These mutations remove a specific admin. They include protection to prevent removing the last admin:

- `DeleteCouncilAdmin(adminId: ID!, councilId: ID!): Member!`
- `DeleteStreamAdmin(adminId: ID!, streamId: ID!): Member!`
- `DeleteCampusAdmin(adminId: ID!, campusId: ID!): Member!`
- `DeleteOversightAdmin(adminId: ID!, oversightId: ID!): Member!`
- `DeleteDenominationAdmin(adminId: ID!, denominationId: ID!): Member!`
- `DeleteGovernorshipAdmin(adminId: ID!, governorshipId: ID!): Member!`
- `DeleteCreativeArtsAdmin(adminId: ID!, creativeArtsId: ID!): Member!`
- `DeleteMinistryAdmin(adminId: ID!, ministryId: ID!): Member!`

#### Error: Cannot Remove Last Admin
If you try to remove the last admin from a church level, you'll receive an error:
```
Cannot remove the last admin from this church level
```

### Existing Mutations Behavior

The existing `Make*Admin` mutations (e.g., `MakeCouncilAdmin`) now ADD admins instead of replacing them:

- `MakeCouncilAdmin` - Adds a new admin to the council
- `MakeStreamAdmin` - Adds a new admin to the stream
- etc.

The `Remove*Admin` mutations now only remove the specific admin specified by `adminId`, not all admins.

## Frontend Implementation

### MultiAdminManager Component

A new React component `MultiAdminManager` provides a UI for managing multiple admins:

**Location**: `web-react-ts/src/components/DisplayChurchDetails/MultiAdminManager.tsx`

**Features**:
- Displays all current admins with avatars
- "Add Admin" button to add new admins
- Individual "Remove" button for each admin (disabled if only one admin remains)
- Member search/select for adding admins
- Confirmation dialog before removing an admin
- Validation to prevent duplicate admins

**Usage Example**:
```tsx
import MultiAdminManager from 'components/DisplayChurchDetails/MultiAdminManager'

// In your component
<MultiAdminManager
  admins={council.admins} // Array of admin members
  churchId={council.id}
  churchType="Council"
  churchName={council.name}
  clickCard={clickCard} // Function to handle member navigation
/>
```

### GraphQL Mutations (Frontend)

**Location**: `web-react-ts/src/components/DisplayChurchDetails/MultiAdminMutations.ts`

Example usage:
```tsx
import { useMutation } from '@apollo/client'
import { ADD_COUNCIL_ADMIN, DELETE_COUNCIL_ADMIN } from './MultiAdminMutations'

// In your component
const [AddCouncilAdmin] = useMutation(ADD_COUNCIL_ADMIN)
const [DeleteCouncilAdmin] = useMutation(DELETE_COUNCIL_ADMIN)

// Add admin
await AddCouncilAdmin({
  variables: {
    councilId: '123',
    adminId: '456'
  }
})

// Remove admin
await DeleteCouncilAdmin({
  variables: {
    councilId: '123',
    adminId: '456'
  }
})
```

## Database Schema (Neo4j)

### Relationships
Multiple admins are represented by multiple `IS_ADMIN_FOR` relationships:

```cypher
// Multiple members can be admins for the same church
(admin1:Member)-[:IS_ADMIN_FOR]->(council:Council)
(admin2:Member)-[:IS_ADMIN_FOR]->(council:Council)
(admin3:Member)-[:IS_ADMIN_FOR]->(council:Council)
```

### Cypher Queries

#### Add Admin (without removing others)
```cypher
MATCH (church:Council {id: $councilId})
MATCH (admin:Member {id: $adminId})
SET admin.auth_id = $auth_id
MERGE (admin)-[:IS_ADMIN_FOR]->(church)
RETURN church, admin
```

#### Remove Specific Admin (with last-admin check)
```cypher
MATCH (church:Council {id: $councilId})
MATCH (admin:Member {id: $adminId})-[r:IS_ADMIN_FOR]->(church)

// Count existing admins to ensure we don't remove the last one
WITH church, admin, r, COUNT{(church)<-[:IS_ADMIN_FOR]-(:Member)} as adminCount
WHERE adminCount > 1
DELETE r

RETURN admin
```

## Migration Guide

### For Existing Data

No migration is required! The existing single-admin relationships will work as-is:
- The `admin` field will return the existing admin
- The `admins` field will return an array with that single admin
- You can add more admins using the new mutations

### For Developers

#### Querying Admins

**Old way** (still works):
```graphql
query {
  council(id: "123") {
    admin {
      id
      firstName
      lastName
    }
  }
}
```

**New way** (recommended for multi-admin support):
```graphql
query {
  council(id: "123") {
    admins {
      id
      firstName
      lastName
      pictureUrl
    }
  }
}
```

#### Adding Components to Existing Pages

To add multi-admin management to an existing church details page:

1. Import the component:
```tsx
import MultiAdminManager from 'components/DisplayChurchDetails/MultiAdminManager'
```

2. Query for admins array instead of single admin:
```graphql
query GetCouncil($id: ID!) {
  councils(where: { id: $id }) {
    id
    name
    admins {  # Use admins instead of admin
      id
      firstName
      lastName
      pictureUrl
    }
  }
}
```

3. Replace the existing admin display with MultiAdminManager:
```tsx
{/* Old single admin display */}
{props.admin && <MemberAvatarWithName member={props.admin} />}

{/* New multi-admin manager */}
<MultiAdminManager
  admins={props.admins || []}
  churchId={props.churchId}
  churchType={props.churchType}
  churchName={props.name}
  clickCard={clickCard}
/>
```

## Permissions

The permission system remains unchanged:
- Stream admins can manage Council admins
- Campus admins can manage Stream admins
- Oversight admins can manage Campus admins
- Denomination admins can manage Oversight admins
- Only "fishers" role can manage Denomination admins

All admin operations (add/remove) use the same permission checks as before via `permitAdmin()` functions.

## Security Features

1. **Last Admin Protection**: Cannot remove the last admin from any church level
2. **Permission Checks**: All mutations verify user has appropriate admin role
3. **Duplicate Prevention**: Frontend validates against adding duplicate admins
4. **Directory Lock**: Respects the existing directory lock feature

## Testing

### Manual Testing Steps

1. **Add Multiple Admins**:
   - Navigate to a Council/Stream/Campus page
   - Click "Add Admin" button
   - Search and select a member
   - Submit - verify admin is added
   - Repeat to add 2-3 more admins

2. **View Multiple Admins**:
   - Verify all admins display with avatars
   - Click on each admin to navigate to their profile

3. **Remove Admin**:
   - Click remove button next to an admin
   - Confirm removal
   - Verify admin is removed from the list

4. **Last Admin Protection**:
   - Remove all but one admin
   - Verify remove button is disabled for last admin
   - Try to remove via mutation - verify error message

5. **Duplicate Prevention**:
   - Try to add an existing admin again
   - Verify error message

### GraphQL Playground Testing

```graphql
# Add admin
mutation {
  AddCouncilAdmin(councilId: "abc123", adminId: "member456") {
    id
    firstName
    lastName
  }
}

# Query admins
query {
  councils(where: { id: "abc123" }) {
    id
    name
    admins {
      id
      firstName
      lastName
    }
  }
}

# Remove admin
mutation {
  DeleteCouncilAdmin(councilId: "abc123", adminId: "member456") {
    id
    firstName
    lastName
  }
}
```

## Troubleshooting

### Issue: "Cannot remove the last admin"
**Cause**: Trying to remove the only admin from a church level
**Solution**: Add another admin before removing the current one

### Issue: "This person is already an admin"
**Cause**: Trying to add a person who is already an admin
**Solution**: Check the current admins list before adding

### Issue: Admins not showing in UI
**Cause**: Query is using `admin` (singular) instead of `admins` (plural)
**Solution**: Update GraphQL query to use `admins` field

## Future Enhancements

Potential improvements for future versions:

1. **Admin Roles**: Different types of admins (primary, secondary, etc.)
2. **Audit Trail**: Log all admin add/remove operations
3. **Bulk Operations**: Add/remove multiple admins at once
4. **Admin Notifications**: Email notifications when someone becomes an admin
5. **Admin Dashboard**: Central view of all admin assignments across the organization
