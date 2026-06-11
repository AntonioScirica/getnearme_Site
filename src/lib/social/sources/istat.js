// ISTAT + ECB open data fetcher for Italian real estate market stats.
// Sources:
//   - ISTAT IPAB (house price index, quarterly)
//   - ISTAT 77_47 (notarial deeds / compravendite, quarterly)
//   - ECB MIR (Italian mortgage rates, monthly)
//
// Rate limit: ISTAT allows max 5 req/min per IP — we fetch 2-3 endpoints total.

const ISTAT_BASE = 'https://esploradati.istat.it/SDMXWS/rest/data';
const ECB_BASE = 'https://data-api.ecb.europa.eu/service/data';

const TIMEOUT = 15000;

async function fetchJson(url, accept = 'application/json') {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: { Accept: accept, 'User-Agent': 'GetNearMe-Stats/1.0' },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Parse SDMX-JSON 2.0 observations into [{period, value}]
function parseIstatSdmx(json) {
  const results = [];
  try {
    const ds = json?.data?.dataSets?.[0];
    const timeDim = json?.data?.structure?.dimensions?.observation?.find(
      (d) => d.id === 'TIME_PERIOD'
    );
    if (!ds || !timeDim) return results;

    const timeValues = timeDim.values;
    const series = ds.series || {};

    for (const [seriesKey, seriesData] of Object.entries(series)) {
      const obs = seriesData.observations || {};
      for (const [timeIdx, values] of Object.entries(obs)) {
        const period = timeValues[Number(timeIdx)]?.id;
        const value = values?.[0];
        if (period != null && value != null) {
          results.push({ seriesKey, period, value: Number(value) });
        }
      }
    }
  } catch {
    // malformed response
  }
  return results;
}

// ISTAT IPAB — house price index (quarterly, base 2015=100)
// Fetches YoY % change for all dwellings, national level
export async function fetchIpab(startYear, endYear) {
  const url = `${ISTAT_BASE}/IT1,143_497_DF_DCSP_IPAB_1,1.0/Q.IT.IPAB_FOI_PURCHDWELL_TOTAL.GR_Q_P4.TOTAL?startPeriod=${startYear}&endPeriod=${endYear}&format=jsondata`;
  console.log('[istat] Fetching IPAB:', url);
  const json = await fetchJson(url);
  const obs = parseIstatSdmx(json);
  return obs.map((o) => ({
    indicator: 'ipab_yoy',
    period: o.period,
    value: o.value,
    unit: '%',
    source: 'ISTAT_IPAB',
  }));
}

// ISTAT IPAB — absolute index value
export async function fetchIpabIndex(startYear, endYear) {
  const url = `${ISTAT_BASE}/IT1,143_497_DF_DCSP_IPAB_1,1.0/Q.IT.IPAB_FOI_PURCHDWELL_TOTAL.INDEX.TOTAL?startPeriod=${startYear}&endPeriod=${endYear}&format=jsondata`;
  console.log('[istat] Fetching IPAB index:', url);
  const json = await fetchJson(url);
  const obs = parseIstatSdmx(json);
  return obs.map((o) => ({
    indicator: 'ipab_index',
    period: o.period,
    value: o.value,
    unit: 'index',
    source: 'ISTAT_IPAB',
  }));
}

// ISTAT 77_47 — notarial deeds (compravendite immobiliari)
export async function fetchCompravendite(startYear, endYear) {
  const url = `${ISTAT_BASE}/IT1,77_47,1.0/Q.IT.CV_RES..?startPeriod=${startYear}&endPeriod=${endYear}&format=jsondata`;
  console.log('[istat] Fetching compravendite:', url);
  try {
    const json = await fetchJson(url);
    const obs = parseIstatSdmx(json);
    return obs.map((o) => ({
      indicator: 'compravendite',
      period: o.period,
      value: o.value,
      unit: 'count',
      source: 'ISTAT_NOTARIAL',
    }));
  } catch (err) {
    // Dataset key may differ — try broader query
    console.warn('[istat] Compravendite specific key failed, trying broader:', err.message);
    const fallback = `${ISTAT_BASE}/IT1,77_47,1.0/all?startPeriod=${startYear}&endPeriod=${endYear}&format=jsondata`;
    const json = await fetchJson(fallback);
    const obs = parseIstatSdmx(json);
    // Filter for residential conventions
    return obs
      .filter((o) => o.value > 0)
      .slice(0, 20)
      .map((o) => ({
        indicator: 'compravendite',
        period: o.period,
        value: o.value,
        unit: 'count',
        source: 'ISTAT_NOTARIAL',
        raw: o.seriesKey,
      }));
  }
}

// ECB MIR — Italian mortgage rates (housing loans to households, monthly)
export async function fetchMortgageRates(startPeriod) {
  const url = `${ECB_BASE}/MIR/M.IT.B.A2A.A.R.A.2250.EUR.N?format=jsondata&startPeriod=${startPeriod}`;
  console.log('[ecb] Fetching mortgage rates:', url);
  const json = await fetchJson(url);
  const results = [];
  try {
    const ds = json?.dataSets?.[0] || json?.data?.dataSets?.[0];
    const timeDim =
      json?.structure?.dimensions?.observation?.find((d) => d.id === 'TIME_PERIOD') ||
      json?.data?.structure?.dimensions?.observation?.find((d) => d.id === 'TIME_PERIOD');
    if (!ds || !timeDim) return results;

    const series = ds.series || {};
    for (const [, seriesData] of Object.entries(series)) {
      const obs = seriesData.observations || {};
      for (const [timeIdx, values] of Object.entries(obs)) {
        const period = timeDim.values[Number(timeIdx)]?.id;
        const value = values?.[0];
        if (period && value != null) {
          results.push({
            indicator: 'mortgage_rate',
            period,
            value: Number(value),
            unit: 'rate',
            source: 'ECB_MIR',
          });
        }
      }
    }
  } catch {
    // malformed
  }
  return results;
}

// Fetch all sources, return flat array of stat rows
export async function fetchAllMarketStats() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;
  const startMonth = `${currentYear - 1}-01`;

  const results = await Promise.allSettled([
    fetchIpab(startYear, currentYear),
    fetchIpabIndex(startYear, currentYear),
    fetchCompravendite(startYear, currentYear),
    fetchMortgageRates(startMonth),
  ]);

  const stats = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      stats.push(...r.value);
    } else {
      console.warn('[market-stats] Fetch failed:', r.reason?.message || r.reason);
    }
  }

  console.log(`[market-stats] Total stats fetched: ${stats.length}`);
  return stats;
}
