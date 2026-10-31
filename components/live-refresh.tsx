"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Volume2 } from "lucide-react";

let audio: AudioContext | null = null;

function unlockSound() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!audio) audio = new Ctx();
  void audio.resume();
  sessionStorage.setItem("feria-sound", "1");
  window.dispatchEvent(new Event("feria-sound"));
}

function sonidoActivo() {
  return sessionStorage.getItem("feria-sound") === "1";
}

function suscribirSonido(callback: () => void) {
  window.addEventListener("feria-sound", callback);
  return () => window.removeEventListener("feria-sound", callback);
}

function playChime() {
  if (!audio || sessionStorage.getItem("feria-sound") !== "1") return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.exponentialRampToValueAtTime(1180, now + 0.09);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.45);
  navigator.vibrate?.(180);
}

export function LiveRefresh({ ultimoId }: { ultimoId: string | null }) {
  const router = useRouter();
  const visto = useRef(ultimoId);
  const [aviso, setAviso] = useState("");
  const sonido = useSyncExternalStore(suscribirSonido, sonidoActivo, () => false);

  const avisar = useCallback(
    (texto: string, id: string) => {
      if (!id || visto.current === id) return;
      visto.current = id;
      setAviso(texto);
      playChime();
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    const onPointer = () => unlockSound();
    window.addEventListener("pointerdown", onPointer, { once: true });
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/emprendedor/eventos");
    source.onmessage = (message) => {
      const data = JSON.parse(message.data) as {
        type?: string;
        id?: string;
        estudiante?: string;
        codigo?: string;
      };
      if (data.type === "nuevo_pedido" && data.id) {
        avisar(`Llegó un pedido de ${data.estudiante}: ${data.codigo}`, data.id);
      }
      if (data.type === "pago_reportado" && data.id) {
        avisar(`Hay un pago por QR para confirmar: ${data.codigo}`, data.id);
      }
    };
    return () => source.close();
  }, [avisar]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch("/api/emprendedor/pulso", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { ultimoId: string | null };
      if (data.ultimoId) avisar("Hay un pedido nuevo en tu negocio.", data.ultimoId);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [avisar]);

  return (
    <div className="no-print space-y-2">
      {!sonido ? (
        <button
          type="button"
          onClick={() => unlockSound()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-3 text-sm font-semibold text-secondary-foreground"
        >
          <Volume2 className="size-4" />
          Activa el sonido para oír cuando reserven
        </button>
      ) : (
        <p className="text-xs font-medium text-primary">En vivo · el sonido de pedidos está activo</p>
      )}
      {aviso ? (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl bg-primary px-3 py-3 text-sm text-primary-foreground"
        >
          <p>{aviso}</p>
          <button type="button" onClick={() => setAviso("")} className="underline">
            Cerrar
          </button>
        </div>
      ) : null}
    </div>
  );
}
