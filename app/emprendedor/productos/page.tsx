import { OcultarProducto, ProductoEditor } from "@/components/formularios-equipo";
import { ProductCard } from "@/components/product-card";
import { requireEmprendedor } from "@/lib/auth";
import { listarProductosEquipo } from "@/lib/catalogo";
import { ProductosCliente } from "@/components/productos-cliente";

export default async function ProductosPage() {
  const session = await requireEmprendedor();
  const data = await listarProductosEquipo(session.emprendimientoId);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl">Mis productos</h1>
        <p className="text-sm text-muted-foreground">
          El código empieza por {data.codigo} y se asigna solo. Ocultar no borra los pedidos ya hechos.
        </p>
      </div>
      <ProductosCliente />
      {data.productos.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-sm ring-1 ring-foreground/10">
          Todavía no hay productos. Agrega el primero para que aparezca en la tienda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.productos.map((producto) => (
            <li key={producto.id} className={`space-y-3 ${producto.visible ? "" : "opacity-70"}`}>
              <ProductCard producto={producto} />
              <p className="text-xs text-muted-foreground">
                Código {producto.codigo}
                {producto.visible ? "" : " · oculto en la tienda"}
              </p>
              <details className="rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
                <summary className="cursor-pointer text-sm font-medium">Editar</summary>
                <div className="mt-3">
                  <ProductoEditor producto={producto} />
                </div>
              </details>
              <OcultarProducto producto={producto} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
