import { cn } from 'components/lib/utils'

type SynagoLogoProps = {
  className?: string
  title?: string
  animated?: boolean
}

const PETAL_PATH =
  'M12 2C13.2 2 15.1 3 15.7 5C16.3 7 15.3 9 13.2 10C12.6 10.3 11.4 10.3 10.8 10C8.7 9 7.7 7 8.3 5C8.9 3 10.8 2 12 2Z'

const ANIMATION_CSS = `
.synago-petals {
  transform-origin: center;
  transform-box: fill-box;
  animation: synago-rotate 5s linear infinite;
}
.synago-center {
  transform-origin: center;
  transform-box: fill-box;
  animation: synago-pulse 2s ease-in-out infinite;
}
@keyframes synago-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes synago-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.55; }
}
@media (prefers-reduced-motion: reduce) {
  .synago-petals,
  .synago-center { animation: none; }
}
`

const SynagoLogo = ({ className, title, animated = false }: SynagoLogoProps) => {
  const decorative = !title
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-5 w-5', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative && <title>{title}</title>}
      {animated && <style>{ANIMATION_CSS}</style>}
      <g fill="currentColor">
        <g className={animated ? 'synago-petals' : undefined}>
          <path d={PETAL_PATH} />
          <path d={PETAL_PATH} transform="rotate(120 12 12)" />
          <path d={PETAL_PATH} transform="rotate(240 12 12)" />
        </g>
        <circle
          cx="12"
          cy="12"
          r="2.2"
          className={animated ? 'synago-center' : undefined}
        />
      </g>
    </svg>
  )
}

export default SynagoLogo
