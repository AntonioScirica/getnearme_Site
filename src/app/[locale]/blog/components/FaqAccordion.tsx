"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { question: string; answer: string };

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={index}
            style={{
              background: "#fff",
              border: "1px solid rgba(26,26,46,0.10)",
              borderRadius: 20,
              boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "20px 24px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "#1a1a2e",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{item.question}</span>
              <ChevronDown
                size={20}
                style={{
                  transition: "transform 0.25s ease",
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  minWidth: 20,
                  color: "#a1a1aa",
                }}
              />
            </button>
            <div
              style={{
                maxHeight: open ? 1000 : 0,
                opacity: open ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease, opacity 0.2s ease",
              }}
            >
              <p
                style={{
                  margin: 0,
                  padding: "0 24px 20px",
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#3f3f46",
                }}
              >
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
