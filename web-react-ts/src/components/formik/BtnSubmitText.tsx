import React from 'react'
import { Loader2 } from 'lucide-react'

const BtnSubmitText = ({ loading }: { loading: boolean }) => {
  return (
    <div>
      {loading ? (
        <span className="flex items-center gap-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Submitting</span>
        </span>
      ) : (
        `Yes, I'm sure`
      )}
    </div>
  )
}

export default BtnSubmitText
