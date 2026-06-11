import supabase from '../supabase.js';
import { fetchAllMarketStats } from '../sources/istat.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountId = req.query.account || 'getnearme';

  try {
    const stats = await fetchAllMarketStats();

    if (stats.length === 0) {
      return res.json({ ok: true, message: 'No stats returned from APIs', inserted: 0 });
    }

    let inserted = 0;
    let skipped = 0;

    for (const stat of stats) {
      const row = {
        account_id: accountId,
        indicator: stat.indicator,
        period: stat.period,
        region: 'IT',
        value: stat.value,
        unit: stat.unit,
        source: stat.source,
        raw_data: stat.raw ? { seriesKey: stat.raw } : {},
        fetched_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('market_stats')
        .upsert(row, { onConflict: 'indicator,period,region' });

      if (error) {
        console.warn(`[fetch-stats] upsert error for ${stat.indicator} ${stat.period}:`, error.message);
        skipped++;
      } else {
        inserted++;
      }
    }

    // Compute prev_value for the latest entries (for delta display)
    await computePrevValues(accountId);

    console.log(`[fetch-stats] Done: ${inserted} upserted, ${skipped} skipped`);
    return res.json({ ok: true, inserted, skipped, total: stats.length });
  } catch (err) {
    console.error('[fetch-stats] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function computePrevValues(accountId) {
  // For each indicator, set prev_value to the value of the previous period
  for (const indicator of ['ipab_yoy', 'ipab_index', 'compravendite', 'mortgage_rate']) {
    const { data: rows } = await supabase
      .from('market_stats')
      .select('id, period, value')
      .eq('account_id', accountId)
      .eq('indicator', indicator)
      .eq('region', 'IT')
      .order('period', { ascending: true });

    if (!rows || rows.length < 2) continue;

    for (let i = 1; i < rows.length; i++) {
      await supabase
        .from('market_stats')
        .update({ prev_value: rows[i - 1].value })
        .eq('id', rows[i].id);
    }
  }
}
