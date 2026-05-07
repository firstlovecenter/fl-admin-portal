import { ShieldCheck } from 'lucide-react'

const ShepherdingControl = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-sidebar-accent">
        <ShieldCheck className="size-8 text-sidebar-foreground/60" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Shepherding Control
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Coming soon. Admin tools for shepherding oversight.
      </p>
    </div>
  )
}

export default ShepherdingControl
