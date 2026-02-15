/**
 * Example: Integrating Multi-Admin Manager into an Existing Church Details Page
 * 
 * This file demonstrates how to add the MultiAdminManager component to an existing
 * church details display page (e.g., Council, Stream, Campus details).
 */

import React from 'react'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import MultiAdminManager from '../DisplayChurchDetails/MultiAdminManager'
import { useContext } from 'react'
import { ChurchContext } from '../../contexts/ChurchContext'

// STEP 1: Update your GraphQL query to fetch admins (plural) instead of admin (singular)
const GET_COUNCIL_DETAILS = gql`
  query GetCouncilDetails($id: ID!) {
    councils(where: { id: $id }) {
      id
      name
      # OLD: Single admin (for backward compatibility)
      admin {
        id
        firstName
        lastName
        pictureUrl
      }
      # NEW: Multiple admins (recommended)
      admins {
        id
        firstName
        lastName
        pictureUrl
      }
      leader {
        id
        firstName
        lastName
        pictureUrl
      }
      # ... other fields
    }
  }
`

// STEP 2: Update your component to use the MultiAdminManager
const CouncilDetailsExample = ({ councilId }: { councilId: string }) => {
  const { clickCard } = useContext(ChurchContext)
  const { data, loading } = useQuery(GET_COUNCIL_DETAILS, {
    variables: { id: councilId },
  })

  const council = data?.councils?.[0]

  if (loading) return <div>Loading...</div>
  if (!council) return <div>Council not found</div>

  return (
    <div>
      <h1>{council.name} Council</h1>
      
      {/* Leader display (unchanged) */}
      <div className="mb-3">
        <h4>Leader</h4>
        {/* ... leader display code ... */}
      </div>

      {/* OLD WAY: Single admin display
      {council.admin && (
        <div className="mb-3">
          <h4>Admin</h4>
          <MemberAvatarWithName member={council.admin} />
        </div>
      )}
      */}

      {/* NEW WAY: Multi-admin manager */}
      <MultiAdminManager
        admins={council.admins || []} // Use empty array as fallback
        churchId={council.id}
        churchType="Council"
        churchName={council.name}
        clickCard={clickCard}
      />

      {/* Rest of your component */}
      <div>
        {/* ... other details ... */}
      </div>
    </div>
  )
}

export default CouncilDetailsExample

/**
 * INTEGRATION CHECKLIST:
 * 
 * ✅ 1. Update GraphQL query to include 'admins' field
 * ✅ 2. Import MultiAdminManager component
 * ✅ 3. Replace existing admin display with MultiAdminManager
 * ✅ 4. Pass required props: admins, churchId, churchType, churchName, clickCard
 * ✅ 5. Test the component to ensure:
 *    - All current admins are displayed
 *    - Add admin button works
 *    - Remove admin button works
 *    - Cannot remove last admin
 *    - Cannot add duplicate admins
 * 
 * PERMISSION REQUIREMENTS:
 * 
 * The MultiAdminManager component respects existing permissions:
 * - Stream admins can manage Council admins
 * - Campus admins can manage Stream admins  
 * - Oversight admins can manage Campus admins
 * - Denomination admins can manage Oversight admins
 * 
 * These permissions are enforced in the backend mutations via permitAdmin() functions.
 * 
 * For UI-level permission checks, wrap the component with RoleView:
 * 
 * <RoleView roles={permitAdmin('Stream')}>
 *   <MultiAdminManager {...props} />
 * </RoleView>
 */
