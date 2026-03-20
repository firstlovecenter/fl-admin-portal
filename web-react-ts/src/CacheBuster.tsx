/* eslint-disable no-console*/
// @ts-nocheck
import { useState, useEffect } from 'react'
import packageJson from '../package.json'

const appVersion = packageJson.version

// version from response - first param, local version second param
const semverGreaterThan = (versionA, versionB) => {
  const versionsA = versionA.split(/\./g)
  const versionsB = versionB.split(/\./g)

  while (versionsA.length || versionsB.length) {
    const a = Number(versionsA.shift())
    const b = Number(versionsB.shift())

    if (a === b) continue

    return a > b || isNaN(b)
  }

  return false
}

const CacheBuster = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [isLatestVersion, setIsLatestVersion] = useState(false)

  useEffect(() => {
    fetch('/meta.json')
      .then((response) => response.json())
      .then((meta) => {
        const latestVersion = meta.version
        //@ts-ignore
        const currentVersion = appVersion

        const shouldForceRefresh = semverGreaterThan(
          latestVersion,
          currentVersion
        )

        if (shouldForceRefresh) {
          console.log(
            `We have a new version - ${latestVersion}. Should force refresh`
          )
          setIsLatestVersion(false)
        } else {
          console.log(
            `You already have the latest version - ${latestVersion}. No cache refresh needed.`
          )
          setIsLatestVersion(true)
        }

        setLoading(false)
      })
  }, [])

  const refreshCacheAndReload = async () => {
    console.log('Clearing cache and hard reloading...')

    if (caches) {
      caches.keys().then(async function (names) {
        await Promise.all(names.map((name) => caches.delete(name)))
      })
    }

    window.location.reload()
  }

  return children({
    loading,
    isLatestVersion,
    refreshCacheAndReload,
  })
}

export default CacheBuster
