import { useTranslation } from 'react-i18next'

const MaintenanceMode = () => {
  const { t } = useTranslation()
  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('shared.maintenance.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('shared.maintenance.body')}
        </p>
      </div>
    </div>
  )
}

export default MaintenanceMode
