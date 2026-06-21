"use client";

// THROWAWAY preview — renders a realistic Monday (2026-06-22) editorial day
// using the REAL PED builders + PED_CSS, so we can eyeball the finished posts
// exactly as the pipeline would render them. Delete after review.
//
// Monday rubric = education → ped-carosello-edu. Plus the daily tip (ped-tip).
// Video reel is intentionally skipped (post templates only).

import { useEffect, useRef } from "react";
import {
  previewsForTopic,
  setPreviewCss,
  type PedTopic,
  type TplPreview,
} from "@/lib/social/ped/builders/index";
import { PED_CSS, STORY_CSS } from "@/lib/social/ped/client-css";

setPreviewCss(PED_CSS, STORY_CSS);

// ── Monday content (authored, realistic — target: real estate agents) ──

const EDU_TOPIC: PedTopic = {
  template: "ped-carosello-edu",
  rubric: "educativo",
  title: "5 cose da preparare prima di pubblicare un annuncio",
  slide_data: {
    num: "5",
    title: "cose da preparare prima di pubblicare",
    titleHL: "un annuncio che converte",
    items: [
      {
        title: "Analisi della zona",
        text: "Il cliente compra il quartiere quanto la casa. Mostra servizi, trasporti e scuole con dati reali, non con aggettivi.",
        tip: "Con GetNearMe generi la mappa servizi della zona in un clic.",
      },
      {
        title: "Prezzo giustificato dai dati OMI",
        text: "Un prezzo senza contesto sembra arbitrario. Affianca 2-3 comparabili e il valore OMI della zona.",
        tip: "Esporti il confronto prezzi direttamente dall'estensione.",
      },
      {
        title: "Punteggio dell'immobile",
        text: "Un voto sintetico su luminosità, stato e posizione aiuta il cliente a capire il valore in 5 secondi.",
        tip: "Il punteggio GetNearMe è calcolato in automatico.",
      },
      {
        title: "Staging delle stanze vuote",
        text: "Una stanza spoglia non vende. Il virtual staging fa immaginare il potenziale senza ristrutturare nulla.",
        tip: "Arredi le stanze vuote con lo staging AI in un minuto.",
      },
      {
        title: "Report PDF professionale",
        text: "A fine visita lascia un report brandizzato: resti in mente e dimostri metodo, non improvvisazione.",
        tip: "Generi il PDF pronto da consegnare al cliente.",
      },
    ],
    // CTA slide
    ctaKicker: "Tutti e 5 i punti, da un solo annuncio",
    ctaTitle: "GetNearMe trasforma l'annuncio in report, analisi zona e staging",
    ctaHL: "in pochi clic",
    badgeColor: "blue",
    ctaPill: "DEMO",
    ctaSub: "Commenta DEMO e ricevi in DM il link per la prova gratuita.",
    // Story teaser
    storyBadge: "NUOVO POST",
    storyHook: "5 cose che il tuo annuncio",
    storyHookHL: "non sta dicendo",
    storySub: "La checklist per chi pubblica oggi.",
  },
};

const TIP_TOPIC: PedTopic = {
  template: "ped-tip",
  rubric: "tip",
  title: "Porta i dati OMI al primo appuntamento",
  slide_data: {
    tipNum: "1",
    scenario: "Acquisizione incarico",
    title: "Porta i dati OMI",
    titleHL: "al primo appuntamento",
    body: "Il proprietario sopravvaluta quasi sempre. <strong>Arriva con il valore OMI della zona e 3 comparabili</strong>: la trattativa sul prezzo parte dai numeri, non dalle opinioni.",
    how: "Apri la zona su GetNearMe, esporta il confronto e portalo stampato.",
  },
};

const DAY = [
  { slot: "09:00", label: "Post 1 — Rubrica Educativo (carosello)", topic: EDU_TOPIC },
  { slot: "20:00", label: "Post 2 — Tip del giorno", topic: TIP_TOPIC },
];

function Frame({ html, w, h, scale, css }: { html: string; w: number; h: number; scale: number; css?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cleanCss = (css || "").replace(/@import\s+url\([^)]+\);?\s*/g, "");
  const fullHtml = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"><style>${cleanCss}</style></head><body style="margin:0;overflow:hidden">${html}</body></html>`;
  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    const url = URL.createObjectURL(new Blob([fullHtml], { type: "text/html" }));
    f.src = url;
    return () => URL.revokeObjectURL(url);
  }, [fullHtml]);
  return (
    <iframe
      ref={ref}
      style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left", border: "none", borderRadius: 16, pointerEvents: "none" }}
      title="slide"
    />
  );
}

export default function MondayPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0d0f14] text-gray-200 px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-100">Lunedì 22 giugno 2026 — giornata di post</h1>
        <p className="text-sm text-gray-500 mt-1">Render reale dei builder PED. Rubrica del lunedì: Educativo. Video escluso.</p>

        <div className="mt-10 space-y-14">
          {DAY.map(({ slot, label, topic }) => {
            const previews = (previewsForTopic(topic) || []) as TplPreview[];
            return (
              <div key={label}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-xs px-2 py-1 rounded bg-white/[0.06] text-emerald-400">{slot}</span>
                  <h2 className="text-base font-semibold text-gray-200">{label}</h2>
                  <span className="font-mono text-[10px] text-gray-600">{topic.template} · {previews.length} slide</span>
                </div>
                <div className="flex gap-5 overflow-x-auto pb-4">
                  {previews.map((p) => (
                    <div key={p.label} className="shrink-0 flex flex-col items-center">
                      <p className="font-mono text-[10px] text-gray-500 mb-2">{p.label}</p>
                      <div style={{ width: p.frameW * 1.4, height: p.frameH * 1.4, borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.5)" }}>
                        <Frame html={p.html()} w={p.w} h={p.h} scale={p.scale * 1.4} css={p.css} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
