import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const alt = "PCT24X7 — quality medicines for better healthcare"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "76px",
        background:
          "linear-gradient(135deg, #edf5ff 0%, #ffffff 55%, #dcecff 100%)",
        color: "#12284b",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "38px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "82px",
            height: "82px",
            borderRadius: "24px",
            background: "linear-gradient(145deg, #2a80ec, #1648a3)",
            color: "white",
            fontSize: "32px",
            fontWeight: 800,
          }}
        >
          PCT
        </div>
        <span style={{ color: "#246dd1", fontSize: "30px", fontWeight: 800 }}>
          PCT24X7
        </span>
      </div>
      <div style={{ fontSize: "68px", fontWeight: 800, letterSpacing: "-3px" }}>
        Quality medicines.
      </div>
      <div
        style={{
          marginTop: "10px",
          color: "#246dd1",
          fontSize: "68px",
          fontWeight: 800,
          letterSpacing: "-3px",
        }}
      >
        Better healthcare.
      </div>
      <div style={{ marginTop: "30px", color: "#55647a", fontSize: "26px" }}>
        Reliable pharmaceutical supply from India since 2012.
      </div>
    </div>,
    size
  )
}
