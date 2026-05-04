import { Button } from 'components/ui/button'
import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'

const EditButton = ({ link }: { link: string }) => {
  return (
    <Link to={link}>
      <Button variant="outline" className="gap-1.5 min-h-[44px]">
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
    </Link>
  )
}

export default EditButton
