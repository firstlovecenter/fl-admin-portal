import axios from 'axios'
import { loadSecrets } from './secrets'
import { throwToSentry } from './utils/utils'
import { Auth0RoleObject } from './utils/auth0'

export const getAuthToken = async () => {
  try {
    const SECRETS = await loadSecrets() // Await secrets here
    const getTokenConfig = {
      method: 'post',
      url: `${SECRETS.AUTH0_BASE_URL}oauth/token`,
      headers: { 'content-type': 'application/json' },
      data: {
        client_id: SECRETS.AUTH0_MGMT_CLIENT_ID,
        client_secret: SECRETS.AUTH0_CLIENT_SECRET,
        audience: `${SECRETS.AUTH0_BASE_URL}api/v2/`,
        grant_type: 'client_credentials',
      },
    }
    const tokenRes = await axios(getTokenConfig)
    return tokenRes.data.access_token
  } catch (error) {
    return throwToSentry('Problem Obtaining Auth Token', error)
  }
}

export const getAuth0Roles = async (authToken: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  const getRolesConfig = {
    method: 'get',
    baseURL: SECRETS.AUTH0_BASE_URL,
    url: `/api/v2/roles`,
    headers: {
      autho: '',
      Authorization: `Bearer ${authToken}`,
    },
  }

  const rolesRes = await axios(getRolesConfig)

  const authRoles: {
    [key: string]: any
  } = {}

  rolesRes.data.forEach((role: Auth0RoleObject) => {
    authRoles[role.name] = {
      id: role.id,
      name: role.name,
      description: role.description,
    }

    return authRoles
  })

  return authRoles
}
