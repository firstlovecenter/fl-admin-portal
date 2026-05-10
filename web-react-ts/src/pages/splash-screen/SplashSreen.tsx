import SynagoLogo from 'components/SynagoLogo'

const SplashSreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-brand">
      <SynagoLogo
        className="w-24 h-24 text-brand-foreground animate-[pulse_2s_ease-in-out_infinite]"
        title="Synago"
      />
    </div>
  )
}

export default SplashSreen
