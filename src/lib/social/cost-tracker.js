import supabase from './supabase.js';

// Pricing per 1M tokens (USD) — June 2026
const ANTHROPIC_PRICING = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4 },
};

// Replicate pricing per image
const REPLICATE_PRICING = {
  'black-forest-labs/flux-1.1-pro': 0.04,
  'black-forest-labs/flux-schnell': 0.003,
};

/**
 * Log an Anthropic API call with cost calculation.
 * @param {string} model - Model name
 * @param {string} operation - What it was used for
 * @param {object} usage - { input_tokens, output_tokens } from response
 */
export async function trackAnthropicCall(model, operation, usage) {
  const pricing = ANTHROPIC_PRICING[model] || { input: 3, output: 15 };
  const inputCost = (usage.input_tokens || 0) * pricing.input / 1_000_000;
  const outputCost = (usage.output_tokens || 0) * pricing.output / 1_000_000;
  const totalCost = inputCost + outputCost;

  try {
    await supabase.from('api_usage').insert({
      service: 'anthropic',
      model,
      operation,
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      cost_usd: totalCost,
      metadata: { input_cost: inputCost, output_cost: outputCost },
    });
  } catch (err) {
    console.error('Cost tracking failed:', err.message);
  }

  return totalCost;
}

/**
 * Log a Replicate image generation call.
 * @param {string} model - Model name
 * @param {string} operation - What it was used for
 */
export async function trackReplicateCall(model, operation) {
  const cost = REPLICATE_PRICING[model] || 0.04;

  try {
    await supabase.from('api_usage').insert({
      service: 'replicate',
      model,
      operation,
      cost_usd: cost,
    });
  } catch (err) {
    console.error('Cost tracking failed:', err.message);
  }

  return cost;
}
