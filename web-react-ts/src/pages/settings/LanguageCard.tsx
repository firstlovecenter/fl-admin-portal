import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import useLanguage from 'hooks/useLanguage'

const LanguageCard = () => {
  const { t } = useTranslation()
  const { language, languages, setLanguage } = useLanguage()

  // Applied immediately rather than behind a Save button (unlike the
  // "Default church" card above): i18next's detector already persists the
  // choice to localStorage, and the UI re-rendering in the new language is
  // itself the confirmation. A Save step would be ceremony over a no-op.
  const handleChange = (code: string) => {
    if (code === language) return

    setLanguage(code)

    const chosen = languages.find((item) => item.code === code)
    toast.success(
      t('settings.language.changedToast', {
        language: chosen?.nativeName ?? code,
      })
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="size-4 text-muted-foreground" />
          {t('settings.language.title')}
        </CardTitle>
        <CardDescription>{t('settings.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label htmlFor="language-select" className="text-sm font-medium">
            {t('settings.language.label')}
          </label>
          <Select value={language} onValueChange={handleChange}>
            <SelectTrigger
              id="language-select"
              className="h-11 w-full"
              aria-label={t('settings.language.ariaLabel')}
            >
              <SelectValue
                placeholder={t('settings.language.placeholder')}
              />
            </SelectTrigger>
            <SelectContent align="start">
              {languages.map((item) => (
                // Each language is listed in its own language (nativeName),
                // never translated — someone who has landed in a language
                // they can't read still needs to find their way out.
                <SelectItem key={item.code} value={item.code}>
                  {item.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export default LanguageCard
