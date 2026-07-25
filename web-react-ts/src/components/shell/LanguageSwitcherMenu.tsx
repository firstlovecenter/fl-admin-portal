import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'components/ui/dropdown-menu'
import useLanguage from 'hooks/useLanguage'

export const LanguageSwitcherMenu = () => {
  const { t } = useTranslation()
  const { language, languages, setLanguage } = useLanguage()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="size-4" />
        {t('language.menuLabel')}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
          {languages.map((lang) => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code}>
              {lang.nativeName}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

export default LanguageSwitcherMenu
