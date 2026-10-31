function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function logoSvg(iniciales: string, color: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="${escapeXml(color)}"/>
  <text x="64" y="78" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#fffdf8" font-weight="700">${escapeXml(iniciales)}</text>
</svg>`;
}

export function productoSvg(titulo: string, color: string, detalle: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="${escapeXml(color)}"/>
  <circle cx="320" cy="250" r="92" fill="#fffdf8" fill-opacity="0.18"/>
  <text x="320" y="268" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#fffdf8">${escapeXml(detalle)}</text>
  <text x="320" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="#fffdf8">${escapeXml(titulo)}</text>
</svg>`;
}

export function comprobanteSvg(numero: string, valor: string, negocio: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640">
  <rect width="480" height="640" fill="#f6f3ec"/>
  <rect x="36" y="36" width="408" height="568" rx="18" fill="#fffdf8" stroke="#e4dcd0"/>
  <text x="240" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#0f6e56">Comprobante</text>
  <text x="240" y="156" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#5e574e">${escapeXml(negocio)}</text>
  <text x="240" y="280" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#5e574e">Número</text>
  <text x="240" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#1c1915">${escapeXml(numero)}</text>
  <text x="240" y="420" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#5e574e">Valor</text>
  <text x="240" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#1c1915">${escapeXml(valor)}</text>
</svg>`;
}
