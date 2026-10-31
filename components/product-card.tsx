import { CATEGORIA_LABEL } from "@/lib/constants";
import { cop } from "@/lib/format";
import type { ProductoVista } from "@/lib/types";

export function ProductCard({
  producto,
  children,
}: {
  producto: ProductoVista;
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div className="aspect-square bg-muted">
        {producto.fotoUrl ? (
          <img src={producto.fotoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Sin foto</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {CATEGORIA_LABEL[producto.categoria]}
        </p>
        <h3 className="font-display text-xl leading-tight">{producto.nombre}</h3>
        {producto.descripcion ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{producto.descripcion}</p>
        ) : null}
        <p className="mt-auto pt-2 text-base font-semibold text-primary">{cop(producto.precio)}</p>
        <p className="text-xs text-muted-foreground">
          {producto.stock === 0 ? "Agotado" : `${producto.stock} disponibles`}
        </p>
        {children}
      </div>
    </article>
  );
}
