"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BANCOS, CATEGORIA_LABEL, CATEGORIAS } from "@/lib/constants";
import {
  actualizarMeta,
  guardarPagosAccion,
  guardarPerfilAccion,
  guardarProductoAccion,
} from "@/lib/actions";
import type { ProductoVista } from "@/lib/types";
import { FotoCampo } from "./foto-campo";
import { ProductCard } from "./product-card";

export function MetaForm({ meta }: { meta: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      action={async (formData) => {
        const resultado = await actualizarMeta(formData);
        if (resultado?.error) setError(resultado.error);
        else {
          setError("");
          router.refresh();
        }
      }}
    >
      <Label htmlFor="meta" className="sr-only">
        Meta de ventas en pesos
      </Label>
      <Input id="meta" name="meta" defaultValue={meta || ""} inputMode="numeric" placeholder="250000" />
      <Button type="submit">Guardar meta</Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

export function ProductoEditor({
  producto,
  onClose,
}: {
  producto?: ProductoVista;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const [categoria, setCategoria] = useState(producto?.categoria ?? "comestibles");
  const [stock, setStock] = useState(producto ? String(producto.stock) : "10");
  const vista: ProductoVista = {
    id: producto?.id ?? "preview",
    codigo: producto?.codigo ?? "Nuevo",
    secuencia: producto?.secuencia ?? 0,
    nombre: nombre || "Nombre del producto",
    descripcion,
    precio: Number(precio.replace(/\./g, "")) || 0,
    categoria: categoria as ProductoVista["categoria"],
    stock: Number(stock) || 0,
    visible: true,
    fotoUrl: producto?.fotoUrl ?? null,
    emprendimientoId: producto?.emprendimientoId ?? "",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
      <form
        className="space-y-3"
        action={async (formData) => {
          const resultado = await guardarProductoAccion(formData);
          if (resultado?.error) setError(resultado.error);
          else {
            router.refresh();
            onClose?.();
          }
        }}
      >
        {producto ? <input type="hidden" name="id" value={producto.id} /> : null}
        <input type="hidden" name="visible" value={producto ? (producto.visible ? "1" : "0") : "1"} />
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="precio">Precio en pesos</Label>
            <Input id="precio" name="precio" value={precio} onChange={(event) => setPrecio(event.target.value)} inputMode="numeric" placeholder="4500" required />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" value={stock} onChange={(event) => setStock(event.target.value)} inputMode="numeric" required />
          </div>
        </div>
        <div>
          <Label htmlFor="categoria">Categoría</Label>
          <select
            id="categoria"
            name="categoria"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value as ProductoVista["categoria"])}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base"
          >
            {CATEGORIAS.map((item) => (
              <option key={item} value={item}>
                {CATEGORIA_LABEL[item]}
              </option>
            ))}
          </select>
        </div>
        {producto ? (
          <p className="text-sm text-muted-foreground">
            Código <strong>{producto.codigo}</strong>. Se asigna solo y no se puede cambiar.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">El código (E03-01, E03-02…) se asigna al guardar.</p>
        )}
        <FotoCampo name="foto" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit">{producto ? "Guardar cambios" : "Agregar producto"}</Button>
      </form>
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Así se ve en la tienda
        </p>
        <ProductCard producto={vista} />
      </div>
    </div>
  );
}

export function OcultarProducto({ producto }: { producto: ProductoVista }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <form
      action={async (formData) => {
        const resultado = await guardarProductoAccion(formData);
        if (resultado?.error) setError(resultado.error);
        else router.refresh();
      }}
    >
      <input type="hidden" name="id" value={producto.id} />
      <input type="hidden" name="nombre" value={producto.nombre} />
      <input type="hidden" name="descripcion" value={producto.descripcion} />
      <input type="hidden" name="precio" value={producto.precio} />
      <input type="hidden" name="categoria" value={producto.categoria} />
      <input type="hidden" name="stock" value={producto.stock} />
      <input type="hidden" name="visible" value={producto.visible ? "0" : "1"} />
      <Button type="submit" variant="outline" className="w-full">
        {producto.visible ? "Ocultar de la tienda" : "Volver a mostrar"}
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </form>
  );
}

export function PagosForm({
  aceptaEfectivo,
  aceptaQr,
  numeroCuenta,
  titular,
  banco,
  qrUrl,
  faltaQr,
}: {
  aceptaEfectivo: boolean;
  aceptaQr: boolean;
  numeroCuenta: string;
  titular: string;
  banco: string;
  qrUrl: string | null;
  faltaQr: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const resultado = await guardarPagosAccion(formData);
        if (resultado?.error) {
          setOk(false);
          setError(resultado.error);
        } else {
          setError("");
          setOk(true);
          router.refresh();
        }
      }}
    >
      {faltaQr ? (
        <p className="rounded-xl bg-secondary/30 px-3 py-3 text-sm">
          Aceptas QR y todavía no hay imagen. Los acudientes no verán el código en su factura hasta que lo subas.
        </p>
      ) : null}
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="efectivo" value="1" defaultChecked={aceptaEfectivo} />
        Aceptamos efectivo en el stand
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" name="qr_metodo" value="1" defaultChecked={aceptaQr} />
        Aceptamos QR (el dinero llega a la cuenta del equipo)
      </label>
      <div>
        <Label htmlFor="banco">Banco o billetera</Label>
        <select id="banco" name="banco" defaultValue={banco} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base">
          <option value="">Elegir</option>
          {BANCOS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="cuenta">Número de cuenta o celular</Label>
        <Input id="cuenta" name="cuenta" defaultValue={numeroCuenta} inputMode="numeric" />
      </div>
      <div>
        <Label htmlFor="titular">Titular</Label>
        <Input id="titular" name="titular" defaultValue={titular} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Imagen del QR</p>
        {qrUrl ? <img src={qrUrl} alt="QR actual del emprendimiento" className="mb-3 h-40 w-40 rounded-xl bg-white object-contain" /> : null}
        <FotoCampo name="qr" texto="Sube la imagen del QR de Nequi, Daviplata o Bancolombia. Se reduce a 800 px." />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-primary">Pagos actualizados.</p> : null}
      <Button type="submit">Guardar métodos de pago</Button>
    </form>
  );
}

export function PerfilForm({
  descripcion,
  color,
  integrantes,
  logoUrl,
  codigo,
}: {
  descripcion: string;
  color: string;
  integrantes: string[];
  logoUrl: string | null;
  codigo: string;
}) {
  const router = useRouter();
  const [nombres, setNombres] = useState(integrantes.length ? integrantes : [""]);
  const [colorActual, setColorActual] = useState(color);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const resultado = await guardarPerfilAccion(formData);
        if (resultado?.error) {
          setOk(false);
          setError(resultado.error);
        } else {
          setError("");
          setOk(true);
          router.refresh();
        }
      }}
    >
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" defaultValue={descripcion} />
      </div>
      <div>
        <Label htmlFor="color">Color del emprendimiento</Label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            name="color"
            type="color"
            value={colorActual}
            onChange={(event) => setColorActual(event.target.value)}
            className="h-11 w-16 cursor-pointer rounded-lg border border-input bg-card"
          />
          <span className="text-sm">{colorActual}</span>
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Integrantes</legend>
        {nombres.map((nombre, index) => (
          <div key={index} className="flex gap-2">
            <Input
              name="integrante"
              value={nombre}
              aria-label={`Integrante ${index + 1}`}
              onChange={(event) =>
                setNombres((actual) => actual.map((item, i) => (i === index ? event.target.value : item)))
              }
            />
            {nombres.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setNombres((actual) => actual.filter((_, i) => i !== index))}
              >
                Quitar
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setNombres((actual) => [...actual, ""])}>
          Agregar integrante
        </Button>
      </fieldset>
      <div>
        <p className="mb-2 text-sm font-medium">Logo</p>
        {logoUrl ? <img src={logoUrl} alt="" className="mb-3 h-20 w-20 rounded-2xl object-cover" /> : null}
        <FotoCampo name="logo" texto="Puedes tomar el logo con la cámara. Se reduce a 800 px." />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-primary">Perfil guardado.</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit">Guardar perfil</Button>
        <a
          href={`/e/${codigo}`}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          Ver en la tienda
        </a>
      </div>
    </form>
  );
}
