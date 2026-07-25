import { useMutation } from '@apollo/client'
import PlaceholderCustom from 'components/Placeholder'
import { Role } from 'global-types'
import React, { useEffect } from 'react'
import { REMOVE_USER_ROLE } from './DashboardQueries'

type RoleCardProps = {
  number: number | string
  role: Role
  authRoles: string
  loading: boolean
}

// Dashboards.css only defines colour-bacenta / colour-governorship / etc.
// (English-only selectors). `role` is now a translated display string in
// non-English locales (e.g. "Gouvernorat"), so deriving the colour class
// from it would go blank outside English — derive it from `authRoles`
// instead, which is always the untranslated internal role key
// (e.g. "adminGovernorship") and always ends with one of these levels.
const CHURCH_LEVELS_BY_COLOUR_CLASS = [
  'Bacenta',
  'Governorship',
  'Council',
  'Stream',
  'Campus',
  'Oversight',
  'Denomination',
]

const deriveColourClass = (authRoles: string, role: Role) => {
  const level = CHURCH_LEVELS_BY_COLOUR_CLASS.find((lvl) =>
    authRoles?.endsWith(lvl)
  )
  return `colour-${(level ?? role)?.toLowerCase()}`
}

const RoleCard = ({ number, role, authRoles, loading }: RoleCardProps) => {
  const isString = typeof number === 'string' && true

  const [RemoveRole] = useMutation(REMOVE_USER_ROLE)

  useEffect(() => {
    const removeRole = async () => {
      await RemoveRole({
        variables: {
          role: authRoles,
        },
      })
    }

    if (number === 0) {
      removeRole()
    }
  }, [])

  return (
    <div
      className={`card rounded-corners role-card pointer ${deriveColourClass(
        authRoles,
        role
      )}`}
    >
      <PlaceholderCustom
        className={`card rounded-corners role-card`}
        loading={loading}
        as="div"
        animation="wave"
        xs={12}
      >
        <div className="white text-center text-white align-items-center my-auto">
          <div className={isString ? 'church-string' : `church-number`}>
            {number}
          </div>
          <p className="dashboard-title">{role}</p>
        </div>
      </PlaceholderCustom>
    </div>
  )
}

export default RoleCard
