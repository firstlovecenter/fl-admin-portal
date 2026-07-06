import { permitMe } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { isAuth, throwToSentry } from '../utils/utils'
import { REGISTER_PUSH_TOKEN, UNREGISTER_PUSH_TOKEN } from './push-token-cypher'

type PushTokenArgs = {
  token: string
}

// FCM registration tokens are ~150–350 chars; reject anything absurd so a
// caller can't stuff junk onto their own node. Bounded to self either way.
const MAX_TOKEN_LENGTH = 4096

const cleanToken = (raw: string | undefined): string | null => {
  const token = raw?.trim()
  if (!token || token.length > MAX_TOKEN_LENGTH) return null
  return token
}

// Both mutations are self-scoped: the write always targets the Member node
// identified by `context.jwt.userId`. The caller can only ever add/remove a
// token on their own account, so no IDOR surface exists regardless of role —
// `permitMe('Bacenta')` (any servant) is the gate.

export const RegisterPushToken = async (
  _source: unknown,
  args: PushTokenArgs,
  context: Context
): Promise<boolean> => {
  isAuth(permitMe('Bacenta'), context.jwt?.roles)

  const userId = context.jwt?.userId
  const token = cleanToken(args.token)
  if (!userId || !token) {
    throwToSentry('Unable to register push token', 'Missing or invalid token')
  }

  const session = context.executionContext.session()
  try {
    await session.executeWrite((tx) =>
      tx.run(REGISTER_PUSH_TOKEN, {
        userId,
        token,
      })
    )
    return true
  } catch (error) {
    return throwToSentry('Unable to register push token', error)
  } finally {
    await session.close()
  }
}

export const UnregisterPushToken = async (
  _source: unknown,
  args: PushTokenArgs,
  context: Context
): Promise<boolean> => {
  isAuth(permitMe('Bacenta'), context.jwt?.roles)

  const userId = context.jwt?.userId
  const token = cleanToken(args.token)
  if (!userId || !token) {
    throwToSentry('Unable to unregister push token', 'Missing or invalid token')
  }

  const session = context.executionContext.session()
  try {
    await session.executeWrite((tx) =>
      tx.run(UNREGISTER_PUSH_TOKEN, {
        userId,
        token,
      })
    )
    return true
  } catch (error) {
    return throwToSentry('Unable to unregister push token', error)
  } finally {
    await session.close()
  }
}

const pushTokenMutations = {
  RegisterPushToken,
  UnregisterPushToken,
}

export default pushTokenMutations
