// CLI: render a before/after slider reel MP4 from the canonical template.
// Usage: node scripts/render-slider.mjs <beforeUrl> <afterUrl> [outPath]
import { renderSliderVideo } from '../src/lib/social/video-stories/slider-video.mjs';
const [beforeUrl, afterUrl, outPath = '/tmp/slider.mp4'] = process.argv.slice(2);
if (!beforeUrl || !afterUrl) { console.error('need <beforeUrl> <afterUrl>'); process.exit(1); }
await renderSliderVideo({ beforeUrl, afterUrl, outPath });
console.log('done →', outPath);
