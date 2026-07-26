import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from 'components/ui/tabs'
import { WINDOW_SIZES } from 'pages/shepherding-control/shepherding-control-utils'
import { WindowWeeks } from 'pages/shepherding-control/shepherding-control-types'

type Props = {
  value: WindowWeeks
  onChange: (next: WindowWeeks) => void
}

const WindowSizeToggle = ({ value, onChange }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1">
      <span className="text-base uppercase tracking-wider text-muted-foreground">
        {t('shepherding.window')}
      </span>
      <Tabs
        value={String(value)}
        onValueChange={(next) => onChange(Number(next) as WindowWeeks)}
      >
        <TabsList className="h-12">
          {WINDOW_SIZES.map((w) => (
            <TabsTrigger
              key={w}
              value={String(w)}
              className="min-h-11 min-w-11 px-4 text-base"
            >
              {t('shepherding.weeksShort', { count: w })}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

export default WindowSizeToggle
