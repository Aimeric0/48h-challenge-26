import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Retour
        </Link>
        {children}
      </div>
    </div>
  );
}
