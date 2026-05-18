/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import type { Driver } from 'neo4j-driver'
import type { Express, Request, Response } from 'express'
import cors from 'cors'
import {
  AncestorLevel,
  buildContentDisposition,
  DownloadError,
  handleMembershipDownload,
  isAncestorLevel,
  isDownloadLevel,
} from './downloads-handler'
import {
  handleDefaultersDownload,
  isDefaultersDownloadLevel,
} from './defaulters-handler'
import { isDefaultersTargetLevel } from './defaulters-cypher'
import {
  handleArrivalsDownload,
  isArrivalsDownloadLevel,
} from './arrivals-handler'
import { isArrivalsTargetLevel } from './arrivals-cypher'
import { verifyJwt } from '../utils/verify-jwt'

const handleDownloadRequest =
  (driver: Driver, jwtSecret: string | undefined) =>
  async (req: Request, res: Response): Promise<void> => {
    const { level, churchId } = req.params

    if (!isDownloadLevel(level)) {
      res.status(400).json({ error: 'Invalid church level' })
      return
    }

    const jwt = verifyJwt(req.headers.authorization, jwtSecret)
    if (!jwt) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Comma-separated list of ancestor levels to include as columns.
    //   missing            -> undefined -> handler picks the scope default
    //                         (every level below scope; legacy behaviour)
    //   `?levels=`         -> []        -> identity-only CSV (the Bacenta-
    //                         scope shape, also reachable via the FE Clear
    //                         button)
    //   `?levels=Stream`   -> ['Stream'] etc.
    // Unknown tokens are dropped silently rather than 400-ing so a stale
    // FE never breaks the download. But if EVERY token is unknown (e.g.
    // `?levels=garbage`) we fall back to the scope default rather than
    // silently emitting an identity-only CSV — "I sent something but you
    // understood none of it" is not the same intent as "I want nothing".
    //
    // 1KB cap on the raw string and 16-element cap on the split limit the
    // worst-case allocation if a misbehaving client posts a giant value.
    // Reverse proxies / API Gateway also bound URL length, so this is
    // belt-and-braces.
    const rawLevels = req.query.levels
    const MAX_LEVELS_RAW = 1024
    const MAX_LEVELS_COUNT = 16
    let ancestorLevels: AncestorLevel[] | undefined
    if (typeof rawLevels === 'string' && rawLevels.length <= MAX_LEVELS_RAW) {
      if (rawLevels.length === 0) {
        ancestorLevels = []
      } else {
        const parsed = rawLevels
          .split(',', MAX_LEVELS_COUNT)
          .map((s) => s.trim())
          .filter(isAncestorLevel)
        // All garbage -> defer to handler's default
        ancestorLevels = parsed.length > 0 ? parsed : undefined
      }
    }

    // Lets the streaming loop bail when the client closes the tab / loses
    // signal mid-download, so we don't keep formatting rows for a socket
    // that nobody is reading.
    const abort = { aborted: false }
    req.on('close', () => {
      abort.aborted = true
    })

    try {
      await handleMembershipDownload({
        driver,
        level,
        churchId,
        levels: ancestorLevels,
        roles: jwt.roles,
        userId: jwt.userId,
        output: res,
        abort,
        hooks: {
          onPrepared: (filename) => {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.setHeader(
              'Content-Disposition',
              buildContentDisposition(filename)
            )
          },
        },
      })
      res.end()
    } catch (error) {
      console.error(
        '[downloads] Membership export failed:',
        (error as Error)?.message ?? 'unknown error'
      )
      if (res.headersSent) {
        res.end()
        return
      }

      let status = 500
      let message = 'Download failed'
      if (error instanceof DownloadError) {
        status = error.statusCode
        message = error.message
      } else if (
        (error as { extensions?: { code?: string } })?.extensions?.code ===
        'FORBIDDEN'
      ) {
        status = 403
        message = (error as Error).message
      }

      res.status(status).json({ error: message })
    }
  }

const handleDefaultersRequest =
  (driver: Driver, jwtSecret: string | undefined) =>
  async (req: Request, res: Response): Promise<void> => {
    const { level, churchId } = req.params

    if (!isDefaultersDownloadLevel(level)) {
      res.status(400).json({ error: 'Invalid church level for defaulters' })
      return
    }

    const jwt = verifyJwt(req.headers.authorization, jwtSecret)
    if (!jwt) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const rawWeekStart = req.query.weekStart
    const weekStart =
      typeof rawWeekStart === 'string' && rawWeekStart.length > 0
        ? rawWeekStart
        : null

    // Optional picker target. Unknown values silently fall back to `null`
    // so the handler returns the legacy `summary` shape — keeps stale
    // FE bundles working through deploys.
    const rawTarget = req.query.targetLevel
    const targetLevel =
      typeof rawTarget === 'string' && isDefaultersTargetLevel(rawTarget)
        ? rawTarget
        : null

    try {
      const payload = await handleDefaultersDownload({
        driver,
        level,
        churchId,
        weekStart,
        targetLevel,
        roles: jwt.roles,
        userId: jwt.userId,
      })
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      // Don't cache: the underlying bacenta state can change minute-to-minute
      // (banking confirmations, late form submissions). A stale Excel that
      // omits a recent banking is more harmful than the bandwidth cost.
      res.setHeader('Cache-Control', 'no-store')
      res.json(payload)
    } catch (error) {
      console.error(
        '[downloads] Defaulters export failed:',
        (error as Error)?.message ?? 'unknown error'
      )
      let status = 500
      let message = 'Download failed'
      if (error instanceof DownloadError) {
        status = error.statusCode
        message = error.message
      } else if (
        (error as { extensions?: { code?: string } })?.extensions?.code ===
        'FORBIDDEN'
      ) {
        status = 403
        message = (error as Error).message
      }
      res.status(status).json({ error: message })
    }
  }

const handleArrivalsRequest =
  (driver: Driver, jwtSecret: string | undefined) =>
  async (req: Request, res: Response): Promise<void> => {
    const { level, churchId } = req.params

    if (!isArrivalsDownloadLevel(level)) {
      res.status(400).json({ error: 'Invalid church level for arrivals' })
      return
    }

    const jwt = verifyJwt(req.headers.authorization, jwtSecret)
    if (!jwt) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const rawArrivalDate = req.query.arrivalDate
    const arrivalDate =
      typeof rawArrivalDate === 'string' && rawArrivalDate.length > 0
        ? rawArrivalDate
        : ''

    const rawTarget = req.query.targetLevel
    const targetLevel =
      typeof rawTarget === 'string' && isArrivalsTargetLevel(rawTarget)
        ? rawTarget
        : null

    try {
      const payload = await handleArrivalsDownload({
        driver,
        level,
        churchId,
        arrivalDate,
        targetLevel,
        roles: jwt.roles,
        userId: jwt.userId,
      })
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      // Mid-Sunday vehicle payments and late attendance counts both move the
      // numbers; a stale spreadsheet would mis-state who paid whom.
      res.setHeader('Cache-Control', 'no-store')
      res.json(payload)
    } catch (error) {
      console.error(
        '[downloads] Arrivals export failed:',
        (error as Error)?.message ?? 'unknown error'
      )
      let status = 500
      let message = 'Download failed'
      if (error instanceof DownloadError) {
        status = error.statusCode
        message = error.message
      } else if (
        (error as { extensions?: { code?: string } })?.extensions?.code ===
        'FORBIDDEN'
      ) {
        status = 403
        message = (error as Error).message
      }
      res.status(status).json({ error: message })
    }
  }

const mountDownloadRoutes = (
  app: Express,
  driver: Driver,
  jwtSecret: string | undefined
): void => {
  // Allow CORS preflight for all download routes. The browser sends OPTIONS
  // before the credentialled GET because of the Authorization header. Without
  // this, the preflight gets no Access-Control-Allow-Origin and the actual
  // request is blocked before it fires.
  app.options('/downloads/*', cors())

  app.get(
    '/downloads/membership/:level/:churchId.csv',
    cors(),
    handleDownloadRequest(driver, jwtSecret)
  )
  app.get(
    '/downloads/defaulters/:level/:churchId.json',
    cors(),
    handleDefaultersRequest(driver, jwtSecret)
  )
  app.get(
    '/downloads/arrivals/:level/:churchId.json',
    cors(),
    handleArrivalsRequest(driver, jwtSecret)
  )
}

export default mountDownloadRoutes
