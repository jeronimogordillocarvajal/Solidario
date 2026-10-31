import Link from "next/link";
import { MetaForm } from "@/components/formularios-equipo";
import { requireEmprendedor } from "@/lib/auth";
import { resumen } from "@/lib/catalogo";
import { cop, diaCorto } from "@/lib/format";

export default async function NegocioPage() {
  const session = await requireEmprendedor();
  const data = await resumen(session.emprendimientoId);
  const meta = data.negocio.meta;
  const avance = meta > 0 ? Math.min(100, Math.round((data.totalVendido / meta) * 100)) : 0;
  const maximo = Math.max(1, ...data.porDia.map((dia) => dia.pedidos));

  return (
    <div className="space-y-4">
      <header className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10">
        <div className="h-3" style={{ background: data.negocio.color }} />
        <div className="flex items-center gap-4 p-4">
          {data.negocio.logoUrl ? (
            <img src={data.negocio.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : null}
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {data.negocio.codigo} · stand {data.negocio.stand} · {data.negocio.grado}
            </p>
            <h1 className="font-display text-3xl">{data.negocio.nombre}</h1>
          </div>
        </div>
      </header>

      {data.porConfirmarQr > 0 ? (
        <Link
          href="/emprendedor/pedidos?tab=pago_reportado"
          className="block rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"
        >
          Tienes {data.porConfirmarQr} {data.porConfirmarQr === 1 ? "pago" : "pagos"} por QR para confirmar
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tarjeta label="Pedidos recibidos" valor={String(data.pedidosRecibidos)} />
        <Tarjeta label="Unidades vendidas" valor={String(data.unidadesVendidas)} />
        <Tarjeta label="Total vendido" valor={cop(data.totalVendido)} />
        <Tarjeta label="Cobrado" valor={cop(data.cobrado)} />
        <Tarjeta label="Por cobrar en efectivo" valor={cop(data.porCobrarEfectivo)} />
        <Tarjeta label="Por confirmar por QR" valor={String(data.porConfirmarQr)} />
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Meta del equipo</h2>
          <p className="text-sm font-semibold">{meta > 0 ? `${avance}%` : "Sin meta"}</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${avance}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {meta > 0
            ? `Van ${cop(data.totalVendido)} de ${cop(meta)}. ${avance >= 100 ? "¡Meta cumplida!" : "Sigue el stand."}`
            : "Definan una meta en pesos para ver la barra avanzar."}
        </p>
        <MetaForm meta={meta} />
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-display text-2xl">Producto más vendido</h2>
          {data.masVendido ? (
            <p className="mt-2">
              <span className="font-semibold">{data.masVendido.nombre}</span>
              <span className="block text-sm text-muted-foreground">{data.masVendido.unidades} unidades</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no hay ventas. La primera reserva aparece aquí.</p>
          )}
        </section>
        <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-display text-2xl">Poco stock</h2>
          {data.pocoStock.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Ningún producto visible está en 5 unidades o menos.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {data.pocoStock.map((producto) => (
                <li key={producto.codigo} className="flex justify-between gap-3">
                  <span>
                    {producto.nombre} <span className="text-muted-foreground">{producto.codigo}</span>
                  </span>
                  <span className="font-semibold">{producto.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="font-display text-2xl">Pedidos por día</h2>
        <div className="mt-4 flex h-36 items-end gap-2">
          {data.porDia.map((dia) => (
            <div key={dia.dia} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t-md ${dia.hoy ? "bg-secondary" : "bg-primary"}`}
                  style={{ height: `${Math.max(4, (dia.pedidos / maximo) * 100)}%` }}
                  title={`${dia.pedidos} pedidos`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{diaCorto(dia.dia)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tarjeta({ label, valor }: { label: string; valor: string }) {
  return (
    <article className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl leading-none">{valor}</p>
    </article>
  );
}
