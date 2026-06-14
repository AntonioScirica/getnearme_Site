"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  content: string;
  defaultOpen?: boolean;
  index: number;
};

export default function AccordionSection({
  title,
  content,
  defaultOpen = false,
  index,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(26,26,46,0.10)",
        borderRadius: 20,
        boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
        marginBottom: 28,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "24px 32px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "#1a1a2e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: 10,
              background: "#fef3c7",
              border: "1px solid rgba(26,26,46,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {index + 1}
          </span>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
        </div>
        <ChevronDown
          size={22}
          style={{
            transition: "transform 0.25s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            minWidth: 22,
            color: "#a1a1aa",
          }}
        />
      </button>

      {/* Collapsible body */}
      <div
        style={{
          maxHeight: open ? 5000 : 0,
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease, opacity 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "0 32px 28px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <div
            className="chapter-content"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#3f3f46",
              paddingTop: 20,
            }}
          />
        </div>
      </div>
    </div>
  );
}
