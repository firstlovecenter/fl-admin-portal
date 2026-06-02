import React from 'react'
import { Loader2 } from 'lucide-react'

const BtnSubmitText = ({ loading }: { loading: boolean }) => {
  return (
    <div className="inline-flex items-center justify-center gap-2">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Submitting</span>
        </>
      ) : (
        `Yes, I'm sure`
      )}
    </div>
  )
}

export default BtnSubmitText
