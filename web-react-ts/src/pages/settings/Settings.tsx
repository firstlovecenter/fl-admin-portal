import { useState } from 'react'
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
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import {
  clearDefaultScopeKey,
  readDefaultScopeKey,
  writeDefaultScopeKey,
} from 'lib/default-scope-storage'
import { formatChurchLevel, getRoleRelationLabel } from 'lib/scope-display'

const Settings = () => {
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
    toast.success('Default church saved for this device')
  }

  const handleReset = () => {
    clearDefaultScopeKey()
    setPersistedKey('')
    toast.info(
      'Default church cleared. Highest role will be used on next sign-in.'
    )
  }

  const isSaved = Boolean(pendingKey) && pendingKey === persistedKey
  const hasOptions = roleChurchOptions.length > 0

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-accent">
          <SettingsIcon className="size-5 text-sidebar-foreground/70" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Preferences saved to this device only.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Default church</CardTitle>
          <CardDescription>
            The church and role you'll start in each time you open the app on
            this device. If you have only one role, this picks itself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasOptions ? (
            <p className="text-sm text-muted-foreground">
              You don't have any church scopes assigned to your account yet.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="default-scope-select"
                  className="text-sm font-medium"
                >
                  Church in focus
                </label>
                <Select value={pendingKey} onValueChange={setPendingKey}>
                  <SelectTrigger
                    id="default-scope-select"
                    className="h-11 w-full"
                    aria-label="Select default church"
                  >
                    <SelectValue placeholder="Select default church" />
                  </SelectTrigger>
                  <SelectContent align="start" className="max-h-80">
                    {roleChurchOptions.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.churchName} ·{' '}
                        {formatChurchLevel(option.churchType)} ·{' '}
                        {getRoleRelationLabel(option.authRole, option.roleName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {persistedOption ? (
                  <p className="text-xs text-muted-foreground">
                    Saved default: {persistedOption.churchName} ·{' '}
                    {formatChurchLevel(persistedOption.churchType)} ·{' '}
                    {getRoleRelationLabel(
                      persistedOption.authRole,
                      persistedOption.roleName
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isPersistedKeyStale
                      ? 'Saved default is no longer available — pick a new one.'
                      : 'No default saved. Highest role is used at sign-in.'}
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
                  Reset to default
                </Button>
                <Button
                  type="button"
                  className="h-11"
                  onClick={handleSave}
                  disabled={!pendingKey || isSaved}
                >
                  {isSaved ? 'Saved' : 'Save as default'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
