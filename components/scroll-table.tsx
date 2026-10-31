export function ScrollTable({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground md:hidden">
        <span aria-hidden="true">↔</span>
        Desliza horizontalmente para ver toda la tabla
      </p>
      <div className="relative">
        <div
          className="overflow-x-auto overscroll-x-contain rounded-2xl bg-card ring-1 ring-foreground/10"
          tabIndex={0}
          role="region"
          aria-label={label}
        >
          {children}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-2xl bg-gradient-to-l from-card to-transparent md:hidden" />
      </div>
    </div>
  );
}
