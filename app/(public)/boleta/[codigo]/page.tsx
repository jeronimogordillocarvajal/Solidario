import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoletaCard } from "@/components/boleta-panel";
import { LimpiarCarrito } from "@/components/carrito-lista";
import { fechaHora } from "@/lib/format";
import { obtenerBoleta } from "@/lib/pedidos";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `Reserva ${codigo}` };
}

export default async function BoletaPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { codigo } = await params;
  const { nueva } = await searchParams;
  const boleta = await obtenerBoleta(codigo);
  if (!boleta) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <LimpiarCarrito activa={nueva === "1"} />
      <div>
        <p className="text-sm font-semibold text-primary">Reserva {boleta.codigo}</p>
        <h1 className="font-display text-4xl">
          {boleta.subpedidos.length === 1
            ? "Tu boleta está lista"
            : `${boleta.subpedidos.length} boletas, una por emprendimiento`}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {boleta.acudiente} reserva para {boleta.estudiante} ({boleta.curso}) · {fechaHora(boleta.createdAt)}
        </p>
      </div>
      <div className="space-y-4">
        {boleta.subpedidos.map((sub) => (
          <BoletaCard key={sub.id} pedidoCodigo={boleta.codigo} sub={sub} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Guarda esta página. El código de cada boleta es el que das en el stand.{" "}
        <Link href="/" className="underline">
          Volver a la tienda
        </Link>
      </p>
    </div>
  );
}
