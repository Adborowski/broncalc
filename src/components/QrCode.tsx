import qrcode from "qrcode-generator";
import { useMemo } from "react";

/**
 * A QR code as plain SVG, drawn from the library's module grid (no injected
 * HTML). Medium error correction survives a scuffed, laminated label.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: n, path: d };
  }, [value]);

  // A 2-module quiet zone around the code keeps it scannable when cut close.
  return (
    <svg
      className="qr"
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
