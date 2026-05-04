import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Role, UserJobs } from 'global-types'
import { getHighestRole } from 'pages/directory/update/directory-utils'
import { MemberContext } from './MemberContext'

export interface RoleChurchScopeOption {
  key: string
  authRole: Role
  churchId: string
  churchName: string
  churchType: string
  roleName: string
  roleDisplayName: string
}

interface ChurchRoleScopeContextValue {
  roleChurchOptions: RoleChurchScopeOption[]
  selectedScopeKey: string
  setSelectedScopeKey: (key: string) => void
  selectedScope?: RoleChurchScopeOption
}

const dashboardScopeSupportedRoles: Role[] = [
  'leaderFellowship',
  'leaderBacenta',
  'leaderGovernorship',
  'leaderCouncil',
  'leaderStream',
  'leaderCampus',
  'leaderOversight',
  'leaderDenomination',
  'adminGovernorship',
  'adminCouncil',
  'adminStream',
  'adminCampus',
  'adminOversight',
  'adminDenomination',
  'arrivalsAdminGovernorship',
  'arrivalsAdminCouncil',
  'arrivalsAdminStream',
  'arrivalsAdminCampus',
  'arrivalsCounterStream',
  'tellerStream',
  'leaderHub',
  'leaderHubCouncil',
  'leaderMinistry',
  'leaderCreativeArts',
  'adminMinistry',
  'adminCreativeArts',
]

const ChurchRoleScopeContext = createContext<
  ChurchRoleScopeContextValue | undefined
>(undefined)

const formatChurchTypeLabel = (churchType: string) =>
  churchType.replace(/([a-z])([A-Z])/g, '$1 $2')

const buildRoleDisplayName = (
  authRole: Role,
  churchType: string,
  fallbackRoleName: string
) => {
  const levelLabel = formatChurchTypeLabel(churchType)

  if (authRole.startsWith('leader')) {
    return `${levelLabel} Leader`
  }

  if (authRole.startsWith('admin')) {
    return `${levelLabel} Admin`
  }

  if (authRole.startsWith('arrivalsAdmin')) {
    return `${levelLabel} Arrivals Admin`
  }

  if (authRole.startsWith('arrivalsCounter')) {
    return `${levelLabel} Arrivals Counter`
  }

  if (authRole.startsWith('teller')) {
    return `${levelLabel} Teller`
  }

  return fallbackRoleName
}

type MemberContextShape = {
  currentUser?: { roles?: Role[] }
  userJobs?: UserJobs[]
}

export const ChurchRoleScopeProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, userJobs } = useContext(MemberContext) as MemberContextShape
  const [selectedScopeKey, setSelectedScopeKey] = useState('')

  const roleChurchOptions = useMemo(
    () =>
      (userJobs ?? []).flatMap((role: UserJobs) => {
        const authRole = role.authRoles as Role

        if (!dashboardScopeSupportedRoles.includes(authRole)) {
          return []
        }

        return (role.church ?? []).map((church) => ({
          key: `${authRole}:${church.id}`,
          authRole,
          churchId: church.id,
          churchName: church.name,
          churchType: church.__typename,
          roleName: role.name,
          roleDisplayName: buildRoleDisplayName(
            authRole,
            church.__typename,
            role.name
          ),
        }))
      }),
    [userJobs]
  )

  useEffect(() => {
    if (!roleChurchOptions.length) {
      setSelectedScopeKey('')
      return
    }

    const currentSelectionExists = roleChurchOptions.some(
      (option: RoleChurchScopeOption) => option.key === selectedScopeKey
    )

    if (!selectedScopeKey || !currentSelectionExists) {
      const { highestLevel, highestVerb } = getHighestRole(currentUser?.roles ?? [])
      const highestRole = `${highestVerb}${highestLevel}` as Role

      const highestRoleOption = roleChurchOptions.find(
        (option: RoleChurchScopeOption) => option.authRole === highestRole
      )

      setSelectedScopeKey(highestRoleOption?.key || roleChurchOptions[0].key)
    }
  }, [currentUser?.roles, roleChurchOptions, selectedScopeKey])

  const selectedScope = useMemo<RoleChurchScopeOption | undefined>(
    () =>
      roleChurchOptions.find(
        (option: RoleChurchScopeOption) => option.key === selectedScopeKey
      ),
    [roleChurchOptions, selectedScopeKey]
  )

  const value = useMemo(
    () => ({
      roleChurchOptions,
      selectedScopeKey,
      setSelectedScopeKey,
      selectedScope,
    }),
    [roleChurchOptions, selectedScopeKey, selectedScope]
  )

  return (
    <ChurchRoleScopeContext.Provider value={value}>
      {children}
    </ChurchRoleScopeContext.Provider>
  )
}

export const useChurchRoleScope = () => {
  const context = useContext(ChurchRoleScopeContext)

  if (!context) {
    throw new Error('useChurchRoleScope must be used within ChurchRoleScopeProvider')
  }

  return context
}
