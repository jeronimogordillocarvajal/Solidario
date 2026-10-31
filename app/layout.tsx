import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { headers } from "next/headers";
import { CartProvider } from "@/components/cart-provider";
import { obtenerConfig } from "@/lib/catalogo";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Feria Go",
    template: "%s · Feria Go",
  },
  description: "Reserva productos de la feria empresarial y recógelos en el stand.",
};

export const viewport: Viewport = {
  themeColor: "#0F6E56",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();
  const config = await obtenerConfig();
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
      style={
        {
          "--primary": config.colorPrincipal,
          "--secondary": config.colorSecundario,
          "--ring": config.colorPrincipal,
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
