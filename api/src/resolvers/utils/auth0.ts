import { Member, Role } from './types'
import loadSecrets from '../secrets'

export type Auth0RoleObject = {
  // eslint-disable-next-line no-unused-vars
  [key in Role]: { id: string }
} & {
  id: string
  name: string
  description: string
}

export const createAuthUserConfig = async (member: Member, token: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'post',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
    data: {
      connection: `flcadmin${SECRETS.TEST_ENV ? '-test' : ''}`,
      email: member.email,
      given_name: member.firstName,
      family_name: member.lastName,
      name: `${member.firstName} ${member.lastName}`,
      picture:
        member.pictureUrl ||
        'https://res.cloudinary.com/firstlovecenter/image/upload/v1627893621/user_qvwhs7.png',
      user_id: member.id,
      password: SECRETS.TEST_ENV ? 'password' : 'rAnd0MLetteR5',
    },
  }
}

export const updateAuthUserConfig = async (member: Member, token: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'patch',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users/${member.auth_id}`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
    data: {
      connection: `flcadmin${SECRETS.TEST_ENV ? '-test' : ''}`,
      email: member.email,
      given_name: member.firstName,
      family_name: member.lastName,
      name: `${member.firstName} ${member.lastName}`,
      picture:
        member.pictureUrl ||
        'https://res.cloudinary.com/firstlovecenter/image/upload/v1627893621/user_qvwhs7.png',
    },
  }
}

export const changePasswordConfig = async (member: Member, token: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'post',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/tickets/password-change`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
    data: {
      connection_id: SECRETS.AUTH0_DB_CONNECTION_ID,
      email: member.email,
      mark_email_as_verified: true,
    },
  }
}

export const deleteAuthUserConfig = async (memberId: string, token: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'delete',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users/${memberId}`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
  }
}

export const getAuthIdConfig = async (member: Member, token: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'get',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users-by-email?email=${member.email}`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
  }
}

export const getUserRoles = async (memberId: string, token: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'get',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users/${memberId}/roles`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
  }
}

export const setUserRoles = async (
  memberId: string,
  roles: Role[],
  token: string
) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'post',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users/${memberId}/roles`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
    data: {
      roles,
    },
  }
}

export const deleteUserRoles = async (
  memberId: string,
  roles: string[],
  token: string
) => {
  const SECRETS = await loadSecrets() // Await secrets here
  return {
    method: 'delete',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/users/${memberId}/roles`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
    data: {
      roles,
    },
  }
}

export const deleteRole = async (
  role: Role,
  token: string,
  authRoles: Auth0RoleObject
) => {
  const SECRETS = await loadSecrets() // Await secrets here
  const getRoleId = (roleName: Role) => authRoles[roleName].id

  return {
    method: 'delete',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/roles/${getRoleId(role)}`,
    headers: {
      autho: '',
      Authorization: `Bearer ${token}`,
    },
  }
}
