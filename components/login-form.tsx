"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO } from "@/lib/constants";
import { ingresar } from "@/lib/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(ingresar, null);
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-4xl">Entra a tu negocio</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Usa el correo y la contraseña que creó coordinación. Cada equipo solo ve su emprendimiento.
        </p>
      </div>
      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <details className="rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10">
        <summary className="cursor-pointer font-medium">Cuentas de demostración</summary>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>
            Administración · {DEMO.admin.email} · {DEMO.admin.password}
          </li>
          {DEMO.equipos.map((equipo) => (
            <li key={equipo.codigo}>
              {equipo.codigo} · {equipo.email} · {equipo.password}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
