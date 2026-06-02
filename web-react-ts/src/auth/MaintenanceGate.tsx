/**
 * MaintenanceGate — thin gate component extracted from the commented block in
 * web-react-ts/src/index.tsx (lines 143–149).
 *
 * The original code used a hardcoded `if (true)` literal, which meant the
 * maintenance flag was not parameterised and therefore impossible to test
 * or toggle without a code change.  This component accepts an explicit prop
 * so both states (on/off) can be exercised in unit tests and the flag can be
 * wired to an env var or feature flag in production.
 *
 * Usage in index.tsx (replace the commented block):
 *   <MaintenanceGate active={import.meta.env.VITE_MAINTENANCE === 'true'}>
 *     <AppWithApollo ... />
 *   </MaintenanceGate>
 *
 * Sabbath gate is kept separate — see SabbathGate.tsx.
 */
import React from 'react'
import MaintenanceMode from './MaintenanceMode'

type MaintenanceGateProps = {
  /** When true the app is blocked and <MaintenanceMode /> is shown. */
  active: boolean
  children: React.ReactNode
}

const MaintenanceGate: React.FC<MaintenanceGateProps> = ({
  active,
  children,
}) => {
  if (active) {
    return <MaintenanceMode />
  }

  return <>{children}</>
}

export default MaintenanceGate
