/**
 * SabbathGate — thin gate component extracted from the commented block in
 * web-react-ts/src/index.tsx (lines 139–149).
 *
 * The gate logic previously lived inline in AppWithApollo but was commented
 * out, making it untestable.  Extracting it here gives us a testable seam
 * (vi.useFakeTimers / vi.setSystemTime) without touching the rest of
 * index.tsx bootstrap code.
 *
 * Gate rule (from the original comment):
 *   new Date().getDay() === 1 && new Date().getHours() > 4
 *   → getDay() === 1 is Monday (Africa/Accra = UTC+0, no DST)
 *   → getHours() > 4 means hour 5 (05:00) and later; exactly 04:xx does NOT trigger it
 *
 * When the gate fires, <Sabbath /> is rendered in place of children.
 *
 * Usage in index.tsx (replace the commented block):
 *   <SabbathGate>
 *     <AppWithApollo ... />
 *   </SabbathGate>
 *
 * Maintenance gate is kept separate — see MaintenanceGate.tsx.
 */
import React from 'react'
import Sabbath from './Sabbath'

type SabbathGateProps = {
  children: React.ReactNode
  /**
   * Override clock for testing.  Defaults to () => new Date().
   * Pass a function that returns a fixed Date to pin the time.
   */
  now?: () => Date
}

const SabbathGate: React.FC<SabbathGateProps> = ({
  children,
  now = () => new Date(),
}) => {
  const date = now()
  const isSabbath = date.getDay() === 1 && date.getHours() > 4

  if (isSabbath) {
    return <Sabbath />
  }

  return <>{children}</>
}

export default SabbathGate
