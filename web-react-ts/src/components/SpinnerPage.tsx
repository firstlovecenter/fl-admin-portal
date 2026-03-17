import './SpinnerPage.css'
import { PacmanLoader } from 'react-spinners'
import PageContainer from './base-component/PageContainer'

const SpinnerPage = () => {
  return (
    <PageContainer>
      <div className="center-page flex flex-col justify-center items-center">
        <PacmanLoader color="gray" />
      </div>
    </PageContainer>
  )
}

export default SpinnerPage
