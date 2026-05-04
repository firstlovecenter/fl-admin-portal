import { Button } from 'components/ui/button'
import { Link } from 'react-router-dom'

const ViewAll = ({ to }: { to: string }) => {
  return (
    <Link to={to}>
      <Button variant="outline" className="min-h-[44px]">
        View All
      </Button>
    </Link>
  )
}

export default ViewAll
