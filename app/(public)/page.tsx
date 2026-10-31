import Link from "next/link";
import { listarVitrina, obtenerConfig } from "@/lib/catalogo";
import { cop, textoCierre } from "@/lib/format";

export default async function HomePage() {
  const [equipos, config] = await Promise.all([listarVitrina(), obtenerConfig()]);
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Feria empresarial</p>
        <h1 className="max-w-xl font-display text-4xl leading-tight sm:text-5xl">
          Reserva hoy, recoge en el stand
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Elige productos de varios emprendimientos. Cada uno te entrega una boleta con su propio código.
        </p>
        <p className={`rounded-2xl px-4 py-3 text-sm ${config.abiertas ? "bg-secondary/25" : "bg-destructive/10 text-destructive"}`}>
          {config.abiertas
            ? `Las reservas siguen abiertas hasta el ${textoCierre()}.`
            : `Las reservas cerraron el ${textoCierre()}.`}
        </p>
      </section>
      {equipos.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-sm ring-1 ring-foreground/10">
          Todavía no hay emprendimientos publicados.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map((equipo) => (
            <li key={equipo.id}>
              <Link
                href={`/e/${equipo.codigo}`}
                className="block overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10"
              >
                <div className="h-2" style={{ background: equipo.color }} />
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-3">
                    {equipo.logoUrl ? (
                      <img src={equipo.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
                    ) : null}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{equipo.codigo}</p>
                      <h2 className="font-display text-2xl leading-tight">{equipo.nombre}</h2>
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{equipo.descripcion}</p>
                  <p className="text-sm">
                    Stand {equipo.stand} · {equipo.grado}
                  </p>
                  <p className="text-sm font-medium">
                    {equipo.productos} productos
                    {equipo.desde ? ` · desde ${cop(equipo.desde)}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
