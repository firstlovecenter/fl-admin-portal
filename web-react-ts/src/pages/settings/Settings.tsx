import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Settings as SettingsIcon, RotateCcw } from 'lucide-react'
import { Button } from 'components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select'
import { StickyPageHeader } from 'components/shell/StickyPageHeader'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import {
  clearDefaultScopeKey,
  readDefaultScopeKey,
  writeDefaultScopeKey,
} from 'lib/default-scope-storage'
import { formatChurchLevel, getRoleRelationLabel } from 'lib/scope-display'
import LanguageCard from './LanguageCard'
import NotificationsCard from './NotificationsCard'

const Settings = () => {
  const { t } = useTranslation()
  const { roleChurchOptions, selectedScopeKey, setSelectedScopeKey } =
    useChurchRoleScope()
  const [persistedKey, setPersistedKey] = useState<string>(
    () => readDefaultScopeKey() ?? ''
  )
  const [pendingKey, setPendingKey] = useState<string>(selectedScopeKey)

  const persistedOption = roleChurchOptions.find(
    (option) => option.key === persistedKey
  )

  const isPersistedKeyStale = Boolean(persistedKey) && !persistedOption

  const handleSave = () => {
    if (!pendingKey) return
    writeDefaultScopeKey(pendingKey)
    setPersistedKey(pendingKey)
    setSelectedScopeKey(pendingKey)
    toast.success(t('settings.defaultChurch.savedToast'))
  }

  const handleReset = () => {
    clearDefaultScopeKey()
    setPersistedKey('')
    toast.info(t('settings.defaultChurch.clearedToast'))
  }

  const isSaved = Boolean(pendingKey) && pendingKey === persistedKey
  const hasOptions = roleChurchOptions.length > 0

  return (
    <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
      <StickyPageHeader innerClassName="max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-accent">
            <SettingsIcon className="size-5 text-sidebar-foreground/70" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('settings.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
      </StickyPageHeader>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.defaultChurch.title')}</CardTitle>
            <CardDescription>
              {t('settings.defaultChurch.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasOptions ? (
              <p className="text-sm text-muted-foreground">
                {t('settings.defaultChurch.noScopes')}
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="default-scope-select"
                    className="text-sm font-medium"
                  >
                    {t('settings.defaultChurch.label')}
                  </label>
                  <Select value={pendingKey} onValueChange={setPendingKey}>
                    <SelectTrigger
                      id="default-scope-select"
                      className="h-11 w-full"
                      aria-label={t('settings.defaultChurch.placeholder')}
                    >
                      <SelectValue
                        placeholder={t('settings.defaultChurch.placeholder')}
                      />
                    </SelectTrigger>
                    <SelectContent align="start" className="max-h-80">
                      {roleChurchOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.churchName} ·{' '}
                          {formatChurchLevel(option.churchType, t)} ·{' '}
                          {getRoleRelationLabel(
                            option.authRole,
                            option.roleName,
                            t
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {persistedOption ? (
                    <p className="text-xs text-muted-foreground">
                      {t('settings.defaultChurch.savedDefault', {
                        value: [
                          persistedOption.churchName,
                          formatChurchLevel(persistedOption.churchType, t),
                          getRoleRelationLabel(
                            persistedOption.authRole,
                            persistedOption.roleName,
                            t
                          ),
                        ].join(' · '),
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {isPersistedKeyStale
                        ? t('settings.defaultChurch.staleDefault')
                        : t('settings.defaultChurch.noneSaved')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 gap-2"
                    onClick={handleReset}
                    disabled={!persistedKey}
                  >
                    <RotateCcw className="size-4" />
                    {t('settings.defaultChurch.reset')}
                  </Button>
                  <Button
                    type="button"
                    className="h-11"
                    onClick={handleSave}
                    disabled={!pendingKey || isSaved}
                  >
                    {isSaved
                      ? t('settings.defaultChurch.saved')
                      : t('settings.defaultChurch.save')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <LanguageCard />

        <NotificationsCard />
      </div>
    </div>
  )
}

export default Settings
