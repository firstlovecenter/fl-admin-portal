import { Button } from 'components/ui/button'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type ViewAllProps = {
  to: string
  label?: string
}

const ViewAll = ({ to, label = 'View All' }: ViewAllProps) => {
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-[44px] gap-1 px-3 text-sm font-medium text-members hover:bg-members/10 hover:text-members"
      >
        {label}
        <ChevronRight className="size-4" />
      </Button>
    </Link>
  )
}

export default ViewAll
