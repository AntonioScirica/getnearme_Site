"use client";
import { useEffect, useRef, useState } from "react";

export default function RevealBadge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={wrapperRef} style={{ display: "inline-block", position: "relative" }}>
      <span
        style={{
          ...style,
          display: "inline-block",
          clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
          transition: visible ? "clip-path 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
        }}
      >
        {children}
      </span>
    </span>
  );
}
