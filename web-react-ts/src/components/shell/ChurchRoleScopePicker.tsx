import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select'
import { useChurchRoleScope } from 'contexts/ChurchRoleScopeContext'
import { formatChurchLevel, getRoleRelationLabel } from 'lib/scope-display'

export const ChurchRoleScopePicker = () => {
  const { roleChurchOptions, selectedScopeKey, setSelectedScopeKey } =
    useChurchRoleScope()

  if (!roleChurchOptions.length) {
    return null
  }

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/55">
        Church in Focus
      </p>
      <Select value={selectedScopeKey} onValueChange={setSelectedScopeKey}>
        <SelectTrigger
          className="h-11 w-full border-sidebar-border bg-sidebar-accent/50 text-left text-sidebar-foreground data-placeholder:text-sidebar-foreground/60"
          aria-label="Select church in focus"
        >
          <SelectValue placeholder="Select church in focus" />
        </SelectTrigger>
        <SelectContent align="start" className="max-h-80">
          {roleChurchOptions.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.churchName} · {formatChurchLevel(option.churchType)} ·{' '}
              {getRoleRelationLabel(option.authRole, option.roleName)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
