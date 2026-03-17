import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from 'components/ui/button'

const EditButton = ({ link }: { link: string }) => {
  return (
    <Link to={link}>
      <Button size="sm" variant="success" className="ms-2">
        <Pencil className="mr-1 h-3 w-3" />
        Edit
      </Button>
    </Link>
  )
}

export default EditButton
