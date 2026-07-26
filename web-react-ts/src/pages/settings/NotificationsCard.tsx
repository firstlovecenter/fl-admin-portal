import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Bell, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card'
import { Switch } from 'components/ui/switch'
import { Badge } from 'components/ui/badge'
import { Alert, AlertDescription } from 'components/ui/alert'
import { usePushNotificationSettings } from 'hooks/usePushNotificationSettings'
import {
  NotificationCategory,
  useNotificationPreferences,
} from 'hooks/useNotificationPreferences'

type CategoryRow = {
  key: NotificationCategory
  field: 'services' | 'banking' | 'defaulters' | 'arrivals'
}

// Labels/descriptions are looked up at render time from
// `settings.notifications.categories.<field>` rather than stored here, so this
// stays a module-level constant instead of being rebuilt on every render.
const CATEGORY_ROWS: CategoryRow[] = [
  { key: 'SERVICES', field: 'services' },
  { key: 'BANKING', field: 'banking' },
  { key: 'DEFAULTERS', field: 'defaulters' },
  { key: 'ARRIVALS', field: 'arrivals' },
]

const NotificationsCard = () => {
  const { t } = useTranslation()
  const {
    supported,
    permission,
    enabled,
    enabling,
    enable,
    disable,
  } = usePushNotificationSettings()

  const blocked = permission === 'denied'
  const pushOn = enabled && permission === 'granted'

  const { preferences, loading: prefsLoading, setPreference } =
    useNotificationPreferences(supported !== true)

  const handlePushToggle = async (next: boolean) => {
    if (!next) {
      disable()
      toast.info(t('settings.notifications.mutedToast'))
      return
    }

    try {
      await enable()
      toast.success(t('settings.notifications.enabledToast'))
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'registration-failed'
      if (reason === 'denied') {
        toast.error(t('settings.notifications.deniedToast'))
      } else if (reason === 'unsupported') {
        toast.error(t('settings.notifications.unsupportedToast'))
      } else if (reason === 'default') {
        toast.info(t('settings.notifications.dismissedToast'))
      } else {
        toast.error(t('settings.notifications.failedToast'))
      }
    }
  }

  const handleCategoryToggle = async (
    category: NotificationCategory,
    next: boolean
  ) => {
    try {
      await setPreference(category, next)
    } catch {
      toast.error(t('settings.notifications.prefSaveFailedToast'))
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              {t('settings.notifications.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.notifications.description')}
            </CardDescription>
          </div>
          {pushOn ? (
            <Badge variant="success">{t('settings.notifications.on')}</Badge>
          ) : (
            <Badge variant="outline">{t('settings.notifications.off')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {supported === undefined ? (
          <p className="text-sm text-muted-foreground">
            {t('settings.notifications.checking')}
          </p>
        ) : !supported ? (
          <p className="text-sm text-muted-foreground">
            {t('settings.notifications.unsupported')}
          </p>
        ) : (
          <>
            <label
              htmlFor="push-toggle"
              className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                {t('settings.notifications.pushToggle')}
                {enabling && (
                  <span
                    role="status"
                    className="flex items-center gap-1 text-xs font-normal text-muted-foreground"
                  >
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    {t('settings.notifications.enabling')}
                  </span>
                )}
              </span>
              <Switch
                id="push-toggle"
                // Optimistically show "on" the moment an enable is in flight so
                // the toggle gives immediate feedback — the enable path is async
                // (permission + FCM token + server register) and would otherwise
                // look unresponsive. Reverts to `pushOn` if enabling fails.
                checked={enabling ? true : pushOn}
                disabled={enabling || blocked}
                onCheckedChange={handlePushToggle}
                aria-label={t('settings.notifications.togglePushAria')}
              />
            </label>

            {blocked && (
              <Alert>
                <AlertDescription>
                  {t('settings.notifications.blocked')}
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4">
              <p className="mb-1 text-sm font-medium">
                {t('settings.notifications.whatToBeReminded')}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                {pushOn
                  ? t('settings.notifications.chooseReminders')
                  : t('settings.notifications.turnOnFirst')}
              </p>
              <div className="divide-y">
                {CATEGORY_ROWS.map((row) => {
                  const label = t(
                    `settings.notifications.categories.${row.field}.label`
                  )

                  return (
                    <label
                      key={row.key}
                      htmlFor={`category-${row.key}`}
                      className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2"
                    >
                      <span>
                        <span className="block text-sm font-medium">
                          {label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {t(
                            `settings.notifications.categories.${row.field}.description`
                          )}
                        </span>
                      </span>
                      <Switch
                        id={`category-${row.key}`}
                        checked={preferences[row.field]}
                        disabled={!pushOn || prefsLoading}
                        onCheckedChange={(next) =>
                          handleCategoryToggle(row.key, next)
                        }
                        aria-label={t('settings.notifications.toggleAria', {
                          label,
                        })}
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default NotificationsCard
