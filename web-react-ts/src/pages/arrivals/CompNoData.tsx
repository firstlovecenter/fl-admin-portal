import { Card, CardContent } from 'components/ui/card'

const NoDataComponent = ({ text }: { text: string }) => {
  return (
    <Card className="mt-2">
      <CardContent className="py-3">{text}</CardContent>
    </Card>
  )
}

export default NoDataComponent
