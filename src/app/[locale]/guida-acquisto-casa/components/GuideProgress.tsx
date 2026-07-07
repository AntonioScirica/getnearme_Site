"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

type Props = {
  totalChapters: number;
  chapterSlugs: string[];
};

export default function GuideProgress({ totalChapters, chapterSlugs }: Props) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gnm_guide_completed");
      if (raw) {
        const parsed: string[] = JSON.parse(raw);
        // Only count slugs that actually exist
        setCompleted(parsed.filter((s) => chapterSlugs.includes(s)));
      }
    } catch {
      // ignore
    }
    setMounted(true);

    // Listen for storage changes from other tabs
    const handler = (e: StorageEvent) => {
      if (e.key === "gnm_guide_completed" && e.newValue) {
        try {
          const parsed: string[] = JSON.parse(e.newValue);
          setCompleted(parsed.filter((s) => chapterSlugs.includes(s)));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [chapterSlugs]);

  if (!mounted) return null;

  const count = completed.length;
  const pct = (count / totalChapters) * 100;
  const allDone = count === totalChapters;

  if (count === 0) return null;

  return (
    <div
      style={{
        maxWidth: 792,
        margin: "0 auto",
        padding: "0 22px 29px",
      }}
    >
      <div
        style={{
          background: allDone ? "#f0fdf4" : "#fff",
          border: `3px solid ${allDone ? "#16a34a" : "#1a1a2e"}`,
          borderRadius: 14,
          boxShadow: `4px 4px 0px ${allDone ? "#16a34a" : "#1a1a2e"}`,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          transition: "all 0.3s",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            borderRadius: 11,
            background: allDone ? "#dcfce7" : "#fef3c7",
            border: `2px solid ${allDone ? "#16a34a" : "#1a1a2e"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trophy size={22} color={allDone ? "#16a34a" : "#f59e0b"} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 7,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {allDone
                ? "Guida completata!"
                : "Il tuo avanzamento"}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: allDone ? "#16a34a" : "#71717a",
              }}
            >
              {count}/{totalChapters} capitoli
            </span>
          </div>
          <div
            style={{
              height: 7,
              background: "#e4e4e7",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: allDone
                  ? "#16a34a"
                  : "linear-gradient(90deg, #f59e0b, #f97316)",
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
