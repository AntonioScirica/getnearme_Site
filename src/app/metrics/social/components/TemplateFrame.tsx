// TemplateFrame — renders template HTML inside a scaled <iframe srcDoc>.
// Shared preview primitive used by every template preview in the dashboard
// and the standalone /templates page.

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
  const srcDoc = `<!DOCTYPE html><html><head><style>${css || TEMPLATE_CSS}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;
  return (
    <iframe
      srcDoc={srcDoc}
      style={{
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        border: "none",
        borderRadius: 12,
        pointerEvents: "none",
      }}
      sandbox="allow-same-origin"
      title="template preview"
    />
  );
}
