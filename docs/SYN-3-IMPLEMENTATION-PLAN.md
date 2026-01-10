# SYN-3 Implementation Plan: Enable Multiple Administrators

**Branch:** `SYN-3-enable-multiple-administrators-for-church-levels`  
**Date Started:** January 3, 2026  
**Status:** ✅ Schema Updated | 🔄 Queries In Progress | ⏳ Frontend Pending

---

## Overview

This document tracks the implementation of multiple administrators per church level, changing from a singular `admin` field to a plural `admins` array throughout the application.

---

## Phase 1: GraphQL Schema Updates ✅ COMPLETED

### Changes Made

Updated all church types to support multiple admins:

#### 1. Main Church Hierarchy (`api/src/schema/directory.graphql`)

- ✅ **Denomination** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Oversight** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Campus** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Stream** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Council** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Governorship** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Bacenta** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`

#### 2. Creative Arts Structure (`api/src/schema/directory-creativearts.graphql`)

- ✅ **CreativeArts** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`
- ✅ **Ministry** - Changed `admin: Member` → `admins: [Member!]!` + added `adminCount`

### Schema Pattern Used

```graphql
admins: [Member!]! @relationship(type: "IS_ADMIN_FOR", direction: IN)
adminCount: Int
  @cypher(
    statement: "MATCH (this)<-[:IS_ADMIN_FOR]-(admin:Member) RETURN COUNT(admin) AS adminCount"
    columnName: "adminCount"
  )
```

---

## Phase 2: Frontend Query Updates ✅ COMPLETED

### Files Updated

#### Primary Query File: `web-react-ts/src/queries/ListQueries.ts`

**Total Instances Updated:** 18 `admin {` blocks → `admins {` + `adminCount`

**Queries Updated:**

1. ✅ GET_COUNCIL_GOVERNORSHIPS - Council and nested governorship admins
2. ✅ GET_CAMPUS_GOVERNORSHIPS - Campus and nested governorship admins  
3. ✅ GET_STREAM_COUNCILS - Stream and nested council admins
4. ✅ GET_CAMPUS_STREAMS - Campus and nested stream admins
5. ✅ GET_DENOMINATION_OVERSIGHTS - Denomination and nested oversight admins
6. ✅ GET_OVERSIGHT_CAMPUSES - Oversight and nested campus admins
7. ✅ GET_STREAM_GOVERNORSHIPS - Stream admins
8. ✅ GET_STREAM_MINISTRIES - Stream admins
9. ✅ GET_STREAM_HUBS - Stream admins
10. ✅ GET_STREAM_SONTAS - Stream admins
11. ✅ GET_CAMPUS_CREATIVEARTS - Campus admins
12. ✅ GET_COUNCIL_HUBCOUNCILS - Council admins

**Note:** Two commented-out admin fields (lines 750, 769) left as-is pending review.

---

## Phase 3: TypeScript Type Updates ✅ COMPLETED

### Files Updated

1. ✅ `web-react-ts/src/global-types.ts`
   - Updated `Church` interface: `admin?: MemberWithoutBioData` → `admins?: MemberWithoutBioData[]`
   - Added `adminCount?: number` to Church interface
   - All church types inherit from Church interface, so change applies to all

### Interface Changes Applied

```typescript
export interface Church {
  id: string
  name: string
  // ... other fields ...
  leader: MemberWithoutBioData
  admins?: MemberWithoutBioData[]  // ← Changed from admin?: MemberWithoutBioData
  adminCount?: number              // ← New field
  // ... other fields ...
}
```

---

## Phase 4: Component Updates ⏳ PENDING

### Components That Display Admin Info

Need to search for components that:
- Display `church.admin` → change to `church.admins`
- Show admin name/info
- Have admin-related logic

### Search Pattern
```typescript
// Find components accessing .admin property
church.admin
data?.admin
?.admin
```

### Expected Changes

**Before:**
```typescript
<p>Admin: {church.admin?.firstName} {church.admin?.lastName}</p>
```

**After:**
```typescript
<div>
  <p>Admins ({church.adminCount}):</p>
  <ul>
    {church.admins?.map(admin => (
      <li key={admin.id}>
        {admin.firstName} {admin.lastName}
      </li>
    ))}
  </ul>
</div>
```

---

## Phase 5: Mutation Updates ⏳ PENDING

### Current Admin Assignment Logic

**File:** `api/src/schema/directory-crud.graphql` (line 73)

**Current Pattern:**
```cypher
OPTIONAL MATCH (oldAdmin:Active:Member)-[r1:IS_ADMIN_FOR]->(church)
DELETE r1
MERGE (admin)-[:IS_ADMIN_FOR]->(church)
```

**Issues:**
- Replaces existing admin (doesn't support multiple)
- No validation of admin access rights

### Required Mutation Changes

#### 1. Add Admin (New)
```graphql
mutation AddChurchAdmin($churchId: ID!, $adminId: ID!, $churchType: String!) {
  addChurchAdmin(churchId: $churchId, adminId: $adminId, churchType: $churchType) {
    id
    admins {
      id
      firstName
      lastName
    }
    adminCount
  }
}
```

**Cypher Implementation:**
```cypher
MATCH (admin:Member {id: $adminId})
MATCH (church {id: $churchId})
WHERE $churchType IN labels(church)

// Optional: Validate admin has access to parent structure
OPTIONAL MATCH (admin)-[:BELONGS_TO|LEADS|IS_ADMIN_FOR*1..5]->(parent)
OPTIONAL MATCH (church)-[:HAS*1..3]->(parent)

// Create relationship if not exists
MERGE (admin)-[:IS_ADMIN_FOR]->(church)

// Log history
CREATE (log:HistoryLog {
  timeStamp: datetime(),
  historyRecord: admin.firstName + ' ' + admin.lastName + ' was made admin of ' + church.name
})
CREATE (admin)-[:HAS_ADMIN_HISTORY]->(log)
CREATE (church)-[:HAS_HISTORY]->(log)

RETURN church
```

#### 2. Remove Admin (New)
```graphql
mutation RemoveChurchAdmin($churchId: ID!, $adminId: ID!, $churchType: String!) {
  removeChurchAdmin(churchId: $churchId, adminId: $adminId, churchType: $churchType) {
    id
    admins {
      id
      firstName
      lastName
    }
    adminCount
  }
}
```

**Cypher Implementation:**
```cypher
MATCH (admin:Member {id: $adminId})-[r:IS_ADMIN_FOR]->(church {id: $churchId})
WHERE $churchType IN labels(church)

// Log history before deletion
CREATE (log:HistoryLog {
  timeStamp: datetime(),
  historyRecord: admin.firstName + ' ' + admin.lastName + ' was removed as admin of ' + church.name
})
CREATE (admin)-[:HAS_ADMIN_HISTORY]->(log)
CREATE (church)-[:HAS_HISTORY]->(log)

DELETE r
RETURN church
```

#### 3. Update Existing Mutations

Files to check for admin assignment logic:
- ⏳ `api/src/schema/directory-crud.graphql`
- ⏳ `api/src/schema/directory-creativearts.graphql` (if has admin mutations)
- ⏳ Any resolver files with admin logic

---

## Phase 6: UI Component Creation ⏳ PENDING

### New Components Needed

#### 1. Admin Management Component
**File:** `web-react-ts/src/components/church/AdminManager.tsx`

**Features:**
- Display list of current admins
- Add new admin (search/select member)
- Remove admin (with confirmation)
- Show admin count
- Permission check (only higher-level admins can modify)

**Props:**
```typescript
interface AdminManagerProps {
  church: Church
  churchType: ChurchLevel
  currentUser: CurrentUser
  onAdminsChange?: () => void
}
```

#### 2. Admin Selector Component
**File:** `web-react-ts/src/components/church/AdminSelector.tsx`

**Features:**
- Search members who can be admins
- Filter by current church membership/access
- Prevent duplicate assignments
- Show role validation

### Update Existing Components

Components likely displaying admin info:
- ⏳ Church detail pages (Campus, Stream, Council, etc.)
- ⏳ Dashboard cards showing church info
- ⏳ Admin assignment forms/modals

---

## Phase 7: Testing Checklist ⏳ PENDING

### Schema Testing
- [ ] Run GraphQL schema validation
- [ ] Test query with `admins` field returns array
- [ ] Test `adminCount` field returns correct number
- [ ] Verify backward compatibility (no breaking changes)

### Backend Testing
- [ ] Test adding multiple admins to one church
- [ ] Test removing specific admin
- [ ] Test admin history logging works
- [ ] Test permission validation in mutations
- [ ] Test queries with multiple admins return all

### Frontend Testing
- [ ] Test church detail page displays all admins
- [ ] Test admin manager component (add/remove)
- [ ] Test admin count displays correctly
- [ ] Test permission checks work
- [ ] Test empty admin list (no admins)
- [ ] Test single admin (backward compatibility)

### Integration Testing
- [ ] Test full workflow: add admin → see in UI → remove admin
- [ ] Test multiple users with admin roles simultaneously
- [ ] Test admin history appears in history log
- [ ] Test data doesn't break on old records (migration)

---

## Phase 8: Data Migration ⏳ PENDING

### Migration Considerations

**Current Database State:**
- Some churches may have multiple `[:IS_ADMIN_FOR]` relationships already
- GraphQL was only exposing one (non-deterministic)
- No data changes needed in Neo4j

**Migration Script (if needed):**

```cypher
// Verify multiple admin relationships exist
MATCH (church:Church)<-[:IS_ADMIN_FOR]-(admin:Member)
WITH church, COUNT(admin) as adminCount
WHERE adminCount > 1
RETURN church.name, adminCount
ORDER BY adminCount DESC

// No data migration required - relationships already exist
// New schema will just expose all of them
```

### Verification Query

```cypher
// After deployment, verify admins are accessible
MATCH (church:Church)<-[:IS_ADMIN_FOR]-(admins:Member)
WITH church, COLLECT(admins) as adminList
RETURN 
  church.name as Church,
  SIZE(adminList) as AdminCount,
  [a IN adminList | a.firstName + ' ' + a.lastName] as Admins
ORDER BY AdminCount DESC
LIMIT 20
```

---

## Phase 9: Documentation Updates ⏳ PENDING

### Documents to Update

1. ⏳ **API Documentation**
   - Update GraphQL schema docs
   - Document new mutations
   - Add admin management examples

2. ⏳ **User Guide**
   - How to add/remove admins
   - Admin permissions explained
   - Multiple admin workflows

3. ⏳ **Developer Guide**
   - Schema changes documented
   - Query migration guide
   - Component usage examples

---

## Phase 10: Deployment Checklist ⏳ PENDING

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Doppler secrets verified
- [ ] Staging environment tested

### Deployment Steps
1. [ ] Merge to `deploy` branch
2. [ ] Deploy API (Netlify Functions)
3. [ ] Deploy frontend (Netlify)
4. [ ] Monitor logs for errors
5. [ ] Verify admin queries work
6. [ ] Test on production data (small sample)

### Post-Deployment Verification
- [ ] GraphQL queries return multiple admins
- [ ] UI displays all admins correctly
- [ ] Admin count accurate
- [ ] Add/remove admin works
- [ ] History logging working
- [ ] No errors in Sentry/logs

### Rollback Plan
If issues occur:
1. Revert frontend deployment
2. Revert API deployment
3. Schema changes are backward compatible (old queries still work)
4. Investigate and fix in branch

---

## Known Issues & Decisions

### Issue 1: Commented Out Admin Fields
**Location:** `web-react-ts/src/queries/ListQueries.ts` lines 750, 769

**Decision Needed:**
- Why are these commented out?
- Should they be updated to `admins` when re-enabled?
- Remove if no longer needed

### Issue 2: Validation of Admin Assignments
**Current State:** No validation that admin has access rights

**Options:**
1. **Strict validation:** Admin must have visibility to parent church structures
2. **Loose validation:** Any member can be admin (current behavior)
3. **Role-based:** Only certain roles can appoint admins

**Recommendation:** Implement Option 1 (strict validation) in Phase 5

### Issue 3: Admin History Tracking
**Current State:** Leader changes tracked, admin changes NOT tracked

**Decision:** Implement admin history logging in Phase 5 mutations

---

## Progress Tracking

| Phase | Status | Completion % | Blocker? |
|-------|--------|--------------|----------|
| 1. Schema Updates | ✅ Complete | 100% | No |
| 2. Query Updates | ✅ Complete | 100% | No |
| 3. Type Updates | ✅ Complete | 100% | No |
| 4. Component Updates | ⏳ Pending | 0% | No |
| 5. Mutation Updates | ⏳ Pending | 0% | No |
| 6. UI Components | ⏳ Pending | 0% | Blocked by Phase 4 |
| 7. Testing | ⏳ Pending | 0% | Blocked by Phase 6 |
| 8. Migration | ⏳ Pending | 0% | No |
| 9. Documentation | ⏳ Pending | 0% | No |
| 10. Deployment | ⏳ Pending | 0% | Blocked by Phase 7 |

**Overall Progress:** 30% (3 of 10 phases complete)

---

## Next Steps

### ✅ Completed (January 3, 2026)
1. ✅ Schema updates for all 9 church types
2. ✅ Updated all 18 queries in ListQueries.ts  
3. ✅ Updated TypeScript Church interface

### Immediate (Next)
1. 🔄 Search for and update component files that display admin info
2. ⏳ Update any component that accesses `.admin` property
3. ⏳ Test queries work with backend (may need to rebuild schema)

### Short Term (This Week)
1. Update all components displaying admin info
2. Create admin management UI components
3. Implement add/remove admin mutations
4. Add admin history logging

### Medium Term (Next Week)
1. Complete all testing
2. Update documentation
3. Deploy to staging
4. Get user testing feedback

---

## Questions to Answer

1. **UI/UX:** How should multiple admins be displayed?
   - Comma-separated list?
   - Chip/badge array?
   - Expandable dropdown?

2. **Permissions:** Who can add/remove admins?
   - Only leaders of that church?
   - Higher-level admins?
   - Both?

3. **Limits:** Should there be a max number of admins?
   - No limit (current behavior)
   - Set reasonable limit (e.g., 10)?

4. **Notifications:** Should admins be notified when appointed/removed?
   - Email notification?
   - In-app notification?
   - Just history log?

---

## Resources

- **Main Analysis:** [docs/ADMIN_STRUCTURE_ANALYSIS.md](./ADMIN_STRUCTURE_ANALYSIS.md)
- **Schema Files:**
  - [api/src/schema/directory.graphql](../api/src/schema/directory.graphql)
  - [api/src/schema/directory-creativearts.graphql](../api/src/schema/directory-creativearts.graphql)
- **Query Files:**
  - [web-react-ts/src/queries/ListQueries.ts](../web-react-ts/src/queries/ListQueries.ts)
- **Permission Logic:**
  - [api/src/resolvers/permissions.ts](../api/src/resolvers/permissions.ts)
  - [web-react-ts/src/permission-utils.ts](../web-react-ts/src/permission-utils.ts)

---

**Last Updated:** January 3, 2026  
**Next Review:** Daily until Phase 7 complete
