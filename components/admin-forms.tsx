"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  crearEmprendimientoAccion,
  enviarSoporte,
  guardarConfigAccion,
  resolverSoporteAccion,
} from "@/lib/actions";

export function SoporteForm() {
  const [state, action, pending] = useActionState(enviarSoporte, null);
  if (state?.ok) {
    return (
      <p className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground" role="status">
        Recibimos tu solicitud. Coordinación la verá en el panel de administración.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" required />
      </div>
      <div>
        <Label htmlFor="correo">Correo</Label>
        <Input id="correo" name="correo" type="email" required />
      </div>
      <div>
        <Label htmlFor="mensaje">Qué pasó</Label>
        <Textarea id="mensaje" name="mensaje" required placeholder="No pude reservar el brownie del stand 12." />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}

export function ResolverForm({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <form
      className="mt-3 space-y-2"
      action={async (formData) => {
        const resultado = await resolverSoporteAccion(formData);
        if (resultado?.error) setError(resultado.error);
        else router.refresh();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Label htmlFor={`respuesta-${id}`}>Cómo quedó</Label>
      <Textarea id={`respuesta-${id}`} name="respuesta" required />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit">Marcar resuelta</Button>
    </form>
  );
}

export function NuevoEquipoForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      action={async (formData) => {
        const resultado = await crearEmprendimientoAccion(formData);
        if (resultado?.error) {
          setOk("");
          setError(resultado.error);
        } else {
          setError("");
          setOk("Equipo creado. Ya pueden entrar con ese correo.");
          router.refresh();
        }
      }}
    >
      <div>
        <Label htmlFor="nombre">Nombre del emprendimiento</Label>
        <Input id="nombre" name="nombre" required />
      </div>
      <div>
        <Label htmlFor="responsable">Nombre de quien entra</Label>
        <Input id="responsable" name="responsable" required />
      </div>
      <div>
        <Label htmlFor="grado">Grado</Label>
        <Input id="grado" name="grado" placeholder="10°A" required />
      </div>
      <div>
        <Label htmlFor="stand">Stand</Label>
        <Input id="stand" name="stand" required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" />
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <Input id="color" name="color" type="color" defaultValue="#0F6E56" className="h-11 w-24 p-1" />
      </div>
      <div>
        <Label htmlFor="email">Correo del equipo</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="password">Contraseña inicial</Label>
        <Input id="password" name="password" type="text" minLength={8} required />
      </div>
      {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
      {ok ? <p className="text-sm text-primary sm:col-span-2">{ok}</p> : null}
      <Button type="submit" className="sm:col-span-2">
        Crear emprendimiento y usuario
      </Button>
    </form>
  );
}

export function ConfigForm({
  nombre,
  colorPrincipal,
  colorSecundario,
  cierreLocal,
}: {
  nombre: string;
  colorPrincipal: string;
  colorSecundario: string;
  cierreLocal: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        const resultado = await guardarConfigAccion(formData);
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
        <Label htmlFor="nombre">Nombre de la feria</Label>
        <Input id="nombre" name="nombre" defaultValue={nombre} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="colorPrincipal">Color principal</Label>
          <Input id="colorPrincipal" name="colorPrincipal" type="color" defaultValue={colorPrincipal} className="h-11 w-24 p-1" />
        </div>
        <div>
          <Label htmlFor="colorSecundario">Color secundario</Label>
          <Input id="colorSecundario" name="colorSecundario" type="color" defaultValue={colorSecundario} className="h-11 w-24 p-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="cierre">Cierre de reservas (hora de Bogotá)</Label>
        <Input id="cierre" name="cierre" type="datetime-local" defaultValue={cierreLocal} required />
        <p className="mt-1 text-xs text-muted-foreground">
          Por defecto las reservas se cierran el 19 de noviembre de 2026 a medianoche.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {ok ? <p className="text-sm text-primary">Ajustes guardados.</p> : null}
      <Button type="submit">Guardar</Button>
    </form>
  );
}
