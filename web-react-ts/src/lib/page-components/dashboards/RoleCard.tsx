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
      className={`card rounded-corners role-card pointer colour-${role?.toLowerCase()}`}
    >
      <PlaceholderCustom
        className="card rounded-corners role-card"
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
