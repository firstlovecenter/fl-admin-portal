import { PropagateLoader } from 'react-spinners'

const InitialLoading = ({ text }: { text?: string }) => {
  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme')

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <PropagateLoader
        speedMultiplier={0.8}
        color={currentTheme === 'dark' ? 'grey' : '#000000'}
      />

      <div className="text-center mt-5">
        <p>{text || 'Please wait while we log you in'}</p>
      </div>
    </div>
  )
}

export default InitialLoading
