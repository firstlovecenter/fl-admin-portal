/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import type { Driver } from 'neo4j-driver'
import type { Express, Request, Response } from 'express'
import cors from 'cors'
import {
  buildContentDisposition,
  DownloadError,
  handleMembershipDownload,
  isDownloadLevel,
} from './downloads-handler'
import {
  handleDefaultersDownload,
  isDefaultersDownloadLevel,
} from './defaulters-handler'
import {
  handleArrivalsDownload,
  isArrivalsDownloadLevel,
} from './arrivals-handler'
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

    try {
      const payload = await handleDefaultersDownload({
        driver,
        level,
        churchId,
        weekStart,
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

    try {
      const payload = await handleArrivalsDownload({
        driver,
        level,
        churchId,
        arrivalDate,
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
