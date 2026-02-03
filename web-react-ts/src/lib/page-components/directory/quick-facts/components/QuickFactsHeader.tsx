import React from 'react'
import QuickFactsSelect from './QuickFactsSelect'
import '../QuickFacts.css'

const QuickFactsHeader = () => {
  return (
    <div className="d-flex justify-content-between page-padding">
      <div />
      <div>
        <div className="quick-fact-text">Quick Facts</div>
        <div className="mx-auto mt-2 fit-content">
          <QuickFactsSelect />
        </div>
      </div>
      <div />
    </div>
  )
}

export default QuickFactsHeader
