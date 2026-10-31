import Link from "next/link";
import { conteosAdmin } from "@/lib/admin";
import { obtenerConfig } from "@/lib/catalogo";
import { textoCierre } from "@/lib/format";

export default async function AdminHome() {
  const [conteos, config] = await Promise.all([conteosAdmin(), obtenerConfig()]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl">{config.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          {config.abiertas
            ? `Las reservas siguen abiertas hasta el ${textoCierre()}.`
            : `Las reservas ya cerraron (${textoCierre()}).`}
        </p>
      </div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato label="Emprendimientos" valor={String(conteos.equipos)} />
        <Dato label="Pedidos" valor={String(conteos.pedidos)} />
        <Dato label="QR por confirmar" valor={String(conteos.qr)} />
        <Dato label="Soporte abierto" valor={String(conteos.soporte)} />
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/pedidos" className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Ver todos los pedidos
        </Link>
        <a href="/api/admin/pedidos/excel" className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium">
          Exportar Excel
        </a>
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-3xl">{valor}</p>
    </article>
  );
}
