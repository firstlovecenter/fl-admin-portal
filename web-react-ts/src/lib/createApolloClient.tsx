/**
 * createApolloClient — SYN-79
 *
 * Builds the ApolloClient used by the admin portal. Extracted from src/index.tsx
 * so the link chain (retry → error → auth → http) can be unit-tested with MSW
 * without having to mount the full React app + AuthProvider.
 *
 * Behaviour-preserving: every link, every option, every constant matches the
 * inline construction that previously lived in AppWithApollo. The only change
 * is the seam — index.tsx now calls this factory.
 *
 * The factory takes a `getAccessTokenSilently` resolver so callers can supply
 * either the real AuthContext token getter or a test stub. Apollo links read
 * the token per-request through this closure, so token rotation (refresh,
 * logout) is reflected on the next outgoing request without rebuilding the
 * client.
 */

import { RetryLink } from '@apollo/client/link/retry'
import { onError } from '@apollo/client/link/error'
import {
  ApolloClient,
  NormalizedCacheObject,
  ServerError,
  ServerParseError,
  createHttpLink,
  from,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { toast } from 'sonner'
import buildApolloCache from 'lib/apollo-cache'

export const AUTH_LINK_TOKEN_TIMEOUT_MS = 8000

export const RETRY_LINK_MAX_ATTEMPTS = 5

export interface CreateApolloClientOptions {
  /**
   * Resolver for the per-request access token. Returns the raw JWT, or rejects
   * if no valid token is available (in which case the request goes out with
   * no Authorization header and the server rejects it).
   */
  getAccessTokenSilently: () => Promise<string>
  /**
   * Override the GraphQL endpoint. Defaults to VITE_SYNAGO_GRAPHQL_URI or
   * `http://localhost:4001/graphql`. Tests pass an MSW-intercepted URL here.
   */
  uri?: string
}

const defaultUri = (): string =>
  import.meta.env.VITE_SYNAGO_GRAPHQL_URI || 'http://localhost:4001/graphql'

export function createApolloClient({
  getAccessTokenSilently,
  uri,
}: CreateApolloClientOptions): ApolloClient<NormalizedCacheObject> {
  const resolvedUri = uri ?? defaultUri()

  const httpLink = createHttpLink({ uri: resolvedUri })

  const authLink = setContext(async (_, { headers }) => {
    // Pull a fresh token per-request. getAccessTokenSilently transparently
    // refreshes via the refresh token when the access token is past the
    // local expiry buffer, so outgoing queries never ship a stale Bearer.
    // Race against a timeout so a hung refresh fetch can't block every
    // in-flight request indefinitely — RetryLink only retries failures, not
    // requests stalled in the link layer.
    let token = ''
    let timerId: ReturnType<typeof setTimeout> | undefined
    try {
      token = await Promise.race([
        getAccessTokenSilently(),
        new Promise<string>((_resolve, reject) => {
          timerId = setTimeout(
            () => reject(new Error('Auth token fetch timed out')),
            AUTH_LINK_TOKEN_TIMEOUT_MS
          )
        }),
      ])
    } catch {
      // No token / refresh failed / timed out. If refresh failed for real,
      // AuthContext has already cleared the user and SimpleApp will swap to
      // the login screen; if it timed out, the request goes without auth and
      // the server will reject it.
    } finally {
      if (timerId !== undefined) clearTimeout(timerId)
    }

    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  })

  const retryLink = new RetryLink({
    delay: {
      initial: 300,
      max: 2000,
      jitter: true,
    },
    attempts: {
      max: RETRY_LINK_MAX_ATTEMPTS,
      // 4xx responses are client errors — auth / permission / validation.
      // Looping them is harmful (token-expiry storms, lock-out cascades), so
      // only retry on transport failures (no statusCode) and 5xx responses.
      // HttpLink rejects with ServerError or ServerParseError on HTTP-status
      // failures (both carry statusCode); transport failures (DNS, abort,
      // network drop) reject with a plain Error with no statusCode.
      retryIf: (
        error: ServerError | ServerParseError | Error | undefined
      ): boolean => {
        if (!error) return false
        if (!('statusCode' in error)) return true
        return error.statusCode >= 500
      },
    },
  })

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    // SYN-178 — never render raw GraphQL/network internals (message, locations,
    // path, Neo4j error text) into a user-facing toast. Show a generic message;
    // the technical detail only reaches the dev console (compiled out of the
    // production bundle via import.meta.env.DEV).
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        if (message.includes('Unauthenticated')) return

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error(
            `[GraphQL error]: ${message}`,
            locations ? { locations, path } : { path }
          )
        }

        toast.error('Something went wrong', {
          id: `gql:${message}:${path?.join('.') ?? ''}`,
          description: 'Please try again. If this keeps happening, contact support.',
          duration: 8000,
        })
      })
    }

    if (
      networkError &&
      !networkError.message.includes('400') &&
      !networkError.message.includes('Failed to fetch')
    ) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(`[Network error]: ${networkError.message}`)
      }

      toast.error('Network Error', {
        id: `network:${networkError.message}`,
        description:
          'We could not reach the server. Check your connection and try again.',
        duration: 8000,
      })
    }
  })

  const errorPolicy = 'all'

  // Link order matters. errorLink sits OUTSIDE the retry boundary so a
  // GraphQL or network error surfaces a toast exactly once per query —
  // regardless of how many attempts retryLink burned underneath. The retry
  // boundary then wraps authLink + httpLink so each attempt picks up a fresh
  // Authorization header (token rotation between attempts is supported).
  return new ApolloClient({
    uri: resolvedUri,
    link: from([errorLink, retryLink, authLink.concat(httpLink)]),
    cache: buildApolloCache(),
    connectToDevTools: true,
    defaultOptions: {
      watchQuery: {
        errorPolicy,
      },
      query: {
        errorPolicy,
      },
      mutate: {
        errorPolicy,
      },
    },
  })
}
