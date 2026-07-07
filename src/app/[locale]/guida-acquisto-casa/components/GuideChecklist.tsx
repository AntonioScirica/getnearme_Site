"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ListChecks } from "lucide-react";

type Props = {
  slug: string;
  items: string[];
  onCompletionChange?: (allDone: boolean) => void;
};

const STORAGE_PREFIX = "gnm_guide_cl_";

export default function GuideChecklist({
  slug,
  items,
  onCompletionChange,
}: Props) {
  const [checked, setChecked] = useState<boolean[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + slug);
      if (raw) {
        const saved: number[] = JSON.parse(raw);
        const arr = items.map((_, i) => saved.includes(i));
        setChecked(arr);
      } else {
        setChecked(items.map(() => false));
      }
    } catch {
      setChecked(items.map(() => false));
    }
    setMounted(true);
  }, [slug, items]);

  // Persist + notify parent
  const persist = useCallback(
    (next: boolean[]) => {
      try {
        const indices = next
          .map((v, i) => (v ? i : -1))
          .filter((i) => i >= 0);
        localStorage.setItem(
          STORAGE_PREFIX + slug,
          JSON.stringify(indices)
        );
        // Also update completed chapters list
        const allDone = next.every(Boolean);
        const completedRaw = localStorage.getItem("gnm_guide_completed");
        const completed: string[] = completedRaw
          ? JSON.parse(completedRaw)
          : [];
        if (allDone && !completed.includes(slug)) {
          completed.push(slug);
          localStorage.setItem(
            "gnm_guide_completed",
            JSON.stringify(completed)
          );
        } else if (!allDone && completed.includes(slug)) {
          localStorage.setItem(
            "gnm_guide_completed",
            JSON.stringify(completed.filter((s) => s !== slug))
          );
        }
        onCompletionChange?.(allDone);
      } catch {
        // localStorage full or unavailable
      }
    },
    [slug, onCompletionChange]
  );

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      persist(next);
      return next;
    });
  };

  if (!mounted || checked.length === 0) return null;

  const doneCount = checked.filter(Boolean).length;
  const allDone = doneCount === items.length;

  return (
    <div
      style={{
        background: allDone ? "#f0fdf4" : "#fff",
        border: `3px solid ${allDone ? "#16a34a" : "#1a1a2e"}`,
        borderRadius: 18,
        boxShadow: `6px 6px 0px ${allDone ? "#16a34a" : "#1a1a2e"}`,
        padding: "25px 29px",
        marginBottom: 25,
        transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <ListChecks size={22} color={allDone ? "#16a34a" : "#f59e0b"} />
          <span style={{ fontWeight: 800, fontSize: 16 }}>
            {allDone ? "Completato!" : "Checklist"}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: allDone ? "#16a34a" : "#71717a",
            background: allDone ? "#dcfce7" : "#f4f4f5",
            padding: "4px 11px",
            borderRadius: 7,
          }}
        >
          {doneCount}/{items.length}
        </span>
      </div>

      {/* Progress mini-bar */}
      <div
        style={{
          height: 5,
          background: "#e4e4e7",
          borderRadius: 3,
          marginBottom: 18,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(doneCount / items.length) * 100}%`,
            background: allDone ? "#16a34a" : "#f59e0b",
            borderRadius: 3,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
              padding: "9px 13px",
              background: checked[i] ? "#f0fdf4" : "#fafafa",
              border: `2px solid ${checked[i] ? "#bbf7d0" : "#e4e4e7"}`,
              borderRadius: 11,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
              color: "#1a1a2e",
              width: "100%",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                minWidth: 22,
                borderRadius: 6,
                border: `2px solid ${checked[i] ? "#16a34a" : "#d4d4d8"}`,
                background: checked[i] ? "#16a34a" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                marginTop: 1,
              }}
            >
              {checked[i] && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                fontWeight: 500,
                textDecoration: checked[i] ? "line-through" : "none",
                color: checked[i] ? "#71717a" : "#1a1a2e",
                transition: "color 0.2s",
              }}
            >
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
