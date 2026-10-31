import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-4xl">No encontramos esa página</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Revisa el código de la boleta o vuelve a la tienda.
      </p>
      <Link href="/" className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
        Ir a la tienda
      </Link>
    </div>
  );
}
