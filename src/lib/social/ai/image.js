import Replicate from 'replicate';
import Anthropic from '@anthropic-ai/sdk';
import { trackAnthropicCall, trackReplicateCall } from '../cost-tracker.js';

// Lazy init — ensures dotenv has loaded before we read process.env
let _replicate, _anthropic;
function getReplicate() {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  return _replicate;
}
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const FLUX_FALLBACK_MODEL = 'black-forest-labs/flux-schnell';

/**
 * Use Claude to generate a highly specific image prompt from article content.
 * Returns a visual scene description tailored to the exact story.
 */
async function buildImagePrompt(title, body) {
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a prompt engineer for Flux image generation. Given this news article, write a SINGLE visual scene description that captures the SPECIFIC story — not a generic concept.

ARTICLE TITLE: ${title}
ARTICLE BODY: ${body}

RULES:
- Describe ONE specific photographic scene with concrete visual elements
- Reference the actual subject: if it's about layoffs, show empty desks; if it's about a 3D AI tool, show a 3D object materializing; if it's about Wikipedia, show encyclopedia volumes
- Include specific objects, materials, lighting, setting
- NEVER mention text, words, letters, logos, labels, writing, captions, headlines, typography, fonts, or any written content
- NEVER mention UI, screens showing text, monitors with readable content
- Style: editorial photograph, shallow depth of field, natural lighting, magazine quality
- Max 80 words

Respond with ONLY the prompt text, nothing else.`
      }],
    });
    await trackAnthropicCall('claude-haiku-4-5-20251001', 'image_prompt', response.usage);
    const prompt = response.content[0].text.trim();
    // Safety: append anti-text instruction
    return `${prompt}. Absolutely no text, no letters, no words, no numbers, no writing, no logos, no watermarks, no captions, no labels anywhere in the image. Pure visual scene only.`;
  } catch (err) {
    console.error(`Claude prompt generation failed: ${err.message}`);
    // Fallback: basic prompt from article context
    const context = `${title}. ${body}`.slice(0, 200);
    return `Editorial photograph visually representing: ${context}. Shallow depth of field, natural lighting, minimalist composition. Absolutely no text, no letters, no words, no numbers, no writing, no logos, no watermarks anywhere in the image.`;
  }
}

/**
 * Generate an image for a news slide using Flux via Replicate.
 * Returns the image URL (hosted on Replicate CDN).
 * renderer.js will download and convert to base64 before Puppeteer.
 *
 * @param {string} title - News headline
 * @param {string} body - News body text
 * @returns {string|null} Image URL or null on failure
 */
function extractUrl(output) {
  let url;
  if (typeof output === 'string' && output.startsWith('http')) return output;
  if (output?.url && typeof output.url === 'function') {
    url = output.url().href || output.toString();
  } else if (output?.url && typeof output.url === 'string') {
    url = output.url;
  } else if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
    url = first?.url ? (typeof first.url === 'function' ? first.url().href : first.url) : String(first);
  } else {
    url = String(output);
  }
  if (url && url.startsWith('http')) return url;
  throw new Error(`Unexpected output format: ${JSON.stringify(output)?.slice(0, 200)}`);
}

async function runFlux(prompt, model = FLUX_MODEL) {
  const input = model === FLUX_FALLBACK_MODEL
    ? { prompt, width: 1024, height: 590, num_inference_steps: 4, output_format: 'jpg' }
    : { prompt, width: 1024, height: 590, num_inference_steps: 25, guidance: 3.5, output_format: 'jpg', output_quality: 85 };

  const output = await getReplicate().run(model, { input });
  const url = extractUrl(output);
  await trackReplicateCall(model, 'flux_generate');
  return url;
}

export async function generateNewsImage(title, body) {
  const prompt = await buildImagePrompt(title, body);

  // Try Flux Pro 3 times with increasing backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await runFlux(prompt, FLUX_MODEL);
    } catch (err) {
      console.error(`Flux Pro attempt ${attempt + 1}/3 failed: ${err.message}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }

  // Fallback: Flux Schnell (faster, more reliable, lower quality)
  console.log('Falling back to Flux Schnell...');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await runFlux(prompt, FLUX_FALLBACK_MODEL);
    } catch (err) {
      console.error(`Flux Schnell attempt ${attempt + 1}/2 failed: ${err.message}`);
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000));
    }
  }

  return null;
}

/**
 * Generate images for all news_item slides that don't have an image_url.
 * Only runs on slides missing images — articles with their own image are skipped.
 * Runs in parallel with concurrency limit.
 */
export async function generateSlideImages(slides) {
  const MAX_CONCURRENT = 3;
  const needsImage = slides.filter(
    (s) => (s.type === 'news_item' || s.type === 'content') && !s.image_url
  );

  if (needsImage.length === 0) {
    console.log('All slides have images, skipping AI generation.');
    return;
  }

  console.log(`Generating AI images for ${needsImage.length} slides missing images...`);

  // Process in batches
  for (let i = 0; i < needsImage.length; i += MAX_CONCURRENT) {
    const batch = needsImage.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(
      batch.map((slide) => generateNewsImage(slide.title || slide.headline, slide.body))
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        batch[idx].image_url = result.value;
        console.log(`  ✓ Image for: ${batch[idx].title || batch[idx].headline}`);
      } else {
        console.log(`  ✗ Failed for: ${batch[idx].title || batch[idx].headline}`);
      }
    });
  }
}
