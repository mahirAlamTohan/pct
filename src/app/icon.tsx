// app/icon.tsx
import { ImageResponse } from "next/og"

// Route segment config (tells Next.js to use standard icon size)
export const size = {
  width: 32,
  height: 32,
}
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    // This Tailwind CSS setup mimics your custom background gradient
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(at 25% 25%, #0e7490 50%, #22c55e 100%)",
        borderRadius: "6px",
      }}
    >
      {/* Simplified SVG Path of the Lucide Pill component */}
      <svg
        xmlns="http://w3.org"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f9fafb"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    </div>,
    {
      ...size,
    }
  )
}
