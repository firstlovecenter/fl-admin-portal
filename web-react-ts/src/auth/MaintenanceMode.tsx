const MaintenanceMode = () => {
  return (
    <div className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Site is under maintenance
        </h2>
        <p className="text-sm text-muted-foreground">
          We are currently working on the site and will be back shortly. Thank
          you for your patience.
        </p>
      </div>
    </div>
  )
}

export default MaintenanceMode
