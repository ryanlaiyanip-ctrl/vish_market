"use client";

export default function VishToken({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size, display: "inline-flex", borderRadius: "50%", overflow: "hidden", border: "1.5px solid #c9a227", verticalAlign: "middle", flexShrink: 0 }}
    >
      <img
        src="/vish.png"
        alt="VT"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        onError={(e) => {
          const t = e.currentTarget;
          t.style.display = "none";
          if (t.parentElement) {
            t.parentElement.style.background = "#7c3aed";
            t.parentElement.style.alignItems = "center";
            t.parentElement.style.justifyContent = "center";
            t.parentElement.style.fontSize = `${size * 0.55}px`;
            t.parentElement.style.fontWeight = "900";
            t.parentElement.style.color = "#c9a227";
            t.parentElement.innerText = "V";
          }
        }}
      />
    </span>
  );
}
