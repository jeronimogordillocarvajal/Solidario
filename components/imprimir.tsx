"use client";

export function ImprimirButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
    >
      Imprimir lista
    </button>
  );
}
