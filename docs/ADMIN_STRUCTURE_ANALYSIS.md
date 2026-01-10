# Admin Structure Analysis - First Love Church Admin Portal

**Analysis Date:** January 3, 2026  
**Branch:** SYN-3-enable-multiple-administrators-for-church-levels  
**Author:** GitHub Copilot

---

## Executive Summary

The First Love Church Admin Portal implements a sophisticated hierarchical permission system with **two distinct administrative models**: Leadership (via `[:LEADS]` relationships) and Administration (via `[:IS_ADMIN_FOR]` relationships). This dual-authority model allows spiritual leaders to delegate operational/data management responsibilities to specialized admins without conferring leadership authority.

---

## 1. Church Hierarchy (Neo4j Data Model)

### Primary Structure (7 Levels)

```
Denomination (Top Level)
    ↓ [:HAS]
Oversight
    ↓ [:HAS]
Campus
    ↓ [:HAS]
Stream (4 types: Anagkazo Encounter, Gospel Encounter, Holy Ghost Encounter, First Love Experience)
    ↓ [:HAS]
Council (weekday fellowships)
    ↓ [:HAS]
Governorship
    ↓ [:HAS]
Bacenta
    ↓ [:HAS]
Fellowship (Optional - not always present)
```

### Parallel Creative Arts Structure

```
Campus
    ↓ [:HAS_MINISTRY]
CreativeArts
    ↓ [:HAS_MINISTRY]
Ministry
    ↓ [:HAS_MINISTRY]
HubCouncil
    ↓ [:HAS]
Hub
```

### Key Relationship Patterns

- **[:HAS]** - Hierarchical containment (parent → child church unit)
- **[:BELONGS_TO]** - Member → Bacenta membership
- **[:LEADS]** - Member → Church leadership (spiritual authority)
- **[:IS_ADMIN_FOR]** - Member → Church administration (operational authority)

---

## 2. Two Distinct Administrative Roles

### [:LEADS] Relationship (Leadership)

**Purpose:** Primary spiritual/pastoral leadership authority

**Characteristics:**
- One leader per church level (cardinality: 1)
- Spiritual oversight and decision-making
- Historically tracked via `HistoryLog` nodes
- Schema: `leader: Member @relationship(type: "LEADS", direction: IN)`

**Database Pattern:**
```cypher
(member:Member)-[:LEADS]->(church:Church)
```

### [:IS_ADMIN_FOR] Relationship (Administration)

**Purpose:** Operational/administrative authority for data management

**Characteristics:**
- Multiple admins per church level possible (cardinality: 0..n)
- Data entry, reporting, service records
- **Currently NOT tracked in HistoryLog** (audit gap)
- Schema: `admin: Member @relationship(type: "IS_ADMIN_FOR", direction: IN)`

**Database Pattern:**
```cypher
(member:Member)-[:IS_ADMIN_FOR]->(church:Church)
```

**Critical Distinction:**
> A member can be an admin (`IS_ADMIN_FOR`) WITHOUT being a leader (`LEADS`). This allows specialized data managers, secretaries, or technical admins to have system access without spiritual leadership responsibilities.

---

## 3. Role Types (Auth0 Integration)

### Complete Role Enumeration

**File:** `api/src/resolvers/utils/types.ts` (lines 27-58)

#### Leadership Roles (12 total)

| Role | Scope | Description |
|------|-------|-------------|
| `leaderDenomination` | Entire organization | Top-level spiritual oversight |
| `leaderOversight` | Regional cluster | Multi-campus coordination |
| `leaderCampus` | Campus | Campus-wide leadership |
| `leaderStream` | Stream | Stream-specific oversight (4 streams) |
| `leaderCouncil` | Council | Weekday fellowship coordination |
| `leaderGovernorship` | Governorship | Multiple bacentas |
| `leaderBacenta` | Bacenta | Local congregation leadership |
| `leaderFellowship` | Fellowship | Smallest unit leadership |
| `leaderCreativeArts` | Creative Arts | Arts ministry oversight |
| `leaderMinistry` | Ministry | Ministry leadership |
| `leaderHubCouncil` | Hub Council | Hub council coordination |
| `leaderHub` | Hub | Hub leadership |

#### Admin Roles (10 total)

| Role | Scope | Description |
|------|-------|-------------|
| `adminDenomination` | Entire organization | System-wide data admin |
| `adminOversight` | Regional cluster | Multi-campus data management |
| `adminCampus` | Campus | Campus data administration |
| `adminStream` | Stream | Stream data management |
| `adminCouncil` | Council | Council data administration |
| `adminGovernorship` | Governorship | Governorship data management |
| `adminCreativeArts` | Creative Arts | Arts ministry data admin |
| `adminMinistry` | Ministry | Ministry data administration |

#### Specialized Roles (8 total)

| Role | Scope | Description |
|------|-------|-------------|
| `arrivalsAdminCampus` | Campus | Attendance/arrivals tracking |
| `arrivalsAdminStream` | Stream | Stream arrivals management |
| `arrivalsAdminCouncil` | Council | Council arrivals oversight |
| `arrivalsAdminGovernorship` | Governorship | Governorship arrivals |
| `arrivalsCounterStream` | Stream | Attendance counting |
| `arrivalsPayerCouncil` | Council | Arrivals payment processing |
| `tellerStream` | Stream | Banking/financial transactions |
| `sheepseekerStream` | Stream | Member care and follow-up |
| `fishers` | N/A | Evangelism activities |
| `all` | Global | Superuser access |

---

## 4. Hierarchical Permission System

### Cascading Leader Permissions

**File:** `api/src/resolvers/permissions.ts` (lines 4-105)

**Principle:** Higher-level leaders automatically have permissions for all lower levels.

#### Example 1: Campus Leader Permissions

```typescript
case 'campus':
  permittedFor = ['leaderDenomination', 'leaderOversight', 'leaderCampus']
```

**Interpretation:** A Campus Leader can access Campus data AND has permissions equivalent to Oversight and Denomination leaders. They can also access all Stream, Council, Governorship, Bacenta data under their campus.

#### Example 2: Bacenta Leader Permissions

```typescript
case 'bacenta':
  permittedFor = [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
    'leaderCouncil',
    'leaderGovernorship',
    'leaderBacenta',
  ]
```

**Interpretation:** Bacenta leaders can access their Bacenta data if they have ANY of these roles. This enables higher-level leaders to drill down into Bacenta details.

### Cascading Admin Permissions

**File:** `api/src/resolvers/permissions.ts` (lines 107-185)

**Principle:** Admin permissions cascade DOWN the hierarchy, not UP.

#### Key Difference: Admin at Bacenta Level

```typescript
case 'Bacenta':
case 'Hub':
  permittedFor = [
    'adminMinistry',
    'adminCreativeArts',
    'adminGovernorship',
    'adminCouncil',
    'adminStream',
    'adminCampus',
    'adminOversight',
    'adminDenomination',
  ]
```

**Critical Insight:**  
- `adminBacenta` does NOT exist as a role
- Instead, admins at Bacenta level need admin roles from HIGHER levels
- This allows Campus/Stream admins to manage Bacenta data
- Local Bacentas can have `adminStream` or `adminCouncil` assigned for their specific Bacenta

#### Admin at Stream Level

```typescript
case 'Stream':
  permittedFor = [
    'adminDenomination',
    'adminOversight',
    'adminCampus',
    'adminStream',
  ]
```

**Interpretation:** A Stream admin can manage Stream data if they have `adminStream` role OR any higher admin role (Campus, Oversight, Denomination).

---

## 5. Critical Permission Functions

**File:** `api/src/resolvers/permissions.ts`

### Core Functions

#### 1. `permitLeader(churchLevel: ChurchLevel): Role[]`

Returns array of roles that have **leadership** permissions at the specified church level.

**Example:**
```typescript
permitLeader('Council')
// Returns: ['leaderDenomination', 'leaderOversight', 'leaderCampus', 
//           'leaderStream', 'leaderCouncil']
```

#### 2. `permitAdmin(churchLevel: ChurchLevel): Role[]`

Returns array of roles that have **administrative** permissions at the specified church level.

**Example:**
```typescript
permitAdmin('Council')
// Returns: ['adminDenomination', 'adminOversight', 'adminCampus', 
//           'adminStream', 'adminCouncil']
```

#### 3. `permitLeaderAdmin(churchLevel: ChurchLevel): Role[]`

Combines both leader and admin permissions.

**Implementation:**
```typescript
export const permitLeaderAdmin = (churchLevel: ChurchLevel): Role[] => {
  return [...permitLeader(churchLevel), ...permitAdmin(churchLevel)]
}
```

#### 4. `permitMe(churchLevel: ChurchLevel): Role[]`

**Most comprehensive** - includes leaders, admins, arrivals admins, counters, tellers, etc.

**Use Case:** Check if current user has ANY access to a church level.

---

## 6. Authentication & Authorization Flow

### JWT Token Flow

**File:** `api/src/index.js` (lines 73-93)

```javascript
const token = req.headers.authorization
let jwt = null

if (token) {
  try {
    jwt = jwtDecode(token)
  } catch (error) {
    console.error('Invalid token:', error)
  }
}

return {
  req,
  executionContext: driver,
  jwt: {
    ...jwt,
    roles: jwt?.['https://flcadmin.netlify.app/roles'],
  },
}
```

### Auth0 Role Assignment

**File:** `api/src/resolvers/authenticate.ts`

1. Auth0 manages user role assignments via Management API
2. Roles stored as custom claim: `https://flcadmin.netlify.app/roles`
3. JWT decoded on every GraphQL request
4. Roles array passed to resolver context

**Critical:** The app does NOT manage roles internally. All role assignment happens in Auth0 dashboard or via Auth0 Management API.

### Frontend Permission Checking

**File:** `web-react-ts/src/permission-utils.ts`

- **Mirrors backend permission logic** (should be identical)
- Used by `ProtectedRoute.tsx` for route guards
- `SetPermissions.tsx` for conditional UI rendering
- Prevents unauthorized users from seeing restricted pages

**Current Issue:** Frontend and backend `permitLeader()` logic has minor discrepancies regarding Creative Arts admin roles.

---

## 7. Data Access Patterns

### Combined Relationship Traversal

**Pattern used in Member queries:**

```cypher
MATCH (member)-[:LEADS|IS_ADMIN_FOR*1..7]->(:Bacenta)<-[:BELONGS_TO]-(members:Active:Member)
RETURN DISTINCT members
```

**Explanation:**
- Traverses 1-7 hops through church hierarchy
- Uses BOTH `[:LEADS]` and `[:IS_ADMIN_FOR]` relationships
- Finds all members under leadership OR administrative authority
- Critical for displaying member directories to leaders/admins

### Admin-Specific Queries

**Member type includes:**

```graphql
type Member {
  # Admin relationship arrays
  isAdminForGovernorship: [Governorship!]!
    @relationship(type: "IS_ADMIN_FOR", direction: OUT)
  isAdminForCouncil: [Council!]!
    @relationship(type: "IS_ADMIN_FOR", direction: OUT)
  isAdminForStream: [Stream!]!
    @relationship(type: "IS_ADMIN_FOR", direction: OUT)
  isAdminForCampus: [Campus!]!
    @relationship(type: "IS_ADMIN_FOR", direction: OUT)
  isAdminForOversight: [Oversight!]!
    @relationship(type: "IS_ADMIN_FOR", direction: OUT)
  isAdminForDenomination: [Denomination!]!
    @relationship(type: "IS_ADMIN_FOR", direction: OUT)
}
```

**Usage:** Fetch all churches a member administers (without leading).

---

## 8. GraphQL Schema Patterns

### Church Type Admin Field

**Every church level has:**

```graphql
admin: Member @relationship(type: "IS_ADMIN_FOR", direction: IN)
```

**Files:**
- `api/src/schema/directory.graphql` (lines 476, 602, 724, 864, 976, 1080, 1165)
- Denomination, Oversight, Campus, Stream, Council, Governorship, Bacenta all have `admin` field

**Current Schema Limitation:**  
The field is typed as **singular** `Member`, but the relationship supports **multiple admins**. This is a schema design issue for the current branch (`SYN-3-enable-multiple-administrators-for-church-levels`).

**Expected Schema Change:**
```graphql
admins: [Member!]! @relationship(type: "IS_ADMIN_FOR", direction: IN)
```

### Admin Count Fields

**Members can query counts:**

```graphql
type Member {
  isAdminForGovernorshipCount: Int
  isAdminForCouncilCount: Int
  isAdminForStreamCount: Int
  isAdminForCampusCount: Int
  isAdminForOversightCount: Int
  isAdminForDenominationCount: Int
}
```

**Use Case:** Dashboard displaying "You are admin for 3 Councils, 1 Stream"

---

## 9. Critical Issues Identified

### Issue #1: Admin Appointment Without Validation

**File:** `api/src/schema/directory-crud.graphql` (lines 73-77)

```graphql
mutation MakeBacentaAdmin($adminId: ID!, $bacentaId: ID!) {
  OPTIONAL MATCH (oldAdmin:Active:Member)-[r1:IS_ADMIN_FOR]->(bacenta)
  DELETE r1
  MERGE (admin)-[:IS_ADMIN_FOR]->(bacenta)
}
```

**Problem:**
- No validation that admin has access to parent church structures
- An admin from Stream A could be assigned to a Bacenta in Stream B
- No check if admin already leads the church (redundant relationship)

**Recommended Fix:**
```cypher
// Validate admin has visibility to parent church
MATCH (admin:Member)-[:BELONGS_TO|LEADS|IS_ADMIN_FOR*1..5]->(parent)
MATCH (bacenta)-[:HAS*1..3]->(parent)
WITH admin, bacenta
OPTIONAL MATCH (oldAdmin)-[r:IS_ADMIN_FOR]->(bacenta)
DELETE r
MERGE (admin)-[:IS_ADMIN_FOR]->(bacenta)
```

---

### Issue #2: Inconsistent Relationship Traversal

**Problem:**  
Some queries combine relationships, others don't.

**Example 1 - Combined (Correct):**
```cypher
MATCH (member)-[:LEADS|IS_ADMIN_FOR*1..7]->(:Bacenta)
```

**Example 2 - Leaders Only (Potentially Missing Admins):**
```cypher
MATCH (this)-[:LEADS]->(governorship:Governorship)
```

**Impact:**
- Background aggregation jobs might miss admin-managed churches
- Reports could be incomplete for admins who don't lead

**Recommended Standard:**
- Always use `[:LEADS|IS_ADMIN_FOR]` for member access queries
- Use single relationship only when specifically needed (e.g., "Who leads this church?")

---

### Issue #3: Frontend/Backend Permission Logic Mismatch

**Location:** Creative Arts admin handling

**Backend (`api/src/resolvers/permissions.ts`):**
```typescript
case 'council':
  permittedFor = [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
    'leaderCouncil',
  ]
  // adminMinistry and adminCreativeArts NOT included
```

**Frontend (`web-react-ts/src/permission-utils.ts`):**
```typescript
case 'council':
  permittedFor = [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
    'leaderCouncil',
    'leaderHubCouncil',
    'adminMinistry',      // ← Extra
    'adminCreativeArts',  // ← Extra
  ]
```

**Problem:**
- Frontend allows Creative Arts admins to access Council data
- Backend might reject their GraphQL queries
- Inconsistent user experience

**Recommended Fix:**  
Centralize permission logic in a shared TypeScript file imported by both API and frontend.

---

### Issue #4: No Admin History Tracking

**Current State:**
- Leadership changes (`[:LEADS]`) are logged in `HistoryLog` nodes
- Admin appointments (`[:IS_ADMIN_FOR]`) are NOT tracked

**Example - Leader History:**
```cypher
MATCH (leader)-[:HAS_HISTORY]->(log:HistoryLog)
WHERE log.historyRecord CONTAINS "was made leader"
```

**Missing - Admin History:**
```cypher
// This doesn't exist
MATCH (admin)-[:ADMIN_HISTORY]->(log:HistoryLog)
```

**Impact:**
- No audit trail for admin appointments/removals
- Can't answer "Who was admin of Stream X in November 2025?"
- Compliance/governance gap

**Recommended Implementation:**
```cypher
// When creating admin relationship
CREATE (log:HistoryLog {
  timeStamp: datetime(),
  historyRecord: $adminName + " was made admin of " + $churchName
})
CREATE (admin)-[:HAS_ADMIN_HISTORY]->(log)
CREATE (church)-[:HAS_HISTORY]->(log)
```

---

### Issue #5: Singular vs. Multiple Admins Schema

**Current Branch Purpose:** `SYN-3-enable-multiple-administrators-for-church-levels`

**Current Schema:**
```graphql
type Church {
  admin: Member @relationship(type: "IS_ADMIN_FOR", direction: IN)
}
```

**Problem:**  
- Field name is **singular** (`admin`)
- Type is **singular** (`Member`)
- But relationship allows **multiple** `[:IS_ADMIN_FOR]` connections
- Queries will only return ONE admin (non-deterministic which one)

**Required Schema Change:**
```graphql
type Church {
  admins: [Member!]! @relationship(type: "IS_ADMIN_FOR", direction: IN)
  adminCount: Int @cypher(
    statement: """
    MATCH (this)<-[:IS_ADMIN_FOR]-(admin:Member)
    RETURN COUNT(admin) AS adminCount
    """
    columnName: "adminCount"
  )
}
```

**Impact:**
- All frontend queries fetching `admin` must change to `admins`
- UI must handle arrays instead of single objects
- GraphQL mutations must support adding/removing from admin list

---

## 10. Background Jobs & Aggregations

**Location:** `api/src/functions/background/`

**Examples:**
- `outside-accra-weekly/cypher.js` - Weekly reports for geographically distant churches
- Various aggregation functions for attendance, income, etc.

**Admin Consideration:**
- Jobs use Cypher queries with `OPTIONAL MATCH` for church relationships
- Should queries include `[:IS_ADMIN_FOR]` relationships?
- Do admins need to receive automated reports?

**Current Pattern:**
```javascript
OPTIONAL MATCH (stream)-[:HAS]->(council:Council)
```

**Should Be:**
```javascript
// If admins need visibility in reports
OPTIONAL MATCH (stream)-[:HAS]->(council:Council)
OPTIONAL MATCH (admin:Member)-[:IS_ADMIN_FOR]->(stream)
```

---

## 11. Recommended Improvements

### Priority 1: Critical Fixes

1. **Enable Multiple Admins in Schema**
   - Change `admin: Member` to `admins: [Member!]!`
   - Update all GraphQL queries in frontend
   - Update mutation resolvers to handle arrays

2. **Add Admin History Tracking**
   - Create `[:HAS_ADMIN_HISTORY]` relationship
   - Log all admin appointments/removals
   - Include timestamp and actor (who made the change)

3. **Validate Admin Appointments**
   - Ensure admin has access to parent church structures
   - Prevent cross-stream admin assignments
   - Check for duplicate/conflicting roles

### Priority 2: Architecture Improvements

4. **Centralize Permission Logic**
   - Extract permissions to shared TypeScript package
   - Import in both API (`api/src/resolvers/`) and frontend (`web-react-ts/src/`)
   - Single source of truth prevents drift

5. **Standardize Query Patterns**
   - Document when to use `[:LEADS]` vs `[:IS_ADMIN_FOR]` vs combined
   - Update background jobs to include admin relationships
   - Create query helper functions

6. **Document Admin Scope**
   - Add GraphQL schema comments explaining admin vs leader
   - Create admin user guide
   - Document permission cascading rules

### Priority 3: Future Enhancements

7. **Time-Bounded Admin Roles**
   - Add `startDate` and `endDate` properties to `[:IS_ADMIN_FOR]`
   - Enable temporary admin assignments
   - Auto-expire admin access

8. **Admin Role Hierarchy**
   - Consider read-only vs. full admin distinctions
   - Data-entry vs. approval workflows
   - Fine-grained permissions (can edit attendance but not banking)

9. **Admin Delegation**
   - Allow Stream admins to appoint Council admins
   - Hierarchical admin management
   - Prevent privilege escalation

---

## 12. Implementation Checklist for SYN-3

Based on branch name: **"SYN-3-enable-multiple-administrators-for-church-levels"**

### Phase 1: Schema Updates

- [ ] Change GraphQL schema `admin` fields to `admins`
- [ ] Add `adminCount` fields to all church types
- [ ] Generate TypeScript types from updated schema
- [ ] Update Neo4j constraints (if any exist for admin relationships)

### Phase 2: Backend Changes

- [ ] Update mutations to add/remove admins from array
- [ ] Implement admin validation logic
- [ ] Add admin history logging
- [ ] Update resolver queries to return multiple admins
- [ ] Update background jobs to include admin relationships

### Phase 3: Frontend Updates

- [ ] Update all GraphQL queries: `admin { }` → `admins { }`
- [ ] Change UI components to handle admin arrays
- [ ] Display multiple admins in church detail pages
- [ ] Add "Manage Admins" interface (add/remove)
- [ ] Update permission checks if needed

### Phase 4: Testing

- [ ] Unit tests for permission functions
- [ ] Integration tests for admin mutations
- [ ] Test admin history logging
- [ ] Test multiple admins per church level
- [ ] Test admin cascading permissions

### Phase 5: Migration

- [ ] Create Cypher script to migrate existing singular admin relationships
- [ ] Backup database before migration
- [ ] Test migration on staging environment
- [ ] Document rollback procedure

---

## 13. Code References

### Key Files by Functionality

| Functionality | File | Description |
|---------------|------|-------------|
| Role Types | `api/src/resolvers/utils/types.ts` | TypeScript role definitions |
| Permission Logic (API) | `api/src/resolvers/permissions.ts` | Backend permission functions |
| Permission Logic (Frontend) | `web-react-ts/src/permission-utils.ts` | Frontend permission functions |
| Auth Flow | `api/src/index.js` | JWT decoding and context setup |
| Auth0 Integration | `api/src/resolvers/authenticate.ts` | Auth0 role fetching |
| Church Schema | `api/src/schema/directory.graphql` | Church type definitions |
| Creative Arts Schema | `api/src/schema/directory-creativearts.graphql` | Ministry/Hub types |
| Admin Mutations | `api/src/schema/directory-crud.graphql` | Admin appointment mutations |
| Protected Routes | `web-react-ts/src/auth/ProtectedRoute.tsx` | Route guards |
| Role-Based UI | `web-react-ts/src/auth/SetPermissions.tsx` | Conditional rendering |

### GraphQL Query Patterns

**Fetch Church with Admin(s):**
```graphql
query GetCouncil($id: ID!) {
  councils(where: { id: $id }) {
    id
    name
    leader {
      id
      firstName
      lastName
    }
    admin {  # Will be 'admins' after SYN-3
      id
      firstName
      lastName
    }
  }
}
```

**Fetch Member's Admin Roles:**
```graphql
query GetMemberAdminRoles($id: ID!) {
  members(where: { id: $id }) {
    id
    firstName
    lastName
    isAdminForCouncil {
      id
      name
    }
    isAdminForStream {
      id
      name
    }
    isAdminForCampus {
      id
      name
    }
  }
}
```

---

## 14. Conclusion

The First Love Church Admin Portal implements a **sophisticated dual-authority model** that separates spiritual leadership from operational administration. This design allows:

1. **Flexible Role Assignment** - Specialized admins without leadership burden
2. **Hierarchical Permissions** - Cascading access for efficiency
3. **Granular Control** - Specific roles for attendance, banking, member care
4. **Scalability** - Multiple admins at each level (target of SYN-3)

**Current Strengths:**
- Well-defined role taxonomy (53 distinct roles)
- Clear separation between leader and admin authority
- Cascading permissions reduce redundant role assignments
- Neo4j graph model perfectly fits hierarchical structure

**Areas for Improvement:**
- Schema must support multiple admins (SYN-3 objective)
- Admin history tracking for audit compliance
- Consistent permission logic between frontend and backend
- Validation of admin appointments within proper hierarchy
- Documentation of admin vs. leader responsibilities

**Strategic Recommendation:**  
Complete SYN-3 implementation following the phased checklist above, then prioritize admin history tracking and permission logic centralization to ensure long-term maintainability and governance compliance.

---

**Document Version:** 1.0  
**Last Updated:** January 3, 2026  
**Related Ticket:** SYN-3
