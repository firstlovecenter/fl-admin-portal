import { Button } from 'components/ui/button'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const EditButton = ({ link }: { link: string }) => {
  const { t } = useTranslation()

  return (
    <Link to={link} aria-label={t('shared.actions.edit')}>
      <Button
        variant="outline"
        className="gap-1.5 min-h-[44px] min-w-[44px] px-2.5 sm:px-4"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('shared.actions.edit')}</span>
      </Button>
    </Link>
  )
}

export default EditButton
