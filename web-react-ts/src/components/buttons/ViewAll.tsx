import { Link } from 'react-router-dom'
import './ViewAll.css'
import { Button } from 'components/ui/button'

const ViewAll = ({ to }: { to: string }) => {
  return (
    <Link className="view-all" to={to}>
      <Button variant="outline-success">VIEW ALL</Button>
    </Link>
  )
}

export default ViewAll
