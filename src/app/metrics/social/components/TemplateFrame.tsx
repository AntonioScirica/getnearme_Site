// TemplateFrame — renders template HTML inside a scaled <iframe>.
// Uses blob URL instead of srcDoc for cross-browser CSS reliability.

"use client";

import { useEffect, useRef } from "react";
import { TEMPLATE_CSS } from "@/lib/social/video-stories/builders";

export function TemplateFrame({
  html,
  w,
  h,
  scale,
  css,
}: {
  html: string;
  w: number;
  h: number;
  scale: number;
  css?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cleanCss = (css || TEMPLATE_CSS).replace(/@import\s+url\([^)]+\);?\s*/g, "");
  const fullHtml = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"><style>${cleanCss}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    return () => URL.revokeObjectURL(url);
  }, [fullHtml]);

  return (
    <iframe
      ref={ref}
      style={{
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        border: "none",
        borderRadius: 12,
        pointerEvents: "none",
      }}
      title="template preview"
    />
  );
}
