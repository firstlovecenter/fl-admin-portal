import logo from 'assets/splash-screen-flc-logo.png'

const SplashSreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-brand">
      <img
        src={logo}
        alt="FLC Logo"
        className="w-24 h-24 object-contain animate-[pulse_2s_ease-in-out_infinite]"
      />
    </div>
  )
}

export default SplashSreen
