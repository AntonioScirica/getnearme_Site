// Story teaser slide builder (1080×1920).
// Used by every PED template that has a `storyHook` in its slide_data.
// Shared by client (dashboard preview) and server (Puppeteer render).
//
// The rubric → color map is passed in by the caller so client and server can
// keep their own accent colors (they historically diverged). Defaults to the
// server variant.

import { GNM_ICON_SM, RUBRIC_STORY } from "./shared";

type RubricStoryMap = typeof RUBRIC_STORY;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function storyTeaserD(
  d: any,
  rubric: string,
  rubricMap: RubricStoryMap = RUBRIC_STORY
): string {
  const r = rubricMap[rubric] || rubricMap.mercato || RUBRIC_STORY.mercato;
  const borderStyle = r.shape === "sh-ring" ? `border-color:${r.hex}` : "";
  return `<div class="story">
    <div class="st-shape ${r.shape}" style="background:${r.hex};${borderStyle}"></div>
    <div class="st-badge" style="background:${r.hex}22;color:${r.hex};border:2px solid ${r.hex}44">${d.storyBadge || "NUOVO POST"}</div>
    <div class="st-hook">${d.storyHook || ""}<br><span class="${r.hl}">${d.storyHookHL || ""}</span></div>
    ${d.storySub ? `<div class="st-sub">${d.storySub}</div>` : ""}
    <div class="st-cta">
      <div class="st-cta-pill" style="background:${r.hex}">Post fuori ora!</div>
    </div>
    <div class="st-footer">${GNM_ICON_SM} GETNEARME.IT</div>
  </div>`;
}

// Keep the rubric map type exported for consumers that build their own map.
export type { RubricStoryMap };
