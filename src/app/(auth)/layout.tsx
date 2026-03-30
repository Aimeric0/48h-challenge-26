export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Challenge 48h</h1>
        </div>
        {children}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:underline underline-offset-4">
            Confidentialite
          </a>
          <span>&middot;</span>
          <a href="/mentions-legales" className="hover:underline underline-offset-4">
            Mentions legales
          </a>
        </div>
      </div>
    </div>
  );
}
