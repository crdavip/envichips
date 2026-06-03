import { IsoType } from "@/components/logo/isotype";
import { LogoType } from "@/components/logo/logotype";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-linear-to-br from-brand-light via-background to-brand-primary/10 p-4">
      {/* Decorative background blob */}
      <div className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full bg-brand-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-brand-primary/10 blur-3xl" />

      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-1.5">
        <IsoType className="size-24 sm:size-30" />
        <LogoType className="h-12 w-auto sm:h-15" />
      </div>

      {children}

      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Envichips — SaaS | by crdavip
      </p>
    </div>
  );
}
