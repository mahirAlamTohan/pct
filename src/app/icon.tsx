import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const size = {
  width: 64,
  height: 64,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        background: "linear-gradient(145deg, #2a80ec, #1648a3)",
        color: "white",
        fontSize: 25,
        fontWeight: 800,
        letterSpacing: "-2px",
      }}
    >
      PCT
    </div>,
    size
  )
}
