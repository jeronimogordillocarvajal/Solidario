export type PedidoEvento = {
  type: "nuevo_pedido" | "pago_reportado";
  emprendimientoId: string;
  codigo: string;
  estudiante: string;
  subtotal: number;
  id: string;
};

type Listener = (event: PedidoEvento) => void;

const globalBus = globalThis as typeof globalThis & {
  __feriaListeners?: Set<Listener>;
};

function listeners() {
  if (!globalBus.__feriaListeners) globalBus.__feriaListeners = new Set();
  return globalBus.__feriaListeners;
}

export function publicarPedido(event: PedidoEvento) {
  for (const listener of listeners()) listener(event);
}

export function suscribirPedidos(listener: Listener) {
  listeners().add(listener);
  return () => listeners().delete(listener);
}
