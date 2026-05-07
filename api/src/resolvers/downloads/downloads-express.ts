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

const mountDownloadRoutes = (
  app: Express,
  driver: Driver,
  jwtSecret: string | undefined
): void => {
  app.get(
    '/downloads/membership/:level/:churchId.csv',
    cors(),
    handleDownloadRequest(driver, jwtSecret)
  )
}

export default mountDownloadRoutes
