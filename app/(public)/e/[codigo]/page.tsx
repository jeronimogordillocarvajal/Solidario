import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { obtenerConfig, obtenerVitrina } from "@/lib/catalogo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const negocio = await obtenerVitrina(codigo);
  return { title: negocio?.nombre ?? "Emprendimiento" };
}

export default async function EmprendimientoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [negocio, config] = await Promise.all([obtenerVitrina(codigo), obtenerConfig()]);
  if (!negocio) notFound();
  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm underline">
        Todos los emprendimientos
      </Link>
      <header className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10">
        <div className="h-3" style={{ background: negocio.color }} />
        <div className="flex gap-4 p-4">
          {negocio.logoUrl ? (
            <img src={negocio.logoUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : null}
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {negocio.codigo} · stand {negocio.stand} · {negocio.grado}
            </p>
            <h1 className="font-display text-4xl">{negocio.nombre}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{negocio.descripcion}</p>
            {negocio.integrantes.length > 0 ? (
              <p className="mt-2 text-sm">Equipo: {negocio.integrantes.join(", ")}</p>
            ) : null}
          </div>
        </div>
      </header>
      {negocio.productos.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-sm ring-1 ring-foreground/10">
          Este emprendimiento todavía no tiene productos visibles.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {negocio.productos.map((producto) => (
            <li key={producto.id}>
              <ProductCard producto={producto}>
                <AddToCart
                  producto={producto}
                  negocio={{ id: negocio.id, nombre: negocio.nombre, codigo: negocio.codigo }}
                  abierto={config.abiertas}
                />
              </ProductCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
