import { Button } from 'components/ui/button'
import { Link } from 'react-router-dom'

const ViewAll = ({ to }: { to: string }) => {
  return (
    <Link to={to}>
      <Button variant="outline" size="sm">
        View All
      </Button>
    </Link>
  )
}

export default ViewAll
