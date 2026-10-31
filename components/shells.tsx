"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Settings,
  Store,
  UserRound,
  LifeBuoy,
  Building2,
} from "lucide-react";
import { salir } from "@/lib/actions";
import { cn } from "@/lib/utils";

const EQUIPO = [
  { href: "/emprendedor", label: "Negocio", icon: Store },
  { href: "/emprendedor/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/emprendedor/productos", label: "Productos", icon: Package },
  { href: "/emprendedor/pagos", label: "Pagos", icon: QrCode },
  { href: "/emprendedor/perfil", label: "Perfil", icon: UserRound },
];

function activo(pathname: string, href: string) {
  if (href === "/emprendedor" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmprendedorShell({
  nombre,
  codigo,
  children,
}: {
  nombre: string;
  codigo: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh pb-24">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <div className="min-w-0">
            <p className="font-display text-xl leading-none text-primary">
              Feria <span className="text-secondary">Go</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {nombre} · {codigo}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link href="/guia" className="text-sm font-medium underline">
              Ayuda
            </Link>
            <form action={salir}>
              <button type="submit" className="inline-flex h-11 items-center gap-1 px-2 text-sm">
                <LogOut className="size-4" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-4">{children}</div>
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-5xl grid-cols-5">
          {EQUIPO.map((item) => {
            const Icon = item.icon;
            const on = activo(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                    on ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

const ADMIN = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/soporte", label: "Soporte", icon: LifeBuoy },
  { href: "/admin/emprendimientos", label: "Equipos", icon: Building2 },
  { href: "/admin/configuracion", label: "Ajustes", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-display text-2xl leading-none text-primary">
              Feria <span className="text-secondary">Go</span>
            </p>
            <p className="text-xs text-muted-foreground">Coordinación</p>
          </div>
          <form action={salir}>
            <button type="submit" className="inline-flex h-11 items-center gap-1 text-sm">
              <LogOut className="size-4" />
              Salir
            </button>
          </form>
        </div>
        <nav className="overflow-x-auto">
          <ul className="mx-auto flex max-w-6xl gap-1 px-3 pb-2">
            {ADMIN.map((item) => {
              const Icon = item.icon;
              const on = activo(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap",
                      on ? "bg-primary text-primary-foreground" : "text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-5">{children}</div>
    </div>
  );
}
