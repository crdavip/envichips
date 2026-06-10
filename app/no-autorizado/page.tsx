import Link from "next/link";

export default function NoAutorizadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="size-10 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Acceso denegado
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          No tienes permisos suficientes para acceder a esta página.
          Si crees que esto es un error, contacta al administrador.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
